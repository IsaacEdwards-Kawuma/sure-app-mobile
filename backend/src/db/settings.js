import { query } from './index.js';

const ALLOWED_KEYS = [
  'business',
  'revenue_sources',
  'voucher_packages',
  'fixed_costs',
  'expense_categories',
  'subscriptions',
];

function parseSetting(row) {
  if (!row?.value) return null;
  try {
    return typeof row.value === 'object' ? row.value : JSON.parse(row.value);
  } catch {
    return row.value;
  }
}

export async function getSetting(key) {
  const result = await query('SELECT value FROM settings WHERE key = $1', [key]);
  return result.rows[0] ? parseSetting(result.rows[0]) : null;
}

export async function getAllSettings() {
  const result = await query('SELECT key, value FROM settings');
  const out = {};
  for (const row of result.rows) {
    out[row.key] = parseSetting(row);
  }
  return out;
}

export async function saveSetting(key, value) {
  if (!ALLOWED_KEYS.includes(key)) {
    throw new Error(`Invalid settings key: ${key}`);
  }
  const valueJson = JSON.stringify(value);
  const now = new Date().toISOString();
  await query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = $3`,
    [key, valueJson, now]
  );
}

export { ALLOWED_KEYS };
