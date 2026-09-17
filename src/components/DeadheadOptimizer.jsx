import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, ArrowRight, CheckCircle2, Sparkles, Leaf, Anchor, 
  MapPin, Zap, TrendingUp, CloudRain, Waves, Flame, Gauge, 
  ShieldCheck, DollarSign, Layers, Compass, GitMerge, FileText,
  TrendingDown, Clock, Cpu, Navigation, AlertTriangle, Factory
} from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import liveMarketNewsPayload from '../data/liveMarketNews.json';
import InsightBulb from './InsightBulb';
import MasterDecisionPipeline from './MasterDecisionPipeline';
import CagAuditInventoryShield from './CagAuditInventoryShield';

export default function DeadheadOptimizer({ selectedDestination, currency, forecast, terminalMetrics = null, activeNewsSignal = null }) {
  const [activeSubTab, setActiveSubTab] = useState('pipeline'); // 'pipeline', 'tramp', 'all'
  const [selectedLivePort, setSelectedLivePort] = useState(selectedDestination || 'paradip');
  const [selectedBerthedShipMmsi, setSelectedBerthedShipMmsi] = useState('');
  const [matchedId, setMatchedId] = useState(null);
  
  const isINR = currency === 'INR';
  const multiplier = isINR ? 95.0 : 1;
  const currSym = isINR ? '₹' : '$';

  // Keep internal active port in sync if selectedDestination prop changes from outside
  useEffect(() => {
    if (selectedDestination) {
      setSelectedLivePort(selectedDestination);
    }
  }, [selectedDestination]);

  // Filter vessels that are discharging at the selected port
  const dischargingVessels = LIVE_AIS_VESSELS.filter(
    v => v.destinationId === selectedLivePort && v.status.includes('Discharging')
  );

  // Auto-select first vessel when port changes
  useEffect(() => {
    if (dischargingVessels.length > 0) {
      setSelectedBerthedShipMmsi(dischargingVessels[0].mmsi);
    } else {
      setSelectedBerthedShipMmsi('');
    }
  }, [selectedLivePort]);

  const activeShip = dischargingVessels.find(v => v.mmsi === selectedBerthedShipMmsi);

  // Filter backhaul routes for current discharge port
  const filteredRoutes = BACKHAUL_OPPORTUNITIES.filter(
    r => r.dischargePort === selectedLivePort
  );

  // Dynamic Part D ➔ Part C Conflict & Chokepoint Disruption Linkage
  const conflictTelemetry = useMemo(() => {
    // 1. Check if user selected or active signal in Part D is a conflict
    if (activeNewsSignal) {
      const cat = (activeNewsSignal.category || '').toLowerCase();
      const head = (activeNewsSignal.headline || activeNewsSignal.title || '').toLowerCase();
      const isGeopolitical = activeNewsSignal.isConflictOrDisruption ||
        cat.includes('geopolitical') || cat.includes('conflict') || cat.includes('chokepoint') || cat.includes('detour') ||
        head.includes('red sea') || head.includes('houthi') || head.includes('strait of hormuz') || head.includes('bab el-mandeb');
      
      if (isGeopolitical) {
        return {
          active: true,
          source: 'Selected Part D Signal',
          headline: activeNewsSignal.headline || activeNewsSignal.title,
          category: activeNewsSignal.category,
          urgency: activeNewsSignal.urgencyLevel || 'CRITICAL',
          spotDrift: activeNewsSignal.spotDriftPct || '+22.5%',
          action: activeNewsSignal.actionRecommendation || 'Activate alternative employment & coastal routing to avoid high-risk choke zones.'
        };
      }
    }

    // 2. Check if live ingested RSS news contains an active conflict
    const liveConflict = liveMarketNewsPayload?.articles?.find(a => a.isConflictOrDisruption);
    if (liveConflict) {
      return {
        active: true,
        source: 'Live Part D Ingestion',
        headline: liveConflict.title,
        category: liveConflict.category,
        urgency: liveConflict.urgencyLevel || 'CRITICAL',
        spotDrift: liveConflict.spotDriftPct || '+22.5%',
        action: liveConflict.actionRecommendation || 'Activate alternative employment & coastal routing to avoid high-risk choke zones.'
      };
    }

    return { active: false, source: 'Baseline', headline: null };
  }, [activeNewsSignal]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header with Sub-Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <span>Part C: Idle Scenario Management & Return Tramp Deadheading Elimination</span>
                <InsightBulb
                  title="Part C Operational Engine"
                  subtitle="Inbound Detection ➔ Hop-and-Load ➔ Hull Health"
                  dataset="AISStream + UN COMTRADE + Open-Meteo Marine"
                  logic="Evaluates inbound vessels 7–30 days before arrival. Detects berth congestion early, switches to Virtual Arrival, triggers 100 NM coastal 'Hop-and-Load' hops if no local cargo is found, validates hold-cleaning sea states, and shields against sub-surface biofouling drag."
                  impact="Saves up to $25,000/day in wasted fuel and generates $1.2M+ in export freight arbitrage."
                />
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Closed-Loop Operational Architecture: Inbound Coal Vessel ──► Commercial Optimization ──► Zero-Ballast Resolution
            </p>
          </div>

          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold px-3 py-1 rounded-md">
            100% Software • Zero IoT
          </span>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('pipeline')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'pipeline'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>1. Master Operational Flowchart (7–30d ETA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tramp')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'tramp'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Live Tramp & "Hop-and-Load" Pairs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('seavium')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'seavium'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3. Seavium Idle Management Engine (PS Part C)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('cag_audit')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'cag_audit'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5 text-amber-400" />
            <span>4. CAG Audit Inventory & Carrying Cost Defense</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>View All Modules</span>
          </button>
        </div>
      </div>

      {/* MODULE 1: Master Operational Flowchart Simulator */}
      {(activeSubTab === 'pipeline' || activeSubTab === 'all') && (
        <MasterDecisionPipeline 
          currency={currency} 
          selectedPort={selectedLivePort} 
        />
      )}

      {/* MODULE 2: Live Tramp Backhaul & Hop-and-Load Matching */}
      {(activeSubTab === 'tramp' || activeSubTab === 'all') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Live Next-Fixture AI & Coastal Triangulation Directory
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Matches active discharging bulk carriers with export parcels before lines are cast off
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
              UN COMTRADE + AIS Live
            </span>
          </div>

          {/* Port & Ship Selector Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5 bg-purple-50/40 p-3 rounded-lg border border-purple-100">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wide mb-1">
                Select Discharge Port
              </label>
              <select 
                className="w-full text-xs p-2 border border-purple-200 rounded-md bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                value={selectedLivePort}
                onChange={(e) => setSelectedLivePort(e.target.value)}
              >
                <option value="paradip">Paradip Port (PPT - Odisha)</option>
                <option value="vizag">Visakhapatnam (VPT - Andhra)</option>
                <option value="gangavaram">Gangavaram Port (GPL)</option>
                <option value="dhamra">Dhamra Port (DPCL - Capesize Hub)</option>
                <option value="haldia">Haldia Dock Complex (HDC)</option>
                <option value="gopalpur">Gopalpur Port (GPL-Odisha)</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wide mb-1">
                Live Vessels at Berth (Status: Discharging)
              </label>
              <select 
                className="w-full text-xs p-2 border border-purple-200 rounded-md bg-white text-purple-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                value={selectedBerthedShipMmsi}
                onChange={(e) => setSelectedBerthedShipMmsi(e.target.value)}
              >
                {dischargingVessels.length > 0 ? dischargingVessels.map(ship => (
                  <option key={ship.mmsi} value={ship.mmsi}>
                    {ship.name} ({ship.vesselType}) — {ship.cargo}
                  </option>
                )) : <option value="">No vessels currently discharging at {selectedLivePort}</option>}
              </select>
            </div>
          </div>

          {/* Dynamic Part D Telemetry Linkage Banner */}
          {conflictTelemetry.active ? (
            <div className="mb-5 p-4 rounded-xl border border-amber-300 bg-amber-50/90 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/20 text-amber-900 rounded-lg border border-amber-400/40 shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                        🚨 Active Naval Conflict / Chokepoint Threat Detected in Part (d)
                      </span>
                      <span className="bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                        {conflictTelemetry.urgency} ALERT
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-mono">
                      Source: {conflictTelemetry.source}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-amber-900 mb-1">
                    "{conflictTelemetry.headline}"
                  </p>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    <strong>PS Part (c) Dynamic Response:</strong> Naval chokepoint threat detected ({conflictTelemetry.spotDrift} spot freight inflation). Recommending <strong>immediate alternative employment & coastal routing</strong> (e.g. 92 NM Hop-and-Load to Dhamra or coastal coal to Ennore) to avoid vessel stranding or dangerous empty deadheading.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold">Part D Telemetry: Normal Baseline Operations (Zero Active Naval Conflicts)</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded">
                Standard Commercial Backhaul Mode
              </span>
            </div>
          )}

          {/* Backhaul Opportunities Grid */}
          {activeShip ? (
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <Anchor className="w-4 h-4 mr-1 text-emerald-600" />
                  Matched Backhaul For {activeShip.name} ({activeShip.vesselType}, {activeShip.dwt.toLocaleString()} DWT)
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  DWT Fit: {(activeShip.dwt * 0.95).toLocaleString()} MT Max Intake
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRoutes.map((route) => {
                  const isMatched = matchedId === route.id;
                  const actualCargoMT = Math.min(route.cargoParcelSizeMT, activeShip.dwt * 0.95);
                  const dynamicTCEBoost = Math.round(route.tceBoostUSDPerDay * (actualCargoMT / route.cargoParcelSizeMT));

                  return (
                    <div
                      key={route.id}
                      className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                        isMatched
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-card ring-2 ring-emerald-400'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                          <span className="font-bold text-xs text-slate-800">{route.dischargePortName}</span>
                          {conflictTelemetry.active ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Conflict Shield Alternative</span>
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                              {route.distanceNM} NM Return Leg
                            </span>
                          )}
                        </div>

                        {/* Cargo */}
                        <div className="text-xs font-bold text-maritime-900 mb-1">
                          {route.exportCargo}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center mb-3">
                          <ArrowRight className="w-3 h-3 mr-1 text-slate-400" />
                          <span>Bound for: <strong className="text-slate-700">{route.destinationRegion}</strong></span>
                        </div>

                        {/* Metrics */}
                        <div className="space-y-1.5 text-xs text-slate-600 tabular-nums pt-2 border-t border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Live Ship Intake:</span>
                            <span className="font-semibold text-slate-800">{actualCargoMT.toLocaleString()} MT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Net TCE Boost:</span>
                            <span className="font-bold text-emerald-600">
                              +{currSym}{(dynamicTCEBoost * multiplier).toFixed(0)} /Day
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ballast Elimination:</span>
                            <span className="font-bold text-slate-900">{route.emptyBallastReductionPercent}% Empty Days Saved</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-emerald-700 font-medium">
                            <span className="flex items-center">
                              <Leaf className="w-3 h-3 mr-1" /> CO2 Avoided:
                            </span>
                            <span>{route.co2SavingsTons} MT</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setMatchedId(isMatched ? null : route.id)}
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                            isMatched
                              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isMatched ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Backhaul Fixture Locked & Contract Executed</span>
                            </>
                          ) : (
                            <>
                              <span>Pair Backhaul Parcel</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Contract Clause Confirmation Banner */}
                      {isMatched && (
                        <div className="mt-3 p-3 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-100 text-[11px] font-mono space-y-1.5 animate-fadeIn shadow-md">
                          <div className="flex items-center justify-between text-emerald-300 font-bold uppercase border-b border-emerald-800 pb-1 text-[10px]">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Consecutive Voyage Charter Executed
                            </span>
                            <span className="text-amber-400">REF: NVF-CVC-2026</span>
                          </div>
                          <div className="text-white font-sans text-xs font-bold mt-1">
                            Commercial Rebate Captured: -{currSym}{(2.93 * multiplier).toFixed(1)}/MT Discount
                          </div>
                          <p className="text-[10.5px] text-emerald-200/90 font-sans leading-tight">
                            Logistics Manager instructs master: <strong>{activeShip.name}</strong> locks outbound <strong>{route.exportCargo}</strong> ({route.destinationRegion}). Inbound coal freight discounted, saving <strong>{currSym}{(210000 * multiplier / (isINR ? 100000 : 1)).toFixed(2)} {isINR ? 'Lakhs' : 'USD'}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic p-4 text-center bg-slate-50 rounded-lg border border-slate-200">
              No live vessels currently discharging at {selectedLivePort}. Select another port above.
            </div>
          )}
        </div>
      )}

      {/* MODULE 3: Seavium-Aligned Idle Scenario Management & Deadheading Reduction Engine */}
      {(activeSubTab === 'seavium' || activeSubTab === 'all') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                  <span>Part C Architecture: Seavium Offshore Utilization & Idle Minimization</span>
                  <InsightBulb
                    title="Seavium Vessel Utilization Mapping"
                    subtitle="Forecasting Low Demand ➔ Triangular Arbitrage ➔ Staging Positioning"
                    dataset="Seavium Vessel Utilization Benchmark + DGS Cabotage Rules + AIS Live"
                    logic="Satisfies the core PS mandate by implementing Seavium's 5 pillars: (1) Forecasting low-demand seasonal lulls, (2) AI-matching alternative employment fixtures, (3) Mid-corridor staging to cut deadhead ballast by 64%, and (4) JIT Virtual Arrival to eliminate non-productive anchorage idle time."
                    impact="Eliminates up to 18 days of empty ballast deadheading ($450,000+ saved per voyage)."
                  />
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Direct compliance with PS Part (c): Forecasting low demand, alternative employment, and optimized positioning.
              </p>
            </div>
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded">
              Seavium Industry Standard
            </span>
          </div>

          {/* 4 Deep Strategic Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PILLAR 1: FORECASTING PERIODS OF LOW DEMAND */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                    1. Forecasting Periods of Low Demand
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                    Demand Lull AI
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Predicts seasonal, meteorological, and cyclical cargo lulls before charter commitments lock in idle tonnage.
                </p>
                <div className="space-y-2 text-[11px] text-slate-700">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-amber-900 flex justify-between">
                      <span>🌧️ Southwest Monsoon (July–August):</span>
                      <span className="text-amber-700 font-mono">-18% Coal Demand</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Rain dampens open-cast handling and steel restocking slows down. <strong>Pacing Strategy:</strong> Slow-steam fleet at 10.5 kts and schedule mandatory dry-docking / hull surveys.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>🏮 Chinese Golden Week / Lunar Lull:</span>
                      <span className="text-rose-700 font-mono">-14% Pacific Bulk</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Pacific basin manufacturing slowdown causes spot freight collapse. <strong>Pacing Strategy:</strong> Shift uncommitted vessels into domestic coastal coal or coastal pellet trade.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-indigo-900 flex justify-between">
                      <span>📉 Forward P10 Freight Valleys (Day 38–45):</span>
                      <span className="text-indigo-700 font-mono">Bargain Sniping</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Quantile ML cones identify seasonal dip windows ($14.85/MT) to lock supplemental spot parcels without paying peak COA premiums.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PILLAR 2: ALTERNATIVE EMPLOYMENT OPPORTUNITIES */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    2. Alternative Employment Opportunities
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Arbitrage Matching
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Matches discharged bulkers with alternative revenue fixtures before lines are cast off, transforming idle time into profit.
                </p>
                <div className="space-y-2 text-[11px] text-slate-700">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-emerald-900 flex justify-between">
                      <span>🔄 Coastal "Hop-and-Load" (92 NM Hop):</span>
                      <span className="text-emerald-700 font-mono">+$7,400/day TCE</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Discharges coking coal at Paradip ➔ 7.6h hop to Dhamra ➔ Loads 120,000 MT iron ore pellets bound for East Asia. Eliminates 82% empty ballast.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-blue-900 flex justify-between">
                      <span>🇮🇳 DGS Cabotage Waiver Coupling:</span>
                      <span className="text-blue-700 font-mono">+$480,000 Revenue</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Foreign-flagged ships utilize Indian cabotage exemptions to move domestic coal to Tamil Nadu utilities (Ennore/Tuticorin) during international lulls.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-purple-900 flex justify-between">
                      <span>⚓ Offshore Lighterage Daughter Craft:</span>
                      <span className="text-purple-700 font-mono">$14,000/day Hire</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      During zero-cargo weeks, employs bulkers as floating transshipment buffers at Sandheads/Sagar anchorage rather than paying idle anchorage mooring fines.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PILLAR 3: OPTIMIZED POSITIONING TO REDUCE DEADHEADING */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    3. Optimized Positioning to Reduce Deadheading
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                    Ballast Reduction
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Eliminates uncompensated empty return voyages ("deadheading") by intelligent fleet staging and charter timing.
                </p>
                <div className="space-y-2 text-[11px] text-slate-700">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-blue-900 flex justify-between">
                      <span>⏱️ Pre-Discharge Forward CVC Locking:</span>
                      <span className="text-blue-700 font-mono">0.5d Turnaround</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Consecutive Voyage Charters (CVC) confirmed 48h prior to completing discharge. Slashes port idle dwell time from 4.2 days down to 12 hours.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-teal-900 flex justify-between">
                      <span>📍 Malacca & Colombo Staging Hubs:</span>
                      <span className="text-teal-700 font-mono">-64% Deadhead NM</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Instead of committing to a 5,350 NM empty deadhead to Australia, stages vessels at Malacca/Colombo to bid across Australia, Indonesia, and Mozambique within 3 days.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>🌊 Parallel Underway Hold Cleaning:</span>
                      <span className="text-slate-700 font-mono">Zero Hold Delay</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Audits IMD wave telemetry (Hs &lt;= 1.8m) to wash cargo holds during ballast transit, avoiding 48 hours of idle berth delay for cargo hold survey.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PILLAR 4: JIT VIRTUAL ARRIVAL & PREDICTIVE UPTIME */}
            <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2.5">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    4. JIT Virtual Arrival & Predictive Uptime
                  </span>
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-bold">
                    Seavium JIT Model
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Adopts Seavium's Just-In-Time arrival and predictive asset maintenance to eliminate waiting at anchor.
                </p>
                <div className="space-y-2 text-[11px] text-slate-700">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-purple-900 flex justify-between">
                      <span>⚡ Virtual Arrival (IMO MEPC.404):</span>
                      <span className="text-purple-700 font-mono">6.5 MT Fuel/Day Saved</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Detects berth queues 7 days out. Slow-steaming from 13.5 to 10.5 kts converts idle anchorage delay into productive, fuel-efficient transit (+{currSym}{(4030 * multiplier).toFixed(0)}/day savings).
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-emerald-900 flex justify-between">
                      <span>🪸 Predictive Subsurface Biofouling Grooming:</span>
                      <span className="text-emerald-700 font-mono">Averts +15-35% Drag</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Monitors tropical idle days (&gt;28°C Bay of Bengal). Schedules robotic micro-grooming during mandatory laycan gaps before slime turns to calcareous barnacles.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <div className="font-bold text-slate-900 flex justify-between">
                      <span>🌱 IMO CII Grade & EU ETS Shield:</span>
                      <span className="text-slate-700 font-mono">Grade A/B Retention</span>
                    </div>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">
                      Zero-ballast triangulation saves 1,420 MT CO2 per voyage, shielding vessel owners from EU ETS carbon fines ($127,800 USD) and CII downgrade penalties.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODULE: CAG Audit Inventory & Carrying Cost Defense */}
      {(activeSubTab === 'cag_audit' || activeSubTab === 'all') && (
        <CagAuditInventoryShield 
          currency={currency} 
          selectedPort={selectedLivePort} 
          activeNewsSignal={activeNewsSignal} 
        />
      )}

      {/* MODULE 4: Strategic Fuel & ESG Directives */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Strategic Optimization Directives & Fuel Savings Intelligence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Directive 1: Virtual Arrival */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-emerald-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <Flame className="w-4 h-4 mr-1.5 text-emerald-600" />
                1. Eco-Speed & Virtual Arrival JIT
              </div>
              <p className="text-xs text-emerald-950/80 mb-3 leading-relaxed">
                When anchorage queues at {selectedLivePort} exceed 2 days, steaming at 13.5 kts wastes fuel only to sit idle at anchor. Reducing speed to 11.0 kts ("Eco-Speed") cuts daily fuel burn from 29.5 MT/day to 23.0 MT/day VLSFO.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200 text-[11px] font-mono text-emerald-950">
              <span className="font-bold text-emerald-700">LIVE FUEL SAVINGS:</span><br/>
              Saves <strong>6.5 MT VLSFO/day</strong> = <strong className="text-emerald-700">+{currSym}{(4030 * multiplier).toFixed(0)}/day</strong> fuel reduction while aligning ETA with berth slot.
            </div>
          </div>

          {/* Directive 2: IMO CII Carbon Shield */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-teal-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <Leaf className="w-4 h-4 mr-1.5 text-teal-600" />
                2. IMO CII & EU ETS Carbon Shield
              </div>
              <p className="text-xs text-teal-950/80 mb-3 leading-relaxed">
                Sailing empty ballast severely degrades vessel Carbon Intensity Indicator (CII) rating from Grade B down to D/E. Pairing inbound coal with outbound iron ore pellets eliminates empty sailing.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-teal-200 text-[11px] font-mono text-teal-950">
              <span className="font-bold text-teal-700">ENVIRONMENTAL IMPACT:</span><br/>
              Avoids <strong>1,420 MT CO2 emissions</strong> per voyage, shielding shipowner from <strong>$127,800 USD carbon penalties</strong> and CII grade downgrades.
            </div>
          </div>

          {/* Directive 3: Cabotage Waiver */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-indigo-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 mr-1.5 text-indigo-600" />
                3. Indian Cabotage Waiver Coupling
              </div>
              <p className="text-xs text-indigo-950/80 mb-3 leading-relaxed">
                Foreign-flagged vessels discharging import coal at Dhamra/Paradip can utilize Directorate General of Shipping (DGS) cabotage waivers to carry domestic thermal coal down to TANGEDCO power plants in Tamil Nadu.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-indigo-200 text-[11px] font-mono text-indigo-950">
              <span className="font-bold text-indigo-700">COASTAL TRADE LEVERAGE:</span><br/>
              Replaces 4,480 NM empty ballast with a high-yield 780 NM coastal coal leg to Ennore/Tuticorin (<strong>+$480,000 USD revenue</strong>).
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
