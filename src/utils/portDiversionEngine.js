import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';
import { PORT_CONGESTION_STATUS } from '../data/weatherCongestionData';

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates (km)
 */
function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's mean radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates distance in Nautical Miles (1 NM = 1.852 km)
 */
function getDistanceNM(coords1, coords2) {
  if (!coords1 || !coords2) return 0;
  const km = getHaversineDistanceKm(coords1[0], coords1[1], coords2[0], coords2[1]);
  return Number((km / 1.852).toFixed(1));
}

/**
 * Vessel class hourly bunker fuel consumption rate at economical sea speed (~11.5 - 12.5 kts)
 */
function getHourlyFuelBurnMT(vesselKey = 'capesize') {
  const key = String(vesselKey).toLowerCase();
  if (key.includes('cape')) return 1.55; // Capesize: ~37 MT/day
  if (key.includes('panamax') || key.includes('kamsar')) return 1.10; // Panamax: ~26 MT/day
  if (key.includes('supra') || key.includes('ultra')) return 0.88; // Supramax: ~21 MT/day
  if (key.includes('handy')) return 0.68; // Handymax: ~16 MT/day
  return 1.15;
}

/**
 * Generates intermediate safe offshore waypoints for navigation visualization
 */
function generateWaypoints(originCoords, destCoords) {
  if (!originCoords || !destCoords) return [];
  const [currLat, currLng] = originCoords;
  const [suggLat, suggLng] = destCoords;
  const midLat = (currLat + suggLat) / 2;
  const midLng = Math.max(currLng, suggLng) + 0.65; // Push ~30 NM offshore to simulate coastal navigation fairway
  return [
    [currLat, currLng],
    [midLat, midLng],
    [suggLat, suggLng]
  ];
}

/**
 * Dynamic Port Evacuation & Fuel-Aware Diversion Suggestion Engine
 * Evaluates when a destination port is saturated within an 80 NM approach geofence.
 * Produces two distinct operational strategies:
 *   1. Ample Fuel Strategy: Divert to Free / Lowest-Wait Port to minimize demurrage loss.
 *   2. Low Fuel Strategy: Divert to Nearest Compliant Port to minimize bunker fuel consumption.
 * Simultaneously computes Anchorage Loss (demurrage + aux generator burn) vs. Diversion Arbitrage.
 */
export function evaluatePortDiversion({
  selectedDestination = 'paradip',
  selectedVessel = 'capesize',
  cargoVolumeMT = 150000,
  customDailyDemurrageLakhs = 65,
  vesselCoordinates = null,
  vesselSpeedKnots = 12.0
}) {
  const currPort = INDIAN_EAST_COAST_PORTS[selectedDestination] || INDIAN_EAST_COAST_PORTS.paradip;
  const vessel = VESSEL_CLASSES[selectedVessel] || VESSEL_CLASSES.capesize;
  const hourlyFuelBurnMT = getHourlyFuelBurnMT(selectedVessel);
  const baseCoordinates = vesselCoordinates || currPort.coordinates;

  // Port is considered full/saturated if average queue is >= 2.5 days or congestion is moderate/high
  const isPortSaturated = currPort.avgWaitDays >= 2.5 || currPort.congestionLevel === 'MODERATE' || currPort.congestionLevel === 'HIGH';

  // Anchorage Loss Baseline at current saturated port
  const demurrageLossLakhs = Number((currPort.avgWaitDays * customDailyDemurrageLakhs).toFixed(1));
  const auxFuelBurnMT = Number((currPort.avgWaitDays * 24 * 0.12).toFixed(1)); // 0.12 MT/hr aux generator fuel at anchor
  const auxFuelLossLakhs = Number(((auxFuelBurnMT * 62000) / 100000).toFixed(2)); // ₹62,000 / MT VLSFO
  const totalAnchorageLossLakhs = Number((demurrageLossLakhs + auxFuelLossLakhs).toFixed(1));

  const anchorageLoss = {
    waitDays: currPort.avgWaitDays,
    demurrageLossLakhs,
    auxFuelBurnMT,
    auxFuelLossLakhs,
    totalLossLakhs: totalAnchorageLossLakhs
  };

  const candidateEvaluations = [];

  Object.values(INDIAN_EAST_COAST_PORTS).forEach((port) => {
    if (port.id === currPort.id) return; // Skip current port

    const effectiveMaxDraft = port.outerHarbourDraft || port.maxDraftHighTide || port.maxDraftLaden;
    const effectiveLOA = port.maxLOA || 300;
    const effectiveBeam = port.maxBeam || 50;

    // Part B Physical Fit Verification
    const draftFit = effectiveMaxDraft >= vessel.ladenDraftMeters - 0.2; // 0.2m tidal tolerance
    const loaFit = effectiveLOA >= vessel.loaMeters;
    const beamFit = effectiveBeam >= vessel.beamMeters;
    const dwtFit = port.maxDWT >= (cargoVolumeMT * 0.95);

    const isPartBCompliant = draftFit && loaFit && beamFit;

    const disqualificationReasons = [];
    if (!draftFit) {
      disqualificationReasons.push(`Draft Exceeded: Port max ${effectiveMaxDraft}m < Vessel ${vessel.ladenDraftMeters}m`);
    }
    if (!loaFit) {
      disqualificationReasons.push(`LOA Exceeded: Port max ${effectiveLOA}m < Vessel ${vessel.loaMeters}m`);
    }
    if (!beamFit) {
      disqualificationReasons.push(`Beam Exceeded: Port max ${effectiveBeam}m < Vessel ${vessel.beamMeters}m`);
    }
    if (!dwtFit && !disqualificationReasons.length) {
      disqualificationReasons.push(`DWT Limit: Port max ${port.maxDWT.toLocaleString()} MT < Cargo`);
    }

    // Distance & Fuel Calculations
    const distNM = getDistanceNM(baseCoordinates, port.coordinates);
    const steamingHours = Number((distNM / Math.max(vesselSpeedKnots, 8.0)).toFixed(1));
    const fuelBurnMT = Number((steamingHours * hourlyFuelBurnMT).toFixed(1));
    const fuelCostLakhs = Number(((fuelBurnMT * 62000) / 100000).toFixed(2)); // ₹62,000 / MT of VLSFO

    // Demurrage & Turnaround Calculations
    const waitDaysSaved = Number(Math.max(0, currPort.avgWaitDays - port.avgWaitDays).toFixed(1));
    const demurrageSavedLakhs = Number((waitDaysSaved * customDailyDemurrageLakhs).toFixed(1));
    const handlingRateAdvantageTPD = port.handlingRateTPD - currPort.handlingRateTPD;
    const netArbitrageLakhs = Number((demurrageSavedLakhs - fuelCostLakhs).toFixed(1));

    candidateEvaluations.push({
      portId: port.id,
      portName: port.name,
      state: port.state,
      coordinates: port.coordinates,
      avgWaitDays: port.avgWaitDays,
      congestionLevel: port.congestionLevel,
      effectiveMaxDraft,
      handlingRateTPD: port.handlingRateTPD,
      isPartBCompliant,
      draftFit,
      loaFit,
      beamFit,
      disqualificationReasons,
      distNM,
      steamingHours,
      fuelBurnMT,
      fuelCostLakhs,
      waitDaysSaved,
      demurrageSavedLakhs,
      handlingRateAdvantageTPD,
      netArbitrageLakhs,
      description: port.description
    });
  });

  const compliantPorts = candidateEvaluations.filter(c => c.isPartBCompliant);
  const disqualifiedPorts = candidateEvaluations.filter(c => !c.isPartBCompliant);

  // Strategy 1: Ample Fuel Option -> Rank by lowest wait days, then highest handling rate
  const ampleFuelRanked = [...compliantPorts].sort((a, b) => 
    a.avgWaitDays - b.avgWaitDays || 
    b.handlingRateTPD - a.handlingRateTPD ||
    a.distNM - b.distNM
  );
  const ampleFuelOption = ampleFuelRanked.length > 0 ? ampleFuelRanked[0] : null;

  // Strategy 2: Low Fuel Option -> Rank by shortest distance (minimum deviation & bunker consumption)
  const lowFuelRanked = [...compliantPorts].sort((a, b) => 
    a.distNM - b.distNM || 
    a.avgWaitDays - b.avgWaitDays
  );
  const lowFuelOption = lowFuelRanked.length > 0 ? lowFuelRanked[0] : null;

  // Default suggested port (prioritizes low fuel if tight, or ample if big wait reduction)
  const suggestedPort = lowFuelOption || ampleFuelOption;

  // Waypoints for Map Rendering
  const diversionPathCoordinates = ampleFuelOption && currPort.coordinates && ampleFuelOption.coordinates
    ? generateWaypoints(currPort.coordinates, ampleFuelOption.coordinates)
    : [];

  const diversionPathCoordinatesLowFuel = lowFuelOption && currPort.coordinates && lowFuelOption.coordinates
    ? generateWaypoints(currPort.coordinates, lowFuelOption.coordinates)
    : [];

  return {
    currentPort: {
      id: currPort.id,
      name: currPort.name,
      coordinates: currPort.coordinates,
      avgWaitDays: currPort.avgWaitDays,
      congestionLevel: currPort.congestionLevel,
      demurragePerDayINR: currPort.demurragePerDayINR,
      maxDraftLaden: currPort.maxDraftLaden,
      handlingRateTPD: currPort.handlingRateTPD
    },
    vessel: {
      key: selectedVessel,
      name: vessel.name,
      ladenDraft: vessel.ladenDraftMeters,
      loa: vessel.loaMeters,
      beam: vessel.beamMeters,
      hourlyFuelBurnMT
    },
    isPortSaturated,
    geofenceRadiusNm: 80,
    geofenceRadiusKm: 148.16,
    anchorageLoss,
    ampleFuelOption,
    lowFuelOption,
    suggestedPort,
    compliantPorts,
    disqualifiedPorts,
    diversionPathCoordinates,
    diversionPathCoordinatesLowFuel,
    hasCompliantDiversion: !!suggestedPort,
    headlineRecommendation: isPortSaturated && suggestedPort
      ? lowFuelOption.portId === ampleFuelOption.portId
        ? `⚠️ ${currPort.name} is saturated (${currPort.avgWaitDays}d wait • Anchorage Loss: ₹${totalAnchorageLossLakhs}L). OPTIMAL DIVERSION: ${suggestedPort.portName} is both the closest (${suggestedPort.distNM} NM) and lowest queue port — saves ₹${suggestedPort.demurrageSavedLakhs}L demurrage!`
        : `⚠️ ${currPort.name} is saturated (${currPort.avgWaitDays}d wait • Anchorage Loss: ₹${totalAnchorageLossLakhs}L). 2 STRATEGIES: [Low Fuel] Nearest port is ${lowFuelOption.portName} (${lowFuelOption.distNM} NM, ₹${lowFuelOption.fuelCostLakhs}L fuel) vs [Ample Fuel] Free port is ${ampleFuelOption.portName} (saves ${ampleFuelOption.waitDaysSaved}d wait & ₹${ampleFuelOption.demurrageSavedLakhs}L demurrage).`
      : `🟢 ${currPort.name} has manageable queue (${currPort.avgWaitDays}d wait). Normal berthing clearance confirmed within 80 NM approach ring.`
  };
}

/**
 * Evaluates whether a port that a vessel is entering at the 80 NM geofence boundary is full,
 * and generates the dual-option fuel-aware diversion advice (Ample Fuel vs. Low Fuel) alongside Anchorage Loss.
 */
export function evaluateVesselPortCongestionDiversion({
  portId,
  vesselType = '',
  currentDraught = 0,
  vesselName = '',
  vesselCoordinates = null,
  speedKnots = 12.0
}) {
  if (!portId) return null;

  // Normalize port identifier
  let cleanPortId = portId.toLowerCase().replace('_zone', '').trim();
  if (cleanPortId.includes('haldia')) cleanPortId = 'haldia';
  else if (cleanPortId.includes('paradip')) cleanPortId = 'paradip';
  else if (cleanPortId.includes('gangavaram')) cleanPortId = 'gangavaram';
  else if (cleanPortId.includes('vizag') || cleanPortId.includes('visakhapatnam')) cleanPortId = 'vizag';
  else if (cleanPortId.includes('dhamra')) cleanPortId = 'dhamra';
  else if (cleanPortId.includes('gopalpur')) cleanPortId = 'gopalpur';

  const congestionData = PORT_CONGESTION_STATUS[cleanPortId] || PORT_CONGESTION_STATUS.paradip;
  const portInfo = INDIAN_EAST_COAST_PORTS[cleanPortId] || INDIAN_EAST_COAST_PORTS.paradip;

  // Port is evaluated as "FULL" / saturated if:
  // 1. Congestion status is HIGH or MODERATE
  // 2. OR avg anchorage wait days >= 2.0 days
  // 3. OR vessels at anchor >= 5 ships
  const isPortFull = 
    congestionData.congestionStatus === 'HIGH' ||
    congestionData.congestionStatus === 'MODERATE' ||
    congestionData.avgAnchorageWaitDays >= 2.0 ||
    congestionData.vesselsAtAnchor >= 5 ||
    portInfo.avgWaitDays >= 2.0;

  if (!isPortFull) {
    return {
      isPortFull: false,
      geofenceRadiusNm: 80,
      portName: congestionData.portName || portInfo.name,
      congestionStatus: congestionData.congestionStatus || 'LOW',
      avgWaitDays: congestionData.avgAnchorageWaitDays || portInfo.avgWaitDays,
      vesselsAtAnchor: congestionData.vesselsAtAnchor || 0,
      suggestedPort: null
    };
  }

  // Resolve vessel class key to Part B specification
  const vType = vesselType.toLowerCase();
  let vesselKey = 'capesize';
  if (vType.includes('handy') || vType.includes('river') || (currentDraught > 0 && currentDraught <= 9.0)) {
    vesselKey = 'handymax_hdc';
  } else if (vType.includes('supra') || vType.includes('ultra')) {
    vesselKey = 'supramax';
  } else if (vType.includes('kamsar') || vType.includes('panamax')) {
    vesselKey = 'panamax';
  } else if (vType.includes('baby')) {
    vesselKey = 'baby_cape';
  } else if (vType.includes('cape')) {
    vesselKey = 'capesize';
  }

  // Evaluate candidate ports using Part B measurements & dual fuel strategies
  const diversionResult = evaluatePortDiversion({
    selectedDestination: cleanPortId,
    selectedVessel: vesselKey,
    customDailyDemurrageLakhs: 65,
    vesselCoordinates,
    vesselSpeedKnots: speedKnots
  });

  if (!diversionResult.suggestedPort) {
    return {
      isPortFull: true,
      geofenceRadiusNm: 80,
      portId: cleanPortId,
      portName: congestionData.portName || portInfo.name,
      congestionStatus: congestionData.congestionStatus,
      avgWaitDays: congestionData.avgAnchorageWaitDays || portInfo.avgWaitDays,
      vesselsAtAnchor: congestionData.vesselsAtAnchor || 0,
      anchorageLoss: diversionResult.anchorageLoss,
      suggestedPort: null,
      message: `${congestionData.portName || portInfo.name} is saturated (${congestionData.avgAnchorageWaitDays}d wait), but no alternative port satisfies Part B physical limits.`
    };
  }

  const ample = diversionResult.ampleFuelOption;
  const low = diversionResult.lowFuelOption;

  return {
    isPortFull: true,
    geofenceRadiusNm: 80,
    portId: cleanPortId,
    portName: congestionData.portName || portInfo.name,
    congestionStatus: congestionData.congestionStatus,
    avgWaitDays: congestionData.avgAnchorageWaitDays || portInfo.avgWaitDays,
    vesselsAtAnchor: congestionData.vesselsAtAnchor || 0,
    berthTurnaroundHours: congestionData.berthTurnaroundHours || 36,
    anchorageLoss: diversionResult.anchorageLoss,
    ampleFuelOption: ample,
    lowFuelOption: low,
    suggestedPort: low || ample, // default to nearest (fuel-safe) as primary choice
    vessel: diversionResult.vessel,
    headlineSuggestion: low && ample && low.portId === ample.portId
      ? `Port Saturated (${congestionData.avgAnchorageWaitDays}d wait • ₹${diversionResult.anchorageLoss.totalLossLakhs}L Anchorage Loss). SUGGESTION: Divert to ${low.portName} — Nearest & Free Port (Saves ${low.waitDaysSaved}d wait & ₹${low.demurrageSavedLakhs}L Demurrage).`
      : `Port Saturated (${congestionData.avgAnchorageWaitDays}d wait • ₹${diversionResult.anchorageLoss.totalLossLakhs}L Anchorage Loss). 2 OPTIONS: [Low Fuel] Divert to Nearest ${low.portName} (${low.distNM} NM, ₹${low.fuelCostLakhs}L fuel) OR [Ample Fuel] Divert to Free ${ample.portName} (Saves ${ample.waitDaysSaved}d wait & ₹${ample.demurrageSavedLakhs}L Demurrage).`
  };
}
