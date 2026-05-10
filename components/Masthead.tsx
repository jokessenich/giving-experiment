import Link from 'next/link';

export function Masthead({ subtle = false }: { subtle?: boolean }) {
  if (subtle) {
    // Smaller variant for sub-pages
    return (
      <header className="mast" style={{ marginBottom: 32 }}>
        <Link href="/" className="label">an experiment, in progress</Link>
      </header>
    );
  }
  return (
    <header className="mast">
      <div className="label">an experiment, in progress</div>
      <h1>
        <Link href="/" style={{ color: 'inherit' }}>
          the <span className="underline">giving</span><br />experiment
        </Link>
      </h1>
      <div className="tagline">— a small thing, passed along.</div>
    </header>
  );
}
