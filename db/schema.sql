-- the giving experiment — schema
-- run this on your Neon database (use scripts/setup-db.mjs to apply automatically)

CREATE TABLE IF NOT EXISTS chains (
  id              SERIAL PRIMARY KEY,
  batch           TEXT NOT NULL,                          -- e.g. "morel"
  number          INTEGER NOT NULL,                       -- e.g. 7  →  morel #7
  secret_code     TEXT NOT NULL UNIQUE,                   -- e.g. "gentle-river-47"
  starter_name    TEXT,                                   -- optional
  starter_note    TEXT,                                   -- optional, what's inside
  starter_place   TEXT,                                   -- optional, e.g. "in the mail", "on the bench by the lake"
  starter_city    TEXT,                                   -- optional
  starter_lat     DOUBLE PRECISION,                       -- optional
  starter_lng     DOUBLE PRECISION,                       -- optional
  status          TEXT NOT NULL DEFAULT 'active',         -- 'active' | 'ended'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch, number)
);

CREATE INDEX IF NOT EXISTS chains_batch_idx ON chains (batch);
CREATE INDEX IF NOT EXISTS chains_status_idx ON chains (status);
CREATE INDEX IF NOT EXISTS chains_created_idx ON chains (created_at DESC);

CREATE TABLE IF NOT EXISTS stops (
  id              SERIAL PRIMARY KEY,
  chain_id        INTEGER NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  name            TEXT,                                   -- optional
  place           TEXT,                                   -- optional, e.g. "in a free library", "on a park bench"
  city            TEXT NOT NULL,                          -- required
  lat             DOUBLE PRECISION,                       -- from geocoding
  lng             DOUBLE PRECISION,
  note            TEXT,                                   -- optional message
  added_what      TEXT,                                   -- optional: what they added (non-money)
  amount_added    NUMERIC(10, 2),                         -- optional: dollar amount added
  ended_chain     BOOLEAN NOT NULL DEFAULT FALSE,         -- "I needed this, chain ends here"
  kept_for        TEXT,                                   -- if ended: what they used it for
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stops_chain_id_idx ON stops (chain_id);
CREATE INDEX IF NOT EXISTS stops_created_idx ON stops (created_at DESC);

-- A simple table to store rate-limit attempts on the log endpoint,
-- so a bad actor can't try millions of secret codes.
CREATE TABLE IF NOT EXISTS log_attempts (
  id              SERIAL PRIMARY KEY,
  ip_hash         TEXT NOT NULL,                          -- hashed IP
  succeeded       BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS log_attempts_ip_idx ON log_attempts (ip_hash, created_at DESC);
