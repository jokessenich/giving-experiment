import Link from 'next/link';

// The single signature gesture: a small hand-drawn mushroom, in gold.
function MushroomMark() {
  return (
    <svg
      className="mushroom-mark"
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* cap */}
      <path
        d="M6 22 C6 11 14 5 24 5 C34 5 42 11 42 22 C42 24 40 25 37 25 L11 25 C8 25 6 24 6 22 Z"
        stroke="var(--gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
      {/* cap spots */}
      <circle cx="17" cy="15" r="1.6" fill="var(--gold)" opacity="0.7" />
      <circle cx="27" cy="12" r="1.3" fill="var(--gold)" opacity="0.7" />
      <circle cx="33" cy="18" r="1.1" fill="var(--gold)" opacity="0.7" />
      {/* gills line */}
      <path d="M11 25 L37 25" stroke="var(--gold)" strokeWidth="1" opacity="0.5" />
      {/* stem */}
      <path
        d="M19 25 C19 34 18 44 17 50 C17 51 18 52 24 52 C30 52 31 51 31 50 C30 44 29 34 29 25"
        stroke="var(--gold)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Masthead({ subtle = false }: { subtle?: boolean }) {
  if (subtle) {
    return (
      <header className="mast subtle">
        <Link href="/" className="back-link" style={{ textDecoration: 'none' }}>
          ← the giving experiment
        </Link>
      </header>
    );
  }
  return (
    <header className="mast">
      <Link href="/" style={{ color: 'inherit', textDecoration: 'none', display: 'inline-block' }}>
        <MushroomMark />
        <h1>
          the <em>giving</em><br />experiment
        </h1>
      </Link>
      <div className="tagline">— a small thing, passed along.</div>
    </header>
  );
}
