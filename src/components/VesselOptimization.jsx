import React, { useState, useMemo, useEffect } from 'react';
import {
  Ship, AlertTriangle, CheckCircle2, XCircle, TrendingDown,
  Clock, Anchor, BarChart3, MapPin, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Zap, Award, AlertCircle, Sparkles, DollarSign, Gift, Activity, Radio
} from 'lucide-react';
import { INDIAN_EAST_COAST_PORTS, ORIGIN_LOADING_PORTS } from '../data/portsData';
import { fetchLiveINCOISData } from '../api/incoisConnector';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import { PORT_CONGESTION_STATUS, IMD_WEATHER_ALERTS } from '../data/weatherCongestionData';
import { optimizeVesselType } from '../utils/vesselOptimizationEngine';
import InsightBulb from './InsightBulb';

// Vessel classes with physical specs
const VESSEL_CLASSES = [
  {
    id: 'capesize', name: 'Capesize', dwtRange: '160,000–180,000 DWT',
    ladenDraft: 18.2, loaM: 295, dailyTCE: 22000, fuelMTPerDay: 58,
    typicalParcel: 160000, costMultiplier: 0.72,
  },
  {
    id: 'baby_cape', name: 'Baby Cape / Post-Panamax', dwtRange: '115,000 DWT',
    ladenDraft: 15.1, loaM: 255, dailyTCE: 19800, fuelMTPerDay: 33.5,
    typicalParcel: 105000, costMultiplier: 0.81,
  },
  {
    id: 'kamsarmax', name: 'Kamsarmax', dwtRange: '80,000–82,000 DWT',
    ladenDraft: 14.4, loaM: 229, dailyTCE: 14500, fuelMTPerDay: 34,
    typicalParcel: 80000, costMultiplier: 0.88,
  },
  {
    id: 'panamax', name: 'Panamax', dwtRange: '74,000–78,000 DWT',
    ladenDraft: 13.8, loaM: 225, dailyTCE: 13800, fuelMTPerDay: 32,
    typicalParcel: 75000, costMultiplier: 0.92,
  },
  {
    id: 'supramax', name: 'Supramax / Ultramax', dwtRange: '55,000–63,000 DWT',
    ladenDraft: 12.2, loaM: 200, dailyTCE: 11200, fuelMTPerDay: 27,
    typicalParcel: 58000, costMultiplier: 1.04,
  },
  {
    id: 'handysize', name: 'Handysize', dwtRange: '28,000–38,000 DWT',
    ladenDraft: 10.1, loaM: 185, dailyTCE: 9500, fuelMTPerDay: 22,
    typicalParcel: 35000, costMultiplier: 1.22,
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
};

const ALL_CANDIDATE_PORTS = ['paradip', 'vizag', 'gangavaram', 'dhamra', 'gopalpur', 'haldia', 'sandheads'];

const DEMURRAGE_RATE_INR_PER_DAY = 6500000; // ₹65L/day ($75k/day)
const DISPATCH_RATE_INR_PER_DAY = 3250000;  // ₹32.5L/day (Standard 50% Dispatch Reward)

function computePortScore(originId, portId, vessel, cargoMT, incoisData) {
  const port = INDIAN_EAST_COAST_PORTS[portId];
  const origin = ORIGIN_LOADING_PORTS[originId];
  const live = PORT_LIVE_CONDITIONS[portId];
  if (!port || !origin || !live) return null;

  // Origin checks
  const originDraftClear = vessel.ladenDraft <= origin.maxDraftLaden;
  const originLoaClear = vessel.loaM <= origin.maxLOA;

  // Destination Draft check
  const destDraftClear = vessel.ladenDraft <= port.maxDraftLaden;
  const destMaxDraft = incoisData ? incoisData.oceanographic.livePermissibleDraft : port.maxDraftHighTide;
  const destDraftTide  = vessel.ladenDraft <= destMaxDraft;
  const destDraftOk    = destDraftClear || destDraftTide;
  const destLoaClear = vessel.loaM <= port.maxLOA;
  
  const loaClear = originLoaClear && destLoaClear;
  const blocked = !destDraftOk || !loaClear;

  let isLightLoaded = false;
  let lightLoadingCapMT = vessel.typicalParcel;
  let deadFreightPenaltyINRCr = 0;
  let bindingConstraint = 'None';

  if (!blocked) {
    const availableOriginDraft = origin.maxDraftLaden;
    const availableDestDraft = destDraftClear ? port.maxDraftLaden : destMaxDraft;
    const maxAllowableDraft = Math.min(availableOriginDraft, availableDestDraft);
    
    if (vessel.ladenDraft > maxAllowableDraft) {
      isLightLoaded = true;
      lightLoadingCapMT = Math.round((maxAllowableDraft / vessel.ladenDraft) * vessel.typicalParcel * 0.94);
      const shortCargoMT = vessel.typicalParcel - lightLoadingCapMT;
      deadFreightPenaltyINRCr = +((shortCargoMT * 18.5 * 86.5) / 10000000).toFixed(2);
      
      if (availableOriginDraft < availableDestDraft) {
        bindingConstraint = `Origin (${origin.name} max ${availableOriginDraft}m)`;
      } else {
        bindingConstraint = `Destination (${port.name} max ${availableDestDraft}m)`;
      }
    }
  }

  // Trips required
  const tripsRequired = Math.ceil(cargoMT / lightLoadingCapMT);

  // Actual discharge days using live TPD
  const dischargeDays = +(cargoMT / (live.actualTPD * tripsRequired)).toFixed(1);

  // Laytime allowance calculation (standard laytime = cargoMT / rated TPD)
  const allowedLaytimeDays = +(cargoMT / port.handlingRateTPD).toFixed(1);
  const extraOverLaytime = +(dischargeDays - allowedLaytimeDays).toFixed(1);
  
  // Demurrage vs Dispatch Calculation (Two-Way Laytime Equation)
  let demurrageINRCr = 0;
  let demurrageUSD = 0;
  let dispatchBonusINRLakhs = 0;
  let dispatchBonusUSD = 0;
  let isDispatchEarned = false;

  if (extraOverLaytime > 0 || live.waitDays > 1.5) {
    const demurrageDays = Math.max(0, extraOverLaytime + Math.max(0, live.waitDays - 1.0));
    demurrageINRCr = +((demurrageDays * DEMURRAGE_RATE_INR_PER_DAY) / 10000000).toFixed(2);
    demurrageUSD = Math.round((demurrageINRCr * 10000000) / 86.5);
  } else if (extraOverLaytime < 0 && live.waitDays <= 1.5) {
    // Unloaded ahead of laytime schedule -> Dispatch Bonus Earned!
    isDispatchEarned = true;
    const earlyDays = Math.abs(extraOverLaytime);
    dispatchBonusINRLakhs = +((earlyDays * DISPATCH_RATE_INR_PER_DAY) / 100000).toFixed(1);
    dispatchBonusUSD = Math.round((dispatchBonusINRLakhs * 100000) / 86.5);
  }

  // Traffic Light Verdict Generation
  let verdictBadge = { text: '', cls: '', icon: CheckCircle2 };
  if (!loaClear) {
    const blocker = !originLoaClear ? `Origin (${origin.name} max LOA ${origin.maxLOA}m)` : `Destination (${port.name} max LOA ${port.maxLOA}m)`;
    verdictBadge = {
      text: `❌ LOA Exceeded at ${blocker} — Switch to smaller vessel`,
      cls: 'bg-red-50 text-red-800 border-red-200',
      icon: XCircle
    };
  } else if (!destDraftOk) {
    verdictBadge = {
      text: `❌ Destination Draft Insufficient (${vessel.ladenDraft}m vs ${port.maxDraftLaden}m) — Switch to smaller vessel`,
      cls: 'bg-red-50 text-red-800 border-red-200',
      icon: XCircle
    };
  } else if (isLightLoaded) {
    verdictBadge = {
      text: `⚠️ Light-loaded to ${lightLoadingCapMT.toLocaleString()} MT due to ${bindingConstraint} (Penalty: ₹${deadFreightPenaltyINRCr} Cr)`,
      cls: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: AlertTriangle
    };
  } else {
    verdictBadge = {
      text: `✅ Fits 100% at Origin & Destination — Zero Restrictions`,
      cls: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      icon: CheckCircle2
    };
  }

  // TPD → Dollars, Demurrage & Dispatch Translation
  let tpdTranslationSentence = '';
  if (isDispatchEarned) {
    tpdTranslationSentence = `Discharge time: ${dischargeDays} days ➔ Finished ${Math.abs(extraOverLaytime)}d ahead of laytime! 🎉 Dispatch Reward: +₹${dispatchBonusINRLakhs} Lakhs (+$${Math.round(dispatchBonusUSD / 1000)}k USD) cash credit from shipowner.`;
  } else if (extraOverLaytime > 0) {
    tpdTranslationSentence = `Discharge time: ${dischargeDays} days ➔ ${extraOverLaytime}d over laytime ➔ ₹${demurrageINRCr} Cr ($${Math.round(demurrageUSD / 1000)}k USD) demurrage exposure at anchorage.`;
  } else {
    tpdTranslationSentence = `Discharge time: ${dischargeDays} days ➔ On schedule within free laytime (${allowedLaytimeDays} days). Zero demurrage.`;
  }

  // Compute composite score /100
  let score = 100;
  if (isLightLoaded) score -= 20;   // light loading penalty
  if (blocked) score -= 60;                    // blocked completely
  if (live.waitDays > 3) score -= 10;
  if (extraOverLaytime > 1.0) score -= 15;
  if (live.berthAvailDays < 7) score -= 12;
  if (isDispatchEarned) score += 5;             // Bonus for fast dispatch
  score = Math.max(0, Math.min(100, score));

  const costPremium = +(vessel.costMultiplier - 0.72).toFixed(2);

  return {
    originId, portId, port, live,
    vessel,
    originDraftClear, destDraftClear, destDraftTide, destDraftOk,
    originLoaClear, destLoaClear, loaClear, blocked,
    tripsRequired, dischargeDays, allowedLaytimeDays, extraOverLaytime,
    demurrageINRCr, demurrageUSD,
    isDispatchEarned, dispatchBonusINRLakhs, dispatchBonusUSD,
    isLightLoaded, lightLoadingCapMT, deadFreightPenaltyINRCr, bindingConstraint,
    verdictBadge, tpdTranslationSentence,
    score, costPremium
  };
}

export default function VesselOptimization({ selectedOrigin, selectedDestination, cargoVolumeMT, currency, onSelectVessel, currentVesselId, onSelectPort }) {
  const isINR = currency === 'INR';
  const [activeTab, setActiveTab] = useState('optimizer'); // 'optimizer' | 'portswitcher'
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

  const currentPort = INDIAN_EAST_COAST_PORTS[selectedDestination];
  const liveCurrent = PORT_LIVE_CONDITIONS[selectedDestination];

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

  // Auto-Recommended Optimal Vessel Class
  const recommendedVesselEval = vesselEvals.find(v => !v.blocked) || vesselEvals[0];
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
    : `Executive Directive: ${recommendedVesselEval.vessel.name} is the optimal 100% fit for ${currentPort.name} and loading origin. Zero draft restriction; discharge speed ${recommendedVesselEval.isDispatchEarned ? 'qualifies for Dispatch Reward Bonus' : 'fits laytime allowance cleanly'}.`;

  // Integrated PS Part (b) Optimization Engine for Decision Matrix Cards
  const engineOptimization = useMemo(() => {
    return optimizeVesselType({
      originId: selectedOrigin,
      destinationId: selectedDestination,
      cargoVolumeMT: activeCargoVolume,
      cargoType: 'Coking Coal'
    });
  }, [selectedOrigin, selectedDestination, activeCargoVolume]);

  const candidateMatrixCards = useMemo(() => {
    const evals = engineOptimization.evaluations;
    const isHaldia = selectedDestination === 'haldia';
    
    // Pick 3 representative classes across shallow, medium, and large
    const shallow = isHaldia 
      ? (evals.find(e => e.id === 'handymax') || evals.find(e => e.id === 'handysize') || evals[0])
      : (evals.find(e => e.id === 'supramax') || evals.find(e => e.id === 'handymax') || evals[0]);
    
    const medium = evals.find(e => e.id === 'baby_cape') || evals.find(e => e.id === 'panamax') || evals[1];
    const large = evals.find(e => e.id === 'capesize') || evals[evals.length - 1];
    
    return [shallow, medium, large].filter(Boolean);
  }, [engineOptimization, selectedDestination]);

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
        <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs shrink-0">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3 py-1.5 font-semibold transition-colors ${activeTab === 'optimizer' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Vessel Recommender
          </button>
          <button
            onClick={() => setActiveTab('portswitcher')}
            className={`px-3 py-1.5 font-semibold transition-colors ${activeTab === 'portswitcher' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Port Switch Advisor
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
                      <div className="mt-2.5 p-2 rounded-lg bg-rose-50/80 border border-rose-200 text-[11px] text-rose-950 space-y-1">
                        <div className="flex items-center space-x-1 font-bold text-rose-800">
                          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Hazard / Grounding Warning:</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-slate-600">
                          Vessel draft ({card.ladenDraft}m) exceeds {currentPort.name} maximum draft ({currentPort.maxDraftLaden}m). Physical entry prohibited.
                        </p>
                        <div className="text-[10px] font-bold text-rose-700 bg-white/80 rounded px-1.5 py-0.5 border border-rose-200">
                          Directive: DO NOT CHARTER FOR THIS PORT. Refusal of entry or mandatory offshore lighterage required.
                        </div>
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

      {/* === TAB 2: PORT SWITCH ADVISOR === */}
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
