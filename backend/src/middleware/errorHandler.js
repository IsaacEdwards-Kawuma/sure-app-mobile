import { logger } from '../lib/logger.js';

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  logger.error('Request error', { status, message, path: req.path });
  if (process.env.NODE_ENV === 'production') {
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : message });
  } else {
    res.status(status).json({ error: message, stack: err.stack });
  }
}
