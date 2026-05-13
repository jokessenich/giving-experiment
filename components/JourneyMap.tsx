interface MapStop {
  city: string;
  lat: number | null;
  lng: number | null;
  ended_chain?: boolean;
  is_starter?: boolean;
}

// Color tokens — kept in sync with globals.css
const MAP_BG = '#0f2a1c';           // var(--bg-darker)
const MAP_GRID = '#224d38';         // var(--bg-warm)
const MAP_PATH = '#c9a04a';         // var(--gold) — primary travel line
const MAP_DOT_STOP = '#9bb88a';     // var(--moss) — past stops
const MAP_DOT_LAST = '#e0b755';     // var(--gold-bright) — current location
const MAP_DOT_STARTER = '#c9a04a';  // var(--gold) — origin
const MAP_DOT_ENDED = '#b85432';    // var(--rust) — chain ended
const LABEL_COLOR = '#cdc1a1';      // var(--ink-soft)

export function JourneyMap({ stops }: { stops: MapStop[] }) {
  const W = 720, H = 320;
  const usable = stops.filter(s => s.lat !== null && s.lng !== null) as Array<{
    city: string; lat: number; lng: number; ended_chain?: boolean; is_starter?: boolean;
  }>;

  if (usable.length === 0) {
    return (
      <div className="journey-map">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <rect width={W} height={H} fill={MAP_BG} />
          <text x={W / 2} y={H / 2}
            fontFamily="Caveat, cursive" fontSize="22"
            fill="#95a08f" textAnchor="middle">
            the path is unmapped
          </text>
        </svg>
      </div>
    );
  }

  const lats = usable.map(s => s.lat);
  const lngs = usable.map(s => s.lng);
  const padPct = 0.18;
  let minLat = Math.min(...lats), maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  if (maxLat - minLat < 1) { minLat -= 1; maxLat += 1; }
  if (maxLng - minLng < 1) { minLng -= 1; maxLng += 1; }
  const dLat = maxLat - minLat;
  const dLng = maxLng - minLng;
  minLat -= dLat * padPct; maxLat += dLat * padPct;
  minLng -= dLng * padPct; maxLng += dLng * padPct;

  const project = (lat: number, lng: number) => ({
    x: ((lng - minLng) / (maxLng - minLng)) * W,
    y: H - ((lat - minLat) / (maxLat - minLat)) * H,
  });

  const grid: React.JSX.Element[] = [];
  const gridSize = 24;
  for (let i = 0; i <= H / gridSize; i++) {
    grid.push(<line key={`gh${i}`} x1={0} y1={i * gridSize} x2={W} y2={i * gridSize} stroke={MAP_GRID} strokeWidth={0.5} opacity={0.45} />);
  }
  for (let i = 0; i <= W / gridSize; i++) {
    grid.push(<line key={`gv${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={H} stroke={MAP_GRID} strokeWidth={0.5} opacity={0.45} />);
  }

  const projected = usable.map(s => project(s.lat, s.lng));
  let pathD = '';
  if (projected.length > 1) {
    pathD = `M ${projected[0].x} ${projected[0].y}`;
    for (let i = 1; i < projected.length; i++) {
      const prev = projected[i - 1], cur = projected[i];
      const mx = (prev.x + cur.x) / 2 + Math.sin(i * 9.7) * 16;
      const my = (prev.y + cur.y) / 2 - 24 + Math.cos(i * 5.3) * 12;
      pathD += ` Q ${mx} ${my}, ${cur.x} ${cur.y}`;
    }
  }

  return (
    <div className="journey-map">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <rect width={W} height={H} fill={MAP_BG} />
        {grid}
        {pathD && (
          <path
            d={pathD}
            stroke={MAP_PATH} strokeWidth={1.8}
            fill="none" strokeDasharray="5,6"
            strokeLinecap="round" opacity={0.85}
          />
        )}
        {projected.map((p, i) => {
          const stop = usable[i];
          const isLast = i === projected.length - 1;
          const r = stop.is_starter ? 7 : (isLast ? 7.5 : 5.5);
          let fill: string = MAP_DOT_STOP;
          if (stop.is_starter) fill = MAP_DOT_STARTER;
          else if (stop.ended_chain) fill = MAP_DOT_ENDED;
          else if (isLast) fill = MAP_DOT_LAST;
          const labelAlign: 'start' | 'end' = p.x > W * 0.7 ? 'end' : 'start';
          const dx = p.x > W * 0.7 ? -10 : 10;
          return (
            <g key={i}>
              {isLast && !stop.ended_chain && (
                <circle cx={p.x} cy={p.y} r={13} fill="none" stroke={MAP_DOT_LAST} strokeWidth={1} opacity={0.5} />
              )}
              <circle cx={p.x} cy={p.y} r={r} fill={fill} />
              <text
                x={p.x + dx} y={p.y - 12}
                fontFamily="Caveat, cursive" fontSize={16}
                fill={LABEL_COLOR} textAnchor={labelAlign}
                fontWeight={500}
              >
                {stop.city.split(',')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
