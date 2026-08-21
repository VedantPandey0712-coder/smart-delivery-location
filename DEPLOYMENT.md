# Deployment Guide — Smart Delivery Location

This deploys three pieces:

1. **Database** → [Neon](https://neon.tech) (free, serverless Postgres with PostGIS)
2. **Backend API** → [Render](https://render.com) (free web service)
3. **Frontend** → [Vercel](https://vercel.com) (free static hosting)

Total time: ~15 minutes. Do the steps **in this order** — each one needs info from the previous step.

---

## 0. Push the code to your GitHub repo first

```bash
cd smart-delivery-location
git init                      # skip if already a git repo
git add .
git commit -m "Working MVP: full-stack delivery location verification platform"
git branch -M main
git remote add origin https://github.com/VedantPandey0712-coder/smart-delivery-location.git
git push -u origin main
```

Both Render and Vercel deploy directly from this GitHub repo, so it needs to be pushed first.

---

## 1. Database — Neon (PostGIS)

1. Go to [neon.tech](https://neon.tech) → sign up (GitHub login is fastest) → **New Project**.
2. Name it `smart-delivery-location`, pick any region close to you, click **Create**.
3. Once created, open the **SQL Editor** (left sidebar) and paste the entire contents of
   `server/src/db/schema.sql` from this repo, then click **Run**.
   - This creates the PostGIS extension and both tables (`delivery_points`, `delivery_events`).
4. Go to **Dashboard → Connection Details**, copy the connection string. It looks like:
   ```
   postgresql://neondb_owner:xxxxx@ep-xxxx-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   **Save this — you'll paste it into Render in the next step.**

---

## 2. Backend API — Render

1. Go to [render.com](https://render.com) → sign up with GitHub → **New → Web Service**.
2. Connect your `smart-delivery-location` repo.
3. Render should detect `render.yaml` automatically and pre-fill settings. If not, set manually:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Add these **Environment Variables** (Render dashboard → Environment):

   | Key              | Value                                                              |
   | ----------------- | -------------------------------------------------------------------- |
   | `DATABASE_URL`    | *the Neon connection string from Step 1*                           |
   | `DATABASE_SSL`    | `true`                                                              |
   | `CLIENT_ORIGIN`   | `http://localhost:5173` *(update after Step 3 with your Vercel URL)* |
   | `SERVER_BASE_URL` | *leave blank for now — fill in after first deploy, see below*        |

5. Click **Create Web Service**. Wait for the build to finish (~2 min).
6. Once live, copy your service URL from the top of the Render page, e.g.:
   ```
   https://smart-delivery-location-api.onrender.com
   ```
7. Go back to **Environment Variables** and set `SERVER_BASE_URL` to that exact URL, then
   **Save Changes** (this triggers a redeploy — it's needed so uploaded photo links resolve correctly).
8. Test it: open `https://your-render-url.onrender.com/api/health` in a browser.
   You should see `{"status":"ok","service":"smart-delivery-location-api"}`.

> ⚠️ **Free tier notes:**
> - The free instance spins down after 15 minutes of inactivity — the first request after idle takes ~30–50s to wake up. Open the demo link a minute before your judging slot to "warm it up."
> - The free instance's disk is **ephemeral** — uploaded entrance photos are lost on redeploy/restart. Fine for a live demo; if you want photos to persist permanently, say so and I'll wire up Cloudinary (free tier) instead of local disk — it's a small change.

---

## 3. Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → sign up with GitHub → **Add New → Project**.
2. Import the same `smart-delivery-location` repo.
3. Set:
   - **Root Directory:** `client`
   - Framework Preset: Vercel should auto-detect **Vite**.
4. Add an **Environment Variable**:

   | Key                  | Value                                                    |
   | --------------------- | ----------------------------------------------------------- |
   | `VITE_API_BASE_URL`   | `https://your-render-url.onrender.com/api` *(from Step 2)*  |

5. Click **Deploy**. Wait ~1 minute.
6. Copy your live Vercel URL, e.g.:
   ```
   https://smart-delivery-location.vercel.app
   ```

---

## 4. Close the loop — allow the frontend to call the backend

1. Go back to **Render → Environment Variables**.
2. Update `CLIENT_ORIGIN` to your Vercel URL from Step 3 (no trailing slash):
   ```
   https://smart-delivery-location.vercel.app
   ```
3. Save — Render redeploys automatically.

---

## 5. Verify the live demo end-to-end

1. Open your Vercel URL.
2. Click **Create a Delivery Point** → fill in an address → allow location access → drop a pin →
   fill building details → upload a photo.
3. Confirm the **Location Confidence Score** climbs 30% → 50% → 65% → 80% → 95% as you go.
4. Open the resulting delivery point page and confirm the rider card + "Report Issue" button work.

If all of that works, your demo URL is ready to put in the PPT / share with judges.

---

## Quick reference — final URLs to note down

| Piece     | URL                                                   |
| --------- | ------------------------------------------------------ |
| Frontend  | `https://smart-delivery-location.vercel.app`           |
| Backend   | `https://smart-delivery-location-api.onrender.com`     |
| Database  | Neon dashboard (private — not shared with judges)      |

---

## Troubleshooting

- **CORS error in browser console** → `CLIENT_ORIGIN` on Render doesn't match your Vercel URL exactly. Check for trailing slashes / http vs https.
- **"Network Error" on the frontend** → `VITE_API_BASE_URL` on Vercel is wrong or missing `/api` at the end, or the Render service is asleep (wait ~40s and retry).
- **500 error on any request** → check Render → Logs. Almost always a `DATABASE_URL` typo or the schema wasn't run in Neon (Step 1.3).
- **Map doesn't load** → Leaflet needs internet access to fetch OpenStreetMap tiles; make sure you're not on a network that blocks `tile.openstreetmap.org`.
