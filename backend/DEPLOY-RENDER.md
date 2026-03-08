# Deploy SureLink Backend on Render

Follow these steps to host your API on Render and get a URL for your mobile app.

---

## 1. Push your code to GitHub

If you haven’t already:

```bash
cd "c:\Users\kasac\Desktop\all stuf\CODES\Surelink flutter App"
git init
git add .
git commit -m "Initial commit"
# Create a repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## 2. Create a Web Service on Render

1. Go to **[render.com](https://render.com)** and sign in (or create an account).
2. Click **Dashboard** → **New +** → **Web Service**.
3. **Connect your GitHub** account and select the repo that contains this project (the one with the `backend` folder and `render.yaml`).
4. Configure the service:
   - **Name:** `surelink-api` (or any name).
   - **Region:** Choose one close to you.
   - **Root Directory:** `backend`  
     (So Render uses the `backend` folder as the app root.)
   - **Runtime:** Node.
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free (or paid if you prefer).

5. **Environment variables** (required):

   | Key             | Value / Action |
   |-----------------|----------------|
   | `DATABASE_URL`  | Your **Neon** connection string (from Neon dashboard or `backend/.env`). |
   | `JWT_SECRET`    | A long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com)). |
   | `ALLOWED_ORIGINS` | `*` (so the mobile app can call the API from any origin). |

   Optional:

   | Key                   | Value   |
   |-----------------------|---------|
   | `NODE_ENV`            | `production` |
   | `RATE_LIMIT_WINDOW_MS`| `900000`    |
   | `RATE_LIMIT_MAX`      | `100`       |

6. Click **Create Web Service**. Render will build and deploy.

---

## 3. Get your backend URL

- After the first deploy finishes, Render shows the service URL, e.g.  
  **`https://surelink-api.onrender.com`**
- Copy that URL (no trailing slash). You’ll use it in the mobile app.

---

## 4. Use the link in your mobile app

In the **SureLink** Expo app:

- **Login or Sign up screen:** in the **Server URL** field, enter your Render URL, e.g.  
  **`https://surelink-api.onrender.com`**
- Or set it once in **Admin Dashboard** → Sensitive settings → Server URL.
- Or set the default in **`mobile/.env`**:  
  **`EXPO_PUBLIC_API_URL=https://surelink-api.onrender.com`**  
  then run **`npx expo start --clear`**.

The app will then call your hosted API; no need for your PC’s IP or same Wi‑Fi.

---

## 5. (Optional) Deploy with Blueprint

If there is a **`render.yaml`** in the **project root** (parent of `backend`):

1. In Render: **New +** → **Blueprint**.
2. Connect the same GitHub repo.
3. Render will read `render.yaml` and create the Web Service; you still need to set **`DATABASE_URL`** and **`JWT_SECRET`** in the service **Environment** tab (and optionally **`ALLOWED_ORIGINS`**).

---

## Free tier note

On the free tier, the service **spins down after ~15 minutes** of no requests. The **first request** after that may take 30–60 seconds (cold start). After that it stays fast until idle again.

---

## Check that it works

- **Health:**  
  **`https://YOUR-SERVICE-NAME.onrender.com/api/health`**  
  Should return something like: `{"ok":true,"timestamp":"..."}`.

- **DB:**  
  **`https://YOUR-SERVICE-NAME.onrender.com/api/health/db`**  
  Should return: `{"ok":true,"database":"connected","counts":{...}}`.

Use the same base URL (e.g. `https://surelink-api.onrender.com`) as the **Server URL** in your mobile app.
