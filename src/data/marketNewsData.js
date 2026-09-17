import { TrendingUp, TrendingDown, AlertTriangle, Ship, Anchor, Globe, BarChart3 } from 'lucide-react';

const getDynamicWindow = (startDays, endDays) => {
  const d1 = new Date();
  d1.setDate(d1.getDate() + startDays);
  const d2 = new Date();
  d2.setDate(d2.getDate() + endDays);
  const m1 = d1.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const m2 = d2.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${m1} – ${m2}`;
};

const getDynamicDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

export const MARKET_NEWS_SIGNALS = [
  {
    id: 'weather_cyclone',
    category: 'WEATHER ALERT',
    region: 'Bay of Bengal / IMD',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    headline: 'IMD Issues Yellow Alert: Low Pressure Area Forming Over Bay of Bengal',
    detail: 'India Meteorological Department has identified a low-pressure system (LP) at 16.2°N, 88.5°E expected to intensify into a depression in next 48-72 hours. Coastal squall warnings issued for Odisha-Andhra coast with wind speeds of 28-35 knots. Paradip and Dhamra pilotage may suspend for 24-48 hours if system strengthens.',
    source: 'India Meteorological Department (IMD)',
    sourceUrl: 'https://mausam.imd.gov.in',
    timestamp: 'Just Now (Live Alert)',
    impact: 'HIGH DISRUPTION SHOCK',
    impactColor: 'text-red-700 bg-red-100',
    // Mathematical & Decision Modifiers
    spotDriftMultiplier: 1.18, // +18% spot surge
    coaDiscountModifier: 0.86,
    volatilityBoost: 1.45,
    recommendedWindow: `${getDynamicWindow(0, 5)} (EXECUTE IMMEDIATELY)`,
    urgencyLevel: 'CRITICAL',
    strategyHeadline: 'Lock 80% COA + 20% Fast-Berth Hedge',
    strategyDetails: 'Fix maximum volume on multi-voyage COA at pre-cyclone rates. Avoid entering open spot market during port queue suspension.',
    delayConsequenceHeadline: 'Severe Anchorage Demurrage & +18% Spot Rate Jump',
    delayConsequenceDetails: `Delaying past ${getDynamicDate(5)} exposes cargo to post-cyclone berth congestion queue (estimated 4.8 days wait) and $26,000/day demurrage penalty.`
  },
  {
    id: 'bdi_surge',
    category: 'FREIGHT MARKET',
    region: 'Global / Baltic Exchange',
    icon: TrendingUp,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    headline: 'Baltic Dry Index (BDI) Surges +8.3% Week-on-Week to 1,847 pts',
    detail: 'BDI closed at 1,847 points on Aug 28, 2026. Capesize 5TC average hit $22,450/day (+12.1%), driven by iron ore restocking demand from Chinese steel mills ahead of Q4 production targets. Panamax 4TC held steady at $14,200/day.',
    source: 'Baltic Exchange London',
    sourceUrl: 'https://www.balticexchange.com',
    timestamp: '2 mins ago (Live Feed)',
    impact: 'BULLISH FOR SPOT RATES',
    impactColor: 'text-red-700 bg-red-100',
    // Modifiers
    spotDriftMultiplier: 1.14,
    coaDiscountModifier: 0.88,
    volatilityBoost: 1.25,
    recommendedWindow: `${getDynamicWindow(0, 7)} (Pre-Q4 Restocking Window)`,
    urgencyLevel: 'HIGH',
    strategyHeadline: 'Lock 70% COA + 30% Spot Floating',
    strategyDetails: 'Lock forward multiple voyage contracts before Chinese Q4 iron ore restocking absorbs remaining Pacific Capesize capacity.',
    delayConsequenceHeadline: '+$2.40/MT Spot Rate Escalation in October',
    delayConsequenceDetails: 'Waiting into Q4 will force spot fixtures at peak freight rates ($17.50+/MT) driven by tight Pacific vessel supply.'
  },
  {
    id: 'port_congestion',
    category: 'PORT CONGESTION',
    region: 'Paradip / East Coast',
    icon: Anchor,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    headline: 'Paradip Port Anchorage Queue Hits 14 Vessels — 3.2 Day Average Wait',
    detail: 'Port of Paradip daily traffic report shows 14 bulk carriers at anchorage (up from 9 last week). Average waiting time increased to 3.2 days. Berths 7-10 (coal handling) operating at 94% utilization. Gangavaram reports 6 vessels with 1.4 day wait.',
    source: 'Paradip Port Authority Daily Traffic PDF',
    sourceUrl: 'https://paradipport.gov.in',
    timestamp: '8 mins ago',
    impact: 'DEMURRAGE ALERT',
    impactColor: 'text-orange-700 bg-orange-100',
    // Modifiers
    spotDriftMultiplier: 1.09,
    coaDiscountModifier: 0.89,
    volatilityBoost: 1.20,
    recommendedWindow: `${getDynamicWindow(2, 10)} (Diversion Advisory)`,
    urgencyLevel: 'MEDIUM-HIGH',
    strategyHeadline: 'Split Parcels: 60% Paradip COA + 40% Vizag/Dhamra Diversion',
    strategyDetails: 'Utilize deepwater berths at Gangavaram or Dhamra for prompt discharge while Paradip resolves conveyor maintenance queue.',
    delayConsequenceHeadline: '₹4.2 Crores Cumulative Demurrage Exposure',
    delayConsequenceDetails: 'Vessels arriving without scheduled laytime windows will idle at outer anchorage costing ₹65 Lakhs/day.'
  },
  {
    id: 'coking_coal_drop',
    category: 'COMMODITY PRICE',
    region: 'Australia / World Bank',
    icon: TrendingDown,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    headline: 'Australian Premium Hard Coking Coal FOB Drops to $218/MT (-4.1%)',
    detail: 'World Bank Commodity Pink Sheet reports Australian HCC benchmark at $218/MT FOB, down from $227/MT in July. Newcastle thermal coal (6000 kcal NAR) steady at $138/MT. Indonesian HBA Index (4200 GAR) at $67.50/MT.',
    source: 'World Bank Pink Sheet',
    sourceUrl: 'https://www.worldbank.org/en/research/commodity-markets',
    timestamp: '25 mins ago',
    impact: 'BEARISH / BUYERS MARKET',
    impactColor: 'text-emerald-700 bg-emerald-100',
    // Modifiers
    spotDriftMultiplier: 0.94, // -6% freight softening
    coaDiscountModifier: 0.93,
    volatilityBoost: 0.90,
    recommendedWindow: `${getDynamicWindow(7, 21)} (HOLD / WAIT FOR DIPS)`,
    urgencyLevel: 'LOW',
    strategyHeadline: 'Hold Spot Charters / Stagger Procurement',
    strategyDetails: 'Commodity softening stabilizes charter market. Maintain 60% spot flexibility to capture freight rate discounts as owners compete for cargoes.',
    delayConsequenceHeadline: 'Minimal Penalty — Potential Spot Savings of $0.80/MT',
    delayConsequenceDetails: 'Locking a long-term contract prematurely risks overpaying if freight rates adjust downward with commodity prices.'
  },
  {
    id: 'vessel_supply_squeeze',
    category: 'VESSEL SUPPLY',
    region: 'Shanghai / SSE',
    icon: Ship,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    headline: 'Pacific Capesize Tonnage Tightens — Only 32 Vessels Open in Next 14 Days',
    detail: 'SSE Pacific region report shows only 32 Capesize vessels available for spot fixture in the next 14 days (vs 48 in the same period last month). Owners are pushing for higher rates. Newcastle/Hay Point-India route assessed at $14.80/MT.',
    source: 'Shanghai Shipping Exchange (SSE)',
    sourceUrl: 'https://en.sse.net.cn',
    timestamp: '42 mins ago',
    impact: 'SUPPLY SQUEEZE',
    impactColor: 'text-blue-700 bg-blue-100',
    // Modifiers
    spotDriftMultiplier: 1.11,
    coaDiscountModifier: 0.87,
    volatilityBoost: 1.15,
    recommendedWindow: `${getDynamicWindow(1, 8)} (Lock Tonnage Promptly)`,
    urgencyLevel: 'HIGH',
    strategyHeadline: 'Lock 75% 3-Month COA + 25% Spot Option',
    strategyDetails: 'Secure dedicated tonnage contracts to guarantee vessel availability and protect against shipowner rate escalation.',
    delayConsequenceHeadline: 'Risk of Ballast Wait Times and Premium Spot Fixtures',
    delayConsequenceDetails: 'Uncommitted charterers will be forced to pay ballast bonuses ($150k–$250k) to reposition vessels from the Atlantic.'
  },
  {
    id: 'bunker_fuel_spike',
    category: 'BUNKER FUEL',
    region: 'Global Shipping / Multi-Port',
    icon: BarChart3,
    iconColor: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    headline: 'Global 20-Ports Average VLSFO Bunker Price at $852/MT (+2.1%)',
    detail: 'Global 20-Ports Average VLSFO (0.5% Sulphur IMO 2020 Benchmark) bunker price at $852/MT, up from $835/MT last week across major bunkering hubs. Higher bunker costs add approximately $0.45/MT to Australia-India freight on Capesize routes and $0.70/MT on USA-India routes due to longer steaming distances.',
    source: 'Ship & Bunker / Bunkerworld (IMO 2020 Benchmark)',
    sourceUrl: 'https://shipandbunker.com',
    timestamp: '2 hours ago',
    impact: 'FUEL COST ESCALATION',
    impactColor: 'text-slate-700 bg-slate-100',
    // Modifiers
    spotDriftMultiplier: 1.06,
    coaDiscountModifier: 0.90,
    volatilityBoost: 1.10,
    recommendedWindow: `${getDynamicWindow(0, 10)} (Implement Eco-Speed Clauses)`,
    urgencyLevel: 'MEDIUM',
    strategyHeadline: 'Lock COA with 11.5 Knots Eco-Steaming Clause',
    strategyDetails: 'Negotiate fuel-indexed charter contracts with 11.5 knot eco-speed clauses to offset $0.35/MT bunker inflation.',
    delayConsequenceHeadline: '+$0.35 to +$0.50/MT Ocean Freight Fuel Surcharge',
    delayConsequenceDetails: 'Rising marine fuel prices will automatically elevate spot freight benchmarks across all major Pacific routes.'
  }
];
