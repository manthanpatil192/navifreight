// Predictive Freight Rate AI Engine & Multi-Horizon Inference Simulator
import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

/**
 * Computes dynamic freight rates, confidence intervals, and contract optimization recommendations
 * Dynamically coupled with active live market news / weather / economic shock signals.
 */
export function calculateFreightForecast({
  originId = 'hay_point',
  destinationId = 'paradip',
  vesselId = 'capesize',
  cargoMT = 150000,
  horizonMonths = 3,
  marketVolatilityMultiplier = 1.0,
  activeNewsSignal = null
}) {
  const origin = ORIGIN_LOADING_PORTS[originId] || ORIGIN_LOADING_PORTS.hay_point;
  const dest = INDIAN_EAST_COAST_PORTS[destinationId] || INDIAN_EAST_COAST_PORTS.paradip;
  const vessel = VESSEL_CLASSES[vesselId] || VESSEL_CLASSES.capesize;

  // Base nautical distance formula
  const distanceNM = origin.distanceToEastCoastNM;
  const speedKnots = 12.8;
  const sailingDaysOneWay = distanceNM / (speedKnots * 24);
  
  // Fuel and voyage costs
  const vlsfoPriceUSD = activeNewsSignal?.id === 'bunker_fuel_spike' ? 645 : 620; // $/MT
  const bunkerDailyCostUSD = vessel.dailyFuelConsumptionMT * vlsfoPriceUSD;
  const portDischargeDays = cargoMT / (dest.handlingRateTPD || 45000);
  const totalVoyageDays = sailingDaysOneWay + portDischargeDays + 2.5; // +2.5 loading/canal/anchorage

  // Base Freight Rate ($/MT)
  const baselineTCE = vessel.baselineDailyTimeCharterRateUSD;
  const totalOperatingCostUSD = (totalVoyageDays * baselineTCE) + (sailingDaysOneWay * bunkerDailyCostUSD) + 120000; // +120k port dues
  const baseFreightUSDPerMT = (totalOperatingCostUSD / cargoMT) * (vessel.economyOfScaleMultiplier || 1.0);

  // Current Spot Freight Rate
  const currentSpotRateUSD = Number((baseFreightUSDPerMT * 1.08).toFixed(2));
  
  // Dynamic News Modifiers
  const newsDriftMultiplier = activeNewsSignal?.spotDriftMultiplier || 1.0;
  const newsVolatilityBoost = activeNewsSignal?.volatilityBoost || 1.0;

  // Multi-Voyage Contract (COA) Discount factor (contract volume efficiency + charterer hedging)
  const baseCoaDiscountFactor = horizonMonths === 1 ? 0.96 : horizonMonths === 3 ? 0.88 : horizonMonths === 6 ? 0.84 : 0.81;
  const coaDiscountFactor = activeNewsSignal?.coaDiscountModifier ? (baseCoaDiscountFactor * (activeNewsSignal.coaDiscountModifier / 0.88)) : baseCoaDiscountFactor;
  const coaRateUSD = Number((currentSpotRateUSD * coaDiscountFactor).toFixed(2));

  // Future Forecast Projection (LightGBM + Prophet Seasonal Model projection + News Shock)
  const seasonalDrift = horizonMonths === 1 ? 0.04 : horizonMonths === 3 ? 0.16 : horizonMonths === 6 ? 0.22 : 0.14;
  const combinedDrift = (1 + seasonalDrift * marketVolatilityMultiplier) * newsDriftMultiplier;
  const projectedSpotRateUSD = Number((currentSpotRateUSD * combinedDrift).toFixed(2));
  
  // 95% Bayesian Confidence Interval
  const confidenceMargin = Number((projectedSpotRateUSD * 0.045 * newsVolatilityBoost).toFixed(2));
  const upperBound95 = Number((projectedSpotRateUSD + confidenceMargin).toFixed(2));
  const lowerBound95 = Number((projectedSpotRateUSD - confidenceMargin).toFixed(2));

  // Savings computation
  const spotTotalCostUSD = projectedSpotRateUSD * cargoMT;
  const coaTotalCostUSD = coaRateUSD * cargoMT;
  const netSavingsUSD = spotTotalCostUSD - coaTotalCostUSD;
  const inrConversionRate = 86.5;
  const netSavingsINR = (netSavingsUSD * inrConversionRate) / 10000000; // in ₹ Crores
  const percentageSavings = Number((((projectedSpotRateUSD - coaRateUSD) / projectedSpotRateUSD) * 100).toFixed(1));

  // Recommendation logic coupled with active news
  let recommendationBadge = 'LOCK MULTI-VOYAGE COA';
  let badgeColor = 'emerald';
  let adviceRationale = `Strong forward escalation detected for ${origin.name} ➔ ${dest.name}. Locking a ${horizonMonths}-month COA now protects against a projected ${percentageSavings}% spot market escalation.`;

  if (activeNewsSignal?.id === 'coking_coal_drop' || percentageSavings < 5) {
    recommendationBadge = 'STAY ON SPOT / SHORT-TERM';
    badgeColor = 'amber';
    adviceRationale = 'Freight market in temporary lull; spot rates offer superior short-term flexibility.';
  } else if (activeNewsSignal?.id === 'weather_cyclone') {
    recommendationBadge = 'CRITICAL: LOCK COA IMMEDIATELY';
    badgeColor = 'rose';
    adviceRationale = 'Active Bay of Bengal cyclone alert will trigger severe post-storm congestion queues and freight rate spikes.';
  }

  return {
    origin,
    destination: dest,
    vessel,
    sailingDays: Number(sailingDaysOneWay.toFixed(1)),
    portDischargeDays: Number(portDischargeDays.toFixed(1)),
    totalVoyageDays: Number(totalVoyageDays.toFixed(1)),
    currentSpotRateUSD,
    projectedSpotRateUSD,
    coaRateUSD,
    upperBound95,
    lowerBound95,
    spotTotalCostUSD,
    coaTotalCostUSD,
    netSavingsUSD,
    netSavingsINR: Number(netSavingsINR.toFixed(2)),
    percentageSavings,
    recommendationBadge,
    badgeColor,
    adviceRationale,
    activeNewsSignal
  };
}

/**
 * Generates dynamic time series for the Forecast Chart that immediately responds to Phase 1 inputs and Active News
 */
export function generateDynamicTimeSeries(forecast, multiplier = 1) {
  const baseSpot = forecast.currentSpotRateUSD;
  const coaFixed = forecast.coaRateUSD;
  const newsSignal = forecast.activeNewsSignal;
  const newsMult = newsSignal?.spotDriftMultiplier || 1.0;
  const newsBoost = newsSignal?.volatilityBoost || 1.0;

  // Relative historical factors from 2023 to 2026
  const historicalFactors = [
    { date: '2023-01', factor: 0.94, coaFactor: 0.88, sse: 1120 },
    { date: '2023-05', factor: 0.97, coaFactor: 0.89, sse: 1180 },
    { date: '2023-09', factor: 1.11, coaFactor: 0.91, sse: 1320 },
    { date: '2024-01', factor: 1.07, coaFactor: 0.92, sse: 1290 },
    { date: '2024-05', factor: 1.00, coaFactor: 0.92, sse: 1210 },
    { date: '2024-09', factor: 1.08, coaFactor: 0.93, sse: 1300 },
    { date: '2025-01', factor: 1.01, coaFactor: 0.91, sse: 1220 },
    { date: '2025-05', factor: 1.06, coaFactor: 0.92, sse: 1280 },
    { date: '2025-09', factor: 1.13, coaFactor: 0.94, sse: 1350 },
    { date: '2026-01', factor: 1.04, coaFactor: 0.93, sse: 1250 },
    { date: '2026-05', factor: 1.09, coaFactor: 0.94, sse: 1310 },
    { date: '2026-08 (Current)', factor: 1.00, coaFactor: coaFixed / baseSpot, sse: 1205 }
  ];

  const formattedHistorical = historicalFactors.map(item => {
    const spot = Number((baseSpot * item.factor * multiplier).toFixed(1));
    const coa = Number((baseSpot * item.coaFactor * multiplier).toFixed(1));
    return {
      time: item.date,
      spotRate: spot,
      coaRate: coa,
      upperBound: null,
      lowerBound: null,
      sseIndex: item.sse,
      dgcisActual: Number((spot * 1.02).toFixed(1)),
      isForecast: false,
      recommendation: 'Historical Actual'
    };
  });

  // Forward 6 months dynamically calculated from active Phase 1 forecast + active news shock
  const forwardDrifts = [
    {
      month: 'Sep 2026',
      spotMult: 1.041 * newsMult,
      coaMult: 0.924,
      ciRange: 0.042 * newsBoost,
      recommendation: newsSignal ? `[${newsSignal.impact}] EXECUTE WINDOW` : 'ACCUMULATE 3M COA',
      rationale: newsSignal ? newsSignal.headline : `Post-monsoon restocking begins for ${forecast.destination.name}; freight demand climbing.`
    },
    {
      month: 'Oct 2026',
      spotMult: 1.126 * newsMult,
      coaMult: 0.933,
      ciRange: 0.045 * newsBoost,
      recommendation: newsMult > 1.1 ? 'CRITICAL: LOCK COA FIX' : 'LOCK COA CONTRACT',
      rationale: `Seasonal coal charter competition from ${forecast.origin.name} coupled with ${newsSignal?.headline || 'market momentum'}.`
    },
    {
      month: 'Nov 2026',
      spotMult: 1.196 * newsMult,
      coaMult: 0.943,
      ciRange: 0.048 * newsBoost,
      recommendation: newsMult > 1.1 ? 'PEAK RATE WARNING' : 'STRONG BUY (COA FIX)',
      rationale: 'Peak winter steel production spike; spot market heavily priced.'
    },
    {
      month: 'Dec 2026',
      spotMult: 1.227 * newsMult,
      coaMult: 0.955,
      ciRange: 0.052 * newsBoost,
      recommendation: 'EXECUTE MULTI-VOYAGE',
      rationale: `Peak charter premiums. Multi-voyage COA delivers ${forecast.percentageSavings}% savings.`
    },
    {
      month: 'Jan 2027',
      spotMult: 1.113 * newsMult,
      coaMult: 0.943,
      ciRange: 0.055 * newsBoost,
      recommendation: 'MONITOR WEATHER RISKS',
      rationale: `Q1 seasonal weather alerts introduce vessel queuing at ${forecast.origin.name}.`
    },
    {
      month: 'Feb 2027',
      spotMult: 1.069 * newsMult,
      coaMult: 0.930,
      ciRange: 0.050 * newsBoost,
      recommendation: 'ROLLOVER CONTRACT',
      rationale: 'Lunar New Year lull stabilizes Pacific spot market.'
    }
  ];

  const formattedForecast = forwardDrifts.map(item => {
    const spotVal = Number((baseSpot * item.spotMult * multiplier).toFixed(1));
    const coaVal = Number((coaFixed * multiplier).toFixed(1));
    const ciMargin = spotVal * item.ciRange;
    const upperBound = Number((spotVal + ciMargin).toFixed(1));
    const lowerBound = Number((spotVal - ciMargin).toFixed(1));

    return {
      time: item.month,
      spotRate: spotVal,
      coaRate: coaVal,
      upperBound: upperBound,
      lowerBound: lowerBound,
      sseIndex: Math.round(spotVal * 78),
      dgcisActual: null,
      isForecast: true,
      recommendation: item.recommendation,
      rationale: item.rationale
    };
  });

  return {
    historical: formattedHistorical,
    forecast: formattedForecast
  };
}
