/**
 * Structured logger — use instead of console.log/error in production.
 */
const isProd = process.env.NODE_ENV === 'production';

function log(level, msg, data = {}) {
  const payload = {
    time: new Date().toISOString(),
    level,
    msg,
    ...data,
  };
  if (isProd) {
    console.log(JSON.stringify(payload));
  } else {
    console[level === 'error' ? 'error' : 'log'](payload.msg, Object.keys(data).length ? data : '');
  }
}

export const logger = {
  info: (msg, data) => log('info', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  error: (msg, data) => log('error', msg, data),
};
