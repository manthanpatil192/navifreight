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
  currency = 'INR',
  terminalMetrics = null
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
    'hay_point-paradip': 15.80, 'hay_point-dhamra': 15.40, 'hay_point-vizag': 16.20, 'hay_point-gangavaram': 16.10, 'hay_point-gopalpur': 16.00, 'hay_point-sandheads': 15.90, 'hay_point-haldia': 16.60,
    'gladstone-paradip': 16.00, 'gladstone-dhamra': 15.60, 'gladstone-vizag': 16.40, 'gladstone-gangavaram': 16.30, 'gladstone-gopalpur': 16.20, 'gladstone-sandheads': 16.10, 'gladstone-haldia': 16.80,
    'newcastle-paradip': 16.30, 'newcastle-dhamra': 15.90, 'newcastle-vizag': 16.70, 'newcastle-gangavaram': 16.60, 'newcastle-gopalpur': 16.50, 'newcastle-sandheads': 16.40, 'newcastle-haldia': 17.10,
    'hampton_roads-paradip': 32.50, 'hampton_roads-dhamra': 32.00, 'hampton_roads-vizag': 32.80, 'hampton_roads-gangavaram': 32.70, 'hampton_roads-gopalpur': 32.40, 'hampton_roads-sandheads': 32.60, 'hampton_roads-haldia': 33.50,
    'maputo-paradip': 13.60, 'maputo-dhamra': 13.40, 'maputo-vizag': 13.90, 'maputo-gangavaram': 13.80, 'maputo-gopalpur': 13.50, 'maputo-sandheads': 13.70, 'maputo-haldia': 14.30,
    'samarinda-paradip': 8.90, 'samarinda-dhamra': 8.80, 'samarinda-vizag': 8.70, 'samarinda-gangavaram': 8.65, 'samarinda-gopalpur': 8.75, 'samarinda-sandheads': 8.85, 'samarinda-haldia': 9.40,
    'taboneo-paradip': 8.60, 'taboneo-dhamra': 8.50, 'taboneo-vizag': 8.40, 'taboneo-gangavaram': 8.35, 'taboneo-gopalpur': 8.45, 'taboneo-sandheads': 8.55, 'taboneo-haldia': 9.10,
    'vostochny-paradip': 18.50, 'vostochny-dhamra': 18.20, 'vostochny-vizag': 18.70, 'vostochny-gangavaram': 18.60, 'vostochny-gopalpur': 18.40, 'vostochny-sandheads': 18.50, 'vostochny-haldia': 19.20
  };
  const baseSpotRate = baseRateMatrix[routeKey] || 15.80;

  // Compute forward horizons (1-Month Spot, 3-Month COA, 6-Month COA)
  // Dynamic Contract Horizon Decision Engine (PS Part A Core)
  // Evaluates realistic commercial suitability:
  // - Small/single consignments (<= 75,000 MT), prompt delivery, or user-selected 1M: 1-Month is TACTICAL & RECOMMENDED.
  // - Medium volumes (75k-160k MT): 3-Month Quarterly COA is optimal balance.
  // - Large multi-plant programs (>160k MT): 6-Month Multi-Voyage is optimal for volume discounts and priority berthing.
  const isSmallParcel = activeVolume <= 75000;
  const isUserChose1M = contractHorizonMonths === 1;
  const hasSevereDisruption = (isOriginImproper || isDestImproper || (terminalMetrics?.weatherDelayDays || 0) > 2.0 || isExtremeDemand) && activeVolume > 100000;
  const isOneMonthRecommended = isSmallParcel || (isUserChose1M && !hasSevereDisruption);
  const isSixMonthRecommended = activeVolume > 160000 || contractHorizonMonths === 6;
  const isThreeMonthRecommended = !isOneMonthRecommended && !isSixMonthRecommended;

  // Compute forward horizons (1-Month Spot, 3-Month COA, 6-Month COA)
  const horizonsData = [
    {
      id: 1,
      name: '1-Month Spot Chartering',
      tag: isOneMonthRecommended 
        ? (isSmallParcel ? 'BALANCED / RECOMMENDED (SINGLE PARCEL)' : 'TACTICAL / PROMPT FIXTURE')
        : (hasSevereDisruption ? 'HIGH RISK / REACTIVE' : 'FLEXIBLE PROMPT SPOT'),
      badgeCls: isOneMonthRecommended 
        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
        : (hasSevereDisruption ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-blue-50 text-blue-700 border-blue-200'),
      borderCls: isOneMonthRecommended 
        ? 'border-emerald-300 hover:border-emerald-400' 
        : (hasSevereDisruption ? 'border-rose-300 hover:border-rose-400' : 'border-blue-300 hover:border-blue-400'),
      activeBorderCls: isOneMonthRecommended 
        ? 'border-emerald-500 ring-2 ring-emerald-500/20' 
        : (hasSevereDisruption ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-blue-500 ring-2 ring-blue-500/20'),
      headerBg: isOneMonthRecommended 
        ? 'bg-gradient-to-r from-emerald-50 to-white' 
        : (hasSevereDisruption ? 'bg-gradient-to-r from-rose-50 to-white' : 'bg-gradient-to-r from-blue-50 to-white'),
      accentColor: isOneMonthRecommended ? 'emerald' : (hasSevereDisruption ? 'rose' : 'blue'),
      coaShare: 0,
      spotShare: 100,
      forwardFx: Number((baseFxRate * (1 + (1/12) * 0.025)).toFixed(2)), // 86.68
      driftFactor: isOneMonthRecommended ? 1.02 : 1.145,
      coaDiscountFactor: 1.0,
      congestionDays: destObj.avgWaitDays + (hasSevereDisruption ? (terminalMetrics?.weatherDelayDays || 3.5) : 0.5),
      basestockSecurity: isOneMonthRecommended ? 90 : (hasSevereDisruption ? 52 : 80),
      suitabilityText: isOneMonthRecommended
        ? 'Optimal for prompt single-consignment delivery. Capitalizes on immediate vessel availability without locking up balance sheet capital in forward obligations.'
        : (hasSevereDisruption
            ? 'Unhedged single-voyage fixture for large parcel. Leaves buyer vulnerable to daily Baltic surges and port demurrage during active disruption.'
            : 'Flexible single-voyage fixture. Useful for immediate parcel fulfillment when forward volume guarantees are not needed.'),
      isRecommended: isOneMonthRecommended
    },
    {
      id: 3,
      name: '3-Month Quarterly COA',
      tag: isThreeMonthRecommended ? 'BALANCED / RECOMMENDED' : 'QUARTERLY COA PROGRAM',
      badgeCls: isThreeMonthRecommended ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-100 text-slate-700 border-slate-200',
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
      isRecommended: isThreeMonthRecommended
    },
    {
      id: 6,
      name: '6-Month Multi-Voyage Contract',
      tag: isSixMonthRecommended ? 'MAXIMUM SAVINGS & STABILITY (RECOMMENDED)' : '6-MONTH INSTITUTIONAL PROGRAM',
      badgeCls: isSixMonthRecommended ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200',
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
      isRecommended: isSixMonthRecommended
    }
  ];

  // Baseline 100% unhedged spot reference for savings calculation
  const refSpotUSD = baseSpotRate * 1.16;
  const refSpotTotalUSD = refSpotUSD * activeVolume;
  const refSpotTotalINR_Cr = (refSpotTotalUSD * 87.58) / 10000000;

  // Calendar dates relative to current simulation date (September 2026 baseline)
  const promptLaycanWindowDate = 'Sep 08 – Sep 15, 2026'; // Prompt September Execution Window
  const forwardDipWindowDate = 'Oct 12 – Oct 19, 2026'; // Forward P10 Dip Valley (~38 days ahead)
  const blackoutWindowDate = 'Nov 01 – Nov 18, 2026'; // Seasonal Pre-Winter Volatility Spike

  // Weather and extreme demand statuses from Window Terminal
  const isOriginImproper = terminalMetrics?.originWeather && !terminalMetrics.originWeather.isWeatherProper;
  const isDestImproper = terminalMetrics?.destWeather && !terminalMetrics.destWeather.isWeatherProper;
  const isExtremeDemand = terminalMetrics?.isExtremeDemand ?? false;
  const activeWeatherWaitDate = isOriginImproper 
    ? terminalMetrics?.originWeather?.recommendedWaitDate 
    : (isDestImproper ? terminalMetrics?.destWeather?.recommendedWaitDate : null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 mb-6 text-slate-800">
      
      {/* Header Bar (Test Parcel quick chips removed per user request) */}
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

        {/* Live Parcel & Vessel Specification Tag */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded border border-slate-200">
            Active Parcel: <strong className="text-slate-900">{activeVolume.toLocaleString()} MT</strong> ({vesselObj.name})
          </span>
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
                {isExtremeDemand ? '🟢 Strike Window (Extreme Demand Corridor: P10–P50)' : '🟢 Strike Window (Optimal Entry Buy Signal)'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-mono font-bold text-emerald-900 bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-2xs block">
                Prompt Laycan: {promptLaycanWindowDate}
              </span>
              <span className="text-[10px] text-emerald-700 font-mono block mt-0.5">
                Forward Dip Valley: {forwardDipWindowDate}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between pb-3 border-b border-emerald-200/60">
            <div>
              <span className="text-[11px] text-slate-500 block">
                {isExtremeDemand ? 'Extreme Demand Strike Corridor' : 'Expected Forward Dip Rate (P10 Bound)'}
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-black text-emerald-700">
                  {isExtremeDemand 
                    ? `₹${terminalMetrics?.p10INR ? terminalMetrics.p10INR.toLocaleString() : '1,285'} – ₹${terminalMetrics?.p50INR ? terminalMetrics.p50INR.toLocaleString() : '1,498'} /MT`
                    : `₹${terminalMetrics?.p10INR ? terminalMetrics.p10INR.toLocaleString() : Math.round((baseSpotRate * 0.94) * 87.04).toLocaleString()} /MT`}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {isExtremeDemand
                    ? `($${terminalMetrics?.p10USD || (baseSpotRate * 0.94).toFixed(2)} – $${terminalMetrics?.p50USD || (baseSpotRate * 1.08).toFixed(2)} /MT)`
                    : `($${terminalMetrics?.p10USD || Number(baseSpotRate * 0.94).toFixed(2)} /MT @ Forward FX)`}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-700 font-semibold block">Landed Cost Saving</span>
              <span className="text-sm font-bold text-emerald-900">
                ₹{terminalMetrics?.savingsINR_Cr ? `${terminalMetrics.savingsINR_Cr} Crore Saved!` : `${(((refSpotUSD - (baseSpotRate * 0.94)) * activeVolume * 87.04) / 10000000).toFixed(2)} Crore Saved!`}
              </span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-slate-700">
            <div className="flex items-start space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Procurement Directive:</strong>{' '}
                {isExtremeDemand 
                  ? 'Extreme demand surge detected. Do NOT hold out exclusively for P10 bottom as vessel capacity may sell out. Execute buy orders within the P10–P50 price corridor. Lock 80%–85% under fixed COA to protect blast furnace basestock feed.'
                  : 'Confirmed calm synoptic sea window. Forward freight reaches seasonal local minimum. Execute 3-Month or 6-Month COA bookings during this window with 70% COA / 30% Spot allocation.'}
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-emerald-800 bg-emerald-100/60 rounded px-2 py-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Recommended Action: Trigger tender for {activeVolume.toLocaleString()} MT parcel feed ({isExtremeDemand ? '80% COA Allocation' : '70% COA / 30% Spot'}).
              </span>
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
                {isOriginImproper 
                  ? '🔴 Blackout Window (Source Weather Halt & Cancellation Risk)'
                  : isDestImproper 
                    ? '🔴 Blackout Window (Bay of Bengal Weather Delay: Wait Signal)'
                    : '🔴 Blackout Window (High Volatility Wait Signal)'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-900 bg-white border border-rose-200 px-2 py-0.5 rounded shadow-2xs">
              {isOriginImproper || isDestImproper 
                ? `Active Weather Halt: WAIT TILL ${activeWeatherWaitDate || 'Sep 15, 2026'}`
                : `Forward Peak Blackout: ${blackoutWindowDate}`}
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between pb-3 border-b border-rose-200/60">
            <div>
              <span className="text-[11px] text-slate-500 block">
                {isOriginImproper ? 'Source Weather Delay & Laycan Default Risk' : isDestImproper ? 'Discharge Anchorage Delay Exposure' : 'Projected Stress Rate (P90 Tail Bound)'}
              </span>
              <div className="flex items-baseline space-x-2 mt-0.5">
                <span className="text-xl font-black text-rose-700">
                  {terminalMetrics?.p90INR ? `₹${terminalMetrics.p90INR.toLocaleString()} /MT` : `₹${Math.round((baseSpotRate * 1.32) * 87.58).toLocaleString()} /MT`}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  (${terminalMetrics?.p90USD ? terminalMetrics.p90USD.toFixed(2) : Number(baseSpotRate * 1.32).toFixed(2)} /MT @ Stress FX)
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
            {isOriginImproper ? (
              <>
                <div className="flex items-start space-x-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Protective Directive:</strong> Adverse sea weather at {originObj.name} ({terminalMetrics.originWeather.weatherHazardDescription}).
                    <div className="text-rose-900 font-bold mt-0.5">⚠️ CONTRACT MAY BE CANCELLED DUE TO WEATHER (Laycan Default Risk / Force Majeure)!</div>
                    <div className="mt-0.5">
                      DO NOT charter spot ships today. <strong>WAIT TILL {terminalMetrics.originWeather.recommendedWaitDate}</strong> when sea swell subsides.
                    </div>
                  </div>
                </div>
                {terminalMetrics.originWeather.alternatePort && (
                  <div className="flex items-start space-x-1.5 text-[11px] text-amber-900 bg-amber-100/70 border border-amber-300 rounded p-1.5 font-medium">
                    <Compass className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Alternate Port Option:</strong> Consider diverting to <strong>{terminalMetrics.originWeather.alternatePort.portName}</strong> ({terminalMetrics.originWeather.alternatePort.reason})
                    </span>
                  </div>
                )}
              </>
            ) : isDestImproper ? (
              <>
                <div className="flex items-start space-x-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Protective Directive:</strong> Squally weather & high swell at {destObj.name} ({terminalMetrics.destWeather.stage}). Pilotage restricted.
                    <strong> DO NOT enter spot chartering.</strong> <strong>WAIT TILL {terminalMetrics.destWeather.recommendedWaitDate}</strong> to avoid paying unbudgeted demurrage.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-rose-800 bg-rose-100/60 rounded px-2 py-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Demurrage Risk: Anchorage delay +{terminalMetrics.destWeather.waitDays || 3.5}d will incur ₹{terminalMetrics.destWeather.demurrageINR_Lakhs || '22.5'} Lakhs demurrage loss.</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Protective Directive:</strong> Historical post-monsoon industrial restocking surge & spot rate drift. 
                    <strong> DO NOT enter spot chartering.</strong> Rely strictly on pre-locked COA program feed.
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-rose-800 bg-rose-100/60 rounded px-2 py-1 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Price Suggestion: Spot rates peaking at ₹{Math.round(baseSpotRate * 1.25 * 86.5).toLocaleString()} /MT. WAIT TILL forward dip to save ₹{terminalMetrics?.savingsINR_Cr || '2.24'} Cr.</span>
                </div>
              </>
            )}
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

                  {/* Terminal-Driven Realistic Operational Directives (Part 4 Enhancements) */}
                  {h.id === 1 ? (
                    isOneMonthRecommended ? (
                      <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/90 border border-emerald-300 text-[11px] text-emerald-950 space-y-1">
                        <div className="flex items-center space-x-1 font-bold text-emerald-800">
                          <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Prompt Tactical Fixture:</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-slate-600">
                          Prompt single-voyage laycan window confirmed ({promptLaycanWindowDate}). Zero long-term commitment overhead.
                        </p>
                        <div className="text-[10px] font-bold text-emerald-800 bg-white/90 rounded px-1.5 py-0.5 border border-emerald-300">
                          Directive: RECOMMENDED TACTICAL STRIKE. Fast vessel load within 7–10 days with no multi-month commitment.
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5 p-2 rounded-lg bg-rose-50/80 border border-rose-200 text-[11px] text-rose-950 space-y-1">
                        <div className="flex items-center space-x-1 font-bold text-rose-800">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Large Parcel Spot Risk Advisory:</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-slate-600">
                          100% spot exposure on large volume ({activeVolume.toLocaleString()} MT) vulnerable to Baltic daily surges & weather halts.
                        </p>
                        <div className="text-[10px] font-bold text-rose-700 bg-white/80 rounded px-1.5 py-0.5 border border-rose-200">
                          Directive: DEFER LARGE SPOT FIXTURE. Shift to Quarterly COA or wait till calmer weather window.
                        </div>
                      </div>
                    )
                  ) : h.id === 3 ? (
                    <div className="mt-2.5 p-2 rounded-lg bg-cyan-50/80 border border-cyan-200 text-[11px] text-cyan-950 space-y-1">
                      <div className="flex items-center space-x-1 font-bold text-cyan-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>Weather Protection & Strike:</span>
                      </div>
                      <p className="text-[10.5px] leading-tight text-slate-600">
                        Includes 48h Weather Working Day (WWD) buffer clause; insulates against swell demurrage while saving ₹{netSavingsINR_Cr} Cr landed freight.
                      </p>
                      <div className="text-[10px] font-bold text-cyan-800 bg-white/80 rounded px-1.5 py-0.5 border border-cyan-200">
                        Directive: RECOMMENDED. Lock 70% basestock; snipe 30% spot dips during P10 windows.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                      <div className="flex items-center space-x-1 font-bold text-emerald-800">
                        <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Priority Berthing & Tramp Rebate:</span>
                      </div>
                      <p className="text-[10.5px] leading-tight text-slate-600">
                        Guaranteed priority berthing slot completely bypasses anchorage weather queues at PPT/Dhamra. Includes return tramp freight credit.
                      </p>
                      <div className="text-[10px] font-bold text-emerald-800 bg-white/80 rounded px-1.5 py-0.5 border border-emerald-200">
                        Directive: MAXIMUM STABILITY. 98% basestock security for continuous multi-plant feeding.
                      </div>
                    </div>
                  )}

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
