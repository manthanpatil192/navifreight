import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

/**
 * Builds a dynamic, statutory-compliant PSU freight tender plan 
 * coupled with route transit times, vessel class ROFR dynamics, and contract horizons.
 */
export function buildPsuTenderPlan({
  originId = 'hay_point',
  destinationId = 'paradip',
  vesselKey = 'capesize',
  volumeMT = 150000,
  horizonMonths = 3,
  cargoType = 'Coking Coal',
  weatherHalt = false
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

  // ROFR Dynamics (MoPSW / DG Shipping 2020 Framework)
  const isCapesize = vesselKey === 'capesize';
  const isPanamax = vesselKey === 'panamax' || vesselKey === 'post_panamax';
  const isSupramax = vesselKey === 'supramax' || vesselKey === 'handymax' || vesselKey === 'handysize';

  const rofrSharePercent = isCapesize ? 2.5 : (isPanamax ? 28.0 : 68.0);
  const rofrLikelihoodBadge = isCapesize ? 'Low (~2.5%)' : (isPanamax ? 'Moderate (~28%)' : 'High (~68%)');
  const rofrDirective = isCapesize
    ? 'Domestic Indian-flagged Capesize availability is ~2.5%. ROFR matching is rare (<5%). Expected tender award goes directly to foreign L1 bidder without administrative delay.'
    : (isPanamax
      ? 'Indian-flagged Panamax fleet availability is ~28%. Allow standard 3–5 working days for Indian-flagged owners (SCI / Great Eastern) to evaluate matching foreign L1 bid before final award.'
      : 'Indian-flagged Supramax availability is ~68%. High probability of domestic owners exercising statutory ROFR to match L1 bid. Factor domestic allocation into discharge schedule.');

  const rofrWaitingImpact = isCapesize ? 'Zero Delay (Direct Foreign L1 Award)' : (isPanamax ? '3–5 Days Matching Window' : '5–7 Days Domestic Allocation');

  // Dynamic Contract Strategy based on Terminal Horizon
  let tenderContractType = '3-Month Quarterly COA Master Tender';
  let tenderLotDescription = `Master Program for ${volumeMT.toLocaleString()} MT split across 3 monthly laycans (~${Math.round(volumeMT / 3).toLocaleString()} MT/month)`;
  let tenderStrategyAdvice = 'Issue 1 Master COA tender covering 70% basestock with flexible monthly laycan call-offs; retain 30% spot flexibility for market dips.';
  let tenderTag = 'Quarterly COA Program';

  if (Number(horizonMonths) === 1) {
    tenderContractType = 'Single-Voyage Spot E-Tender';
    tenderLotDescription = `1 Immediate Consignment of ${volumeMT.toLocaleString()} MT (+/- 10% MOLOO)`;
    tenderStrategyAdvice = 'Single-consignment prompt fixture. Avoid multi-month balance sheet lockup while capturing current open-market capacity.';
    tenderTag = 'Spot Fixture Tender';
  } else if (Number(horizonMonths) === 6) {
    tenderContractType = 'Bi-Annual 6-Month Master COA Program';
    tenderLotDescription = `Master Program for ${volumeMT.toLocaleString()} MT split across 6 monthly laycans (~${Math.round(volumeMT / 6).toLocaleString()} MT/month)`;
    tenderStrategyAdvice = 'Issue 1 comprehensive bi-annual master tender with BAF bunker escalation clause; locks volume rebate and guarantees priority discharge berthing.';
    tenderTag = '6-Month Master Program';
  }

  // Technical Port & Berth Constraints
  const portMaxDraft = destObj.maxDraftLaden || 14.5;
  const vesselLadenDraft = vesselObj.ladenDraftMeters || 16.0;
  const draftExceeded = vesselLadenDraft > portMaxDraft;

  let technicalDraftClause = `Permissible draft ${portMaxDraft}m verified for ${destObj.name}. Direct berthing approved.`;
  if (destObj.id === 'haldia' || destinationId === 'haldia') {
    technicalDraftClause = `⚠️ MANDATORY PORT LIMIT: Max draft 8.5m at HDC. Vessel must be Geared Supramax/Handymax (4x30T Cranes + Grabs) or lightered at Sandheads.`;
  } else if (draftExceeded) {
    technicalDraftClause = `⚠️ TIDAL / LIGHTERAGE CLAUSE: Vessel draft (${vesselLadenDraft}m) exceeds port standard draft (${portMaxDraft}m). Tender must specify high-tide berthing slot or prior lightening at outer anchorage.`;
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
    rofrSharePercent,
    rofrLikelihoodBadge,
    rofrDirective,
    rofrWaitingImpact,
    tenderContractType,
    tenderLotDescription,
    tenderStrategyAdvice,
    tenderTag,
    technicalDraftClause,
    draftExceeded
  };
}
