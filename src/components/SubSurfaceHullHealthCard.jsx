import React, { useState, useMemo } from 'react';
import { 
  Anchor, Gauge, AlertTriangle, ShieldAlert, CheckCircle2, 
  Flame, TrendingUp, Sparkles, Compass, ArrowRight, ShieldCheck, DollarSign
} from 'lucide-react';
import { calculateHullHealth, BIOFOULING_STAGES } from '../utils/subSurfaceHullEngine';

export default function SubSurfaceHullHealthCard({ 
  currency = 'INR', 
  defaultDays = 8,
  onTriggerDiversion = null 
}) {
  const [idleDays, setIdleDays] = useState(defaultDays);
  const [portStrictness, setPortStrictness] = useState('HIGH'); // 'HIGH', 'MODERATE', 'LENIENT'
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;
  const currSym = isINR ? '₹' : '$';

  const metrics = useMemo(() => {
    return calculateHullHealth({
      idleDays,
      vesselDailyFuelMT: 32.0,
      vlsfoPriceUSDPerMT: 620,
      destinationPortStrictness: portStrictness
    });
  }, [idleDays, portStrictness]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>The Crisis Below the Waterline: Hull Health & Sub-Surface Drag Estimator</span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Grounded in Biological Invasions (UMCES July 2026) & Neptune Robotics • 100% Software Algorithmic Modeling
          </p>
        </div>

        <span className="text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded">
          IMO 30-Day Safety Cap Engine
        </span>
      </div>

      {/* Interactive Slider Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Anchor className="w-3.5 h-3.5 text-slate-600" />
            <span>Simulate Vessel Days at Anchor / Idle Turnaround:</span>
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
              {idleDays} Days Idle
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              idleDays < 10 ? 'bg-emerald-100 text-emerald-800' :
              idleDays < 20 ? 'bg-teal-100 text-teal-800' :
              idleDays < 25 ? 'bg-amber-100 text-amber-800' :
              idleDays < 30 ? 'bg-orange-100 text-orange-900' : 'bg-rose-600 text-white animate-pulse'
            }`}>
              {metrics.currentStage.severity}
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="45"
          step="1"
          value={idleDays}
          onChange={(e) => setIdleDays(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
          <span>0d (Clean)</span>
          <span>10d (Slime)</span>
          <span>20d (Shells)</span>
          <span className="text-amber-600 font-bold">25d (IMO Warning)</span>
          <span className="text-rose-600 font-bold">30d (IMO Cap Breached)</span>
          <span>45d</span>
        </div>
      </div>

      {/* IMO 30-Day Alert Banner */}
      {metrics.isImoCapTriggered && (
        <div className={`p-3 rounded-lg border text-xs mb-4 flex items-start space-x-3 ${
          metrics.isImoCapBreached 
            ? 'bg-rose-50 border-rose-300 text-rose-900' 
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}>
          <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${metrics.isImoCapBreached ? 'text-rose-600' : 'text-amber-600'}`} />
          <div className="flex-1">
            <div className="font-bold uppercase text-[11px] tracking-wide flex items-center justify-between">
              <span>
                {metrics.isImoCapBreached 
                  ? 'CRITICAL ALERT: IMO 30-Day Biofouling Threshold Breached!' 
                  : 'WARNING: Approaching IMO 30-Day Intervention Cap (Day 25+)'}
              </span>
              <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded font-mono">
                BIO-SPREADER RISK
              </span>
            </div>
            <p className="text-[11px] mt-0.5 leading-snug">
              Commercial ships are designed to spend only 1–3 days at port. Idle anchorage in warm Bay of Bengal waters causes rapid colonization. 
              {metrics.isImoCapBreached 
                ? ' Hull has reached Stage 4 Super-Spreader status. Mandatory hull cleaning required prior to trans-oceanic passage.' 
                : ' Recommendation: Trigger automatic rerouting to secondary employment loop or nearby in-water hull grooming station.'}
            </p>
          </div>
        </div>
      )}

      {/* Metrics Dashboard Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums mb-4">
        
        {/* Metric 1: Hydrodynamic Drag */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center justify-between">
            <span>Hydrodynamic Drag</span>
            <Gauge className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-rose-600">
            +{metrics.dragPenaltyPct}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Frictional resistance increase
          </div>
        </div>

        {/* Metric 2: Extra Daily Fuel Burn */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center justify-between">
            <span>Extra Fuel Burn</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            +{metrics.extraFuelMTPerDay} <span className="text-xs font-normal text-slate-500">MT/day</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            +${metrics.extraFuelUSDPerDay.toLocaleString()}/day wasted
          </div>
        </div>

        {/* Metric 3: 14-Day Voyage Loss */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center justify-between">
            <span>Return Voyage Penalty</span>
            <DollarSign className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-600">
            {currSym}{(metrics.voyageFuelPenaltyUSD * multiplier / (isINR ? 100000 : 1)).toFixed(1)} {isINR ? 'Lakhs' : 'USD'}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Excess bunker cost on 14d transit
          </div>
        </div>

        {/* Metric 4: Port Compliance Vector */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="text-slate-500 text-[10px] font-bold uppercase mb-1 flex items-center justify-between">
            <span>Port Rejection Risk</span>
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className={`text-xl font-bold ${
            metrics.rejectionRiskPct >= 25 ? 'text-rose-600' :
            metrics.rejectionRiskPct >= 12 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {metrics.rejectionRiskPct}% Risk
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Strict biosecurity destination
          </div>
        </div>

      </div>

      {/* Stage Progression Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
        <div className="font-bold text-slate-700 text-[11px] mb-1.5 flex items-center justify-between">
          <span>Active Biofouling Stage: <strong className="text-slate-900">{metrics.currentStage.stage}</strong></span>
          <span className="font-mono text-slate-500 text-[10px]">Hull Health: {metrics.hullHealthScore}/100</span>
        </div>
        <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
          {metrics.currentStage.description}
        </p>

        {/* Multi-step progress visualizer */}
        <div className="grid grid-cols-5 gap-1 text-center font-mono text-[9.5px]">
          {BIOFOULING_STAGES.map((s, idx) => {
            const isCurrent = metrics.currentStage.stage === s.stage;
            const isPassed = idleDays > s.maxDays;
            return (
              <div 
                key={idx}
                className={`py-1 px-0.5 rounded border transition-all ${
                  isCurrent 
                    ? 'bg-rose-600 text-white font-bold shadow-xs' 
                    : isPassed 
                      ? 'bg-rose-100 text-rose-800 border-rose-200' 
                      : 'bg-white text-slate-400 border-slate-200'
                }`}
              >
                <div>Stage {idx}</div>
                <div className="text-[8.5px] opacity-90">{s.severity}</div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
