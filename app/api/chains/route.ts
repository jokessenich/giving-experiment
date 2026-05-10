import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { generateSecretCode, MUSHROOM_BATCHES } from '@/lib/wordlists';
import { geocode } from '@/lib/geocode';

export async function POST(req: NextRequest) {
  let body: {
    batch?: string;
    starter_name?: string | null;
    starter_city?: string | null;
    starter_note?: string | null;
    admin_token?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid request' }, { status: 400 });
  }

  // Auth: while we're small, require the admin token to start chains.
  if (!process.env.ADMIN_TOKEN || body.admin_token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'that passphrase isn\u2019t right.' }, { status: 401 });
  }

  // Validate batch
  const batch = (body.batch || '').trim().toLowerCase();
  if (!MUSHROOM_BATCHES.includes(batch as typeof MUSHROOM_BATCHES[number])) {
    return NextResponse.json({ error: 'unknown batch.' }, { status: 400 });
  }

  // Generate secret code, retrying if collision
  let secret_code: string | null = null;
  for (let i = 0; i < 8; i++) {
    const candidate = generateSecretCode();
    const exists = await sql`SELECT 1 FROM chains WHERE secret_code = ${candidate} LIMIT 1`;
    if ((exists as unknown as Array<unknown>).length === 0) {
      secret_code = candidate;
      break;
    }
  }
  if (!secret_code) {
    return NextResponse.json({ error: 'couldn\u2019t generate a unique code, try again.' }, { status: 500 });
  }

  // Determine next number for this batch
  const maxResult = (await sql`
    SELECT COALESCE(MAX(number), 0) AS max_num FROM chains WHERE batch = ${batch}
  `) as unknown as Array<{ max_num: number }>;
  const nextNumber = (maxResult[0]?.max_num ?? 0) + 1;

  // Geocode the starter city if provided (best-effort, non-blocking on failure)
  let starter_lat: number | null = null;
  let starter_lng: number | null = null;
  let starter_city: string | null = body.starter_city?.trim() || null;
  if (starter_city) {
    const g = await geocode(starter_city);
    if (g) {
      starter_lat = g.lat;
      starter_lng = g.lng;
      starter_city = g.city;
    }
  }

  // Insert chain
  const inserted = (await sql`
    INSERT INTO chains (batch, number, secret_code, starter_name, starter_note, starter_city, starter_lat, starter_lng)
    VALUES (
      ${batch},
      ${nextNumber},
      ${secret_code},
      ${body.starter_name?.trim() || null},
      ${body.starter_note?.trim() || null},
      ${starter_city},
      ${starter_lat},
      ${starter_lng}
    )
    RETURNING id, batch, number, secret_code
  `) as unknown as Array<{ id: number; batch: string; number: number; secret_code: string }>;

  const chain = inserted[0];
  const origin = req.headers.get('origin') || `https://${req.headers.get('host')}`;
  const url = `${origin}/c/${encodeURIComponent(chain.batch)}/${chain.number}`;

  return NextResponse.json({
    batch: chain.batch,
    number: chain.number,
    secret_code: chain.secret_code,
    url,
  });
}
