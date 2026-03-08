/**
 * Local DB operations — mirror backend API response shapes.
 */
import { getDb } from './db';

function getWeek(dateStr: string): number | null {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const iso = start.toISOString().slice(0, 10);
  return parseInt(iso.replace(/-/g, ''), 10) || null;
}

// —— Sales ——
export async function getSales(limit = 500): Promise<{ sales: unknown[] }> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT s.*, u.name as attendant_name FROM sales s LEFT JOIN users u ON u.id = s.attendant_id ORDER BY s.date DESC, s.id DESC LIMIT ?',
    [limit]
  );
  return { sales: rows };
}

export async function createSale(body: {
  date: string;
  attendant_id?: number | null;
  total_revenue?: number;
  revenue_sources?: Record<string, number>;
  notes?: string | null;
  downtime?: number;
}): Promise<{ sale: any }> {
  const database = await getDb();
  const date = body.date || new Date().toISOString().slice(0, 10);
  const week = getWeek(date);
  const { lastInsertRowId } = await database.runAsync(
    `INSERT INTO sales (date, week, attendant_id, total_revenue, revenue_sources, notes, downtime)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      date,
      week,
      body.attendant_id ?? null,
      body.total_revenue ?? 0,
      body.revenue_sources ? JSON.stringify(body.revenue_sources) : '{}',
      body.notes ?? null,
      body.downtime ?? 0,
    ]
  );
  const row = await database.getFirstAsync<any>('SELECT * FROM sales WHERE id = ?', [lastInsertRowId]);
  return { sale: row };
}

export async function updateExpense(id: number, body: Partial<{ sale_id: number | null; description: string | null; category: string | null; subcategory: string | null; amount: number }>): Promise<{ expense: any }> {
  const database = await getDb();
  const updates: string[] = [];
  const args: any[] = [];
  if (body.sale_id !== undefined) {
    updates.push('sale_id = ?');
    args.push(body.sale_id);
  }
  if (body.description !== undefined) {
    updates.push('description = ?');
    args.push(body.description);
  }
  if (body.category !== undefined) {
    updates.push('category = ?');
    args.push(body.category);
  }
  if (body.subcategory !== undefined) {
    updates.push('subcategory = ?');
    args.push(body.subcategory);
  }
  if (body.amount !== undefined) {
    updates.push('amount = ?');
    args.push(Number(body.amount));
  }
  if (updates.length) {
    updates.push("updated_at = datetime('now')");
    args.push(id);
    await database.runAsync(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`, args);
  }
  const row = await database.getFirstAsync<any>('SELECT * FROM expenses WHERE id = ?', [id]);
  return { expense: row };
}

export async function deleteExpense(id: number): Promise<{ ok: boolean }> {
  const database = await getDb();
  await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  return { ok: true };
}

// —— Expenses ——
export async function getExpenses(params?: { sale_id?: string; category?: string }): Promise<{ expenses: unknown[] }> {
  const database = await getDb();
  let sql = 'SELECT * FROM expenses';
  const args: (string | number)[] = [];
  if (params?.sale_id) {
    sql += ' WHERE sale_id = ?';
    args.push(params.sale_id);
  }
  if (params?.category) {
    sql += (args.length ? ' AND ' : ' WHERE ') + 'category = ?';
    args.push(params.category);
  }
  sql += ' ORDER BY created_at DESC LIMIT 500';
  const rows = args.length ? await database.getAllAsync<any>(sql, args) : await database.getAllAsync<any>(sql);
  return { expenses: rows };
}

export async function createExpense(body: {
  sale_id?: number | null;
  description?: string | null;
  category?: string | null;
  subcategory?: string | null;
  amount: number;
}): Promise<{ expense: any }> {
  const database = await getDb();
  const { lastInsertRowId } = await database.runAsync(
    'INSERT INTO expenses (sale_id, description, category, subcategory, amount) VALUES (?, ?, ?, ?, ?)',
    [body.sale_id ?? null, body.description ?? null, body.category ?? null, body.subcategory ?? null, Number(body.amount)]
  );
  const row = await database.getFirstAsync<any>('SELECT * FROM expenses WHERE id = ?', [lastInsertRowId]);
  return { expense: row };
}

// —— Assets ——
export async function getAssets(): Promise<{ assets: unknown[] }> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>('SELECT * FROM assets ORDER BY created_at DESC LIMIT 500');
  return { assets: rows };
}

export async function createAsset(body: {
  name: string;
  category?: string | null;
  value?: number | null;
  source?: string | null;
  status?: string | null;
  date?: string | null;
}): Promise<{ asset: any }> {
  const database = await getDb();
  const { lastInsertRowId } = await database.runAsync(
    'INSERT INTO assets (name, category, value, source, status, date) VALUES (?, ?, ?, ?, ?, ?)',
    [
      body.name.trim(),
      body.category ?? null,
      body.value != null ? Number(body.value) : null,
      body.source ?? null,
      body.status ?? null,
      body.date ?? null,
    ]
  );
  const row = await database.getFirstAsync<any>('SELECT * FROM assets WHERE id = ?', [lastInsertRowId]);
  return { asset: row };
}

export async function updateAsset(id: number, body: Partial<{ name: string; category: string | null; value: number | null; source: string | null; status: string | null; date: string | null }>): Promise<{ asset: any }> {
  const database = await getDb();
  const updates: string[] = [];
  const args: any[] = [];
  if (body.name !== undefined) {
    updates.push('name = ?');
    args.push(body.name.trim());
  }
  if (body.category !== undefined) {
    updates.push('category = ?');
    args.push(body.category);
  }
  if (body.value !== undefined) {
    updates.push('value = ?');
    args.push(body.value != null ? Number(body.value) : null);
  }
  if (body.source !== undefined) {
    updates.push('source = ?');
    args.push(body.source);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    args.push(body.status);
  }
  if (body.date !== undefined) {
    updates.push('date = ?');
    args.push(body.date);
  }
  if (updates.length) {
    updates.push("updated_at = datetime('now')");
    args.push(id);
    await database.runAsync(`UPDATE assets SET ${updates.join(', ')} WHERE id = ?`, args);
  }
  const row = await database.getFirstAsync<any>('SELECT * FROM assets WHERE id = ?', [id]);
  return { asset: row };
}

export async function deleteAsset(id: number): Promise<{ ok: boolean }> {
  const database = await getDb();
  await database.runAsync('DELETE FROM assets WHERE id = ?', [id]);
  return { ok: true };
}

// —— Vouchers ——
export async function getVouchers(): Promise<{ vouchers: unknown[] }> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>('SELECT * FROM vouchers ORDER BY id DESC LIMIT 500');
  return { vouchers: rows };
}

function randomCode(prefix: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = prefix;
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function generateVouchers(body: {
  count: number;
  package_name?: string;
  price?: number | null;
  duration_minutes?: number | null;
}): Promise<{ vouchers: any[] }> {
  const database = await getDb();
  const prefix = 'SL-';
  const created: any[] = [];
  for (let i = 0; i < body.count; i++) {
    let code = randomCode(prefix);
    let exists = await database.getFirstAsync<any>('SELECT id FROM vouchers WHERE code = ?', [code]);
    while (exists) {
      code = randomCode(prefix);
      exists = await database.getFirstAsync<any>('SELECT id FROM vouchers WHERE code = ?', [code]);
    }
    await database.runAsync(
      'INSERT INTO vouchers (code, package_name, price, duration_minutes, status) VALUES (?, ?, ?, ?, ?)',
      [code, body.package_name ?? 'Default', body.price ?? null, body.duration_minutes ?? null, 'unused']
    );
    const row = await database.getFirstAsync<any>('SELECT * FROM vouchers WHERE code = ?', [code]);
    if (row) created.push(row);
  }
  return { vouchers: created };
}

export async function sellVouchers(body: { codes?: string[] }): Promise<{ vouchers: any[] }> {
  const database = await getDb();
  const codes = body.codes ?? [];
  const now = new Date().toISOString();
  const updated: any[] = [];
  for (const code of codes) {
    const trimmed = code.trim();
    if (!trimmed) continue;
    await database.runAsync("UPDATE vouchers SET status = 'sold', sold_at = ? WHERE code = ?", [now, trimmed]);
    const row = await database.getFirstAsync<any>('SELECT * FROM vouchers WHERE code = ?', [trimmed]);
    if (row) updated.push(row);
  }
  return { vouchers: updated };
}

// —— Settings ——
const ALLOWED_KEYS = ['business', 'revenue_sources', 'voucher_packages', 'fixed_costs', 'expense_categories', 'subscriptions'];

function getDefault(key: string): unknown {
  switch (key) {
    case 'business':
      return { name: '', tagline: '', owner: '', phone: '', addr: '', logo: '' };
    case 'revenue_sources':
    case 'voucher_packages':
    case 'fixed_costs':
    case 'expense_categories':
    case 'subscriptions':
      return [];
    default:
      return null;
  }
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      out[row.key] = JSON.parse(row.value);
    } catch {
      out[row.key] = row.value;
    }
  }
  for (const key of ALLOWED_KEYS) {
    if (!(key in out)) out[key] = getDefault(key);
  }
  return out;
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  if (!ALLOWED_KEYS.includes(key)) throw new Error(`Invalid settings key: ${key}`);
  const database = await getDb();
  const valueStr = JSON.stringify(value);
  await database.runAsync(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
    [key, valueStr]
  );
}

// —— Login log (stamp when user signs in) ——
export interface LoginLogEntry {
  id: number;
  user_id: number;
  user_name: string;
  source: string;
  created_at: string;
}

export async function recordLoginStamp(userId: number, userName: string, source: 'local' | 'remote' = 'remote'): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO login_log (user_id, user_name, source) VALUES (?, ?, ?)',
    [userId, userName || 'Unknown', source]
  );
}

export async function getLoginLog(limit = 100): Promise<LoginLogEntry[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<LoginLogEntry>(
    'SELECT id, user_id, user_name, source, created_at FROM login_log ORDER BY created_at DESC LIMIT ?',
    [limit]
  );
  return rows;
}
