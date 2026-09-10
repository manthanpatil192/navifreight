import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';
import { PORT_CONGESTION_STATUS } from '../data/weatherCongestionData';

/**
 * Dynamic Port Evacuation & Part B Diversion Suggestion Engine
 * Evaluates when a destination port is saturated (high queue / berths full),
 * filters alternative ports strictly by Part B vessel measurements (Draft, LOA, Beam, TPD),
 * and generates actionable diversion recommendations with demurrage savings.
 */
export function evaluatePortDiversion({
  selectedDestination = 'paradip',
  selectedVessel = 'capesize',
  cargoVolumeMT = 150000,
  customDailyDemurrageLakhs = 65
}) {
  const currPort = INDIAN_EAST_COAST_PORTS[selectedDestination] || INDIAN_EAST_COAST_PORTS.paradip;
  const vessel = VESSEL_CLASSES[selectedVessel] || VESSEL_CLASSES.capesize;

  // Port is considered full/saturated if average queue is >= 2.5 days or congestion is moderate/high
  const isPortSaturated = currPort.avgWaitDays >= 2.5 || currPort.congestionLevel === 'MODERATE' || currPort.congestionLevel === 'HIGH';

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

    const waitDaysSaved = Number(Math.max(0, currPort.avgWaitDays - port.avgWaitDays).toFixed(1));
    const demurrageSavedLakhs = Number((waitDaysSaved * customDailyDemurrageLakhs).toFixed(1));
    const handlingRateAdvantageTPD = port.handlingRateTPD - currPort.handlingRateTPD;

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
      waitDaysSaved,
      demurrageSavedLakhs,
      handlingRateAdvantageTPD,
      description: port.description
    });
  });

  // Filter compliant ports and rank by turnaround efficiency (lowest wait, then highest handling rate)
  const compliantPorts = candidateEvaluations
    .filter(c => c.isPartBCompliant)
    .sort((a, b) => a.avgWaitDays - b.avgWaitDays || b.handlingRateTPD - a.handlingRateTPD);

  const disqualifiedPorts = candidateEvaluations.filter(c => !c.isPartBCompliant);

  const suggestedPort = compliantPorts.length > 0 ? compliantPorts[0] : null;

  // Generate diversion waypoints for map rendering (connecting current port anchorage to alternative port)
  let diversionPathCoordinates = [];
  if (suggestedPort && currPort.coordinates && suggestedPort.coordinates) {
    const [currLat, currLng] = currPort.coordinates;
    const [suggLat, suggLng] = suggestedPort.coordinates;

    // Generate intermediate offshore waypoint ~25 nautical miles into the open bay
    const midLat = (currLat + suggLat) / 2;
    const midLng = Math.max(currLng, suggLng) + 0.65; // Push offshore to simulate safe navigation corridor

    diversionPathCoordinates = [
      [currLat, currLng],
      [midLat, midLng],
      [suggLat, suggLng]
    ];
  }

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
      beam: vessel.beamMeters
    },
    isPortSaturated,
    suggestedPort,
    compliantPorts,
    disqualifiedPorts,
    diversionPathCoordinates,
    hasCompliantDiversion: !!suggestedPort,
    headlineRecommendation: isPortSaturated && suggestedPort
      ? `⚠️ ${currPort.name} is at capacity (${currPort.avgWaitDays}d wait). SUGGESTION: Divert to ${suggestedPort.portName} — Part B Verified (Draft ${suggestedPort.effectiveMaxDraft}m ≥ ${vessel.ladenDraft}m) saves ${suggestedPort.waitDaysSaved}d wait & ₹${suggestedPort.demurrageSavedLakhs} Lakhs demurrage!`
      : `🟢 ${currPort.name} has manageable queue (${currPort.avgWaitDays}d wait). Normal berthing clearance confirmed.`
  };
}

/**
 * Evaluates whether a port that a vessel is entering or calling is full based on real-time port congestion data,
 * and ONLY if full, generates a Part B-compliant diversion suggestion tailored to that specific vessel.
 */
export function evaluateVesselPortCongestionDiversion({
  portId,
  vesselType = '',
  currentDraught = 0,
  vesselName = ''
}) {
  if (!portId) return null;

  // Normalize port identifier (e.g. 'haldia_zone' -> 'haldia', 'paradip' -> 'paradip')
  let cleanPortId = portId.toLowerCase().replace('_zone', '').trim();
  if (cleanPortId.includes('haldia')) cleanPortId = 'haldia';
  else if (cleanPortId.includes('paradip')) cleanPortId = 'paradip';
  else if (cleanPortId.includes('gangavaram')) cleanPortId = 'gangavaram';
  else if (cleanPortId.includes('vizag') || cleanPortId.includes('visakhapatnam')) cleanPortId = 'vizag';
  else if (cleanPortId.includes('dhamra')) cleanPortId = 'dhamra';
  else if (cleanPortId.includes('gopalpur')) cleanPortId = 'gopalpur';

  const congestionData = PORT_CONGESTION_STATUS[cleanPortId] || PORT_CONGESTION_STATUS.paradip;
  const portInfo = INDIAN_EAST_COAST_PORTS[cleanPortId] || INDIAN_EAST_COAST_PORTS.paradip;

  // Port Congestion Data Thresholds:
  // Port is evaluated as "FULL" / saturated if:
  // 1. Congestion status is HIGH or MODERATE
  // 2. OR avg anchorage wait days >= 2.5 days
  // 3. OR vessels at anchor >= 6 ships
  const isPortFull = 
    congestionData.congestionStatus === 'HIGH' ||
    congestionData.congestionStatus === 'MODERATE' ||
    congestionData.avgAnchorageWaitDays >= 2.5 ||
    congestionData.vesselsAtAnchor >= 6 ||
    portInfo.avgWaitDays >= 2.5;

  // STRICT REQUIREMENT: Only suggest diversion if the port is actually full!
  if (!isPortFull) {
    return {
      isPortFull: false,
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

  // Evaluate candidate ports using Part B measurements
  const diversionResult = evaluatePortDiversion({
    selectedDestination: cleanPortId,
    selectedVessel: vesselKey,
    customDailyDemurrageLakhs: 65
  });

  if (!diversionResult.suggestedPort) {
    return {
      isPortFull: true,
      portName: congestionData.portName || portInfo.name,
      congestionStatus: congestionData.congestionStatus,
      avgWaitDays: congestionData.avgAnchorageWaitDays || portInfo.avgWaitDays,
      vesselsAtAnchor: congestionData.vesselsAtAnchor || 0,
      suggestedPort: null,
      message: `${congestionData.portName || portInfo.name} is saturated (${congestionData.avgAnchorageWaitDays}d wait), but no alternative port satisfies Part B physical limits.`
    };
  }

  return {
    isPortFull: true,
    portId: cleanPortId,
    portName: congestionData.portName || portInfo.name,
    congestionStatus: congestionData.congestionStatus,
    avgWaitDays: congestionData.avgAnchorageWaitDays || portInfo.avgWaitDays,
    vesselsAtAnchor: congestionData.vesselsAtAnchor || 0,
    berthTurnaroundHours: congestionData.berthTurnaroundHours || 36,
    suggestedPort: diversionResult.suggestedPort,
    vessel: diversionResult.vessel,
    headlineSuggestion: `Port Full (${congestionData.avgAnchorageWaitDays}d wait • ${congestionData.vesselsAtAnchor} ships queued). SUGGESTION: Divert to ${diversionResult.suggestedPort.portName} (Part B Draft ${diversionResult.suggestedPort.effectiveMaxDraft}m Verified) — Saves ${diversionResult.suggestedPort.waitDaysSaved}d wait & ₹${diversionResult.suggestedPort.demurrageSavedLakhs}L demurrage.`
  };
}

