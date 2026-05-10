import Link from 'next/link';
import { sql } from '@/lib/db';
import { Masthead } from '@/components/Masthead';
import { Footer } from '@/components/Footer';
import { ActivityFeed, FeedStop, FeedChainStops } from '@/components/ActivityFeed';

// Don't cache — chains move
export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getFeed(): Promise<{ entries: FeedStop[]; chainsForMap: Record<number, FeedChainStops> }> {
  // Recent stops, joined with their chain
  const recentStops = (await sql`
    SELECT
      s.id, s.chain_id, s.name, s.city, s.lat, s.lng, s.note,
      s.added_what, s.ended_chain, s.created_at,
      c.batch, c.number
    FROM stops s
    JOIN chains c ON c.id = s.chain_id
    ORDER BY s.created_at DESC
    LIMIT 12
  `) as unknown as FeedStop[];

  // Find chains active >60 days ago with no recent stops — show them as dormant
  const dormant = (await sql`
    SELECT
      c.id AS chain_id, c.batch, c.number,
      c.starter_city AS city,
      c.created_at AS chain_created,
      MAX(s.created_at) AS last_stop_at
    FROM chains c
    LEFT JOIN stops s ON s.chain_id = c.id
    WHERE c.status = 'active'
    GROUP BY c.id
    HAVING (
      (MAX(s.created_at) IS NULL AND c.created_at < NOW() - INTERVAL '60 days')
      OR (MAX(s.created_at) < NOW() - INTERVAL '60 days')
    )
    ORDER BY COALESCE(MAX(s.created_at), c.created_at) DESC
    LIMIT 4
  `) as unknown as { chain_id: number; batch: string; number: number; city: string | null; chain_created: string; last_stop_at: string | null }[];

  // For each dormant chain, show last known city
  const dormantEntries: FeedStop[] = await Promise.all(
    dormant.map(async (d) => {
      const lastStop = (await sql`
        SELECT id, chain_id, name, city, lat, lng, note, added_what, ended_chain, created_at
        FROM stops
        WHERE chain_id = ${d.chain_id}
        ORDER BY created_at DESC
        LIMIT 1
      `) as unknown as Array<Omit<FeedStop, 'batch' | 'number'>>;
      const stop = lastStop[0];
      const fallbackCity = d.city || 'somewhere';
      const created = stop?.created_at || d.last_stop_at || new Date().toISOString();
      return {
        id: stop?.id ?? -d.chain_id,
        chain_id: d.chain_id,
        batch: d.batch,
        number: d.number,
        name: null,
        city: stop?.city || fallbackCity,
        lat: stop?.lat ?? null,
        lng: stop?.lng ?? null,
        note: null,
        added_what: null,
        ended_chain: false,
        created_at: created,
        is_dormant: true,
      };
    })
  );

  // Combine and dedupe (don't show a chain in active feed and dormant feed)
  const activeChainIds = new Set(recentStops.map(s => s.chain_id));
  const dormantFiltered = dormantEntries.filter(d => !activeChainIds.has(d.chain_id));
  const entries = [...recentStops, ...dormantFiltered];

  // Build chainsForMap: all stops for chains that appear in the feed
  const chainIds = Array.from(new Set(entries.map(e => e.chain_id)));
  const chainsForMap: Record<number, FeedChainStops> = {};

  if (chainIds.length > 0) {
    const allStops = (await sql`
      SELECT s.chain_id, s.city, s.lat, s.lng, s.created_at, s.ended_chain
      FROM stops s
      WHERE s.chain_id = ANY(${chainIds}::int[])
      ORDER BY s.created_at ASC
    `) as unknown as Array<{
      chain_id: number;
      city: string;
      lat: number | null;
      lng: number | null;
      created_at: string;
      ended_chain: boolean;
    }>;

    // Get chain metadata so we can include the starter as the first point
    const chainMeta = (await sql`
      SELECT id, batch, number, starter_city, starter_lat, starter_lng, created_at
      FROM chains
      WHERE id = ANY(${chainIds}::int[])
    `) as unknown as Array<{
      id: number; batch: string; number: number;
      starter_city: string | null; starter_lat: number | null; starter_lng: number | null;
      created_at: string;
    }>;

    for (const c of chainMeta) {
      const stops: FeedChainStops['stops'] = [];
      // Starter as first point if known
      if (c.starter_city && c.starter_lat !== null && c.starter_lng !== null) {
        stops.push({
          city: c.starter_city,
          lat: c.starter_lat,
          lng: c.starter_lng,
          created_at: c.created_at,
          ended_chain: false,
        });
      }
      // Real stops
      for (const s of allStops.filter(x => x.chain_id === c.id)) {
        stops.push({
          city: s.city,
          lat: s.lat,
          lng: s.lng,
          created_at: s.created_at,
          ended_chain: s.ended_chain,
        });
      }
      chainsForMap[c.id] = { id: c.id, batch: c.batch, number: c.number, stops };
    }
  }

  return { entries, chainsForMap };
}

async function getCounts() {
  const result = (await sql`
    SELECT
      (SELECT COUNT(*) FROM chains WHERE status = 'active') AS active_chains,
      (SELECT COUNT(*) FROM stops) AS total_stops
  `) as unknown as Array<{ active_chains: string; total_stops: string }>;
  return {
    activeChains: parseInt(result[0]?.active_chains || '0', 10),
    totalStops: parseInt(result[0]?.total_stops || '0', 10),
  };
}

export default async function Home() {
  const [{ entries, chainsForMap }, counts] = await Promise.all([getFeed(), getCounts()]);

  return (
    <div className="wrap">
      <Masthead />

      <ActivityFeed entries={entries} chainsForMap={chainsForMap} />

      <section className="prose">
        <span className="note-head">so, what is this?</span>
        <p>
          People put money, art, a book, a letter — whatever feels right — into a package
          and send it out into the world. If the person who finds it needs it, they keep it.
          If they don&apos;t, they add something of their own and pass it on.
        </p>
        <p>
          Each package carries a card with a code on it. When you receive one, you can come
          here and log where it landed, and read where it&apos;s been. You don&apos;t have to share
          your name. You don&apos;t have to say much. The point is just that it traveled, and
          someone was thinking of someone else along the way.
        </p>
      </section>

      <section className="steps">
        <div className="head">how it works</div>
        <div className="step"><div className="num">1.</div><div className="text">You receive a small package with a card inside.</div></div>
        <div className="step"><div className="num">2.</div><div className="text">If you need what&apos;s in it, take it with our love.</div></div>
        <div className="step"><div className="num">3.</div><div className="text">If you don&apos;t, add something of your own and send it onward.</div></div>
        <div className="step"><div className="num">4.</div><div className="text">Either way, come back here and log where it landed.</div></div>
      </section>

      <section className="start-card">
        <div className="scrawl">your turn?</div>
        <h3>Start a chain.</h3>
        <p>
          Pick something to give. We&apos;ll print you a small card with a one-time code to tuck inside.
          The rest is up to whoever finds it.
        </p>
        <div className="actions">
          <Link href="/start" className="primary">start a chain →</Link>
          {counts.activeChains > 0 && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ink-faded)', letterSpacing: '0.06em' }}>
              {counts.activeChains} {counts.activeChains === 1 ? 'chain' : 'chains'} in motion · {counts.totalStops} {counts.totalStops === 1 ? 'stop' : 'stops'} logged
            </span>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
