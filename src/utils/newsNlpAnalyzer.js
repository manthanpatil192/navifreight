/**
 * NaviFreight - Client-Side Global News NLP & Macro Disruption Analyzer
 * Parses any arbitrary global news headline, breaks down key market shocks
 * (routing detour, bunker fuel, weather, port congestion, fleet supply, steel demand)
 * and returns quantitative shock modifiers for the ML inference engine.
 */

export function analyzeGlobalNewsNlp(newsText) {
  const textLower = (newsText || '').toLowerCase();

  // 1. Geopolitical & Routing Detour Indicators
  const reroutingKeywords = ['red sea', 'suez', 'panama', 'bab el-mandeb', 'cape of good hope', 
                             'rerout', 'detour', 'strait of hormuz', 'houthi', 'canal drought', 
                             'extra sailing', 'ton-mile', 'transit restrictions', 'cape route'];
  const reroutingScore = reroutingKeywords.filter(kw => textLower.includes(kw)).length;

  // 2. Bunker Fuel & Energy Indicators
  const bunkerKeywords = ['bunker', 'vlsfo', 'fuel', 'crude', 'brent', 'opec', 'oil spike', 
                          'carbon tax', 'eu ets', 'refinery', 'fuel surcharge'];
  const bunkerScore = bunkerKeywords.filter(kw => textLower.includes(kw)).length;

  // 3. Weather & Cyclone Indicators
  const weatherKeywords = ['cyclone', 'typhoon', 'hurricane', 'monsoon', 'storm', 'depression', 
                           'squall', 'swell', 'imd', 'bureau of meteorology', 'bom', 'flooding', 
                           'weather warning', 'high wave', 'jasper'];
  const weatherScore = weatherKeywords.filter(kw => textLower.includes(kw)).length;

  // 4. Port Congestion & Labor Strike Indicators
  const congestionKeywords = ['strike', 'lockout', 'port congestion', 'anchorage', 'queue', 
                              'waiting time', 'berth delay', 'dockworker', 'union', 'demurrage', 
                              'draft siltation', 'channel closed'];
  const congestionScore = congestionKeywords.filter(kw => textLower.includes(kw)).length;

  // 5. Vessel Supply & Fleet Availability Indicators
  const supplyKeywords = ['capesize squeeze', 'tonnage tight', 'vessel shortage', 'ballast', 
                          'scrapping', 'baltic dry', 'bdi surge', 'shipowner', 'chartering tight'];
  const supplyScore = supplyKeywords.filter(kw => textLower.includes(kw)).length;

  // 6. Steel Demand & Commodity Price Indicators
  const demandKeywords = ['steel', 'iron ore', 'coking coal', 'blast furnace', 'stimulus', 
                          'restocking', 'china demand', 'infrastructure', 'car production', 
                          'crude steel', 'pmi surge'];
  const demandScore = demandKeywords.filter(kw => textLower.includes(kw)).length;

  // Quantitative Impact Calibration
  let volatilityMult = 1.0;
  let spotDrift = 0.0;
  let congestionDays = 2.5;
  const categories = [];

  if (reroutingScore > 0) {
    volatilityMult += Math.min(0.60, 0.25 * reroutingScore);
    spotDrift += Math.min(8.5, 2.5 * reroutingScore);
    congestionDays += Math.min(12.0, 3.5 * reroutingScore);
    categories.push("GEOPOLITICAL REROUTING (+Ton-Mile Demand)");
  }
  if (bunkerScore > 0) {
    volatilityMult += Math.min(0.35, 0.15 * bunkerScore);
    spotDrift += Math.min(4.5, 1.2 * bunkerScore);
    categories.push("BUNKER FUEL ESCALATION (+Steaming Costs)");
  }
  if (weatherScore > 0) {
    volatilityMult += Math.min(0.70, 0.30 * weatherScore);
    spotDrift += Math.min(6.0, 1.8 * weatherScore);
    congestionDays += Math.min(10.0, 3.0 * weatherScore);
    categories.push("METEOROLOGICAL SHOCK (Pilotage Suspensions & Swells)");
  }
  if (congestionScore > 0) {
    volatilityMult += Math.min(0.45, 0.20 * congestionScore);
    spotDrift += Math.min(4.0, 1.5 * congestionScore);
    congestionDays += Math.min(14.0, 3.5 * congestionScore);
    categories.push("PORT CONGESTION & CHOKEPOINT (Demurrage Accumulation)");
  }
  if (supplyScore > 0) {
    volatilityMult += Math.min(0.40, 0.18 * supplyScore);
    spotDrift += Math.min(5.0, 2.0 * supplyScore);
    categories.push("TONNAGE SQUEEZE (Pacific/Atlantic Vessel Shortage)");
  }
  if (demandScore > 0) {
    volatilityMult += Math.min(0.30, 0.12 * demandScore);
    spotDrift += Math.min(3.5, 1.4 * demandScore);
    categories.push("INDUSTRIAL RESTOCKING (Steel Mill Procurement Surge)");
  }

  if (categories.length === 0) {
    categories.push("MACRO MARKET SYNCHRONIZATION (Baseline Sentiment)");
    volatilityMult = 1.05;
    spotDrift = 0.5;
    congestionDays = 2.8;
  }

  let recommendedCoaPct = 65.0;
  let riskLevel = "MODERATE / STABLE";
  if (volatilityMult >= 1.50 || spotDrift >= 4.0) {
    recommendedCoaPct = 85.0;
    riskLevel = "CRITICAL / HIGH VOLATILITY";
  } else if (volatilityMult >= 1.25 || spotDrift >= 2.0) {
    recommendedCoaPct = 75.0;
    riskLevel = "ELEVATED RISK";
  }

  return {
    headline: newsText,
    primaryDrivers: categories,
    riskLevel,
    volatilityMultiplier: Number(volatilityMult.toFixed(2)),
    spotDriftUsd: Number(spotDrift.toFixed(2)),
    congestionDays: Number(congestionDays.toFixed(1)),
    recommendedCoaPct,
    recommendedSpotPct: 100.0 - recommendedCoaPct
  };
}
