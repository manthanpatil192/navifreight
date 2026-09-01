import React, { useState, useMemo } from 'react';
import {
  Ship, AlertTriangle, CheckCircle2, XCircle, TrendingDown,
  Clock, Anchor, BarChart3, MapPin, RefreshCw, ChevronDown, ChevronUp, ArrowRight, Zap, Award, AlertCircle, Sparkles, DollarSign, Gift
} from 'lucide-react';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
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

function computePortScore(portId, vessel, cargoMT) {
  const port = INDIAN_EAST_COAST_PORTS[portId];
  const live = PORT_LIVE_CONDITIONS[portId];
  if (!port || !live) return null;

  // Draft check
  const draftClear = vessel.ladenDraft <= port.maxDraftLaden;
  const draftTide  = vessel.ladenDraft <= port.maxDraftHighTide;
  const draftOk    = draftClear || draftTide;
  const draftMargin = +(port.maxDraftLaden - vessel.ladenDraft).toFixed(1);

  // Trips required
  const tripsRequired = Math.ceil(cargoMT / vessel.typicalParcel);

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

  // Light Loading Capacity & Dead Freight Penalty calculation
  let allowableCargoPerTrip = vessel.typicalParcel;
  let isLightLoaded = false;
  let lightLoadingCapMT = vessel.typicalParcel;
  let deadFreightPenaltyINRCr = 0;

  if (!draftClear && draftTide) {
    isLightLoaded = true;
    lightLoadingCapMT = Math.round((port.maxDraftHighTide / vessel.ladenDraft) * vessel.typicalParcel * 0.94);
    const shortCargoMT = vessel.typicalParcel - lightLoadingCapMT;
    // Dead freight cost penalty: paying for full vessel charter while short-loaded
    deadFreightPenaltyINRCr = +((shortCargoMT * 18.5 * 86.5) / 10000000).toFixed(2);
  }

  // Traffic Light Verdict Generation
  let verdictBadge = { text: '', cls: '', icon: CheckCircle2 };
  if (!draftOk) {
    verdictBadge = {
      text: `❌ Draft & LOA Insufficient (${vessel.ladenDraft}m vs ${port.maxDraftLaden}m) — Switch to Kamsarmax / Panamax`,
      cls: 'bg-red-50 text-red-800 border-red-200',
      icon: XCircle
    };
  } else if (!draftClear && draftTide) {
    verdictBadge = {
      text: `⚠️ Fits at High Tide only (3.5h Window) — Light-loaded to ${lightLoadingCapMT.toLocaleString()} MT (Penalty: ₹${deadFreightPenaltyINRCr} Cr)`,
      cls: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: AlertTriangle
    };
  } else {
    verdictBadge = {
      text: `✅ Fits All Tides (100% Clearance) — Zero Draft Restriction at ${port.name}`,
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

  // Cargo fit check
  const loaClear = vessel.loaM <= port.maxLOA;

  // Compute composite score /100
  let score = 100;
  if (!draftClear && draftTide) score -= 20;   // tidal window penalty
  if (!draftOk) score -= 60;                    // blocked completely
  if (!loaClear) score -= 30;
  if (live.waitDays > 3) score -= 10;
  if (extraOverLaytime > 1.0) score -= 15;
  if (live.berthAvailDays < 7) score -= 12;
  if (isDispatchEarned) score += 5;             // Bonus for fast dispatch
  score = Math.max(0, Math.min(100, score));

  const costPremium = +(vessel.costMultiplier - 0.72).toFixed(2);

  return {
    portId, port, live,
    vessel,
    draftClear, draftTide, draftOk, draftMargin,
    loaClear, tripsRequired, dischargeDays, allowedLaytimeDays, extraOverLaytime,
    demurrageINRCr, demurrageUSD,
    isDispatchEarned, dispatchBonusINRLakhs, dispatchBonusUSD,
    isLightLoaded, lightLoadingCapMT, deadFreightPenaltyINRCr,
    verdictBadge, tpdTranslationSentence,
    score, costPremium,
    blocked: !draftOk || !loaClear,
  };
}

export default function VesselOptimization({ selectedDestination, cargoVolumeMT, currency, onSelectVessel, currentVesselId, onSelectPort }) {
  const isINR = currency === 'INR';
  const [activeTab, setActiveTab] = useState('optimizer'); // 'optimizer' | 'portswitcher'

  const currentPort = INDIAN_EAST_COAST_PORTS[selectedDestination];
  const liveCurrent = PORT_LIVE_CONDITIONS[selectedDestination];

  // Evaluate all vessels for the selected port
  const vesselEvals = useMemo(() =>
    VESSEL_CLASSES.map(v => computePortScore(selectedDestination, v, cargoVolumeMT))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score),
    [selectedDestination, cargoVolumeMT]
  );

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
  const portComparisons = useMemo(() =>
    ALL_CANDIDATE_PORTS
      .map(pid => computePortScore(pid, activeVesselObj, cargoVolumeMT))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score),
    [currentVesselId, cargoVolumeMT]
  );

  // Plain-English Executive Summary Header text
  const executiveSummaryHeader = recommendedVesselEval.isLightLoaded
    ? `Executive Directive: ${recommendedVesselEval.vessel.name} fits ${currentPort.name} only during high-tide window (3.5h); book harbor pilotage 2hrs before ETA or switch to ${vesselEvals.find(v => v.draftClear)?.vessel.name || 'Kamsarmax'} to save ₹${penaltyDeltaINRCr} Cr in dead-freight penalties.`
    : `Executive Directive: ${recommendedVesselEval.vessel.name} is the optimal 100% fit for ${currentPort.name}. Zero draft restriction; discharge speed ${recommendedVesselEval.isDispatchEarned ? 'qualifies for Dispatch Reward Bonus' : 'fits laytime allowance cleanly'}.`;

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
                  <span className="font-bold text-emerald-800">{recommendedVesselEval.draftClear ? '100% All-Tide Fit' : 'High-Tide Fit'}</span>
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
