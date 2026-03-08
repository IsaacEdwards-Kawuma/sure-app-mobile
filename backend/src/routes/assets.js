import { Router } from 'express';
import { query } from '../db/index.js';
import { logAdmin } from '../db/adminLog.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM assets ORDER BY created_at DESC LIMIT 500');
    res.json({ assets: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, value, source, status, date } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const result = await query(
      `INSERT INTO assets (name, category, value, source, status, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, category, value, source, status, date, created_at, updated_at`,
      [
        name.trim(),
        category || null,
        value != null ? Number(value) : null,
        source || null,
        status || null,
        date || null,
      ]
    );
    const row = result.rows[0];
    await logAdmin('Asset Created', { name: row.name }, req.user?.userId);
    res.status(201).json({ asset: row });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Asset not found' });
    res.json({ asset: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, category, value, source, status, date } = req.body;
    const id = req.params.id;
    const existing = await query('SELECT id FROM assets WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Asset not found' });

    const updates = [];
    const params = [];
    let i = 1;
    if (name !== undefined) { updates.push(`name = $${i++}`); params.push(name.trim()); }
    if (category !== undefined) { updates.push(`category = $${i++}`); params.push(category); }
    if (value !== undefined) { updates.push(`value = $${i++}`); params.push(value != null ? Number(value) : null); }
    if (source !== undefined) { updates.push(`source = $${i++}`); params.push(source); }
    if (status !== undefined) { updates.push(`status = $${i++}`); params.push(status); }
    if (date !== undefined) { updates.push(`date = $${i++}`); params.push(date); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = $${i++}`);
    params.push(new Date().toISOString());
    params.push(id);
    await query(`UPDATE assets SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    await logAdmin('Asset Updated', { id }, req.user?.userId);
    const result = await query('SELECT * FROM assets WHERE id = $1', [id]);
    res.json({ asset: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await query('SELECT id FROM assets WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Asset not found' });
    await query('DELETE FROM assets WHERE id = $1', [id]);
    await logAdmin('Asset Deleted', { id }, req.user?.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as assetsRouter };
