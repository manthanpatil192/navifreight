import React, { useState } from 'react';
import { 
  Calendar, Zap, AlertOctagon, ShieldCheck, TrendingDown, TrendingUp, 
  ArrowRight, Clock, Compass, DollarSign, ShieldAlert, CheckCircle2, 
  AlertTriangle, Flame, Layers, Sparkles, Filter
} from 'lucide-react';
import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';

export default function CharterTimingDecisionMatrix({
  selectedOrigin = 'hay_point',
  selectedDestination = 'paradip',
  selectedVessel = 'capesize',
  cargoVolumeMT = 90000,
  contractHorizonMonths = 3,
  onSelectHorizon,
  currency = 'INR'
}) {
  const isINR = currency === 'INR';
  const baseFxRate = 86.50;

  // Local simulated volume state if user tests different parcel sizes
  const [activeVolume, setActiveVolume] = useState(cargoVolumeMT);

  // Sync with prop when parent updates
  React.useEffect(() => {
    setActiveVolume(cargoVolumeMT);
  }, [cargoVolumeMT]);

  const originObj = ORIGIN_LOADING_PORTS[selectedOrigin] || { name: 'Hay Point (Australia)', distanceToEastCoastNM: 4120 };
  const destObj = INDIAN_EAST_COAST_PORTS[selectedDestination] || { name: 'Paradip Port (Odisha)', maxDraftLaden: 16.0, avgWaitDays: 2.5 };
  const vesselObj = VESSEL_CLASSES[selectedVessel] || { name: 'Capesize', dwt: 180000, demurrageRatePerDayUSD: 25000 };

  // Base freight matrix
  const routeKey = `${selectedOrigin}-${selectedDestination}`;
  const baseRateMatrix = {
    'hay_point-paradip': 15.80, 'hay_point-dhamra': 15.40, 'hay_point-vizag': 16.20, 'hay_point-gangavaram': 16.10,
    'gladstone-paradip': 16.00, 'gladstone-dhamra': 15.60, 'gladstone-vizag': 16.40, 'gladstone-gangavaram': 16.30,
    'richards_bay-paradip': 14.20, 'richards_bay-dhamra': 13.90, 'richards_bay-vizag': 14.80,
    'hampton_roads-paradip': 32.50, 'hampton_roads-dhamra': 32.00, 'hampton_roads-vizag': 32.80,
    'maputo-paradip': 13.60, 'samarinda-paradip': 8.90, 'taboneo-paradip': 8.60, 'taboneo-krishnapatnam': 8.30
  };
  const baseSpotRate = baseRateMatrix[routeKey] || 15.80;

  // Compute forward horizons (1-Month Spot, 3-Month COA, 6-Month COA)
  const horizonsData = [
    {
      id: 1,
      name: '1-Month Spot Chartering',
      tag: 'HIGH RISK / REACTIVE',
      badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
      borderCls: 'border-rose-300 hover:border-rose-400',
      activeBorderCls: 'border-rose-500 ring-2 ring-rose-500/20',
      headerBg: 'bg-gradient-to-r from-rose-50 to-white',
      accentColor: 'rose',
      coaShare: 0,
      spotShare: 100,
      forwardFx: Number((baseFxRate * (1 + (1/12) * 0.025)).toFixed(2)), // 86.68
      driftFactor: 1.145, // volatile spot drift
      coaDiscountFactor: 1.0,
      congestionDays: destObj.avgWaitDays + 3.5, // full exposure to anchorage spikes
      basestockSecurity: 52, // 52% security, vulnerable to furnace starvation
      suitabilityText: 'Unhedged single-voyage fixture. Leaves buyer fully vulnerable to daily Baltic surges and port demurrage.',
      isRecommended: false
    },
    {
      id: 3,
      name: '3-Month Quarterly COA',
      tag: 'BALANCED / RECOMMENDED',
      badgeCls: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      borderCls: 'border-cyan-300 hover:border-cyan-400',
      activeBorderCls: 'border-cyan-500 ring-2 ring-cyan-500/20',
      headerBg: 'bg-gradient-to-r from-cyan-50 to-white',
      accentColor: 'cyan',
      coaShare: 70,
      spotShare: 30,
      forwardFx: Number((baseFxRate * (1 + (3/12) * 0.025)).toFixed(2)), // 87.04
      driftFactor: 1.075,
      coaDiscountFactor: 0.94,
      congestionDays: destObj.avgWaitDays + 1.2,
      basestockSecurity: 86, // 86% security, blast furnace basestock shielded
      suitabilityText: 'Locks 70% of parcel volume at discounted COA while retaining 30% flexibility to snipe P10 spot dips.',
      isRecommended: true
    },
    {
      id: 6,
      name: '6-Month Multi-Voyage Contract',
      tag: 'MAXIMUM SAVINGS & STABILITY',
      badgeCls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      borderCls: 'border-emerald-300 hover:border-emerald-400',
      activeBorderCls: 'border-emerald-500 ring-2 ring-emerald-500/20',
      headerBg: 'bg-gradient-to-r from-emerald-50 to-white',
      accentColor: 'emerald',
      coaShare: 85,
      spotShare: 15,
      forwardFx: Number((baseFxRate * (1 + (6/12) * 0.025)).toFixed(2)), // 87.58
      driftFactor: 1.055,
      coaDiscountFactor: 0.92, // larger volume discount
      congestionDays: destObj.avgWaitDays + 0.5, // Priority laycan reduces demurrage
      basestockSecurity: 98, // 98% ironclad blast furnace basestock feed
      suitabilityText: 'Institutional program for continuous blast furnace feed. Maximizes volume discounts and secures priority berthing.',
      isRecommended: false
    }
  ];

  // Baseline 100% unhedged spot reference for savings calculation
  const refSpotUSD = baseSpotRate * 1.16;
  const refSpotTotalUSD = refSpotUSD * activeVolume;
  const refSpotTotalINR_Cr = (refSpotTotalUSD * 87.58) / 10000000;

  // Calendar dates relative to current simulation date (September 2026 baseline)
  const strikeWindowDate = 'Oct 12 – Oct 19, 2026';
  const blackoutWindowDate = 'Nov 01 – Nov 18, 2026';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 mb-6 text-slate-800">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Optimal Market Entry Timing & Charter Horizon Decision Matrix</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  PS Part (a) Core
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Moving Indian steel mills from reactive daily spot exposure to predictive short-term and mid-term multiple voyage contracts (COAs).
              </p>
            </div>
          </div>
        </div>

        {/* Parcel Selector Quick Chips */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500 text-[11px] font-semibold">Test Parcel:</span>
          {[55000, 75000, 90000, 120000, 150000].map((vol) => (
            <button
              key={vol}
              onClick={() => setActiveVolume(vol)}
              className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                activeVolume === vol
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {vol >= 1000 ? `${vol / 1000}k MT` : `${vol} MT`}
            </button>
          ))}
        </div>
      </div>

      {/* ================= SECTION 1: ACTIONABLE TIMING SIGNALS (STRIKE VS BLACKOUT) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5">
        
        {/* 1. GREEN STRIKE WINDOW (BUY SIGNAL) */}
        <div className="rounded-xl border-2 border-emerald-500/80 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-emerald-400/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                🟢 Strike Window (Optimal Entry Buy Signal)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-900 bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
              {strikeWindowDate}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between pb-3 border-b border-emerald-200/60">
            <div>
              <span className="text-[11px] text-slate-500 block">Expected Forward Dip Rate (P10 Bound)</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-black text-emerald-700">
                  ₹{Math.round((baseSpotRate * 0.94) * 87.04).toLocaleString()} /MT
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (${Number(baseSpotRate * 0.94).toFixed(2)} /MT @ Forward FX)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-700 font-semibold block">Landed Cost Saving</span>
              <span className="text-sm font-bold text-emerald-900">
                ₹{(((refSpotUSD - (baseSpotRate * 0.94)) * activeVolume * 87.04) / 10000000).toFixed(2)} Crore Saved!
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-700">
            <div className="flex items-start space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Procurement Directive:</strong> Forward freight reaches seasonal local minimum. 
                Execute <strong>3-Month or 6-Month COA bookings</strong> during this window to lock basestock supply before post-monsoon restocking crunch.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-800 bg-emerald-100/60 rounded px-2 py-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Recommended Action: Trigger tender for {activeVolume.toLocaleString()} MT parcel feed.</span>
            </div>
          </div>
        </div>

        {/* 2. RED BLACKOUT WINDOW (WAIT SIGNAL) */}
        <div className="rounded-xl border-2 border-rose-400/80 bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 p-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-rose-400/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800 bg-rose-100/90 border border-rose-300 px-2.5 py-0.5 rounded-full">
                🔴 Blackout Window (High Volatility Wait Signal)
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-900 bg-white border border-rose-200 px-2 py-0.5 rounded shadow-2xs">
              {blackoutWindowDate}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between pb-3 border-b border-rose-200/60">
            <div>
              <span className="text-[11px] text-slate-500 block">Projected Stress Rate (P90 Tail Bound)</span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-black text-rose-700">
                  ₹{Math.round((baseSpotRate * 1.32) * 87.58).toLocaleString()} /MT
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (${Number(baseSpotRate * 1.32).toFixed(2)} /MT @ Stress FX)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-rose-700 font-semibold block">Excess Unhedged Penalty</span>
              <span className="text-sm font-bold text-rose-900">
                +₹{((((baseSpotRate * 1.32) - refSpotUSD) * activeVolume * 87.58) / 10000000).toFixed(2)} Crore Loss
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-700">
            <div className="flex items-start space-x-1.5">
              <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                <strong>Protective Directive:</strong> Historical post-monsoon industrial restocking surge & Bay of Bengal cyclone squalls. 
                <strong> DO NOT enter spot chartering.</strong> Rely strictly on pre-locked COA program feed.
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-rose-800 bg-rose-100/60 rounded px-2 py-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Demurrage Risk: Anchorage queues expected to surge to 6.5+ days at Paradip / Vizag.</span>
            </div>
          </div>
        </div>

      </div>

      {/* ================= SECTION 2: SIDE-BY-SIDE CONTRACT HORIZON COMPARISON ================= */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-maritime-800" />
              <span>Interactive Contract Horizon Comparison (Spot vs. Quarterly COA vs. 6-Month Program)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluating financial outflow, landed ₹/MT freight, demurrage exposure, and blast furnace basestock security for {activeVolume.toLocaleString()} MT on {originObj.name.split('(')[0]} → {destObj.name.split('(')[0]}.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
            Click any card to apply horizon globally
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {horizonsData.map((h) => {
            const isSelected = contractHorizonMonths === h.id;
            
            // Financial calculations for this horizon
            const spotRateUSD = baseSpotRate * h.driftFactor;
            const coaRateUSD = baseSpotRate * h.coaDiscountFactor;
            const blendedRateUSD = Number(((h.coaShare / 100 * coaRateUSD) + (h.spotShare / 100 * spotRateUSD)).toFixed(2));
            
            const blendedRateINR = Math.round(blendedRateUSD * h.forwardFx);
            const totalOutflowUSD = Math.round(blendedRateUSD * activeVolume);
            const totalOutflowINR_Cr = ((totalOutflowUSD * h.forwardFx) / 10000000).toFixed(2);
            
            const demurrageUSD = Math.round(h.congestionDays * (vesselObj.demurrageRatePerDayUSD || 25000));
            const demurrageINR_Lakhs = ((demurrageUSD * h.forwardFx) / 100000).toFixed(1);
            
            const netSavingsINR_Cr = (Number(refSpotTotalINR_Cr) - Number(totalOutflowINR_Cr)).toFixed(2);

            return (
              <div
                key={h.id}
                onClick={() => onSelectHorizon && onSelectHorizon(h.id)}
                className={`rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isSelected ? h.activeBorderCls : `${h.borderCls} bg-white`
                }`}
              >
                {/* Header Strip */}
                <div className={`p-4 border-b border-slate-100 ${h.headerBg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${h.badgeCls}`}>
                      {h.tag}
                    </span>
                    {isSelected && (
                      <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Active Horizon
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">{h.name}</h4>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{h.suitabilityText}</p>
                </div>

                {/* Body Metrics */}
                <div className="p-4 space-y-3 text-xs">
                  
                  {/* Blended Freight Rate */}
                  <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">Effective Freight Rate:</span>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{blendedRateINR.toLocaleString()} /MT
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ${blendedRateUSD.toFixed(2)} /MT @ ₹{h.forwardFx} FX
                      </span>
                    </div>
                  </div>

                  {/* Portfolio Cost Outflow */}
                  <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">Total Landed Outflow:</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800">
                        ₹{totalOutflowINR_Cr} Crore
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ${totalOutflowUSD.toLocaleString()} USD
                      </span>
                    </div>
                  </div>

                  {/* Net Savings vs Unhedged Spot */}
                  <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">Net Freight Savings:</span>
                    <div className="text-right">
                      {Number(netSavingsINR_Cr) > 0 ? (
                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          +₹{netSavingsINR_Cr} Cr Saved!
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          Baseline Benchmark
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Demurrage Exposure */}
                  <div className="flex items-baseline justify-between pb-2 border-b border-slate-100">
                    <span className="text-slate-500 text-[11px]">Demurrage Risk:</span>
                    <div className="text-right font-mono text-[11px] text-slate-700">
                      ₹{demurrageINR_Lakhs} Lakhs ({h.congestionDays.toFixed(1)}d wait)
                    </div>
                  </div>

                  {/* Blast Furnace Feed Security Score */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        Furnace Basestock Security:
                      </span>
                      <span className={`font-bold ${
                        h.basestockSecurity >= 90 ? 'text-emerald-700' : h.basestockSecurity >= 75 ? 'text-cyan-700' : 'text-rose-600'
                      }`}>
                        {h.basestockSecurity}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          h.basestockSecurity >= 90 ? 'bg-emerald-500' : h.basestockSecurity >= 75 ? 'bg-cyan-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${h.basestockSecurity}%` }}
                      ></div>
                    </div>
                  </div>

                </div>

                {/* Bottom Action Strip */}
                <div className="p-3 bg-slate-50 border-t border-slate-100">
                  <button
                    type="button"
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isSelected ? 'Current Selection' : `Apply ${h.name.split(' ')[0]} Duration`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
