# NaviFreight Backend - Render Free Hosting Deployment Guide

This guide walks you through deploying the NaviFreight Python REST API backend on **Render's 100% Free Tier ($0/month)** using the official Git repository link:

**Git Repository Link:**  
👉 `https://github.com/manthanpatil192/navifreight.git`

---

## ⚡ Option 1: One-Click Instant Blueprint Deployment (Recommended)

1. Open Render's Blueprint deployer in your browser:
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/manthanpatil192/navifreight)

   **Direct Link:**  
   `https://render.com/deploy?repo=https://github.com/manthanpatil192/navifreight`

2. If prompted, sign in with your GitHub account.
3. Render will automatically read [`render.yaml`](../render.yaml) from the repository.
4. Click **Apply**. Render will build and deploy the backend automatically on the free tier!

---

## 🛠️ Option 2: Step-by-Step Manual Web Service Setup on Render

If you prefer to configure it via the Render Dashboard manually:

1. **Log in to Render:**  
   Navigate to [https://dashboard.render.com](https://dashboard.render.com) and log in with GitHub.

2. **Create New Web Service:**  
   Click the **New +** button in the top right and select **Web Service**.

3. **Connect Your Git Repository:**  
   - Enter your public Git repository URL:  
     `https://github.com/manthanpatil192/navifreight`  
   - Click **Connect**.

4. **Configure Web Service Settings:**
   | Setting | Value |
   | :--- | :--- |
   | **Name** | `navifreight-backend` |
   | **Region** | `Singapore (Southeast Asia)` or `Oregon (US West)` |
   | **Branch** | `main` |
   | **Root Directory** | *(leave blank)* |
   | **Runtime** | `Python 3` |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn backend.server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
   | **Instance Type** | **Free ($0/month)** |

5. **Advanced Settings (Optional Healthcheck):**
   - Click **Advanced**.
   - Under **Health Check Path**, enter: `/api/health`

6. **Deploy:**  
   Click **Create Web Service**.  
   Render will clone `https://github.com/manthanpatil192/navifreight.git`, install dependencies, and launch your API in ~2 minutes!

---

## 🌐 Verifying Your Deployed Backend

Once deployed, Render provides a free SSL URL (e.g., `https://navifreight-backend.onrender.com`).

You can test all endpoints immediately:
- **Interactive API Dashboard:** `https://<your-service>.onrender.com/`
- **Health Check:** `https://<your-service>.onrender.com/api/health`
- **Vessel Bunching Analytics:** `https://<your-service>.onrender.com/api/bunching?port=paradip`
- **Live News Intelligence:** `https://<your-service>.onrender.com/api/news`
- **AIS Vessels Telemetry:** `https://<your-service>.onrender.com/api/vessels`
- **East Coast Ports Info:** `https://<your-service>.onrender.com/api/ports`
- **Bay of Bengal Weather:** `https://<your-service>.onrender.com/api/weather`

---

## 💻 Running the Backend Locally

To test the backend on your computer:

```bash
# Run server
python backend/server.py

# Or via npm shortcut
npm run backend
```
Open [http://localhost:5000](http://localhost:5000) in your browser to view the interactive API dashboard.
