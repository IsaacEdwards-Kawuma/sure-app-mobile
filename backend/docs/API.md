# SureLink WiFi Manager — API Reference

Base URL: `/api`

## Auth (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | /auth/register | First admin signup (when no users exist) |
| POST   | /auth/login     | Login with `userId` + `pin`; returns `token` and `user` |
| GET    | /auth/me        | Current user (requires `Authorization: Bearer <token>`) |
| POST   | /auth/forgot-pin | Forgot PIN flow |
| POST   | /auth/reset-pin  | Reset PIN |

## Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET    | /users   | No   | List users (for login dropdown) |
| POST   | /users   | Admin | Create user |
| GET    | /users/:id | Admin | Get user |
| PUT    | /users/:id | Admin | Update user (incl. PIN reset) |
| DELETE | /users/:id | Admin | Delete user |

## Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /sales   | List daily entries |
| POST   | /sales   | Create daily entry |
| GET    | /sales/:id | Get one |
| PUT    | /sales/:id | Update (admin; reason logged) |
| DELETE | /sales/:id | Delete (admin; reason logged) |

## Vouchers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /vouchers | List (filter by status) |
| POST   | /vouchers/batch | Generate batch |
| POST   | /vouchers/sell | Mark vouchers sold |
| DELETE | /vouchers/:id | Delete (admin) |

## Expenses, Assets, Settings, Admin Log, Backup, Monitoring

See route files in `backend/src/routes/`. All protected endpoints require:

```
Authorization: Bearer <JWT>
```

Rate limiting: 429 when exceeded; CORS and Helmet enabled.
