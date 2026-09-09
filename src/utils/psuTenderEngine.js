import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

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
  cargoType = 'Coking Coal'
}) {
  const originObj = ORIGIN_LOADING_PORTS[originId] || { name: 'Hay Point (Australia)', distanceToEastCoastNM: 4120 };
  const destObj = INDIAN_EAST_COAST_PORTS[destinationId] || { name: 'Paradip Port (PPT)', maxDraftLaden: 16.0, avgWaitDays: 2.5 };
  const vesselObj = VESSEL_CLASSES[vesselKey] || { name: 'Capesize', dwt: 180000, ladenDraftMeters: 16.0 };

  const distanceNM = originObj.distanceToEastCoastNM || 4120;
  // Standard bulk carrier steaming speed: 12 knots
  const sailingDays = Number((distanceNM / (12 * 24)).toFixed(1));

  // Determine dynamic forward dip laycan dates based on transit duration:
  // Short route (<10d, e.g. Indonesia ~8d): dip window Sep 22 – Sep 29, 2026. 21-day notice: Sep 01, 2026.
  // Medium route (10-22d, e.g. Australia/South Africa/Mozambique ~14-17d): dip window Oct 12 – Oct 19, 2026. 21-day notice: Sep 21, 2026.
  // Long route (>22d, e.g. USA ~34d, Russia ~19d): dip window Oct 28 – Nov 05, 2026. 21-day notice: Oct 07, 2026.
  let targetDipWindow = 'Oct 12 – Oct 19, 2026';
  let tenderPublishDeadline = 'Sep 21, 2026';

  if (sailingDays < 10) {
    targetDipWindow = 'Sep 22 – Sep 29, 2026';
    tenderPublishDeadline = 'Sep 01, 2026';
  } else if (sailingDays > 22) {
    targetDipWindow = 'Oct 28 – Nov 05, 2026';
    tenderPublishDeadline = 'Oct 07, 2026';
  }

  // One Simple Unified Tender Model
  const tenderContractType = `Global Freight E-Tender (${volumeMT.toLocaleString()} MT ${cargoType})`;
  const tenderLotDescription = `Procurement of ${volumeMT.toLocaleString()} MT ${cargoType} destined for ${destObj.name.split('(')[0].trim()}`;
  const tenderStrategyAdvice = `Issue 21-day tender by ${tenderPublishDeadline} to book vessel in time for the ${targetDipWindow} freight dip.`;
  const tenderTag = '21-Day Statutory Tender';

  // Dynamic 4-step tender-to-discharge milestones
  let bookingDate = 'Oct 10 – Oct 11, 2026';
  let arrivalDate = 'Oct 27 – Nov 01, 2026';

  if (sailingDays < 10) {
    bookingDate = 'Sep 20 – Sep 21, 2026';
    arrivalDate = 'Sep 30 – Oct 05, 2026';
  } else if (sailingDays > 22) {
    bookingDate = 'Oct 26 – Oct 27, 2026';
    arrivalDate = 'Nov 20 – Nov 28, 2026';
  }

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
    vesselKey,
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
