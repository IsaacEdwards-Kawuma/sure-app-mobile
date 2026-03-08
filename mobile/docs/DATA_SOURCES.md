# Data sources: Local DB, Node backend, or Supabase

The app can use three kinds of data storage.

## 1. Local SQLite (default)

- **No server needed.** Data stays on the device (expo-sqlite).
- Default when you open the app.
- Good for: offline use, single device, no backend.

To use: leave **“Use local database”** on (default). No env vars required.

---

## 2. Node / your own backend (external DB)

- **Your Node (Express) server** with any database (PostgreSQL, MySQL, MongoDB, etc.).
- App talks to your API; your backend talks to the DB.

**Steps:**

1. **Run your backend** (e.g. `cd backend && npm start`).
2. **Set the connection string (admin only)**: open **Admin** in the sidebar (admin users only). Under **Sensitive settings** enter your server URL (e.g. `https://api.yoursite.com` or `http://192.168.1.10:3000`) and tap **Save URL**. The value is stored securely (device keychain). No rebuild needed.
   - Optional: you can set `EXPO_PUBLIC_API_URL` in `mobile/.env` as the default; the stored value overrides it.
3. **Use remote mode**: in **Settings → General**, turn **Data source** to **Remote server (Node/API)**. Re-open the app and log in with your backend credentials.

Your backend must expose the same API shape the app expects (e.g. `POST /api/sales`, `GET /api/settings`, auth, etc.). See your existing `backend/` routes.

---

## 3. Supabase (hosted PostgreSQL + Auth)

- **Supabase** = hosted Postgres + REST API + Auth. No need to host your own Node server.
- Possible setup: add **“Supabase”** as a third data source in the app and use `@supabase/supabase-js` when that option is selected.

**To add Supabase later:**

1. Create a project at [supabase.com](https://supabase.com).
2. Create tables that match your app (sales, expenses, assets, settings, users, etc.) or use the Supabase API with a small adapter layer.
3. In the app: add `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `mobile/.env`.
4. Install `@supabase/supabase-js`, add a Supabase client and an API layer (or branch in `baseApi`) that runs when “Supabase” is selected instead of local or Node.

If you want this, we can add the Supabase option and wire it next.
