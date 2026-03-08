/**
 * PostgreSQL database setup — runs migrations to create/update tables (e.g. Neon).
 * Run automatically on server start.
 */
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = ['001_initial.sql', '002_users_extend.sql'];

export async function runPgSetup() {
  for (const name of MIGRATIONS) {
    const file = path.join(__dirname, 'migrations', name);
    const sql = readFileSync(file, 'utf8');
    await query(sql);
    console.log('PostgreSQL migration', name, 'applied.');
  }
  console.log('PostgreSQL schema ready.');
}
