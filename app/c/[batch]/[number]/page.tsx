import { Masthead } from '@/components/Masthead';
import { Footer } from '@/components/Footer';
import { sql } from '@/lib/db';
import { LogForm } from './LogForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { batch: string; number: string };
}

export default async function LogPage({ params }: PageProps) {
  const number = parseInt(params.number, 10);
  if (Number.isNaN(number)) notFound();

  const batch = decodeURIComponent(params.batch).toLowerCase();

  const chain = (await sql`
    SELECT id, batch, number, status, starter_name
    FROM chains
    WHERE batch = ${batch} AND number = ${number}
    LIMIT 1
  `) as unknown as Array<{ id: number; batch: string; number: number; status: string; starter_name: string | null }>;

  if (chain.length === 0) notFound();

  const c = chain[0];

  // How many stops so far
  const stopCount = (await sql`
    SELECT COUNT(*) AS n FROM stops WHERE chain_id = ${c.id}
  `) as unknown as Array<{ n: string }>;

  return (
    <div className="wrap form-page">
      <Masthead subtle />
      <a href="/" className="back">← back</a>

      <h1>chain {c.batch} #{c.number}</h1>
      <div className="lede">— log where it landed.</div>

      {c.status === 'ended' ? (
        <p className="intro">
          this chain has already found its home. thank you for caring.
        </p>
      ) : (
        <>
          <p className="intro">
            so this little package found you. tell us where it is — share as much or as
            little as feels right. all of these fields are optional except your code and the city.
          </p>

          <LogForm chain={{ batch: c.batch, number: c.number }} />
        </>
      )}

      <p style={{
        marginTop: 48,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
        color: 'var(--ink-faded)',
        letterSpacing: '0.06em',
      }}>
        {parseInt(stopCount[0]?.n || '0', 10)} stops logged so far
      </p>

      <Footer />
    </div>
  );
}
