import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Ship, Anchor, AlertTriangle, ArrowRight, 
  CheckCircle2, Clock, Compass, ShieldCheck, Zap, DollarSign, Calendar,
  Layers, MapPin, Gauge, Fuel, Train, Truck, ChevronRight, Activity,
  Database, Radio, FileText, Sparkles, Filter, Navigation, ArrowUpRight
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
import WebTerminalModelTrainer from './WebTerminalModelTrainer';
import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';
import { generateDynamicTimeSeries } from '../utils/forecastingEngine';

export default function NautiqLandingDashboard({
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
  onExportReport,
  onOpenDatasets
}) {
  const isINR = currency === 'INR';
  const fxRate = isINR ? 95.0 : 1.0;
  const currSym = isINR ? '₹' : '$';

  // State for Pic 2 6-Month Forecast Chart Tabs
  const [chartVessel, setChartVessel] = useState(selectedVessel || 'capesize');
  const [chartHorizon, setChartHorizon] = useState('6M'); // '1M', '3M', '6M', '1Y'

  // State for Plan a Charter form (Pic 2 Right Card)
  const [inputVolume, setInputVolume] = useState(cargoVolumeMT || 170000);
  const [inputOrigin, setInputOrigin] = useState(selectedOrigin || 'hay_point');
  const [inputDestination, setInputDestination] = useState(selectedDestination || 'vizag');
  const [inputDeadline, setInputDeadline] = useState('2026-11-20');
  const [inputVessel, setInputVessel] = useState('capesize');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Active floating ship on the global route map
  const [activeMapShipIndex, setActiveMapShipIndex] = useState(0);

  // Phase 2 Emergency Coal Priority State (Pic 1)
  const [emergencyPort, setEmergencyPort] = useState(selectedDestination || 'paradip');
  const [emergencyOverride, setEmergencyOverride] = useState(null); // null = auto, true = emergency, false = fifo

  // Phase 3 Multimodal Diversion Decision State (Pic 1)
  const [diversionDecision, setDiversionDecision] = useState('divert'); // 'divert' | 'virtual_arrival'

  // Phase 4 Coastal Backhaul State (Pic 1)
  const [selectedBackhaulRoute, setSelectedBackhaulRoute] = useState('paradip_china');

  // Simulated fleet in transit for the global route map
  const IN_TRANSIT_FLEET = [
    {
      id: 'ship-1',
      name: 'MV Atlantic Pioneer',
      vesselClass: 'Panamax',
      imo: '9515120',
      route: 'US Gulf ➔ Paradip Port',
      origin: 'US Gulf',
      dest: 'Paradip Port',
      speedKnots: 13.0,
      eta: '2026-11-26',
      cargo: '72,000 MT Petcoke / Coal',
      draft: '13.8m',
      dwt: '76,800 DWT',
      coords: '24.5°N, -62.0°W',
      status: 'Underway'
    },
    {
      id: 'ship-2',
      name: 'MV Olympic Glory',
      vesselClass: 'Capesize',
      imo: '9348123',
      route: 'Hay Point ➔ Paradip Port',
      origin: 'Australia (Hay Point)',
      dest: 'Paradip Port',
      speedKnots: 12.4,
      eta: 'In 2.1 Days',
      cargo: '160,000 MT Hard Coking Coal',
      draft: '16.5m',
      dwt: '180,000 DWT',
      coords: '14.2°N, 87.5°E',
      status: 'Tier-1 Priority'
    },
    {
      id: 'ship-3',
      name: 'MV Cape Asia',
      vesselClass: 'Capesize',
      imo: '9482910',
      route: 'Gladstone ➔ Vizag / Dhamra',
      origin: 'Australia (Gladstone)',
      dest: 'Dhamra Port (Diverted)',
      speedKnots: 10.8,
      eta: 'In 3.4 Days',
      cargo: '155,000 MT Queensland Coal',
      draft: '16.2m',
      dwt: '175,000 DWT',
      coords: '11.8°N, 89.2°E',
      status: 'Virtual Arrival Pacing'
    }
  ];

  const currentMapShip = IN_TRANSIT_FLEET[activeMapShipIndex] || IN_TRANSIT_FLEET[0];

  // Dynamic Time Series generation for the 6-Month Freight Forecast Chart (Pic 2)
  const timeSeriesData = useMemo(() => {
    const { historical, forecast: dynamicF } = generateDynamicTimeSeries(forecast, fxRate, terminalMetrics);
    return [...historical.slice(-3), ...dynamicF.slice(0, 6)];
  }, [forecast, fxRate, terminalMetrics]);

  // Handle Calculate Optimal Charter (Pic 2 Action Button)
  const handleCalculateOptimalCharter = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setSelectedOrigin(inputOrigin);
      setSelectedDestination(inputDestination);
      setSelectedVessel(inputVessel);
      setCargoVolumeMT(Number(inputVolume));
      setIsOptimizing(false);
    }, 600);
  };

  // Destination Port Draft Metadata for Plan a Charter (Pic 2)
  const activeDestObj = INDIAN_EAST_COAST_PORTS[inputDestination] || INDIAN_EAST_COAST_PORTS.vizag;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* ========================================================================= */}
      {/* 1. TOP HEADER & HERO GLOBAL ROUTE MAP (EXACT PIC 2 REFERENCE)            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-subtle p-6 overflow-hidden">
        
        {/* Top Header Title & Tagline */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold text-sky-700 uppercase tracking-widest mb-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Global Insight. Indian Advantage.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Smarter chartering for a stronger tomorrow.
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
              Freight forecasts, market intelligence and chartering opportunities — built for a more connected India.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center text-xs">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Model: GBDT Quantile v2.0 (Active)</span>
            </span>
            <span className="bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>Chartering Desk (SAIL / RINL)</span>
            </span>
          </div>
        </div>

        {/* Global Maritime Trade Routes Map Canvas (Pic 2) */}
        <div className="relative mt-6 rounded-xl bg-gradient-to-b from-[#f0f7ff] via-[#e8f2fd] to-[#dbeafe] border border-sky-100 p-4 min-h-[290px] overflow-hidden">
          
          {/* Subtle World Map Watermark & Trade Routes SVG */}
          <div className="absolute inset-0 opacity-80 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1000 320" fill="none" preserveAspectRatio="none">
              {/* Background continents simplified contours */}
              <path d="M 50 80 Q 120 40 220 90 T 260 200 Q 200 240 100 180 Z" fill="#cbd5e1" opacity="0.3" />
              <path d="M 400 60 Q 550 40 650 90 T 720 180 Q 600 220 450 180 Z" fill="#cbd5e1" opacity="0.3" />
              <path d="M 750 180 Q 850 140 920 200 T 880 280 Q 800 290 750 220 Z" fill="#cbd5e1" opacity="0.35" />
              <path d="M 480 180 Q 520 140 560 190 T 520 280 Z" fill="#93c5fd" opacity="0.4" />
              
              {/* Shipping Route 1: US Gulf -> Paradip (Curved Line) */}
              <path d="M 180 120 C 350 40, 520 60, 680 140" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="6 4" fill="none" />
              
              {/* Shipping Route 2: Australia (Gladstone) -> Paradip/Vizag (Curved Line) */}
              <path d="M 850 240 C 780 260, 720 200, 675 145" stroke="#0284c7" strokeWidth="3" fill="none" />

              {/* Shipping Route 3: Indonesia -> East Coast India */}
              <path d="M 780 200 C 740 190, 700 170, 675 148" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 3" fill="none" />

              {/* Waypoints */}
              <circle cx="180" cy="120" r="4.5" fill="#0369a1" />
              <text x="170" y="110" fontSize="10" fontWeight="bold" fill="#0369a1">US Gulf</text>

              <circle cx="850" cy="240" r="4.5" fill="#0369a1" />
              <text x="855" y="245" fontSize="10" fontWeight="bold" fill="#0369a1">Australia</text>

              <circle cx="780" cy="200" r="4" fill="#0369a1" />
              <text x="785" y="210" fontSize="9" fill="#0369a1">Indonesia</text>

              <circle cx="675" cy="142" r="6" fill="#0284c7" />
              <circle cx="675" cy="142" r="10" stroke="#0284c7" strokeWidth="1.5" opacity="0.6" />
              <text x="660" y="130" fontSize="11" fontWeight="900" fill="#0f172a">Haldia</text>
              <text x="685" y="148" fontSize="11" fontWeight="900" fill="#0284c7">Paradip</text>
              <text x="670" y="165" fontSize="11" fontWeight="900" fill="#0f172a">Vizag</text>
            </svg>
          </div>

          {/* Top Route Map Legend */}
          <div className="relative z-10 flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-sky-600"></span> Global Supply Corridors</span>
              <span className="flex items-center gap-1.5"><span className="w-3.5 h-0.5 bg-sky-600"></span> Active Shipping Routes</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-800"></span> Indian Gateway Ports</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {IN_TRANSIT_FLEET.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveMapShipIndex(idx)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                    activeMapShipIndex === idx 
                      ? 'bg-sky-600 text-white shadow-2xs' 
                      : 'bg-white/80 hover:bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  Ship {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Vessel Telemetry Card (Exact Pic 2 Styling) */}
          <div className="relative z-10 max-w-sm ml-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl p-3.5 shadow-elevated text-xs transition-all">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center font-bold">
                  <Ship className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 leading-none">{currentMapShip.name}</h4>
                  <span className="text-[10px] text-slate-500">{currentMapShip.vesselClass} • IMO {currentMapShip.imo}</span>
                </div>
              </div>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {currentMapShip.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 my-2.5 text-[11px]">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Route</span>
                <span className="font-semibold text-slate-800">{currentMapShip.route}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Speed & Status</span>
                <span className="font-semibold text-slate-800">{currentMapShip.speedKnots} kn • {currentMapShip.eta}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Cargo Parcel</span>
                <span className="font-semibold text-slate-800">{currentMapShip.cargo}</span>
              </div>
              <div>
                <span className="text-[9.5px] uppercase font-bold text-slate-400 block">Draft / DWT</span>
                <span className="font-semibold text-slate-800">{currentMapShip.draft} / {currentMapShip.dwt}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>Telemetry Position: {currentMapShip.coords}</span>
              <span className="text-sky-600 font-bold">AIS Live</span>
            </div>
          </div>

          {/* Bottom Map Bar */}
          <div className="relative z-10 mt-3 pt-2 border-t border-sky-200/50 flex flex-wrap items-center justify-between text-[11px] text-slate-600 gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-slate-800">FastAPI Model Server Connected</span>
              <span className="text-slate-400">|</span>
              <span>5 Vessels in Transit to East Coast India (Haldia, Paradip, Vizag)</span>
            </div>
            <span className="text-sky-700 font-semibold cursor-pointer hover:underline">
              Click any ship to inspect voyage telemetry ➔
            </span>
          </div>
        </div>

        {/* 4 Spot Freight Metric Cards (Exact Pic 2 Reference) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          
          {/* Card 1: Cape Freight (BCI) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Cape Freight (BCI)</span>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">-6%</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">$22,850</div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
              <span>vs. last month</span>
              <span className="font-bold text-slate-700 uppercase">SPOT</span>
            </div>
          </div>

          {/* Card 2: Panamax (BPI) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Panamax (BPI)</span>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">-4%</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">$13,420</div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
              <span>vs. last month</span>
              <span className="font-bold text-slate-700 uppercase">SPOT</span>
            </div>
          </div>

          {/* Card 3: Supramax (BSI) */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>Supramax (BSI)</span>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">-1%</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">$9,160</div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
              <span>vs. last month</span>
              <span className="font-bold text-slate-700 uppercase">SPOT</span>
            </div>
          </div>

          {/* Card 4: VLSFO Bunker */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1">
              <span>VLSFO (USD/MT)</span>
              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">-5%</span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">$632</div>
            <div className="flex items-center justify-between text-[10.5px] text-slate-500 mt-2 pt-2 border-t border-slate-200/50">
              <span>vs. last month</span>
              <span className="font-bold text-slate-700 uppercase">SPOT</span>
            </div>
          </div>

        </div>
      </div>


      {/* ========================================================================= */}
      {/* 2. FIRST IN USER SEQUENCE: WEB TERMINAL & LIVE MODEL TRAINER              */}
      {/* (User prompt: "1st will be web terminal part")                            */}
      {/* ========================================================================= */}
      <div id="section-web-terminal">
        <WebTerminalModelTrainer
          onRunScenario={(params) => {
            if (params.origin) setSelectedOrigin(params.origin);
            if (params.destination) setSelectedDestination(params.destination);
            if (params.vessel) setSelectedVessel(params.vessel);
            if (params.volume) setCargoVolumeMT(params.volume);
            if (params.horizon) setContractHorizonMonths(params.horizon);
            if (params.volatility) setVolatilityIndex(params.volatility);
            if (params.newsSignal !== undefined) setActiveNewsSignal(params.newsSignal);
            if (params.coaSplit) setCoaSplitPercent(params.coaSplit);
            if (params.terminalMetrics) setTerminalMetrics(params.terminalMetrics);
          }}
          currency={currency}
          currentForecast={forecast}
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
          selectedVessel={selectedVessel}
          cargoVolumeMT={cargoVolumeMT}
          contractHorizonMonths={contractHorizonMonths}
          coaSplitPercent={coaSplitPercent}
        />
      </div>


      {/* ========================================================================= */}
      {/* 3. PHASE 1: BULK PROCUREMENT ORDERING & MULTI-SOURCE DATA INGESTION       */}
      {/* (Exact Flow of Picture 1 + 2-Column Forecast & Plan-a-Charter from Pic 2) */}
      {/* ========================================================================= */}
      <div id="section-phase-1" className="bg-white border border-slate-200 rounded-2xl shadow-subtle p-6">
        
        {/* Phase Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-sky-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              1
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 1: BULK PROCUREMENT ORDERING & MULTI-SOURCE DATA INGESTION
              </h2>
              <p className="text-xs text-slate-500">
                User Configuration • Multi-Source Sovereign Telemetry • 21-Day Tender Horizon • P10/P50/P90 Quantile Envelopes
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-full">
            Step 1 · Planning & Tender Gate
          </span>
        </div>

        {/* Two-Column Grid (Direct Pic 2 Layout: Left = 6M Forecast, Right = Plan a Charter) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: 6-Month Freight Forecast Chart (Pic 2) */}
          <div className="lg:col-span-8 bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-200/80 gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">6-Month Freight Forecast</h3>
                <p className="text-xs text-slate-500">
                  {chartVessel.toUpperCase()} (BCI) — Asia to East Coast India ({currSym} / Day)
                </p>
              </div>

              {/* Vessel Class Selector Tabs (Pic 2) */}
              <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                {['capesize', 'panamax', 'supramax', 'handysize'].map((vKey) => (
                  <button
                    key={vKey}
                    onClick={() => {
                      setChartVessel(vKey);
                      setSelectedVessel(vKey);
                    }}
                    className={`px-2.5 py-1 rounded font-semibold capitalize cursor-pointer transition-colors ${
                      chartVessel === vKey 
                        ? 'bg-sky-600 text-white font-bold shadow-2xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {vKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeframe Selector Bar (1M, 3M, 6M, 1Y) */}
            <div className="flex items-center justify-between text-xs mb-3 text-slate-500">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>P10 (Low) — P50 (Mid) — P90 (High) Quantile Risk Envelope</span>
              </span>
              <div className="flex items-center space-x-1 font-semibold text-[11px]">
                {['1M', '3M', '6M', '1Y'].map((h) => (
                  <button
                    key={h}
                    onClick={() => setChartHorizon(h)}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      chartHorizon === h ? 'bg-slate-800 text-white font-bold' : 'bg-slate-200/70 hover:bg-slate-300 text-slate-700'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Quantile Cone Graph */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={timeSeriesData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '11px' }}
                    formatter={(val) => [`${currSym}${Number(val).toFixed(2)} /MT`, 'Rate']}
                  />
                  {/* Historical Freight */}
                  <Line type="monotone" dataKey="actualSpot" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} name="Historical Rate" />
                  {/* P90 High Bound Area */}
                  <Area type="monotone" dataKey="p90" stroke="#f43f5e" fill="#ffe4e6" fillOpacity={0.4} strokeDasharray="4 4" name="P90 Risk Ceiling" />
                  {/* P50 Median Expected */}
                  <Line type="monotone" dataKey="p50" stroke="#0369a1" strokeWidth={2} strokeDasharray="5 5" name="P50 Expected" />
                  {/* P10 Opportunity Floor */}
                  <Area type="monotone" dataKey="p10" stroke="#10b981" fill="#ecfdf5" fillOpacity={0.4} strokeDasharray="4 4" name="P10 Cost Floor" />
                  {/* Today Marker */}
                  <ReferenceLine x="Today" stroke="#475569" strokeDasharray="3 3" label={{ value: 'Today', fill: '#475569', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Ingested Sovereign Datasets Row (Flow Pic 1) */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
              <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
                <span className="font-bold text-slate-700">MULTI-SOURCE FEEDS:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-700">SSE (Freight)</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-700">IMD/NOAA (Weather)</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-700">ICE (Brent)</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-700">FreightFox (Trucking)</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-700">FOIS (Railways)</span>
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-700">DGCIS (Customs)</span>
              </div>
              <button
                onClick={onOpenDatasets}
                className="text-sky-700 hover:text-sky-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Audit Raw Datasets</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Column: Plan a Charter Card (Pic 2) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Plan a Charter</span>
                </h3>
                <p className="text-[11px] text-slate-500">Custom shipment parameters & optimizer</p>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Interactive
              </span>
            </div>

            {/* 1. Cargo Volume Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase block mb-1">
                Cargo Volume (Tonnes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={inputVolume}
                  onChange={(e) => setInputVolume(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">MT</span>
              </div>
            </div>

            {/* 2. Origin & Destination Dropdowns */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Origin
                </label>
                <select
                  value={inputOrigin}
                  onChange={(e) => setInputOrigin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="hay_point">Australia (Hay Point)</option>
                  <option value="gladstone">Australia (Gladstone)</option>
                  <option value="samarinda">Indonesia (Samarinda)</option>
                  <option value="taboneo">Indonesia (Taboneo)</option>
                  <option value="maputo">Mozambique (Maputo)</option>
                  <option value="hampton_roads">US Gulf / Hampton</option>
                  <option value="vostochny">Russia (Vostochny)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Destination
                </label>
                <select
                  value={inputDestination}
                  onChange={(e) => setInputDestination(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-800"
                >
                  <option value="paradip">Paradip Port (PPT)</option>
                  <option value="vizag">Visakhapatnam (VPA)</option>
                  <option value="dhamra">Dhamra Port (DPCL)</option>
                  <option value="gangavaram">Gangavaram (GPL)</option>
                  <option value="haldia">Haldia Dock (HDC)</option>
                </select>
              </div>
            </div>

            {/* Destination Draft Feasibility Note (Pic 2) */}
            <div className="bg-sky-50/70 border border-sky-200 rounded-lg p-2.5 text-[11px] text-sky-900 flex items-start gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{activeDestObj.name} draft:</span>{' '}
                <span className="font-mono font-bold text-sky-950">{activeDestObj.maxDraftLaden}m permissible</span>.
                <div className="text-[10px] text-sky-700 mt-0.5">Anchorage queue wait: ~{activeDestObj.avgWaitDays} days.</div>
              </div>
            </div>

            {/* 3. Deadline / Laycan Date & Vessel Class */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Laycan Deadline
                </label>
                <input
                  type="date"
                  value={inputDeadline}
                  onChange={(e) => setInputDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Vessel Class
                </label>
                <select
                  value={inputVessel}
                  onChange={(e) => setInputVessel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-800"
                >
                  <option value="capesize">Capesize (Auto-rec)</option>
                  <option value="panamax">Panamax (75k MT)</option>
                  <option value="supramax">Supramax (55k MT)</option>
                </select>
              </div>
            </div>

            {/* Action CTA Button (Exact Pic 2 Blue Button) */}
            <button
              onClick={handleCalculateOptimalCharter}
              disabled={isOptimizing}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              {isOptimizing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Optimizing Chartering Strategy...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Calculate Optimal Charter</span>
                </>
              )}
            </button>

            {/* Tender Recommendation Note (Flow Pic 1 Bottom) */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[10.5px] text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Tender Preparation & Charter-Party Analysis
              </span>
              <p>
                Advises on <b>21-day tender booking windows</b> using P10/P50/P90 price forecasts. Recommended mix: <b>~70% COA / ~30% Spot baseline</b>, hedged against market volatility.
              </p>
            </div>
          </div>

        </div>
      </div>


      {/* ========================================================================= */}
      {/* 4. PHASE 2: VESSEL BUNCHING ENG & EMERGENCY COAL PRIORITY (2-3 DAYS OUT) */}
      {/* (Flow of Picture 1: Tier-1 ETA -> Congestion Alert -> Emergency Priority)  */}
      {/* ========================================================================= */}
      <div id="section-phase-2" className="bg-white border border-slate-200 rounded-2xl shadow-subtle p-6">
        
        {/* Phase Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-amber-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              2
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 2: VESSEL BUNCHING ENG & EMERGENCY COAL PRIORITY (2–3 DAYS OUT)
              </h2>
              <p className="text-xs text-slate-500">
                Tier-1 Arrival ETA (48h–72h) • Congestion Alert (&gt;24–48h wait) • Critical Stockpile &lt; 7 Days / CEA Red Flag Check
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
            Step 2 · 48h–72h Radar Gate
          </span>
        </div>

        {/* Phase 2 Flow Diagram Sequence (Matching Pic 1 Phase 2 Exactly) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          
          {/* Box 1: TIER-1 ARRIVAL ETA (48h-72h) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Step 2.1 • Telemetry Gate</div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>TIER-1 ARRIVAL ETA (48h–72h / 2–3 Days Out)</span>
            </h4>
            <p className="text-slate-600 text-[11px]">
              Continuous satellite AIS geofencing tracks inbound bulk carriers 80 NM to 300 NM out, calculating true arrival timestamps against tidal windows.
            </p>
            <div className="bg-white p-2 rounded border border-slate-200 text-[11px] font-mono font-semibold text-slate-700">
              MV OLYMPIC GLORY: ETA 48h (Paradip) • MV CAPE ASIA: ETA 52h (Paradip)
            </div>
          </div>

          {/* Box 2: TIER-1 CONGESTION ALERT (>24-48h) */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 text-xs space-y-2">
            <div className="text-[10px] font-bold uppercase text-rose-700 tracking-wider">Step 2.2 • Bottleneck Detection</div>
            <h4 className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>TIER-1 CONGESTION ALERT (Wait &gt; 24–48h)</span>
            </h4>
            <p className="text-rose-800 text-[11px]">
              Paradip roadstead currently has 5 bulkers waiting at outer anchorage. Average pre-berthing wait: <b>3.8 Days</b>. Same-day Capesize berth collision detected.
            </p>
            <div className="bg-white p-2 rounded border border-rose-200 text-[11px] font-bold text-rose-700">
              Demurrage Exposure: ₹65 Lakh/day ($25,000/day per vessel)
            </div>
          </div>

          {/* Box 3: EMERGENCY COAL PRIORITY FACTOR (Pic 1 Diamond Decision) */}
          <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-4 text-xs space-y-2">
            <div className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">Step 2.3 • CEA Red Flag Logic</div>
            <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>EMERGENCY COAL PRIORITY FACTOR</span>
            </h4>
            <div className="p-2 bg-white rounded border border-amber-200 text-[11px]">
              <div className="font-bold text-slate-900 mb-1">Decision Rule: Critical Stockpile &lt; 7 Days?</div>
              <div className="flex items-center justify-between text-[10.5px]">
                <span className="text-rose-700 font-bold">YES ➔ Emergency Priority (Express Berth)</span>
                <span className="text-slate-600">NO ➔ Maintain FIFO</span>
              </div>
            </div>
            <p className="text-[10.5px] text-amber-900">
              Rourkela Steel Plant (RSP) at <b>6.2 days stockpile</b> triggers CEA Emergency Priority dispatch over Bokaro (16.2 days).
            </p>
          </div>

        </div>

        {/* Phase 2 Interactive Dispatch Terminal Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Vessel Bunching & Anti-Congestion Terminal Status</h4>
              <p className="text-xs text-slate-400">
                1 Express Berthing Assigned • 1 Candidate Diversion Recommended • Zero Demurrage Collisions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setEmergencyOverride('emergency')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                emergencyOverride === 'emergency' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
              }`}
            >
              Force Emergency Priority
            </button>
            <button
              onClick={() => setEmergencyOverride('fifo')}
              className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-colors ${
                emergencyOverride === 'fifo' ? 'bg-sky-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Maintain FIFO
            </button>
          </div>
        </div>

      </div>


      {/* ========================================================================= */}
      {/* 5. PHASE 3: CRITICAL DECISION GATE & MULTIMODAL PORT DIVERSION            */}
      {/* (Flow of Picture 1: 3-Way Optimization Equation -> Optimization Verdict)  */}
      {/* ========================================================================= */}
      <div id="section-phase-3" className="bg-white border border-slate-200 rounded-2xl shadow-subtle p-6">
        
        {/* Phase Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              3
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 3: CRITICAL DECISION GATE & MULTIMODAL PORT DIVERSION (6h ETA THRESHOLD)
              </h2>
              <p className="text-xs text-slate-500">
                3-Way Optimization Equation • Cost B (Diversion Bunker) vs Cost C (FOIS Rail Tariff + FreightFox Trucking Index)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full">
            Step 3 · 6h Lock-In Gate
          </span>
        </div>

        {/* 3-Way Optimization Equation Cards (Pic 1 Phase 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Left: 3-Way Optimization Equation */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                Cost Equation Breakdown
              </span>
              <span className="font-mono text-xs font-bold text-slate-700">Cost A vs (Cost B + Cost C)</span>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-700 block">Cost A: Default Port Demurrage Risk</span>
                  <span className="text-[10px] text-slate-500">Paradip Anchorage wait: 3.8 days @ $25,000/day</span>
                </div>
                <span className="font-bold font-mono text-rose-700 text-sm">₹80.75 Lakhs</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-purple-700 block">Cost B: Port Diversion Bunker Fuel</span>
                  <span className="text-[10px] text-slate-500">62 NM sea deviation to Dhamra Port (5.0 hrs steaming)</span>
                </div>
                <span className="font-bold font-mono text-purple-700 text-sm">₹14.20 Lakhs</span>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-sky-700 block">Cost C: Multimodal Inland Rail Execution</span>
                  <span className="text-[10px] text-slate-500">Indian Railways FOIS 48hr rake tariff vs FreightFox Trucking Index</span>
                </div>
                <span className="font-bold font-mono text-sky-700 text-sm">₹21.40 Lakhs</span>
              </div>
            </div>

            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] font-bold flex justify-between items-center">
              <span>Net Logistics Arbitrage Savings:</span>
              <span className="text-sm font-mono">+₹45.15 Lakhs Net Profit</span>
            </div>
          </div>

          {/* Right: Optimization Verdict (Pic 1 Diamond Verdict) */}
          <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-2.5 py-0.5 rounded border border-purple-700">
                  Optimization Verdict
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">Recommended: Diversion</span>
              </div>

              <h3 className="text-base font-bold text-white mb-2">
                Execute Multimodal Diversion (Dhamra Gateway)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                By ordering <b>MV Cape Asia</b> to divert 62 NM to Dhamra DPCL Bulk Berth BB-01, cargo berths immediately without waiting in Paradip’s 3.8-day queue. High-speed discharge loads directly to South Eastern Railway (SER) FOIS rakes for Bokaro Steel Plant.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-purple-800/60">
              <button
                onClick={() => setDiversionDecision('divert')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  diversionDecision === 'divert' 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs' 
                    : 'bg-purple-900/40 text-purple-200 border border-purple-700'
                }`}
              >
                Execute Multimodal Diversion
              </button>

              <button
                onClick={() => setDiversionDecision('virtual_arrival')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  diversionDecision === 'virtual_arrival' 
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs' 
                    : 'bg-purple-900/40 text-purple-200 border border-purple-700'
                }`}
              >
                Virtual Arrival Speed Optimization
              </button>
            </div>
          </div>

        </div>

      </div>


      {/* ========================================================================= */}
      {/* 6. PHASE 4: BERTH DISCHARGE, CARGO MATCHING & COASTAL HOP TRIANGULATION  */}
      {/* (Flow of Picture 1: Berth Discharge -> Cargo Matching -> Triangulation)  */}
      {/* ========================================================================= */}
      <div id="section-phase-4" className="bg-white border border-slate-200 rounded-2xl shadow-subtle p-6">
        
        {/* Phase Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
              4
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
                PHASE 4: BERTH DISCHARGE, CARGO MATCHING & COASTAL HOP TRIANGULATION
              </h2>
              <p className="text-xs text-slate-500">
                2,000 MT/hr Unloading • Steel Plant Hold Allocation • Wetzel & Tierney (2020) Coastal Backhaul Triangulation
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full">
            Step 4 · Execution & Backhaul
          </span>
        </div>

        {/* Phase 4 Sub-Stages Grid (Pic 1 Phase 4) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          
          {/* Sub-Stage 1: Berth Discharge & Demurrage Clock Stop */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-400">Discharge Engineering</div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Anchor className="w-4 h-4 text-emerald-600" />
              <span>BERTH DISCHARGE & DEMURRAGE CLOCK STOP</span>
            </h4>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Discharge Speed:</span>
                <span className="font-bold text-emerald-700">2,000 MT/hr mechanized</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Turnaround Time:</span>
                <span className="font-bold text-slate-800">2.8 Days total discharge</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Laytime Status:</span>
                <span className="font-bold text-emerald-700">Completed 14h within laytime</span>
              </div>
            </div>
          </div>

          {/* Sub-Stage 2: Cargo Matching (Plant Allocation) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-400">Hinterland Evacuation</div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Train className="w-4 h-4 text-sky-600" />
              <span>CARGO MATCHING (Coal Details to Plant)</span>
            </h4>
            <div className="bg-white p-3 rounded-lg border border-slate-200 text-[11px] space-y-1">
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span className="font-semibold text-slate-700">RINL Vizag:</span>
                <span className="text-slate-500">Direct conveyor link (0km)</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span className="font-semibold text-slate-700">SAIL Rourkela:</span>
                <span className="text-slate-500">SER MCHP Rakes (Paradip)</span>
              </div>
              <div className="flex justify-between pb-1 border-b border-slate-100">
                <span className="font-semibold text-slate-700">TATA Kalinganagar:</span>
                <span className="text-slate-500">Dhamra DPCL Rakes (110km)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">NTPC Talcher:</span>
                <span className="text-slate-500">East Coast Railway Rakes</span>
              </div>
            </div>
          </div>

          {/* Sub-Stage 3: Coastal Hop Triangulation Engine */}
          <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-4 text-xs space-y-2">
            <div className="text-[10px] font-bold uppercase text-emerald-800">Wetzel & Tierney (2020)</div>
            <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700" />
              <span>COASTAL HOP TRIANGULATION ENGINE</span>
            </h4>
            <div className="bg-white p-3 rounded-lg border border-emerald-200 text-[11px] space-y-1.5">
              <div className="font-bold text-slate-800">Match Domestic Coastal Backhaul Cargo:</div>
              <p className="text-slate-600 text-[10.5px]">
                Paradip/Dhamra ➔ Ennore ➔ Mormugao / China export eliminates deadheading ballast miles and cuts net freight.
              </p>
              <div className="text-emerald-800 font-bold flex items-center gap-1">
                <span>• Slashes procurement costs by up to 18.4%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Commercial Impact Banner (Pic 1 Phase 4 Bottom) */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-sky-950 text-white rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-sm">Commercial Impact: Up to 18.4% Net Procurement Reduction</h4>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Triangulating return tramp voyages saves $3.50–$5.20 / MT in freight rebates, eliminates empty ballast voyages, and drastically reduces voyage carbon emissions.
            </p>
          </div>

          <button
            onClick={onExportReport}
            className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center space-x-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Generate Executive Audit Brief</span>
          </button>
        </div>

      </div>

    </div>
  );
}
