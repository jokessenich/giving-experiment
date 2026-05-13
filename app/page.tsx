import Link from 'next/link';
import { sql } from '@/lib/db';
import { Masthead } from '@/components/Masthead';
import { Footer } from '@/components/Footer';
import { ActivityFeed, FeedStop } from '@/components/ActivityFeed';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getFeed(): Promise<{ entries: FeedStop[]; totalStops: number; activeChains: number }> {
  const recentStops = (await sql`
    SELECT
      s.id, s.chain_id, s.name, s.place, s.city, s.lat, s.lng, s.note,
      s.added_what, s.amount_added, s.ended_chain, s.kept_for, s.created_at,
      c.batch, c.number
    FROM stops s
    JOIN chains c ON c.id = s.chain_id
    ORDER BY s.created_at DESC
    LIMIT 12
  `) as unknown as FeedStop[];

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

  const dormantEntries: FeedStop[] = await Promise.all(
    dormant.map(async (d) => {
      const lastStop = (await sql`
        SELECT id, city, lat, lng, created_at
        FROM stops
        WHERE chain_id = ${d.chain_id}
        ORDER BY created_at DESC
        LIMIT 1
      `) as unknown as Array<{ id: number; city: string; lat: number | null; lng: number | null; created_at: string }>;
      const stop = lastStop[0];
      const fallbackCity = d.city || 'somewhere';
      const created = stop?.created_at || d.last_stop_at || d.chain_created;
      return {
        id: stop?.id ?? -d.chain_id,
        chain_id: d.chain_id,
        batch: d.batch,
        number: d.number,
        name: null,
        place: null,
        city: stop?.city || fallbackCity,
        lat: stop?.lat ?? null,
        lng: stop?.lng ?? null,
        note: null,
        added_what: null,
        amount_added: null,
        ended_chain: false,
        kept_for: null,
        created_at: created,
        is_dormant: true,
      };
    })
  );

  const activeChainIds = new Set(recentStops.map(s => s.chain_id));
  const dormantFiltered = dormantEntries.filter(d => !activeChainIds.has(d.chain_id));
  const entries = [...recentStops, ...dormantFiltered];

  // counts
  const counts = (await sql`
    SELECT
      (SELECT COUNT(*) FROM chains WHERE status = 'active') AS active_chains,
      (SELECT COUNT(*) FROM stops) AS total_stops
  `) as unknown as Array<{ active_chains: string; total_stops: string }>;
  const activeChains = parseInt(counts[0]?.active_chains || '0', 10);
  const totalStops = parseInt(counts[0]?.total_stops || '0', 10);

  return { entries, totalStops, activeChains };
}

export default async function Home() {
  const { entries, totalStops, activeChains } = await getFeed();

  return (
    <div className="wrap">
      <Masthead />

      <ActivityFeed entries={entries} totalStops={totalStops} />

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
        <div className="step"><div className="num">3.</div><div className="text">If you don&apos;t, add something and send it onward.</div></div>
        <div className="step"><div className="num">4.</div><div className="text">Either way, scan the card and log where it landed.</div></div>
      </section>

      <section className="start-card">
        <div className="scrawl">your turn?</div>
        <h3>Start a chain.</h3>
        <p>
          Pick something to give. We&apos;ll print you a small card with a QR and one-time code to tuck inside.
          The rest is up to whoever finds it.
        </p>
        <div className="actions">
          <Link href="/start" className="primary">start a chain →</Link>
          {activeChains > 0 && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--ink-faded)', letterSpacing: '0.06em' }}>
              {activeChains} {activeChains === 1 ? 'chain' : 'chains'} in motion · {totalStops} {totalStops === 1 ? 'stop' : 'stops'} logged
            </span>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
