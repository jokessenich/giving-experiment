#!/usr/bin/env node
// Apply the database schema to Neon.
// Run with: node scripts/setup-db.mjs

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schemaPath = join(__dirname, '..', 'db', 'schema.sql');
const schema = await readFile(schemaPath, 'utf8');

// Split on semicolons but skip empty/comment-only chunks
const statements = schema
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Applying ${statements.length} statements to Neon...`);

for (const statement of statements) {
  try {
    await sql.query(statement);
    const firstLine = statement.split('\n')[0].slice(0, 70);
    console.log(`  ✓ ${firstLine}${statement.split('\n')[0].length > 70 ? '...' : ''}`);
  } catch (err) {
    console.error(`  ✗ Failed: ${statement.slice(0, 80)}`);
    console.error(`    ${err.message}`);
    process.exit(1);
  }
}

console.log('\n✓ Schema applied. Your database is ready.');
