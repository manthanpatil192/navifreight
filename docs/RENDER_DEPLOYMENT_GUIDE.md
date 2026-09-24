# NaviFreight - Render Full-Stack Hosting Guide (Web + Backend)

Render can host **BOTH** the React Web Application and the Python REST API Backend on its **100% Free Tier ($0/month)**.

**Official Git Repository:**  
👉 `https://github.com/manthanpatil192/navifreight.git`

---

## 🏗️ Architecture on Render

| Service | Render Type | Price | Key Benefit |
| :--- | :--- | :--- | :--- |
| **NaviFreight Web App** | **Static Site** | **$0/month (Free)** | **Never sleeps**, instant global CDN, automatic SSL, SPA routing |
| **NaviFreight API** | **Web Service** | **$0/month (Free)** | Full Python 3.11 + Gunicorn REST API |

---

## ⚡ Option 1: Host the Web App on Render (Static Site)

1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Static Site**.
3. Under *Connect a repository*, enter:  
   `https://github.com/manthanpatil192/navifreight`
4. Configure the settings:
   - **Name:** `navifreight-web` (or any name you like)
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. **Add Environment Variable (Links Web App to your Live Backend):**
   - Click **Add Environment Variable**:
     - Key: `VITE_BACKEND_URL`
     - Value: `https://navifreight.onrender.com`
6. **Add SPA Redirect (for clean navigation):**
   - Scroll down to **Redirects/Rewrites**.
   - Click **Add Rule**:
     - **Type:** `Rewrite`
     - **Source:** `/*`
     - **Destination:** `/index.html`
7. Click **Create Static Site**.
   Render will build the Vite app and issue a free SSL URL (e.g. `https://navifreight-web.onrender.com`).
   > [!NOTE]
   > Unlike Web Services, Render Static Sites **never sleep**! Your web app will load instantly 24/7.

---

## ⚡ Option 2: Blueprint Deployment (Both Web + Backend via render.yaml)

Render supports deploying both services together using [`render.yaml`](../render.yaml):

1. Click the Render Blueprint Deploy button:
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/manthanpatil192/navifreight)
2. Render will automatically detect both `navifreight` (backend) and `navifreight-web` (frontend) and deploy them together on the free tier.

---

## 🔗 Live URLs Reference

- **Backend API (Already Live):**  
  [https://navifreight.onrender.com](https://navifreight.onrender.com)
  - `/api/health` — Health check
  - `/api/bunching` — Vessel bunching collision radar
  - `/api/news` — Real-time maritime intelligence
  - `/api/forecast` — Quantile forecasting & CVaR risk split
- **Web App on Render:**  
  `https://navifreight-web.onrender.com` (after setting up Static Site)
- **Web App on GitHub Pages (Existing):**  
  [https://manthanpatil192.github.io/navifreight/](https://manthanpatil192.github.io/navifreight/)
