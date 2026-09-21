import React, { useState, useMemo, useEffect } from 'react';
import { 
  Ship, Anchor, Compass, ArrowDown, ArrowRight, RefreshCw, 
  CheckCircle2, AlertTriangle, Wind, Waves, Sparkles, DollarSign,
  Layers, ShieldAlert, Cpu, Gauge, Zap, Check, MapPin, Navigation, Radio,
  UserCheck, Sliders, Info, RotateCcw
} from 'lucide-react';
import { calculateHopAndLoadArbitrage, evaluateHoldCleaningWeather } from '../utils/subSurfaceHullEngine';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { PORT_CONGESTION_STATUS } from '../data/weatherCongestionData';
import { fetchLiveBayOfBengalWeather } from '../services/imdWeatherService';

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
      if (unique.length >= 10) break;
    }
    return unique.length > 0 ? unique : LIVE_AIS_VESSELS.slice(0, 10);
  }, [selectedPort]);

  const [selectedMmsi, setSelectedMmsi] = useState(
    candidateVessels[1]?.mmsi || candidateVessels[0]?.mmsi || '563112000'
  );

  const activeVessel = candidateVessels.find(v => v.mmsi === selectedMmsi) || candidateVessels[0] || LIVE_AIS_VESSELS[1];

  // Destination port references & ground-truth metrics
  const destPortId = activeVessel?.destinationId || selectedPort || 'paradip';
  const portData = PORT_CONGESTION_STATUS[destPortId] || PORT_CONGESTION_STATUS.paradip;
  const portInfo = INDIAN_EAST_COAST_PORTS[destPortId] || INDIAN_EAST_COAST_PORTS.paradip;

  // Live Marine Weather Telemetry State
  const [liveWeather, setLiveWeather] = useState(null);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    async function loadMarineTelemetry() {
      setIsFetchingWeather(true);
      try {
        const weather = await fetchLiveBayOfBengalWeather(destPortId);
        if (!isCancelled) setLiveWeather(weather);
      } catch (err) {
        console.warn('Marine weather telemetry fallback:', err);
      } finally {
        if (!isCancelled) setIsFetchingWeather(false);
      }
    }
    loadMarineTelemetry();
    return () => { isCancelled = true; };
  }, [destPortId]);

  // Track Manager Manual Overrides per toggle (IMO Human-in-the-Loop)
  const [userOverrides, setUserOverrides] = useState({});

  // Dynamic Telemetry Evaluations for Active Vessel & Destination
  const autoEvaluations = useMemo(() => {
    // 1. Berth Congestion Evaluation
    const isAtBerth = Boolean(activeVessel?.status?.toLowerCase().includes('berth'));
    const isAtAnchor = Boolean(activeVessel?.status?.toLowerCase().includes('anchor'));
    const queueWaitDays = portData?.avgAnchorageWaitDays || 2.5;
    const shipsInQueue = portData?.vesselsAtAnchor || 5;
    const autoBerth = isAtBerth ? true : (queueWaitDays < 2.0 && shipsInQueue < 5 && !isAtAnchor);
    const berthReason = isAtBerth
      ? 'Vessel already secured at berth'
      : (!autoBerth
          ? `Bottleneck: ${shipsInQueue} ships waiting (${queueWaitDays}d wait)`
          : `Direct entry: Berth available (${shipsInQueue} waiting, ${queueWaitDays}d wait)`);

    // 2. Congestion Strategy (Demurrage & Fuel Driven)
    const dailyDemurrageINR = portData?.demurrageDailyExposureINR || 6500000;
    const totalDemurrageLakhs = Math.round((queueWaitDays * dailyDemurrageINR) / 100000);
    const vesselSpeed = Number(activeVessel?.speedKnots || 0);
    let autoAction = 'slow_steam';
    let actionReason = '';

    if (vesselSpeed > 2.0 || (activeVessel?.etaHours && activeVessel.etaHours > 12)) {
      autoAction = 'slow_steam';
      actionReason = `Virtual Arrival (7.5 kts): Saves ₹23.4L fuel & avoids ₹${totalDemurrageLakhs}L demurrage`;
    } else if (queueWaitDays >= 4.0 || portData?.congestionStatus === 'HIGH') {
      autoAction = 'divert';
      actionReason = `Severe queue (${queueWaitDays}d wait = ₹${(totalDemurrageLakhs/100).toFixed(2)} Cr loss): Divert to deepwater Dhamra/Gangavaram`;
    } else {
      autoAction = 'wait';
      actionReason = `Hold at Outer Anchorage (~${queueWaitDays}d wait; ₹${totalDemurrageLakhs}L demurrage risk)`;
    }

    // 3. Backhaul At Berth (Local Cargo vs Coastal Hop & Load)
    const isCapesize = Boolean(activeVessel?.vesselType?.toLowerCase().includes('cape'));
    const hasLocalBackhaul = (destPortId === 'dhamra' || destPortId === 'vizag') && !isCapesize;
    const backhaulReason = hasLocalBackhaul
      ? `Local export fixture ready at ${portInfo?.name || destPortId.toUpperCase()}`
      : `No local fixture; Coastal Hop to ${destPortId === 'dhamra' ? 'PARADIP' : 'DHAMRA'} unlocks +₹1.42 Cr arbitrage`;

    // 4. Port Draft Fit (Channel Under-Keel Clearance vs Lightening)
    const currentDraft = Number(activeVessel?.currentDraughtMeters || activeVessel?.maxDraughtMeters || 16.5);
    const maxSafeDraft = Number(portInfo?.maxDraftHighTide || portInfo?.maxDraftLaden || 16.0);
    const autoDraft = currentDraft <= maxSafeDraft;
    const draftReason = autoDraft
      ? `Compliant Draft: ${currentDraft.toFixed(1)}m <= ${maxSafeDraft.toFixed(1)}m max high-tide depth`
      : `Draft Exceeded: ${currentDraft.toFixed(1)}m > ${maxSafeDraft.toFixed(1)}m. Lighten at Sandheads required`;

    // 5. Marine Weather (Open-Meteo & IMD Significant Wave Height)
    const waveM = liveWeather?.waveHeightMeters !== undefined ? liveWeather.waveHeightMeters : (destPortId === 'haldia' ? 2.3 : 1.2);
    const windK = liveWeather?.windSpeedKnots !== undefined ? liveWeather.windSpeedKnots : (destPortId === 'haldia' ? 24 : 14);
    const isRoughSea = waveM > 1.8 || windK > 22;
    const autoSea = isRoughSea ? 'rough' : 'calm';
    const weatherReason = isRoughSea
      ? `Rough Swell: Wave ${waveM.toFixed(1)}m (>1.8m) & ${windK} kts wind. Hold cleaning deferred to berth`
      : `Calm Swell: Wave ${waveM.toFixed(1)}m (<1.8m) & ${windK} kts wind. Parallel hold cleaning approved underway`;

    // 6. Dynamic Shock
    const hasShock = Boolean((liveWeather?.severity && liveWeather.severity !== 'NORMAL') || (portData?.trafficRiskScore >= 75));
    const shockReason = hasShock
      ? `Shock Alert: Active ${liveWeather?.stage || 'Squall Alert'} / Port Congestion Index ${portData?.trafficRiskScore || 75}`
      : `Normal synoptic conditions; standard planned voyage passage`;

    return {
      autoBerth,
      berthReason,
      autoAction,
      actionReason,
      totalDemurrageLakhs,
      dailyDemurrageINR,
      hasLocalBackhaul,
      backhaulReason,
      autoDraft,
      draftReason,
      currentDraft,
      maxSafeDraft,
      autoSea,
      weatherReason,
      waveM,
      windK,
      hasShock,
      shockReason
    };
  }, [activeVessel, destPortId, portData, portInfo, liveWeather]);

  // Interactive Simulation State
  const [berthAvailable, setBerthAvailable] = useState(autoEvaluations.autoBerth);
  const [congestionResponse, setCongestionResponse] = useState(autoEvaluations.autoAction); // 'wait', 'divert', 'slow_steam'
  const [cargoFound, setCargoFound] = useState(autoEvaluations.hasLocalBackhaul); // true: local cargo, false: hop-and-load
  const [draftFeasible, setDraftFeasible] = useState(autoEvaluations.autoDraft);
  const [seaState, setSeaState] = useState(autoEvaluations.autoSea); // 'calm' (wave < 1.3m), 'rough' (wave > 1.8m)
  const [conditionsChanged, setConditionsChanged] = useState(autoEvaluations.hasShock);
  const [replanActive, setReplanActive] = useState(false);

  // When active vessel switches, automatically synchronize all toggles to that vessel's dynamic telemetry!
  useEffect(() => {
    setUserOverrides({});
    setBerthAvailable(autoEvaluations.autoBerth);
    setCongestionResponse(autoEvaluations.autoAction);
    setCargoFound(autoEvaluations.hasLocalBackhaul);
    setDraftFeasible(autoEvaluations.autoDraft);
    setSeaState(autoEvaluations.autoSea);
    setConditionsChanged(autoEvaluations.hasShock);
  }, [selectedMmsi, autoEvaluations]);

  // Manager Manual Override Helpers
  const handleToggle = (key, setter, value) => {
    setter(value);
    setUserOverrides(prev => ({ ...prev, [key]: true }));
  };

  const handleResetToAuto = () => {
    setUserOverrides({});
    setBerthAvailable(autoEvaluations.autoBerth);
    setCongestionResponse(autoEvaluations.autoAction);
    setCargoFound(autoEvaluations.hasLocalBackhaul);
    setDraftFeasible(autoEvaluations.autoDraft);
    setSeaState(autoEvaluations.autoSea);
    setConditionsChanged(autoEvaluations.hasShock);
  };

  const overrideCount = Object.keys(userOverrides).length;

  const isINR = currency === 'INR';
  const multiplier = isINR ? 95.0 : 1;
  const currSym = isINR ? '₹' : '$';

  // Weather evaluation based on selected sea state
  const weatherResult = useMemo(() => {
    const waveHeightM = seaState === 'calm'
      ? (autoEvaluations.waveM <= 1.8 ? autoEvaluations.waveM : 1.1)
      : (autoEvaluations.waveM > 1.8 ? autoEvaluations.waveM : 2.2);
    const windSpeedKts = seaState === 'calm'
      ? Math.min(18, autoEvaluations.windK)
      : Math.max(22, autoEvaluations.windK);

    return evaluateHoldCleaningWeather({
      waveHeightM,
      windSpeedKts
    });
  }, [seaState, autoEvaluations.waveM, autoEvaluations.windK]);

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

      {/* Interactive Scenario Control Bar with Live Telemetry Auto-Detection & Manager Override */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mb-6">
        
        {/* Top Control Bar Header with Telemetry Summary & Re-sync */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <span>Interactive "What-If" Sandbox & Logistics Manager Dashboard</span>
                {overrideCount > 0 ? (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-amber-700" /> {overrideCount} Manual Override{overrideCount > 1 ? 's' : ''} Active
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-700" /> 100% Synced to Ship Telemetry
                  </span>
                )}
              </span>
              <p className="text-[10.5px] text-slate-500">
                Toggles auto-evaluate dynamically on ship selection. Port manager retains full IMO operational override authority.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start md:self-auto">
            {overrideCount > 0 && (
              <button
                type="button"
                onClick={handleResetToAuto}
                className="py-1 px-2.5 rounded text-[10.5px] font-bold bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 shadow-2xs flex items-center gap-1 cursor-pointer transition-all"
                title="Restore all toggles to live AIS and marine telemetry recommendations"
              >
                <RotateCcw className="w-3 h-3 text-indigo-600" />
                <span>Re-sync to Live Telemetry</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Operational Telemetry Snapshot Banner */}
        <div className="bg-white/80 border border-slate-200 rounded p-2 mb-3 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Vessel Profile</span>
            <strong className="text-slate-800 truncate block">{activeVessel.name}</strong>
            <span className="text-[10px] text-slate-500">{activeVessel.vesselType} • {activeVessel.currentDraughtMeters || 16.5}m Draft</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Dest Queue & Wait</span>
            <strong className="text-purple-700 block">{portInfo.name}</strong>
            <span className="text-[10px] text-slate-500">{portData.vesselsAtAnchor} ships waiting • ~{portData.avgAnchorageWaitDays}d wait</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Live Marine Weather</span>
            <strong className={`${autoEvaluations.autoSea === 'rough' ? 'text-rose-600' : 'text-emerald-700'} block flex items-center gap-1`}>
              <Waves className="w-3 h-3" /> Wave: {autoEvaluations.waveM.toFixed(1)}m • {autoEvaluations.windK} kts
            </strong>
            <span className="text-[10px] text-slate-500">{liveWeather?.stage || 'Synoptic State'} {isFetchingWeather ? '(fetching...)' : ''}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Demurrage Exposure</span>
            <strong className="text-rose-700 block">₹{autoEvaluations.totalDemurrageLakhs} Lakhs</strong>
            <span className="text-[10px] text-slate-500">Rate: ₹{(autoEvaluations.dailyDemurrageINR / 100000).toFixed(0)}L/day wait</span>
          </div>
        </div>

        {/* The 6 Dynamic Toggles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 text-xs">
          
          {/* Toggle 1: Berth Congestion */}
          <div className="bg-white p-2 rounded border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">1. Berth Status</label>
                <span className={`text-[9px] font-semibold px-1 rounded ${userOverrides.berth ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                  {userOverrides.berth ? 'Override' : 'AI Auto'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => handleToggle('berth', setBerthAvailable, true)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    berthAvailable ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Available
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('berth', setBerthAvailable, false)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    !berthAvailable ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Congested
                </button>
              </div>
            </div>
            <p className="text-[9.5px] text-slate-500 leading-tight border-t border-slate-100 pt-1">
              {autoEvaluations.berthReason}
            </p>
          </div>

          {/* Toggle 2: Congestion Strategy (if congested) */}
          <div className={`bg-white p-2 rounded border flex flex-col justify-between transition-all ${berthAvailable ? 'opacity-40 pointer-events-none' : 'border-slate-200'}`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">2. Congestion Action</label>
                <span className={`text-[9px] font-semibold px-1 rounded ${userOverrides.congestion ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                  {userOverrides.congestion ? 'Override' : 'AI Suggest'}
                </span>
              </div>
              <select
                value={congestionResponse}
                onChange={(e) => handleToggle('congestion', setCongestionResponse, e.target.value)}
                className="w-full text-[10px] font-bold p-1 bg-slate-50 border border-slate-200 rounded text-slate-800 outline-none mb-1.5"
              >
                <option value="slow_steam">Virtual Arrival (Slow Steam)</option>
                <option value="wait">Wait (At Outer Anchor)</option>
                <option value="divert">Divert (Alternative Port)</option>
              </select>
            </div>
            <p className="text-[9.5px] text-emerald-700 font-medium leading-tight border-t border-slate-100 pt-1 truncate" title={autoEvaluations.actionReason}>
              {autoEvaluations.actionReason}
            </p>
          </div>

          {/* Toggle 3: Export Cargo Search */}
          <div className="bg-white p-2 rounded border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">3. Backhaul At Berth?</label>
                <span className={`text-[9px] font-semibold px-1 rounded ${userOverrides.backhaul ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                  {userOverrides.backhaul ? 'Override' : 'AI Auto'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => handleToggle('backhaul', setCargoFound, true)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    cargoFound ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Local Cargo
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('backhaul', setCargoFound, false)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    !cargoFound ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Hop & Load
                </button>
              </div>
            </div>
            <p className="text-[9.5px] text-slate-500 leading-tight border-t border-slate-100 pt-1 truncate" title={autoEvaluations.backhaulReason}>
              {autoEvaluations.backhaulReason}
            </p>
          </div>

          {/* Toggle 4: Draft Feasibility */}
          <div className="bg-white p-2 rounded border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">4. Port Draft Fit</label>
                <span className={`text-[9px] font-semibold px-1 rounded ${userOverrides.draft ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                  {userOverrides.draft ? 'Override' : 'AI Auto'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => handleToggle('draft', setDraftFeasible, true)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    draftFeasible ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('draft', setDraftFeasible, false)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    !draftFeasible ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Lighten
                </button>
              </div>
            </div>
            <p className="text-[9.5px] text-slate-500 leading-tight border-t border-slate-100 pt-1 truncate" title={autoEvaluations.draftReason}>
              {autoEvaluations.draftReason}
            </p>
          </div>

          {/* Toggle 5: Marine Swell State */}
          <div className="bg-white p-2 rounded border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">5. Marine Weather</label>
                <span className={`text-[9px] font-semibold px-1 rounded ${userOverrides.weather ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                  {userOverrides.weather ? 'Override' : 'AI Live'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => handleToggle('weather', setSeaState, 'calm')}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    seaState === 'calm' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Calm (&lt;1.8m)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle('weather', setSeaState, 'rough')}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    seaState === 'rough' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Rough (&gt;1.8m)
                </button>
              </div>
            </div>
            <p className="text-[9.5px] text-slate-500 leading-tight border-t border-slate-100 pt-1 truncate" title={autoEvaluations.weatherReason}>
              {autoEvaluations.weatherReason}
            </p>
          </div>

          {/* Toggle 6: Condition Changed / Closed Loop */}
          <div className="bg-white p-2 rounded border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">6. Dynamic Shock?</label>
                <span className={`text-[9px] font-semibold px-1 rounded ${userOverrides.shock ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-700'}`}>
                  {userOverrides.shock ? 'Override' : 'AI Alert'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => handleToggle('shock', setConditionsChanged, false)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    !conditionsChanged ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleToggle('shock', setConditionsChanged, true);
                    triggerReplan();
                  }}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    conditionsChanged ? 'bg-purple-600 text-white shadow-xs animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Shock Replan
                </button>
              </div>
            </div>
            <p className="text-[9.5px] text-purple-700 font-medium leading-tight border-t border-slate-100 pt-1 truncate" title={autoEvaluations.shockReason}>
              {autoEvaluations.shockReason}
            </p>
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
                  {currentVesselSpeedKnots <= 1.0 
                    ? 'At Anchor / Drifting' 
                    : (congestionResponse === 'slow_steam' && !berthAvailable ? 'Eco Slow-Steam' : 'Full Sea Speed')}
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded border border-slate-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Approach Fairway:</span>
                <span className="font-mono text-[11px] font-bold text-slate-700">
                  {activeVessel.coordinates ? `${activeVessel.coordinates[0]}°N, ${activeVessel.coordinates[1]}°E` : '20.21°N, 86.75°E'}
                </span>
                <span className={`text-[10px] font-semibold block ${currentVesselSpeedKnots <= 1.0 ? 'text-amber-700' : 'text-indigo-600'}`}>
                  {currentVesselSpeedKnots <= 1.0 ? 'At Anchorage (Queue Pos #1)' : 'ETA: ~14 Days Out'}
                </span>
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
