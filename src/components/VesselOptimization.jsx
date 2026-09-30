import React, { useState, useMemo, useEffect } from 'react';
import {
  Ship, AlertTriangle, CheckCircle2, XCircle, TrendingDown,
  Clock, Anchor, BarChart3, MapPin, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Zap, Award, AlertCircle, Sparkles, DollarSign, Gift, Activity, Radio,
  Globe, Ruler, Layers, ShieldCheck, Scale, Check, Filter
} from 'lucide-react';
import { INDIAN_EAST_COAST_PORTS, ORIGIN_LOADING_PORTS } from '../data/portsData';
import { fetchLiveINCOISData } from '../api/incoisConnector';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import { PORT_CONGESTION_STATUS, IMD_WEATHER_ALERTS } from '../data/weatherCongestionData';
import { optimizeVesselType } from '../utils/vesselOptimizationEngine';
import InsightBulb from './InsightBulb';

// Vessel classes with complete physical engineering specs (LOA, Beam, Draft, DWT, Handling)
const VESSEL_CLASSES = [
  {
    id: 'capesize', name: 'Capesize', dwtRange: '160,000–180,000 DWT',
    ladenDraft: 18.2, loaM: 292, beamM: 45.0, dailyTCE: 22000, fuelMTPerDay: 42,
    typicalParcel: 160000, costMultiplier: 0.72, geared: false,
    dwt: 175000, description: 'Premier deepwater large bulker. Best freight $/MT for Gangavaram, Dhamra, & Vizag Outer.'
  },
  {
    id: 'baby_cape', name: 'Baby Cape / Post-Panamax', dwtRange: '115,000 DWT',
    ladenDraft: 15.1, loaM: 255, beamM: 43.0, dailyTCE: 19800, fuelMTPerDay: 33.5,
    typicalParcel: 105000, costMultiplier: 0.81, geared: false,
    dwt: 115000, description: 'Engineered specifically for draft-restricted high-tide berths (Paradip spring tide & Maputo TCM).'
  },
  {
    id: 'kamsarmax', name: 'Kamsarmax', dwtRange: '80,000–82,000 DWT',
    ladenDraft: 14.4, loaM: 229, beamM: 32.26, dailyTCE: 14500, fuelMTPerDay: 29.5,
    typicalParcel: 80000, costMultiplier: 0.88, geared: false,
    dwt: 82000, description: 'The workhorse of Indian East Coast bulk trade. Standard 80,000 MT parcel capacity.'
  },
  {
    id: 'panamax', name: 'Panamax', dwtRange: '74,000–78,000 DWT',
    ladenDraft: 14.2, loaM: 225, beamM: 32.20, dailyTCE: 13800, fuelMTPerDay: 28,
    typicalParcel: 75000, costMultiplier: 0.92, geared: false,
    dwt: 75000, description: 'Standard Panamax dimensions compatible with berths across Australia, US, and India.'
  },
  {
    id: 'supramax', name: 'Supramax / Ultramax', dwtRange: '55,000–64,000 DWT',
    ladenDraft: 12.8, loaM: 199, beamM: 32.20, dailyTCE: 11500, fuelMTPerDay: 25,
    typicalParcel: 55000, costMultiplier: 1.04, geared: true,
    dwt: 58000, description: 'Self-discharging geared bulker equipped with 4 x 35T cranes for shallow ports/open anchorages.'
  },
  {
    id: 'handymax', name: 'Handymax (HDC River Lock Class)', dwtRange: '35,000 DWT',
    ladenDraft: 8.2, loaM: 178, beamM: 27.5, dailyTCE: 10500, fuelMTPerDay: 21,
    typicalParcel: 33000, costMultiplier: 1.16, geared: true,
    dwt: 35000, description: 'Purpose-built river bulker fitting Haldia 8.5m draft & strict 31.0m lock gate limit.'
  },
  {
    id: 'handysize', name: 'Handysize (Shallow Draft)', dwtRange: '28,000–38,000 DWT',
    ladenDraft: 7.8, loaM: 165, beamM: 26.0, dailyTCE: 9500, fuelMTPerDay: 19,
    typicalParcel: 28000, costMultiplier: 1.25, geared: true,
    dwt: 28000, description: 'Shallow-draft bulk carrier capable of navigating river locks at neap tide without lightening.'
  },
];

// Live port operating conditions
const PORT_LIVE_CONDITIONS = {
  paradip:    { actualTPD: 38000, ratedTPD: 45000, queueVessels: 14, waitDays: 3.2, conveyorStatus: 'PARTIAL (Conveyor #3 Maintenance)', berthAvailDays: 6 },
  vizag:      { actualTPD: 58000, ratedTPD: 60000, queueVessels: 5,  waitDays: 1.4, conveyorStatus: 'FULL CAPACITY',                      berthAvailDays: 18 },
  gangavaram: { actualTPD: 62000, ratedTPD: 70000, queueVessels: 4,  waitDays: 1.1, conveyorStatus: 'FULL CAPACITY',                      berthAvailDays: 21 },
  dhamra:     { actualTPD: 55000, ratedTPD: 65000, queueVessels: 7,  waitDays: 2.1, conveyorStatus: 'NORMAL',                             berthAvailDays: 14 },
  gopalpur:   { actualTPD: 20000, ratedTPD: 25000, queueVessels: 9,  waitDays: 3.8, conveyorStatus: 'TUG SHORTAGE — 20% SLOW',            berthAvailDays: 5  },
  haldia:     { actualTPD: 14000, ratedTPD: 18000, queueVessels: 11, waitDays: 5.2, conveyorStatus: 'LOCK TIDE-LOCKED (6h/day)',           berthAvailDays: 3  },
  sandheads:  { actualTPD: 20000, ratedTPD: 22000, queueVessels: 6,  waitDays: 3.5, conveyorStatus: 'BARGE FLEET NORMAL',                 berthAvailDays: 12 },
  ennore:     { actualTPD: 42000, ratedTPD: 48000, queueVessels: 4,  waitDays: 1.6, conveyorStatus: 'FULL CAPACITY (Coal Berths 1-2)',    berthAvailDays: 16 },
  chennai:    { actualTPD: 30000, ratedTPD: 35000, queueVessels: 6,  waitDays: 2.3, conveyorStatus: 'NORMAL (West Quay Berths)',          berthAvailDays: 10 },
  krishnapatnam:{actualTPD: 50000,ratedTPD: 55000, queueVessels: 5,  waitDays: 1.5, conveyorStatus: 'FULL CAPACITY',                      berthAvailDays: 15 },
  tuticorin:  { actualTPD: 28000, ratedTPD: 32000, queueVessels: 5,  waitDays: 1.9, conveyorStatus: 'NORMAL (NCB Berths)',                berthAvailDays: 12 },
};

const ALL_CANDIDATE_PORTS = ['paradip', 'vizag', 'gangavaram', 'dhamra', 'gopalpur', 'haldia', 'sandheads', 'ennore', 'chennai', 'krishnapatnam', 'tuticorin'];

const DEMURRAGE_RATE_INR_PER_DAY = 6500000; // ₹65L/day ($75k/day)
const DISPATCH_RATE_INR_PER_DAY = 3250000;  // ₹32.5L/day (Standard 50% Dispatch Reward)

function computePortScore(originId, portId, vessel, cargoMT, incoisData) {
  const port = INDIAN_EAST_COAST_PORTS[portId];
  const origin = ORIGIN_LOADING_PORTS[originId] || ORIGIN_LOADING_PORTS.hay_point;
  const live = PORT_LIVE_CONDITIONS[portId] || { actualTPD: 35000, ratedTPD: 40000, queueVessels: 5, waitDays: 2.0, conveyorStatus: 'NORMAL', berthAvailDays: 10 };
  if (!port || !origin) return null;

  // Origin checks (Australia, US, Mozambique, Indonesia)
  const originDraft = origin.maxDraftLaden || origin.maxDraft || 18.0;
  const originLoa = origin.maxLOA || 330;
  const originBeam = origin.maxBeam || 55.0;

  const originDraftClear = vessel.ladenDraft <= originDraft;
  const originLoaClear = vessel.loaM <= originLoa;
  const originBeamClear = vessel.beamM <= originBeam;

  // Destination checks (Indian East Coast Discharge Ports)
  const destDraftClear = vessel.ladenDraft <= port.maxDraftLaden;
  const destMaxDraft = incoisData ? incoisData.oceanographic.livePermissibleDraft : (port.outerHarbourDraft ? Math.max(port.maxDraftHighTide, port.outerHarbourDraft) : port.maxDraftHighTide);
  const destDraftTide = vessel.ladenDraft <= destMaxDraft;
  const destDraftOk = destDraftClear || destDraftTide;
  const destLoaClear = vessel.loaM <= port.maxLOA;
  const destBeamClear = vessel.beamM <= (port.maxBeam || 50.0);

  const loaClear = originLoaClear && destLoaClear;
  const beamClear = originBeamClear && destBeamClear;
  const blocked = !destDraftOk || !loaClear || !beamClear || !originDraftClear;

  // Exact clearance margins
  const originDraftMargin = +(originDraft - vessel.ladenDraft).toFixed(1);
  const originLoaMargin = +(originLoa - vessel.loaM).toFixed(1);
  const originBeamMargin = +(originBeam - vessel.beamM).toFixed(1);
  const destDraftMargin = +(port.maxDraftLaden - vessel.ladenDraft).toFixed(1);
  const destTideDraftMargin = +(destMaxDraft - vessel.ladenDraft).toFixed(1);
  const destLoaMargin = +(port.maxLOA - vessel.loaM).toFixed(1);
  const destBeamMargin = +((port.maxBeam || 50.0) - vessel.beamM).toFixed(1);

  let isLightLoaded = false;
  let lightLoadingCapMT = vessel.typicalParcel;
  let deadFreightPenaltyINRCr = 0;
  let bindingConstraint = 'None';

  if (!blocked) {
    const availableOriginDraft = originDraft;
    const availableDestDraft = destDraftClear ? port.maxDraftLaden : destMaxDraft;
    const maxAllowableDraft = Math.min(availableOriginDraft, availableDestDraft);
    
    if (vessel.ladenDraft > maxAllowableDraft) {
      isLightLoaded = true;
      lightLoadingCapMT = Math.round((maxAllowableDraft / vessel.ladenDraft) * vessel.typicalParcel * 0.94);
      const shortCargoMT = vessel.typicalParcel - lightLoadingCapMT;
      deadFreightPenaltyINRCr = +((shortCargoMT * 18.5 * 95.0) / 10000000).toFixed(2);
      
      if (availableOriginDraft < availableDestDraft) {
        bindingConstraint = `Origin (${origin.name} max ${availableOriginDraft}m)`;
      } else {
        bindingConstraint = `Destination (${port.name} max ${availableDestDraft}m)`;
      }
    }
  }

  // Trips required
  const tripsRequired = Math.ceil(cargoMT / lightLoadingCapMT);

  // Turnaround & Cargo Handling Rates (Loading at origin + Discharge at destination)
  const originLoadingRateTPD = origin.handlingRateTPD || 65000;
  const destDischargeRateTPD = live.actualTPD || port.handlingRateTPD || 45000;
  const ratedDischargeTPD = port.handlingRateTPD || 45000;

  const loadingDays = +(cargoMT / originLoadingRateTPD).toFixed(1);
  const dischargeDays = +(cargoMT / destDischargeRateTPD).toFixed(1);

  // Laytime allowance calculation (standard laytime = cargoMT / rated TPD)
  const allowedLaytimeDays = +(cargoMT / ratedDischargeTPD).toFixed(1);
  const extraOverLaytime = +(dischargeDays - allowedLaytimeDays).toFixed(1);
  
  // Demurrage vs Dispatch Calculation (Two-Way Laytime Equation)
  let demurrageINRCr = 0;
  let demurrageUSD = 0;
  let dispatchBonusINRLakhs = 0;
  let dispatchBonusUSD = 0;
  let isDispatchEarned = false;

  const voyageMultiplierWaitDays = (tripsRequired - 1) * (live.waitDays + 1.0);

  if (extraOverLaytime > 0 || live.waitDays > 1.5 || tripsRequired > 1) {
    const demurrageDays = Math.max(0, extraOverLaytime + Math.max(0, live.waitDays - 1.0) + voyageMultiplierWaitDays);
    demurrageINRCr = +((demurrageDays * DEMURRAGE_RATE_INR_PER_DAY) / 10000000).toFixed(2);
    demurrageUSD = Math.round((demurrageINRCr * 10000000) / 95.0);
  } else if (extraOverLaytime < 0 && live.waitDays <= 1.5 && tripsRequired === 1) {
    isDispatchEarned = true;
    const earlyDays = Math.abs(extraOverLaytime);
    dispatchBonusINRLakhs = +((earlyDays * DISPATCH_RATE_INR_PER_DAY) / 100000).toFixed(1);
    dispatchBonusUSD = Math.round((dispatchBonusINRLakhs * 100000) / 95.0);
  }

  // Traffic Light Verdict Generation
  let verdictBadge = { text: '', cls: '', icon: CheckCircle2 };
  if (!beamClear) {
    const blocker = !destBeamClear
      ? `Destination (${port.name} max Beam ${port.maxBeam}m — e.g. Lock Gate Width)`
      : `Origin (${origin.name} max Beam ${originBeam}m)`;
    verdictBadge = {
      text: `❌ Beam Exceeded at ${blocker} (${vessel.beamM}m) — Physical Lock / Berth Refusal`,
      cls: 'bg-red-50 text-red-800 border-red-200',
      icon: XCircle
    };
  } else if (!loaClear) {
    const blocker = !originLoaClear ? `Origin (${origin.name} max LOA ${originLoa}m)` : `Destination (${port.name} max LOA ${port.maxLOA}m)`;
    verdictBadge = {
      text: `❌ LOA Exceeded at ${blocker} (${vessel.loaM}m) — Switch to smaller vessel`,
      cls: 'bg-red-50 text-red-800 border-red-200',
      icon: XCircle
    };
  } else if (!destDraftOk) {
    verdictBadge = {
      text: `❌ Destination Draft Insufficient (${vessel.ladenDraft}m vs ${port.maxDraftLaden}m standard / ${destMaxDraft}m high tide) — Switch to smaller vessel`,
      cls: 'bg-red-50 text-red-800 border-red-200',
      icon: XCircle
    };
  } else if (!originDraftClear) {
    verdictBadge = {
      text: `❌ Origin Draft Insufficient (${vessel.ladenDraft}m vs ${originDraft}m at ${origin.name}) — Cannot load full parcel`,
      cls: 'bg-red-50 text-red-800 border-red-200',
      icon: XCircle
    };
  } else if (isLightLoaded) {
    verdictBadge = {
      text: `⚠️ Light-loaded to ${lightLoadingCapMT.toLocaleString()} MT due to ${bindingConstraint} (Penalty: ₹${deadFreightPenaltyINRCr} Cr)`,
      cls: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: AlertTriangle
    };
  } else if (tripsRequired > 1) {
    verdictBadge = {
      text: `⚠️ Capacity Deficit: Requires ${tripsRequired} voyages (${cargoMT.toLocaleString()} MT > ${vessel.typicalParcel.toLocaleString()} MT) — Switch to Kamsarmax/Panamax`,
      cls: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: AlertTriangle
    };
  } else {
    verdictBadge = {
      text: `✅ Fits 100% at Origin & Destination — Zero Restrictions for ${cargoMT.toLocaleString()} MT`,
      cls: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      icon: CheckCircle2
    };
  }

  // TPD → Dollars, Demurrage & Dispatch Translation
  let tpdTranslationSentence = '';
  if (isDispatchEarned) {
    tpdTranslationSentence = `Loading: ${loadingDays}d @ ${originLoadingRateTPD.toLocaleString()} TPD | Discharge: ${dischargeDays}d @ ${destDischargeRateTPD.toLocaleString()} TPD ➔ Finished ${Math.abs(extraOverLaytime)}d ahead of laytime! 🎉 Dispatch Reward: +₹${dispatchBonusINRLakhs} Lakhs (+$${Math.round(dispatchBonusUSD / 1000)}k USD) cash credit from shipowner.`;
  } else if (extraOverLaytime > 0 || tripsRequired > 1) {
    tpdTranslationSentence = `Loading: ${loadingDays}d @ ${originLoadingRateTPD.toLocaleString()} TPD | Discharge: ${dischargeDays}d (${tripsRequired > 1 ? `${tripsRequired} voyages` : 'single voyage'}) ➔ ₹${demurrageINRCr} Cr ($${Math.round(demurrageUSD / 1000)}k USD) demurrage & turnaround cost.`;
  } else {
    tpdTranslationSentence = `Loading: ${loadingDays}d @ ${originLoadingRateTPD.toLocaleString()} TPD | Discharge: ${dischargeDays}d ➔ On schedule within free laytime (${allowedLaytimeDays}d). Zero demurrage.`;
  }

  // Compute composite score /100
  let score = 100;
  if (isLightLoaded) score -= 20;
  if (blocked) score -= 60;

  if (cargoMT > lightLoadingCapMT) {
    const capacityDeficitMT = cargoMT - lightLoadingCapMT;
    const deficitRatio = capacityDeficitMT / cargoMT;
    score -= Math.round(35 + deficitRatio * 30);
  }
  if (tripsRequired > 1) {
    score -= (tripsRequired - 1) * 20;
  }
  if (vessel.typicalParcel > cargoMT * 2.2) {
    score -= 25;
  }

  const costPenalty = Math.round((vessel.costMultiplier - 0.72) * 20);
  score -= Math.max(0, costPenalty);

  if (live.waitDays > 3) score -= 10;
  if (extraOverLaytime > 1.0) score -= 15;
  if (live.berthAvailDays < 7) score -= 12;
  if (isDispatchEarned) score += 5;
  score = Math.max(0, Math.min(100, score));

  const costPremium = +(vessel.costMultiplier - 0.72).toFixed(2);

  return {
    originId, portId, port, origin, live,
    vessel,
    originDraftClear, originLoaClear, originBeamClear,
    destDraftClear, destDraftTide, destDraftOk, destLoaClear, destBeamClear,
    loaClear, beamClear, blocked,
    originDraftMargin, originLoaMargin, originBeamMargin,
    destDraftMargin, destTideDraftMargin, destLoaMargin, destBeamMargin,
    originLoadingRateTPD, destDischargeRateTPD, loadingDays, dischargeDays,
    tripsRequired, allowedLaytimeDays, extraOverLaytime,
    demurrageINRCr, demurrageUSD,
    isDispatchEarned, dispatchBonusINRLakhs, dispatchBonusUSD,
    isLightLoaded, lightLoadingCapMT, deadFreightPenaltyINRCr, bindingConstraint,
    verdictBadge, tpdTranslationSentence,
    score, costPremium
  };
}

export default function VesselOptimization({
  selectedOrigin,
  selectedDestination,
  cargoVolumeMT,
  currency,
  onSelectVessel,
  currentVesselId,
  onSelectPort,
  onSelectOrigin
}) {
  const isINR = currency === 'INR';
  const [activeTab, setActiveTab] = useState('optimizer'); // 'optimizer' | 'constraints' | 'loading_ports' | 'portswitcher'
  const [selectedLoadingRegion, setSelectedLoadingRegion] = useState('ALL'); // 'ALL' | 'AUSTRALIA' | 'USA' | 'MOZAMBIQUE' | 'INDONESIA' | 'GLOBAL'
  const [incoisData, setIncoisData] = useState(null);
  const [isLoadingIncois, setIsLoadingIncois] = useState(true);

  // Live AIS Telemetry State
  const [isLiveAisMode, setIsLiveAisMode] = useState(false);
  const [selectedLiveShipMmsi, setSelectedLiveShipMmsi] = useState('');

  // Get inbound ships for the selected destination
  const inboundShips = useMemo(() => {
    return LIVE_AIS_VESSELS.filter(ship => ship.destinationId === selectedDestination);
  }, [selectedDestination]);

  useEffect(() => {
    if (isLiveAisMode && inboundShips.length > 0 && !selectedLiveShipMmsi) {
      setSelectedLiveShipMmsi(inboundShips[0].mmsi);
    }
  }, [isLiveAisMode, inboundShips, selectedLiveShipMmsi]);

  const activeLiveShip = useMemo(() => {
    if (!isLiveAisMode || !selectedLiveShipMmsi) return null;
    return inboundShips.find(s => s.mmsi === selectedLiveShipMmsi);
  }, [isLiveAisMode, selectedLiveShipMmsi, inboundShips]);
  
  const activeCargoVolume = useMemo(() => {
    if (activeLiveShip) {
      const match = activeLiveShip.cargo.match(/([\d,]+)\s*MT/);
      if (match) return parseInt(match[1].replace(/,/g, ''), 10);
      return activeLiveShip.dwt; 
    }
    return cargoVolumeMT;
  }, [activeLiveShip, cargoVolumeMT]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingIncois(true);
    fetchLiveINCOISData(selectedDestination).then(data => {
      if (isMounted) {
        setIncoisData(data);
        setIsLoadingIncois(false);
      }
    });
    
    // Simulate real-time dashboard live polling
    const interval = setInterval(() => {
      fetchLiveINCOISData(selectedDestination).then(data => {
        if (isMounted) setIncoisData(data);
      });
    }, 15000); // 15 seconds for fast hackathon demo updates

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedDestination]);

  const currentPort = INDIAN_EAST_COAST_PORTS[selectedDestination] || INDIAN_EAST_COAST_PORTS.paradip;
  const currentOrigin = ORIGIN_LOADING_PORTS[selectedOrigin] || ORIGIN_LOADING_PORTS.hay_point;
  const liveCurrent = PORT_LIVE_CONDITIONS[selectedDestination] || { actualTPD: 35000, ratedTPD: 40000, queueVessels: 5, waitDays: 2.0, conveyorStatus: 'NORMAL', berthAvailDays: 10 };

  const filteredLoadingPorts = useMemo(() => {
    const allPorts = Object.values(ORIGIN_LOADING_PORTS);
    if (selectedLoadingRegion === 'ALL') return allPorts;
    if (selectedLoadingRegion === 'AUSTRALIA') return allPorts.filter(p => p.country === 'Australia');
    if (selectedLoadingRegion === 'USA') return allPorts.filter(p => p.country === 'United States');
    if (selectedLoadingRegion === 'MOZAMBIQUE') return allPorts.filter(p => p.country === 'Mozambique');
    if (selectedLoadingRegion === 'INDONESIA') return allPorts.filter(p => p.country === 'Indonesia');
    if (selectedLoadingRegion === 'GLOBAL') return allPorts.filter(p => !['Australia', 'United States', 'Mozambique', 'Indonesia'].includes(p.country));
    return allPorts;
  }, [selectedLoadingRegion]);

  // Evaluate all vessels for the selected port
  const vesselEvals = useMemo(() => {
    const liveClassMap = { 'Capesize': 'capesize', 'Kamsarmax': 'kamsarmax', 'Panamax': 'panamax', 'Supramax': 'supramax', 'Handymax': 'handysize' };
    
    return VESSEL_CLASSES.map(baseVessel => {
      let vesselToEval = { ...baseVessel };
      if (activeLiveShip) {
        const shipClass = activeLiveShip.vesselType.split(' ')[0];
        if (liveClassMap[shipClass] === baseVessel.id) {
          vesselToEval.ladenDraft = activeLiveShip.currentDraughtMeters;
          vesselToEval.loaM = activeLiveShip.loaMeters;
          vesselToEval.name = `${activeLiveShip.name} (Live AIS Data)`;
        }
      }
      return computePortScore(selectedOrigin, selectedDestination, vesselToEval, activeCargoVolume, incoisData);
    })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [selectedOrigin, selectedDestination, activeCargoVolume, incoisData, activeLiveShip]);

  // Integrated PS Part (b) Optimization Engine
  const engineOptimization = useMemo(() => {
    return optimizeVesselType({
      originId: selectedOrigin,
      destinationId: selectedDestination,
      cargoVolumeMT: activeCargoVolume,
      cargoType: 'Coking Coal'
    });
  }, [selectedOrigin, selectedDestination, activeCargoVolume]);

  // Auto-Recommended Optimal Vessel Class (Strictly synchronized with PS Part b Core Engine)
  const recommendedVesselEval = vesselEvals.find(v => v.vessel.id === engineOptimization.recommendedVesselId && !v.blocked)
    || vesselEvals.find(v => !v.blocked) 
    || vesselEvals[0];
  const activeVesselEval = vesselEvals.find(v => v.vessel.id === currentVesselId) || recommendedVesselEval;

  // Compute side-by-side penalty delta between Recommended and Suboptimal Vessel
  const mismatchedVesselEval = vesselEvals.find(v => v.vessel.id !== recommendedVesselEval.vessel.id && v.blocked) 
    || vesselEvals.find(v => v.vessel.id !== recommendedVesselEval.vessel.id) 
    || vesselEvals[vesselEvals.length - 1];

  const penaltyDeltaINRCr = Math.abs(mismatchedVesselEval.deadFreightPenaltyINRCr + mismatchedVesselEval.demurrageINRCr - (recommendedVesselEval.deadFreightPenaltyINRCr + recommendedVesselEval.demurrageINRCr)).toFixed(2);

  // Port switch recommendations — find which port is cheapest for chosen vessel
  const activeVesselObj = VESSEL_CLASSES.find(v => v.id === currentVesselId) || VESSEL_CLASSES[0];
  const portComparisons = useMemo(() => {
    let vesselObj = { ...activeVesselObj };
    if (activeLiveShip) {
      vesselObj.ladenDraft = activeLiveShip.currentDraughtMeters;
      vesselObj.loaM = activeLiveShip.loaMeters;
    }
    return ALL_CANDIDATE_PORTS
      .map(pid => computePortScore(selectedOrigin, pid, vesselObj, activeCargoVolume, null))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [selectedOrigin, currentVesselId, activeCargoVolume, activeLiveShip, activeVesselObj]);

  // Plain-English Executive Summary Header text
  const executiveSummaryHeader = recommendedVesselEval.isLightLoaded
    ? `Executive Directive: ${recommendedVesselEval.vessel.name} is constrained by ${recommendedVesselEval.bindingConstraint}; book early to manage light-loading or switch to ${vesselEvals.find(v => !v.isLightLoaded && !v.blocked)?.vessel.name || 'smaller class'} to save ₹${penaltyDeltaINRCr} Cr in dead-freight penalties.`
    : `Executive Directive: ${recommendedVesselEval.vessel.name} is the optimal 100% fit for ${currentPort.name} and loading origin. Zero draft restriction; single-voyage capacity matches ${activeCargoVolume.toLocaleString()} MT consignment cleanly.`;

  const candidateMatrixCards = useMemo(() => {
    const evals = engineOptimization.evaluations;
    const isHaldia = selectedDestination === 'haldia';
    
    // Pick 3 representative classes across shallow, medium, and large
    const shallow = isHaldia 
      ? (evals.find(e => e.id === 'handymax') || evals.find(e => e.id === 'handysize') || evals[0])
      : (evals.find(e => e.id === 'supramax') || evals.find(e => e.id === 'handymax') || evals[0]);
    
    // Medium class: prioritizes Kamsarmax/Panamax for 70k-90k MT parcels, or Baby Cape for >90k MT
    const medium = evals.find(e => e.id === engineOptimization.recommendedVesselId && ['kamsarmax', 'panamax', 'baby_cape'].includes(e.id))
      || (activeCargoVolume <= 90000 
          ? (evals.find(e => e.id === 'kamsarmax') || evals.find(e => e.id === 'panamax'))
          : (evals.find(e => e.id === 'baby_cape') || evals.find(e => e.id === 'kamsarmax') || evals.find(e => e.id === 'panamax')))
      || evals[1];

    const large = evals.find(e => e.id === 'capesize') || evals[evals.length - 1];
    
    return [shallow, medium, large].filter(Boolean);
  }, [engineOptimization, selectedDestination, activeCargoVolume]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Ship className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 3: Vessel & Port Fit Decision Matrix (Demurrage vs Dispatch)</span>
              <InsightBulb
                title="Demurrage vs Dispatch Bonus (The Two-Way Contract)"
                subtitle="Why Fast Ports Actually Pay You Cash Rewards"
                dataset="Standard BIMCO/GENCON Charter Party Clauses + Port TPD Rates"
                logic="Demurrage is a fine when you take too long to unload. But standard maritime contracts work both ways! If a high-speed port (like Gangavaram with 70k TPD) finishes unloading 1.5 days early, the shipowner legally owes the charterer a cash reward called 'Dispatch' (customarily 50% of the demurrage rate = ₹11 Lakhs/day). Most hackathon teams only look at penalties and forget that fast unloader ports generate cash rewards."
                impact="Unlocks positive cash flow: routing via automated deepwater terminals generates ₹15–₹30 Lakhs in dispatch earnings per vessel call."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Traffic-light verdicts, two-way laytime economics (Demurrage vs Dispatch), and side-by-side cost deltas
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap rounded-md border border-slate-200 overflow-hidden text-xs shrink-0 shadow-xs">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3 py-1.5 font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'optimizer' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span>Vessel Recommender</span>
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`px-3 py-1.5 font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'constraints' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Dual-Port Fit & Official Limits</span>
          </button>
          <button
            onClick={() => setActiveTab('loading_ports')}
            className={`px-3 py-1.5 font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'loading_ports' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Loading Ports Hub (Aus • US • Moz • Indo)</span>
          </button>
          <button
            onClick={() => setActiveTab('portswitcher')}
            className={`px-3 py-1.5 font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'portswitcher' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Port Switch Advisor</span>
          </button>
        </div>
      </div>

      {/* === ONE-LINE PLAIN-ENGLISH EXECUTIVE DIRECTIVE BANNER === */}
      <div className="bg-gradient-to-r from-maritime-900 via-slate-900 to-maritime-950 text-white rounded-lg p-3.5 mb-5 shadow-sm border border-maritime-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 block mb-0.5">
              Top Executive Summary Directive
            </span>
            <p className="text-xs font-semibold text-slate-100 leading-snug">
              {executiveSummaryHeader}
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded">
          Optimal Class: {recommendedVesselEval.vessel.name}
        </div>
      </div>

      {/* === PART B: 3-CARD CANDIDATE VESSEL CLASS & PORT FIT DECISION MATRIX (STYLED LIKE PART A) === */}
      {activeTab === 'optimizer' && (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Ship className="w-4 h-4 text-emerald-700" />
                <span>Interactive Candidate Vessel Class Decision Matrix (Shallow vs Panamax vs Capesize)</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  PS Part (b) Core
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Evaluating under-keel clearance (UKC), LOA berth limits, AIS live fleet verification, and turnaround decomposition for {activeCargoVolume.toLocaleString()} MT at {currentPort.name}.
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Click any card to apply vessel class globally
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {candidateMatrixCards.map((card) => {
              const isSelected = currentVesselId === card.id;
              const isRecommended = card.id === engineOptimization.recommendedVesselId;
              const isBlocked = card.isHardBlocked;
              const isWarning = card.isLightLoaded || card.lighterageRequired;

              const badgeCls = isRecommended
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isBlocked
                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                  : isWarning
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-cyan-50 text-cyan-800 border-cyan-300';

              const borderCls = isRecommended
                ? 'border-emerald-400 hover:border-emerald-500'
                : isBlocked
                  ? 'border-rose-300 hover:border-rose-400'
                  : isWarning
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-cyan-300 hover:border-cyan-400';

              const activeBorderCls = isRecommended
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : isBlocked
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                  : isWarning
                    ? 'border-amber-500 ring-2 ring-amber-500/20'
                    : 'border-cyan-500 ring-2 ring-cyan-500/20';

              const headerBg = isRecommended
                ? 'bg-gradient-to-r from-emerald-50 to-white'
                : isBlocked
                  ? 'bg-gradient-to-r from-rose-50 to-white'
                  : isWarning
                    ? 'bg-gradient-to-r from-amber-50 to-white'
                    : 'bg-gradient-to-r from-cyan-50 to-white';

              const tagText = isRecommended
                ? '🏆 OPTIMAL CLASS (RECOMMENDED)'
                : isBlocked
                  ? '🔴 RESTRICTED / GROUNDING HAZARD'
                  : isWarning
                    ? '⚠️ PARTIAL LOAD / LIGHTERAGE'
                    : 'COMPLIANT ALTERNATIVE';

              return (
                <div
                  key={card.id}
                  onClick={() => onSelectVessel && onSelectVessel(card.id)}
                  className={`rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    isSelected ? activeBorderCls : `${borderCls} bg-white`
                  }`}
                >
                  {/* Card Header Strip */}
                  <div className={`p-4 border-b border-slate-100 ${headerBg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${badgeCls}`}>
                        {tagText}
                      </span>
                      {isSelected && (
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Active Class
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{card.name} ({card.dwt.toLocaleString()} DWT)</h4>
                    <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{card.desc}</p>
                  </div>

                  {/* Body Metrics Grid */}
                  <div className="p-4 space-y-3 text-xs">
                    
                    {/* Landed Freight Rate */}
                    <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Effective Freight Rate:</span>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900">
                          ₹{card.effectiveRateINR.toLocaleString()} /MT
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ${card.effectiveRateUSD.toFixed(2)} /MT @ Spot FX
                        </span>
                      </div>
                    </div>

                    {/* Total Outflow */}
                    <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Total Landed Outflow:</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-800">
                          ₹{card.totalFreightINR_Cr} Crore
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ${Math.round(card.effectiveRateUSD * activeCargoVolume).toLocaleString()} USD
                        </span>
                      </div>
                    </div>

                    {/* Under-Keel Clearance */}
                    <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Under-Keel Clearance:</span>
                      <div className="text-right font-semibold">
                        {!isBlocked && card.draftMargin >= 0 ? (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-[11px]">
                            +{card.draftMargin.toFixed(1)}m Safe Margin [PASSED]
                          </span>
                        ) : !isBlocked && card.tideDraftMargin >= 0 ? (
                          <span className="text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                            +{card.tideDraftMargin.toFixed(1)}m Tide Margin [SPRING TIDE]
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded text-[11px]">
                            [RESTRICTED] {Math.abs(card.draftMargin).toFixed(1)}m Excess Draft
                          </span>
                        )}
                      </div>
                    </div>

                    {/* LOA & Berth Suitability */}
                    <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">LOA & Berth Fit:</span>
                      <div className="text-right font-mono text-[11px]">
                        {card.loa <= currentPort.maxLOA ? (
                          <span className="text-emerald-700 font-semibold">
                            {card.loa}m &le; {currentPort.maxLOA}m [CLEAR TO BERTH]
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold">
                            {card.loa}m &gt; {currentPort.maxLOA}m [LOCK REFUSAL]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Beam & Lock Chamber Fit */}
                    <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Beam & Lock Gate:</span>
                      <div className="text-right font-mono text-[11px]">
                        {(card.beam || 32.2) <= (currentPort.maxBeam || 50.0) ? (
                          <span className="text-emerald-700 font-semibold">
                            {(card.beam || 32.2).toFixed(1)}m &le; {(currentPort.maxBeam || 50.0)}m [CLEAR: +{((currentPort.maxBeam || 50.0) - (card.beam || 32.2)).toFixed(1)}m]
                          </span>
                        ) : (
                          <span className="text-rose-700 font-semibold">
                            {(card.beam || 32.2).toFixed(1)}m &gt; {currentPort.maxBeam}m [LOCK REFUSAL]
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dual-Port Handling Velocity */}
                    <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Dual-Port Handling:</span>
                      <div className="text-right text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {currentOrigin.handlingRateTPD.toLocaleString()} Load / {currentPort.handlingRateTPD.toLocaleString()} Disch TPD
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {card.pureLoadingDays ? `${card.pureLoadingDays}d load` : `${(activeCargoVolume / currentOrigin.handlingRateTPD).toFixed(1)}d load`} + {card.pureDischargeDays ? `${card.pureDischargeDays}d disch` : `${(activeCargoVolume / currentPort.handlingRateTPD).toFixed(1)}d disch`}
                        </span>
                      </div>
                    </div>

                    {/* Real-World AIS Telemetry */}
                    <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 text-[11px]">Live AIS Port Calls:</span>
                      <div className="text-right text-[11px] font-medium text-slate-700">
                        {card.aisConfirmedCalls > 0 ? (
                          <span className="text-emerald-700 font-bold">
                            🟢 {card.aisConfirmedCalls} live active calls ({card.aisLiveExamples.split(',')[0]})
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            Validated dimensions
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Turnaround Breakdown */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-600" />
                          Turnaround Decomposition:
                        </span>
                        <span className="font-bold text-slate-800">
                          {card.totalTurnaroundDays.toFixed(1)} Days Total
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between bg-slate-50 p-1.5 rounded border border-slate-200/60">
                        <span>Discharge: <strong>{card.pureDischargeDays.toFixed(1)}d</strong></span>
                        <span>Tugs/Pilot: <strong>{card.portManeuverBufferDays.toFixed(1)}d</strong></span>
                        <span>Queue: <strong>{card.queueWaitDays.toFixed(1)}d</strong></span>
                      </div>
                    </div>

                    {/* Demurrage / Dispatch Outcome */}
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-slate-500 text-[11px]">Demurrage Exposure:</span>
                      <div className="text-right font-mono text-[11px]">
                        {isBlocked ? (
                          <span className="text-rose-700 font-bold">₹{card.demurrageTotalINR_Lakhs} Lakhs (Detention)</span>
                        ) : card.isLightLoaded ? (
                          <span className="text-amber-800 font-bold">₹{card.demurrageTotalINR_Lakhs} Lakhs (+Tidal Wait)</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">₹{card.demurrageTotalINR_Lakhs} Lakhs (Standard)</span>
                        )}
                      </div>
                    </div>

                    {/* Operational Directive Box */}
                    {isRecommended ? (
                      <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/90 border border-emerald-300 text-[11px] text-emerald-950 space-y-1">
                        <div className="flex items-center space-x-1 font-bold text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Engineering Clearance:</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-slate-600">
                          Full dual-port draft passed. Delivers maximum economies of scale, saving ₹{engineOptimization.demurrageSavedINR_Lakhs} Lakhs demurrage vs suboptimal classes.
                        </p>
                        <div className="text-[10px] font-bold text-emerald-800 bg-white/90 rounded px-1.5 py-0.5 border border-emerald-300">
                          Directive: RECOMMENDED CLASS. Fully compliant with {currentPort.name} gantry cranes and berths.
                        </div>
                      </div>
                    ) : isBlocked ? (
                      <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50/90 border border-rose-300 text-[11px] text-rose-950 space-y-1.5">
                        <div className="flex items-center space-x-1 font-bold text-rose-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Operational Workaround Required:</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-slate-700">
                          Laden draft ({card.ladenDraft}m) exceeds {currentPort.name} standard draft ({currentPort.maxDraftLaden}m). Direct berthing without lightening is restricted.
                        </p>
                        <div className="bg-white/95 rounded p-2 border border-rose-200 text-[10px] text-slate-800 space-y-1">
                          <div className="font-extrabold text-rose-900 uppercase tracking-wider text-[9.5px]">What To Do (Industry Playbook):</div>
                          <div>1. <strong className="text-slate-900">Offshore Lighterage:</strong> Offload ~30k MT into barges at outer anchorage to lighten draft to &lt;16m for high-tide berthing.</div>
                          <div>2. <strong className="text-slate-900">Port Diversion to Dhamra/GPL:</strong> Divert to Dhamra (18m draft) or Gangavaram (19.5m draft) for 100% direct berthing.</div>
                          <div>3. <strong className="text-slate-900">COA Parcel Split:</strong> Charter 2 × Kamsarmax (82k DWT) to berth directly with zero lighterage fees.</div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveTab('portswitcher'); }}
                          className="w-full mt-1 py-1.5 px-2 bg-maritime-800 hover:bg-maritime-900 text-white rounded text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <span>Compare Port Switch Savings (Dhamra / Gangavaram)</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2.5 p-2 rounded-lg bg-cyan-50/80 border border-cyan-200 text-[11px] text-cyan-950 space-y-1">
                        <div className="flex items-center space-x-1 font-bold text-cyan-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>Alternative Feasible Fit:</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-slate-600">
                          Fully compliant with berth draft and LOA. Viable fallback option if larger tonnage is unavailable in the prompt spot market.
                        </p>
                        <div className="text-[10px] font-bold text-cyan-800 bg-white/80 rounded px-1.5 py-0.5 border border-cyan-200">
                          Directive: COMPLIANT SECONDARY CHOICE. Safe pilotage and berth handling guaranteed.
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Bottom Action Strip */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectVessel && onSelectVessel(card.id);
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{isSelected ? 'Current Selection' : `Apply ${card.name.split(' ')[0]} Class`}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === CAPESIZE & LARGE CONSIGNMENT OPERATIONAL PLAYBOOK (SOLVING PARADIP / DRAFT RESTRICTIONS) === */}
      {activeTab === 'optimizer' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 text-slate-900 shadow-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3.5 border-b border-slate-200 gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                <Anchor className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-900">
                    Operational Playbook: Fulfilling Large Orders (150k–180k MT) at {currentPort.name}
                  </h3>
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-black px-2 py-0.5 rounded border border-amber-200 uppercase">
                    Maritime Workaround Matrix
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Direct Capesize berthing draws 18.2m vs {currentPort.name} standard draft ({currentPort.maxDraftLaden}m). Here is how real-world charterers fulfill the volume:
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] font-mono text-slate-500 block">Current Cargo: {activeCargoVolume.toLocaleString()} MT</span>
              <span className="text-xs font-bold text-amber-700">3 Verified Industry Strategies</span>
            </div>
          </div>

          {/* 3 Interactive Strategy Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            
            {/* Strategy 1: Anchorage Lighterage */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col justify-between hover:border-slate-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    Strategy 1: Offshore Lighterage
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 shrink-0 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">Paradip Standard</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Anchorage Transshipment (Lightening)</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                  Capesize anchors at <strong>Paradip Outer Anchorage</strong>. Floating crane barges offload <strong>~25,000–35,000 MT</strong> into daughter barges, reducing draft from <strong>18.2m &rarr; 15.8m</strong>. Vessel then berths directly at KICT Berth 03 on the spring high tide.
                </p>
                <div className="space-y-1.5 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 mb-3 shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Draft Reduction:</span>
                    <span className="font-bold text-emerald-700">18.2m &rarr; 15.8m (Enters Port)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Lighterage Cost:</span>
                    <span className="font-bold text-amber-700">+$3.80/MT (~₹3.2 Cr)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Turnaround Delay:</span>
                    <span className="font-bold text-slate-700">+2.5 Days Anchorage Wait</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] text-slate-500 block mb-1.5">Best when: Coal MUST be unloaded at Paradip berths.</span>
                <button
                  type="button"
                  onClick={() => onSelectVessel && onSelectVessel('capesize')}
                  className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>Select Capesize + Lighterage Model</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Strategy 2: Port Diversion (Dhamra / Gangavaram) */}
            <div className="bg-emerald-50/50 border-2 border-emerald-300 rounded-lg p-4 flex flex-col justify-between hover:border-emerald-400 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                    Strategy 2: Port Diversion (Best ROI)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 shrink-0 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">⚡ ₹3–4 Cr Saved</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Divert to Dhamra (18m) or Gangavaram (19.5m)</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                  Instead of lightering at Paradip, divert 60 NM to <strong>Dhamra Port (18.0m draft)</strong> or <strong>Gangavaram (19.5m draft)</strong>. Capesize berths <strong>100% directly with ZERO lighterage</strong> and 65k–70k TPD fast unloaders, railed directly via ECoR to steel plants.
                </p>
                <div className="space-y-1.5 text-[11px] bg-white p-2.5 rounded-lg border border-emerald-200 mb-3 shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Direct Berth Draft:</span>
                    <span className="font-bold text-emerald-700">18.0m (Dhamra) / 19.5m (GPL)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Demurrage/Lighterage Saved:</span>
                    <span className="font-bold text-emerald-700 font-mono">₹2.80 – ₹4.20 Crore Saved!</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Discharge Speed:</span>
                    <span className="font-bold text-emerald-700">65,000–70,000 TPD (Fast)</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-emerald-200">
                <span className="text-[10px] text-emerald-800 font-medium block mb-1.5">Best when: Charterer wants maximum cost savings & zero delays.</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectPort && onSelectPort('dhamra')}
                    className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>Divert to Dhamra</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPort && onSelectPort('gangavaram')}
                    className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>Divert to GPL</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Strategy 3: Vessel Substitution (Baby Cape or 2x Kamsarmax) */}
            <div className="bg-sky-50/50 border border-sky-200 rounded-lg p-4 flex flex-col justify-between hover:border-sky-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between mb-2 gap-1 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-2 py-0.5 rounded border border-sky-300">
                    Strategy 3: Vessel Substitution
                  </span>
                  <span className="text-[10px] font-bold text-sky-800 shrink-0 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300">Direct Berth</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Charter Baby Cape (115k) or 2 × Kamsarmax (82k)</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                  Replace 1 Capesize with either <strong>Baby Cape (115,000 DWT, 15.1m draft)</strong> for direct high-tide berthing, or contract <strong>2 × Kamsarmax (82,000 DWT, 14.4m draft)</strong>. Both options grant 100% direct berth access at Paradip with ZERO offshore lighterage.
                </p>
                <div className="space-y-1.5 text-[11px] bg-white p-2.5 rounded-lg border border-sky-100 mb-3 shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Baby Cape Berth Fit:</span>
                    <span className="font-bold text-sky-700">15.1m Draft (Fits High Tide)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">2 × Kamsarmax Volume:</span>
                    <span className="font-bold text-emerald-700">160,000 MT (100% Fits 14.5m)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Offshore Lighterage Fee:</span>
                    <span className="font-bold text-emerald-700 font-mono">₹0 (Zero Lighterage Needed)</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-sky-200">
                <span className="text-[10px] text-slate-500 block mb-1.5">Best when: Strictly dedicated to Paradip Port infrastructure.</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectVessel && onSelectVessel('kamsarmax')}
                    className="flex-1 py-1.5 px-2 bg-sky-700 hover:bg-sky-800 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>Use Kamsarmax</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectVessel && onSelectVessel('baby_cape')}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>Use Baby Cape</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* === SIDE-BY-SIDE "WHAT IF I CHOSE WRONG" COMPARISON CARD === */}
      {activeTab === 'optimizer' && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-maritime-800" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                Side-by-Side "What If I Chose Wrong" Cost Delta Comparison
              </h3>
            </div>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded">
              Misallocation Penalty: ₹{penaltyDeltaINRCr} Crores
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* OPTIMAL RECOMMENDED SELECTION */}
            <div className="bg-emerald-50/70 border-2 border-emerald-500 rounded-lg p-3.5 relative shadow-xs">
              <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-xs">
                ⭐ RECOMMENDED VESSEL
              </div>

              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">{recommendedVesselEval.vessel.name}</h4>
                <span className="text-[10px] text-slate-500">({recommendedVesselEval.vessel.dwtRange})</span>
              </div>

              <div className="space-y-1.5 text-xs mt-2 tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-500">Draft Status:</span>
                  <span className="font-bold text-emerald-800">{(!recommendedVesselEval.isLightLoaded && !recommendedVesselEval.blocked) ? '100% Dual-Port Fit' : (recommendedVesselEval.isLightLoaded ? 'Light-loaded' : 'Blocked')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dead-Freight Penalty:</span>
                  <span className="font-bold text-emerald-700">₹{recommendedVesselEval.deadFreightPenaltyINRCr} Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Laytime Economic Outcome:</span>
                  {recommendedVesselEval.isDispatchEarned ? (
                    <span className="font-bold text-emerald-600 flex items-center">
                      <Gift className="w-3 h-3 mr-1" /> +₹{recommendedVesselEval.dispatchBonusINRLakhs} Lakhs Dispatch Reward
                    </span>
                  ) : (
                    <span className="font-bold text-slate-700">₹{recommendedVesselEval.demurrageINRCr} Cr Demurrage</span>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-emerald-200/80 text-[11px] text-emerald-900 font-semibold">
                {recommendedVesselEval.tpdTranslationSentence}
              </div>
            </div>

            {/* MISMATCHED / SUBOPTIMAL SELECTION */}
            <div className="bg-rose-50/60 border border-rose-300 rounded-lg p-3.5 relative">
              <div className="absolute -top-2.5 right-3 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-xs">
                ❌ MISMATCHED SELECTION
              </div>

              <div className="flex items-center space-x-2 mb-1">
                <XCircle className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-bold text-slate-900">{mismatchedVesselEval.vessel.name}</h4>
                <span className="text-[10px] text-slate-500">({mismatchedVesselEval.vessel.dwtRange})</span>
              </div>

              <div className="space-y-1.5 text-xs mt-2 tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-500">Draft Status:</span>
                  <span className="font-bold text-rose-700">{mismatchedVesselEval.blocked ? 'Draft Insufficient (Blocked)' : 'Severe Light-Loading'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dead-Freight Penalty:</span>
                  <span className="font-bold text-rose-700">₹{mismatchedVesselEval.deadFreightPenaltyINRCr} Cr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Demurrage Exposure:</span>
                  <span className="font-bold text-rose-700">₹{mismatchedVesselEval.demurrageINRCr} Cr</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-rose-200/80 text-[11px] text-rose-900 font-semibold">
                Choosing this causes a <strong className="text-rose-700">₹{penaltyDeltaINRCr} Cr financial loss</strong> due to port draft barriers & unloader delays.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* === TAB 1: VESSEL MATCH LIST === */}
      {activeTab === 'optimizer' && (
        <div>
          {/* LIVE AIS MODE TOGGLE & DROPDOWN */}
          <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Radio className={`w-4 h-4 ${isLiveAisMode ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                <span className="text-sm font-bold text-slate-800">Live AIS Telemetry Ingestion</span>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isLiveAisMode} onChange={(e) => setIsLiveAisMode(e.target.checked)} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isLiveAisMode ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isLiveAisMode ? 'translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
            
            {isLiveAisMode && (
              <div className="animate-in slide-in-from-top-2 duration-200 mt-3 pt-3 border-t border-slate-200">
                <div className="flex gap-3 mb-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select Destination Port</label>
                    <select 
                      className="w-full text-sm p-2 border border-slate-200 rounded-md bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedDestination}
                      onChange={(e) => onPortSwitch(e.target.value)}
                    >
                      <option value="paradip">Paradip Port (PPT)</option>
                      <option value="vizag">Visakhapatnam (VPT)</option>
                      <option value="gangavaram">Gangavaram Port</option>
                      <option value="dhamra">Dhamra Port</option>
                      <option value="haldia">Haldia Dock Complex (HDC)</option>
                      <option value="gopalpur">Gopalpur Port</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Select Inbound Vessel</label>
                    <select 
                      className="w-full text-sm p-2 border border-blue-200 rounded-md bg-blue-50/30 text-blue-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                      value={selectedLiveShipMmsi}
                      onChange={(e) => setSelectedLiveShipMmsi(e.target.value)}
                    >
                      {inboundShips.length > 0 ? inboundShips.map(ship => (
                        <option key={ship.mmsi} value={ship.mmsi}>
                          {ship.name} ({ship.vesselType}) — ETA: {ship.etaHours}h
                        </option>
                      )) : <option value="">No vessels en route</option>}
                    </select>
                  </div>
                </div>
                
                {/* Live Signal Engine Panel */}
                {activeLiveShip && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {/* Congestion & ETA Alert */}
                    {(() => {
                      const waitDays = liveCurrent.waitDays;
                      const etaDays = activeLiveShip.etaHours / 24;
                      const arrivesEarly = etaDays < waitDays;
                      
                      // Check active weather alerts
                      const weatherAlerts = IMD_WEATHER_ALERTS.filter(alert => alert.affectedPorts.some(p => p.toLowerCase().includes(currentPort.name.toLowerCase().split(' ')[0])));
                      const hasSevereWeather = weatherAlerts.length > 0;
                      const isDraftBlocked = activeLiveShip.currentDraughtMeters > currentPort.maxDraftLaden;
                      
                      const requiresPortSwitch = hasSevereWeather || isDraftBlocked;
                      
                      return (
                        <>
                          <div className={`p-3 rounded-md border text-xs ${arrivesEarly ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                            <div className="font-bold flex items-center mb-1">
                              {arrivesEarly ? <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />}
                              {arrivesEarly ? 'YELLOW ALERT: Early Arrival' : 'GREEN: On Schedule'}
                            </div>
                            <div className="text-slate-600 mb-1">ETA: {etaDays.toFixed(1)} days | Queue Wait: {waitDays} days</div>
                            <div className={`font-semibold ${arrivesEarly ? 'text-amber-800' : 'text-emerald-800'}`}>
                              {arrivesEarly 
                                ? 'SUGGESTION: Sail Slow (Eco-Speed) to save bunker fuel; berth is occupied.' 
                                : 'SUGGESTION: Maintain service speed; berth slot is aligned.'}
                            </div>
                          </div>
                          
                          {/* Weather Alert */}
                          <div className={`p-3 rounded-md border text-xs ${hasSevereWeather ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="font-bold flex items-center mb-1">
                              {hasSevereWeather ? <Activity className="w-3.5 h-3.5 mr-1 text-rose-600" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-slate-500" />}
                              {hasSevereWeather ? 'IMD METEOROLOGICAL ALERT' : 'Clear Weather'}
                            </div>
                            {hasSevereWeather ? (
                              <>
                                <div className="text-slate-600 mb-1">{weatherAlerts[0].category} ({weatherAlerts[0].windSpeedKnots} kts)</div>
                                <div className="font-semibold text-rose-800">{weatherAlerts[0].recommendation}</div>
                              </>
                            ) : (
                              <div className="text-slate-500">No active cyclone or squall warnings for {currentPort.name}.</div>
                            )}
                          </div>
                          
                          {/* Tide & Draft Constraint */}
                          <div className={`p-3 rounded-md border text-xs ${isDraftBlocked ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                            <div className="font-bold flex items-center mb-1">
                              <Anchor className={`w-3.5 h-3.5 mr-1 ${isDraftBlocked ? 'text-rose-600' : 'text-emerald-600'}`} />
                              Tide & Draft Constraint
                            </div>
                            <div className="text-slate-600 mb-1">Vessel Draft: {activeLiveShip.currentDraughtMeters}m | Port Max: {currentPort.maxDraftLaden}m</div>
                            <div className={`font-semibold ${isDraftBlocked ? 'text-rose-800' : 'text-emerald-800'}`}>
                              {isDraftBlocked ? 'BLOCKED: Vessel exceeds safe navigable draft limit.' : 'CLEAR: Safe passage on current tide window.'}
                            </div>
                          </div>
                          
                          {/* Freight Trend & Final Operational Decision */}
                          <div className={`p-3 rounded-md border text-xs ${requiresPortSwitch ? 'bg-rose-900 border-rose-700 text-rose-100' : 'bg-indigo-900 border-indigo-700 text-indigo-100'}`}>
                            <div className="font-bold flex items-center mb-1 uppercase tracking-wider text-[10px] text-indigo-300">
                              <Activity className="w-3 h-3 mr-1" />
                              Operational Directive (Spot vs COA: -$3.40/MT)
                            </div>
                            <div className="text-sm font-bold mt-1">
                              {requiresPortSwitch ? (
                                <span className="text-rose-300 flex items-center"><AlertTriangle className="w-4 h-4 mr-1" /> INITIATE PORT SWITCH</span>
                              ) : (
                                <span className="text-emerald-400 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> PROCEED TO {currentPort.name.split(' ')[0]}</span>
                              )}
                            </div>
                            <div className="mt-1 opacity-80">
                              {requiresPortSwitch 
                                ? `Redirect to Gangavaram or Dhamra to avoid ${hasSevereWeather ? 'cyclone risks' : 'draft penalties'}.` 
                                : 'Conditions optimal. Lock in current freight rates and proceed.'}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* INCOIS API Live Feed Mock Widget */}
          {incoisData && (
            <div className="mb-4 rounded-md border border-sky-200 bg-sky-50/50 overflow-hidden text-xs">
              <div className="bg-sky-100 text-sky-800 px-3 py-1.5 font-black uppercase tracking-wider flex items-center justify-between border-b border-sky-200">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                  INCOIS LIVE OCEAN-MET FEED — {currentPort.name}
                </div>
                <div className="text-[10px] text-sky-600 font-semibold flex items-center">
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoadingIncois ? 'animate-spin' : ''}`} />
                  Updated: {new Date(incoisData.meta.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-slate-500 mb-0.5 text-[10px] uppercase font-bold tracking-wide">Tide State</div>
                  <div className={`font-black text-sm flex items-center ${incoisData.oceanographic.tideState.includes('FLOODING') ? 'text-sky-700' : 'text-amber-700'}`}>
                    {incoisData.oceanographic.tideIndicator} {incoisData.oceanographic.tideState}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5 text-[10px] uppercase font-bold tracking-wide">Live Draft Limit</div>
                  <div className="font-black text-sm text-sky-900">
                    {incoisData.oceanographic.livePermissibleDraft.toFixed(2)}m <span className="text-sky-500 font-medium text-[11px]">({incoisData.oceanographic.currentTideHeight > 0 ? '+' : ''}{incoisData.oceanographic.currentTideHeight.toFixed(2)}m tide)</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5 text-[10px] uppercase font-bold tracking-wide">Next High Water</div>
                  <div className="font-bold text-slate-800 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {incoisData.oceanographic.nextHighWaterTime} ({incoisData.oceanographic.nextHighWaterDraft.toFixed(2)}m)
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5 text-[10px] uppercase font-bold tracking-wide">Met / Wind</div>
                  <div className="font-bold text-slate-800">
                    {incoisData.meteorological.windDirection} at {incoisData.meteorological.windSpeedKnots} kts, Swell: {incoisData.meteorological.swellCondition}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Port Status Bar */}
          {liveCurrent && currentPort && (
            <div className={`mb-4 rounded-md border p-3 text-xs flex flex-wrap gap-4 items-center ${
              liveCurrent.waitDays > 3.5 ? 'bg-red-50 border-red-200' :
              liveCurrent.waitDays > 2 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div>
                <span className="text-slate-500">Port:</span>{' '}
                <span className="font-bold text-slate-800">{currentPort.name}</span>
              </div>
              <div>
                <span className="text-slate-500">Actual TPD:</span>{' '}
                <span className="font-bold text-slate-800">{liveCurrent.actualTPD.toLocaleString()}</span>
                <span className="text-slate-400"> / rated {liveCurrent.ratedTPD.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Queue:</span>{' '}
                <span className="font-bold text-slate-800">{liveCurrent.queueVessels} vessels</span>
                <span className="text-slate-400"> • {liveCurrent.waitDays}d avg wait</span>
              </div>
              <div>
                <span className="text-slate-500">Available berth-days (30d):</span>{' '}
                <span className={`font-bold ${liveCurrent.berthAvailDays < 8 ? 'text-red-700' : 'text-emerald-700'}`}>
                  {liveCurrent.berthAvailDays} days
                </span>
              </div>
            </div>
          )}

          {/* Vessel Evaluation Cards */}
          <div className="space-y-3">
            {vesselEvals.map((item) => {
              const isActive = currentVesselId === item.vessel.id;
              const isRecommended = recommendedVesselEval.vessel.id === item.vessel.id;
              const VerdictIcon = item.verdictBadge.icon;

              return (
                <div
                  key={item.vessel.id}
                  onClick={() => !item.blocked && onSelectVessel(item.vessel.id)}
                  className={`rounded-lg border p-4 transition-all cursor-pointer ${
                    isRecommended ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' :
                    isActive ? 'border-maritime-800 bg-maritime-50/60 shadow-xs' :
                    item.blocked ? 'border-red-200 bg-red-50/40 opacity-75' :
                    'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Traffic Light Verdict Badge Banner */}
                  <div className={`rounded-md px-3 py-1.5 text-xs font-extrabold flex items-center justify-between border mb-3 ${item.verdictBadge.cls}`}>
                    <div className="flex items-center space-x-2">
                      <VerdictIcon className="w-4 h-4 shrink-0" />
                      <span>{item.verdictBadge.text}</span>
                    </div>
                    {isRecommended && (
                      <span className="bg-emerald-700 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shrink-0">
                        ⭐ AUTO-RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-maritime-100 flex items-center justify-center shrink-0 mt-0.5">
                        <Ship className="w-4 h-4 text-maritime-800" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-bold text-slate-800">{item.vessel.name}</h3>
                          <span className="text-xs text-slate-400">{item.vessel.dwtRange}</span>
                          {item.isDispatchEarned && (
                            <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded border border-emerald-300 flex items-center">
                              <Gift className="w-3 h-3 mr-0.5" /> Dispatch Eligible
                            </span>
                          )}
                        </div>

                        {/* TPD to Dollars, Demurrage & Dispatch Translation */}
                        <div className="mt-1 text-xs text-slate-600 font-semibold bg-slate-100/70 rounded p-1.5 border border-slate-200/60">
                          {item.tpdTranslationSentence}
                        </div>

                        {/* Physical Engineering Specs & Official Limits Strip */}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px]">
                          <span className={`px-2 py-0.5 rounded font-mono font-semibold ${item.loaClear ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            LOA: {item.vessel.loaM}m (Port Max: {currentPort.maxLOA}m)
                          </span>
                          <span className={`px-2 py-0.5 rounded font-mono font-semibold ${item.beamClear ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            Beam: {item.vessel.beamM}m (Port Max: {currentPort.maxBeam}m)
                          </span>
                          <span className={`px-2 py-0.5 rounded font-mono font-semibold ${item.destDraftOk ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                            Draft: {item.vessel.ladenDraft}m (Origin: {currentOrigin.maxDraftLaden}m | Dest: {currentPort.maxDraftLaden}m)
                          </span>
                          <span className="px-2 py-0.5 rounded font-mono text-slate-700 bg-slate-100 border border-slate-200">
                            Handling: {item.originLoadingRateTPD.toLocaleString()} Load ({item.loadingDays}d) + {item.destDischargeRateTPD.toLocaleString()} Disch ({item.dischargeDays}d)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs text-slate-400">Match Score</div>
                      <div className={`text-base font-black ${item.score >= 80 ? 'text-emerald-600' : item.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {item.score} / 100
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === TAB 2: DUAL-PORT FIT & OFFICIAL LIMITS (ENGINEERING GAUGES & COMPLETE MATRIX) === */}
      {activeTab === 'constraints' && (
        <div className="space-y-6">
          {/* Top Control Bar: Select Origin, Vessel, and Destination */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                  <Ruler className="w-4 h-4 text-maritime-800" />
                  <span>Dual-Port Engineering Limits & Clearance Gauges</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    Official Port Authority Data
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real official maximum LOA, beam, draft limits, and cargo handling rates across Australian, US, Mozambique, Indonesian origins and Indian East Coast discharge terminals.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-500 block">Active Parcel: {activeCargoVolume.toLocaleString()} MT</span>
                <span className="text-xs font-bold text-emerald-700">Fit Score: {activeVesselEval.score}/100</span>
              </div>
            </div>

            {/* Selector Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  1. Loading Origin Port ({currentOrigin.country})
                </label>
                <select
                  value={selectedOrigin}
                  onChange={(e) => onSelectOrigin && onSelectOrigin(e.target.value)}
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-maritime-500 outline-none"
                >
                  <optgroup label="Australia">
                    <option value="hay_point">Hay Point / DBCT (QLD) — LOA 343m, 85k TPD</option>
                    <option value="gladstone">Gladstone RGCT (QLD) — LOA 315m, 75k TPD</option>
                    <option value="newcastle">Newcastle PWCS/NCIG (NSW) — LOA 300m, 80k TPD</option>
                    <option value="abbot_point">Abbot Point / NQXT (QLD) — LOA 330m, 80k TPD</option>
                    <option value="port_kembla">Port Kembla PKCT (NSW) — LOA 315m, 55k TPD</option>
                  </optgroup>
                  <optgroup label="United States">
                    <option value="hampton_roads">Hampton Roads / Norfolk (VA) — LOA 305m, 65k TPD</option>
                    <option value="baltimore">Baltimore Consol CNX (MD) — LOA 305m, 50k TPD</option>
                    <option value="mobile">Mobile McDuffie (AL) — LOA 290m, 45k TPD</option>
                    <option value="new_orleans">New Orleans Convent (LA) — LOA 300m, 50k TPD</option>
                  </optgroup>
                  <optgroup label="Mozambique">
                    <option value="maputo">Maputo / Matola TCM — LOA 275m, 40k TPD</option>
                    <option value="beira">Beira Coal Terminal — LOA 200m, 22k TPD</option>
                    <option value="nacala">Nacala-a-Velha Deepwater — LOA 340m, 65k TPD</option>
                  </optgroup>
                  <optgroup label="Indonesia">
                    <option value="samarinda">Muara Berau / Samarinda — LOA 280m, 35k TPD</option>
                    <option value="taboneo">Taboneo Anchorage — LOA 330m, 50k TPD</option>
                    <option value="bunati">Bunati Port & Anchorage — LOA 260m, 32k TPD</option>
                    <option value="tanjung_bara">Tanjung Bara TBCT / KPC — LOA 310m, 60k TPD</option>
                    <option value="balikpapan">Balikpapan BCT — LOA 280m, 45k TPD</option>
                  </optgroup>
                  <optgroup label="Global Hubs">
                    <option value="vostochny">Port of Vostochny (Russia) — LOA 300m, 70k TPD</option>
                    <option value="tubarao">Tubarao (Brazil) — LOA 350m, 90k TPD</option>
                    <option value="richards_bay">Richards Bay (South Africa) — LOA 350m, 85k TPD</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  2. Candidate Vessel Class
                </label>
                <select
                  value={currentVesselId}
                  onChange={(e) => onSelectVessel && onSelectVessel(e.target.value)}
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-maritime-500 outline-none"
                >
                  {VESSEL_CLASSES.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.dwtRange}) — Draft {v.ladenDraft}m, Beam {v.beamM}m
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  3. Indian East Coast Discharge Port
                </label>
                <select
                  value={selectedDestination}
                  onChange={(e) => onSelectPort && onSelectPort(e.target.value)}
                  className="w-full text-xs font-semibold p-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-maritime-500 outline-none"
                >
                  {ALL_CANDIDATE_PORTS.map(pid => {
                    const p = INDIAN_EAST_COAST_PORTS[pid];
                    return (
                      <option key={pid} value={pid}>
                        {p.name} — Draft {p.maxDraftLaden}m, Beam {p.maxBeam}m, {p.handlingRateTPD.toLocaleString()} TPD
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Three-Card Architecture: Origin vs Vessel vs Destination */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Origin Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                    Loading Origin Port
                  </span>
                  <span className="text-xs font-bold text-slate-600">{currentOrigin.country}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{currentOrigin.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{currentOrigin.region}</p>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Max LOA:</span>
                    <span className="font-mono font-bold text-slate-800">{currentOrigin.maxLOA} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Max Beam:</span>
                    <span className="font-mono font-bold text-slate-800">{currentOrigin.maxBeam} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Max Laden Draft:</span>
                    <span className="font-mono font-bold text-slate-800">{currentOrigin.maxDraftLaden} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Handling Speed:</span>
                    <span className="font-mono font-bold text-blue-700">{currentOrigin.handlingRateTPD.toLocaleString()} TPD</span>
                  </div>
                  {currentOrigin.shiploaderRateTPH && (
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-500">Shiploader Rate:</span>
                      <span className="font-mono font-bold text-slate-700">{currentOrigin.shiploaderRateTPH.toLocaleString()} TPH</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Sea Distance:</span>
                    <span className="font-mono font-bold text-slate-700">{currentOrigin.distanceToEastCoastNM.toLocaleString()} NM (~{currentOrigin.transitDaysAverage}d)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] text-slate-400 italic">
                {currentOrigin.officialSource}
              </div>
            </div>

            {/* Vessel Card */}
            <div className="bg-white border-2 border-emerald-400/80 rounded-xl p-4 flex flex-col justify-between shadow-2xs text-slate-800">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                    Vessel In-Transit
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700">{activeVesselEval.score}/100 Fit</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{activeVesselEval.vessel.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{activeVesselEval.vessel.dwtRange}</p>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">LOA:</span>
                    <span className="font-mono font-bold text-slate-800">{activeVesselEval.vessel.loaM} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Beam:</span>
                    <span className="font-mono font-bold text-slate-800">{activeVesselEval.vessel.beamM} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Laden Draft:</span>
                    <span className="font-mono font-bold text-slate-800">{activeVesselEval.vessel.ladenDraft} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Typical Parcel:</span>
                    <span className="font-mono font-bold text-emerald-700">{activeVesselEval.vessel.typicalParcel.toLocaleString()} MT</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Origin Loading Days:</span>
                    <span className="font-mono font-bold text-sky-700">{activeVesselEval.loadingDays} days</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Dest Discharge Days:</span>
                    <span className="font-mono font-bold text-sky-700">{activeVesselEval.dischargeDays} days</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-semibold">
                {activeVesselEval.verdictBadge.text}
              </div>
            </div>

            {/* Destination Card */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                    Discharge Destination Port
                  </span>
                  <span className="text-xs font-bold text-slate-600">{currentPort.state}</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">{currentPort.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Indian East Coast Maritime Gateway</p>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Max LOA:</span>
                    <span className="font-mono font-bold text-slate-800">{currentPort.maxLOA} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Max Beam:</span>
                    <span className="font-mono font-bold text-slate-800">{currentPort.maxBeam} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Standard Draft:</span>
                    <span className="font-mono font-bold text-slate-800">{currentPort.maxDraftLaden} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">High Tide Spring Draft:</span>
                    <span className="font-mono font-bold text-purple-700">{currentPort.maxDraftHighTide} meters</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Discharge Speed:</span>
                    <span className="font-mono font-bold text-purple-700">{currentPort.handlingRateTPD.toLocaleString()} TPD</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Avg Berth Queue:</span>
                    <span className="font-mono font-bold text-slate-700">{liveCurrent.waitDays} days ({liveCurrent.queueVessels} vessels)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2 text-[10px] text-slate-400 italic">
                {currentPort.officialSource}
              </div>
            </div>
          </div>

          {/* 4 Physical Clearance Gauges & Engineering Margins */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. LOA Clearance Gauge */}
            <div className="bg-white border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">1. LOA Clearance</span>
                <Ruler className="w-4 h-4 text-maritime-700" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {activeVesselEval.vessel.loaM}m LOA
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Margin:</span>
                  <span className={`font-mono font-bold ${activeVesselEval.originLoaMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {activeVesselEval.originLoaMargin >= 0 ? `+${activeVesselEval.originLoaMargin}m` : `${activeVesselEval.originLoaMargin}m`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dest Margin:</span>
                  <span className={`font-mono font-bold ${activeVesselEval.destLoaMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {activeVesselEval.destLoaMargin >= 0 ? `+${activeVesselEval.destLoaMargin}m` : `${activeVesselEval.destLoaMargin}m`}
                  </span>
                </div>
              </div>
              <div className={`mt-3 text-[11px] p-1.5 rounded font-semibold text-center border ${
                activeVesselEval.loaClear ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {activeVesselEval.loaClear ? '✅ Berth Length Cleared' : '❌ LOA Exceeded Berth Pocket'}
              </div>
            </div>

            {/* 2. Beam Clearance Gauge */}
            <div className="bg-white border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">2. Beam & Lock Gate</span>
                <Layers className="w-4 h-4 text-maritime-700" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {activeVesselEval.vessel.beamM}m Beam
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Margin:</span>
                  <span className={`font-mono font-bold ${activeVesselEval.originBeamMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {activeVesselEval.originBeamMargin >= 0 ? `+${activeVesselEval.originBeamMargin}m` : `${activeVesselEval.originBeamMargin}m`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dest Margin:</span>
                  <span className={`font-mono font-bold ${activeVesselEval.destBeamMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {activeVesselEval.destBeamMargin >= 0 ? `+${activeVesselEval.destBeamMargin}m` : `${activeVesselEval.destBeamMargin}m`}
                  </span>
                </div>
              </div>
              <div className={`mt-3 text-[11px] p-1.5 rounded font-semibold text-center border ${
                activeVesselEval.beamClear ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {activeVesselEval.beamClear ? '✅ Lock & Berth Passed' : '❌ Beam Exceeds Lock / Berth'}
              </div>
            </div>

            {/* 3. Draft & UKC Clearance */}
            <div className="bg-white border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">3. Draft & Under-Keel</span>
                <Anchor className="w-4 h-4 text-maritime-700" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {activeVesselEval.vessel.ladenDraft}m Laden
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin UKC Margin:</span>
                  <span className={`font-mono font-bold ${activeVesselEval.originDraftMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {activeVesselEval.originDraftMargin >= 0 ? `+${activeVesselEval.originDraftMargin}m` : `${activeVesselEval.originDraftMargin}m`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dest Tide Margin:</span>
                  <span className={`font-mono font-bold ${activeVesselEval.destTideDraftMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {activeVesselEval.destTideDraftMargin >= 0 ? `+${activeVesselEval.destTideDraftMargin}m` : `${activeVesselEval.destTideDraftMargin}m`}
                  </span>
                </div>
              </div>
              <div className={`mt-3 text-[11px] p-1.5 rounded font-semibold text-center border ${
                activeVesselEval.destDraftClear ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                activeVesselEval.destDraftTide ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200'
              }`}>
                {activeVesselEval.destDraftClear ? '✅ 100% Direct Berth' :
                 activeVesselEval.destDraftTide ? '⚠️ High-Tide Window Only' : '❌ Draft Restricted / Grounding'}
              </div>
            </div>

            {/* 4. Handling & Laytime Economics */}
            <div className="bg-white border rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">4. Laytime & Handling</span>
                <Clock className="w-4 h-4 text-maritime-700" />
              </div>
              <div className="text-lg font-black text-slate-900">
                {activeVesselEval.loadingDays + activeVesselEval.dischargeDays}d Port Time
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Loading:</span>
                  <span className="font-mono font-bold text-slate-800">{activeVesselEval.loadingDays}d ({currentOrigin.handlingRateTPD.toLocaleString()} TPD)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dest Discharge:</span>
                  <span className="font-mono font-bold text-slate-800">{activeVesselEval.dischargeDays}d ({currentPort.handlingRateTPD.toLocaleString()} TPD)</span>
                </div>
              </div>
              <div className={`mt-3 text-[11px] p-1.5 rounded font-semibold text-center border ${
                activeVesselEval.isDispatchEarned ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                activeVesselEval.demurrageINRCr === 0 ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {activeVesselEval.isDispatchEarned ? `🎉 +₹${activeVesselEval.dispatchBonusINRLakhs}L Dispatch Credit` :
                 activeVesselEval.demurrageINRCr === 0 ? '✅ Within Laytime Allowance' : `⚠️ ₹${activeVesselEval.demurrageINRCr} Cr Demurrage`}
              </div>
            </div>
          </div>

          {/* Complete 7-Class Candidate Vessel Engineering Matrix Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Ship className="w-4 h-4 text-maritime-800" />
                  <span>Full 7-Class Vessel Technical Comparison for {currentOrigin.name} ➔ {currentPort.name}</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Comprehensive clearance evaluation across LOA, beam, draft limits, and two-way turnaround economics.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Parcel Size: {activeCargoVolume.toLocaleString()} MT
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Vessel Class</th>
                    <th className="p-3">DWT Range</th>
                    <th className="p-3">LOA & Fit</th>
                    <th className="p-3">Beam & Lock</th>
                    <th className="p-3">Laden Draft & Clearance</th>
                    <th className="p-3">Origin Load (@ TPD)</th>
                    <th className="p-3">Dest Disch (@ TPD)</th>
                    <th className="p-3">Economic Outcome</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {vesselEvals.map((item) => {
                    const isSelected = currentVesselId === item.vessel.id;
                    const isRec = recommendedVesselEval.vessel.id === item.vessel.id;
                    return (
                      <tr key={item.vessel.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-maritime-50/40' : ''}`}>
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                          {isRec && <span className="text-emerald-600 font-black">⭐</span>}
                          <span>{item.vessel.name}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-600 text-[11px]">{item.vessel.dwtRange}</td>
                        <td className="p-3 font-mono text-[11px]">
                          <span className={item.loaClear ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                            {item.vessel.loaM}m {item.loaClear ? '✓' : `✗ (> ${Math.min(currentOrigin.maxLOA, currentPort.maxLOA)}m)`}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <span className={item.beamClear ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                            {item.vessel.beamM}m {item.beamClear ? '✓' : `✗ (> ${Math.min(currentOrigin.maxBeam, currentPort.maxBeam)}m)`}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px]">
                          <span className={item.destDraftOk && item.originDraftClear ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                            {item.vessel.ladenDraft}m {item.destDraftOk && item.originDraftClear ? '✓ Safe' : '✗ Exceeds Draft'}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] font-mono text-slate-700">
                          {item.loadingDays}d ({currentOrigin.handlingRateTPD.toLocaleString()} TPD)
                        </td>
                        <td className="p-3 text-[11px] font-mono text-slate-700">
                          {item.dischargeDays}d ({currentPort.handlingRateTPD.toLocaleString()} TPD)
                        </td>
                        <td className="p-3 text-[11px]">
                          {item.isDispatchEarned ? (
                            <span className="font-bold text-emerald-600">+₹{item.dispatchBonusINRLakhs}L Dispatch</span>
                          ) : item.demurrageINRCr > 0 ? (
                            <span className="font-bold text-rose-700">₹{item.demurrageINRCr} Cr Demurrage</span>
                          ) : (
                            <span className="font-semibold text-slate-600">Laytime Matched</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectVessel && onSelectVessel(item.vessel.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${
                              isSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Gazette Citations Banner */}
          <div className="bg-white text-slate-900 rounded-xl p-4 text-xs space-y-2 border border-slate-200 shadow-sm">
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Regulatory & Gazette Authority Citations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-700">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">Loading Origin Gazette:</span>
                <p className="italic text-slate-600">{currentOrigin.officialSource}</p>
                <div className="mt-1 text-[10px] text-slate-500 font-mono">
                  Berth Pocket: {currentOrigin.berthDetails}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">Discharge Destination Gazette:</span>
                <p className="italic text-slate-600">{currentPort.officialSource}</p>
                <div className="mt-1 text-[10px] text-slate-500 font-mono">
                  Infrastructure: Standard draft {currentPort.maxDraftLaden}m, Spring tide {currentPort.maxDraftHighTide}m, LOA {currentPort.maxLOA}m, Beam {currentPort.maxBeam}m.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === TAB 3: LOADING PORTS HUB (AUSTRALIA • USA • MOZAMBIQUE • INDONESIA • GLOBAL) === */}
      {activeTab === 'loading_ports' && (
        <div className="space-y-5">
          {/* Header & Region Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <Globe className="w-4 h-4 text-maritime-800" />
                <span>Global Loading Ports Hub: Official Marine Specifications</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Authentic technical limits (LOA, Beam, Draft, TPD, TPH) for bulk coal loading terminals in Australia, United States, Mozambique, Indonesia, and global hubs.
              </p>
            </div>

            {/* Region Filter Buttons */}
            <div className="flex flex-wrap gap-1.5 text-xs">
              {[
                { id: 'ALL', label: 'All Origins' },
                { id: 'AUSTRALIA', label: '🇦🇺 Australia (5)' },
                { id: 'USA', label: '🇺🇸 United States (4)' },
                { id: 'MOZAMBIQUE', label: '🇲🇿 Mozambique (3)' },
                { id: 'INDONESIA', label: '🇮🇩 Indonesia (5)' },
                { id: 'GLOBAL', label: '🌐 Global (3)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedLoadingRegion(tab.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                    selectedLoadingRegion === tab.id
                      ? 'bg-maritime-800 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Loading Port Quick Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
              <span>
                Currently Selected Loading Origin: <strong className="font-bold">{currentOrigin.name}</strong> ({currentOrigin.country}) — Max LOA {currentOrigin.maxLOA}m, Beam {currentOrigin.maxBeam}m, Draft {currentOrigin.maxDraftLaden}m, Handling {currentOrigin.handlingRateTPD.toLocaleString()} TPD.
              </span>
            </div>
            <span className="text-[11px] font-mono text-blue-800 font-bold shrink-0">
              Voyage: {currentOrigin.distanceToEastCoastNM.toLocaleString()} NM (~{currentOrigin.transitDaysAverage} days)
            </span>
          </div>

          {/* Grid of Loading Port Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLoadingPorts.map((port) => {
              const isSelected = selectedOrigin === port.id;
              return (
                <div
                  key={port.id}
                  className={`rounded-xl border-2 transition-all p-4 flex flex-col justify-between shadow-xs hover:shadow-md ${
                    isSelected ? 'border-maritime-700 bg-white ring-2 ring-maritime-600/20' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {port.country}
                      </span>
                      {isSelected && (
                        <span className="bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                          ACTIVE ORIGIN
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{port.name}</h4>
                    <p className="text-[11px] text-slate-500 mb-3">{port.region}</p>

                    {/* Technical Limits 4-Cell Matrix */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200/70">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Max LOA</span>
                        <span className="font-mono font-bold text-slate-900">{port.maxLOA} meters</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200/70">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Max Beam</span>
                        <span className="font-mono font-bold text-slate-900">{port.maxBeam} meters</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200/70">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Laden Draft</span>
                        <span className="font-mono font-bold text-emerald-700">{port.maxDraftLaden} meters</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200/70">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Max DWT</span>
                        <span className="font-mono font-bold text-slate-900">{port.maxDWT.toLocaleString()} DWT</span>
                      </div>
                    </div>

                    {/* Handling Velocity & Shiploader */}
                    <div className="space-y-1.5 text-xs bg-slate-50/60 p-2.5 rounded-lg border border-slate-200/80 mb-3 font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans text-[11px]">Loading Rate (TPD):</span>
                        <span className="font-bold text-blue-700">{port.handlingRateTPD.toLocaleString()} TPD</span>
                      </div>
                      {port.shiploaderRateTPH && (
                        <div className="flex justify-between">
                          <span className="text-slate-500 font-sans text-[11px]">Shiploader Speed:</span>
                          <span className="font-bold text-slate-800">{port.shiploaderRateTPH.toLocaleString()} TPH</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans text-[11px]">Transit to East Coast:</span>
                        <span className="font-bold text-slate-800">{port.distanceToEastCoastNM.toLocaleString()} NM (~{port.transitDaysAverage}d)</span>
                      </div>
                    </div>

                    {/* Primary Cargoes */}
                    <div className="mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Exported Cargoes:</span>
                      <div className="flex flex-wrap gap-1">
                        {(port.primaryCargoes || [port.primaryCargo]).map((cargo, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {cargo}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Berth Details */}
                    <p className="text-[10.5px] text-slate-600 leading-tight mb-2">
                      {port.berthDetails}
                    </p>

                    {/* Official Gazette Reference */}
                    <div className="text-[10px] text-slate-400 italic border-t border-slate-100 pt-2 mb-3">
                      📜 Source: {port.officialSource}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectOrigin) onSelectOrigin(port.id);
                    }}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-maritime-800 hover:bg-maritime-900 text-white shadow-xs'
                    }`}
                  >
                    <span>{isSelected ? '✓ Current Loading Origin' : 'Select as Loading Origin'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === TAB 4: PORT SWITCH ADVISOR === */}
      {activeTab === 'portswitcher' && (
        <div className="space-y-3">
          <div className="bg-maritime-50 border border-maritime-200 rounded-md p-3 text-xs text-maritime-900">
            <span className="font-bold">Port Switch Advisory for {activeVesselObj.name}:</span> Below is the score and demurrage exposure for every East Coast port if you deploy a {activeVesselObj.name} ({activeVesselObj.dwtRange}).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {portComparisons.map((item) => {
              const isCurrent = item.portId === selectedDestination;
              return (
                <div
                  key={item.portId}
                  onClick={() => onSelectPort(item.portId)}
                  className={`rounded-lg border p-3.5 cursor-pointer transition-all ${
                    isCurrent ? 'border-maritime-800 bg-maritime-50/70 shadow-sm' :
                    item.blocked ? 'border-red-200 bg-red-50/30 opacity-70' :
                    'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{item.port.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.blocked ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.blocked ? 'BLOCKED' : `${item.score}/100 SCORE`}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight mt-1">
                    {item.tpdTranslationSentence}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
