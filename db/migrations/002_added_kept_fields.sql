-- Migration 002: add fields for what people did with the gift
-- Run this on your Neon database after the initial schema.
-- Each statement separately if Neon's SQL editor complains.

ALTER TABLE stops ADD COLUMN IF NOT EXISTS amount_added NUMERIC(10, 2);
ALTER TABLE stops ADD COLUMN IF NOT EXISTS kept_for TEXT;
