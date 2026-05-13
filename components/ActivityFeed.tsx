import Link from 'next/link';
import { relativeTime } from '@/lib/format';

export interface FeedStop {
  id: number;
  chain_id: number;
  batch: string;
  number: number;
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
  is_dormant?: boolean;
}

export function ActivityFeed({
  entries,
  totalStops,
}: {
  entries: FeedStop[];
  totalStops: number;
}) {
  if (entries.length === 0) {
    return (
      <section className="activity">
        <div className="ledger-head">
          <span className="col-1">№</span>
          <span className="col-2 with-pulse">
            <span className="live-dot"></span>
            stops along the way
          </span>
          <span className="col-3">when</span>
        </div>
        <div className="empty-state">
          nothing yet — the first chains are still in the mail.<br />
          check back soon.
        </div>
      </section>
    );
  }

  return (
    <section className="activity">
      <div className="ledger-head">
        <span className="col-1">№</span>
        <span className="col-2 with-pulse">
          <span className="live-dot"></span>
          stops along the way
        </span>
        <span className="col-3">when</span>
      </div>

      <ul className="feed">
        {entries.map((e, i) => {
          // Number from total descending: most recent stop = totalStops, etc.
          const num = totalStops - i;
          return (
            <li
              key={e.id + (e.is_dormant ? '-d' : '')}
              className={`entry${i === 0 ? ' first-row' : ''}`}
            >
              <div className="entry-num">{String(num).padStart(2, '0')}</div>
              <div className={`entry-body${e.is_dormant ? ' dormant' : ''}`}>
                <Link
                  href={`/c/${encodeURIComponent(e.batch)}/${e.number}`}
                  className={`chain-tag${e.is_dormant ? ' dormant' : ''}`}
                >
                  {e.batch} #{e.number}
                </Link>
                {renderBody(e)}
              </div>
              <div className="entry-meta">
                {relativeTime(e.created_at)}
                <Link href={`/c/${encodeURIComponent(e.batch)}/${e.number}`}>
                  journey
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function renderBody(e: FeedStop) {
  if (e.is_dormant) {
    return <>went quiet near <span className="where">{e.city}</span>.</>;
  }

  const who = e.name?.trim() ? <span className="who">{e.name}</span> : <span>Anonymous</span>;
  const placeIn = renderPlaceIn(e.place, e.city);

  if (e.ended_chain) {
    // "Someone found it in their mailbox in Tucson, AZ and kept it."
    // Or fallback: "Someone took it home in Tucson, AZ."
    const opening = e.place?.trim()
      ? <>Someone found it {placeIn} and kept it.</>
      : <>Someone took it home in <span className="where">{e.city}</span>.</>;
    return (
      <>
        {opening}{' '}
        <span className="ended">ended</span>
        {e.kept_for?.trim() && <span className="note">&ldquo;{e.kept_for}&rdquo;</span>}
        {e.note?.trim() && <span className="note">&ldquo;{e.note}&rdquo;</span>}
      </>
    );
  }

  const amount = parseAmount(e.amount_added);
  const what = e.added_what?.trim();
  const addedPhrase = buildAddedPhrase(amount, what);

  // Sentence builder:
  // - Place + added: "Maren found it in her mailbox in Madison, WI and added $20 before sending it on."
  // - Place, no add: "Maren found it on a park bench in Brooklyn, NY and sent it on."
  // - No place, added: "Maren got it in Madison, WI and added $20 before sending it on."
  // - Neither: "Maren in Madison, WI kept it moving."
  if (e.place?.trim() && addedPhrase) {
    return (
      <>
        {who} found it {placeIn} and added {addedPhrase} before sending it on.
        {e.note?.trim() && <span className="note">&ldquo;{e.note}&rdquo;</span>}
      </>
    );
  }
  if (e.place?.trim()) {
    return (
      <>
        {who} found it {placeIn} and sent it on.
        {e.note?.trim() && <span className="note">&ldquo;{e.note}&rdquo;</span>}
      </>
    );
  }
  if (addedPhrase) {
    return (
      <>
        {who} got it in <span className="where">{e.city}</span> and added {addedPhrase} before sending it on.
        {e.note?.trim() && <span className="note">&ldquo;{e.note}&rdquo;</span>}
      </>
    );
  }
  return (
    <>
      {who} {e.name ? 'sent it on from' : 'in'} <span className="where">{e.city}</span>{e.name ? '.' : ' kept it moving.'}
      {e.note?.trim() && <span className="note">&ldquo;{e.note}&rdquo;</span>}
    </>
  );
}

function renderPlaceIn(place: string | null | undefined, city: string): React.ReactNode {
  // Render: "<place> in <city>" — both inline, with city as the .where anchor.
  // place is rendered verbatim (option 2 — trust the user).
  return (
    <>
      {place} in <span className="where">{city}</span>
    </>
  );
}

function parseAmount(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function buildAddedPhrase(amount: number | null, what: string | null | undefined): React.ReactNode {
  const formatAmount = (n: number) => {
    if (Number.isInteger(n)) return `$${n}`;
    return `$${n.toFixed(2)}`;
  };
  if (amount && what) return <><span className="amount">{formatAmount(amount)}</span> and {what}</>;
  if (amount) return <span className="amount">{formatAmount(amount)}</span>;
  if (what) return what;
  return null;
}
