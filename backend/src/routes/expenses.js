import { Router } from 'express';
import { query } from '../db/index.js';
import { logAdmin } from '../db/adminLog.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const saleId = req.query.sale_id;
    const category = req.query.category;
    let sql = 'SELECT * FROM expenses';
    const params = [];
    const where = [];
    if (saleId !== undefined && saleId !== '') {
      where.push('sale_id = $' + (params.length + 1));
      params.push(saleId);
    }
    if (category !== undefined && category !== '') {
      where.push('category = $' + (params.length + 1));
      params.push(category);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY created_at DESC LIMIT 500';
    const result = await query(sql, params);
    res.json({ expenses: result.rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { sale_id, description, category, subcategory, amount } = req.body;
    if (amount == null || amount === '') {
      return res.status(400).json({ error: 'amount is required' });
    }
    const result = await query(
      `INSERT INTO expenses (sale_id, description, category, subcategory, amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sale_id, description, category, subcategory, amount, created_at, updated_at`,
      [sale_id || null, description || null, category || null, subcategory || null, Number(amount)]
    );
    const row = result.rows[0];
    await logAdmin('Expense Created', { amount: row.amount, category: row.category }, req.user?.userId);
    res.status(201).json({ expense: row });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM expenses WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Expense not found' });
    res.json({ expense: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { sale_id, description, category, subcategory, amount } = req.body;
    const id = req.params.id;
    const existing = await query('SELECT id FROM expenses WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Expense not found' });

    const updates = [];
    const params = [];
    let i = 1;
    if (sale_id !== undefined) { updates.push(`sale_id = $${i++}`); params.push(sale_id); }
    if (description !== undefined) { updates.push(`description = $${i++}`); params.push(description); }
    if (category !== undefined) { updates.push(`category = $${i++}`); params.push(category); }
    if (subcategory !== undefined) { updates.push(`subcategory = $${i++}`); params.push(subcategory); }
    if (amount !== undefined) { updates.push(`amount = $${i++}`); params.push(Number(amount)); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = $${i++}`);
    params.push(new Date().toISOString());
    params.push(id);
    await query(`UPDATE expenses SET ${updates.join(', ')} WHERE id = $${params.length}`, params);
    await logAdmin('Expense Updated', { id }, req.user?.userId);
    const result = await query('SELECT * FROM expenses WHERE id = $1', [id]);
    res.json({ expense: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await query('SELECT id FROM expenses WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Expense not found' });
    await query('DELETE FROM expenses WHERE id = $1', [id]);
    await logAdmin('Expense Deleted', { id }, req.user?.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as expensesRouter };
