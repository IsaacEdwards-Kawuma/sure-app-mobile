import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';
import { logAdmin } from '../db/adminLog.js';
import { JWT_SECRET } from '../config.js';
import { validateRegister, validateLogin, validateUpdateMe } from '../lib/validate.js';
import { logger } from '../lib/logger.js';

const router = Router();
const SALT_ROUNDS = 10;

// GET /api/auth/first-run — true when no users exist (show registration)
router.get('/first-run', async (req, res, next) => {
  try {
    const result = await query('SELECT COUNT(*) as c FROM users');
    const count = result.rows[0]?.c ?? 0;
    res.json({ firstRun: Number(count) === 0 });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/users — active users for login dropdown (alias for GET /api/users)
router.get('/users', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, role, active FROM users WHERE active = 1 ORDER BY name'
    );
    res.json({ users: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register — role: 'user' (attendant) or 'admin'. Multiple admins allowed.
router.post('/register', async (req, res, next) => {
  try {
    const { name, pin, role, errors } = validateRegister(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors[0] });
    }
    const isAdmin = role === 'admin';

    const hashedPin = await bcrypt.hash(pin, SALT_ROUNDS);
    const dbRole = isAdmin ? 'admin' : 'attendant';
    const permissions = isAdmin ? 'all' : 'entry';
    const result = await query(
      `INSERT INTO users (name, pin_hash, role, permissions, active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, name, role, permissions, active, created_at`,
      [name, hashedPin, dbRole, permissions]
    );
    const user = result.rows[0];
    await logAdmin(
      isAdmin ? 'Admin Account Created' : 'User Account Created',
      { name: user.name, role: user.role },
      user.id
    );
    const token = jwt.sign(
      { userId: user.id, permissions: user.permissions },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, permissions: user.permissions } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { userId, pin, errors } = validateLogin(req.body);
    if (errors.length) {
      return res.status(400).json({ error: errors[0] });
    }
    const result = await query(
      'SELECT id, name, pin_hash, role, permissions, active FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const match = await bcrypt.compare(pin, user.pin_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user.id, permissions: user.permissions },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, permissions: user.permissions },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — requires auth (use optional auth or separate protected route in app)
router.get('/me', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await query(
      'SELECT id, name, role, permissions, active, id_number, phone, created_at FROM users WHERE id = $1',
      [payload.userId]
    );
    const user = result.rows[0];
    if (!user || !user.active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        id_number: user.id_number,
        phone: user.phone,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// PUT /api/auth/me — update current user profile (name, phone, change PIN)
router.put('/me', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = payload.userId;

    const validated = validateUpdateMe(req.body);
    if (validated.errors.length) {
      return res.status(400).json({ error: validated.errors[0] });
    }
    const { name, phone, current_pin, new_pin } = validated;

    const result = await query(
      'SELECT id, name, role, permissions, active, id_number, phone, pin_hash FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    if (!user || user.active !== 1) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    if (new_pin != null) {
      if (!current_pin) {
        return res.status(400).json({ error: 'Current PIN required to set a new PIN' });
      }
      const match = await bcrypt.compare(current_pin, user.pin_hash);
      if (!match) {
        return res.status(401).json({ error: 'Current PIN is incorrect' });
      }
    }

    const newName = name != null ? name : user.name;
    const newPhone = phone != null ? phone : user.phone;

    const now = new Date().toISOString();
    if (new_pin != null) {
      const hashedPin = await bcrypt.hash(new_pin, SALT_ROUNDS);
      await query(
        'UPDATE users SET name = $1, phone = $2, pin_hash = $3, updated_at = $4 WHERE id = $5',
        [newName, newPhone || null, hashedPin, now, userId]
      );
    } else {
      await query(
        'UPDATE users SET name = $1, phone = $2, updated_at = $3 WHERE id = $4',
        [newName, newPhone || null, now, userId]
      );
    }

    const updated = await query(
      'SELECT id, name, role, permissions, id_number, phone, created_at FROM users WHERE id = $1',
      [userId]
    );
    const u = updated.rows[0];
    res.json({
      user: {
        id: u.id,
        name: u.name,
        role: u.role,
        permissions: u.permissions,
        id_number: u.id_number,
        phone: u.phone,
        created_at: u.created_at,
      },
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(err);
  }
});

// POST /api/auth/forgot-pin — no email; instruct user to contact admin
router.post('/forgot-pin', async (req, res) => {
  res.json({
    message: 'PIN cannot be recovered. Ask an admin to reset your PIN (Settings → Users → edit user → set new PIN).',
  });
});

// POST /api/auth/reset-pin — admin only: set another user's PIN (body: user_id, new_pin)
router.post('/reset-pin', async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    const adminResult = await query(
      'SELECT id, role, permissions FROM users WHERE id = $1 AND active = true',
      [payload.userId]
    );
    const admin = adminResult.rows[0];
    if (!admin || (admin.permissions !== 'all' && !String(admin.permissions).includes('all'))) {
      return res.status(403).json({ error: 'Admin only' });
    }
    const user_id = req.body?.user_id != null ? Number(req.body.user_id) : NaN;
    const new_pin = req.body?.new_pin != null ? String(req.body.new_pin) : '';
    if (!Number.isInteger(user_id) || user_id < 1 || !/^\d{4}$/.test(new_pin)) {
      return res.status(400).json({ error: 'user_id (number) and new_pin (4 digits) required' });
    }
    const hashedPin = await bcrypt.hash(new_pin, SALT_ROUNDS);
    const update = await query(
      'UPDATE users SET pin_hash = $1, updated_at = $2 WHERE id = $3 RETURNING id, name',
      [hashedPin, new Date().toISOString(), user_id]
    );
    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    await logAdmin('PIN Reset', { targetUserId: user_id, targetName: update.rows[0].name }, payload.userId);
    logger.info('PIN reset', { targetUserId: user_id, byAdminId: payload.userId });
    res.json({ message: 'PIN updated' });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    next(err);
  }
});

export { router as authRouter };
