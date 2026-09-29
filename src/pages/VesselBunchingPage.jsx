import React, { useState } from 'react';
import VesselBunchingTerminal from '../components/VesselBunchingTerminal';
import { AlertTriangle, Clock, ShieldCheck, CheckCircle2, RefreshCw, Ship, ArrowRight } from 'lucide-react';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';

export default function VesselBunchingPage({
  selectedDestination,
  setSelectedDestination,
  currency
}) {
  const [criticalStockpileDays, setCriticalStockpileDays] = useState(5.8);
  const [ceaRedFlag, setCeaRedFlag] = useState(true);
  const [anchorageWaitHours, setAnchorageWaitHours] = useState(38);

  const isEmergencyActive = criticalStockpileDays < 7 || ceaRedFlag;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <RefreshCw className="w-4 h-4" />
            <span>Anti-Congestion & Queue Optimization</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vessel Bunching Engine & Emergency Coal Priority
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Predicting 48h–72h anchorage bunching, CEA thermal power stockpile monitoring (&lt;7 days red flag), and anti-congestion virtual arrival pacing.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Tier-1 ETA Geofence: ACTIVE</span>
          </span>
        </div>
      </div>

      {/* Architecture Flow Box: 2-3 Days Out Decision Logic */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
        <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
          <span className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            Vessel Bunching & Emergency Coal Decision Flow (2–3 Days Out)
          </span>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
            STAGE 2 DECISION PROTOCOL
          </span>
        </div>

        {/* 3 Steps Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Step 1: Tier-1 Arrival ETA */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-800 mb-1">Step 2.1 • Bay of Bengal Ingress</div>
            <div className="text-lg font-black text-slate-900 my-1">TIER-1 ARRIVAL ETA</div>
            <div className="text-xs font-bold text-amber-700 bg-white px-2 py-1 rounded border border-amber-200 inline-block my-1">
              48h – 72h / 2–3 Days Out
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Vessel cruising speed calibrated via satellite AIS tracking entering Indian exclusive maritime EEZ zone.
            </p>
          </div>

          {/* Flow Arrow */}
          <div className="hidden md:flex justify-center text-amber-400">
            <ArrowRight className="w-6 h-6 stroke-[3]" />
          </div>

          {/* Step 2: Tier-1 Congestion Alert */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-800 mb-1">Step 2.2 • Berth Occupancy Alarm</div>
            <div className="text-lg font-black text-rose-600 my-1 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>CONGESTION ALERT</span>
            </div>
            <div className="text-xs font-bold text-rose-800 bg-white px-2 py-1 rounded border border-rose-200 inline-block my-1">
              Anchorage Wait &gt; {anchorageWaitHours} Hours
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              Waiting time exceeds economic demurrage threshold at {INDIAN_EAST_COAST_PORTS[selectedDestination]?.name || 'destination port'}.
            </p>
          </div>

        </div>

        {/* Decision Diamond: Critical Stockpile < 7 Days / CEA Red Flag */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Emergency Coal Priority Factor Decision Gate
              </span>
              <p className="text-[11px] text-slate-500">
                CEA Red Flag triggers if thermal power station or blast furnace has &lt;7 days operational coal reserve.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 font-semibold">Current Sim Stockpile:</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                isEmergencyActive ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {criticalStockpileDays} Days ({ceaRedFlag ? 'CEA RED FLAG' : 'CEA NORMAL'})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Condition YES: Emergency Coal Priority */}
            <div className={`p-4 rounded-xl border transition-all ${
              isEmergencyActive 
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/30' 
                : 'bg-white border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-rose-800 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  IF YES: Critical Stockpile &lt; 7 Days
                </span>
                <span className="text-[10px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded">
                  PRIORITY BERTH
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Emergency Coal Priority Activated</h4>
              <p className="text-xs text-slate-600 mt-1">
                Port authority overrides standard queue. Vessel assigned immediate emergency pilot boarding and fast-tracked to mechanized discharge berth.
              </p>
            </div>

            {/* Condition NO: Maintain FIFO Berthing */}
            <div className={`p-4 rounded-xl border transition-all ${
              !isEmergencyActive 
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30' 
                : 'bg-white border-slate-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-700 uppercase flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-500" />
                  IF NO: Stockpile &ge; 7 Days
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                  STANDARD FIFO
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Maintain FIFO Berthing</h4>
              <p className="text-xs text-slate-600 mt-1">
                Standard first-in, first-out line-up maintained. Virtual arrival algorithm instructs vessel to adjust cruising speed by -1.5 knots, saving bunker fuel.
              </p>
            </div>

          </div>

          {/* Interactive Toggle Controls */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-500 text-[11px]">Interactive Decision Simulator:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setCriticalStockpileDays(4.2); setCeaRedFlag(true); }}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-all ${
                  criticalStockpileDays < 7 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Simulate &lt; 7 Days Red Flag (Crisis)
              </button>
              <button
                onClick={() => { setCriticalStockpileDays(12.0); setCeaRedFlag(false); }}
                className={`px-3 py-1 rounded text-xs font-bold cursor-pointer transition-all ${
                  criticalStockpileDays >= 7 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Simulate Normal Reserve (12 Days)
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Live Port Queue & Actionable Speed Directives Console */}
      <VesselBunchingTerminal
        selectedDestination={selectedDestination}
        onSelectPort={(portId) => setSelectedDestination(portId)}
      />

    </div>
  );
}
