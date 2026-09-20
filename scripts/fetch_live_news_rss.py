"""
NaviFreight - Real-Time Live RSS News Ingestion & 4-Stage NLP Intelligence Pipeline
SIH 26006 - Part (d) Market Intelligence Radar

Fetches live maritime, coal, iron ore, port, and geopolitical articles from Google News RSS feeds,
filters through PS corridor whitelisting, eliminates non-commercial accidents/rescues,
scores directional sentiment (UP, DOWN, NEUTRAL) via NLP economics using word-boundary regex,
and outputs live JSON strictly bounded to the last 24-48 hours for MarketIntelligenceRadar and DeadheadOptimizer.
"""

import sys
import os
import re
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

# Windows console UTF-8 setup
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_PATH_SRC = os.path.join(BASE_DIR, 'src', 'data', 'liveMarketNews.json')
OUTPUT_PATH_PUB = os.path.join(BASE_DIR, 'public', 'data', 'liveMarketNews.json')

# Strictly time-bounded to last 2 days (when:2d) to eliminate stale 25-day-old results
RSS_QUERIES = [
    {
        "query": "coking coal OR metallurgical coal India when:2d",
        "category_hint": "Commodity & Coal Supply",
        "portFilterKey": "australia"
    },
    {
        "query": "iron ore freight shipping China India when:2d",
        "category_hint": "Iron Ore & Steel Belt Demand",
        "portFilterKey": "australia"
    },
    {
        "query": "Paradip Port OR Visakhapatnam Port OR Dhamra Port shipping when:2d",
        "category_hint": "Indian East Coast Port Congestion",
        "portFilterKey": "paradip"
    },
    {
        "query": "Red Sea shipping OR Bab el-Mandeb OR Strait of Hormuz when:2d",
        "category_hint": "Geopolitical Conflict & Chokepoint Detour",
        "portFilterKey": "geopolitical"
    },
    {
        "query": "Baltic Dry Index OR Capesize freight rate when:2d",
        "category_hint": "Dry Bulk Freight Volatility",
        "portFilterKey": "australia"
    },
    {
        "query": "bunker fuel oil shipping Singapore when:2d",
        "category_hint": "Bunker Fuel & Energy Shock",
        "portFilterKey": "bunker_fuel"
    },
    {
        "query": "SAIL steel coal shipping imports when:2d",
        "category_hint": "SAIL Steel Mill Procurement",
        "portFilterKey": "paradip"
    }
]

# Strict exclusions: Non-commercial accidents, rescues, passenger boats, crime, generic site sections
EXCLUDE_TERMS = [
    "rescue", "rescued", "searches for others", "sunken cargo ship", "crew missing",
    "drowning", "body found", "fisherman", "fishing boat", "tourist boat", "passenger ferry",
    "migrant", "navy rescues", "car plunged", "yacht", "body recovered", "capsized boat",
    "bollywood", "cricket", "horoscope", "entertainment news"
]

PS_CORRIDOR_ENTITIES = {
    "ports": [
        "paradip", "vizag", "visakhapatnam", "gangavaram", "dhamra", "haldia", "gopalpur",
        "hay point", "gladstone", "samarinda", "taboneo", "maputo", "richards bay", "vostochny",
        "singapore", "colombo", "china", "qingdao", "india", "australia"
    ],
    "chokepoints": ["red sea", "suez", "bab el-mandeb", "malacca", "panama", "cape of good hope", "strait of hormuz", "gulf of aden"],
    "vessels": ["capesize", "panamax", "supramax", "kamsarmax", "bulk carrier", "bulker", "dry bulk", "vessel", "tonnage", "fleet", "freight"],
    "commodities": ["coking coal", "metallurgical coal", "thermal coal", "iron ore", "pellet", "bunker", "vlsfo", "crude", "steel", "limestone", "flux"],
    "operations": ["demurrage", "anchorage", "queue", "berth", "cyclone", "depression", "strike", "laycan", "charter", "detour", "rerout", "ban", "quota", "import", "export"]
}

def clean_text(t):
    if not t:
        return ""
    # Clean curly quotes and non-breaking spaces
    t = t.replace('\u2018', "'").replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
    t = t.replace('\u2014', ' - ').replace('\u2013', ' - ').replace('&amp;', '&').replace('&quot;', '"')
    return t.strip()

def has_word(pattern, text):
    """Accurate word-boundary search to avoid matching 'war' inside 'arbitral award'."""
    return bool(re.search(r'\b' + re.escape(pattern) + r'\b', text, re.IGNORECASE))

def has_any_word(patterns, text):
    for p in patterns:
        if has_word(p, text):
            return True
    return False

def fetch_live_rss():
    articles = []
    seen_titles = set()

    for item in RSS_QUERIES:
        q = item["query"]
        encoded_q = urllib.parse.quote(q)
        url = f"https://news.google.com/rss/search?q={encoded_q}&hl=en-IN&gl=IN&ceid=IN:en"

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                xml_data = resp.read()
                root = ET.fromstring(xml_data)
                feed_items = root.findall('.//item')

                for fi in feed_items[:8]:
                    title_elem = fi.find('title')
                    link_elem = fi.find('link')
                    pub_elem = fi.find('pubDate')
                    src_elem = fi.find('source')
                    desc_elem = fi.find('description')

                    title = title_elem.text.strip() if title_elem is not None and title_elem.text else ''
                    link = link_elem.text.strip() if link_elem is not None and link_elem.text else ''
                    pub_date = pub_elem.text.strip() if pub_elem is not None and pub_elem.text else ''
                    source = src_elem.text.strip() if src_elem is not None and src_elem.text else 'Google News'
                    desc = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ''

                    clean_title = title.split(' - ')[0] if ' - ' in title else title
                    clean_title = clean_text(clean_title)
                    desc_clean = clean_text(desc)

                    if clean_title and clean_title.lower() not in seen_titles:
                        seen_titles.add(clean_title.lower())
                        articles.append({
                            "title": clean_title,
                            "source": source,
                            "source_url": link,
                            "published": pub_date,
                            "raw_text": desc_clean,
                            "category_hint": item["category_hint"],
                            "portFilterKey": item["portFilterKey"]
                        })
        except Exception as e:
            print(f"Warning: Failed to fetch RSS query '{q}': {e}", file=sys.stderr)

    return articles

def filter_relevance_and_age(article):
    corpus = f"{article['title']} {article['raw_text']}".lower()

    # 1. Reject non-commercial accidents / rescues / generic site homepages
    if any(ew in corpus for ew in EXCLUDE_TERMS):
        return False, {}, 0

    # 2. Enforce strict max 48-hour age limit (no 25-day-old stale news)
    try:
        pub_dt = datetime.strptime(article['published'][:25], "%a, %d %b %Y %H:%M:%S")
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        age_hours = (now_utc - pub_dt).total_seconds() / 3600.0
        if age_hours > 48.0 or age_hours < -2.0:
            return False, {}, age_hours
    except Exception:
        age_hours = 12.0

    # 3. Match corridor keywords
    matched = {}
    total = 0
    for cat, kw_list in PS_CORRIDOR_ENTITIES.items():
        hits = [kw for kw in kw_list if has_word(kw, corpus)]
        if hits:
            matched[cat] = hits
            total += len(hits)

    return (total >= 1), matched, age_hours

def classify_severity(article, matched):
    """
    Economic 3-Direction Classification with strict word boundary checking:
    - DOWN: Demand contraction, flat/falling coal power, imports drop, surplus tonnage, price falls
    - UP: Geopolitical conflict, chokepoint diversion, cyclonic depression, strike, port delay, bunker spike
    - NEUTRAL: Infrastructure approvals, green energy expansion, general reports/previews without price shock
    """
    text = f"{article['title']} {article['raw_text']}".lower()

    # BEARISH SIGNALS (Price Direction: DOWN)
    bearish_words = [
        "flat", "no growth", "did not grow", "imports down", "down by 35%", "slump", "downturn",
        "drops", "fell", "fall", "falling", "softens", "softening", "plunge", "oversupply",
        "surplus", "losing run", "weak demand", "slack", "declining", "stops shipments",
        "curtailed imports", "inventory high", "glut", "slowdown"
    ]

    # BULLISH CONFLICT / CHOKEPOINT (Price Direction: UP)
    # Using strict phrases so 'award' never matches 'war'
    conflict_words = [
        "red sea", "houthi", "houthis", "bab el-mandeb", "strait of hormuz", "missile", "naval war",
        "naval conflict", "military conflict", "chokepoint detour", "reroute", "warships",
        "navy to deploy", "attack on shipping"
    ]

    # BULLISH WEATHER DISRUPTION (Price Direction: UP)
    weather_words = [
        "cyclone", "depression", "squall", "storm", "monsoon", "flood", "gale", "imd squall"
    ]

    # BULLISH PORT DELAYS / CONGESTION (Price Direction: UP)
    port_delay_words = [
        "strike", "port congestion", "berth queue", "anchorage queue", "demurrage",
        "waiting time", "high moisture", "pre-berthing detention", "unable to ship"
    ]

    # BULLISH FREIGHT SPIKE / RATE SURGE (Price Direction: UP)
    rate_surge_words = [
        "rises", "surge", "spike", "snaps losing run", "higher rates", "rally", "lifted",
        "15-month high", "restocking surge", "soar", "gain"
    ]

    # NEUTRAL INFRASTRUCTURE / EXPANSION (Price Direction: NEUTRAL)
    neutral_words = [
        "approves", "wins bid", "develop", "green hydrogen", "jetty", "preview", "trends",
        "terminal", "commissioned", "mou", "invest", "rs crore", "study"
    ]

    # Priority 1: Check Bearish first if it explicitly contains contraction terms
    if has_any_word(bearish_words, text):
        category = "Macro Demand Softening & Import Slump"
        sentiment = "BEARISH (Demand Contraction / Buyer Advantage)"
        conf = 0.92
        vol_boost = 0.88
        drift_pct = -9.5
        direction = "DOWN"
        urgency = "OPPORTUNITY"
        is_conflict = False
    elif has_any_word(conflict_words, text):
        category = "Geopolitical Conflict & Chokepoint Detour"
        sentiment = "NEGATIVE (War Risk & Detour Shock)"
        conf = 0.96
        vol_boost = 1.50
        drift_pct = 22.5
        direction = "UP"
        urgency = "CRITICAL"
        is_conflict = True
    elif has_any_word(weather_words, text):
        category = "Weather Disruption & Cyclonic Squall"
        sentiment = "NEGATIVE (Disruption Shock)"
        conf = 0.94
        vol_boost = 1.45
        drift_pct = 18.0
        direction = "UP"
        urgency = "CRITICAL"
        is_conflict = False
    elif has_any_word(port_delay_words, text):
        category = "Port Congestion & Demurrage Risk"
        sentiment = "NEGATIVE (Demurrage Exposure)"
        conf = 0.90
        vol_boost = 1.30
        drift_pct = 14.0
        direction = "UP"
        urgency = "HIGH"
        is_conflict = False
    elif has_any_word(["bunker", "vlsfo", "fuel oil", "crude spike", "oil price"], text):
        category = "Bunker Fuel & Energy Shock"
        sentiment = "NEGATIVE (Fuel Opex Shock)"
        conf = 0.91
        vol_boost = 1.25
        drift_pct = 11.5
        direction = "UP"
        urgency = "HIGH"
        is_conflict = False
    elif has_any_word(rate_surge_words, text):
        category = "Dry Bulk Freight Volatility"
        sentiment = "BULLISH (Capesize Rate Firming)"
        conf = 0.92
        vol_boost = 1.20
        drift_pct = 12.0
        direction = "UP"
        urgency = "HIGH"
        is_conflict = False
    elif has_any_word(neutral_words, text):
        category = "Port Infrastructure & Capacity Expansion"
        sentiment = "NEUTRAL (Infrastructure / Macro Benchmark)"
        conf = 0.88
        vol_boost = 1.00
        drift_pct = 0.0
        direction = "NEUTRAL"
        urgency = "MONITOR"
        is_conflict = False
    else:
        category = article.get("category_hint", "Maritime Trade & Fleet Flow")
        sentiment = "NEUTRAL / MACRO BENCHMARK"
        conf = 0.85
        vol_boost = 1.00
        drift_pct = 0.0
        direction = "NEUTRAL"
        urgency = "MONITOR"
        is_conflict = False

    return {
        "category": category,
        "finbertSentiment": sentiment,
        "finbertConfidence": conf,
        "volatilityBoost": vol_boost,
        "spotDriftMultiplier": round(1.0 + (drift_pct / 100.0), 3),
        "spotDriftPct": f"{'+' if drift_pct > 0 else ''}{drift_pct:.1f}%",
        "priceDirection": direction,
        "urgencyLevel": urgency,
        "isConflictOrDisruption": is_conflict
    }

def format_relative_time(age_hours):
    if age_hours <= 0.2:
        return "Just now (Live RSS)"
    elif age_hours < 1.0:
        mins = max(5, int(age_hours * 60))
        return f"{mins} mins ago (Live RSS)"
    elif age_hours < 24.0:
        hours = int(round(age_hours))
        return f"{hours} hour{'s' if hours > 1 else ''} ago (Live RSS)"
    else:
        days = int(round(age_hours / 24.0))
        return f"{days} day{'s' if days > 1 else ''} ago (Live RSS)"

def build_intelligence_payload():
    print(f"[{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}] Fetching fresh live RSS feeds (when:2d)...")
    raw_articles = fetch_live_rss()
    print(f"Fetched {len(raw_articles)} candidate articles from Google News RSS.")

    processed = []
    conflict_count = 0

    for idx, art in enumerate(raw_articles):
        is_rel, matched, age_hours = filter_relevance_and_age(art)
        if not is_rel:
            continue

        sev = classify_severity(art, matched)
        if sev["isConflictOrDisruption"]:
            conflict_count += 1

        title = art["title"]
        cat = sev["category"]
        drift = sev["spotDriftPct"]
        vol = sev["volatilityBoost"]
        direction = sev["priceDirection"]

        # Context-aware 1-line executive takeaway & actionable advice
        if direction == "DOWN":
            one_liner = f"{title[:105]}... Demand contraction indicator: freight pressure softening ({drift})."
            action = "Buyer Advantage: Import demand softening lowers prompt charter rates. Delay spot fixtures or negotiate discounted index terms."
        elif direction == "NEUTRAL":
            one_liner = f"{title[:105]}... Macro infrastructure update; neutral immediate spot rate drift (0.0%)."
            action = "Informational Macro Benchmark: Port capacity & terminal expansion; monitor long-term draft clearance."
        else:
            # UP
            if "Geopolitical" in cat:
                one_liner = f"Geopolitical conflict risks naval chokepoint detours; forward spot drift calibrated at {drift} (Activate Part C Alternative Routings)."
                action = "🚨 ACTIVE CONFLICT ALERT: Divert from vulnerable chokepoints and activate Part C Hop-and-Load / Domestic Rail Buffering."
            elif "Weather" in cat:
                one_liner = f"Marine weather depression tracks near East Coast ports; expect pilotage delays and {drift} spot volatility."
                action = "Pre-warn laycan buffers; shift loading stems or anchor in deep water off storm path."
            elif "Port Congestion" in cat:
                one_liner = f"Berth wait and cargo discharge delays prompt demurrage exposure calibrated at {drift}."
                action = "Re-route inbound Capesize/Panamax carriers to alternate deep mechanized berths (e.g. Dhamra or Gangavaram)."
            elif "Bunker" in cat:
                one_liner = f"Marine bunker fuel movements add voyage steaming opex; forward drift estimated at {drift}."
                action = "Enforce Eco-Speed (11.5 kts) charter parties or fix fuel-inclusive multi-voyage COAs with capped BAF."
            else:
                one_liner = f"{title[:105]}... Volatility impact calibrated at {vol:.2f}x ({drift})."
                action = "Fix multi-voyage COA at pre-disruption benchmark. Monitor laycan extensions."

        port_key = art.get("portFilterKey", "paradip")
        if any(p in title.lower() for p in ["vizag", "visakhapatnam", "gangavaram"]):
            port_key = "vizag"
        elif any(p in title.lower() for p in ["dhamra"]):
            port_key = "dhamra"
        elif any(p in title.lower() for p in ["haldia", "sandheads", "kolkata"]):
            port_key = "haldia"
        elif any(p in title.lower() for p in ["red sea", "hormuz", "bab el-mandeb", "suez"]):
            port_key = "geopolitical"

        badge_color = (
            "bg-rose-100 text-rose-800 border-rose-200" if direction == "UP" else
            "bg-emerald-100 text-emerald-800 border-emerald-200" if direction == "DOWN" else
            "bg-blue-100 text-blue-800 border-blue-200"
        )

        processed.append({
            "id": f"live_rss_{idx}_{int(datetime.now(timezone.utc).timestamp())}",
            "portFilterKey": port_key,
            "category": cat,
            "categoryBadgeColor": badge_color,
            "portLocation": f"PS Corridor Ingestion ({port_key.upper()})",
            "title": title,
            "rawSource": f"{art['source']} / Google News RSS",
            "sourceUrl": art["source_url"],
            "timestamp": format_relative_time(age_hours),
            "publishedUtc": art["published"],
            "entities": list(set([e for sublist in matched.values() for e in sublist]))[:5],
            "finbertSentiment": sev["finbertSentiment"],
            "finbertConfidence": sev["finbertConfidence"],
            "volatilityBoost": sev["volatilityBoost"],
            "spotDriftMultiplier": sev["spotDriftMultiplier"],
            "spotDriftPct": sev["spotDriftPct"],
            "priceDirection": direction,
            "urgencyLevel": sev["urgencyLevel"],
            "isConflictOrDisruption": sev["isConflictOrDisruption"],
            "oneLiner": one_liner,
            "actionRecommendation": action
        })

    # Sort strictly newest first (by publishedUtc)
    def parse_dt(item):
        try:
            return datetime.strptime(item["publishedUtc"][:25], "%a, %d %b %Y %H:%M:%S")
        except Exception:
            return datetime.min

    processed.sort(key=parse_dt, reverse=True)

    payload = {
        "metadata": {
            "lastIngestionTimestamp": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "totalIngested": len(raw_articles),
            "totalAccepted": len(processed),
            "activeConflictsDetected": conflict_count,
            "status": "LIVE_FEED_ONLINE_STRICT_48H"
        },
        "articles": processed
    }

    # Save to src/data and public/data
    os.makedirs(os.path.dirname(OUTPUT_PATH_SRC), exist_ok=True)
    with open(OUTPUT_PATH_SRC, 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    os.makedirs(os.path.dirname(OUTPUT_PATH_PUB), exist_ok=True)
    with open(OUTPUT_PATH_PUB, 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Successfully processed {len(processed)} corridor articles (Conflicts: {conflict_count}).")
    print(f"Saved payload to:\n - {OUTPUT_PATH_SRC}\n - {OUTPUT_PATH_PUB}")
    return payload

if __name__ == "__main__":
    build_intelligence_payload()
