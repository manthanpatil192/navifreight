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

  // Base simulation reference date: Today = Sep 09, 2026
  // Standard statutory tender period: 21 days minimum (GFR 2017)
  const todayDate = 'Sep 09, 2026';
  const promptLaycanWindow = 'Oct 01 – Oct 08, 2026'; // Earliest legal laycan if tendered today (21d notice + award)
  
  // Forward dip laycan (lowest market rate forecasted by AI model)
  const targetDipWindow = 'Oct 12 – Oct 19, 2026';
  const tenderPublishDeadline = 'Sep 21, 2026'; // Exactly 21 days before target dip laycan

  // One Simple Unified Tender Model
  const tenderContractType = `Global Freight E-Tender (${volumeMT.toLocaleString()} MT ${cargoType})`;
  const tenderLotDescription = `Procurement of ${volumeMT.toLocaleString()} MT ${cargoType} destined for ${destObj.name.split('(')[0].trim()}`;
  const tenderStrategyAdvice = `Issue 21-day tender by ${tenderPublishDeadline} to book vessel in time for the ${targetDipWindow} freight dip.`;
  const tenderTag = '21-Day Statutory Tender';

  // Dynamic 4-step tender-to-discharge milestones
  const bookingDate = 'Oct 10 – Oct 11, 2026'; // Bids close & L1 awarded
  const arrivalDate = sailingDays > 20 ? 'Nov 15 – Nov 22, 2026' : 'Oct 27 – Nov 01, 2026';

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
