# Deploy on Render (fix Ruby → Node)

Your current Render service was created as **Ruby**, so it runs `bundle install` and fails.  
Render **does not let you change Ruby to Node** on an existing service. Use one of these:

---

## Option A: New service from Blueprint (recommended)

1. **Delete** the current Web Service in Render (Settings → bottom → Delete Web Service).
2. In Render dashboard: **New +** → **Blueprint**.
3. Connect repository: **IsaacEdwards-Kawuma/sure-app-mobile**.
4. Render will read **render.yaml** and create a **Node** service with Root Directory `backend`.
5. After it’s created, open the new service → **Environment** tab.
6. Add your env vars (Blueprint won’t have the real values):
   - **DATABASE_URL** = your Neon connection string (from `backend/.env` or Neon dashboard).
   - **JWT_SECRET** = long random string (or use “Generate” if available).
   - **ALLOWED_ORIGINS** = `*` (often already set by the Blueprint).
7. Save. Render will redeploy. Your API URL will be like `https://surelink-api.onrender.com`.

---

## Option B: New Web Service (manual)

1. **Delete** the current Web Service.
2. **New +** → **Web Service**.
3. Connect **IsaacEdwards-Kawuma/sure-app-mobile**.
4. When asked for **Runtime**, choose **Node** (not Ruby).
5. Set:
   - **Name:** surelink-api
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Add **Environment** variables: DATABASE_URL, JWT_SECRET, ALLOWED_ORIGINS=*
7. Create Web Service.

---

After the new **Node** service is live, use its URL in your mobile app (Login/Sign up → Server URL).
