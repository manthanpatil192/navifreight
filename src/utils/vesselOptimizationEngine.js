import { INDIAN_EAST_COAST_PORTS, ORIGIN_LOADING_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

/**
 * PS Part (b) Core Engine: Vessel Type Optimization
 * Evaluates candidate vessel types (Handysize, Supramax, Panamax, Capesize)
 * against origin and East Coast Indian discharge port infrastructure limitations
 * (draft restrictions, LOA, handling TPD, idle turnaround, demurrage avoidance).
 */
export function optimizeVesselType({
  originId = 'hay_point',
  destinationId = 'paradip',
  cargoVolumeMT = 150000,
  cargoType = 'Coking Coal'
}) {
  const origin = ORIGIN_LOADING_PORTS[originId] || ORIGIN_LOADING_PORTS.hay_point;
  const dest = INDIAN_EAST_COAST_PORTS[destinationId] || INDIAN_EAST_COAST_PORTS.paradip;

  // Candidate vessel profiles strictly aligned with PS Part (b)
  const candidateVessels = [
    {
      id: 'capesize',
      name: 'Capesize',
      category: 'Capesize',
      dwt: 180000,
      capacityMT: 165000,
      ladenDraft: 18.2,
      loa: 292,
      dailyCharterUSD: 24500,
      demurragePerDayUSD: 26000,
      fuelBurnMT: 42,
      scaleFactor: 0.72,
      desc: '160,000–180,000 DWT large bulker. Best economies of scale for deepwater berths.'
    },
    {
      id: 'baby_cape',
      name: 'Baby Cape / Post-Panamax',
      category: 'Post-Panamax',
      dwt: 115000,
      capacityMT: 105000,
      ladenDraft: 15.1,
      loa: 255,
      dailyCharterUSD: 19800,
      demurragePerDayUSD: 21000,
      fuelBurnMT: 33.5,
      scaleFactor: 0.81,
      desc: '115,000 DWT specialized bulker engineered for draft-constrained Indian tidal berths.'
    },
    {
      id: 'panamax',
      name: 'Panamax',
      category: 'Panamax',
      dwt: 75000,
      capacityMT: 74000,
      ladenDraft: 14.2,
      loa: 225,
      dailyCharterUSD: 14200,
      demurragePerDayUSD: 16000,
      fuelBurnMT: 28,
      scaleFactor: 0.92,
      desc: '70,000–78,000 DWT standard workhorse. Maximum berthing flexibility across all Indian ports.'
    },
    {
      id: 'supramax',
      name: 'Supramax',
      category: 'Supramax',
      dwt: 58000,
      capacityMT: 55000,
      ladenDraft: 12.8,
      loa: 199,
      dailyCharterUSD: 11500,
      demurragePerDayUSD: 13000,
      fuelBurnMT: 25,
      scaleFactor: 1.04,
      desc: '55,000–64,000 DWT geared bulk carrier with onboard cranes for shallow river/shallow ports.'
    },
    {
      id: 'handysize',
      name: 'Handysize',
      category: 'Handysize',
      dwt: 35000,
      capacityMT: 35000,
      ladenDraft: 10.2,
      loa: 180,
      dailyCharterUSD: 9500,
      demurragePerDayUSD: 10500,
      fuelBurnMT: 20,
      scaleFactor: 1.22,
      desc: '28,000–38,000 DWT small parcel carrier for extreme shallow channels (e.g. Haldia river lock).'
    }
  ];

  // Evaluate each vessel against physical engineering limits
  const evaluations = candidateVessels.map(vessel => {
    // 1. Origin loading port constraints
    const originDraftClear = vessel.ladenDraft <= origin.maxDraftLaden;
    const originLoaClear = vessel.loa <= origin.maxLOA;

    // 2. Destination Indian East Coast discharge port constraints
    const destDraftStandard = dest.maxDraftLaden;
    const destDraftHighTide = dest.maxDraftHighTide || destDraftStandard;
    // Outer harbour consideration (e.g. Vizag VGCB 18.1m)
    const effectiveMaxDraft = dest.outerHarbourDraft ? Math.max(destDraftHighTide, dest.outerHarbourDraft) : destDraftHighTide;
    
    const destDraftStandardClear = vessel.ladenDraft <= destDraftStandard;
    const destDraftTideClear = vessel.ladenDraft <= effectiveMaxDraft;
    const destDraftClear = destDraftStandardClear || destDraftTideClear;
    const destLoaClear = vessel.loa <= dest.maxLOA;

    // Under-keel clearance margin
    const draftMargin = Number((destDraftStandard - vessel.ladenDraft).toFixed(1));
    const tideDraftMargin = Number((effectiveMaxDraft - vessel.ladenDraft).toFixed(1));

    // Fully blocked check (e.g. Capesize 18.2m at Haldia 7.8m or LOA > 230m)
    const isHardBlocked = !destDraftClear || !destLoaClear || !originDraftClear || !originLoaClear;

    // Light-loading check
    let isLightLoaded = false;
    let maxPermissibleCargoMT = vessel.capacityMT;
    let deadfreightPenaltyINR_Cr = 0;
    let lighterageRequired = false;

    if (!isHardBlocked && !destDraftStandardClear && destDraftTideClear) {
      if (dest.id === 'paradip' && vessel.id === 'capesize') {
        lighterageRequired = true; // Paradip cannot berth fully laden Capesize, requires anchorage lighterage
      }
    }

    if (!isHardBlocked && vessel.ladenDraft > destDraftStandard) {
      isLightLoaded = true;
      maxPermissibleCargoMT = Math.round((destDraftStandard / vessel.ladenDraft) * vessel.capacityMT * 0.95);
      const deadfreightMT = Math.max(0, vessel.capacityMT - maxPermissibleCargoMT);
      deadfreightPenaltyINR_Cr = Number(((deadfreightMT * 16.5 * 86.5) / 10000000).toFixed(2));
    }

    // 3. Handling capability & turnaround time (Strictly sum of named components)
    const voyagesNeeded = Math.max(1, Math.ceil(cargoVolumeMT / Math.min(cargoVolumeMT, vessel.capacityMT)));
    const actualDischargeRateTPD = dest.handlingRateTPD || 45000;
    // Net discharge is strictly cargo tonnage / daily discharge rate
    const pureDischargeDays = Number((cargoVolumeMT / actualDischargeRateTPD).toFixed(2));
    const portManeuverBufferDays = 1.00; // Pilotage inward/outward, tug assistance & draft survey
    const berthOnlyTurnaroundDays = Number((pureDischargeDays + portManeuverBufferDays).toFixed(2));

    // 4. Idle time & Demurrage calculation
    const baseWaitDays = dest.avgWaitDays || 2.5;
    let idleDays = baseWaitDays;
    if (lighterageRequired) idleDays += 3.5; // Offshore barge lighterage delay
    if (isLightLoaded && !lighterageRequired) idleDays += 0.8; // Waiting for spring high tide window
    if (isHardBlocked) idleDays += 10.0; // Refused entry penalty

    const queueWaitDays = Number(idleDays.toFixed(2));
    // Total turnaround is strictly defined as the explicit sum of its named components
    const totalTurnaroundDays = Number((pureDischargeDays + portManeuverBufferDays + queueWaitDays).toFixed(2));

    // Canonical charter party demurrage rate for this vessel
    const demurrageDailyUSD = vessel.demurragePerDayUSD || 25000;
    const demurrageDailyINR_Lakhs = Number(((demurrageDailyUSD * 86.5) / 100000).toFixed(2));
    const demurrageTotalUSD = Math.round(idleDays * demurrageDailyUSD);
    const demurrageTotalINR_Lakhs = Number(((idleDays * demurrageDailyINR_Lakhs)).toFixed(2));
    const demurrageTotalINR_Cr = Number((demurrageTotalINR_Lakhs / 100).toFixed(2));

    // 5. Freight cost calculation per MT
    const baseRouteRateUSD = 15.80; // Baseline
    let effectiveRateUSD = Number((baseRouteRateUSD * vessel.scaleFactor).toFixed(2));
    if (lighterageRequired) effectiveRateUSD += 4.20; // $4.20/MT offshore grab-and-barge lighterage
    if (isLightLoaded) effectiveRateUSD += Number(((deadfreightPenaltyINR_Cr * 10000000) / (cargoVolumeMT * 86.5)).toFixed(2));
    const effectiveRateINR = Math.round(effectiveRateUSD * 86.5);
    const totalFreightINR_Cr = Number(((effectiveRateUSD * cargoVolumeMT * 86.5) / 10000000).toFixed(2));

    // 6. Multi-criteria optimization score (0–100)
    let score = 100;
    if (isHardBlocked) score = 10;
    else {
      // Penalty for lighterage and tide waiting
      if (lighterageRequired) score -= 35;
      if (isLightLoaded) score -= 20;
      // Parcel size suitability penalty
      const capacityRatio = cargoVolumeMT / vessel.capacityMT;
      if (capacityRatio < 0.5) score -= 25; // Massive vessel for tiny parcel
      if (capacityRatio > 2.8) score -= 15; // Too small vessel requiring 3+ voyages
      // Demurrage penalty
      score -= Math.min(25, Math.round(idleDays * 3));
      // Draft safety bonus
      if (draftMargin >= 1.0) score += 5;
    }
    score = Math.max(10, Math.min(100, score));

    // Recommendation status badge
    let statusBadge = {
      label: 'RECOMMENDED',
      color: 'emerald',
      isRecommended: false,
      text: 'Optimal vessel with zero draft/LOA restrictions and fastest turnaround.'
    };

    if (isHardBlocked) {
      statusBadge = {
        label: 'BLOCKED',
        color: 'rose',
        isRecommended: false,
        text: `Exceeds port physical limits (${!destDraftClear ? `Draft ${vessel.ladenDraft}m > Port ${effectiveMaxDraft}m` : `LOA ${vessel.loa}m > Port ${dest.maxLOA}m`}). Grounding hazard!`
      };
    } else if (lighterageRequired) {
      statusBadge = {
        label: 'RESTRICTED / LIGHTERAGE',
        color: 'amber',
        isRecommended: false,
        text: `Cannot berth laden at ${dest.name} (Draft ${vessel.ladenDraft}m vs Berth ${destDraftStandard}m). Requires ~40k MT offshore lighterage +3.5d delay.`
      };
    } else if (isLightLoaded) {
      statusBadge = {
        label: 'TIDE-DEPENDENT',
        color: 'amber',
        isRecommended: false,
        text: `Requires high spring tide window (+${tideDraftMargin}m margin) to avoid grounding.`
      };
    }

    return {
      vessel,
      id: vessel.id,
      name: vessel.name,
      category: vessel.category,
      dwt: vessel.dwt,
      capacityMT: vessel.capacityMT,
      ladenDraft: vessel.ladenDraft,
      loa: vessel.loa,
      originDraftClear,
      originLoaClear,
      destDraftStandardClear,
      destDraftTideClear,
      destDraftClear,
      destLoaClear,
      draftMargin,
      tideDraftMargin,
      isHardBlocked,
      lighterageRequired,
      isLightLoaded,
      voyagesNeeded,
      pureDischargeDays,
      portManeuverBufferDays,
      dischargeDaysPerVoyage,
      totalDischargeDays,
      idleDays,
      demurrageTotalUSD,
      demurrageTotalINR_Lakhs,
      demurrageTotalINR_Cr,
      effectiveRateUSD,
      effectiveRateINR,
      totalFreightINR_Cr,
      score,
      statusBadge
    };
  });

  // Sort by optimization score descending
  evaluations.sort((a, b) => b.score - a.score);

  // Top recommendation
  const topVessel = evaluations[0];
  topVessel.statusBadge.isRecommended = true;
  topVessel.statusBadge.label = '🏆 TOP RECOMMENDED';

  // Compare top vessel vs worst feasible or blocked vessel for savings quantification
  const subOptimalVessel = evaluations.find(e => e.id !== topVessel.id && (e.lighterageRequired || e.isHardBlocked || e.score < 60)) || evaluations[evaluations.length - 1];
  const idleDaysSaved = Math.max(0, Number((subOptimalVessel.idleDays - topVessel.idleDays).toFixed(2)));
  const canonicalDemurrageDailyUSD = topVessel.demurrageDailyUSD;
  const canonicalDemurrageDailyINR_Lakhs = topVessel.demurrageDailyINR_Lakhs;
  // Strictly derived from single canonical day-rate
  const demurrageSavedINR_Lakhs = Number((idleDaysSaved * canonicalDemurrageDailyINR_Lakhs).toFixed(2));
  const demurrageSavedUSD = Math.round(idleDaysSaved * canonicalDemurrageDailyUSD);
  const freightSavedINR_Cr = Math.max(0, Number((subOptimalVessel.totalFreightINR_Cr - topVessel.totalFreightINR_Cr).toFixed(2)));

  return {
    origin,
    dest,
    cargoVolumeMT,
    cargoType,
    recommendedVesselId: topVessel.id,
    recommendedVessel: topVessel,
    subOptimalVessel,
    idleDaysSaved,
    canonicalDemurrageDailyUSD,
    canonicalDemurrageDailyINR_Lakhs,
    demurrageSavedINR_Lakhs,
    demurrageSavedUSD,
    freightSavedINR_Cr,
    evaluations,
    psComplianceNotice: 'Evaluated under SIH26006 Part (b) parameters: loading/discharge draft limits, LOA, TPD handling turnaround, and idle demurrage elimination.'
  };
}
