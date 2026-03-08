import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/index.js';
import { authMiddleware, requirePermission } from '../middleware/auth.js';
import { logAdmin } from '../db/adminLog.js';

const router = Router();
const SALT_ROUNDS = 10;

function parsePermissions(p) {
  if (!p) return 'entry';
  if (typeof p === 'string' && p === 'all') return 'all';
  if (typeof p === 'string') {
    try {
      const arr = JSON.parse(p);
      return Array.isArray(arr) ? arr : p;
    } catch {
      return p;
    }
  }
  return Array.isArray(p) ? p : p;
}

function serializePermissions(p) {
  if (p === 'all') return 'all';
  if (Array.isArray(p)) return JSON.stringify(p);
  return String(p);
}

// GET /api/users — list users (public for login dropdown; only active for dropdown, but we return all for admin)
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, role, permissions, active, id_number, phone, created_at FROM users ORDER BY name'
    );
    const users = result.rows.map((u) => ({
      ...u,
      permissions: parsePermissions(u.permissions),
    }));
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// POST /api/users — admin add user
router.post('/', authMiddleware, requirePermission('all'), async (req, res, next) => {
  try {
    const { name, id_number, role, phone, pin, permissions } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!pin || String(pin).length !== 4) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }
    const perms = permissions === 'all' || (Array.isArray(permissions) && permissions.includes('all'))
      ? 'all'
      : serializePermissions(Array.isArray(permissions) ? permissions : []);
    const pinHash = await bcrypt.hash(String(pin), SALT_ROUNDS);
    const result = await query(
      `INSERT INTO users (name, pin_hash, role, permissions, active, id_number, phone)
       VALUES ($1, $2, $3, $4, true, $5, $6)
       RETURNING id, name, role, permissions, active, id_number, phone, created_at`,
      [name.trim(), pinHash, role || 'attendant', perms, id_number || null, phone || null]
    );
    const user = result.rows[0];
    await logAdmin('User Created', { name: user.name, role: user.role }, req.user?.userId);
    res.status(201).json({
      user: { ...user, permissions: parsePermissions(user.permissions) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', authMiddleware, requirePermission('all'), async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, role, permissions, active, id_number, phone, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({ user: { ...u, permissions: parsePermissions(u.permissions) } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id
router.put('/:id', authMiddleware, requirePermission('all'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const { name, id_number, role, phone, pin, permissions } = req.body;
    const current = await query(
      'SELECT id, name, role, id_number, phone FROM users WHERE id = $1',
      [id]
    );
    if (!current.rows[0]) return res.status(404).json({ error: 'User not found' });
    const c = current.rows[0];

    const newName = name != null ? String(name).trim() : c.name;
    const newIdNumber = id_number != null ? id_number : c.id_number;
    const newRole = role != null ? role : c.role;
    const newPhone = phone != null ? phone : c.phone;
    const perms = permissions === 'all' || (Array.isArray(permissions) && permissions.includes('all'))
      ? 'all'
      : serializePermissions(Array.isArray(permissions) ? permissions : []);

    const now = new Date().toISOString();
    if (pin != null && String(pin).length === 4) {
      const pinHash = await bcrypt.hash(String(pin), SALT_ROUNDS);
      await query(
        `UPDATE users SET name = $1, id_number = $2, role = $3, phone = $4, permissions = $5, pin_hash = $6, updated_at = $7 WHERE id = $8`,
        [newName, newIdNumber, newRole, newPhone, perms, pinHash, now, id]
      );
    } else {
      await query(
        `UPDATE users SET name = $1, id_number = $2, role = $3, phone = $4, permissions = $5, updated_at = $6 WHERE id = $7`,
        [newName, newIdNumber, newRole, newPhone, perms, now, id]
      );
    }
    await logAdmin('User Updated', { name: newName }, req.user?.userId);
    const updated = await query(
      'SELECT id, name, role, permissions, active, id_number, phone FROM users WHERE id = $1',
      [id]
    );
    res.json({ user: { ...updated.rows[0], permissions: parsePermissions(updated.rows[0].permissions) } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/toggle — activate/deactivate
router.patch('/:id/toggle', authMiddleware, requirePermission('all'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await query('SELECT id, name, active FROM users WHERE id = $1', [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    const newActive = !result.rows[0].active;
    await query('UPDATE users SET active = $1, updated_at = $2 WHERE id = $3', [newActive, new Date().toISOString(), id]);
    await logAdmin(newActive ? 'User Activated' : 'User Deactivated', { name: result.rows[0].name }, req.user?.userId);
    res.json({ active: newActive });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, requirePermission('all'), async (req, res, next) => {
  try {
    const id = req.params.id;
    const countResult = await query('SELECT COUNT(*) as c FROM users WHERE active = true');
    const userResult = await query('SELECT id, name FROM users WHERE id = $1', [id]);
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    const activeCount = parseInt(countResult.rows[0].c, 10);
    const isTargetActive = await query('SELECT active FROM users WHERE id = $1', [id]).then((r) => r.rows[0]?.active);
    if (isTargetActive && activeCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last active user' });
    }
    await query('DELETE FROM users WHERE id = $1', [id]);
    await logAdmin('User Deleted', { name: userResult.rows[0].name }, req.user?.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as usersRouter };
