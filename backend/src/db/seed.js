/**
 * Optional DB seed — run with: npm run db:seed
 * Creates no data by default; extend as needed for dev/demo.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function seed() {
  const userCount = (await query('SELECT COUNT(*) as c FROM users')).rows[0]?.c ?? 0;
  if (Number(userCount) > 0) {
    console.log('Users already exist. Skipping seed.');
    return;
  }
  console.log('No users in DB. Add demo data here if needed (e.g. create first admin via signup).');
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
