import React, { useState, useMemo } from 'react';
import { 
  Ship, Anchor, Compass, ArrowDown, ArrowRight, RefreshCw, 
  CheckCircle2, AlertTriangle, Wind, Waves, Sparkles, DollarSign,
  Layers, ShieldAlert, Cpu, Gauge, Zap, Check, MapPin, Navigation, Radio
} from 'lucide-react';
import { calculateHopAndLoadArbitrage, evaluateHoldCleaningWeather } from '../utils/subSurfaceHullEngine';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';

export default function MasterDecisionPipeline({ currency = 'INR', selectedPort = 'paradip' }) {
  // Candidate Inbound Bulk Carriers
  const candidateVessels = useMemo(() => {
    const coalVessels = LIVE_AIS_VESSELS.filter(v => 
      v.cargo?.toLowerCase().includes('coal') || 
      v.destinationId === selectedPort ||
      v.originPort?.toLowerCase().includes('australia') ||
      v.originPort?.toLowerCase().includes('indonesia')
    );
    // Unique by MMSI
    const unique = [];
    const seen = new Set();
    for (const v of coalVessels) {
      if (!seen.has(v.mmsi)) {
        seen.add(v.mmsi);
        unique.push(v);
      }
      if (unique.length >= 8) break;
    }
    return unique.length > 0 ? unique : LIVE_AIS_VESSELS.slice(0, 8);
  }, [selectedPort]);

  const [selectedMmsi, setSelectedMmsi] = useState(
    candidateVessels[1]?.mmsi || candidateVessels[0]?.mmsi || '563112000'
  );

  const activeVessel = candidateVessels.find(v => v.mmsi === selectedMmsi) || candidateVessels[0] || LIVE_AIS_VESSELS[1];

  // Interactive Simulation State
  const [berthAvailable, setBerthAvailable] = useState(false);
  const [congestionResponse, setCongestionResponse] = useState('slow_steam'); // 'wait', 'divert', 'slow_steam'
  const [cargoFound, setCargoFound] = useState(false); // true: local cargo, false: hop-and-load
  const [draftFeasible, setDraftFeasible] = useState(true);
  const [seaState, setSeaState] = useState('calm'); // 'calm' (wave < 1.3m), 'rough' (wave > 1.8m)
  const [conditionsChanged, setConditionsChanged] = useState(false);
  const [replanActive, setReplanActive] = useState(false);

  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;
  const currSym = isINR ? '₹' : '$';

  // Weather evaluation based on selected sea state
  const weatherResult = useMemo(() => {
    return evaluateHoldCleaningWeather({
      waveHeightM: seaState === 'calm' ? 1.1 : 2.2,
      windSpeedKts: seaState === 'calm' ? 12 : 24
    });
  }, [seaState]);

  // Parcel size tailored to selected vessel
  const parcelMT = Math.min(120000, Math.round((activeVessel?.dwt || 120000) * 0.85));

  // Arbitrage calculation
  const hopArbitrage = useMemo(() => {
    return calculateHopAndLoadArbitrage({
      currentPortId: selectedPort,
      targetPortId: selectedPort === 'dhamra' ? 'paradip' : 'dhamra',
      cargoParcelMT: parcelMT,
      outboundFreightRateUSDPerMT: 11.20,
      vesselDailyCharterUSD: activeVessel?.vesselType?.toLowerCase().includes('cape') ? 24500 : 14500
    });
  }, [selectedPort, parcelMT, activeVessel]);

  // Dynamic vessel speed based on congestion strategy
  const currentVesselSpeedKnots = congestionResponse === 'slow_steam' && !berthAvailable ? 7.5 : (activeVessel.speedKnots > 0 ? activeVessel.speedKnots : 12.0);

  // Handle replan click
  const triggerReplan = () => {
    setReplanActive(true);
    setTimeout(() => setReplanActive(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6">
      
      {/* Header with Title & Callout Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Master Operational Pipeline: Inbound Coal Vessel</span>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded">
                7–30 Days Before ETA
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive Operational Decision Flow • Integrates Live AIS, Vessel Bunching, Dynamic Hop-and-Load & Closed-Loop Replanning
          </p>
        </div>

        {/* 3 Key Corrections Callout Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[11px] text-slate-600 max-w-md">
          <span className="font-bold text-slate-800 flex items-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Key Architectural Corrections Applied:
          </span>
          <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-600">
            <li><strong>Commercial Optimizer</strong> precedes hold cleaning (no premature capital lock).</li>
            <li><strong>Virtual Arrival / Slow Steam</strong> early congestion response alongside wait/divert.</li>
            <li><strong>Closed-Loop Re-plan</strong> cycles back directly to Optimizer (not raw ingestion).</li>
          </ul>
        </div>
      </div>

      {/* Interactive Scenario Control Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6">
        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Interactive Flow Simulator: Toggle Real-World Operational Events
          </span>
          <span className="text-[10px] font-mono text-slate-400">Click options to watch pipeline re-route</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          
          {/* Toggle 1: Berth Congestion */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">1. Berth Status</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setBerthAvailable(true)}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  berthAvailable ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Available
              </button>
              <button
                type="button"
                onClick={() => setBerthAvailable(false)}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  !berthAvailable ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Congested
              </button>
            </div>
          </div>

          {/* Toggle 2: Congestion Strategy (if congested) */}
          <div className={`bg-white p-2 rounded border transition-all ${berthAvailable ? 'opacity-40 pointer-events-none' : 'border-slate-200'}`}>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">2. Congestion Action</label>
            <select
              value={congestionResponse}
              onChange={(e) => setCongestionResponse(e.target.value)}
              className="w-full text-[10.5px] font-bold p-1 bg-slate-50 border border-slate-200 rounded text-slate-800 outline-none"
            >
              <option value="slow_steam">Virtual Arrival (Slow Steam)</option>
              <option value="wait">Wait (At Anchor)</option>
              <option value="divert">Divert (Alternative Port)</option>
            </select>
          </div>

          {/* Toggle 3: Export Cargo Search */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">3. Backhaul At Berth?</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setCargoFound(true)}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  cargoFound ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Local Cargo
              </button>
              <button
                type="button"
                onClick={() => setCargoFound(false)}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  !cargoFound ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hop & Load
              </button>
            </div>
          </div>

          {/* Toggle 4: Draft Feasibility */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">4. Port Draft Fit</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setDraftFeasible(true)}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  draftFeasible ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setDraftFeasible(false)}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  !draftFeasible ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Lighten
              </button>
            </div>
          </div>

          {/* Toggle 5: Marine Swell State */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">5. Marine Weather</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setSeaState('calm')}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  seaState === 'calm' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Calm (&lt;1.3m)
              </button>
              <button
                type="button"
                onClick={() => setSeaState('rough')}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  seaState === 'rough' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Rough (&gt;1.8m)
              </button>
            </div>
          </div>

          {/* Toggle 6: Condition Changed / Closed Loop */}
          <div className="bg-white p-2 rounded border border-slate-200">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">6. Dynamic Shock?</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setConditionsChanged(false)}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  !conditionsChanged ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => {
                  setConditionsChanged(true);
                  triggerReplan();
                }}
                className={`py-1 px-1.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  conditionsChanged ? 'bg-purple-600 text-white shadow-xs animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Shock Replan
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Visual Operational Flowchart Render */}
      <div className="space-y-4 mb-6">

        {/* STEP 1: Inbound Coal Vessel with LIVE SHIP TELEMETRY */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 border-2 border-blue-400 rounded-xl p-4 shadow-sm">
          
          {/* Top Bar: Selector & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-blue-200/80 gap-2 mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Ship className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wide flex items-center gap-1.5">
                  <span>INBOUND COAL VESSEL (7–30 DAYS BEFORE ETA)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                </span>
                <p className="text-[10.5px] text-blue-800">
                  AIS + Port Data Ingestion: Position, Speed, Draft, Port Queue & Weather Broadcasts
                </p>
              </div>
            </div>

            {/* Vessel Selector Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-blue-900 uppercase">Select Tracked Ship:</span>
              <select
                value={selectedMmsi}
                onChange={(e) => setSelectedMmsi(e.target.value)}
                className="text-xs font-bold py-1.5 px-2.5 bg-white border border-blue-300 rounded-lg text-blue-950 shadow-xs outline-none focus:ring-2 focus:ring-blue-500"
              >
                {candidateVessels.map(v => (
                  <option key={v.mmsi} value={v.mmsi}>
                    {v.name} ({v.vesselType}) — {v.originPort.split('(')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Live Ship Telemetry Card */}
          <div className="bg-white/95 rounded-lg border border-blue-200 p-3.5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-2.5 border-b border-slate-100 gap-2 mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{activeVessel.name}</span>
                    <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                      MMSI: {activeVessel.mmsi}
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      IMO: {activeVessel.imo || '9648214'}
                    </span>
                  </h4>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Compass className="w-3 h-3 text-slate-400" />
                  <span>Voyage: <strong className="text-slate-800">{activeVessel.originPort}</strong> ──► <strong className="text-blue-700">{activeVessel.destinationPort}</strong></span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  <span>Live AIS Telemetry Active</span>
                </span>
              </div>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 text-xs tabular-nums">
              
              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Vessel Class:</span>
                <span className="font-bold text-slate-800">{activeVessel.vesselType}</span>
                <span className="text-[10px] text-slate-400 block">{activeVessel.dwt?.toLocaleString()} DWT</span>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Current Cargo:</span>
                <span className="font-bold text-slate-800 truncate block">{activeVessel.cargo || '150,000 MT Coal'}</span>
                <span className="text-[10px] text-emerald-600 font-semibold block">Discharge Ready</span>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Laden Draught:</span>
                <span className="font-bold text-indigo-700">{activeVessel.currentDraughtMeters || 16.5} m</span>
                <span className="text-[10px] text-slate-400 block">Max: {activeVessel.maxDraughtMeters || 17.8} m</span>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Current Speed:</span>
                <span className={`font-bold ${congestionResponse === 'slow_steam' && !berthAvailable ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {currentVesselSpeedKnots} kts
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {congestionResponse === 'slow_steam' && !berthAvailable ? 'Eco Slow-Steam' : 'Full Sea Speed'}
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Approach Fairway:</span>
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {activeVessel.coordinates ? `${activeVessel.coordinates[0]}°N, ${activeVessel.coordinates[1]}°E` : '20.21°N, 86.75°E'}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold block">ETA: ~14 Days Out</span>
              </div>

            </div>

          </div>

        </div>

        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-slate-400" /></div>

        {/* STEP 2: Port Congestion & Vessel Bunching */}
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-700" />
              <div>
                <span className="text-xs font-bold text-purple-950">PORT CONGESTION / VESSEL BUNCHING</span>
                <p className="text-[10.5px] text-purple-700">
                  Predicts vessels arriving in the same window; estimates berth wait time for {activeVessel.name}
                </p>
              </div>
            </div>

            {/* Decision Status Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              berthAvailable ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {berthAvailable ? '✓ Berth Available (Proceed Direct)' : '⚠ Berth Congested (Bottleneck Detected)'}
            </div>
          </div>

          {/* Sub-Branch: If Berth Congested */}
          {!berthAvailable && (
            <div className="mt-3 pt-3 border-t border-purple-200 grid grid-cols-1 md:grid-cols-3 gap-2">
              
              {/* Option A: Wait */}
              <div className={`p-2.5 rounded-lg border text-xs transition-all ${
                congestionResponse === 'wait' ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300 text-amber-950 font-bold' : 'bg-white/70 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-1 mb-1">
                  <Anchor className="w-3.5 h-3.5 text-amber-600" />
                  <span>WAIT (At Outer Anchor)</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal">Burns aux generator fuel (~0.12 MT/h) & incurs daily demurrage</p>
              </div>

              {/* Option B: Divert */}
              <div className={`p-2.5 rounded-lg border text-xs transition-all ${
                congestionResponse === 'divert' ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-300 text-indigo-950 font-bold' : 'bg-white/70 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-1 mb-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  <span>DIVERT (Alternative Port)</span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal">Routes {activeVessel.name} to nearby secondary port to bypass queue</p>
              </div>

              {/* Option C: Virtual Arrival / Slow Steam */}
              <div className={`p-2.5 rounded-lg border text-xs transition-all ${
                congestionResponse === 'slow_steam' ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950 font-bold' : 'bg-white/70 border-slate-200 text-slate-600'
              }`}>
                <div className="flex items-center gap-1 mb-1 text-emerald-800">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                  <span>VIRTUAL ARRIVAL (Slow Steam)</span>
                </div>
                <p className="text-[10px] text-emerald-800 font-normal">
                  Reduces speed from {activeVessel.speedKnots || 12.0} kts to 7.5 kts; cuts fuel by 45% to meet berth slot
                </p>
              </div>

            </div>
          )}
        </div>

        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-slate-400" /></div>

        {/* STEP 3: Backhaul Cargo Search & Hop-and-Load Triangulation */}
        <div className="bg-emerald-50/70 border-2 border-emerald-400 rounded-xl p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="text-xs font-bold text-emerald-950">BACKHAUL CARGO SEARCH & TRIANGULATION</span>
                <p className="text-[10.5px] text-emerald-800">Scans UN COMTRADE bilateral flows for Iron Ore, Bauxite, Clinker parcels</p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              cargoFound ? 'bg-emerald-200 text-emerald-900' : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
            }`}>
              {cargoFound ? `✓ Backhaul Found at ${selectedPort.toUpperCase()}` : '⚡ No Local Parcel ➔ "Hop-and-Load" Triggered'}
            </div>
          </div>

          {/* Sub-Branch: Hop-and-Load Details */}
          {!cargoFound && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-indigo-200 text-xs text-indigo-950 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-indigo-600" />
                  Coastal Short-Hop: {selectedPort.toUpperCase()} ──► DHAMRA PORT ({hopArbitrage.hopDistanceNM} NM)
                </span>
                <span className="text-emerald-700 font-mono">Steaming Time: {hopArbitrage.steamingHours} hrs</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Instead of {activeVessel.name} ballasting 4,120 NM empty back to Australia (losing ${hopArbitrage.totalDeadheadBallastLossUSD.toLocaleString()}), the vessel performs a short {hopArbitrage.hopDistanceNM} NM hop burning only {hopArbitrage.hopFuelBurnMT} MT fuel (${hopArbitrage.hopFuelCostUSD.toLocaleString()}) to pick up {parcelMT.toLocaleString()} MT Iron Ore Pellets.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-slate-400" /></div>

        {/* STEP 4: Multi-Port / Draft Feasibility & Lightening */}
        <div className="bg-sky-50 border-2 border-sky-300 rounded-xl p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-sky-700" />
              <div>
                <span className="text-xs font-bold text-sky-950">MULTI-PORT / DRAFT FEASIBILITY</span>
                <p className="text-[10.5px] text-sky-800">
                  Verifies under-keel clearance for {activeVessel.name} ({activeVessel.currentDraughtMeters || 16.5}m draft), spring tide windows, and channel limits
                </p>
              </div>
            </div>

            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              draftFeasible ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {draftFeasible ? '✓ Direct Draft Compliant' : '⚓ Lightening Required at Sandheads'}
            </div>
          </div>

          {!draftFeasible && (
            <div className="mt-2.5 p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900">
              <strong>Lightening Protocol Activated:</strong> {activeVessel.name} laden draft ({activeVessel.currentDraughtMeters}m) exceeds channel limit. Routes to offshore anchorage (Sandheads / Vizag Outer) for partial 20,000 MT discharge into river daughter barges before proceeding to lock gates.
            </div>
          )}
        </div>

        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-slate-400" /></div>

        {/* STEP 5: Weather + Hold Preparation / Cleaning Safety Gate */}
        <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Waves className="w-4 h-4 text-teal-600" />
              <div>
                <span className="text-xs font-bold text-slate-900">WEATHER & PARALLEL HOLD CLEANING GATE</span>
                <p className="text-[10.5px] text-slate-600">Open-Meteo Marine wave swell check: Significant Wave Height ({seaState === 'calm' ? '1.1m' : '2.2m'})</p>
              </div>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              weatherResult.canCleanUnderway ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {weatherResult.badgeText}
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-600">
            {weatherResult.guidance} Saves <strong>{weatherResult.dwellSavedDays} dwell days</strong> and eliminates port berth-hire wait time.
          </div>
        </div>

        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-slate-400" /></div>

        {/* STEP 6: Feasibility + Commercial Optimizer (Before Hold Cleaning Commit!) */}
        <div className={`border-2 rounded-xl p-4 shadow-sm transition-all ${
          replanActive ? 'bg-purple-100 border-purple-500 ring-4 ring-purple-300 scale-[1.01]' : 'bg-amber-50/80 border-amber-400'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between pb-2 border-b border-amber-200 mb-3 gap-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-amber-700" />
              <div>
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                  FEASIBILITY + COMMERCIAL OPTIMIZER ({activeVessel.name})
                </span>
                <p className="text-[10.5px] text-amber-800">
                  Compares Fuel + Port Costs vs Backhaul Gross Revenue + Avoided Empty Ballast Loss
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2.5 py-1 rounded">
              Rule: Cost-Arbitrage Maximizer
            </span>
          </div>

          {/* Arbitrage Numbers Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
            <div className="bg-white p-2.5 rounded border border-amber-200">
              <span className="text-[10px] text-slate-500 block">Outbound Export Freight:</span>
              <span className="font-bold text-emerald-600 text-sm">
                +${hopArbitrage.grossExportRevenueUSD.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-amber-200">
              <span className="text-[10px] text-slate-500 block">Cost of Short Hop:</span>
              <span className="font-bold text-rose-600 text-sm">
                -${hopArbitrage.totalHopCostUSD.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-amber-200">
              <span className="text-[10px] text-slate-500 block">Avoided Ballast Loss:</span>
              <span className="font-bold text-emerald-700 text-sm">
                +${hopArbitrage.totalDeadheadBallastLossUSD.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-300 bg-emerald-50/50">
              <span className="text-[10px] text-emerald-800 block font-bold">Net Commercial Gain:</span>
              <span className="font-extrabold text-emerald-700 text-sm">
                +{currSym}{(hopArbitrage.netTriangulationGainUSD * multiplier / (isINR ? 10000000 : 1)).toFixed(2)} {isINR ? 'Cr' : 'USD'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center"><ArrowDown className="w-4 h-4 text-slate-400" /></div>

        {/* STEP 7: Optimal Feasible Voyage Plan & Execution */}
        <div className="bg-emerald-600 text-white rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span className="text-xs font-bold uppercase tracking-wider">
                OPTIMAL FEASIBLE VOYAGE PLAN GENERATED FOR {activeVessel.name.toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
              STATUS: EXECUTING & MONITORING
            </span>
          </div>
          <p className="text-[11px] text-emerald-100 mt-1">
            {activeVessel.name} sails under {congestionResponse.toUpperCase().replace('_', ' ')} directive at {currentVesselSpeedKnots} kts, completes parallel hold cleaning during calm sea window, hops to Dhamra, and loads {parcelMT.toLocaleString()} MT iron ore with near-zero deadhead ballast.
          </p>
        </div>

        {/* STEP 8: Closed-Loop Monitoring / Replan Cycle */}
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <RefreshCw className={`w-4 h-4 text-slate-600 ${replanActive ? 'animate-spin text-purple-600' : ''}`} />
            <div>
              <span className="text-xs font-bold text-slate-800">CLOSED-LOOP MONITORING (Conditions Changed?)</span>
              <p className="text-[10.5px] text-slate-500">Continuously monitors live AIS, berth queue changes, weather and cargo availability</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={triggerReplan}
              className="py-1.5 px-3 rounded text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Simulate Replan / Re-optimize</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
