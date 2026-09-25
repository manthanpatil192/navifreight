import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, ArrowRight, CheckCircle2, Sparkles, Leaf, Anchor, 
  MapPin, Zap, TrendingUp, CloudRain, Waves, Flame, Gauge, 
  Layers, Compass, AlertTriangle, Factory, Ship, Database
} from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import liveMarketNewsPayload from '../data/liveMarketNews.json';
import InsightBulb from './InsightBulb';
import VesselBunchingTerminal from './VesselBunchingTerminal';
import CargoToHoldMatcher from './CargoToHoldMatcher';

export default function DeadheadOptimizer({ selectedDestination, currency, forecast, terminalMetrics = null, activeNewsSignal = null, onSelectPort = null }) {
  const [activeSubTab, setActiveSubTab] = useState('matcher'); // 'matcher', 'tramp', 'bunching', 'all'
  const [selectedLivePort, setSelectedLivePort] = useState(selectedDestination || 'paradip');
  const [selectedBerthedShipMmsi, setSelectedBerthedShipMmsi] = useState('563112000'); // MV OLYMPIC GLORY (Default)
  const [hopFilter, setHopFilter] = useState('all'); // 'all', 'direct', 'hop', 'cabotage'
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

  // Vessels present at the selected port (at berth, discharging, or waiting in port roads)
  const portVessels = useMemo(() => {
    const list = LIVE_AIS_VESSELS.filter(
      v => v.destinationId === selectedLivePort && (
        v.status.toLowerCase().includes('berth') || 
        v.status.toLowerCase().includes('discharg') || 
        v.status.toLowerCase().includes('anchor')
      )
    );
    return list.length > 0 ? list : LIVE_AIS_VESSELS.filter(v => v.destinationId === selectedLivePort);
  }, [selectedLivePort]);

  // Active Ship Object: Always dynamically resolves to the selected MMSI
  const activeShip = useMemo(() => {
    return LIVE_AIS_VESSELS.find(v => v.mmsi === selectedBerthedShipMmsi) ||
      portVessels[0] ||
      LIVE_AIS_VESSELS[0];
  }, [selectedBerthedShipMmsi, portVessels]);

  // When selected port changes, sync selected ship if current ship is not at this port
  useEffect(() => {
    if (portVessels.length > 0) {
      const isCurrentAtPort = portVessels.some(v => v.mmsi === selectedBerthedShipMmsi);
      if (!isCurrentAtPort) {
        setSelectedBerthedShipMmsi(portVessels[0].mmsi);
      }
    }
  }, [selectedLivePort, portVessels]);

  // Filter backhaul & Hop-and-Load routes for current discharge port
  const filteredRoutes = useMemo(() => {
    let routes = BACKHAUL_OPPORTUNITIES.filter(
      r => r.dischargePort === selectedLivePort
    );

    if (hopFilter === 'direct') {
      routes = routes.filter(r => r.hopDistanceNM === 0 || r.hopType === 'Direct Port Berth');
    } else if (hopFilter === 'hop') {
      routes = routes.filter(r => r.hopDistanceNM > 0 || r.hopType === 'Coastal Hop-and-Load');
    } else if (hopFilter === 'cabotage') {
      routes = routes.filter(r => 
        r.commodityCategory.toLowerCase().includes('coal') || 
        r.openDataSource.toLowerCase().includes('cabotage')
      );
    }

    // Sort: Opportunities suitable for active ship's vessel class first, then by net arbitrage profit
    return [...routes].sort((a, b) => {
      const aFit = a.suitableVessels?.some(t => activeShip.vesselType?.toLowerCase().includes(t.toLowerCase())) ? 1 : 0;
      const bFit = b.suitableVessels?.some(t => activeShip.vesselType?.toLowerCase().includes(t.toLowerCase())) ? 1 : 0;
      if (bFit !== aFit) return bFit - aFit;
      return (b.arbitrageProfitINR_Cr || 0) - (a.arbitrageProfitINR_Cr || 0);
    });
  }, [selectedLivePort, hopFilter, activeShip]);

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
            onClick={() => setActiveSubTab('matcher')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'matcher'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-300" />
            <span>1. Cargo-to-Hold Matcher (Coastal Triangulation)</span>
            <span className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-extrabold ml-1">LIVE DATA</span>
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
            <Ship className="w-3.5 h-3.5" />
            <span>2. Live Tramp & "Hop-and-Load" Pairs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('bunching')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'bunching'
                ? 'bg-rose-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>3. Vessel Bunching & Anti-Congestion Dispatch Terminal</span>
            <span className="text-[9px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-extrabold ml-1">LIVE COLLISION RADAR</span>
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

      {/* MODULE 1: Interactive Cargo-to-Hold Matcher (Coastal Triangulation) */}
      {(activeSubTab === 'matcher' || activeSubTab === 'all') && (
        <CargoToHoldMatcher 
          currency={currency} 
          selectedMmsi={selectedBerthedShipMmsi}
          onSelectShip={(ship) => {
            setSelectedBerthedShipMmsi(ship.mmsi);
            if (ship.destinationId) {
              setSelectedLivePort(ship.destinationId);
            }
          }}
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
                Matches active discharging bulk carriers with export parcels & coastal Hop-and-Load routes before lines are cast off
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              <span>UN COMTRADE + DGCIS + CEA Live</span>
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
                Live Vessels at Berth / Anchor ({selectedLivePort.toUpperCase()})
              </label>
              <select 
                className="w-full text-xs p-2 border border-purple-200 rounded-md bg-white text-purple-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                value={selectedBerthedShipMmsi}
                onChange={(e) => {
                  setSelectedBerthedShipMmsi(e.target.value);
                  const ship = LIVE_AIS_VESSELS.find(v => v.mmsi === e.target.value);
                  if (ship && ship.destinationId) {
                    setSelectedLivePort(ship.destinationId);
                  }
                }}
              >
                {portVessels.length > 0 ? portVessels.map(ship => (
                  <option key={ship.mmsi} value={ship.mmsi}>
                    {ship.name} ({ship.vesselType}) — {ship.dwt?.toLocaleString()} DWT • {ship.status}
                  </option>
                )) : <option value="">No vessels currently at {selectedLivePort}</option>}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                  <Anchor className="w-4 h-4 mr-1 text-emerald-600" />
                  <span>Matched Backhaul & Coastal Hops For {activeShip.name} ({activeShip.vesselType}, {activeShip.dwt?.toLocaleString()} DWT)</span>
                </div>
                
                {/* Hop Filter Pills */}
                <div className="flex items-center gap-1 text-[10.5px]">
                  <span className="text-slate-400 font-medium">Filter Routes:</span>
                  {[
                    { key: 'all', label: `All Routes (${filteredRoutes.length})` },
                    { key: 'direct', label: 'Direct Berth (0 NM)' },
                    { key: 'hop', label: 'Hop-and-Load Hops' },
                    { key: 'cabotage', label: 'Cabotage / RSR Coal' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setHopFilter(tab.key)}
                      className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                        hopFilter === tab.key
                          ? 'bg-emerald-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
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
                        <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-2 gap-2">
                          <div>
                            <span className="font-bold text-xs text-slate-900 block">{route.dischargePortName}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {/* LIVE DATASET BADGE */}
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                                <Database className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{route.liveDatasetBadge || 'Govt Verified Dataset'}</span>
                              </span>
                              {/* Hop Badge */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                route.hopDistanceNM > 0 
                                  ? 'bg-amber-50 text-amber-900 border-amber-300' 
                                  : 'bg-blue-50 text-blue-900 border-blue-300'
                              }`}>
                                {route.hopDistanceNM > 0 ? `🌊 ${route.hopDistanceNM} NM Hop (${route.steamingHours})` : '⚓ Direct Port Berth'}
                              </span>
                            </div>
                          </div>

                          {conflictTelemetry.active ? (
                            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1 shrink-0">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Conflict Shield Alternative</span>
                            </span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold font-mono shrink-0">
                              {route.distanceNM} NM Leg
                            </span>
                          )}
                        </div>

                        {/* Cargo */}
                        <div className="text-xs font-bold text-maritime-900 mb-1">
                          {route.exportCargo}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center mb-2.5">
                          <ArrowRight className="w-3 h-3 mr-1 text-slate-400" />
                          <span>Bound for: <strong className="text-slate-700">{route.destinationRegion}</strong></span>
                        </div>

                        {/* Dataset Provenance */}
                        <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200 mb-2 font-mono truncate" title={route.openDataSource}>
                          <span className="text-slate-400 uppercase font-bold">Data Provenance: </span>
                          <span className="text-slate-700 font-semibold">{route.openDataSource}</span>
                        </div>

                        {/* Metrics */}
                        <div className="space-y-1.5 text-xs text-slate-600 tabular-nums pt-2 border-t border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Live Ship Intake:</span>
                            <span className="font-semibold text-slate-800">{actualCargoMT.toLocaleString()} MT ({activeShip.vesselType})</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Net TCE Boost:</span>
                            <span className="font-bold text-emerald-600">
                              +{currSym}{(dynamicTCEBoost * multiplier).toFixed(0)} /Day (~{isINR ? `₹${route.arbitrageProfitINR_Cr} Cr` : `$${(route.arbitrageProfitINR_Cr * 120000).toFixed(0)}`} Net Profit)
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
                              <ArrowRight className="w-3.5 h-3.5" />
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
              No live vessels currently at {selectedLivePort}. Select another port above.
            </div>
          )}
        </div>
      )}



      {/* MODULE 3: Vessel Bunching & Anti-Congestion Dispatch Terminal */}
      {(activeSubTab === 'bunching' || activeSubTab === 'all') && (
        <VesselBunchingTerminal 
          selectedDestination={selectedLivePort} 
          vessels={LIVE_AIS_VESSELS}
          onSelectPort={(portKey) => {
            setSelectedLivePort(portKey);
            if (onSelectPort) onSelectPort(portKey);
          }}
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
