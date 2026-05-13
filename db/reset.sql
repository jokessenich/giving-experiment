-- ═══════════════════════════════════════════════════════════════════
-- RESET SCRIPT — drops all data and rebuilds tables with the new schema
-- ═══════════════════════════════════════════════════════════════════
-- Run each statement separately in Neon's SQL editor if it complains
-- about prepared statements.

DROP TABLE IF EXISTS log_attempts CASCADE;
DROP TABLE IF EXISTS stops CASCADE;
DROP TABLE IF EXISTS chains CASCADE;

CREATE TABLE chains (
  id              SERIAL PRIMARY KEY,
  batch           TEXT NOT NULL,
  number          INTEGER NOT NULL,
  secret_code     TEXT NOT NULL UNIQUE,
  starter_name    TEXT,
  starter_note    TEXT,
  starter_place   TEXT,
  starter_city    TEXT,
  starter_lat     DOUBLE PRECISION,
  starter_lng     DOUBLE PRECISION,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (batch, number)
);

CREATE INDEX chains_batch_idx ON chains (batch);

CREATE INDEX chains_status_idx ON chains (status);

CREATE INDEX chains_created_idx ON chains (created_at DESC);

CREATE TABLE stops (
  id              SERIAL PRIMARY KEY,
  chain_id        INTEGER NOT NULL REFERENCES chains(id) ON DELETE CASCADE,
  name            TEXT,
  place           TEXT,
  city            TEXT NOT NULL,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  note            TEXT,
  added_what      TEXT,
  amount_added    NUMERIC(10, 2),
  ended_chain     BOOLEAN NOT NULL DEFAULT FALSE,
  kept_for        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stops_chain_id_idx ON stops (chain_id);

CREATE INDEX stops_created_idx ON stops (created_at DESC);

CREATE TABLE log_attempts (
  id              SERIAL PRIMARY KEY,
  ip_hash         TEXT NOT NULL,
  succeeded       BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX log_attempts_ip_idx ON log_attempts (ip_hash, created_at DESC);
