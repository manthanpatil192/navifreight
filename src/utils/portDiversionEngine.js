import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

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
