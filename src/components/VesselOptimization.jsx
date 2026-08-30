import React, { useState, useMemo } from 'react';
import {
  Ship, AlertTriangle, CheckCircle2, XCircle, TrendingDown,
  Clock, Anchor, BarChart3, MapPin, RefreshCw, ChevronDown, ChevronUp, ArrowRight
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

// Live port operating conditions (simulating real-time data)
const PORT_LIVE_CONDITIONS = {
  paradip:    { actualTPD: 38000, ratedTPD: 45000, queueVessels: 14, waitDays: 3.2, conveyorStatus: 'PARTIAL (Conveyor #3 Maintenance)', berthAvailDays: 6 },
  vizag:      { actualTPD: 58000, ratedTPD: 60000, queueVessels: 5,  waitDays: 1.4, conveyorStatus: 'FULL CAPACITY',                      berthAvailDays: 18 },
  gangavaram: { actualTPD: 62000, ratedTPD: 70000, queueVessels: 4,  waitDays: 1.1, conveyorStatus: 'FULL CAPACITY',                      berthAvailDays: 21 },
  dhamra:     { actualTPD: 55000, ratedTPD: 65000, queueVessels: 7,  waitDays: 2.1, conveyorStatus: 'NORMAL',                             berthAvailDays: 14 },
  gopalpur:   { actualTPD: 20000, ratedTPD: 25000, queueVessels: 9,  waitDays: 3.8, conveyorStatus: 'TUG SHORTAGE — 20% SLOW',            berthAvailDays: 5  },
  haldia:     { actualTPD: 14000, ratedTPD: 18000, queueVessels: 11, waitDays: 5.2, conveyorStatus: 'LOCK TIDE-LOCKED (6h/day)',           berthAvailDays: 3  },
  sandheads:  { actualTPD: 20000, ratedTPD: 22000, queueVessels: 6,  waitDays: 3.5, conveyorStatus: 'BARGE FLEET NORMAL',                 berthAvailDays: 12 },
};

// All East Coast candidate ports for switching recommendation
const ALL_CANDIDATE_PORTS = ['paradip', 'vizag', 'gangavaram', 'dhamra', 'gopalpur', 'haldia', 'sandheads'];

const VLSFO_PRICE = 628;
const DEMURRAGE_RATE_INR_PER_DAY = 6500000; // ₹65L/day

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

  // Actual discharge days using live TPD (not rated)
  const dischargeDays = +(cargoMT / (live.actualTPD * tripsRequired)).toFixed(1);

  // Demurrage exposure in ₹ Cr
  const extraWaitDays = Math.max(0, live.waitDays - 1.0);
  const demurrageINRCr = +((extraWaitDays * DEMURRAGE_RATE_INR_PER_DAY) / 10000000).toFixed(2);

  // Utilization efficiency penalty
  const tpdEfficiency = Math.round((live.actualTPD / live.ratedTPD) * 100);

  // Available berth-days in next 30 days
  const berthDays = live.berthAvailDays;

  // Cargo fit check — can port physically handle cargo type
  const loaClear = vessel.loaM <= port.maxLOA;

  // Compute composite score /100
  let score = 100;
  if (!draftClear && draftTide) score -= 15;   // tidal window penalty
  if (!draftOk) score -= 50;                    // blocked completely
  if (!loaClear) score -= 30;
  if (live.waitDays > 3) score -= 10;
  if (live.waitDays > 4) score -= 10;
  if (tpdEfficiency < 85) score -= 8;
  if (tpdEfficiency < 70) score -= 8;
  if (berthDays < 7) score -= 12;
  if (tripsRequired > 2) score -= 5;
  score = Math.max(0, Math.min(100, score));

  // Landed cost premium vs full-capacity standard ($/MT)
  const costPremium = +(vessel.costMultiplier - 0.72).toFixed(2);

  return {
    portId, port, live,
    vessel,
    draftClear, draftTide, draftOk, draftMargin,
    loaClear, tripsRequired, dischargeDays,
    demurrageINRCr, tpdEfficiency, berthDays,
    score, costPremium,
    blocked: !draftOk || !loaClear,
  };
}

function getBadge(result) {
  if (result.blocked) return { label: 'BLOCKED', cls: 'bg-red-100 text-red-800 border-red-200' };
  if (result.score >= 80) return { label: 'BEST FIT', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (result.score >= 60) return { label: 'VIABLE', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
  return { label: 'SUBOPTIMAL', cls: 'bg-orange-100 text-orange-800 border-orange-200' };
}

export default function VesselOptimization({ selectedDestination, cargoVolumeMT, currency, onSelectVessel, currentVesselId, onSelectPort }) {
  const isINR = currency === 'INR';
  const [expandedPort, setExpandedPort] = useState(null);
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

  // Port switch recommendations — find which port is cheapest for chosen vessel
  const activeVessel = VESSEL_CLASSES.find(v => v.id === currentVesselId) || VESSEL_CLASSES[0];
  const portComparisons = useMemo(() =>
    ALL_CANDIDATE_PORTS
      .map(pid => computePortScore(pid, activeVessel, cargoVolumeMT))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score),
    [currentVesselId, cargoVolumeMT]
  );

  const bestPort = portComparisons.find(p => !p.blocked);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Ship className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 3: Real-Time Cargo-to-Port Match Optimizer</span>
              <InsightBulb
                title="Phase 3: Live Cargo-to-Port Match Optimizer"
                subtitle="Real-Time Window & Demurrage Risk Engine"
                dataset="Live Port TPD Reports + IMD Weather + Port Authority Daily Traffic PDFs"
                logic="Goes beyond static draft tables — combines live berth availability (actual TPD vs rated), current anchorage queue depths, conveyor/tug equipment status, tidal windows, and IMD weather closures to compute how many real discharge-days exist in the next 30 days. Calculates exact ₹ Cr demurrage exposure if a vessel misses its window."
                impact="Prevents the two biggest chartering mistakes: (1) booking a vessel that causes 3+ day demurrage because port handling equipment was under maintenance, (2) ignoring a nearby port (e.g. Gangavaram) that is 40% cheaper on total landed cost this week."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Live port operating data: actual TPD, queue depth, conveyor status & 30-day window availability
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs shrink-0">
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3 py-1.5 font-semibold transition-colors ${activeTab === 'optimizer' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Vessel Match
          </button>
          <button
            onClick={() => setActiveTab('portswitcher')}
            className={`px-3 py-1.5 font-semibold transition-colors ${activeTab === 'portswitcher' ? 'bg-maritime-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Port Switch Advisor
          </button>
        </div>
      </div>

      {/* === TAB 1: VESSEL MATCH === */}
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
                <span className={`ml-1 font-bold ${liveCurrent.tpdEfficiency < 85 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ({liveCurrent.tpdEfficiency}%)
                </span>
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
              <div className="flex-1 min-w-0">
                <span className="text-slate-500">Status:</span>{' '}
                <span className="font-semibold text-slate-700">{liveCurrent.conveyorStatus}</span>
              </div>
            </div>
          )}

          {/* Vessel Evaluation Cards */}
          <div className="space-y-2">
            {vesselEvals.map((item) => {
              const badge = getBadge(item);
              const isActive = currentVesselId === item.vessel.id;
              const demurrageDisp = isINR
                ? `₹${item.demurrageINRCr} Cr`
                : `$${(item.demurrageINRCr * 10000000 / 86.5 / 1000).toFixed(0)}K`;

              // Actual discharge days with current live TPD (not rated)
              const actualDischDays = (cargoVolumeMT / liveCurrent.actualTPD).toFixed(1);
              const ratedDischDays  = (cargoVolumeMT / liveCurrent.ratedTPD).toFixed(1);
              const extraDays = (actualDischDays - ratedDischDays).toFixed(1);

              return (
                <div
                  key={item.vessel.id}
                  onClick={() => !item.blocked && onSelectVessel(item.vessel.id)}
                  className={`rounded-lg border p-3 transition-all cursor-pointer ${
                    isActive ? 'border-maritime-800 bg-maritime-50/60 shadow-sm' :
                    item.blocked ? 'border-red-200 bg-red-50/40 opacity-70 cursor-not-allowed' :
                    'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">

                    {/* Left: Vessel info */}
                    <div className="flex items-start space-x-3">
                      <div className={`mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                        item.blocked ? 'bg-red-500' : item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-orange-500'
                      }`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-slate-900">{item.vessel.name}</span>
                          {isActive && <span className="bg-maritime-800 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">ACTIVE</span>}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{item.vessel.dwtRange}</div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-black tabular-nums ${item.score >= 80 ? 'text-emerald-700' : item.score >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                        {item.score}<span className="text-xs font-normal text-slate-400">/100</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Match Score</div>
                    </div>
                  </div>

                  {/* Data grid */}
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">

                    {/* Draft */}
                    <div className="bg-white rounded border border-slate-100 px-2 py-1.5">
                      <div className="text-[10px] text-slate-400 mb-0.5">Draft vs Port</div>
                      {item.draftClear ? (
                        <div className="font-bold text-emerald-700">✓ +{item.draftMargin}m clear</div>
                      ) : item.draftTide ? (
                        <div className="font-bold text-amber-700">⚠ Tidal window only</div>
                      ) : (
                        <div className="font-bold text-red-700">✗ {item.draftMargin}m deficit</div>
                      )}
                    </div>

                    {/* Actual discharge days */}
                    <div className="bg-white rounded border border-slate-100 px-2 py-1.5">
                      <div className="text-[10px] text-slate-400 mb-0.5">Actual Discharge</div>
                      <div className="font-bold text-slate-800">{actualDischDays} days</div>
                      {parseFloat(extraDays) > 0 && (
                        <div className="text-[10px] text-red-600">+{extraDays}d vs rated TPD</div>
                      )}
                    </div>

                    {/* Demurrage */}
                    <div className="bg-white rounded border border-slate-100 px-2 py-1.5">
                      <div className="text-[10px] text-slate-400 mb-0.5">Demurrage Exposure</div>
                      <div className={`font-bold ${item.demurrageINRCr > 1 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {demurrageDisp}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.live.waitDays}d queue wait</div>
                    </div>

                    {/* Available windows */}
                    <div className="bg-white rounded border border-slate-100 px-2 py-1.5">
                      <div className="text-[10px] text-slate-400 mb-0.5">30-Day Berth Windows</div>
                      <div className={`font-bold ${item.berthDays < 8 ? 'text-red-700' : 'text-emerald-700'}`}>
                        {item.berthDays} days available
                      </div>
                      <div className="text-[10px] text-slate-400">{item.tripsRequired > 1 ? `${item.tripsRequired} trips needed` : 'Single voyage'}</div>
                    </div>
                  </div>

                  {/* Blocking reason */}
                  {item.blocked && (
                    <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {!item.draftOk
                          ? `Draft ${item.vessel.ladenDraft}m exceeds port max ${currentPort?.maxDraftHighTide}m (even with tide)`
                          : `LOA ${item.vessel.loaM}m exceeds port berth length ${currentPort?.maxLOA}m`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === TAB 2: PORT SWITCH ADVISOR === */}
      {activeTab === 'portswitcher' && (
        <div>
          {/* Active vessel indicator */}
          <div className="mb-3 flex items-center space-x-2 text-xs bg-maritime-50 border border-maritime-200 rounded-md px-3 py-2">
            <Ship className="w-3.5 h-3.5 text-maritime-700" />
            <span className="text-maritime-800 font-semibold">
              Comparing all East Coast ports for: {activeVessel.name} ({activeVessel.dwtRange}) carrying {cargoVolumeMT.toLocaleString()} MT
            </span>
          </div>

          {bestPort && bestPort.portId !== selectedDestination && (
            <div className="mb-3 flex items-start space-x-3 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-800">Port Switch Recommended: </span>
                <span className="text-emerald-700">
                  Switch from <strong>{INDIAN_EAST_COAST_PORTS[selectedDestination]?.name}</strong> to{' '}
                  <strong>{bestPort.port.name}</strong> — {bestPort.berthDays} berth-days available, {bestPort.live.waitDays}d queue wait, {bestPort.tpdEfficiency}% TPD efficiency.
                  Saves ~₹{((liveCurrent.waitDays - bestPort.live.waitDays) * 0.65).toFixed(1)} Cr in demurrage.
                </span>
              </div>
            </div>
          )}

          {/* Port comparison table */}
          <div className="space-y-2">
            {portComparisons.map((item) => {
              const badge = getBadge(item);
              const isCurrent = item.portId === selectedDestination;
              const demurrageDisp = isINR
                ? `₹${item.demurrageINRCr} Cr`
                : `$${(item.demurrageINRCr * 10000000 / 86.5 / 1000).toFixed(0)}K`;
              const expanded = expandedPort === item.portId;

              return (
                <div
                  key={item.portId}
                  className={`rounded-lg border transition-all ${
                    isCurrent ? 'border-maritime-300 bg-maritime-50/40' :
                    item.blocked ? 'border-red-200 bg-red-50/30 opacity-60' :
                    item.score >= 80 ? 'border-emerald-200 bg-emerald-50/20' :
                    'border-slate-200 bg-white'
                  }`}
                >
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 cursor-pointer"
                    onClick={() => setExpandedPort(expanded ? null : item.portId)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.blocked ? 'bg-red-500' : item.score >= 80 ? 'bg-emerald-500' : item.score >= 60 ? 'bg-amber-500' : 'bg-orange-500'}`} />
                      <div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="font-bold text-slate-900">{item.port.name}</span>
                          {isCurrent && <span className="text-[9px] bg-maritime-800 text-white px-1.5 py-0.5 rounded font-bold">CURRENT</span>}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.port.state} • Max draft {item.port.maxDraftLaden}m</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs shrink-0">
                      <div className="text-center">
                        <div className={`font-bold tabular-nums text-sm ${item.score >= 80 ? 'text-emerald-700' : item.score >= 60 ? 'text-amber-700' : 'text-red-700'}`}>
                          {item.score}
                        </div>
                        <div className="text-[10px] text-slate-400">Score</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold tabular-nums ${item.live.waitDays > 3 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {item.live.waitDays}d
                        </div>
                        <div className="text-[10px] text-slate-400">Queue</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold tabular-nums ${item.demurrageINRCr > 1 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {demurrageDisp}
                        </div>
                        <div className="text-[10px] text-slate-400">Demurrage</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-bold tabular-nums ${item.berthDays < 8 ? 'text-red-700' : 'text-emerald-700'}`}>
                          {item.berthDays}d
                        </div>
                        <div className="text-[10px] text-slate-400">Avail</div>
                      </div>
                      {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded details & Switch Action */}
                  {expanded && (
                    <div className="border-t border-slate-200 px-3 py-2.5 bg-slate-50/50">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] mb-3">
                        <div><span className="text-slate-400">Actual TPD: </span><span className="font-semibold">{item.live.actualTPD.toLocaleString()} MT/d</span> <span className="text-slate-400">({item.tpdEfficiency}% efficiency)</span></div>
                        <div><span className="text-slate-400">Equipment: </span><span className="font-semibold">{item.live.conveyorStatus}</span></div>
                        <div><span className="text-slate-400">Discharge: </span><span className="font-semibold">{(cargoVolumeMT / item.live.actualTPD).toFixed(1)} days</span> (live TPD)</div>
                        <div><span className="text-slate-400">Draft clearance: </span>
                          <span className={`font-semibold ${item.draftClear ? 'text-emerald-700' : item.draftTide ? 'text-amber-700' : 'text-red-700'}`}>
                            {item.draftClear ? `✓ +${item.draftMargin}m` : item.draftTide ? '⚠ Tidal only' : `✗ ${item.draftMargin}m deficit`}
                          </span>
                        </div>
                        <div><span className="text-slate-400">Queue vessels: </span><span className="font-semibold">{item.live.queueVessels} at anchorage</span></div>
                        <div><span className="text-slate-400">30d windows: </span><span className={`font-semibold ${item.berthDays < 8 ? 'text-red-700' : 'text-emerald-700'}`}>{item.berthDays} berth-days</span></div>
                      </div>

                      {!isCurrent && !item.blocked && onSelectPort && (
                        <div className="flex justify-end pt-2 border-t border-slate-200/80">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPort(item.portId);
                            }}
                            className="inline-flex items-center space-x-1.5 bg-maritime-800 hover:bg-maritime-900 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors shadow-sm"
                          >
                            <span>Switch Discharge to {item.port.name}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
