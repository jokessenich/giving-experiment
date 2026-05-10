'use client';

import { useState } from 'react';

export function LogForm({ chain }: { chain: { batch: string; number: number } }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [addedWhat, setAddedWhat] = useState('');
  const [endedChain, setEndedChain] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: chain.batch,
          number: chain.number,
          code,
          name: name.trim() || null,
          city: city.trim(),
          note: note.trim() || null,
          added_what: addedWhat.trim() || null,
          ended_chain: endedChain,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'something went wrong');
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div style={{ marginTop: 24 }}>
        <div className="lede" style={{ fontSize: 28 }}>thank you.</div>
        <p className="intro" style={{ marginTop: 14 }}>
          {endedChain
            ? 'we\u2019re glad it found you when you needed it. take good care.'
            : 'the journey continues. it\u2019ll show up in the feed soon.'}
        </p>
        <div className="submit-row">
          <a href="/" className="submit" style={{ textDecoration: 'none' }}>← see what&apos;s moving</a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="code">your code</label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. gentle-river-47"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <div className="hint">it&apos;s on the card that came with the package.</div>
      </div>

      <div className="field">
        <label htmlFor="city">where are you?</label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Madison, WI"
          required
        />
        <div className="hint">a city is enough — no need to be exact.</div>
      </div>

      <div className="field">
        <label htmlFor="name">
          your name <span className="opt">— optional</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="leave blank to stay anonymous"
        />
      </div>

      <div className="field">
        <label htmlFor="added">
          what did you add? <span className="opt">— optional</span>
        </label>
        <input
          id="added"
          type="text"
          value={addedWhat}
          onChange={(e) => setAddedWhat(e.target.value)}
          placeholder="e.g. a watercolor i made of the lake"
        />
      </div>

      <div className="field">
        <label htmlFor="note">
          a note <span className="opt">— optional</span>
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="anything you want to leave in the world about this."
          maxLength={500}
        />
        <div className="hint">whatever you write here will show up on the homepage.</div>
      </div>

      <div className="field checkbox">
        <input
          id="ended"
          type="checkbox"
          checked={endedChain}
          onChange={(e) => setEndedChain(e.target.checked)}
        />
        <label htmlFor="ended">
          I needed this and kept it. the chain ends here.
        </label>
      </div>

      <div className="submit-row">
        <button type="submit" className="submit" disabled={submitting}>
          {submitting ? 'logging it...' : 'log it →'}
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}
    </form>
  );
}
