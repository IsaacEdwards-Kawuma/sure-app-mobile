import { Router } from 'express';
import bcrypt from 'bcrypt';
import { requirePermission } from '../middleware/auth.js';
import { query } from '../db/index.js';
import { logAdmin } from '../db/adminLog.js';
import { logger } from '../lib/logger.js';

const router = Router();
const DEFAULT_RESTORED_PIN = '0000';
const SALT_ROUNDS = 10;

router.get('/download', requirePermission('all'), async (req, res, next) => {
  try {
    const [sales, vouchers, expenses, assets, settings, users, adminLog] = await Promise.all([
      query('SELECT * FROM sales ORDER BY id').then((r) => r.rows),
      query('SELECT * FROM vouchers ORDER BY id').then((r) => r.rows),
      query('SELECT * FROM expenses ORDER BY id').then((r) => r.rows),
      query('SELECT * FROM assets ORDER BY id').then((r) => r.rows),
      query('SELECT key, value FROM settings').then((r) => r.rows),
      query('SELECT id, name, role, permissions, active, id_number, phone, created_at, updated_at FROM users ORDER BY id').then((r) => r.rows),
      query('SELECT * FROM admin_log ORDER BY id DESC LIMIT 500').then((r) => r.rows),
    ]);

    const settingsObj = {};
    for (const row of settings) {
      settingsObj[row.key] = row.value;
    }

    const backup = {
      exportedAt: new Date().toISOString(),
      sales,
      vouchers,
      expenses,
      assets,
      settings: settingsObj,
      users,
      admin_log: adminLog,
    };

    await logAdmin('Data Export', { detail: 'Full JSON backup downloaded' }, req.user?.userId);

    const filename = `wifi-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    next(err);
  }
});

router.post('/restore', requirePermission('all'), async (req, res, next) => {
  try {
    const backup = req.body;
    if (!backup || typeof backup !== 'object') {
      return res.status(400).json({ error: 'Send backup JSON in request body (same format as download)' });
    }
    const defaultPinHash = await bcrypt.hash(DEFAULT_RESTORED_PIN, SALT_ROUNDS);

    await query('BEGIN');
    try {
      await query('DELETE FROM admin_log');
      await query('DELETE FROM expenses');
      await query('DELETE FROM sales');
      await query('DELETE FROM vouchers');
      await query('DELETE FROM assets');
      await query('DELETE FROM settings');
      await query('DELETE FROM users');

      const users = Array.isArray(backup.users) ? backup.users : [];
      for (const u of users) {
        await query(
          `INSERT INTO users (id, name, pin_hash, role, permissions, active, id_number, phone, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz)
           ON CONFLICT (id) DO NOTHING`,
          [
            u.id,
            u.name,
            defaultPinHash,
            u.role || 'attendant',
            typeof u.permissions === 'string' ? u.permissions : 'entry',
            u.active !== false,
            u.id_number ?? null,
            u.phone ?? null,
            u.created_at || new Date().toISOString(),
            u.updated_at || new Date().toISOString(),
          ]
        );
      }
      const settings = backup.settings && typeof backup.settings === 'object' ? backup.settings : {};
      for (const [key, value] of Object.entries(settings)) {
        await query(
          'INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
          [key, JSON.stringify(value)]
        );
      }
      const sales = Array.isArray(backup.sales) ? backup.sales : [];
      for (const s of sales) {
        await query(
          `INSERT INTO sales (id, date, week, attendant_id, total_revenue, revenue_sources, notes, downtime, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::timestamptz, $10::timestamptz)`,
          [
            s.id,
            s.date,
            s.week ?? null,
            s.attendant_id ?? null,
            s.total_revenue ?? 0,
            s.revenue_sources ? JSON.stringify(s.revenue_sources) : '{}',
            s.notes ?? null,
            s.downtime === true,
            s.created_at || new Date().toISOString(),
            s.updated_at || new Date().toISOString(),
          ]
        );
      }
      const expenses = Array.isArray(backup.expenses) ? backup.expenses : [];
      for (const e of expenses) {
        await query(
          `INSERT INTO expenses (id, sale_id, description, category, subcategory, amount, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::timestamptz)`,
          [
            e.id,
            e.sale_id ?? null,
            e.description ?? null,
            e.category ?? null,
            e.subcategory ?? null,
            e.amount ?? 0,
            e.created_at || new Date().toISOString(),
            e.updated_at || new Date().toISOString(),
          ]
        );
      }
      const vouchers = Array.isArray(backup.vouchers) ? backup.vouchers : [];
      for (const v of vouchers) {
        await query(
          `INSERT INTO vouchers (id, code, package_id, package_name, price, duration_minutes, status, sold_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz)`,
          [
            v.id,
            v.code,
            v.package_id ?? null,
            v.package_name ?? null,
            v.price ?? null,
            v.duration_minutes ?? null,
            v.status || 'unused',
            v.sold_at ?? null,
            v.created_at || new Date().toISOString(),
          ]
        );
      }
      const assets = Array.isArray(backup.assets) ? backup.assets : [];
      for (const a of assets) {
        await query(
          `INSERT INTO assets (id, name, category, value, source, status, date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz)`,
          [
            a.id,
            a.name,
            a.category ?? null,
            a.value ?? null,
            a.source ?? null,
            a.status ?? null,
            a.date ?? null,
            a.created_at || new Date().toISOString(),
            a.updated_at || new Date().toISOString(),
          ]
        );
      }
      const adminLog = Array.isArray(backup.admin_log) ? backup.admin_log : [];
      for (const al of adminLog) {
        await query(
          'INSERT INTO admin_log (id, action, details, user_id, created_at) VALUES ($1, $2, $3, $4, $5::timestamptz)',
          [
            al.id,
            al.action,
            al.details ? JSON.stringify(al.details) : null,
            al.user_id ?? null,
            al.created_at || new Date().toISOString(),
          ]
        );
      }

      for (const table of ['users', 'sales', 'expenses', 'vouchers', 'assets', 'admin_log']) {
        await query(
          `SELECT setval(pg_get_serial_sequence($1, 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${table}))`,
          [table]
        );
      }
      await query('COMMIT');
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }

    await logAdmin('Data Restore', { detail: 'Full restore from backup' }, req.user?.userId);
    logger.info('Backup restored', { userId: req.user?.userId });
    res.json({ message: 'Restore complete. All restored users have temporary PIN 0000 — change after login.' });
  } catch (err) {
    next(err);
  }
});

export { router as backupRouter };
