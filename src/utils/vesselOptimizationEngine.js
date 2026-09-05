import { INDIAN_EAST_COAST_PORTS, ORIGIN_LOADING_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';

/**
 * PS Part (b) Core Engine: Vessel Type Optimization
 * Evaluates candidate vessel types (Handysize, Supramax, Panamax, Capesize)
 * against origin and East Coast Indian discharge port infrastructure limitations
 * (draft restrictions, LOA, handling TPD, idle turnaround, demurrage avoidance).
 * Integrates real-world AIS port call telemetry to verify live vessel-port compatibility.
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
      desc: '160,000–180,000 DWT large bulker. Best economies of scale for deepwater berths (Gangavaram, Dhamra, Vizag Outer).'
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
      desc: '115,000 DWT specialized bulker engineered for draft-constrained Indian tidal berths (Paradip high tide).'
    },
    {
      id: 'kamsarmax',
      name: 'Kamsarmax',
      category: 'Kamsarmax',
      dwt: 82000,
      capacityMT: 82000,
      ladenDraft: 14.4,
      loa: 229,
      dailyCharterUSD: 14500,
      demurragePerDayUSD: 16500,
      fuelBurnMT: 29.5,
      scaleFactor: 0.88,
      desc: '80,000–82,000 DWT standard bulk carrier purpose-engineered for 80k MT parcels. Maximum dimension for Port Kamsar and East Coast Indian deepwater coal berths.'
    },
    {
      id: 'panamax',
      name: 'Panamax',
      category: 'Panamax',
      dwt: 75000,
      capacityMT: 75000,
      ladenDraft: 14.2,
      loa: 225,
      dailyCharterUSD: 14200,
      demurragePerDayUSD: 16000,
      fuelBurnMT: 28,
      scaleFactor: 0.92,
      desc: '70,000–78,000 DWT standard workhorse. Maximum berthing flexibility across standard berths.'
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
      desc: '55,000–64,000 DWT geared bulk carrier with onboard cranes for shallow/geared ports (Gopalpur).'
    },
    {
      id: 'handymax',
      name: 'Handymax (HDC River Lock Class)',
      category: 'Handymax',
      dwt: 35000,
      capacityMT: 33000,
      ladenDraft: 8.2, // Fully compliant with Haldia 8.5m draft & 9.1m high tide
      loa: 178, // Fully compliant with Haldia lock 230m LOA
      dailyCharterUSD: 10500,
      demurragePerDayUSD: 11500,
      fuelBurnMT: 21,
      scaleFactor: 1.16,
      desc: '35,000 DWT specialized shallow river-lock bulker purpose-built for Haldia Dock Complex (HDC) and Sandheads shuttles.'
    },
    {
      id: 'handysize',
      name: 'Handysize (Shallow Draft)',
      category: 'Handysize',
      dwt: 28000,
      capacityMT: 28000,
      ladenDraft: 7.8, // Shallow draft for extreme river channels
      loa: 165,
      dailyCharterUSD: 9500,
      demurragePerDayUSD: 10500,
      fuelBurnMT: 19,
      scaleFactor: 1.25,
      desc: '28,000 DWT shallow-draft bulk carrier capable of navigating Haldia Lock Gates at neap tide without lightening.'
    }
  ];

  // Evaluate each vessel against physical engineering limits & Live AIS port telemetry
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

    // Fully blocked check (e.g. Capesize 18.2m at Haldia 8.5m or LOA 292m > 230m)
    const isHardBlocked = !destDraftClear || !destLoaClear || !originDraftClear || !originLoaClear;

    // Real-Time AIS port telemetry cross-reference
    const aisMatches = LIVE_AIS_VESSELS.filter(v => 
      v.destinationId === dest.id && 
      (v.vesselType.toLowerCase().includes(vessel.category.toLowerCase()) || 
       v.vesselType.toLowerCase().includes(vessel.id.toLowerCase()))
    );
    const aisConfirmedCalls = aisMatches.length;
    const aisLiveExamples = aisMatches.slice(0, 2).map(m => m.name).join(', ');

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
    const portManeuverBufferDays = Number((1.00 * voyagesNeeded).toFixed(2)); // Pilotage inward/outward, tug assist & draft survey per voyage
    const berthOnlyTurnaroundDays = Number((pureDischargeDays + portManeuverBufferDays).toFixed(2));

    // 4. Queue Wait & Idle time calculation parameterized on cargo volume, discharge rate & vessel limits
    // In queueing theory (M/M/c berth queues), berth service demand is proportional to (cargoVolumeMT / actualDischargeRateTPD)
    // Standard baseline assumes a 100,000 MT parcel at 45,000 TPD (~2.22 days berth service)
    const berthServiceIntensity = (pureDischargeDays / voyagesNeeded) / 2.22;
    const baseWaitDays = (dest.avgWaitDays || 2.5) * Math.max(0.6, berthServiceIntensity);
    let idleDays = baseWaitDays * voyagesNeeded;
    
    let lighterageDelayDays = 0;
    if (lighterageRequired) {
      // Lighterage volume depends on excess draft: ~11,500 MT per meter excess draft
      const excessDraftM = Math.max(0, vessel.ladenDraft - destDraftStandard);
      const lighterageMT = Math.min(cargoVolumeMT, Math.round(excessDraftM * 11500));
      lighterageDelayDays = Number((lighterageMT / 12000).toFixed(2)); // Offshore barge grab rate ~12,000 TPD
      idleDays += lighterageDelayDays;
    }
    if (isLightLoaded && !lighterageRequired) {
      idleDays += Number((0.8 * voyagesNeeded).toFixed(2)); // Waiting for spring high tide window
    }
    if (isHardBlocked) {
      idleDays += Number((10.0 * voyagesNeeded).toFixed(2)); // Refused entry penalty / grounding detention
    }

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
    if (isHardBlocked) {
      // Hard-blocked vessels receive score of 0 (strictly disqualified from recommendation)
      score = 0;
    } else {
      // Penalty for lighterage and tide waiting
      if (lighterageRequired) score -= 35;
      if (isLightLoaded) score -= 20;

      // Parcel size suitability penalty:
      // A: Excessive capacity mismatch (massive vessel for tiny parcel)
      if (vessel.capacityMT > cargoVolumeMT * 2.2) score -= 25;

      // B: CAPACITY DEFICIT (vessel is undersized for consignment)
      // Standard commercial rule: an 80k parcel should not be put on a 55k Supramax
      if (cargoVolumeMT > vessel.capacityMT) {
        const capacityShortfallMT = cargoVolumeMT - vessel.capacityMT;
        const shortfallRatio = capacityShortfallMT / cargoVolumeMT;
        score -= Math.round(35 + shortfallRatio * 30); // 35 to 65 pt severe penalty for undersized vessel
      }
      if (voyagesNeeded > 1) {
        score -= (voyagesNeeded - 1) * 20; // Additional 20 pts per extra voyage needed
      }

      // Economies of scale penalty (higher scaleFactor = higher $/MT freight cost)
      const costPenalty = Math.round((vessel.scaleFactor - 0.72) * 25);
      score -= Math.max(0, costPenalty);

      // Demurrage penalty
      score -= Math.min(25, Math.round(idleDays * 2));
      // Draft safety bonus (only applies if vessel has sufficient capacity)
      if (draftMargin >= 1.0 && cargoVolumeMT <= vessel.capacityMT * 1.1) score += 5;
      // AIS operational confirmation bonus
      if (aisConfirmedCalls > 0) score += 5;
    }
    score = Math.max(0, Math.min(100, score));

    // Recommendation status badge
    let statusBadge = {
      label: 'RECOMMENDED',
      color: 'emerald',
      isRecommended: false,
      text: `Optimal vessel with safe draft/LOA clearance (${draftMargin >= 0 ? `+${draftMargin.toFixed(1)}m under-keel margin` : 'Clear'}).`
    };

    if (isHardBlocked) {
      const draftViolation = !destDraftClear ? `Draft ${vessel.ladenDraft}m > Port Max ${effectiveMaxDraft}m (+${(vessel.ladenDraft - effectiveMaxDraft).toFixed(1)}m Excess Draft - Severe Grounding Hazard!)` : '';
      const loaViolation = !destLoaClear ? `LOA ${vessel.loa}m > Berth Max ${dest.maxLOA}m (+${(vessel.loa - dest.maxLOA).toFixed(0)}m Excess Length - Lock Gate / Berth Refusal!)` : '';
      statusBadge = {
        label: 'DISQUALIFIED / BLOCKED',
        color: 'rose',
        isRecommended: false,
        text: `EXCEEDS PHYSICAL PORT LIMITS: ${[draftViolation, loaViolation].filter(Boolean).join(' | ')} Cannot berth directly!`
      };
    } else if (lighterageRequired) {
      statusBadge = {
        label: 'RESTRICTED / LIGHTERAGE',
        color: 'amber',
        isRecommended: false,
        text: `Cannot berth fully laden at ${dest.name} (Draft ${vessel.ladenDraft}m vs Berth ${destDraftStandard}m). Requires offshore anchorage lighterage.`
      };
    } else if (isLightLoaded) {
      statusBadge = {
        label: 'TIDE-DEPENDENT',
        color: 'amber',
        isRecommended: false,
        text: `Requires high spring tide window (+${tideDraftMargin}m margin) to avoid grounding.`
      };
    } else if (cargoVolumeMT > vessel.capacityMT) {
      statusBadge = {
        label: 'CAPACITY DEFICIT',
        color: 'amber',
        isRecommended: false,
        text: `Parcel (${cargoVolumeMT.toLocaleString()} MT) exceeds vessel capacity (${vessel.capacityMT.toLocaleString()} MT). Requires ${voyagesNeeded} voyages — switch to Kamsarmax/Panamax.`
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
      idleDays,
      queueWaitDays,
      totalTurnaroundDays,
      demurrageDailyUSD,
      demurrageDailyINR_Lakhs,
      demurrageTotalUSD,
      demurrageTotalINR_Lakhs,
      demurrageTotalINR_Cr,
      effectiveRateUSD,
      effectiveRateINR,
      totalFreightINR_Cr,
      score,
      statusBadge,
      aisConfirmedCalls,
      aisLiveExamples
    };
  });

  // Sort: Feasible (unblocked) vessels first by score descending, then blocked vessels
  evaluations.sort((a, b) => {
    if (!a.isHardBlocked && b.isHardBlocked) return -1;
    if (a.isHardBlocked && !b.isHardBlocked) return 1;
    return b.score - a.score;
  });

  // Top recommendation MUST be chosen from non-blocked vessels if available
  const feasibleVessels = evaluations.filter(e => !e.isHardBlocked);
  const topVessel = feasibleVessels.length > 0 ? feasibleVessels[0] : evaluations[evaluations.length - 1];

  if (!topVessel.isHardBlocked) {
    topVessel.statusBadge.isRecommended = true;
    topVessel.statusBadge.label = '🏆 TOP RECOMMENDED';
  } else {
    topVessel.statusBadge.label = '⚠️ BLOCKED (TRANSSHIPMENT REQUIRED)';
  }

  // Compare top vessel vs worst feasible or blocked vessel for savings quantification
  const subOptimalVessel = evaluations.find(e => e.id !== topVessel.id && (e.isHardBlocked || e.lighterageRequired || e.score < 60)) || evaluations[evaluations.length - 1];
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
