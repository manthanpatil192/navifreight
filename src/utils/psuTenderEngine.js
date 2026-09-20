import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

// Helper functions for dynamic date arithmetic
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function formatDayMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

// Ground-Truth Port-to-Plant Coal Consumption Benchmarks (SAIL / RINL / Indian Steel Parameters)
export const PORT_COAL_CONSUMPTION_PROFILES = {
  paradip: {
    portId: 'paradip',
    portName: 'Paradip Port (PPT)',
    plantName: 'SAIL Rourkela Steel Plant (RSP)',
    dailyBurnMT: 12200,
    monthlyBurnMT: 366000,
    safetyNormDays: 15,
    safetyStockMT: 183000,
    hinterlandLink: '390 km rail link to Rourkela'
  },
  dhamra: {
    portId: 'dhamra',
    portName: 'Dhamra Port (DPCL)',
    plantName: 'SAIL Bokaro Steel Plant (BSL)',
    dailyBurnMT: 13000,
    monthlyBurnMT: 390000,
    safetyNormDays: 15,
    safetyStockMT: 195000,
    hinterlandLink: '410 km dedicated rail line to Bokaro'
  },
  vizag: {
    portId: 'vizag',
    portName: 'Visakhapatnam Port (VPA)',
    plantName: 'SAIL Bhilai (BSP) / RINL Vizag',
    dailyBurnMT: 11500,
    monthlyBurnMT: 345000,
    safetyNormDays: 15,
    safetyStockMT: 172500,
    hinterlandLink: '560 km rail link to Bhilai / coastal RINL'
  },
  gangavaram: {
    portId: 'gangavaram',
    portName: 'Gangavaram Port (GPL)',
    plantName: 'SAIL Bhilai Steel Plant (BSP)',
    dailyBurnMT: 11500,
    monthlyBurnMT: 345000,
    safetyNormDays: 15,
    safetyStockMT: 172500,
    hinterlandLink: 'Automated conveyor & 560 km Bhilai rail trunk'
  },
  haldia: {
    portId: 'haldia',
    portName: 'Haldia Dock Complex (HDC)',
    plantName: 'SAIL Durgapur (DSP) & IISCO (ISP)',
    dailyBurnMT: 6800,
    monthlyBurnMT: 204000,
    safetyNormDays: 15,
    safetyStockMT: 102000,
    hinterlandLink: '220 km SER rail head to Durgapur/Burnpur'
  },
  gopalpur: {
    portId: 'gopalpur',
    portName: 'Gopalpur Port',
    plantName: 'Regional Secondary Steel & DRI Mills',
    dailyBurnMT: 7500,
    monthlyBurnMT: 225000,
    safetyNormDays: 15,
    safetyStockMT: 112500,
    hinterlandLink: '430 km South Odisha rail link'
  },
  sandheads: {
    portId: 'sandheads',
    portName: 'Sagar / Sandheads Anchorage',
    plantName: 'Transshipment Feeder to SAIL Durgapur',
    dailyBurnMT: 6800,
    monthlyBurnMT: 204000,
    safetyNormDays: 15,
    safetyStockMT: 102000,
    hinterlandLink: 'River barge lightering corridor'
  }
};

/**
 * Builds a dynamic, statutory-compliant PSU freight tender plan 
 * coupled with route transit times, industrial coal consumption rates,
 * and contract horizon scheduling (1-Month prompt vs 3-Month quarterly vs 6-Month multi-voyage).
 */
export function buildPsuTenderPlan({
  originId = 'hay_point',
  destinationId = 'paradip',
  vesselKey = 'capesize',
  volumeMT = 150000,
  horizonMonths = 3,
  cargoType = 'Coking Coal',
  baseDate = null,
  coaSplit = 70
}) {
  const originObj = ORIGIN_LOADING_PORTS[originId] || { name: 'Hay Point (Australia)', distanceToEastCoastNM: 5350 };
  const destObj = INDIAN_EAST_COAST_PORTS[destinationId] || { name: 'Paradip Port (PPT)', maxDraftLaden: 16.0, avgWaitDays: 2.5 };
  const vesselObj = VESSEL_CLASSES[vesselKey] || { name: 'Capesize', dwt: 180000, ladenDraftMeters: 16.0 };

  const plantProfile = PORT_COAL_CONSUMPTION_PROFILES[destinationId] || PORT_COAL_CONSUMPTION_PROFILES.paradip;
  const dailyBurnMT = plantProfile.dailyBurnMT || 12200;
  const safetyStockMT = plantProfile.safetyStockMT || (dailyBurnMT * 15);
  const daysOfBasestockCover = Number((volumeMT / dailyBurnMT).toFixed(1));
  const totalHorizonConsumptionMT = Math.round(dailyBurnMT * (horizonMonths * 30));

  const distanceNM = originObj.distanceToEastCoastNM || 5350;
  // Standard bulk carrier eco-speed: 12.0 knots (~18.6 days) | Express speed: 15.5 knots (~14.4 days)
  const sailingDays = Number((distanceNM / (12 * 24)).toFixed(1));
  const expressSailingDays = Number((distanceNM / (15.5 * 24)).toFixed(1));

  // Dynamic reference date
  const refDate = baseDate instanceof Date 
    ? baseDate 
    : (typeof baseDate === 'string' && !isNaN(new Date(baseDate).getTime()) 
        ? new Date(baseDate) 
        : new Date());

  const todayDate = formatDate(refDate);

  // Dynamic Tranche Split based on Active Risk Matrix (e.g. 70% COA / 30% Spot, or dynamic coaSplit)
  const coaPercent = coaSplit !== undefined && coaSplit !== null ? coaSplit : 70;
  const spotPercent = 100 - coaPercent;
  const tranche1VolumeMT = Math.round((volumeMT * coaPercent) / 100);
  const tranche2VolumeMT = volumeMT - tranche1VolumeMT;

  // 1. TRANCHE 1: Dynamic Prompt Tender (Base COA Contract - Issued Today):
  // 21 days mandatory statutory notice period (GFR 2017 Rule 161)
  const promptNoticeClose = addDays(refDate, 21);
  const promptLaycanStart = addDays(promptNoticeClose, 1);
  const promptLaycanEnd = addDays(promptLaycanStart, 7);
  const promptLaycanWindow = `${formatDayMonth(promptLaycanStart)} – ${formatDayMonth(promptLaycanEnd)}, ${promptLaycanStart.getFullYear()}`;

  const promptBookingStart = addDays(promptLaycanStart, -2);
  const promptBookingEnd = addDays(promptLaycanStart, -1);
  const promptBookingDate = `${formatDayMonth(promptBookingStart)} – ${formatDayMonth(promptBookingEnd)}, ${promptLaycanStart.getFullYear()}`;

  const promptArrivalStart = addDays(promptLaycanEnd, Math.round(sailingDays));
  const promptArrivalEnd = addDays(promptArrivalStart, 5);
  const promptArrivalDate = `${formatDayMonth(promptArrivalStart)} – ${formatDayMonth(promptArrivalEnd)}, ${promptArrivalStart.getFullYear()}`;

  // 2. TRANCHE 2: Dynamic Forward Dip Tender (Spot Replenishment Optimization):
  // Horizon-calibrated to plant daily burn rate, stockyard replenishment cadence & forward curve:
  let dipOffsetDays = 60;
  if (horizonMonths <= 1) {
    dipOffsetDays = 28;
  } else if (horizonMonths === 2) {
    dipOffsetDays = 45;
  } else if (horizonMonths === 3) {
    dipOffsetDays = 60;
  } else if (horizonMonths === 4) {
    dipOffsetDays = 75;
  } else if (horizonMonths === 5) {
    dipOffsetDays = 85;
  } else {
    // 6-Month Horizon (Multi-voyage program across 180 days)
    dipOffsetDays = 95;
  }

  const dipStart = addDays(refDate, dipOffsetDays);
  const dipEnd = addDays(dipStart, 7);
  const targetDipWindow = `${formatDayMonth(dipStart)} – ${formatDayMonth(dipEnd)}, ${dipStart.getFullYear()}`;

  // Must issue 21-day tender notice exactly 21 days before target loading
  const tenderPublishDate = addDays(dipStart, -21);
  const tenderPublishDeadline = formatDate(tenderPublishDate);

  // Booking & reverse auction award (1-2 days before laycan start)
  const bookingStart = addDays(dipStart, -2);
  const bookingEnd = addDays(dipStart, -1);
  const bookingDate = `${formatDayMonth(bookingStart)} – ${formatDayMonth(bookingEnd)}, ${dipStart.getFullYear()}`;

  // Dynamic arrival & discharge in India after sailing transit
  const arrivalStart = addDays(dipEnd, Math.round(sailingDays));
  const arrivalEnd = addDays(arrivalStart, 5);
  const arrivalDate = `${formatDayMonth(arrivalStart)} – ${formatDayMonth(arrivalEnd)}, ${arrivalStart.getFullYear()}`;

  // Tailored, consumption-grounded secondary tender advice
  let secondaryTenderAdvice = "";
  if (horizonMonths >= 5) {
    secondaryTenderAdvice = `🟢 6-MONTH TRANCHE 2 REPLENISHMENT (${spotPercent}% Spot - ${tranche2VolumeMT.toLocaleString()} MT): Float secondary tender notice on ${tenderPublishDeadline} for ${targetDipWindow} Laycan to capture the seasonal P10 low freight dip, replenishing ${plantProfile.plantName} stockyard (${dailyBurnMT.toLocaleString()} MT/day burn) before winter surge.`;
  } else if (horizonMonths >= 3) {
    secondaryTenderAdvice = `🟢 3-MONTH TRANCHE 2 SCHEDULE (${spotPercent}% Spot - ${tranche2VolumeMT.toLocaleString()} MT): Float secondary tender notice on ${tenderPublishDeadline} for ${targetDipWindow} Laycan to capture the quarterly P10 freight dip, maintaining ${plantProfile.plantName} safety buffer without demurrage.`;
  } else {
    secondaryTenderAdvice = `🟢 SPOT RE-ORDER ADVICE (${spotPercent}% Spot - ${tranche2VolumeMT.toLocaleString()} MT): Monitor daily spot freight; if rates dip towards ${targetDipWindow}, issue next monthly tender notice on ${tenderPublishDeadline}.`;
  }

  const tenderContractType = `Global Dual-Tranche Freight E-Tender (${volumeMT.toLocaleString()} MT ${cargoType})`;
  const tenderLotDescription = `Dual-Tranche Procurement: ${tranche1VolumeMT.toLocaleString()} MT Tranche 1 (${coaPercent}% Base COA) + ${tranche2VolumeMT.toLocaleString()} MT Tranche 2 (${spotPercent}% Spot Dip) for ${destObj.name.split('(')[0].trim()}`;
  
  const tenderStrategyAdvice = horizonMonths >= 5
    ? `Execute Dual-Tranche Strategy: Tranche 1 (${coaPercent}% COA, ${tranche1VolumeMT.toLocaleString()} MT) tendered today (${todayDate}) for ${promptLaycanWindow} Laycan. Tranche 2 (${spotPercent}% Spot, ${tranche2VolumeMT.toLocaleString()} MT) tendered on ${tenderPublishDeadline} for ${targetDipWindow} Laycan, aligned with ${plantProfile.plantName} burn (${dailyBurnMT.toLocaleString()} MT/day).`
    : (horizonMonths >= 3
        ? `Execute Dual-Tranche Strategy: Tranche 1 (${coaPercent}% COA, ${tranche1VolumeMT.toLocaleString()} MT) loads ${promptLaycanWindow}; Tranche 2 (${spotPercent}% Spot, ${tranche2VolumeMT.toLocaleString()} MT) tendered by ${tenderPublishDeadline} for ${targetDipWindow} Laycan.`
        : `Execute Prompt Program: Tender today (${todayDate}) for ${promptLaycanWindow} Laycan within statutory notice.`);

  const tenderTag = horizonMonths >= 5 
    ? `6-Month Dual-Tranche (${coaPercent}% COA / ${spotPercent}% Spot)` 
    : (horizonMonths >= 3 ? `Quarterly Dual-Tranche (${coaPercent}% COA / ${spotPercent}% Spot)` : '21-Day Statutory Tender');

  const tranche1 = {
    name: `Tranche 1: Base COA Contract (${coaPercent}%)`,
    allocationPct: coaPercent,
    volumeMT: tranche1VolumeMT,
    noticeFloatDate: todayDate,
    bookingDate: promptBookingDate,
    laycanWindow: promptLaycanWindow,
    arrivalDate: promptArrivalDate,
    purpose: `Immediate blast furnace feed & 15-day safety buffer (${safetyStockMT.toLocaleString()} MT) protection`,
    contractType: 'COA Wholesale Fixed'
  };

  const tranche2 = {
    name: `Tranche 2: Forward Spot Optimization (${spotPercent}%)`,
    allocationPct: spotPercent,
    volumeMT: tranche2VolumeMT,
    noticeFloatDate: tenderPublishDeadline,
    bookingDate: bookingDate,
    laycanWindow: targetDipWindow,
    arrivalDate: arrivalDate,
    purpose: `P10 seasonal dip freight savings & mid-horizon stockyard replenishment`,
    contractType: 'Spot E-Reverse Auction'
  };

  const milestoneSteps = [
    {
      step: 1,
      title: `Tranche 1 Tender Float (Today)`,
      date: todayDate,
      detail: `Issue 21-day notice for ${coaPercent}% Base COA volume (${tranche1VolumeMT.toLocaleString()} MT) on mjunction/CPPP to lock plant feed.`,
      icon: 'FileText'
    },
    {
      step: 2,
      title: `Tranche 1 Loading (Laycan)`,
      date: promptLaycanWindow,
      detail: `First vessel loads at origin, sailing ~${sailingDays}d to discharge at ${plantProfile.portName} (ETA: ${promptArrivalDate}).`,
      icon: 'Ship'
    },
    {
      step: 3,
      title: `Tranche 2 Tender Float`,
      date: tenderPublishDeadline,
      detail: `Publish 21-day notice for ${spotPercent}% Spot volume (${tranche2VolumeMT.toLocaleString()} MT) targeting the seasonal P10 low freight window.`,
      icon: 'Clock'
    },
    {
      step: 4,
      title: `Tranche 2 Dip Laycan`,
      date: targetDipWindow,
      detail: `Secondary vessel loads during forecasted freight dip to capture wholesale savings without congesting stockyard.`,
      icon: 'CheckCircle2'
    },
    {
      step: 5,
      title: `Discharge & Stockyard Feed`,
      date: arrivalDate,
      detail: `Arrives at destination; rail feed to ${plantProfile.plantName} (${dailyBurnMT.toLocaleString()} MT/day burn) maintains 15-day safety reserve.`,
      icon: 'Anchor'
    }
  ];

  const tenderId = `TDR-${refDate.getFullYear()}-${(originObj.name || 'ORG').substring(0, 3).toUpperCase()}-${(destObj.name || 'DST').substring(0, 3).toUpperCase()}-${vesselKey.substring(0, 4).toUpperCase()}`;

  return {
    tenderId,
    routeTitle: `${originObj.name.split('(')[0].trim()} ➔ ${destObj.name.split('(')[0].trim()}`,
    originName: originObj.name,
    destName: destObj.name,
    distanceNM,
    sailingDays,
    expressSailingDays,
    transitDescription: `~${sailingDays}d eco-transit at 12.0 kts (or ~${expressSailingDays}d express at 15.5 kts)`,
    cargoVolumeMT: volumeMT,
    cargoType,
    vesselName: vesselObj.name,
    todayDate,
    promptLaycanWindow,
    promptBookingDate,
    promptArrivalDate,
    targetDipWindow,
    tenderPublishDeadline,
    bookingDate,
    arrivalDate,
    tranche1,
    tranche2,
    milestoneSteps,
    tenderNoticeDays: 21,
    tenderContractType,
    tenderLotDescription,
    tenderStrategyAdvice,
    secondaryTenderAdvice,
    plantConsumption: {
      portId: destinationId,
      portName: plantProfile.portName,
      plantName: plantProfile.plantName,
      dailyBurnMT,
      monthlyBurnMT: plantProfile.monthlyBurnMT,
      safetyNormDays: plantProfile.safetyNormDays,
      safetyStockMT,
      daysOfBasestockCover,
      totalHorizonConsumptionMT,
      hinterlandLink: plantProfile.hinterlandLink
    },
    tenderTag
  };
}
