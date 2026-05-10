import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { normalizeCode } from '@/lib/wordlists';
import { geocode } from '@/lib/geocode';
import { createHash } from 'node:crypto';

// Rate limit: at most 20 attempts per IP per hour, and at most 5 failed in a row.
const MAX_ATTEMPTS_PER_HOUR = 20;
const MAX_RECENT_FAILED = 5;

function hashIp(ip: string): string {
  return createHash('sha256').update(ip + (process.env.ADMIN_TOKEN || 'salt')).digest('hex').slice(0, 32);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const ip_hash = hashIp(ip);

  let body: {
    batch?: string;
    number?: number;
    code?: string;
    name?: string | null;
    city?: string;
    note?: string | null;
    added_what?: string | null;
    ended_chain?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  // Rate limit check
  const recent = (await sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE NOT succeeded AND created_at > NOW() - INTERVAL '15 minutes') AS recent_failed
    FROM log_attempts
    WHERE ip_hash = ${ip_hash}
      AND created_at > NOW() - INTERVAL '1 hour'
  `) as unknown as Array<{ total: string; recent_failed: string }>;

  const totalRecent = parseInt(recent[0]?.total || '0', 10);
  const failedRecent = parseInt(recent[0]?.recent_failed || '0', 10);

  if (totalRecent >= MAX_ATTEMPTS_PER_HOUR || failedRecent >= MAX_RECENT_FAILED) {
    return NextResponse.json({ error: 'too many attempts. please try again in a bit.' }, { status: 429 });
  }

  // Validate input
  if (!body.batch || typeof body.number !== 'number' || !body.code || !body.city?.trim()) {
    await sql`INSERT INTO log_attempts (ip_hash, succeeded) VALUES (${ip_hash}, FALSE)`;
    return NextResponse.json({ error: 'please fill in your code and where you are.' }, { status: 400 });
  }

  // Length guards
  if (body.note && body.note.length > 500) {
    return NextResponse.json({ error: 'the note is a bit long — try 500 characters.' }, { status: 400 });
  }
  if (body.added_what && body.added_what.length > 200) {
    return NextResponse.json({ error: 'shorten what you added a touch.' }, { status: 400 });
  }
  if (body.name && body.name.length > 60) {
    return NextResponse.json({ error: 'name is a bit long.' }, { status: 400 });
  }
  if (body.city.length > 100) {
    return NextResponse.json({ error: 'city is a bit long.' }, { status: 400 });
  }

  // Look up the chain by batch + number
  const chains = (await sql`
    SELECT id, secret_code, status
    FROM chains
    WHERE batch = ${body.batch.toLowerCase()} AND number = ${body.number}
    LIMIT 1
  `) as unknown as Array<{ id: number; secret_code: string; status: string }>;

  if (chains.length === 0) {
    await sql`INSERT INTO log_attempts (ip_hash, succeeded) VALUES (${ip_hash}, FALSE)`;
    return NextResponse.json({ error: 'we couldn\u2019t find that chain.' }, { status: 404 });
  }

  const chain = chains[0];

  if (chain.status === 'ended') {
    return NextResponse.json({ error: 'this chain has already ended.' }, { status: 400 });
  }

  // Validate the code
  const normalizedInput = normalizeCode(body.code);
  if (normalizedInput !== chain.secret_code) {
    await sql`INSERT INTO log_attempts (ip_hash, succeeded) VALUES (${ip_hash}, FALSE)`;
    return NextResponse.json({ error: 'that code doesn\u2019t match this chain.' }, { status: 401 });
  }

  // Geocode the city (best-effort)
  let lat: number | null = null;
  let lng: number | null = null;
  let cityNormalized = body.city.trim();
  const g = await geocode(cityNormalized);
  if (g) {
    lat = g.lat;
    lng = g.lng;
    cityNormalized = g.city;
  }

  // Insert the stop
  await sql`
    INSERT INTO stops (chain_id, name, city, lat, lng, note, added_what, ended_chain)
    VALUES (
      ${chain.id},
      ${body.name?.trim() || null},
      ${cityNormalized},
      ${lat},
      ${lng},
      ${body.note?.trim() || null},
      ${body.added_what?.trim() || null},
      ${body.ended_chain === true}
    )
  `;

  // If they ended the chain, mark it
  if (body.ended_chain === true) {
    await sql`UPDATE chains SET status = 'ended' WHERE id = ${chain.id}`;
  }

  await sql`INSERT INTO log_attempts (ip_hash, succeeded) VALUES (${ip_hash}, TRUE)`;

  return NextResponse.json({ ok: true });
}
