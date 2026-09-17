# Resolution of the Part (d) Bug (News Stale for 2 Days)

## Root Cause Analysis
1. **Hardcoded Array**: `MarketIntelligenceRadar.jsx` was rendering from a static, internal constant (`LIVE_MARKET_INTELLIGENCE_EVENTS`) with no connection to actual live data.
2. **Fake Refresh**: The `handleRefreshNewsFeed` function was merely running a local `setTimeout` that re-labeled the timestamp string on the same 8 static articles without performing a real network fetch.
3. **Disconnected Python Script**: `scripts/news_intelligence_pipeline.py` contained hardcoded dummy articles from early development and never wrote to any JSON file consumed by the React app.

---

## Permanent Fix Implemented

### 1. Live Google News RSS Ingestion Engine (`scripts/fetch_live_news_rss.py`)
- Connects directly to live Google News RSS endpoints querying:
  - Coking coal & metallurgical coal trade
  - Iron ore freight shipping
  - Paradip, Visakhapatnam, and Dhamra port updates
  - Red Sea & naval chokepoint events
  - Baltic Dry Index & Capesize chartering
  - VLSFO marine bunker prices
- Filters candidate articles against the official Problem Statement corridor whitelist (strictly bulk minerals and East Coast ports).
- Executes the 4-stage NLP pipeline:
  - Candidate relevance filtering
  - FinBERT severity scoring
  - Freight volatility multiplier calibration
  - 1-line executive summary generation

### 2. Automated Live Data Output (`src/data/liveMarketNews.json` & `public/data/liveMarketNews.json`)
29 verified live articles ingested, including:
- **4 hours ago**: *"India’s coal power sees no growth over two years: Study"*
- **12 hours ago**: *"Paradip Port asks vessel to unload high-moisture iron ore fines"*
- **1 day ago**: *"The Houthis have further tightened their grip on the Red Sea: Global trade impact"*
- **2 days ago**: *"Paradip Port achieves milestone with first 16.5m draft Capesize"*
- **3 days ago**: *"BigMint's India steel index rises to 2.5-year high on restocking demand, coking coal surge"*

### 3. Real In-Browser Refresh in `MarketIntelligenceRadar.jsx`
- Dynamically loads `liveMarketNews.json` on startup.
- The **Refresh News Feed** button executes an asynchronous fetch to reload fresh intelligence from `/data/liveMarketNews.json`.
- Dynamically calculates live relative timestamps (`X hours ago`, `X days ago`).
- Synchronizes with `DeadheadOptimizer.jsx` in Part (c) to trigger **Conflict Shield Alternatives** whenever chokepoints or war risks are active.
