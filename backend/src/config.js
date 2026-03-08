/**
 * Backend config — env with safe production defaults.
 * In production, JWT_SECRET must be set (no fallback).
 */
const isProd = process.env.NODE_ENV === 'production';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (isProd && !secret) {
    throw new Error('JWT_SECRET must be set in production. Add it to your .env or Render env vars.');
  }
  return secret || 'dev-secret';
}

export const JWT_SECRET = getJwtSecret();
