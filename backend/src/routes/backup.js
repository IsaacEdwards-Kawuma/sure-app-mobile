import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import { query } from '../db/index.js';
import { logAdmin } from '../db/adminLog.js';

const router = Router();

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

router.post('/restore', requirePermission('all'), (req, res) => {
  res.status(501).json({ error: 'Not implemented: restore from backup' });
});

export { router as backupRouter };
