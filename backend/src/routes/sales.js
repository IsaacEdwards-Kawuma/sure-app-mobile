import { Router } from 'express';
import { query } from '../db/index.js';
import { logAdmin } from '../db/adminLog.js';

const router = Router();

function getWeek(dateStr) {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const iso = start.toISOString().slice(0, 10);
  return parseInt(iso.replace(/-/g, ''), 10) || null;
}

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 500, 500);
    const result = await query(
      'SELECT s.*, u.name as attendant_name FROM sales s LEFT JOIN users u ON u.id = s.attendant_id ORDER BY s.date DESC, s.id DESC LIMIT $1',
      [limit]
    );
    res.json({ sales: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { date, attendant_id, total_revenue, revenue_sources, notes, downtime } = req.body;
    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }
    const week = getWeek(date);
    const result = await query(
      `INSERT INTO sales (date, week, attendant_id, total_revenue, revenue_sources, notes, downtime)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, date, week, attendant_id, total_revenue, revenue_sources, notes, downtime, created_at, updated_at`,
      [
        date,
        week,
        attendant_id || null,
        total_revenue != null ? Number(total_revenue) : 0,
        revenue_sources ? JSON.stringify(revenue_sources) : '{}',
        notes || null,
        downtime != null ? Number(downtime) : 0,
      ]
    );
    const row = result.rows[0];
    try {
      await logAdmin('Sale Created', { date: row.date, total_revenue: row.total_revenue }, req.user?.userId);
    } catch (logErr) {
      console.error('Admin log failed:', logErr);
    }
    res.status(201).json({ sale: row });
  } catch (err) {
    console.error('Sale create error:', err);
    const message = err.message || 'Failed to create sale';
    res.status(500).json({ error: message });
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT s.*, u.name as attendant_name FROM sales s LEFT JOIN users u ON u.id = s.attendant_id WHERE s.id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Sale not found' });
    res.json({ sale: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { date, attendant_id, total_revenue, revenue_sources, notes, downtime, reason } = req.body;
    const id = req.params.id;
    const existing = await query('SELECT id FROM sales WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Sale not found' });

    const updates = [];
    const params = [];
    let i = 1;
    if (date !== undefined) {
      updates.push(`date = $${i++}`); params.push(date);
      updates.push(`week = $${i++}`); params.push(getWeek(date));
    }
    if (attendant_id !== undefined) { updates.push(`attendant_id = $${i++}`); params.push(attendant_id); }
    if (total_revenue !== undefined) { updates.push(`total_revenue = $${i++}`); params.push(Number(total_revenue)); }
    if (revenue_sources !== undefined) { updates.push(`revenue_sources = $${i++}`); params.push(JSON.stringify(revenue_sources)); }
    if (notes !== undefined) { updates.push(`notes = $${i++}`); params.push(notes); }
    if (downtime !== undefined) { updates.push(`downtime = $${i++}`); params.push(Number(downtime)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = $${i++}`);
    params.push(new Date().toISOString());
    params.push(id);
    const idParam = params.length;
    await query(
      `UPDATE sales SET ${updates.join(', ')} WHERE id = $${idParam}`,
      params
    );
    await logAdmin('Sale Updated', { id, reason: reason || null }, req.user?.userId);
    const result = await query('SELECT * FROM sales WHERE id = $1', [id]);
    res.json({ sale: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { reason } = req.body || {};
    const id = req.params.id;
    const existing = await query('SELECT id FROM sales WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Sale not found' });
    await query('DELETE FROM expenses WHERE sale_id = $1', [id]);
    await query('DELETE FROM sales WHERE id = $1', [id]);
    await logAdmin('Sale Deleted', { id, reason: reason || null }, req.user?.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as salesRouter };
