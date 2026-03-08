/**
 * Local SQLite database — same schema as backend so the app works independently.
 * Uses expo-sqlite; no backend required.
 */
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'surelink.db';

let db: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'attendant',
    permissions TEXT NOT NULL DEFAULT 'entry',
    active INTEGER NOT NULL DEFAULT 1,
    id_number TEXT,
    phone TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    week INTEGER,
    attendant_id INTEGER REFERENCES users(id),
    total_revenue REAL NOT NULL DEFAULT 0,
    revenue_sources TEXT DEFAULT '{}',
    notes TEXT,
    downtime INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER REFERENCES sales(id),
    description TEXT,
    category TEXT,
    subcategory TEXT,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    package_id INTEGER,
    package_name TEXT,
    price REAL,
    duration_minutes INTEGER,
    status TEXT NOT NULL DEFAULT 'unused',
    sold_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    value REAL,
    source TEXT,
    status TEXT,
    date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    details TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS login_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'local',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
  CREATE INDEX IF NOT EXISTS idx_login_log_created ON login_log(created_at);
  CREATE INDEX IF NOT EXISTS idx_sales_attendant ON sales(attendant_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_sale ON expenses(sale_id);
  CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
  CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
`;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(SCHEMA);
    return db;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Could not open database: ${msg}`);
  }
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
