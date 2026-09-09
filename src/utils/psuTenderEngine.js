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

  // Dynamic COA vs Spot Contract Architecture
  let tenderContractType = '3-Month Quarterly COA Master Tender';
  let tenderLotDescription = `Master COA Program for ${volumeMT.toLocaleString()} MT across 3 monthly shipments (~${Math.round(volumeMT / 3).toLocaleString()} MT/month)`;
  let tenderStrategyAdvice = 'Float 1 Master COA Tender covering 70% basestock. Individual voyages are then executed via simple laycan call-off notices without floating new tenders.';
  let tenderTag = 'Quarterly COA Program';

  if (Number(horizonMonths) === 1) {
    tenderContractType = 'Single-Voyage Spot E-Tender';
    tenderLotDescription = `1 Prompt Consignment of ${volumeMT.toLocaleString()} MT (+/- 10% MOLOO)`;
    tenderStrategyAdvice = 'Single-consignment spot fixture. Suitable for prompt demand, but requires a full 21-day tender cycle for this single shipment.';
    tenderTag = 'Spot Fixture Tender';
  } else if (Number(horizonMonths) === 6) {
    tenderContractType = 'Bi-Annual 6-Month Master COA Program';
    tenderLotDescription = `Master COA Program for ${volumeMT.toLocaleString()} MT across 6 monthly shipments (~${Math.round(volumeMT / 6).toLocaleString()} MT/month)`;
    tenderStrategyAdvice = 'Float 1 Master Long-Term COA Tender with bunker escalation clause (BAF). Eliminates 6 separate tender cycles and guarantees continuous blast furnace feed.';
    tenderTag = '6-Month Master COA';
  }

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
    tenderNoticeDays: 21,
    tenderContractType,
    tenderLotDescription,
    tenderStrategyAdvice,
    tenderTag
  };
}
