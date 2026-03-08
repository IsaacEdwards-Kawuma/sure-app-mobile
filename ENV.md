# Environment variables

Single reference for backend and mobile. Use `.env` locally (never commit secrets).

## Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string (e.g. Neon). |
| `JWT_SECRET` | **Yes in production** | Secret for signing JWTs. Must be set when `NODE_ENV=production`. |
| `PORT` | No | Server port (default `3000`). |
| `NODE_ENV` | No | `development` or `production`. |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins, or `*`. |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window in ms (default 15 min). |
| `RATE_LIMIT_MAX` | No | Max requests per window (default 100). |
| `LOGIN_RATE_LIMIT_MAX` | No | Max login attempts per 15 min per IP (default 20). |

## Mobile (`mobile/.env` or EAS/Expo env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | No | API base URL (e.g. `https://sure-app-mobile.onrender.com`). Default used if unset. |

## Staging vs production

- **Production**: Set `NODE_ENV=production`, `JWT_SECRET`, and a real `DATABASE_URL` (e.g. on Render).
- **Staging**: Same as production with a separate DB and URL if needed.
- **Local**: `NODE_ENV` can be unset; `JWT_SECRET` falls back to a dev default (do not use in production).
