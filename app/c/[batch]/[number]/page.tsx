import { Masthead } from '@/components/Masthead';
import { Footer } from '@/components/Footer';
import { JourneyMap } from '@/components/JourneyMap';
import { sql } from '@/lib/db';
import { LogForm } from './LogForm';
import { notFound } from 'next/navigation';
import { relativeTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { batch: string; number: string };
}

interface ChainRecord {
  id: number;
  batch: string;
  number: number;
  status: string;
  starter_name: string | null;
  starter_note: string | null;
  starter_place: string | null;
  starter_city: string | null;
  starter_lat: number | null;
  starter_lng: number | null;
  created_at: string;
}

interface StopRecord {
  id: number;
  name: string | null;
  place: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
  added_what: string | null;
  amount_added: number | string | null;
  ended_chain: boolean;
  kept_for: string | null;
  created_at: string;
}

export default async function ChainPage({ params }: PageProps) {
  const number = parseInt(params.number, 10);
  if (Number.isNaN(number)) notFound();
  const batch = decodeURIComponent(params.batch).toLowerCase();

  const chains = (await sql`
    SELECT id, batch, number, status, starter_name, starter_note, starter_place,
           starter_city, starter_lat, starter_lng, created_at
    FROM chains
    WHERE batch = ${batch} AND number = ${number}
    LIMIT 1
  `) as unknown as ChainRecord[];

  if (chains.length === 0) notFound();
  const chain = chains[0];

  const stops = (await sql`
    SELECT id, name, place, city, lat, lng, note, added_what, amount_added,
           ended_chain, kept_for, created_at
    FROM stops
    WHERE chain_id = ${chain.id}
    ORDER BY created_at ASC
  `) as unknown as StopRecord[];

  // Build map stops: starter point first (if known), then real stops
  const mapStops: { city: string; lat: number | null; lng: number | null; ended_chain?: boolean; is_starter?: boolean }[] = [];
  if (chain.starter_city && chain.starter_lat !== null && chain.starter_lng !== null) {
    mapStops.push({
      city: chain.starter_city,
      lat: chain.starter_lat,
      lng: chain.starter_lng,
      is_starter: true,
    });
  }
  for (const s of stops) {
    mapStops.push({
      city: s.city,
      lat: s.lat,
      lng: s.lng,
      ended_chain: s.ended_chain,
    });
  }

  // Tally
  const totalAdded = stops.reduce((sum, s) => {
    const n = typeof s.amount_added === 'string' ? parseFloat(s.amount_added) : (s.amount_added ?? 0);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  const stopCount = stops.length;
  const isEnded = chain.status === 'ended';

  const lastStop = stops[stops.length - 1];
  const isDormant = !isEnded && stopCount > 0 &&
    new Date(lastStop.created_at).getTime() < Date.now() - 60 * 24 * 60 * 60 * 1000;
  const isDormantNoStops = !isEnded && stopCount === 0 &&
    new Date(chain.created_at).getTime() < Date.now() - 60 * 24 * 60 * 60 * 1000;

  let statusText = '';
  let statusClass = '';
  if (isEnded) {
    statusText = 'this chain found its home.';
    statusClass = 'ended';
  } else if (isDormant || isDormantNoStops) {
    statusText = 'this chain has gone quiet.';
  } else if (stopCount === 0) {
    statusText = 'just sent — somewhere out there.';
  } else {
    statusText = 'still moving.';
  }

  return (
    <div className="wrap chain-page">
      <Masthead subtle />

      <div className="crest">
        <div className="label">a chain in motion</div>
        <h1>
          <span className="batch">{chain.batch}</span> #{chain.number}
        </h1>
        <div className={`status ${statusClass}`}>— {statusText}</div>
      </div>

      <div className="tally">
        <div className="stat">
          <span className="num">{stopCount}</span>
          <span className="lbl">{stopCount === 1 ? 'stop' : 'stops'}</span>
        </div>
        {totalAdded > 0 && (
          <div className="stat">
            <span className="num">${formatTally(totalAdded)}</span>
            <span className="lbl">added along the way</span>
          </div>
        )}
        <div className="stat">
          <span className="num">{daysBetween(chain.created_at, lastStop?.created_at ?? new Date().toISOString())}</span>
          <span className="lbl">days traveling</span>
        </div>
      </div>

      <JourneyMap stops={mapStops} />

      {(stops.length > 0 || chain.starter_city) && (
        <>
          <div className="timeline-head">— the journey, in order —</div>
          <ul className="timeline">
            {chain.starter_city && (
              <li className="starter">
                <div className="timeline-row">
                  <span className="where">
                    {chain.starter_place?.trim()
                      ? <>started {chain.starter_place} in {chain.starter_city}</>
                      : <>started in {chain.starter_city}</>}
                  </span>
                  <span className="when">{relativeTime(chain.created_at)}</span>
                </div>
                {chain.starter_name && (
                  <div className="added"><span className="who">{chain.starter_name}</span> sent it out.</div>
                )}
                {chain.starter_note && (
                  <span className="note">&ldquo;{chain.starter_note}&rdquo;</span>
                )}
              </li>
            )}
            {stops.map((s) => (
              <li key={s.id} className={s.ended_chain ? 'ended' : ''}>
                <div className="timeline-row">
                  <span className="where">
                    {s.place?.trim()
                      ? <>found {s.place} in {s.city}</>
                      : s.city}
                  </span>
                  <span className="when">{relativeTime(s.created_at)}</span>
                </div>
                <div className="added">
                  {renderTimelineLine(s)}
                </div>
                {s.note?.trim() && <span className="note">&ldquo;{s.note}&rdquo;</span>}
                {s.kept_for?.trim() && <span className="note">&ldquo;{s.kept_for}&rdquo;</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {!isEnded && (
        <section className="log-prompt">
          <div className="scrawl">just received this?</div>
          <h3>Log where it landed.</h3>
          <p>
            You&apos;ll need the secret code from the card. Whatever you share goes into this chain&apos;s journey.
          </p>
          <LogForm chain={{ batch: chain.batch, number: chain.number }} />
        </section>
      )}

      <Footer />
    </div>
  );
}

function renderTimelineLine(s: StopRecord) {
  const who = s.name?.trim() ? <span className="who">{s.name}</span> : <span>Anonymous</span>;
  if (s.ended_chain) {
    return <>{who} kept it. <span className="ended-tag">ended</span></>;
  }
  const amount = typeof s.amount_added === 'string' ? parseFloat(s.amount_added) : s.amount_added;
  const what = s.added_what?.trim();
  if (amount && Number.isFinite(amount) && amount > 0 && what) {
    return <>{who} added <span className="amount">{formatAmount(amount)}</span> and {what}.</>;
  }
  if (amount && Number.isFinite(amount) && amount > 0) {
    return <>{who} added <span className="amount">{formatAmount(amount)}</span>.</>;
  }
  if (what) {
    return <>{who} added {what}.</>;
  }
  return <>{who} kept it moving.</>;
}

function formatAmount(n: number): string {
  if (Number.isInteger(n)) return `$${n}`;
  return `$${n.toFixed(2)}`;
}

function formatTally(n: number): string {
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function daysBetween(a: string, b: string): number {
  const ms = Math.max(0, new Date(b).getTime() - new Date(a).getTime());
  return Math.max(1, Math.floor(ms / (24 * 60 * 60 * 1000)));
}
