// Vessel Port Suitability, Demurrage & Multi-Scenario Financial Calculators
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

/**
 * Evaluates all vessel types against the chosen East Coast destination port
 */
export function evaluateAllVesselsForPort(portId = 'paradip', cargoParcelMT = 150000) {
  const port = INDIAN_EAST_COAST_PORTS[portId] || INDIAN_EAST_COAST_PORTS.paradip;

  return Object.values(VESSEL_CLASSES).map(vessel => {
    const isCapacitySufficient = vessel.cargoCapacityMT >= cargoParcelMT;
    const parcelToLoad = Math.min(cargoParcelMT, vessel.cargoCapacityMT);
    const tripsRequired = Math.ceil(cargoParcelMT / vessel.cargoCapacityMT);
    
    // Draft clearance calculation
    const draftMargin = Number((port.maxDraftLaden - vessel.ladenDraftMeters).toFixed(2));
    const draftMarginHighTide = Number((port.maxDraftHighTide - vessel.ladenDraftMeters).toFixed(2));
    
    // Feasibility status
    let status = 'OPTIMAL';
    let statusBadge = 'green';
    let fitScore = 95;
    let remarks = `Optimal draft clearance (+${draftMargin}m) and high handling throughput.`;

    if (draftMargin < 0 && draftMarginHighTide >= 0) {
      status = 'TIDAL WINDOW REQUIRED';
      statusBadge = 'yellow';
      fitScore = 80;
      remarks = `Laden draft (${vessel.ladenDraftMeters}m) exceeds normal berth draft. Berthing restricted to high-tide windows (+${draftMarginHighTide}m).`;
    } else if (draftMarginHighTide < 0) {
      if (portId === 'haldia' || portId === 'gopalpur') {
        status = 'TRANSSHIPMENT REQUIRED';
        statusBadge = 'blue';
        fitScore = 55;
        remarks = `Draft violation (${vessel.ladenDraftMeters}m vs ${port.maxDraftHighTide}m max). Requires lightening at Sagar/Sandheads.`;
      } else {
        status = 'DRAFT RESTRICTED';
        statusBadge = 'red';
        fitScore = 30;
        remarks = `Exceeds maximum allowable harbor depth (${port.maxDraftHighTide}m). High grounding risk.`;
      }
    }

    // Handysize penalty on large parcels
    if (vessel.id === 'handysize' && cargoParcelMT > 70000) {
      fitScore -= 20;
      remarks += ` Requires ${tripsRequired} separate voyages due to 35k MT capacity limit.`;
    }

    // Demurrage calculation
    const dischargeDays = Number((parcelToLoad / port.handlingRateTPD).toFixed(1));
    const estimatedWaitDays = port.avgWaitDays;
    const demurrageDailyINR = port.demurragePerDayINR;
    const potentialDemurrageExposureINR = Number(((estimatedWaitDays * demurrageDailyINR) / 100000).toFixed(1)); // in ₹ Lakhs

    // Estimated Landed Freight $/MT baseline
    const landedFreightUSD = Number((14.50 * (vessel.economyOfScaleMultiplier || 1.0) * (tripsRequired > 1 ? 1.12 : 1.0)).toFixed(2));

    return {
      vessel,
      port,
      status,
      statusBadge,
      fitScore,
      draftMargin,
      draftMarginHighTide,
      ladenDraft: vessel.ladenDraftMeters,
      maxPortDraft: port.maxDraftLaden,
      maxPortDraftHighTide: port.maxDraftHighTide,
      tripsRequired,
      dischargeDays,
      estimatedWaitDays,
      demurrageExposureLakhs: potentialDemurrageExposureINR,
      landedFreightUSD,
      remarks
    };
  }).sort((a, b) => b.fitScore - a.fitScore);
}

/**
 * Format numbers as USD currency
 */
export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format numbers as INR Currency (Crores / Lakhs)
 */
export function formatINR(amountCr) {
  return `₹${amountCr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr`;
}
