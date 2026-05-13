'use client';

import { useState } from 'react';

interface CreatedChain {
  batch: string;
  number: number;
  secret_code: string;
  url: string;
  qr_svg: string;
}

export function StartForm({ batches }: { batches: string[] }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedChain | null>(null);

  // Sensible default: pick a random batch as the suggested name
  const [batch, setBatch] = useState(batches[Math.floor(Math.random() * batches.length)]);
  const [starterName, setStarterName] = useState('');
  const [starterPlace, setStarterPlace] = useState('');
  const [starterCity, setStarterCity] = useState('');
  const [starterNote, setStarterNote] = useState('');
  const [adminToken, setAdminToken] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch,
          starter_name: starterName.trim() || null,
          starter_place: starterPlace.trim() || null,
          starter_city: starterCity.trim() || null,
          starter_note: starterNote.trim() || null,
          admin_token: adminToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'something went wrong');
      }
      const data = await res.json();
      setCreated(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return <Receipt chain={created} />;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="batch">
          batch <span className="opt">— this chain&apos;s name</span>
        </label>
        <select
          id="batch"
          value={batch}
          onChange={(e) => setBatch(e.target.value)}
        >
          {batches.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <div className="hint">a mushroom name for the batch this chain belongs to.</div>
      </div>

      <div className="field">
        <label htmlFor="name">
          your name <span className="opt">— optional</span>
        </label>
        <input
          id="name"
          type="text"
          value={starterName}
          onChange={(e) => setStarterName(e.target.value)}
          placeholder="leave blank to stay anonymous"
        />
      </div>

      <div className="field">
        <label htmlFor="place">
          where are you putting it? <span className="opt">— optional</span>
        </label>
        <div className="inline-where">
          <input
            id="place"
            type="text"
            value={starterPlace}
            onChange={(e) => setStarterPlace(e.target.value)}
            placeholder="in the mail"
            autoComplete="off"
          />
          <span className="inline-where-conn">in</span>
          <input
            id="city"
            type="text"
            value={starterCity}
            onChange={(e) => setStarterCity(e.target.value)}
            placeholder="Ann Arbor, MI"
          />
        </div>
        <div className="hint">just so the journey has a starting point on the map.</div>
      </div>

      <div className="field">
        <label htmlFor="note">
          what&apos;s inside <span className="opt">— optional</span>
        </label>
        <textarea
          id="note"
          value={starterNote}
          onChange={(e) => setStarterNote(e.target.value)}
          placeholder="a poem, $20, a paperback i loved..."
        />
      </div>

      <div className="field">
        <label htmlFor="token">starter passphrase</label>
        <input
          id="token"
          type="password"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          placeholder=""
          required
        />
        <div className="hint">while we&apos;re small, only Johnny can start chains. this keeps things tended to.</div>
      </div>

      <div className="submit-row">
        <button type="submit" className="submit" disabled={submitting}>
          {submitting ? 'making your card...' : 'make my card →'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
    </form>
  );
}

function Receipt({ chain }: { chain: CreatedChain }) {
  return (
    <div className="receipt">
      <h1 style={{ marginTop: 12 }}>your chain is ready.</h1>
      <div className="lede" style={{ marginBottom: 12 }}>— {chain.batch} #{chain.number}, with love.</div>

      <p className="intro">
        Print this card (or write it out by hand), tuck it inside your package, and send it on its way.
        Whoever finds it can scan the code or visit the link to log where it landed.
      </p>

      <div className="card-mock printable-card">
        <div className="card-id">chain</div>
        <div className="card-name">{chain.batch} #{chain.number}</div>

        <div className="card-msg">
          Sometimes are tough, sometimes are smooth,<br />
          but together we can always make it through.
          <br /><br />
          If you need this, take it with our love.<br />
          If you don&apos;t, add something and pass it on.
        </div>

        <div
          className="qr-wrap"
          dangerouslySetInnerHTML={{ __html: chain.qr_svg }}
        />

        <div className="card-code-label">your code</div>
        <div className="card-code">{chain.secret_code}</div>

        <div className="card-url">{chain.url}</div>
      </div>

      <div className="instructions no-print">
        <p>print this page (cmd-p), or copy the details by hand onto a card.</p>
        <p>save the code somewhere safe — you can&apos;t recover it.</p>
      </div>

      <div className="submit-row no-print">
        <a href="/" className="submit" style={{ textDecoration: 'none' }}>← home</a>
        <a href="/start" style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 16,
          color: 'var(--ink-soft)',
          textDecoration: 'none',
          borderBottom: '1px solid var(--ink-faded)',
        }}>start another</a>
      </div>
    </div>
  );
}
