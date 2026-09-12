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
  vesselSpeedKnots = 12.0,
  remainingBunkerFuelMT = null
}) {
  const currPort = INDIAN_EAST_COAST_PORTS[selectedDestination] || INDIAN_EAST_COAST_PORTS.paradip;
  const vessel = VESSEL_CLASSES[selectedVessel] || VESSEL_CLASSES.capesize;
  const hourlyFuelBurnMT = getHourlyFuelBurnMT(selectedVessel);
  const baseCoordinates = vesselCoordinates || currPort.coordinates;

  // Standard bunker fuel onboard if not explicitly measured (SOLAS baseline)
  const defaultBunkerMT = {
    capesize: 2200,
    newcastlemax: 2500,
    baby_cape: 1700,
    panamax: 1300,
    supramax: 950,
    handymax_hdc: 650
  }[selectedVessel] || 1500;
  const currentBunkerFuelMT = remainingBunkerFuelMT !== null ? remainingBunkerFuelMT : defaultBunkerMT;

  // Port is considered full/saturated if average queue is >= 2.0 days or congestion is moderate/high
  const isPortSaturated = currPort.avgWaitDays >= 2.0 || currPort.congestionLevel === 'MODERATE' || currPort.congestionLevel === 'HIGH';

  // Anchorage Loss Baseline at current saturated port (Demurrage + Aux Generator Burn)
  const demurrageLossLakhs = Number((currPort.avgWaitDays * customDailyDemurrageLakhs).toFixed(1));
  const demurrageLossCr = Number((demurrageLossLakhs / 100).toFixed(2));
  const auxFuelBurnMT = Number((currPort.avgWaitDays * 24 * 0.12).toFixed(1)); // 0.12 MT/hr aux generator fuel at anchor
  const auxFuelLossLakhs = Number(((auxFuelBurnMT * 62000) / 100000).toFixed(2)); // ₹62,000 / MT VLSFO
  const auxFuelLossCr = Number((auxFuelLossLakhs / 100).toFixed(3));
  const totalAnchorageLossLakhs = Number((demurrageLossLakhs + auxFuelLossLakhs).toFixed(1));
  const totalAnchorageLossCr = Number((totalAnchorageLossLakhs / 100).toFixed(2));

  const anchorageLoss = {
    waitDays: currPort.avgWaitDays,
    demurrageLossLakhs,
    demurrageLossCr,
    auxFuelBurnMT,
    auxFuelLossLakhs,
    auxFuelLossCr,
    totalLossLakhs: totalAnchorageLossLakhs,
    totalLossCr: totalAnchorageLossCr
  };

  // Current Port Multimodal Hinterland Evacuation Baseline (FOIS Rail Rake vs. Highway Truck Fleet)
  const currHinterland = currPort.hinterlandEvacuation || {
    primaryCluster: 'Hinterland Industrial Hub',
    distanceKm: 135,
    railRakesAvailablePerDay: 5.0,
    railTariffPerNTKM: 1.85,
    rakeCapacityMT: 3900,
    truckFreightTariffPerTKM: 4.15,
    truckPayloadMT: 30,
    railCongestionRisk: 'MODERATE'
  };

  const currTrainRakesNeeded = Math.ceil(cargoVolumeMT / currHinterland.rakeCapacityMT);
  const currTrainCostCr = Number(((cargoVolumeMT * currHinterland.distanceKm * currHinterland.railTariffPerNTKM) / 10000000).toFixed(2));
  const currTrainCostLakhs = Number((currTrainCostCr * 100).toFixed(1));
  const currTrucksNeeded = Math.ceil(cargoVolumeMT / currHinterland.truckPayloadMT);
  const currTruckCostCr = Number(((cargoVolumeMT * currHinterland.distanceKm * currHinterland.truckFreightTariffPerTKM) / 10000000).toFixed(2));
  const currTruckCostLakhs = Number((currTruckCostCr * 100).toFixed(1));
  const currRoadSurchargeCr = Number((currTruckCostCr - currTrainCostCr).toFixed(2));
  const currRoadSurchargeLakhs = Number((currRoadSurchargeCr * 100).toFixed(1));

  const currEvacuationProfile = {
    cluster: currHinterland.primaryCluster,
    distanceKm: currHinterland.distanceKm,
    cargoVolumeMT,
    trainRakesNeeded: currTrainRakesNeeded,
    trainCostCr: currTrainCostCr,
    trainCostLakhs: currTrainCostLakhs,
    trucksNeeded: currTrucksNeeded,
    truckCostCr: currTruckCostCr,
    truckCostLakhs: currTruckCostLakhs,
    roadSurchargeCr: currRoadSurchargeCr,
    roadSurchargeLakhs: currRoadSurchargeLakhs,
    railRisk: currHinterland.railCongestionRisk,
    rakesAvailablePerDay: currHinterland.railRakesAvailablePerDay
  };

  // Explicit Terminal Action: WAIT (Slow Steaming / Virtual Arrival)
  const waitEcoSpeedKnots = 7.5;
  const waitHourlyBurnMT = Number((hourlyFuelBurnMT * 0.45).toFixed(2)); // 45% MCR at eco-speed
  const waitTotalFuelBurnMT = Number((currPort.avgWaitDays * 24 * waitHourlyBurnMT).toFixed(1));
  const waitFuelCostCr = Number(((waitTotalFuelBurnMT * 62000) / 10000000).toFixed(2));
  const waitFuelCostLakhs = Number((waitFuelCostCr * 100).toFixed(1));
  const waitOption = {
    id: 'WAIT',
    label: 'WAIT: Slow Steaming / Virtual Arrival',
    actionNote: 'Continue transit at reduced eco-speed (7.5 kts)',
    burnType: 'Main propulsion engine active at 45% load',
    fuelBurnMT: waitTotalFuelBurnMT,
    fuelCostCr: waitFuelCostCr,
    fuelCostLakhs: waitFuelCostLakhs,
    portAnchorageDues: 0, // Zero anchorage fees outside port boundary
    totalCostCr: waitFuelCostCr,
    totalCostLakhs: waitFuelCostLakhs,
    pros: 'Zero port anchorage dues and avoids outer anchorage collision congestion.',
    cons: 'Burns significant propulsion fuel while waiting at sea.'
  };

  // Explicit Terminal Action: ANCHOR (Hold Position at Outer Anchorage)
  const anchorOption = {
    id: 'ANCHOR',
    label: 'ANCHOR: Hold Position at Outer Roads',
    actionNote: 'Hold position at outer anchorage (drop anchor)',
    burnType: 'Auxiliary diesel generator only (0.12 MT/h)',
    fuelBurnMT: auxFuelBurnMT,
    fuelCostCr: auxFuelLossCr,
    fuelCostLakhs: auxFuelLossLakhs,
    demurrageLossCr,
    demurrageLossLakhs,
    totalCostCr: totalAnchorageLossCr,
    totalCostLakhs: totalAnchorageLossLakhs,
    pros: 'Minimal bunker fuel consumption (~0.12 MT/hr auxiliary load).',
    cons: 'Triggers full statutory demurrage penalties and port anchorage wharfage dues.'
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

    // Distance & Steaming
    const distNM = getDistanceNM(baseCoordinates, port.coordinates);
    const steamingHours = Number((distNM / Math.max(vesselSpeedKnots, 8.0)).toFixed(1));
    const fuelBurnMT = Number((steamingHours * hourlyFuelBurnMT).toFixed(1));
    const fuelCostLakhs = Number(((fuelBurnMT * 62000) / 100000).toFixed(2)); // ₹62,000 / MT of VLSFO
    const fuelCostCr = Number((fuelCostLakhs / 100).toFixed(2));

    // Bunker Fuel Feasibility Gate (Must have required deviation fuel + 15% SOLAS safety reserve)
    const requiredBunkerWithReserveMT = Number((fuelBurnMT * 1.15).toFixed(1));
    const isFuelFeasible = currentBunkerFuelMT >= requiredBunkerWithReserveMT;

    const isPartBCompliant = draftFit && loaFit && beamFit && dwtFit && isFuelFeasible;

    const disqualificationReasons = [];
    if (!isFuelFeasible) {
      disqualificationReasons.push(`Fuel Infeasible: Requires ${requiredBunkerWithReserveMT} MT (inc. 15% reserve) > ${currentBunkerFuelMT} MT Onboard`);
    }
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

    // Demurrage & Turnaround Calculations
    const waitDaysSaved = Number(Math.max(0, currPort.avgWaitDays - port.avgWaitDays).toFixed(1));
    const demurrageSavedLakhs = Number((waitDaysSaved * customDailyDemurrageLakhs).toFixed(1));
    const demurrageSavedCr = Number((demurrageSavedLakhs / 100).toFixed(2));
    const handlingRateAdvantageTPD = port.handlingRateTPD - currPort.handlingRateTPD;

    // Multimodal Hinterland Evacuation Analysis for Candidate Port
    const portHinterland = port.hinterlandEvacuation || {
      primaryCluster: 'Hinterland Industrial Hub',
      distanceKm: 140,
      railRakesAvailablePerDay: 6.0,
      railTariffPerNTKM: 1.85,
      rakeCapacityMT: 3900,
      truckFreightTariffPerTKM: 4.15,
      truckPayloadMT: 30,
      railCongestionRisk: 'LOW'
    };

    const portTrainRakesNeeded = Math.ceil(cargoVolumeMT / portHinterland.rakeCapacityMT);
    const portTrainCostCr = Number(((cargoVolumeMT * portHinterland.distanceKm * portHinterland.railTariffPerNTKM) / 10000000).toFixed(2));
    const portTrainCostLakhs = Number((portTrainCostCr * 100).toFixed(1));
    const portTrucksNeeded = Math.ceil(cargoVolumeMT / portHinterland.truckPayloadMT);
    const portTruckCostCr = Number(((cargoVolumeMT * portHinterland.distanceKm * portHinterland.truckFreightTariffPerTKM) / 10000000).toFixed(2));
    const portTruckCostLakhs = Number((portTruckCostCr * 100).toFixed(1));
    const portRoadSurchargeCr = Number((portTruckCostCr - portTrainCostCr).toFixed(2));

    // Evacuation delta: If current port suffers high rake congestion and candidate guarantees rakes (LOW risk),
    // diversion avoids the current port's road surcharge!
    let evacuationAdvantageCr = 0;
    if (currHinterland.railCongestionRisk === 'HIGH' && portHinterland.railCongestionRisk !== 'HIGH') {
      evacuationAdvantageCr = currRoadSurchargeCr; // Avoids road surcharge
    } else {
      evacuationAdvantageCr = Number((currTrainCostCr - portTrainCostCr).toFixed(2));
    }
    const evacuationAdvantageLakhs = Number((evacuationAdvantageCr * 100).toFixed(1));

    // Net Arbitrage Savings = Demurrage Saved - Marine Bunker Fuel Cost + Evacuation Advantage
    const netArbitrageCr = Number((demurrageSavedCr - fuelCostCr + (evacuationAdvantageCr > 0 ? evacuationAdvantageCr : 0)).toFixed(2));
    const netArbitrageLakhs = Number((netArbitrageCr * 100).toFixed(1));

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
      isFuelFeasible,
      draftFit,
      loaFit,
      beamFit,
      disqualificationReasons,
      distNM,
      steamingHours,
      fuelBurnMT,
      fuelCostLakhs,
      fuelCostCr,
      requiredBunkerWithReserveMT,
      waitDaysSaved,
      demurrageSavedLakhs,
      demurrageSavedCr,
      handlingRateAdvantageTPD,
      netArbitrageLakhs,
      netArbitrageCr,
      evacuation: {
        cluster: portHinterland.primaryCluster,
        distanceKm: portHinterland.distanceKm,
        trainRakesNeeded: portTrainRakesNeeded,
        trainCostCr: portTrainCostCr,
        trainCostLakhs: portTrainCostLakhs,
        trucksNeeded: portTrucksNeeded,
        truckCostCr: portTruckCostCr,
        truckCostLakhs: portTruckCostLakhs,
        roadSurchargeCr: portRoadSurchargeCr,
        railRisk: portHinterland.railCongestionRisk,
        rakesAvailablePerDay: portHinterland.railRakesAvailablePerDay,
        evacuationAdvantageCr,
        evacuationAdvantageLakhs
      },
      description: port.description
    });
  });

  const compliantPorts = candidateEvaluations.filter(c => c.isPartBCompliant);
  const disqualifiedPorts = candidateEvaluations.filter(c => !c.isPartBCompliant);

  // Strategy 1: Ample Fuel Option -> Rank by highest net landed arbitrage in Crores, then lowest wait
  const ampleFuelRanked = [...compliantPorts].sort((a, b) => 
    b.netArbitrageCr - a.netArbitrageCr || 
    a.avgWaitDays - b.avgWaitDays ||
    a.distNM - b.distNM
  );
  const ampleFuelOption = ampleFuelRanked.length > 0 ? ampleFuelRanked[0] : null;

  // Strategy 2: Low Fuel Option -> Rank by shortest distance (minimum deviation & bunker consumption)
  const lowFuelRanked = [...compliantPorts].sort((a, b) => 
    a.distNM - b.distNM || 
    b.netArbitrageCr - a.netArbitrageCr
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
      handlingRateTPD: currPort.handlingRateTPD,
      evacuation: currEvacuationProfile
    },
    vessel: {
      key: selectedVessel,
      name: vessel.name,
      ladenDraft: vessel.ladenDraftMeters,
      loa: vessel.loaMeters,
      beam: vessel.beamMeters,
      hourlyFuelBurnMT,
      bunkerFuelOnboardMT: currentBunkerFuelMT
    },
    isPortSaturated,
    geofenceRadiusNm: 80,
    geofenceRadiusKm: 148.16,
    anchorageLoss,
    waitOption,
    anchorOption,
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
        ? `⚠️ ${currPort.name} is saturated (${currPort.avgWaitDays}d wait • Anchorage Loss: ₹${totalAnchorageLossCr} Cr / ₹${totalAnchorageLossLakhs}L). OPTIMAL DIVERSION: ${suggestedPort.portName} is both the closest (${suggestedPort.distNM} NM) and lowest queue port — saves ₹${suggestedPort.netArbitrageCr} Cr (₹${suggestedPort.netArbitrageLakhs}L) net!`
        : `⚠️ ${currPort.name} is saturated (${currPort.avgWaitDays}d wait • Anchorage Loss: ₹${totalAnchorageLossCr} Cr / ₹${totalAnchorageLossLakhs}L). 2 STRATEGIES: [Low Fuel] Nearest port is ${lowFuelOption.portName} (${lowFuelOption.distNM} NM, ₹${lowFuelOption.fuelCostCr} Cr fuel) vs [Ample Fuel] Free port is ${ampleFuelOption.portName} (saves ${ampleFuelOption.waitDaysSaved}d wait & ₹${ampleFuelOption.netArbitrageCr} Cr net).`
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
  speedKnots = 12.0,
  dwt = 0,
  cargo = '',
  remainingBunkerFuelMT = null
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

  // Determine realistic cargo volume for evacuation calculation
  let cargoVolumeMT = 150000;
  if (dwt > 10000) {
    cargoVolumeMT = Math.round(dwt * 0.88);
  } else if (cargo && typeof cargo === 'string') {
    const mtMatch = cargo.match(/([0-9,]+)\s*MT/i);
    if (mtMatch) {
      cargoVolumeMT = parseInt(mtMatch[1].replace(/,/g, ''), 10);
    }
  } else if (vesselKey === 'handymax_hdc') {
    cargoVolumeMT = 32000;
  } else if (vesselKey === 'supramax') {
    cargoVolumeMT = 55000;
  } else if (vesselKey === 'panamax') {
    cargoVolumeMT = 75000;
  } else if (vesselKey === 'baby_cape') {
    cargoVolumeMT = 115000;
  }

  // Evaluate candidate ports using Part B measurements, fuel gate & multimodal evacuation
  const diversionResult = evaluatePortDiversion({
    selectedDestination: cleanPortId,
    selectedVessel: vesselKey,
    cargoVolumeMT,
    customDailyDemurrageLakhs: 65,
    vesselCoordinates,
    vesselSpeedKnots: speedKnots,
    remainingBunkerFuelMT
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
      waitOption: diversionResult.waitOption,
      anchorOption: diversionResult.anchorOption,
      currentPort: diversionResult.currentPort,
      suggestedPort: null,
      message: `${congestionData.portName || portInfo.name} is saturated (${congestionData.avgAnchorageWaitDays}d wait), but no alternative port satisfies fuel & draft constraints.`
    };
  }

  const ample = diversionResult.ampleFuelOption;
  const low = diversionResult.lowFuelOption;
  const primary = low || ample;

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
    currentPort: diversionResult.currentPort,
    waitOption: diversionResult.waitOption,
    anchorOption: diversionResult.anchorOption,
    ampleFuelOption: ample,
    lowFuelOption: low,
    suggestedPort: primary,
    vessel: diversionResult.vessel,
    headlineSuggestion: low && ample && low.portId === ample.portId
      ? `Port Saturated (${congestionData.avgAnchorageWaitDays}d wait • Anchorage Loss: ₹${diversionResult.anchorageLoss.totalLossCr} Cr / ₹${diversionResult.anchorageLoss.totalLossLakhs}L). SUGGESTION: Divert to ${low.portName} — Nearest & Free Port (Saves ${low.waitDaysSaved}d wait & ₹${low.netArbitrageCr} Cr net).`
      : `Port Saturated (${congestionData.avgAnchorageWaitDays}d wait • Anchorage Loss: ₹${diversionResult.anchorageLoss.totalLossCr} Cr / ₹${diversionResult.anchorageLoss.totalLossLakhs}L). 2 OPTIONS: [Low Fuel] Divert to Nearest ${low.portName} (${low.distNM} NM, ₹${low.fuelCostCr} Cr fuel) OR [Ample Fuel] Divert to Free ${ample.portName} (Saves ${ample.waitDaysSaved}d wait & ₹${ample.netArbitrageCr} Cr net).`
  };
}
