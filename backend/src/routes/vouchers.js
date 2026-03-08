import { Router } from 'express';
import { query } from '../db/index.js';
import { logAdmin } from '../db/adminLog.js';
import { randomBytes } from 'crypto';

const router = Router();

function generateCode(prefix = 'SL') {
  const hex = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${hex}`;
}

router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status; // unused | sold
    let sql = 'SELECT * FROM vouchers ORDER BY id DESC LIMIT 1000';
    const params = [];
    if (status) {
      sql = 'SELECT * FROM vouchers WHERE status = $1 ORDER BY id DESC LIMIT 1000';
      params.push(status);
    }
    const result = await query(sql, params);
    res.json({ vouchers: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/batch', async (req, res, next) => {
  try {
    const { count, package_id, package_name, price, duration_minutes, code_prefix } = req.body;
    const n = Math.min(Math.max(parseInt(count, 10) || 1, 1), 500);
    const pkgName = package_name || 'Default';
    const pkgId = package_id != null ? package_id : null;
    const pkgPrice = price != null ? Number(price) : null;
    const duration = duration_minutes != null ? parseInt(duration_minutes, 10) : null;
    const prefix = (code_prefix || 'SL').toString().slice(0, 8);

    const inserted = [];
    for (let i = 0; i < n; i++) {
      let code = generateCode(prefix);
      let attempts = 0;
      while (attempts < 10) {
        const exists = await query('SELECT id FROM vouchers WHERE code = $1', [code]);
        if (!exists.rows[0]) break;
        code = generateCode(prefix);
        attempts++;
      }
      const result = await query(
        `INSERT INTO vouchers (code, package_id, package_name, price, duration_minutes, status)
         VALUES ($1, $2, $3, $4, $5, 'unused')
         RETURNING id, code, package_id, package_name, price, duration_minutes, status, created_at`,
        [code, pkgId, pkgName, pkgPrice, duration]
      );
      inserted.push(result.rows[0]);
    }
    await logAdmin('Vouchers Generated', { count: inserted.length, package_name: pkgName }, req.user?.userId);
    res.status(201).json({ vouchers: inserted });
  } catch (err) {
    next(err);
  }
});

router.post('/sell', async (req, res, next) => {
  try {
    const { voucher_ids, codes, sale_id } = req.body;
    const ids = voucher_ids || [];
    const codeList = codes || [];
    if (ids.length === 0 && codeList.length === 0) {
      return res.status(400).json({ error: 'Provide voucher_ids or codes' });
    }

    let toSell = [];
    if (ids.length) {
      const result = await query(
        "SELECT id, code, status FROM vouchers WHERE id IN (" + ids.map((_, i) => '$' + (i + 1)).join(',') + ") AND status = 'unused'",
        ids
      );
      toSell = result.rows;
    }
    if (codeList.length) {
      for (const code of codeList) {
        const result = await query("SELECT id, code, status FROM vouchers WHERE code = $1 AND status = 'unused'", [code.trim()]);
        if (result.rows[0] && !toSell.find((r) => r.id === result.rows[0].id)) toSell.push(result.rows[0]);
      }
    }

    if (toSell.length === 0) {
      return res.status(400).json({ error: 'No unused vouchers found for the given ids/codes' });
    }

    const now = new Date().toISOString();
    for (const v of toSell) {
      await query(
        "UPDATE vouchers SET status = 'sold', sold_at = $1 WHERE id = $2",
        [now, v.id]
      );
    }
    await logAdmin('Vouchers Sold', { count: toSell.length, sale_id: sale_id || null }, req.user?.userId);
    const updated = await query(
      'SELECT * FROM vouchers WHERE id IN (' + toSell.map((_, i) => '$' + (i + 1)).join(',') + ')',
      toSell.map((r) => r.id)
    );
    res.json({ vouchers: updated.rows });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await query('SELECT id, code, status FROM vouchers WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Voucher not found' });
    await query('DELETE FROM vouchers WHERE id = $1', [id]);
    await logAdmin('Voucher Deleted', { id, code: existing.rows[0].code }, req.user?.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as vouchersRouter };
