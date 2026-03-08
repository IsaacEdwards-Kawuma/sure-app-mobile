import { Router } from 'express';
import { requirePermission } from '../middleware/auth.js';
import { query } from '../db/index.js';

const router = Router();

router.get('/', requirePermission('all'), async (req, res, next) => {
  try {
    const dbPing = await query('SELECT 1');
    const mem = process.memoryUsage();
    res.json({
      database: { ok: !!dbPing.rows[0] },
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        memory: {
          rss: mem.rss,
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export { router as monitoringRouter };
