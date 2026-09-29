import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Ship, Anchor, AlertTriangle, ArrowRight, 
  CheckCircle2, Clock, Compass, ShieldCheck, Zap, DollarSign, Calendar,
  Layers, MapPin, Gauge, Fuel, Train, Truck, ChevronRight, Activity,
  Database, Radio, FileText, Sparkles, Filter, Navigation, ArrowUpRight,
  ExternalLink, Info, Check, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';
import { generateDynamicTimeSeries } from '../utils/forecastingEngine';

export default function DashboardLandingPage({
  selectedOrigin,
  setSelectedOrigin,
  selectedDestination,
  setSelectedDestination,
  selectedVessel,
  setSelectedVessel,
  cargoVolumeMT,
  setCargoVolumeMT,
  contractHorizonMonths,
  setContractHorizonMonths,
  volatilityIndex,
  setVolatilityIndex,
  currency,
  forecast,
  terminalMetrics,
  setTerminalMetrics,
  activeNewsSignal,
  setActiveNewsSignal,
  coaSplitPercent,
  setCoaSplitPercent,
  marketData,
  onNavigateToPage,
  onOpenDatasets,
  onExportReport
}) {
  const isINR = currency === 'INR';
  const fxRate = isINR ? (marketData?.usdInrSpot || 95.93) : 1.0;
  const currSym = isINR ? '₹' : '$';

  // State for Phase 1 Interactive Planning Controls
  const [inputVolume, setInputVolume] = useState(cargoVolumeMT || 150000);
  const [inputOrigin, setInputOrigin] = useState(selectedOrigin || 'hay_point');
  const [inputDestination, setInputDestination] = useState(selectedDestination || 'paradip');
  const [inputHorizon, setInputHorizon] = useState(contractHorizonMonths || 3);
  const [chartHorizon, setChartHorizon] = useState('6M');

  // State for Phase 2 Emergency Coal Priority
  const [criticalStockpileDays, setCriticalStockpileDays] = useState(5.5);
  const [anchorageWaitHours, setAnchorageWaitHours] = useState(36);
  const [ceaRedFlag, setCeaRedFlag] = useState(true);

  // State for Phase 3 Multimodal Diversion Equation
  const [selectedDiversionAlternative, setSelectedDiversionAlternative] = useState('dhamra_rail'); // 'dhamra_rail' | 'vizag_truck' | 'anchorage'

  // State for Phase 4 Cargo Matching
  const [selectedTargetPlant, setSelectedTargetPlant] = useState('sail_rourkela');
  const [selectedBackhaulRoute, setSelectedBackhaulRoute] = useState('paradip_china');

  // Dynamic Time Series for the Phase 1 Forecast Graph
  const timeSeriesData = useMemo(() => {
    const { historical, forecast: dynamicF } = generateDynamicTimeSeries(forecast, fxRate, terminalMetrics);
    return [...historical.slice(-3), ...dynamicF.slice(0, 6)];
  }, [forecast, fxRate, terminalMetrics]);

  // Destination Port Draft Metadata
  const activeDestObj = INDIAN_EAST_COAST_PORTS[inputDestination] || INDIAN_EAST_COAST_PORTS.paradip;

  const handleApplyPhase1Inputs = () => {
    setSelectedOrigin(inputOrigin);
    setSelectedDestination(inputDestination);
    setCargoVolumeMT(Number(inputVolume));
    setContractHorizonMonths(Number(inputHorizon));
  };

  // Phase 2 Logic
  const isEmergencyActive = criticalStockpileDays < 7 || ceaRedFlag;
  const isCongestionHigh = anchorageWaitHours > 24;

  // Phase 3 Cost Calculations (in USD/MT)
  const costADemurrageWait = (anchorageWaitHours / 24) * 25000 / (inputVolume / 1000); // Demurrage exposure
  const costBBunkerDiversion = 3.80; // Bunker fuel to divert to Dhamra/Vizag
  const costCFoisRailTariff = 5.20; // FOIS 48hr rake inland freight to plant
  const totalMultimodalCost = costBBunkerDiversion + costCFoisRailTariff;
  const netSavingsDiversion = Math.max(0, costADemurrageWait - totalMultimodalCost);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* HERO BANNER & 4-PHASE PROCESS FLOW HEADER                                 */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl p-6 sm:p-8 shadow-elevated border border-slate-700/60 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-700/80">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>NaviFreight Sovereign Logistics Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              End-to-End Bulk Chartering & Logistics Decision Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Transitioning Indian PSUs (SAIL, RINL, NTPC) from reactive spot chartering to optimized multiple-voyage COAs, emergency vessel bunching prioritization, 6h multimodal diversion gates, and domestic coastal backhaul triangulation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToPage('forecasts')}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Launch Web Terminal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onExportReport}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-sky-300" />
              <span>CAG Audit Report</span>
            </button>
          </div>
        </div>

        {/* 4-PHASE PROCESS PIPELINE NAVIGATOR (MATCHING FLOW DIAGRAM) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          
          {/* Phase 1 Stepper Card */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-sky-400/40 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-sky-300 tracking-wider">Phase 1</span>
              <span className="text-[9px] bg-sky-500/20 text-sky-200 px-1.5 py-0.5 rounded font-mono font-bold">Planning</span>
            </div>
            <h4 className="text-xs font-bold text-white leading-snug">Bulk Procurement & Data Ingestion</h4>
            <p className="text-[10.5px] text-slate-300 mt-1">21-Day Tender Window • P10/P50/P90 Envelopes • 8 Sovereign Feeds</p>
          </div>

          {/* Phase 2 Stepper Card */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-amber-400/40 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Phase 2</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">2–3 Days Out</span>
            </div>
            <h4 className="text-xs font-bold text-white leading-snug">Vessel Bunching & Emergency Coal</h4>
            <p className="text-[10.5px] text-slate-300 mt-1">Tier-1 Arrival ETA • Anchorage Wait Alert • CEA Red Flag vs FIFO</p>
          </div>

          {/* Phase 3 Stepper Card */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-emerald-400/40 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">Phase 3</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">6h ETA Gate</span>
            </div>
            <h4 className="text-xs font-bold text-white leading-snug">Decision Gate & Port Diversion</h4>
            <p className="text-[10.5px] text-slate-300 mt-1">3-Way Equation • Cost B Bunker vs Cost C FOIS Rail & Trucking</p>
          </div>

          {/* Phase 4 Stepper Card */}
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 border border-purple-400/40 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider">Phase 4</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded font-mono font-bold">Berth & Backhaul</span>
            </div>
            <h4 className="text-xs font-bold text-white leading-snug">Berth Discharge & Coastal Hop</h4>
            <p className="text-[10.5px] text-slate-300 mt-1">2,000 MT/hr Speed • Plant Allocation • 18.4% Ballast Elimination</p>
          </div>

        </div>
      </div>


      {/* ========================================================================= */}
      {/* PHASE 1: BULK PROCUREMENT ORDERING & MULTI-SOURCE DATA INGESTION          */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle">
        
        {/* Phase Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              1
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 1: BULK PROCUREMENT ORDERING & MULTI-SOURCE DATA INGESTION
              </h2>
              <p className="text-xs text-slate-500">
                User Constraints • Sovereign External Feeds • Rolling Tender Horizon • Quantile Price Forecasts
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToPage('forecasts')}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>Open Dedicated Forecasting Engine</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Phase 1 Layout Grid: User Inputs (Left) + External Feeds (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column A: User Inputs & Constraints (Diagram Left Box) */}
          <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
              <span className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-600" />
                User Inputs & Constraints
              </span>
              <span className="text-[10px] text-slate-500 font-mono">STEP 1.1</span>
            </div>

            {/* Global Source Port */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Global Source Port (Origin)
              </label>
              <select
                value={inputOrigin}
                onChange={(e) => setInputOrigin(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-sky-500"
              >
                {Object.entries(ORIGIN_LOADING_PORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name} ({v.country}) — {v.distanceToParadipNm} NM
                  </option>
                ))}
              </select>
            </div>

            {/* Indian Destination Port */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Indian Destination Port (East Coast)
              </label>
              <select
                value={inputDestination}
                onChange={(e) => setInputDestination(e.target.value)}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:outline-sky-500"
              >
                {Object.entries(INDIAN_EAST_COAST_PORTS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name} (Max Draft: {v.maxDraftM}m)
                  </option>
                ))}
              </select>
              <span className="text-[10.5px] text-sky-700 font-medium block mt-1">
                Engineering Limit: Max Draft {activeDestObj.maxDraftM}m • TPD: {activeDestObj.dischargeRateTpd} MT/day
              </span>
            </div>

            {/* Total Quantity to Order (MT) */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Total Quantity to Order (MT)</span>
                <span className="font-mono text-sky-700 font-bold">{Number(inputVolume).toLocaleString()} MT</span>
              </div>
              <input
                type="range"
                min="50000"
                max="250000"
                step="5000"
                value={inputVolume}
                onChange={(e) => setInputVolume(e.target.value)}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
                <span>50k MT (Supramax)</span>
                <span>150k MT (Capesize)</span>
                <span>250k MT</span>
              </div>
            </div>

            {/* Contract Term Horizon */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Contract Term Horizon
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 6].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setInputHorizon(m)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      Number(inputHorizon) === m
                        ? 'bg-sky-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m} {m === 1 ? 'Month' : 'Months'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleApplyPhase1Inputs}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Update Order Parameters</span>
            </button>
          </div>

          {/* Column B: Datasets & Sovereign External Ingestion Feeds (Diagram Right Box) */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Top Sovereign Data Badges */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-600" />
                  Sovereign & External Data Sources Ingested
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                  8 Live Active Feeds
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <Ship className="w-3.5 h-3.5 text-sky-600" />
                    <span>SSE Freight</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Shanghai Shipping Exchange indices & BCI/BPI spot</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                    <span>IMD / NOAA</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Bay of Bengal cyclone alerts & sea surface telemetry</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <Fuel className="w-3.5 h-3.5 text-rose-600" />
                    <span>ICE Brent / VLSFO</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Bunker fuel index for BAF cost calculation: $632/MT</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <Truck className="w-3.5 h-3.5 text-amber-600" />
                    <span>FreightFox</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Indian Trucking Price Book & multimodal freight index</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <Fuel className="w-3.5 h-3.5 text-indigo-600" />
                    <span>PPAC Fuel</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Daily diesel price for inland logistics pass-through</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <Train className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Indian Railways</span>
                  </div>
                  <p className="text-[10px] text-slate-500">FOIS rail freight tariffs per rake & distance matrix</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <FileText className="w-3.5 h-3.5 text-slate-700" />
                    <span>DGCIS Trade</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Indian coal import/export customs clearance volumes</p>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold mb-1">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span>Ministry of Coal</span>
                  </div>
                  <p className="text-[10px] text-slate-500">CEA thermal stockpile & consumption monitoring</p>
                </div>

              </div>
            </div>

            {/* Bottom Phase 1 Box: Tender Preparation & Charter-Party Rolling Analysis */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-sky-200/70 gap-2">
                <div>
                  <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-700" />
                    Tender Preparation & Charter-Party Rolling Analysis
                  </h4>
                  <p className="text-[11px] text-sky-800 mt-0.5">
                    Advises SAIL/RINL on 21-day tender booking windows using P10 (Low), P50 (Mid), P90 (High) price forecasts; recommends COA-Spot mix (~70% COA / ~30% Spot baseline), adjusted with Early Global Volatility Radar.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-[11px] font-bold text-sky-800 bg-white px-2.5 py-1 rounded-lg border border-sky-200">
                    Recommended COA: {coaSplitPercent}% / Spot: {100 - coaSplitPercent}%
                  </span>
                </div>
              </div>

              {/* Quantile Forecast Mini-Chart */}
              <div className="h-44 w-full bg-white rounded-lg p-2 border border-sky-100">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeSeriesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                    <Tooltip 
                      formatter={(val) => [`${currSym}${Number(val).toLocaleString()}`, 'Rate']}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Area type="monotone" dataKey="p90" stroke="transparent" fill="#e0f2fe" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="p10" stroke="transparent" fill="#ffffff" fillOpacity={1.0} />
                    <Line type="monotone" dataKey="rate" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-sky-800 mt-2 font-medium">
                <span>P10 Floor: {currSym}{(forecast.totalVoyageCostUsd * fxRate * 0.9 / (inputVolume / 1000)).toFixed(1)}/MT</span>
                <span className="font-bold text-sky-950">P50 Baseline: {currSym}{(forecast.totalVoyageCostUsd * fxRate / (inputVolume / 1000)).toFixed(1)}/MT</span>
                <span>P90 Cap: {currSym}{(forecast.totalVoyageCostUsd * fxRate * 1.15 / (inputVolume / 1000)).toFixed(1)}/MT</span>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* PHASE 2: VESSEL BUNCHING ENG & EMERGENCY COAL PRIORITY (2-3 DAYS OUT)     */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle">
        
        {/* Phase Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center text-sm shadow-xs">
              2
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 2: VESSEL BUNCHING ENG & EMERGENCY COAL PRIORITY (2–3 DAYS OUT)
              </h2>
              <p className="text-xs text-slate-500">
                Tier-1 Arrival ETA (48h–72h) • Anchorage Wait Warning • CEA Red Flag vs FIFO Berthing Protocol
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToPage('ports')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>Open Port Intelligence Engine</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Process Flow Diagram Box matching Picture 1 Phase 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Step 2.1: Tier-1 Arrival ETA */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-[10.5px] uppercase font-bold text-amber-800 mb-1">
              Tier-1 Arrival ETA
            </div>
            <div className="text-xl font-black text-slate-900 my-1">
              48h – 72h Out
            </div>
            <p className="text-[11px] text-slate-600">
              Vessel within 2–3 days cruising distance to East Coast India (Bay of Bengal entry point).
            </p>
            <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-center text-[10px] text-amber-900 font-mono">
              AIS Geofence Trigger: ACTIVE
            </div>
          </div>

          {/* Flow Arrow */}
          <div className="hidden md:flex justify-center text-amber-400">
            <ArrowRight className="w-6 h-6 stroke-[3]" />
          </div>

          {/* Step 2.2: Tier-1 Congestion Alert */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-center">
            <div className="text-[10.5px] uppercase font-bold text-amber-800 mb-1">
              Tier-1 Congestion Alert
            </div>
            <div className="text-xl font-black text-rose-600 my-1 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Wait &gt; {anchorageWaitHours}h</span>
            </div>
            <p className="text-[11px] text-slate-600">
              Anchorage queue exceeds 24–48 hours at {INDIAN_EAST_COAST_PORTS[inputDestination]?.name || 'Paradip Port'}.
            </p>
            <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-center gap-2">
              <button
                onClick={() => setAnchorageWaitHours(anchorageWaitHours === 36 ? 18 : 36)}
                className="text-[10px] font-bold text-amber-800 underline cursor-pointer"
              >
                Simulate {anchorageWaitHours === 36 ? 'Normal Wait (18h)' : 'Congestion Spike (36h)'}
              </button>
            </div>
          </div>

        </div>

        {/* Decision Diamond Node (Picture 1): Critical Stockpile < 7 days / CEA Red Flag */}
        <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Emergency Coal Priority Factor Decision Gate
              </span>
              <p className="text-[11px] text-slate-500">
                Evaluates power plant / steel plant critical stockpile levels to prevent boiler shutdowns.
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-600 font-semibold">Simulated Stockpile:</span>
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
                <span className="text-[10px] bg-rose-200/70 text-rose-900 font-bold px-2 py-0.5 rounded">
                  OVERRIDE QUEUE
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Emergency Coal Priority Berthing</h4>
              <p className="text-xs text-slate-600 mt-1">
                Port authority bypasses normal queue to provide immediate designated berth to avoid blast furnace shutoff. Demurrage clock stopped instantly upon pilot boarding.
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
                Vessel enters normal commercial line-up. Anti-congestion virtual arrival algorithm slows engine speed to match optimal berth availability window without fuel waste.
              </p>
            </div>

          </div>

          {/* Interactive Simulation Toggle */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="text-slate-500 text-[11px]">Test Decision Gate Scenario:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setCriticalStockpileDays(4.5); setCeaRedFlag(true); }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                  criticalStockpileDays < 7 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                Trigger &lt; 7 Days Crisis
              </button>
              <button
                onClick={() => { setCriticalStockpileDays(11.0); setCeaRedFlag(false); }}
                className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer ${
                  criticalStockpileDays >= 7 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                Set Normal Stockpile (11 Days)
              </button>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* PHASE 3: CRITICAL DECISION GATE & MULTIMODAL PORT DIVERSION (6h THRESHOLD)*/}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle">
        
        {/* Phase Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              3
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 3: CRITICAL DECISION GATE & MULTIMODAL PORT DIVERSION (6h ETA THRESHOLD)
              </h2>
              <p className="text-xs text-slate-500">
                3-Way Optimization Equation • Cost B Bunker Fuel vs Cost C FOIS Rail & Trucking Index
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToPage('ports')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>Inspect Multimodal Optimization Model</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3-Way Optimization Equation (Diagram Picture 1) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
          
          {/* Card A: Demurrage Penalty at Current Port */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Baseline Anchorage Cost
              </div>
              <h4 className="text-sm font-bold text-slate-900">Cost A: Demurrage Penalty</h4>
              <p className="text-xs text-slate-500 mt-1">
                Idle waiting at current anchorage ({anchorageWaitHours} hours) at $25,000/day charter demurrage rate.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500">Anchorage Demurrage Exposure:</div>
              <div className="text-xl font-black text-rose-600 font-mono">
                ${costADemurrageWait.toFixed(2)} / MT
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Total parcel exposure: ${(costADemurrageWait * inputVolume).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Card B: Cost B - Port Diversion Bunker Fuel */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 mb-1">
                Maritime Leg Re-Routing
              </div>
              <h4 className="text-sm font-bold text-slate-900">Cost B: Port Diversion Bunker Fuel</h4>
              <p className="text-xs text-slate-500 mt-1">
                Additional VLSFO fuel burn (120 NM deviation to secondary deepwater port e.g. Dhamra or Vizag).
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-200">
              <div className="text-xs text-slate-500">Bunker Fuel Cost:</div>
              <div className="text-xl font-black text-sky-800 font-mono">
                ${costBBunkerDiversion.toFixed(2)} / MT
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Based on ICE VLSFO $632/MT @ 13.0 knots pacing
              </div>
            </div>
          </div>

          {/* Card C: Cost C - Multimodal Inland Execution */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                Inland Logistics Leg
              </div>
              <h4 className="text-sm font-bold text-slate-900">Cost C: Multimodal Inland Rail / Truck</h4>
              <p className="text-xs text-slate-500 mt-1">
                Indian Railways FOIS 48 hr rake tariff vs FreightFox Trucking Index + PPAC Diesel Price.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200">
              <div className="text-xs text-slate-500">Inland Logistics Tariff:</div>
              <div className="text-xl font-black text-emerald-800 font-mono">
                ${costCFoisRailTariff.toFixed(2)} / MT
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                FOIS Rail Rake: 4,000 MT per rake • 48h dispatch guarantee
              </div>
            </div>
          </div>

        </div>

        {/* Optimization Verdict Box (Diagram Picture 1) */}
        <div className="mt-6 p-5 bg-gradient-to-r from-slate-900 to-sky-950 text-white rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              OPTIMIZATION VERDICT AT 6h THRESHOLD
            </span>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              {costADemurrageWait > totalMultimodalCost ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>EXECUTE MULTIMODAL DIVERSION (Dhamra Port + FOIS Rake)</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-sky-400" />
                  <span>PROCEED TO CURRENT ANCHORAGE (Virtual Arrival Speed Optimization)</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl">
              Equation result: Cost B (${costBBunkerDiversion}) + Cost C (${costCFoisRailTariff}) = ${totalMultimodalCost.toFixed(2)}/MT vs Demurrage Penalty Cost A (${costADemurrageWait.toFixed(2)}/MT).
              {costADemurrageWait > totalMultimodalCost 
                ? ` Net savings: $${netSavingsDiversion.toFixed(2)}/MT ($${(netSavingsDiversion * inputVolume).toLocaleString()} total).`
                : ' Demurrage is less than diversion costs; virtual arrival pacing saves fuel.'}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1.5 rounded-lg">
              Verdict: MAINTAINED
            </span>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* PHASE 4: BERTH DISCHARGE, CARGO MATCHING, AND COASTAL HOP TRIANGULATION   */}
      {/* ========================================================================= */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-subtle">
        
        {/* Phase Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              4
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 4: BERTH DISCHARGE, CARGO MATCHING, AND COASTAL HOP TRIANGULATION
              </h2>
              <p className="text-xs text-slate-500">
                2,000 MT/hr Speed • Demurrage Clock Stop • Plant Matching (RINL/SAIL/TATA/NTPC) • Wetzel & Tierney Backhaul
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateToPage('vessels')}
            className="text-xs font-bold text-purple-700 hover:text-purple-800 flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>Open Fleet & Vessels Engine</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Step Flow inside Phase 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Step 4.1: Berth Discharge & Demurrage Clock Stop */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Step 4.1</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Clock Stopped
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-600" />
              <span>Berth Discharge & Demurrage Stop</span>
            </h4>
            <div className="my-3 p-3 bg-white rounded-lg border border-slate-200 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="text-slate-500">Discharge Speed:</span>
                <span className="font-mono font-bold text-slate-900">2,000 MT / hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Turnaround Duration:</span>
                <span className="font-mono font-bold text-emerald-700">~75.0 Hours (3.1 Days)</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              High-speed conveyor and grab discharge system operates 24/7. Laytime demurrage calculation ceases the second the first grab commences.
            </p>
          </div>

          {/* Step 4.2: Cargo Matching (Coal Details to Plant) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-500">Step 4.2</span>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                AI Allocation
              </span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Ship className="w-4 h-4 text-purple-600" />
              <span>Cargo Matching to Plant</span>
            </h4>

            <div className="space-y-1.5 my-3 text-xs">
              {[
                { id: 'rinl_vizag', name: 'RINL Vizag Steel Plant', spec: 'Ash < 9.5%, CSR > 66%', status: 'Allocated' },
                { id: 'sail_rourkela', name: 'SAIL Rourkela Steel Plant', spec: 'Hard Coking Coal (Queensland)', status: 'Active' },
                { id: 'tata_kalinganagar', name: 'TATA Kalinganagar Plant', spec: 'PCI Coal Blend', status: 'Standby' },
                { id: 'ntpc_thermal', name: 'NTPC Super Thermal Power', spec: 'Non-Coking Thermal Coal (GCV 4200)', status: 'Secondary' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedTargetPlant(p.id)}
                  className={`p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedTargetPlant === p.id 
                      ? 'bg-purple-50 border-purple-300 text-purple-950 font-bold shadow-2xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span>{p.name}</span>
                    <span className="text-[9px] uppercase font-mono">{p.status}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal block">{p.spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 4.3: Coastal Hop Triangulation & Commercial Impact */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-purple-800">Step 4.3</span>
                <span className="text-[10px] font-bold text-purple-800 bg-white px-2 py-0.5 rounded border border-purple-200">
                  Wetzel & Tierney 2020
                </span>
              </div>
              <h4 className="text-sm font-bold text-purple-950 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-700" />
                <span>Coastal Hop Triangulation Engine</span>
              </h4>

              <div className="my-3 p-3 bg-white rounded-lg border border-purple-200 text-xs">
                <div className="font-bold text-purple-950 text-[11px] mb-1">
                  Matched Domestic Coastal Backhaul Cargo:
                </div>
                <div className="text-[11px] text-slate-700 font-medium">
                  Paradip / Dhamra ➔ Ennore ➔ Mormugao / Export
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Eliminate deadhead empty ballast voyages</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-purple-950">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Slash procurement costs by up to 18.4%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Minimize carbon emission intensity (EEXI / CII)</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-200">
              <button
                onClick={() => onNavigateToPage('vessels')}
                className="w-full py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Launch Backhaul Triangulation Solver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
