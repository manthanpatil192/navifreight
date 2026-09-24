# NaviFreight (SIH 26006)

AI-Powered Dry Bulk Freight Procurement, Vessel Optimization & Anti-Congestion Dispatch Platform for Indian Steel Mills and Power Utilities.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/manthanpatil192/navifreight)

**Official Git Repository:**  
`https://github.com/manthanpatil192/navifreight.git`

---

## 🚀 Key Modules

- **Part A: Market Timing & Volatility** — Probabilistic forward spot freight rate forecasting (P10/P50/P90 quantile cones), CVaR hedging, and optimal Spot vs. COA allocation.
- **Part B: Vessel & Port Fit** — Berth engineering constraints, draft/LOA limits, and tons-per-day discharge pacing for East Coast Indian ports.
- **Part C: Idle Scenarios & Vessel Bunching** — Coastal cargo-to-hold triangulation, tramp backhaul deadheading elimination, and the **Vessel Bunching & Anti-Congestion Dispatch Terminal** for same-day ETA collision prevention.
- **Part D: Risk Mitigation & Real-Time AIS** — 4-stage NLP maritime market intelligence radar, live Bay of Bengal weather alerts, and satellite AIS tracking.

---

## ☁️ Deploy Backend on Render (100% Free)

1. **Deploy with 1 Click:**
   Click the button above or visit:  
   [https://render.com/deploy?repo=https://github.com/manthanpatil192/navifreight](https://render.com/deploy?repo=https://github.com/manthanpatil192/navifreight)

2. **Connect via Git URL on Render Dashboard:**  
   - Repository: `https://github.com/manthanpatil192/navifreight`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn backend.server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`
   - Healthcheck Path: `/api/health`

For complete instructions, see the [Render Deployment Guide](docs/RENDER_DEPLOYMENT_GUIDE.md).

---

## 💻 Local Development

```bash
# Install frontend dependencies
npm install

# Start Vite React frontend
npm run dev

# Start Python backend server
npm run backend
```
