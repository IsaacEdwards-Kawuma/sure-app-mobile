# WiFi Manager — Native Mobile App

Production-ready native mobile app for small WiFi hotspot businesses. Runs on **iOS and Android** with a **Node.js + Express** backend. Supports **SQLite** (file-based) or **PostgreSQL**.

---

## Repository structure

```
├── backend/          # Node.js API (Express, JWT, SQLite or PostgreSQL)
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── db/       # setup.js (SQLite), index.js (adapter), pool.js (pg)
│   │   ├── routes/   # auth, sales, vouchers, expenses, assets, settings, admin-log, backup
│   │   └── middleware/
│   └── data/         # SQLite DB file (when USE_SQLITE=1)
│
└── mobile/           # React Native (Expo) + TypeScript
    ├── app/          # Expo Router (tabs, login, signup)
    ├── src/
    │   ├── api/      # RTK Query (baseApi, authApi, settingsApi)
    │   ├── components/
    │   ├── features/ # auth slice, settings store
    │   ├── services/ # axios, secure store
    │   └── theme/    # Navy, Teal, Gold palette
    └── package.json
```

---

## 1. Backend setup

### Option A — SQLite (simplest, no DB server)

1. Install and configure:
   ```powershell
   cd backend
   npm install
   copy .env.example .env
   ```
2. In `.env` set:
   ```
   USE_SQLITE=1
   JWT_SECRET=your-secret-key
   PORT=3000
   ALLOWED_ORIGINS=*
   ```
3. Create database and tables:
   ```powershell
   npm run setup
   ```
4. Start the server:
   ```powershell
   npm start
   ```
   Or `npm run dev` for watch mode.

### Option B — PostgreSQL

1. Install and configure:
   ```powershell
   cd backend
   npm install
   copy .env.example .env
   ```
2. In `.env` set:
   ```
   USE_SQLITE=0
   DATABASE_URL=postgresql://user:password@localhost:5432/surelink
   JWT_SECRET=your-secret-key
   PORT=3000
   ALLOWED_ORIGINS=*
   ```
3. Create DB and run migrations:
   ```powershell
   createdb surelink
   npm run db:migrate
   ```
4. Start the server:
   ```powershell
   npm start
   ```

### First user

- **SQLite**: After `npm run setup`, there are no users. Use the app’s **Sign up** (first-run) or:
  ```powershell
  curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Admin\",\"pin\":\"5678\"}"
  ```
- **PostgreSQL**: Same `POST /api/auth/register` after migrations.

API base: `http://localhost:3000`. For Android emulator use `http://10.0.2.2:3000`.

---

## 2. Mobile app setup

1. Install dependencies:
   ```powershell
   cd mobile
   npm install
   ```
2. Configure API URL:
   ```powershell
   copy .env.example .env
   ```
   In `.env` set:
   ```
   EXPO_PUBLIC_API_URL=http://localhost:3000
   ```
   (Use `http://10.0.2.2:3000` for Android emulator.)

3. Start the app:
   ```powershell
   npx expo start
   ```
   Then press **a** (Android), **i** (iOS), or scan the QR code with Expo Go.

---

## Tech stack

### Backend
- Node.js (v18+), Express, **SQLite** (better-sqlite3) or **PostgreSQL** (pg)
- JWT (auth), bcrypt (PIN hashing), helmet, cors, express-rate-limit, multer, node-cron

### Mobile
- React Native, **Expo**, TypeScript
- **Redux Toolkit** + **RTK Query** (API caching)
- React Navigation (Expo Router), React Native Paper (custom theme)
- **react-native-reanimated**, **react-native-gesture-handler**
- **react-hook-form**, **zod**, **date-fns**
- **victory-native** (charts), **react-native-toast-message**
- expo-secure-store (JWT), AsyncStorage, expo-file-system, expo-sharing

---

## Features

- **Auth**: First-run registration, login (user + 4-digit PIN), JWT in secure store, optional session timeout
- **Dashboard**: KPI cards (Total Revenue, Net, Best Day, Avg/Day, Downtime, Expenses) with count-up animation; voucher stock; pull-to-refresh
- **Daily Entry**: Date, attendant, revenue sources, expenses, notes, downtime (full form and edit mode in progress)
- **Vouchers**: Generate batch, list (filter), sell
- **Reconcile**: Compare sold vouchers vs revenue
- **Sales Log**: List, search, edit/delete (admin), edit history
- **Expenses / Assets**: CRUD, category filters, charts
- **Guide**: In-app help
- **Settings (admin only)**: Business, Users, Revenue sources, Voucher packages, Fixed costs, Expense categories, Subscriptions, Admin log, Backup download

---

## Deployment

- **Backend**: Deploy to Render, Railway, or AWS. For SQLite use a persistent volume; for production PostgreSQL is recommended. Set `JWT_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV`.
- **Mobile**: EAS Build for iOS/Android; configure `app.json` and env; submit to App Store / Play Store.

---

## Development

- Backend: `cd backend && npm run dev`
- Mobile: `cd mobile && npx expo start`
- Use **PowerShell**: for chained commands use `;` instead of `&&`, e.g. `cd mobile; npx expo start`
