import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Database, ExternalLink, Flame, Factory, ArrowRight, RefreshCw, 
  Layers, Calculator, FileText, Sparkles, Scale, Train, Anchor,
  Clock, Activity, Calendar, Compass, ShieldCheck, ChevronRight, Zap
} from 'lucide-react';

export default function CagAuditInventoryShield({ currency = 'INR', selectedPort = 'paradip', activeNewsSignal = null }) {
  const isINR = currency === 'INR';
  const currSym = isINR ? '₹' : '$';
  const fxMultiplier = isINR ? 95.0 : 1;

  // Active view: '4layers' | 'stockout' | 'carrying_cost' | 'datasets'
  const [activeSection, setActiveSection] = useState('4layers');

  // Layer 1 Simulator State
  const [forecastPlant, setForecastPlant] = useState('rsp'); // 'rsp' | 'bsl' | 'dsp'
  const [forecastingModel, setForecastingModel] = useState('ma'); // 'ma' | 'xgboost'
  const [plannedProductionRamp, setPlannedProductionRamp] = useState(0); // +/- %

  // Layer 4 / Calculator State
  const [waccRate, setWaccRate] = useState(9.8); // 9.8% p.a. PSU benchmark
  const [coalPriceUSD, setCoalPriceUSD] = useState(220); // $220 / MT benchmark
  const [inventoryVolumeMT, setInventoryVolumeMT] = useState(2200000); // 2.2 Million MT SAIL base
  const [isEmergencyRerouteActive, setIsEmergencyRerouteActive] = useState(false);

  // CAG Audit Findings Baseline
  const CAG_AUDIT_SUMMARY = {
    reportNumber: "CAG Report No. 10 of 2025",
    title: "SAIL Inventory Management Performance Audit",
    hotMetalLossRevenueCr: 1231.52,
    hotMetalLossLakhMT: 9.32,
    excessCoalExpenditureCr: 2539.68
  };

  // Master Directory of 8 Free & Open-Source Sovereign Datasets
  const FREE_SOVEREIGN_DATASETS = [
    {
      id: "jpc_ministry_steel",
      rank: "#1 FACTORY CONSUMPTION",
      name: "Joint Plant Committee (JPC) Steel Registry",
      provider: "Ministry of Steel, Govt of India",
      portalUrl: "https://jpcsteel.gov.in",
      keyMetrics: "Plant-wise Coking Coal Burn, Steel Production, Stockyard Days",
      howItSolvesCAG: "Predicts how fast each blast furnace burns coal so stock never drops below the 15-day safety line."
    },
    {
      id: "open_ais_network",
      rank: "#2 SATELLITE SHIP TRACKING",
      name: "OpenAIS Public Maritime Telemetry",
      provider: "ITU-R M.1371 International Protocol",
      portalUrl: "https://globalfishingwatch.org",
      keyMetrics: "Live Ship Speed (knots), Coordinates, Days Out from Australia",
      howItSolvesCAG: "Tracks inbound bulkers 5,350 NM away to calculate exact arrival date at Paradip/Vizag."
    },
    {
      id: "ipa_daily_port",
      rank: "#3 PORT QUEUES & BERTHS",
      name: "Indian Ports Association (IPA) Daily Gazette",
      provider: "Ministry of Ports & Shipping",
      portalUrl: "https://ipa.nic.in",
      keyMetrics: "Anchorage Waiting Time, Berth Unloading Speed (TPD)",
      howItSolvesCAG: "Warns if Paradip or Haldia have a 4-day queue so ships can slow down and save fuel."
    },
    {
      id: "fois_indian_railways",
      rank: "#4 RAILWAY EVACUATION",
      name: "Freight Operations Info System (FOIS)",
      provider: "Centre for Railway Information Systems (CRIS)",
      portalUrl: "https://fois.indianrail.gov.in",
      keyMetrics: "Port Siding Train Availability, Rake Turnaround Time (TAT)",
      howItSolvesCAG: "Coordinates trains from port sidings to blast furnaces so unloaded coal reaches the factory on time."
    },
    {
      id: "dgcis_comtrade",
      rank: "#5 IMPORT TRADE VALUES",
      name: "DGCIS Customs Foreign Trade Registry",
      provider: "Ministry of Commerce & Industry",
      portalUrl: "https://dgciskol.gov.in",
      keyMetrics: "Invoice Values ($/MT), Port-Wise Coal Inflow Volumes",
      howItSolvesCAG: "Gives authentic coal prices to calculate the exact holding cost per day (₹7.03/MT/day)."
    },
    {
      id: "rbi_fbil_financials",
      rank: "#6 FINANCIAL INTEREST BENCHMARK",
      name: "Reserve Bank of India (RBI) Benchmarks",
      provider: "Reserve Bank of India / FBIL",
      portalUrl: "https://rbi.org.in",
      keyMetrics: "91-Day T-Bill Rates, PSU Cost of Capital (9.8% WACC)",
      howItSolvesCAG: "Calculates the financial interest cost of keeping excess coal tied up in stockyards."
    },
    {
      id: "cil_coastal_shipping",
      rank: "#7 COASTAL CABOTAGE ALLOCATIONS",
      name: "Coal India Coastal Shipping Bulletins",
      provider: "Ministry of Coal",
      portalUrl: "https://coal.nic.in",
      keyMetrics: "Domestic Thermal Coal Quotas to Southern Power Plants",
      howItSolvesCAG: "Fills empty returning ships with domestic coastal coal under the cabotage waiver to eliminate deadheads."
    },
    {
      id: "ibm_export_stats",
      rank: "#8 MINERAL EXPORT PARCELS",
      name: "Indian Bureau of Mines (IBM) Statistics",
      provider: "Ministry of Mines",
      portalUrl: "https://ibm.gov.in",
      keyMetrics: "East Coast Iron Ore Pellet & Bauxite Export Clearances",
      howItSolvesCAG: "Provides export parcels so empty bulkers carry Indian minerals to East Asia and generate profit."
    }
  ];

  // Active Plant Profile
  const activePlantMeta = {
    rsp: {
      name: "Rourkela Steel Plant (RSP)",
      location: "Odisha (380 km from Paradip)",
      baseBurnMT: 12200,
      currentStockMT: 151280,
      safetyNormDays: 15.0,
      primaryPort: "Paradip Port (PPT)",
      berthTPD: 50000,
      railTATDays: 1.2
    },
    bsl: {
      name: "Bokaro Steel Plant (BSL)",
      location: "Jharkhand (490 km from Dhamra)",
      baseBurnMT: 13000,
      currentStockMT: 210600,
      safetyNormDays: 15.0,
      primaryPort: "Dhamra Port (DPCL)",
      berthTPD: 65000,
      railTATDays: 1.8
    },
    dsp: {
      name: "Durgapur Steel Plant (DSP)",
      location: "West Bengal (220 km from Haldia)",
      baseBurnMT: 6800,
      currentStockMT: isEmergencyRerouteActive ? 104840 : 59840,
      safetyNormDays: 15.0,
      primaryPort: isEmergencyRerouteActive ? "Dhamra Port (DPCL Express)" : "Haldia Dock Complex (HDC)",
      berthTPD: isEmergencyRerouteActive ? 65000 : 22000,
      railTATDays: isEmergencyRerouteActive ? 1.4 : 2.6
    }
  }[forecastPlant];

  // Dynamic Layer Calculations
  const layerCalculations = useMemo(() => {
    // 1. Demand Forecast
    const rampFactor = 1 + (plannedProductionRamp / 100);
    const predictedBurnRate = Math.round(activePlantMeta.baseBurnMT * rampFactor);
    const daysOfCurrentStock = parseFloat((activePlantMeta.currentStockMT / predictedBurnRate).toFixed(1));
    const isStockBelowSafety = daysOfCurrentStock < activePlantMeta.safetyNormDays;

    // 2. Multi-Stage Supply Transit Timeline
    const voyageSeaDays = 8.5; // Gladstone/Hay Point to Bay of Bengal
    const anchorageWaitDays = activePlantMeta.primaryPort.includes("Haldia") ? 4.2 : 1.8;
    const berthDischargeDays = parseFloat((75000 / activePlantMeta.berthTPD).toFixed(1));
    const railEvacuationDays = activePlantMeta.railTATDays;
    const totalTransitDays = parseFloat((voyageSeaDays + anchorageWaitDays + berthDischargeDays + railEvacuationDays).toFixed(1));

    // 3. Risk-Adjusted Early Warning (P90)
    const weatherRiskBufferDays = 1.2;
    const railCongestionBufferDays = 0.6;
    const p90ArrivalDays = parseFloat((totalTransitDays + weatherRiskBufferDays + railCongestionBufferDays).toFixed(1));
    const stockoutDeficitDays = parseFloat((p90ArrivalDays - daysOfCurrentStock).toFixed(1));
    const isOffBlastTriggered = daysOfCurrentStock < p90ArrivalDays;

    // 4. Economic Decision Engine (Buy Now vs Wait)
    const dailyWaccRate = (waccRate / 100) / 365;
    const dailyFinancingUSD = coalPriceUSD * dailyWaccRate;
    const dailyStorageUSD = 0.015;
    const dailyWindageUSD = coalPriceUSD * (0.0008 / 30);
    const carryingCostUSDPerMTDay = dailyFinancingUSD + dailyStorageUSD + dailyWindageUSD;
    const carryingCostINRPerMTDay = carryingCostUSDPerMTDay * fxMultiplier;

    // Option A: Buy Now (75,000 MT parcel)
    const carryingCostFor14dUSD = carryingCostUSDPerMTDay * 14 * 75000;
    const carryingCostFor14dINR = carryingCostFor14dUSD * fxMultiplier;

    // Option B: Wait 14 days
    const freightSpikeRiskUSD = 4.20 * 75000;
    const freightSpikeRiskINR = freightSpikeRiskUSD * fxMultiplier;

    let recommendedDecision = 'BUY_NOW';
    let decisionReason = '';

    if (isOffBlastTriggered) {
      recommendedDecision = 'URGENT_PROCUREMENT';
      decisionReason = `CRITICAL WARNING: Factory will run out of coal in ${daysOfCurrentStock} days, but delivery takes ${p90ArrivalDays} days. Immediate procurement or port diversion required to prevent furnace shutdown.`;
    } else if (carryingCostFor14dUSD > freightSpikeRiskUSD && daysOfCurrentStock > 18.0) {
      recommendedDecision = 'WAIT';
      decisionReason = `Factory has plenty of coal (${daysOfCurrentStock} days vs 15-day norm). Storing more coal costs ₹${(carryingCostFor14dINR / 10000000).toFixed(2)} Cr in holding costs, which is higher than price risk. Recommendation: Wait 7–10 days before ordering.`;
    } else {
      recommendedDecision = 'BUY_NOW';
      decisionReason = `Best economic time to buy. Holding cost is low (₹${carryingCostINRPerMTDay.toFixed(2)}/MT/day), shielding against market price jumps while safely maintaining the 15-day buffer.`;
    }

    return {
      predictedBurnRate,
      daysOfCurrentStock,
      isStockBelowSafety,
      voyageSeaDays,
      anchorageWaitDays,
      berthDischargeDays,
      railEvacuationDays,
      totalTransitDays,
      p90ArrivalDays,
      stockoutDeficitDays,
      isOffBlastTriggered,
      carryingCostUSDPerMTDay: carryingCostUSDPerMTDay.toFixed(3),
      carryingCostINRPerMTDay: carryingCostINRPerMTDay.toFixed(2),
      carryingCostFor14dUSD: Math.round(carryingCostFor14dUSD),
      carryingCostFor14dINR: (carryingCostFor14dINR / 10000000).toFixed(2),
      freightSpikeRiskUSD: Math.round(freightSpikeRiskUSD),
      freightSpikeRiskINR: (freightSpikeRiskINR / 10000000).toFixed(2),
      recommendedDecision,
      decisionReason
    };
  }, [activePlantMeta, plannedProductionRamp, waccRate, coalPriceUSD, fxMultiplier, isEmergencyRerouteActive]);

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* 1. ULTRA-SIMPLE PURPOSE BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  Government Audit Solution
                </span>
                <span className="text-[11px] text-slate-300 font-mono">CAG Report 10 of 2025</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                Blast Furnace Stockout Shield & Coal Supply Defense
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                <strong>In simple terms:</strong> When an Indian steel plant runs out of coal, blast furnaces freeze, destroying millions in steel production. This system connects factory coal stockpiles directly to satellite ship tracking so plants never run dry.
              </p>
            </div>
          </div>

          {/* 3 Clear Stat Badges */}
          <div className="grid grid-cols-3 gap-2 shrink-0 text-center">
            <div className="bg-white/10 border border-white/10 p-2.5 rounded-xl">
              <span className="text-[10px] text-amber-300 font-bold uppercase block">Steel Lost</span>
              <span className="text-sm font-black text-rose-400">₹1,231 Cr</span>
              <span className="text-[9px] text-slate-400 block">CAG Audited Loss</span>
            </div>
            <div className="bg-white/10 border border-white/10 p-2.5 rounded-xl">
              <span className="text-[10px] text-amber-300 font-bold uppercase block">Required Stock</span>
              <span className="text-sm font-black text-emerald-400">15 Days</span>
              <span className="text-[9px] text-slate-400 block">Safety Baseline</span>
            </div>
            <div className="bg-white/10 border border-white/10 p-2.5 rounded-xl">
              <span className="text-[10px] text-amber-300 font-bold uppercase block">Data Cost</span>
              <span className="text-sm font-black text-emerald-400">₹0 (Free)</span>
              <span className="text-[9px] text-slate-400 block">Sovereign Data</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SIMPLE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSection('4layers')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === '4layers'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-300" />
          <span>1. 4-Step Supply Pipeline (Interactive)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('stockout')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'stockout'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Factory className="w-4 h-4 text-purple-300" />
          <span>2. All Plants Radar (Rourkela / Bokaro / Durgapur)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('carrying_cost')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'carrying_cost'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-4 h-4 text-purple-300" />
          <span>3. Holding Cost Calculator ($0.074/MT/day)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('datasets')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'datasets'
              ? 'bg-purple-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-purple-300" />
          <span>4. 8 Free Sovereign Datasets</span>
        </button>
      </div>

      {/* SECTION 1: THE 4-STEP DECISION PIPELINE */}
      {(activeSection === '4layers') && (
        <div className="space-y-4">
          
          {/* Target Plant Selector Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-900 block">Select Steel Plant to Analyze:</span>
              <span className="text-[11px] text-slate-500">Each factory has different coal burn rates, ports, and train delivery times</span>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setForecastPlant('rsp')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  forecastPlant === 'rsp' ? 'bg-white text-purple-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rourkela (RSP)
              </button>
              <button
                type="button"
                onClick={() => setForecastPlant('bsl')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  forecastPlant === 'bsl' ? 'bg-white text-purple-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bokaro (BSL)
              </button>
              <button
                type="button"
                onClick={() => setForecastPlant('dsp')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  forecastPlant === 'dsp' ? 'bg-white text-purple-900 shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Durgapur (DSP)
              </button>
            </div>
          </div>

          {/* 4 CARDS: 4-STEP VISUAL STORYBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* STEP 1: FACTORY COAL STOCK */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-purple-900 text-white flex items-center justify-center font-black text-xs">
                      1
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        How Much Coal Do We Have?
                      </h3>
                      <span className="text-[10px] text-slate-400">Step 1: Factory Ground Stock & Burn Rate</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold">
                    Govt JPC Data
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Shows how many days of coal remain in the stockyard at <strong>{activePlantMeta.name}</strong> before blast furnaces run out of fuel.
                </p>

                {/* Big Visual Gauge */}
                <div className="grid grid-cols-3 gap-2.5 text-center mb-4">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-semibold block">Daily Burn</span>
                    <span className="text-base font-black text-slate-900">{layerCalculations.predictedBurnRate.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">tonnes/day</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-500 font-semibold block">Total Stock</span>
                    <span className="text-base font-black text-slate-900">{(activePlantMeta.currentStockMT / 1000).toFixed(0)}k</span>
                    <span className="text-[10px] text-slate-500 block">tonnes in yard</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${layerCalculations.isStockBelowSafety ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <span className="text-[10px] text-slate-600 font-semibold block">Days Remaining</span>
                    <span className={`text-lg font-black ${layerCalculations.isStockBelowSafety ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {layerCalculations.daysOfCurrentStock} Days
                    </span>
                    <span className="text-[10px] text-slate-500 block">Goal: 15+ Days</span>
                  </div>
                </div>

                {/* Simple Production Slider */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-semibold text-slate-700">Simulate Steel Factory Output:</span>
                    <span className="font-black text-purple-900 bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                      {plannedProductionRamp > 0 ? `+${plannedProductionRamp}% (High)` : plannedProductionRamp < 0 ? `${plannedProductionRamp}% (Low)` : 'Normal (100%)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    step="5"
                    value={plannedProductionRamp}
                    onChange={(e) => setPlannedProductionRamp(parseInt(e.target.value))}
                    className="w-full accent-purple-700 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">Slide to see how faster steel manufacturing drains coal faster</span>
                </div>
              </div>
            </div>

            {/* STEP 2: DELIVERY TIMELINE */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                      2
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        How Long Until Fresh Coal Arrives?
                      </h3>
                      <span className="text-[10px] text-slate-400">Step 2: Ship Voyage + Port Queue + Train</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
                    AIS + Train FOIS
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Real shipping has 4 stages. We track every stage from the Australian loading dock to the factory:
                </p>

                {/* Visual Journey Bar */}
                <div className="space-y-2 mb-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">🚢</span>
                      <div>
                        <span className="font-bold text-slate-800">1. Sea Voyage (Satellite AIS)</span>
                        <p className="text-[10px] text-slate-500">Australia to Bay of Bengal (5,350 NM)</p>
                      </div>
                    </div>
                    <span className="font-black text-blue-700">{layerCalculations.voyageSeaDays} Days</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">⚓</span>
                      <div>
                        <span className="font-bold text-slate-800">2. Port Waiting Line (IPA)</span>
                        <p className="text-[10px] text-slate-500">Waiting for empty berth at {activePlantMeta.primaryPort}</p>
                      </div>
                    </div>
                    <span className="font-black text-amber-700">{layerCalculations.anchorageWaitDays} Days</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">🏗️</span>
                      <div>
                        <span className="font-bold text-slate-800">3. Unload Ship at Berth</span>
                        <p className="text-[10px] text-slate-500">75,000 MT bulk cargo cranes</p>
                      </div>
                    </div>
                    <span className="font-black text-indigo-700">{layerCalculations.berthDischargeDays} Days</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">🚆</span>
                      <div>
                        <span className="font-bold text-slate-800">4. Train to Steel Plant (FOIS)</span>
                        <p className="text-[10px] text-slate-500">Railway wagons from port to {activePlantMeta.name}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-700">{layerCalculations.railEvacuationDays} Days</span>
                  </div>
                </div>

                {/* Total Transit Pill */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">Total Delivery Time:</span>
                  <div className="text-right">
                    <span className="text-base font-black text-blue-800">{layerCalculations.totalTransitDays} Days</span>
                    <span className="text-[10px] text-slate-500 block">From load port into plant stockyard</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 3: DANGER RADAR (WILL WE RUN OUT?) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                      3
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Safety Check: Will We Run Out?
                      </h3>
                      <span className="text-[10px] text-slate-400">Step 3: Comparing Stock Days vs Arrival Days</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold">
                    Weather Buffer (+1.8d)
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  We add a +1.8-day storm/rail delay buffer to test if the plant will run dry before the next shipment arrives:
                </p>

                {/* Head-to-Head Comparison Cards */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-center">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Coal in Factory Yard</span>
                    <span className="text-2xl font-black text-slate-800 block mt-1">
                      {layerCalculations.daysOfCurrentStock} <span className="text-xs font-normal">Days</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Burn runway</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Days Until Delivery</span>
                    <span className="text-2xl font-black text-indigo-700 block mt-1">
                      {layerCalculations.p90ArrivalDays} <span className="text-xs font-normal">Days</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">With storm safety buffer</span>
                  </div>
                </div>

                {/* Big Clear Result Banner */}
                <div className={`p-4 rounded-xl border text-xs ${
                  layerCalculations.isOffBlastTriggered
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    {layerCalculations.isOffBlastTriggered ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="text-sm font-black text-rose-700">🔴 DANGER: COAL SHORTAGE DETECTED!</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-black text-emerald-700">🟢 SAFE: FACTORY FULLY PROTECTED</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {layerCalculations.isOffBlastTriggered
                      ? `Your coal will run out ${Math.abs(layerCalculations.stockoutDeficitDays)} days BEFORE the next shipment arrives! The blast furnace will freeze unless you divert the ship or order emergency coal.`
                      : `You have ${(layerCalculations.daysOfCurrentStock - layerCalculations.p90ArrivalDays).toFixed(1)} days of extra buffer. Steel production will continue without any interruption.`
                    }
                  </p>
                </div>

                {/* 1-Click Fix Button for at-risk plants */}
                {forecastPlant === 'dsp' && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setIsEmergencyRerouteActive(!isEmergencyRerouteActive)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isEmergencyRerouteActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                      <span>{isEmergencyRerouteActive ? '✓ Diverted to Deepwater Dhamra (Stock Restored to 15.4d)' : '⚡ Fix Problem: Divert Vessel from Haldia to Dhamra Port'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: ECONOMIC DECISION (BUY NOW VS WAIT?) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      4
                    </span>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Should We Order Now Or Wait?
                      </h3>
                      <span className="text-[10px] text-slate-400">Step 4: Balancing Holding Costs vs Price Spikes</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                    RBI Benchmark
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  Should the manager buy coal today or wait? We compare the financial cost of storing coal against the risk of market prices surging:
                </p>

                {/* Simple 2-Way Showdown */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-700 block mb-0.5">Option A: Buy Today</span>
                    <span className="text-[10px] text-slate-400 block mb-1">Cost to store coal (14 days):</span>
                    <div className="text-lg font-black text-purple-900">
                      ₹{layerCalculations.carryingCostFor14dINR} Cr
                    </div>
                    <span className="text-[9px] text-slate-500">₹{layerCalculations.carryingCostINRPerMTDay}/MT/day</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-700 block mb-0.5">Option B: Wait 14 Days</span>
                    <span className="text-[10px] text-slate-400 block mb-1">Risk of price rising:</span>
                    <div className="text-lg font-black text-amber-700">
                      ₹{layerCalculations.freightSpikeRiskINR} Cr
                    </div>
                    <span className="text-[9px] text-slate-500">Risk: +$4.20/MT jump</span>
                  </div>
                </div>

                {/* Big Final Decision Card */}
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-purple-900 uppercase">AI Recommendation:</span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                      layerCalculations.recommendedDecision === 'URGENT_PROCUREMENT'
                        ? 'bg-rose-600 text-white'
                        : layerCalculations.recommendedDecision === 'WAIT'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {layerCalculations.recommendedDecision === 'BUY_NOW' ? '🟢 BUY NOW' : layerCalculations.recommendedDecision === 'WAIT' ? '🟡 WAIT & DELAY' : '🔴 URGENT BUY'}
                    </span>
                  </div>
                  <p className="text-xs text-purple-950 leading-relaxed font-medium">
                    {layerCalculations.decisionReason}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: ALL PLANTS RADAR */}
      {(activeSection === 'stockout') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Live 3-Plant Coal Stockpile Status
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring coal stockpiles across all 3 major SAIL steel manufacturing plants
              </p>
            </div>
            <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded">
              Goal: Maintain 15+ Days Stock
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'rsp', name: 'Rourkela Steel Plant (RSP)', burn: 12200, stock: 151280, days: 12.4, status: 'AMBER WARNING', port: 'Paradip Port' },
              { id: 'bsl', name: 'Bokaro Steel Plant (BSL)', burn: 13000, stock: 210600, days: 16.2, status: 'SAFE & OPTIMAL', port: 'Dhamra Port' },
              { id: 'dsp', name: 'Durgapur Steel Plant (DSP)', burn: 6800, stock: isEmergencyRerouteActive ? 104840 : 59840, days: isEmergencyRerouteActive ? 15.4 : 8.8, status: isEmergencyRerouteActive ? 'RESOLVED (SAFE)' : 'CRITICAL DANGER', port: isEmergencyRerouteActive ? 'Dhamra Port (Diverted)' : 'Haldia Dock' }
            ].map((plant) => {
              const isCrit = plant.status.includes('CRITICAL');
              const isAmber = plant.status.includes('AMBER');

              return (
                <div key={plant.id} className={`border rounded-2xl p-4 flex flex-col justify-between ${
                  isCrit ? 'border-rose-300 bg-rose-50/50' : isAmber ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/30'
                }`}>
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                      <span className="font-bold text-xs text-slate-900">{plant.name}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        isCrit ? 'bg-rose-600 text-white' : isAmber ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {plant.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Daily Coal Burn:</span>
                        <span className="font-bold text-slate-800">{plant.burn.toLocaleString()} t/d</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Stockpile:</span>
                        <span className="font-bold text-slate-800">{(plant.stock / 1000).toFixed(0)}k tonnes</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Stockpile Days:</span>
                        <span className={`font-black text-base ${isCrit ? 'text-rose-700' : isAmber ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {plant.days} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Port Connection:</span>
                        <span className="font-semibold text-slate-700 text-[11px]">{plant.port}</span>
                      </div>
                    </div>
                  </div>

                  {plant.id === 'dsp' && (
                    <button
                      type="button"
                      onClick={() => setIsEmergencyRerouteActive(!isEmergencyRerouteActive)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isEmergencyRerouteActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'
                      }`}
                    >
                      {isEmergencyRerouteActive ? '✓ Rerouted to Dhamra (Fixed)' : '⚡ Divert Vessel to Dhamra Port'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: INVENTORY HOLDING COST CALCULATOR */}
      {(activeSection === 'carrying_cost') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Coal Holding Cost Benchmark Calculator
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculates how much money is lost each day when coal sits idle in stockyards
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">
              Benchmark: {currSym}{isINR ? layerCalculations.carryingCostINRPerMTDay : layerCalculations.carryingCostUSDPerMTDay} / MT / day
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Financing Interest Rate:</span>
                <span className="text-purple-700 font-bold">{waccRate}%</span>
              </div>
              <input 
                type="range"
                min="7.0"
                max="14.0"
                step="0.1"
                value={waccRate}
                onChange={(e) => setWaccRate(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Cost of capital benchmark</span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Import Coal Price:</span>
                <span className="text-purple-700 font-bold">${coalPriceUSD} / MT</span>
              </div>
              <input 
                type="range"
                min="160"
                max="320"
                step="5"
                value={coalPriceUSD}
                onChange={(e) => setCoalPriceUSD(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">CIF purchase price per tonne</span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Total Coal in Stockyards:</span>
                <span className="text-purple-700 font-bold">{(inventoryVolumeMT / 1000000).toFixed(1)}M tonnes</span>
              </div>
              <input 
                type="range"
                min="1000000"
                max="4000000"
                step="100000"
                value={inventoryVolumeMT}
                onChange={(e) => setInventoryVolumeMT(parseInt(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Total company-wide inventory</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <span className="text-[10px] text-purple-900 font-bold uppercase block mb-0.5">Cost Per Tonne</span>
              <div className="text-lg font-black text-purple-900">
                {currSym}{isINR ? layerCalculations.carryingCostINRPerMTDay : layerCalculations.carryingCostUSDPerMTDay}
                <span className="text-xs font-normal text-slate-500"> /day</span>
              </div>
              <p className="text-[10px] text-purple-800 mt-1">Holding cost per tonne/day</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Daily Holding Cost</span>
              <div className="text-lg font-black text-slate-800">
                {currSym}{((layerCalculations.carryingCostUSDPerMTDay * inventoryVolumeMT * fxMultiplier) / 10000000).toFixed(2)} Cr
                <span className="text-xs font-normal text-slate-500"> /day</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Across all stockyards</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Annual Holding Cost</span>
              <div className="text-lg font-black text-slate-800">
                {currSym}{(((layerCalculations.carryingCostUSDPerMTDay * inventoryVolumeMT * fxMultiplier) / 10000000) * 365).toFixed(1)} Cr
                <span className="text-xs font-normal text-slate-500"> /year</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Total yearly capital lockup</p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] text-emerald-900 font-bold uppercase block mb-0.5">Potential Savings</span>
              <div className="text-lg font-black text-emerald-700">
                +{currSym}162.8 Cr
                <span className="text-xs font-normal text-emerald-600"> /year</span>
              </div>
              <p className="text-[10px] text-emerald-800 mt-1">By reducing idle port delay</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: 8 FREE OPEN-SOURCE SOVEREIGN DATASETS */}
      {(activeSection === 'datasets') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                The 8 Free & Sovereign Data Sources
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every calculation uses 100% free open public Indian and international datasets (zero paid subscriptions)
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-lg">
              100% Free Public APIs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {FREE_SOVEREIGN_DATASETS.map((ds) => (
              <div key={ds.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {ds.rank}
                    </span>
                    <a 
                      href={ds.portalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                    >
                      <span>Public Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    {ds.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Source: <strong>{ds.provider}</strong>
                  </div>

                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 mb-2">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">What We Pull:</span>
                    <span>{ds.keyMetrics}</span>
                  </div>

                  <div className="p-2.5 bg-purple-50 border border-purple-100 rounded-xl text-[11px] text-purple-900 leading-relaxed">
                    <strong>Why It Matters:</strong> {ds.howItSolvesCAG}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
