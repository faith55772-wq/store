# Render.com Deployment Guide: Store Listener (MERN Stack)

This repository (`faith55772-wq/store`) is configured for **dual independent deployment on Render.com** (Frontend and Backend deployed as separate isolated services from the same Git repo).

---

## 🚀 Option 1: Automatic 1-Click Deployment via Render Blueprint (Recommended)
You are already on the **Blueprint Instance** creation page on Render (`dashboard.render.com/select-repo?type=blueprint`):

1. **Click `Connect`** next to `faith55772-wq/store`.
2. Give the Blueprint instance a name (e.g., `store-listener`).
3. Render automatically reads `render.yaml` and sets up **TWO separate services**:
   - **`store-listener-backend`**: Node.js Web Service running in `Backend/`
   - **`store-listener-frontend`**: Static Web App running in `frontend/`
4. The environment variables (`MONGODB_URI`, `DEEPGRAM_API_KEY`, `JWT_SECRET`, `CORS_ORIGIN`) are pre-populated automatically in `render.yaml`.
5. Click **Apply**.
6. Both Backend and Frontend will deploy and link to each other automatically!

---

## 🛠️ Option 2: Manual Separate Services Deployment

If you prefer to configure each service manually without Blueprints:

### A. Deploy Backend Web Service
1. On Render Dashboard, click **New +** &rarr; **Web Service**.
2. Select repository: `faith55772-wq/store`.
3. Configure settings:
   - **Name**: `store-listener-backend`
   - **Root Directory**: `Backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Add Environment Variables:
   - `PORT`: `10000`
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `mongodb+srv://infosoftdevzone_db_user:Qa8fsTr50BgtRhI2@cluster0.3fykibu.mongodb.net/store_listener?retryWrites=true&w=majority&appName=Cluster0`
   - `DEEPGRAM_API_KEY`: `ed9ef2ddcabaed33bc705a6c31e381a05d2614f7`
   - `JWT_SECRET`: `store_listener_super_secure_jwt_secret_key_2026_xyz`
   - `CORS_ORIGIN`: `*`
   - `STORAGE_DIR`: `storage`
5. Click **Create Web Service**.
6. Note the deployed URL (e.g., `https://store-listener-backend.onrender.com`).

---

### B. Deploy Frontend Static Site
1. On Render Dashboard, click **New +** &rarr; **Static Site**.
2. Select repository: `faith55772-wq/store`.
3. Configure settings:
   - **Name**: `store-listener-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Add Environment Variables:
   - `VITE_API_URL`: `https://store-listener-backend.onrender.com` (Your deployed backend URL)
   - `VITE_WS_URL`: `https://store-listener-backend.onrender.com`
5. In **Redirects / Rewrites**:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
6. Click **Create Static Site**.

---

## 📡 Verification & Testing Checklist

Once deployed:
1. Open the backend health endpoint: `https://<backend-url>/health` &rarr; should return `{"status":"ok"}`.
2. Open the frontend URL: `https://<frontend-url>/` &rarr; Dashboard will load with live statistics and connected MongoDB data.
3. Open the **Store Client (.exe)** tab &rarr; test microphone detection, auto-recording, bilingual English output, and live stream synchronization.
