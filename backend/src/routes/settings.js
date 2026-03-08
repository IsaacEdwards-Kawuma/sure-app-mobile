import { Router } from 'express';
import { getAllSettings, saveSetting, ALLOWED_KEYS } from '../db/settings.js';
import { requirePermission } from '../middleware/auth.js';
import { logAdmin } from '../db/adminLog.js';

const router = Router();

// GET /api/settings — all keys (any logged-in user)
router.get('/', async (req, res, next) => {
  try {
    const settings = await getAllSettings();
    const out = {};
    for (const key of ALLOWED_KEYS) {
      out[key] = settings[key] ?? getDefault(key);
    }
    res.json(out);
  } catch (err) {
    next(err);
  }
});

function getDefault(key) {
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

// PUT /api/settings/:key — admin only
router.put('/:key', requirePermission('all'), async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!ALLOWED_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Invalid settings key' });
    }
    await saveSetting(key, req.body);
    await logAdmin('Settings Updated', { key }, req.user?.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as settingsRouter };
