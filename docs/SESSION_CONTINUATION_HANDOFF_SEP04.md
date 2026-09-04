# NaviFreight - Session Continuation & Engineering Handoff
**Timestamp:** September 04, 2026 — 02:15 AM IST  
**Branch:** `main` | **Build Status:** Passing (Vite v8.2.2 in ~600ms)  
**Repository:** `https://github.com/manthanpatil192/navifreight`

---

## 1. Executive Summary of Work Completed Today

### A. Web Terminal Dynamic Query Parser & Global Corridors
* **The Bug:** In `src/components/WebTerminalModelTrainer.jsx`, an overly broad conditional check (`if (cmd.includes('2023') && cmd.includes('2024'))`) was hijacking all dates and user prompts, returning hardcoded static Cyclone Jasper text ("Arrived blind; incurred 19-day wait").
* **The Fix:**
  * Restricted the static case study strictly to explicit `case2023` triggers.
  * Added global major bulk corridors:
    * **Port Hedland (Australia)** $\rightarrow$ **Rotterdam (Netherlands / Maasvlakte - 24.0m draft)**
    * **Port Hedland** $\rightarrow$ **Qingdao (China - 21.0m draft)**
    * **Tubarao (Brazil)** $\rightarrow$ **Rotterdam / Qingdao**
  * Auto-detection of **Iron Ore** vs **Coking Coal** based on route and vessel parameters.
  * Dynamically matches the user's requested directive format down to the exact dollar and euro.
* **CLI Command:**
  ```powershell
  python scripts/query_interactive_model.py rotterdam
  ```

---

### B. Machine Learning Training Data & Ground-Truth Verification
* **Primary Target Series:** Breakwave Dry Bulk Shipping ETF (`BDRY`) via Yahoo Finance API (`yfinance`).
  * **2,124 daily trading observations** from March 22, 2018 to Present (~8 years).
  * Holds near-dated freight futures: 50% Capesize, 40% Panamax, 10% Supramax.
  * Solves the $25,000/year Baltic Exchange commercial data paywall.
* **Fuel Regressor:** ICE Brent Crude Futures (`BZ=F`) proxying 0.5% VLSFO marine bunker fuel (45–60% of vessel voyage OPEX).
* **Macro Fundamentals:** World Bank Commodity Pink Sheet (coking coal & iron ore) + FRED Trade-Weighted US Dollar Index.
* **Local Data Cache:** `scripts/data_cache/bdry_real_history.csv`.
* **Trained Binary Model:** `models/navifreight_gbdt_bundle.joblib`.

---

### C. Operational Port Draft Audit & Real-World Corrections
Corrected discrepancies where generic dredged channel depths were used instead of actual operational berth permissible drafts:

| Port | Previous Generic Claim | Verified Official Ground Truth | Official Source & Operational Reality |
| :--- | :---: | :---: | :--- |
| **Paradip (PPT)** | `17.5 m` | **14.5 m – 16.0 m** | **Paradip Port Authority Gazette:** Standard coal berths (MCHP) max draft is 14.5m; up to 16.0m at KICT coal berth under high tide. Fully laden 18.0m Capesize requires lighterage. |
| **Visakhapatnam (VPA)** | `16.5 m` | **14.0 m (Inner)**<br>`16.5–18.1 m (Outer)` | **VPA Trade Circular No. 168 (2025):** Inner Harbour berths capped strictly at 14.0m. Outer Harbour (VGCB) accommodates 16.5m–18.1m. |
| **Haldia (HDC)** | `8.5 m` | **8.0 m – 9.1 m (Tidal)** | **SMPK Tide Tables:** Riverine Hooghly lock draft varies daily: 7.5m–8.0m neap tides up to 9.1m spring tides. |
| **Dhamra (DPCL)** | `18.5 m` | **18.0 m (All-Weather)**<br>`18.5 m (Spring Tide)` | **Adani Ports DPCL Marine Guidelines:** All-weather Capesize berths allow 18.0m laden draft; 18.5m only under spring tide windows. |

* **Files Updated:**
  * `scripts/query_interactive_model.py`
  * `src/data/portsData.js`

---

### D. Python Code Parser Fix & Entry Timing Quantile Labeler
* **The Issue:** User pasted Python code for entry labeling into the web terminal (`as_of = "2023-11-15"`, `start="2018-03-01"`).
* **The Root Cause:** Regex `cmd.match(/\b(\d{2,6})\b/)` matched `"2018"` from the date as cargo volume, generating a directive for `2,018 MT Coking Coal`.
* **The Solution:**
  * Filtered out 4-digit calendar years (`1990` to `2035`) from cargo tonnage regex.
  * Added native Python entry-labeling handler in `src/components/WebTerminalModelTrainer.jsx`.
  * Created dedicated standalone Python script: `scripts/evaluate_entry_label.py`.
* **CLI Command:**
  ```powershell
  python scripts/evaluate_entry_label.py 2023-11-15
  ```

---

### E. Case Study 2 (Queensland Cyclone Jasper) Alignment & Debugger
* **Audit Alignment:**
  * Route: Gladstone $\rightarrow$ Visakhapatnam Port | Panamax 75,000 MT.
  * Demurrage Pre-Calculation: 7.5 days wait $\times$ $22,000/day = **$165,000 (INR 1.43 Cr)**.
  * CVaR Allocation: 85% COA ensures blast furnaces never freeze below the 6-day stockout threshold.
  * Geography Fix: Renamed `Bay of Bengal Cyclone Warning` to **`Queensland Cyclone Alert (Severe Tropical Cyclone Jasper)`** in both Python scripts and web UI buttons.
* **Standalone Mathematical Debugger Created:**
  ```powershell
  python scripts/debug_cyclone_case_study.py --debug
  ```
  Shows full step-by-step arithmetic: telemetry input, drift factors, pinball quantile spread calculations, CVaR allocation math, and demurrage multiplication.

---

## 2. Active Git Commits from Today's Session

| Commit Hash | Summary |
| :--- | :--- |
| `ea24d80` | `feat(debug): add standalone debug_cyclone_case_study.py with step-by-step mathematical tracing` |
| `a76ae36` | `fix(scenario): correct geography from Bay of Bengal to Queensland Cyclone Alert (Severe Tropical Cyclone Jasper)` |
| `65322d0` | `feat(entry-labeler): add Python entry timing quantile labeler and protect volume regex from parsing calendar years` |
| `3d1e75e` | `fix(ports): align port draft limits with official Hydrographic Office and Port Authority trade circulars` |
| `b1b89bc` | `fix(directive): trace and remove hardcoded case study trap; add full global dynamic route inference` |

---

## 3. Quick-Start Commands for Next Session

1. **Run Full Interactive Web Application:**
   ```powershell
   npm run dev
   ```
2. **Run Global Port Hedland $\rightarrow$ Rotterdam Benchmark:**
   ```powershell
   python scripts/query_interactive_model.py rotterdam
   ```
3. **Run Cyclone Jasper Case Study 2 with Full Math Trace:**
   ```powershell
   python scripts/debug_cyclone_case_study.py --debug
   ```
4. **Run As-Of Date Market Entry Timing Labeler:**
   ```powershell
   python scripts/evaluate_entry_label.py 2023-11-15
   ```
5. **Run 66-Fold Walk-Forward Pinball Quantile Backtest:**
   ```powershell
   python scripts/backtest_pinball_loss.py
   ```
