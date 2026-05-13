import Link from 'next/link';

export function Masthead({ subtle = false }: { subtle?: boolean }) {
  if (subtle) {
    return (
      <header className="mast subtle">
        <Link href="/" className="label" style={{ textDecoration: 'none' }}>
          ← the giving experiment
        </Link>
      </header>
    );
  }
  return (
    <header className="mast">
      <div className="label">an experiment, in progress</div>
      <h1>
        <Link href="/" style={{ color: 'inherit' }}>
          the <em>giving</em><br />experiment
        </Link>
      </h1>
      <div className="tagline">— a small thing, passed along.</div>
      <div className="ornament">· · ·</div>
    </header>
  );
}
