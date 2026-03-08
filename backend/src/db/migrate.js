import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { query } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  for (const name of ['001_initial.sql', '002_users_extend.sql']) {
    const file = path.join(__dirname, 'migrations', name);
    const sql = readFileSync(file, 'utf8');
    await query(sql);
    console.log('Migration', name, 'completed.');
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
