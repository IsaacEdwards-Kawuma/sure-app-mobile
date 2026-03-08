import './loadEnv.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { salesRouter } from './routes/sales.js';
import { vouchersRouter } from './routes/vouchers.js';
import { expensesRouter } from './routes/expenses.js';
import { assetsRouter } from './routes/assets.js';
import { usersRouter } from './routes/users.js';
import { settingsRouter } from './routes/settings.js';
import { adminLogRouter } from './routes/adminLog.js';
import { backupRouter } from './routes/backup.js';
import { monitoringRouter } from './routes/monitoring.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { logger } from './lib/logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins.includes('*') ? true : allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 20,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', loginLimiter);

// Public
app.use('/api/auth', authRouter);

// Protected API
app.use('/api/sales', authMiddleware, salesRouter);
app.use('/api/vouchers', authMiddleware, vouchersRouter);
app.use('/api/expenses', authMiddleware, expensesRouter);
app.use('/api/assets', authMiddleware, assetsRouter);
app.use('/api/users', usersRouter); // GET / is public for login dropdown; admin routes protected in router
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/admin-log', authMiddleware, adminLogRouter);
app.use('/api/backup', authMiddleware, backupRouter);
app.use('/api/monitoring', authMiddleware, monitoringRouter);

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.get('/api/health/db', async (req, res) => {
  try {
    const { query } = await import('./db/index.js');
    const tables = ['users', 'sales', 'settings', 'admin_log'];
    const counts = {};
    for (const table of tables) {
      const r = await query(`SELECT COUNT(*) as c FROM ${table}`);
      counts[table] = Number(r.rows[0]?.c ?? 0);
    }
    res.json({ ok: true, database: 'connected', counts });
  } catch (err) {
    res.status(500).json({ ok: false, database: 'error', error: err.message });
  }
});

app.use(errorHandler);

async function start() {
  const hasDb = !!process.env.DATABASE_URL;
  if (!hasDb) {
    logger.error('DATABASE_URL is not set. Put your Neon connection string in backend/.env');
    process.exit(1);
  }
  logger.info('Database: Neon (DATABASE_URL set)');
  try {
    const { runPgSetup } = await import('./db/pgSetup.js');
    await runPgSetup();
    logger.info('PostgreSQL database ready.');
  } catch (err) {
    logger.error('PostgreSQL setup failed', { err: err.message });
    process.exit(1);
  }
  app.listen(PORT, () => {
    logger.info(`SureLink API listening on port ${PORT}`);
  });
}

start();
