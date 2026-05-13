'use client';

import { useState } from 'react';

export function LogForm({ chain }: { chain: { batch: string; number: number } }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [amountAdded, setAmountAdded] = useState('');
  const [addedWhat, setAddedWhat] = useState('');
  const [showAddedWhat, setShowAddedWhat] = useState(false);
  const [endedChain, setEndedChain] = useState(false);
  const [keptFor, setKeptFor] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Parse amount — accept "20", "$20", "20.00" etc
    let parsedAmount: number | null = null;
    const trimmed = amountAdded.trim().replace(/^\$/, '').replace(/,/g, '');
    if (trimmed) {
      const n = parseFloat(trimmed);
      if (!Number.isNaN(n) && n >= 0) parsedAmount = n;
    }

    try {
      const res = await fetch('/api/stops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch: chain.batch,
          number: chain.number,
          code,
          name: name.trim() || null,
          place: place.trim() || null,
          city: city.trim(),
          note: note.trim() || null,
          amount_added: endedChain ? null : parsedAmount,
          added_what: endedChain ? null : (showAddedWhat ? (addedWhat.trim() || null) : null),
          ended_chain: endedChain,
          kept_for: endedChain ? (keptFor.trim() || null) : null,
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
        <label htmlFor="code">Your code</label>
        <div className="hint">It&apos;s on the card that came with the package.</div>
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
      </div>

      <div className="field">
        <label htmlFor="place">Where did you find it?</label>
        <div className="hint">The city is enough — the place is optional.</div>
        <div className="inline-where">
          <input
            id="place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="in my mailbox"
            autoComplete="off"
          />
          <span className="inline-where-conn">in</span>
          <input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Chicago"
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="name">
          Your name <span className="opt">— optional</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="leave blank to stay anonymous"
        />
      </div>

      {/* The "I kept it" toggle, set off as its own visual element */}
      <button
        type="button"
        className={`kept-toggle${endedChain ? ' active' : ''}`}
        onClick={() => setEndedChain(!endedChain)}
        aria-pressed={endedChain}
      >
        <span className="kept-label">I needed this and kept it.</span>
        <span className="kept-hint">tap if the chain ends here.</span>
      </button>

      {!endedChain && (
        <>
          <div className="field">
            <label htmlFor="amount">
              How much did you add? <span className="opt">— optional</span>
            </label>
            <div className="hint">Most folks add a few bucks before sending it on.</div>
            <div className="money-row">
              <span className="dollar">$</span>
              <input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amountAdded}
                onChange={(e) => setAmountAdded(e.target.value)}
                placeholder="20"
              />
            </div>
          </div>

          {!showAddedWhat ? (
            <button
              type="button"
              className="add-toggle"
              onClick={() => setShowAddedWhat(true)}
            >
              + add something other than money?
            </button>
          ) : (
            <div className="field">
              <label htmlFor="added">
                What else did you add? <span className="opt">— optional</span>
              </label>
              <div className="hint">Art, a book, a letter — whatever felt right.</div>
              <input
                id="added"
                type="text"
                value={addedWhat}
                onChange={(e) => setAddedWhat(e.target.value)}
                placeholder="a watercolor i made"
                autoFocus
              />
            </div>
          )}
        </>
      )}

      {endedChain && (
        <div className="field">
          <label htmlFor="kept">
            What did you do with it? <span className="opt">— only if you want to share</span>
          </label>
          <div className="hint">Whatever you write here will show up on the homepage.</div>
          <textarea
            id="kept"
            value={keptFor}
            onChange={(e) => setKeptFor(e.target.value)}
            placeholder="groceries this week, my daughter's medicine, a long bus ride home..."
            maxLength={300}
          />
        </div>
      )}

      <div className="field">
        <label htmlFor="note">
          A note <span className="opt">— optional</span>
        </label>
        <div className="hint">Whatever you write here will show up on the homepage.</div>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={endedChain
            ? "anything else you'd like to leave behind."
            : "anything you want to leave in the world about this."}
          maxLength={500}
        />
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
