import { Router } from 'express';
import { getAdminLog, clearAdminLog } from '../db/adminLog.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.get('/', requirePermission('all'), async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 300, 500);
    const entries = await getAdminLog(limit);
    res.json({ entries });
  } catch (err) {
    next(err);
  }
});

router.delete('/', requirePermission('all'), async (req, res, next) => {
  try {
    await clearAdminLog(req.user?.userId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export { router as adminLogRouter };
