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

/**
 * Builds a dynamic, statutory-compliant PSU freight tender plan 
 * coupled with route transit times and COA vs Spot contract horizons.
 */
export function buildPsuTenderPlan({
  originId = 'hay_point',
  destinationId = 'paradip',
  vesselKey = 'capesize',
  volumeMT = 150000,
  horizonMonths = 3,
  cargoType = 'Coking Coal',
  baseDate = null
}) {
  const originObj = ORIGIN_LOADING_PORTS[originId] || { name: 'Hay Point (Australia)', distanceToEastCoastNM: 4120 };
  const destObj = INDIAN_EAST_COAST_PORTS[destinationId] || { name: 'Paradip Port (PPT)', maxDraftLaden: 16.0, avgWaitDays: 2.5 };
  const vesselObj = VESSEL_CLASSES[vesselKey] || { name: 'Capesize', dwt: 180000, ladenDraftMeters: 16.0 };

  const distanceNM = originObj.distanceToEastCoastNM || 4120;
  // Standard bulk carrier steaming speed: 12 knots
  const sailingDays = Number((distanceNM / (12 * 24)).toFixed(1));

  // Dynamic reference date: uses provided baseDate, or defaults to 2026-09-09 baseline
  const refDate = baseDate instanceof Date 
    ? baseDate 
    : (typeof baseDate === 'string' && !isNaN(new Date(baseDate).getTime()) 
        ? new Date(baseDate) 
        : new Date(2026, 8, 9)); // Month 8 = September in JS (0-indexed)

  const todayDate = formatDate(refDate);

  // 1. Dynamic Prompt Tender (If issued today):
  // 21 days mandatory statutory notice period (GFR 2017)
  const promptNoticeClose = addDays(refDate, 21);
  const promptLaycanStart = addDays(promptNoticeClose, 1);
  const promptLaycanEnd = addDays(promptLaycanStart, 7);
  const promptLaycanWindow = `${formatDayMonth(promptLaycanStart)} – ${formatDayMonth(promptLaycanEnd)}, ${promptLaycanStart.getFullYear()}`;

  // 2. Dynamic Forward Dip Tender (Lowest forecasted P10 rate window):
  // Deepest freight dip occurs ~33 to 40 days ahead of tender planning
  const dipStart = addDays(refDate, 33);
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

  // One Simple Unified Tender Model
  const tenderContractType = `Global Freight E-Tender (${volumeMT.toLocaleString()} MT ${cargoType})`;
  const tenderLotDescription = `Procurement of ${volumeMT.toLocaleString()} MT ${cargoType} destined for ${destObj.name.split('(')[0].trim()}`;
  const tenderStrategyAdvice = `Issue 21-day tender by ${tenderPublishDeadline} to book vessel in time for the ${targetDipWindow} freight dip.`;
  const tenderTag = '21-Day Statutory Tender';

  const milestoneSteps = [
    {
      step: 1,
      title: 'Tender Float (Start)',
      date: tenderPublishDeadline,
      detail: 'Publish 21-day notice on mjunction / CPPP portal to open public bidding.',
      icon: 'FileText'
    },
    {
      step: 2,
      title: 'Ship Booked (Award)',
      date: bookingDate,
      detail: 'Bids open, reverse auction/L1 award finalized, Charter Party fixed.',
      icon: 'CheckCircle2'
    },
    {
      step: 3,
      title: 'Vessel Loading (Laycan)',
      date: targetDipWindow,
      detail: `Ship tenders NOR & loads ${volumeMT.toLocaleString()} MT at origin during P10 freight dip.`,
      icon: 'Ship'
    },
    {
      step: 4,
      title: 'Discharge & Rail Feed',
      date: arrivalDate,
      detail: `Arrives at destination after ~${sailingDays}d sea transit; unloaded to rail rakes.`,
      icon: 'Anchor'
    }
  ];

  const tenderId = `TDR-2026-${(originObj.name || 'ORG').substring(0, 3).toUpperCase()}-${(destObj.name || 'DST').substring(0, 3).toUpperCase()}-${vesselKey.substring(0, 4).toUpperCase()}`;

  return {
    tenderId,
    routeTitle: `${originObj.name.split('(')[0].trim()} ➔ ${destObj.name.split('(')[0].trim()}`,
    originName: originObj.name,
    destName: destObj.name,
    distanceNM,
    sailingDays,
    cargoVolumeMT: volumeMT,
    cargoType,
    vesselName: vesselObj.name,
    todayDate,
    promptLaycanWindow,
    targetDipWindow,
    tenderPublishDeadline,
    bookingDate,
    arrivalDate,
    milestoneSteps,
    tenderNoticeDays: 21,
    tenderContractType,
    tenderLotDescription,
    tenderStrategyAdvice,
    tenderTag
  };
}
