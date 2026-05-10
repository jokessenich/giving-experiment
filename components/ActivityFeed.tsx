'use client';

import { useState } from 'react';
import { relativeTime } from '@/lib/format';

export interface FeedStop {
  id: number;
  chain_id: number;
  batch: string;
  number: number;
  name: string | null;
  city: string;
  lat: number | null;
  lng: number | null;
  note: string | null;
  added_what: string | null;
  ended_chain: boolean;
  created_at: string;
  is_dormant?: boolean;
}

export interface FeedChainStops {
  id: number;
  batch: string;
  number: number;
  stops: { city: string; lat: number | null; lng: number | null; created_at: string; ended_chain: boolean }[];
}

export function ActivityFeed({
  entries,
  chainsForMap,
}: {
  entries: FeedStop[];
  chainsForMap: Record<number, FeedChainStops>;
}) {
  const [openChainId, setOpenChainId] = useState<number | null>(null);

  if (entries.length === 0) {
    return (
      <section className="activity">
        <div className="activity-head">
          <h2>what&apos;s moving</h2>
        </div>
        <div className="empty-state">
          nothing yet — the first chains are still in the mail.<br />
          check back soon.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="activity">
        <div className="activity-head">
          <h2>what&apos;s moving</h2>
        </div>

        <ul className="feed">
          {entries.map((e, i) => (
            <li
              key={e.id}
              className={`entry${e.is_dormant ? ' dormant' : ''}${i === 0 && !e.is_dormant ? ' taped' : ''}`}
            >
              <div className="chain">
                chain<b>{e.batch} #{e.number}</b>
              </div>
              <div className="body">
                {renderBody(e)}
                {e.note && <span className="note">&ldquo;{e.note}&rdquo;</span>}
              </div>
              <div className="meta">
                {relativeTime(e.created_at)}
                {chainsForMap[e.chain_id] && (
                  <button onClick={() => setOpenChainId(e.chain_id)}>see the journey</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {openChainId !== null && chainsForMap[openChainId] && (
        <JourneyModal
          chain={chainsForMap[openChainId]}
          onClose={() => setOpenChainId(null)}
        />
      )}
    </>
  );
}

function renderBody(e: FeedStop) {
  if (e.is_dormant) {
    return (
      <>went quiet near <span className="where">{e.city}</span>. nobody&apos;s heard from it since.</>
    );
  }

  const who = e.name?.trim() ? <span className="who">{e.name}</span> : <span>Anonymous</span>;

  if (e.ended_chain) {
    return (
      <>
        Someone took it home in <span className="where">{e.city}</span>.{' '}
        <span className="ended">chain ended</span>
      </>
    );
  }

  if (e.added_what?.trim()) {
    return (
      <>
        {who} got it in <span className="where">{e.city}</span> and added {e.added_what} before sending it on.
      </>
    );
  }

  return (
    <>{who} {e.name ? 'sent it on from' : 'in'} <span className="where">{e.city}</span>{e.name ? '.' : ' kept it moving.'}</>
  );
}

// ——— Journey modal ———

function JourneyModal({
  chain,
  onClose,
}: {
  chain: FeedChainStops;
  onClose: () => void;
}) {
  return (
    <div className="modal-veil" onClick={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="close" onClick={onClose} aria-label="close">×</button>
        <h3>chain <span className="num">{chain.batch} #{chain.number}</span></h3>
        <div className="modal-sub">where it&apos;s been</div>

        <div className="map">
          <JourneySVG stops={chain.stops} />
        </div>

        <ul className="stops">
          {chain.stops.map((s, i) => (
            <li key={i}>
              <span className="place">
                <span className={`marker${s.ended_chain ? ' ended' : ''}`}></span>
                {s.city}
                {s.ended_chain && <span className="ended-tag">— it found a home here</span>}
              </span>
              <span className="when">{relativeTime(s.created_at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ——— Sketch-on-graph-paper journey map ———
// Project lat/lng into the SVG box; bound to a US-ish view but auto-fit to actual stops.

function JourneySVG({ stops }: { stops: FeedChainStops['stops'] }) {
  const W = 400, H = 280;
  const usable = stops.filter(s => s.lat !== null && s.lng !== null) as { lat: number; lng: number; ended_chain: boolean; city: string }[];

  if (usable.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <rect width={W} height={H} fill="#efe6cd" />
        <text
          x={W / 2} y={H / 2}
          fontFamily="Caveat, cursive" fontSize="20"
          fill="#8a8071" textAnchor="middle"
        >
          the path is unmapped
        </text>
      </svg>
    );
  }

  // Bounding box with padding so points aren't on the edge
  const lats = usable.map(s => s.lat);
  const lngs = usable.map(s => s.lng);
  const padPct = 0.2;
  let minLat = Math.min(...lats), maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  // expand if too tight (single point)
  if (maxLat - minLat < 1) { minLat -= 1; maxLat += 1; }
  if (maxLng - minLng < 1) { minLng -= 1; maxLng += 1; }
  const dLat = maxLat - minLat;
  const dLng = maxLng - minLng;
  minLat -= dLat * padPct; maxLat += dLat * padPct;
  minLng -= dLng * padPct; maxLng += dLng * padPct;

  const project = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * W,
    y: H - ((lat - minLat) / (maxLat - minLat)) * H, // invert: north = up
  });

  // grid
  const grid = [];
  for (let i = 0; i <= 14; i++) {
    grid.push(<line key={`gh${i}`} x1={0} y1={i * 20} x2={W} y2={i * 20} stroke="#d8cdb3" strokeWidth={0.6} />);
  }
  for (let i = 0; i <= 20; i++) {
    grid.push(<line key={`gv${i}`} x1={i * 20} y1={0} x2={i * 20} y2={H} stroke="#d8cdb3" strokeWidth={0.6} />);
  }

  // wobbly path connecting stops
  const projected = usable.map(s => project(s.lat, s.lng));
  let pathD = '';
  if (projected.length > 1) {
    pathD = `M ${projected[0].x} ${projected[0].y}`;
    for (let i = 1; i < projected.length; i++) {
      const prev = projected[i - 1], cur = projected[i];
      const mx = (prev.x + cur.x) / 2 + Math.sin(i * 9.7) * 14;
      const my = (prev.y + cur.y) / 2 - 20 + Math.cos(i * 5.3) * 10;
      pathD += ` Q ${mx} ${my}, ${cur.x} ${cur.y}`;
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <rect width={W} height={H} fill="#efe6cd" />
      {grid}
      {pathD && (
        <path
          d={pathD}
          stroke="#a8632d" strokeWidth={1.6}
          fill="none" strokeDasharray="4,5"
          strokeLinecap="round" opacity={0.85}
        />
      )}
      {projected.map((p, i) => {
        const stop = usable[i];
        const isLast = i === projected.length - 1;
        const r = isLast ? 6.5 : 4.5;
        const fill = stop.ended_chain ? '#a8632d' : (isLast ? '#4f614a' : '#6b7d5e');
        const labelAlign: 'start' | 'end' = p.x > W * 0.7 ? 'end' : 'start';
        const dx = p.x > W * 0.7 ? -8 : 8;
        return (
          <g key={i}>
            {isLast && !stop.ended_chain && (
              <circle cx={p.x} cy={p.y} r={11} fill="none" stroke="#4f614a" strokeWidth={1} opacity={0.4} />
            )}
            <circle cx={p.x} cy={p.y} r={r} fill={fill} />
            <text
              x={p.x + dx} y={p.y - 10}
              fontFamily="Caveat, cursive" fontSize={14}
              fill="#5a5246" textAnchor={labelAlign}
            >
              {stop.city.split(',')[0]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
