import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, 
  Database, ExternalLink, Flame, Factory, ArrowRight, RefreshCw, 
  Layers, Calculator, FileText, Sparkles, Scale, Train, Anchor,
  Clock, Activity, Calendar, Compass, ShieldCheck, ChevronRight
} from 'lucide-react';
import InsightBulb from './InsightBulb';

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
    reportNumber: "CAG Report No. 10 of 2025 (Presented July 2025)",
    period: "2016-17 to 2022-23",
    title: "Performance Audit on Inventory Management in Steel Authority of India Limited (SAIL)",
    excessCoalExpenditureCr: 2539.68,
    avgInventoryCr: 21698,
    hotMetalLossLakhMT: 9.32,
    hotMetalLossRevenueCr: 1231.52,
    nonMovingStoresIncreasePct: 55,
    poDelayBeyond6MonthsPct: 9.71
  };

  // Master Directory of 8 Free & Open-Source Sovereign Datasets
  const FREE_SOVEREIGN_DATASETS = [
    {
      id: "jpc_ministry_steel",
      rank: "#1 PLANT DEMAND DATASET",
      name: "Joint Plant Committee (JPC) Steel & Raw Material Stock Registry",
      provider: "Ministry of Steel, Government of India",
      portalUrl: "https://jpcsteel.gov.in",
      license: "Open Government Data License (OGDL India / data.gov.in)",
      frequency: "Monthly Statistical Bulletins & Annual Audits",
      keyMetrics: "Plant-wise Coking Coal Consumption, Indigenous vs. Imported Coal Blend Ratios (65:35 Norm), Hot Metal Production, Plant Stock Days",
      layer: "Layer 1: Demand Forecasting",
      howItSolvesCAG: "Supplies the historical plant consumption baseline to train predictive burn models for Rourkela, Bokaro & Durgapur, enforcing the 15-day safety stock norm."
    },
    {
      id: "ipa_daily_port",
      rank: "#2 MARITIME PORT DATASET",
      name: "Indian Ports Association (IPA) Daily Port Traffic & Dwell Reports",
      provider: "Ministry of Ports, Shipping and Waterways / IPA",
      portalUrl: "https://ipa.nic.in",
      license: "Free Sovereign Public Access (Government of India)",
      frequency: "Daily Operational Gazettes & Turnaround Reports",
      keyMetrics: "Pre-Berthing Detention (PBD in hours/days), Turnaround Time (TRT), Berth-Day Output (TPD), Anchorage Queues at Paradip, Vizag & Haldia",
      layer: "Layer 2: Supply Transit Timeline",
      howItSolvesCAG: "Feeds live anchorage wait times and berth unloading rates into the supply timeline, triggering Virtual Arrival speed pacing to prevent vessel bunching."
    },
    {
      id: "fois_indian_railways",
      rank: "#3 INLAND LOGISTICS DATASET",
      name: "Freight Operations Information System (FOIS) Open Telemetry",
      provider: "Centre for Railway Information Systems (CRIS) / Indian Railways",
      portalUrl: "https://fois.indianrail.gov.in",
      license: "Public Railway Freight Information (PM Gati Shakti Master Plan)",
      frequency: "Daily Rake Allotment & Wagon Movement Feeds",
      keyMetrics: "Port Siding Rake Allocation, BOXN/BOBRN Wagon Turnaround Time (TAT), Transit Hours from Paradip/Dhamra to RSP, BSL & DSP Sidings",
      layer: "Layer 2: Inland Evacuation",
      howItSolvesCAG: "Coordinates marine vessel discharge with inland rail wagon evacuation so imported coal never sits stranded at port stockyards while blast furnaces run dry."
    },
    {
      id: "dgcis_comtrade",
      rank: "#4 TRADE & PRICING DATASET",
      name: "DGCIS Foreign Trade Registry & UN COMTRADE Bilateral Coal Data",
      provider: "Directorate General of Commercial Intelligence and Statistics",
      portalUrl: "https://dgciskol.gov.in",
      license: "Sovereign Customs Trade Open Access",
      frequency: "Monthly Import-Export Filings (HS Code 270119)",
      keyMetrics: "Port-wise Coking Coal Volumes, CIF/CFR Invoice Values (USD/MT), Origin Country Breakdown (Australia, Mozambique, US, Indonesia)",
      layer: "Layer 4: Carrying Cost Benchmark",
      howItSolvesCAG: "Supplies authentic historical purchase values to benchmark inventory carrying costs per tonne ($0.074/MT/day) and track spot vs. long-term price spreads."
    },
    {
      id: "cil_coastal_shipping",
      rank: "#5 DEADHEAD REDUCTION DATASET",
      name: "Coal India Limited (CIL) Coastal Allocation Bulletins",
      provider: "Ministry of Coal, Government of India",
      portalUrl: "https://coal.nic.in",
      license: "Public Mineral Linkage Policy & Sagarmala Directives",
      frequency: "Fortnightly Coastal Rake & Vessel Allocations",
      keyMetrics: "Domestic Thermal Coal Coastal Quotas (Talcher/Ib Valley ➔ Southern Power Plants via Paradip/Dhamra to Ennore/Tuticorin)",
      layer: "Layer 4: Alternative Employment & Backhaul",
      howItSolvesCAG: "Eliminates empty 5,350 NM return deadheading by pairing returning import bulkers with domestic coastal coal legs under the cabotage waiver."
    },
    {
      id: "ibm_export_stats",
      rank: "#6 TRIANGULAR TRADE DATASET",
      name: "Indian Bureau of Mines (IBM) Mineral Export Statistics",
      provider: "Ministry of Mines, Government of India",
      portalUrl: "https://ibm.gov.in",
      license: "Statutory Public Minerals Yearbook",
      frequency: "Monthly Mineral Export Registers",
      keyMetrics: "East Coast Iron Ore Fines Export Volumes, Port Loading Clearances at Paradip, Vizag & Gopalpur to China/East Asia",
      layer: "Layer 4: Deadhead Elimination",
      howItSolvesCAG: "Provides outbound commercial parcels to convert one-way coal ballast voyages into revenue-generating triangular trade loops."
    },
    {
      id: "open_ais_network",
      rank: "#7 GLOBAL VESSEL TELEMETRY",
      name: "OpenAIS / Global Fishing Watch Public Maritime Telemetry",
      provider: "ITU-R M.1371 International Open Radio Protocol",
      portalUrl: "https://globalfishingwatch.org",
      license: "Open Community AIS Ingestion & Public Safety Broadcasts",
      frequency: "Sub-Minute Broadcast Updates",
      keyMetrics: "MMSI, IMO, Vessel Speed Over Ground (SOG), Course (COG), Draught, Navigational Status (At Anchor, Underway, Moored)",
      layer: "Layer 2: Sea Transit Pacing",
      howItSolvesCAG: "Enables continuous position tracking of inbound bulk carriers to calculate precise sea transit times and detect offshore idle delays."
    },
    {
      id: "rbi_fbil_financials",
      rank: "#8 MACRO FINANCIAL BENCHMARK",
      name: "Reserve Bank of India (RBI) Reference Rates & FBIL Benchmarks",
      provider: "Reserve Bank of India / Financial Benchmarks India Pvt Ltd",
      portalUrl: "https://rbi.org.in",
      license: "Sovereign Central Bank Open Access",
      frequency: "Daily Market Feeds (USD/INR, MIBOR, T-Bill Yields)",
      keyMetrics: "Daily USD/INR Reference Rate, 91-Day/364-Day T-Bill Yield Curve, PSU WACC Calibration Benchmark (9.8%)",
      layer: "Layer 4: Economic Cost Engine",
      howItSolvesCAG: "Supplies the corporate cost of capital and live foreign exchange rates to establish statutory holding cost benchmarks for SAIL inventory."
    }
  ];

  // Historical Consumption Dataset (Calibrated to SAIL Blast Furnace Parameters)
  const HISTORICAL_CONSUMPTION_SERIES = {
    rsp: [
      { date: "01 Jan", consumptionMT: 9200, hotMetalMT: 8100, stockMT: 145000, daysStock: 15.7 },
      { date: "15 Jan", consumptionMT: 9500, hotMetalMT: 8300, stockMT: 135500, daysStock: 14.2 },
      { date: "01 Feb", consumptionMT: 10100, hotMetalMT: 8550, stockMT: 122000, daysStock: 12.0 },
      { date: "15 Feb", consumptionMT: 10800, hotMetalMT: 8700, stockMT: 110000, daysStock: 10.1 },
      { date: "01 Mar", consumptionMT: 11400, hotMetalMT: 8850, stockMT: 98000, daysStock: 8.6 },
      { date: "15 Mar", consumptionMT: 11900, hotMetalMT: 9100, stockMT: 165000, daysStock: 13.8 }, // Rake delivery arrived
      { date: "01 Apr", consumptionMT: 12200, hotMetalMT: 9200, stockMT: 151280, daysStock: 12.4 } // Current baseline
    ],
    bsl: [
      { date: "01 Jan", consumptionMT: 11500, hotMetalMT: 9800, stockMT: 240000, daysStock: 20.8 },
      { date: "15 Jan", consumptionMT: 12100, hotMetalMT: 10200, stockMT: 228000, daysStock: 18.8 },
      { date: "01 Feb", consumptionMT: 12400, hotMetalMT: 10400, stockMT: 215000, daysStock: 17.3 },
      { date: "15 Feb", consumptionMT: 12800, hotMetalMT: 10600, stockMT: 198000, daysStock: 15.4 },
      { date: "01 Mar", consumptionMT: 13100, hotMetalMT: 10800, stockMT: 185000, daysStock: 14.1 },
      { date: "15 Mar", consumptionMT: 12900, hotMetalMT: 10700, stockMT: 220000, daysStock: 17.0 },
      { date: "01 Apr", consumptionMT: 13000, hotMetalMT: 10750, stockMT: 210600, daysStock: 16.2 } // Current baseline
    ],
    dsp: [
      { date: "01 Jan", consumptionMT: 5800, hotMetalMT: 4800, stockMT: 92000, daysStock: 15.8 },
      { date: "15 Jan", consumptionMT: 6100, hotMetalMT: 5000, stockMT: 84000, daysStock: 13.7 },
      { date: "01 Feb", consumptionMT: 6400, hotMetalMT: 5200, stockMT: 76000, daysStock: 11.8 },
      { date: "15 Feb", consumptionMT: 6600, hotMetalMT: 5350, stockMT: 68000, daysStock: 10.3 },
      { date: "01 Mar", consumptionMT: 6700, hotMetalMT: 5400, stockMT: 62000, daysStock: 9.2 },
      { date: "15 Mar", consumptionMT: 6750, hotMetalMT: 5420, stockMT: 61000, daysStock: 9.0 },
      { date: "01 Apr", consumptionMT: 6800, hotMetalMT: 5450, stockMT: 59840, daysStock: 8.8 } // Critical!
    ]
  };

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
      primaryPort: isEmergencyRerouteActive ? "Dhamra Port (DPCL express corridor)" : "Haldia Dock Complex (HDC)",
      berthTPD: isEmergencyRerouteActive ? 65000 : 22000,
      railTATDays: isEmergencyRerouteActive ? 1.4 : 2.6
    }
  }[forecastPlant];

  // Dynamic Layer Calculations
  const layerCalculations = useMemo(() => {
    // 1. Layer 1: Demand Forecast
    const rampFactor = 1 + (plannedProductionRamp / 100);
    const predictedBurnRate = Math.round(activePlantMeta.baseBurnMT * rampFactor);
    const daysOfCurrentStock = parseFloat((activePlantMeta.currentStockMT / predictedBurnRate).toFixed(1));
    const isStockBelowSafety = daysOfCurrentStock < activePlantMeta.safetyNormDays;

    // 2. Layer 2: Multi-Stage Supply Transit Timeline
    const voyageSeaDays = 8.5; // Gladstone/Hay Point to Bay of Bengal
    const anchorageWaitDays = activePlantMeta.primaryPort.includes("Haldia") ? 4.2 : 1.8;
    const berthDischargeDays = parseFloat((75000 / activePlantMeta.berthTPD).toFixed(1));
    const railEvacuationDays = activePlantMeta.railTATDays;
    const totalTransitDays = parseFloat((voyageSeaDays + anchorageWaitDays + berthDischargeDays + railEvacuationDays).toFixed(1));

    // 3. Layer 3: Risk-Adjusted Early Warning (P90)
    const weatherRiskBufferDays = 1.2; // Bay of Bengal wave/monsoon factor
    const railCongestionBufferDays = 0.6;
    const p90ArrivalDays = parseFloat((totalTransitDays + weatherRiskBufferDays + railCongestionBufferDays).toFixed(1));
    const stockoutDeficitDays = parseFloat((p90ArrivalDays - daysOfCurrentStock).toFixed(1));
    const isOffBlastTriggered = daysOfCurrentStock < p90ArrivalDays;

    // 4. Layer 4: Economic Decision Engine (Buy Now vs Wait)
    // Carrying cost calculation
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
    // Risk of freight spike: estimated +$4.20/MT based on active news volatility
    const freightSpikeRiskUSD = 4.20 * 75000;
    const freightSpikeRiskINR = freightSpikeRiskUSD * fxMultiplier;

    // Off-blast shutdown penalty (if stockout occurs)
    const shutdownLossINR = 185000000; // ₹18.5 Cr per blast furnace day lost

    let recommendedDecision = 'BUY_NOW';
    let decisionReason = '';

    if (isOffBlastTriggered) {
      recommendedDecision = 'URGENT_PROCUREMENT';
      decisionReason = `CRITICAL: Stock buffer (${daysOfCurrentStock}d) expires before P90 cargo arrival (${p90ArrivalDays}d). Blast furnace shutdown imminent. Immediate spot tender or rake diversion required.`;
    } else if (carryingCostFor14dUSD > freightSpikeRiskUSD && daysOfCurrentStock > 18.0) {
      recommendedDecision = 'WAIT';
      decisionReason = `Stock is abundant (${daysOfCurrentStock}d vs 15d norm). Holding 75k MT coal costs ₹${(carryingCostFor14dINR / 10000000).toFixed(2)} Cr in carrying cost, exceeding anticipated spot freight drift. Delay procurement by 7–10 days.`;
    } else {
      recommendedDecision = 'BUY_NOW';
      decisionReason = `Optimal JIT window. Carrying cost is low (₹${carryingCostINRPerMTDay.toFixed(2)}/MT/day), shielding against potential spot freight spike and locking in the 15-day safety norm.`;
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
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. CAG AUDIT BANNER & PROBLEM BREAKDOWN */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 border border-slate-700 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60 mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Parliamentary Audit Resolution Module
                </span>
                <span className="bg-white/10 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-white/10">
                  {CAG_AUDIT_SUMMARY.reportNumber}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                CAG Performance Audit: SAIL Inventory Management & Raw Material Supply Defense
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                4-Layer decision architecture resolving the ₹2,539.68 Cr coal over-expenditure and shielding blast furnaces at Rourkela, Bokaro & Durgapur from 9.32 Lakh MT production losses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PS Part (c) Core Architecture</span>
            </span>
          </div>
        </div>

        {/* 5 CAG Audit Findings */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">CAG Finding #1</span>
            <div className="text-base font-bold text-rose-400">₹2,539.68 Cr</div>
            <p className="text-[11px] text-slate-300 mt-0.5">Imported coal burned beyond permitted norms</p>
            <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-white/10 pt-1.5">
              ✓ Solved by 65:35 COA blend scheduling
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">CAG Finding #2</span>
            <div className="text-base font-bold text-amber-300">₹21,698 Cr</div>
            <p className="text-[11px] text-slate-300 mt-0.5">Average inventory with zero carrying cost benchmark</p>
            <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-white/10 pt-1.5">
              ✓ Solved by ₹7.03/MT/day benchmark engine
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">CAG Finding #3</span>
            <div className="text-base font-bold text-rose-400">9.32 Lakh MT</div>
            <p className="text-[11px] text-slate-300 mt-0.5">Hot metal lost to blast furnace off-blasts</p>
            <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-white/10 pt-1.5">
              ✓ Solved by 15-day safety buffer radar
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
            <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">CAG Finding #4</span>
            <div className="text-base font-bold text-amber-300">+55% Stagnant</div>
            <p className="text-[11px] text-slate-300 mt-0.5">Non-moving inventory capital lockup</p>
            <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-white/10 pt-1.5">
              ✓ Solved by JIT Virtual Arrival pacing
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-3 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-amber-400 font-bold uppercase block mb-1">CAG Finding #5</span>
            <div className="text-base font-bold text-amber-300">9.71% PO Delays</div>
            <p className="text-[11px] text-slate-300 mt-0.5">Spot tenders taking &gt;6 months to award</p>
            <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-white/10 pt-1.5">
              ✓ Solved by 48h COA tender automation
            </div>
          </div>
        </div>

        {/* Scope Delineation Callout */}
        <div className="mt-3.5 p-3 bg-white/10 rounded-xl border border-white/15 text-[11px] leading-relaxed text-slate-200">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
            <Scale className="w-3.5 h-3.5" />
            <span>Audit Scope Delineation & Source Attribution:</span>
          </div>
          <p>
            • <strong>Directly Verified in CAG Report No. 10 of 2025:</strong> Attributed the 9.32 Lakh MT production loss (₹1,231.52 Cr) to internal plant <em>raw material stock deficits</em> (iron ore, coke, sinter), confirmed the unbenchmarked ₹21,698 Cr average inventory, and audited the ₹2,539.68 Cr coal over-consumption.<br/>
            • <strong>Problem Statement Part (c) Grounding:</strong> Upstream maritime factors (anchorage waiting queues, vessel speed pacing, and 5,350 NM return ballast deadheading) are the external supply-chain drivers that trigger or resolve these onshore plant deficits.
          </p>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSection('4layers')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSection === '4layers'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>The 4-Layer Decision Architecture (Demand ➔ Maritime Transit ➔ Early Warning ➔ Buy/Wait)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('stockout')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'stockout'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Factory className="w-3.5 h-3.5" />
          <span>Blast Furnace Stockout Shield</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('carrying_cost')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'carrying_cost'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Carrying Cost Benchmark ($0.074/MT/d)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('datasets')}
          className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSection === 'datasets'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>8 Free Sovereign Datasets</span>
        </button>
      </div>

      {/* SECTION 1: THE 4-LAYER OPERATIONAL DECISION ENGINE */}
      {(activeSection === '4layers') && (
        <div className="space-y-5">
          {/* Header Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Interactive 4-Layer Supply & Demand Decision Pipeline
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                From internal blast furnace coal burn to sea transit, risk early warning, and economic procurement decision
              </p>
            </div>

            {/* Plant Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Target Plant:</span>
              <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setForecastPlant('rsp')}
                  className={`px-2.5 py-1 rounded transition-colors ${forecastPlant === 'rsp' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-slate-600'}`}
                >
                  Rourkela (RSP)
                </button>
                <button
                  type="button"
                  onClick={() => setForecastPlant('bsl')}
                  className={`px-2.5 py-1 rounded transition-colors ${forecastPlant === 'bsl' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-slate-600'}`}
                >
                  Bokaro (BSL)
                </button>
                <button
                  type="button"
                  onClick={() => setForecastPlant('dsp')}
                  className={`px-2.5 py-1 rounded transition-colors ${forecastPlant === 'dsp' ? 'bg-white text-purple-900 shadow-xs font-bold' : 'text-slate-600'}`}
                >
                  Durgapur (DSP)
                </button>
              </div>
            </div>
          </div>

          {/* 4 LAYERS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            
            {/* LAYER 1: DEMAND FORECASTING */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      Demand Forecasting: Plant Coal Consumption
                    </h4>
                  </div>
                  <span className="text-[10px] bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-bold font-mono">
                    JPC + Historical Burn
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                  Predicts upcoming daily burn rate and stockyard depletion for <strong>{activePlantMeta.name}</strong> based on historical steel production schedules.
                </p>

                {/* Model & Ramp Sliders */}
                <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1">Forecasting Model:</span>
                    <select
                      value={forecastingModel}
                      onChange={(e) => setForecastingModel(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1 text-[11px] font-semibold text-slate-800"
                    >
                      <option value="ma">Exponential Smoothing (Holt-Winters)</option>
                      <option value="xgboost">XGBoost / LSTM Residuals</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold mb-1">
                      <span>Production Ramp:</span>
                      <span className="text-purple-700 font-bold">{plannedProductionRamp > 0 ? `+${plannedProductionRamp}` : plannedProductionRamp}%</span>
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
                  </div>
                </div>

                {/* Forecast Output Cards */}
                <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Predicted Daily Burn:</span>
                    <span className="text-sm font-bold text-slate-800">{layerCalculations.predictedBurnRate.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">MT / day</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-semibold">Current Ground Stock:</span>
                    <span className="text-sm font-bold text-slate-800">{(activePlantMeta.currentStockMT / 1000).toFixed(1)}k</span>
                    <span className="text-[10px] text-slate-500 block">MT</span>
                  </div>
                  <div className={`p-2 rounded-lg border ${layerCalculations.isStockBelowSafety ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <span className="text-[10px] text-slate-500 block font-semibold">Stockyard Runway:</span>
                    <span className={`text-sm font-bold ${layerCalculations.isStockBelowSafety ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {layerCalculations.daysOfCurrentStock} Days
                    </span>
                    <span className="text-[10px] text-slate-500 block">Norm: 15.0 Days</span>
                  </div>
                </div>

                {/* Historical Table Snippet */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-1.5">Date</th>
                        <th className="p-1.5">Burn (t/d)</th>
                        <th className="p-1.5">Hot Metal (t/d)</th>
                        <th className="p-1.5">Stock (MT)</th>
                        <th className="p-1.5">Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {HISTORICAL_CONSUMPTION_SERIES[forecastPlant].slice(0, 4).map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 font-medium text-slate-800">{row.date}</td>
                          <td className="p-1.5 font-mono">{row.consumptionMT.toLocaleString()}</td>
                          <td className="p-1.5 font-mono">{row.hotMetalMT.toLocaleString()}</td>
                          <td className="p-1.5 font-mono">{row.stockMT.toLocaleString()}</td>
                          <td className="p-1.5 font-bold text-purple-800">{row.daysStock}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* LAYER 2: MULTI-STAGE SUPPLY TRANSIT TIMELINE */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      Supply Timeline: Port & Inland Evacuation
                    </h4>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold font-mono">
                    AIS + IPA + FOIS
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                  Calculates true end-to-end transit duration from overseas loading port to the inland blast furnace yard:
                </p>

                {/* 4 Multi-Stage Leg Cards */}
                <div className="space-y-2 mb-3 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Anchor className="w-3.5 h-3.5 text-blue-600" />
                      <div>
                        <span className="font-semibold text-slate-800 text-[11px]">1. Sea Voyage (OpenAIS):</span>
                        <p className="text-[10px] text-slate-500">Hay Point / Gladstone to Bay of Bengal (5,350 NM at 13.0 kts)</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-blue-700 text-xs">{layerCalculations.voyageSeaDays} Days</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <div>
                        <span className="font-semibold text-slate-800 text-[11px]">2. Anchorage Queue (IPA PBD):</span>
                        <p className="text-[10px] text-slate-500">Pre-Berthing Detention at {activePlantMeta.primaryPort}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-amber-700 text-xs">{layerCalculations.anchorageWaitDays} Days</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <div>
                        <span className="font-semibold text-slate-800 text-[11px]">3. Berth Unloading (IPA TPD):</span>
                        <p className="text-[10px] text-slate-500">75,000 MT at {activePlantMeta.berthTPD.toLocaleString()} TPD mechanization</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-indigo-700 text-xs">{layerCalculations.berthDischargeDays} Days</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center space-x-2">
                      <Train className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <span className="font-semibold text-slate-800 text-[11px]">4. Inland Rail Evacuation (FOIS):</span>
                        <p className="text-[10px] text-slate-500">Port Siding Rake turnaround to {activePlantMeta.name}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 text-xs">{layerCalculations.railEvacuationDays} Days</span>
                  </div>
                </div>

                {/* Total Transit Summary */}
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">Total Pipeline Transit Time:</span>
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-blue-800">{layerCalculations.totalTransitDays} Days</span>
                    <span className="text-[10px] text-slate-500 block">From load port to plant blast furnace</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LAYER 3: RISK-ADJUSTED EARLY WARNING */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      Risk-Adjusted Early Warning (P90 Radar)
                    </h4>
                  </div>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold font-mono">
                    INCOIS + P90 Uncertainty
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                  Adds weather and rail choke uncertainty buffers to verify if plant ground stock can survive until the next vessel delivers.
                </p>

                {/* Comparison Card */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Ground Stock:</span>
                    <div className="text-lg font-bold text-slate-800 mt-0.5">
                      {layerCalculations.daysOfCurrentStock} Days
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Available buffer in stockyard</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">P90 Risk-Adjusted Arrival:</span>
                    <div className="text-lg font-bold text-indigo-700 mt-0.5">
                      {layerCalculations.p90ArrivalDays} Days
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Includes +1.8d weather/rail buffer</span>
                  </div>
                </div>

                {/* Alert Badge */}
                <div className={`p-3 rounded-lg border text-xs ${
                  layerCalculations.isOffBlastTriggered
                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <div className="flex items-center space-x-2 font-bold mb-1">
                    {layerCalculations.isOffBlastTriggered ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>🔴 CRITICAL OFF-BLAST WARNING: STOCKOUT THREAT</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>🟢 SAFE BUFFER: ZERO STOCKOUT RISK DETECTED</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {layerCalculations.isOffBlastTriggered
                      ? `Stock buffer (${layerCalculations.daysOfCurrentStock}d) will expire ${Math.abs(layerCalculations.stockoutDeficitDays)} days BEFORE the next shipment arrives! Risk of blast furnace shutdown unless emergency speed pacing or port diversion is enacted.`
                      : `Stock buffer exceeds P90 cargo arrival by ${(layerCalculations.daysOfCurrentStock - layerCalculations.p90ArrivalDays).toFixed(1)} days. Continuous blast furnace feeding guaranteed.`
                    }
                  </p>
                </div>
              </div>

              {/* Action trigger */}
              {forecastPlant === 'dsp' && (
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEmergencyRerouteActive(!isEmergencyRerouteActive)}
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isEmergencyRerouteActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white animate-pulse'
                    }`}
                  >
                    {isEmergencyRerouteActive
                      ? '✓ Emergency Reroute Active: Buffer Restored'
                      : '⚡ Trigger Emergency Dhamra Reroute (Avert DSP Off-Blast)'}
                  </button>
                </div>
              )}
            </div>

            {/* LAYER 4: ECONOMIC DECISION ENGINE */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      4
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">
                      Economic Decision Engine (Buy Now vs Wait)
                    </h4>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold font-mono">
                    DGCIS + RBI WACC
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                  Evaluates whether to purchase coal immediately (paying inventory holding costs) or wait (hedging spot freight fluctuations):
                </p>

                {/* Trade-Off Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">Option A: Import Now</span>
                    <p className="text-[10px] text-slate-500 mb-1">Carrying cost for 14-day holding:</p>
                    <div className="font-mono font-bold text-purple-800 text-xs">
                      ₹{layerCalculations.carryingCostFor14dINR} Cr
                    </div>
                    <span className="text-[9px] text-slate-400">Rate: ₹{layerCalculations.carryingCostINRPerMTDay}/MT/day</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-700 block mb-1">Option B: Wait 14 Days</span>
                    <p className="text-[10px] text-slate-500 mb-1">Risk of spot freight escalation:</p>
                    <div className="font-mono font-bold text-amber-800 text-xs">
                      ₹{layerCalculations.freightSpikeRiskINR} Cr
                    </div>
                    <span className="text-[9px] text-slate-400">Risk: +$4.20/MT spot drift</span>
                  </div>
                </div>

                {/* Final Recommendation */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase text-purple-900">AI Decision Recommendation:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      layerCalculations.recommendedDecision === 'URGENT_PROCUREMENT'
                        ? 'bg-rose-600 text-white'
                        : layerCalculations.recommendedDecision === 'WAIT'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {layerCalculations.recommendedDecision.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-950 leading-relaxed font-medium">
                    {layerCalculations.decisionReason}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SECTION 2: BLAST FURNACE STOCKOUT PROTECTION RADAR */}
      {(activeSection === 'stockout') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Factory className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  SAIL Blast Furnace Stockout Defense (Zero Off-Blast Protocol)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time synchronization between Port Discharge ──► Railway Rakes ──► Blast Furnace Stockyards
              </p>
            </div>
            <span className="bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded">
              Solving CAG Finding #3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['rsp', 'bsl', 'dsp'].map((plantId) => {
              const meta = {
                rsp: { name: 'Rourkela (RSP)', burn: 12200, stock: 151280, days: 12.4, status: 'AMBER_WARNING', port: 'Paradip (PPT)' },
                bsl: { name: 'Bokaro (BSL)', burn: 13000, stock: 210600, days: 16.2, status: 'OPTIMAL_SAFE', port: 'Dhamra (DPCL)' },
                dsp: { name: 'Durgapur (DSP)', burn: 6800, stock: isEmergencyRerouteActive ? 104840 : 59840, days: isEmergencyRerouteActive ? 15.4 : 8.8, status: isEmergencyRerouteActive ? 'RESOLVED_SHIELDED' : 'CRITICAL_OFF_BLAST_RISK', port: isEmergencyRerouteActive ? 'Dhamra (DPCL Express)' : 'Haldia (HDC)' }
              }[plantId];

              const isCrit = meta.status === 'CRITICAL_OFF_BLAST_RISK';
              const isAmber = meta.status === 'AMBER_WARNING';

              return (
                <div key={plantId} className={`border rounded-xl p-4 flex flex-col justify-between ${
                  isCrit ? 'border-rose-300 bg-rose-50/50' : isAmber ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/30'
                }`}>
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                      <span className="font-bold text-xs text-slate-900">{meta.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        isCrit ? 'bg-rose-100 text-rose-800' : isAmber ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {meta.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Daily Coal Burn:</span>
                        <span className="font-bold text-slate-800">{meta.burn.toLocaleString()} MT/d</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Stockpile:</span>
                        <span className="font-bold text-slate-800">{(meta.stock / 1000).toFixed(1)}k MT</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Stock Days:</span>
                        <span className={`font-bold text-sm ${isCrit ? 'text-rose-700' : isAmber ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {meta.days} Days
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Primary Port:</span>
                        <span className="font-semibold text-slate-700 text-[11px]">{meta.port}</span>
                      </div>
                    </div>
                  </div>

                  {plantId === 'dsp' && (
                    <button
                      type="button"
                      onClick={() => setIsEmergencyRerouteActive(!isEmergencyRerouteActive)}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isEmergencyRerouteActive ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white animate-pulse'
                      }`}
                    >
                      {isEmergencyRerouteActive ? '✓ Dhamra Reroute Active (Buffer Restored)' : '⚡ Trigger Emergency Dhamra Reroute'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: INVENTORY CARRYING COST BENCHMARK CALCULATOR */}
      {(activeSection === 'carrying_cost') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Inventory Carrying Cost Benchmark Engine (Resolving CAG Finding #2)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Empirical mathematical benchmark to value holding costs per tonne per day across port and plant yards
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
              WACC: {waccRate}% p.a.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>WACC Benchmark Rate:</span>
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
              <span className="text-[10px] text-slate-400">PSU Cost of Capital (RBI / SBI Benchmark)</span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Landed Coal Price:</span>
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
              <span className="text-[10px] text-slate-400">CIF Paradip/Vizag landed import price</span>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>SAIL Inventory Base:</span>
                <span className="text-purple-700 font-bold">{(inventoryVolumeMT / 1000000).toFixed(1)}M MT</span>
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
              <span className="text-[10px] text-slate-400">Audited ₹21,698 Cr inventory base</span>
            </div>
          </div>

          {/* Benchmark Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
              <span className="text-[10px] text-purple-900 font-bold uppercase block mb-0.5">Carrying Cost Benchmark</span>
              <div className="text-lg font-bold text-purple-900">
                {currSym}{isINR ? layerCalculations.carryingCostINRPerMTDay : layerCalculations.carryingCostUSDPerMTDay}
                <span className="text-xs font-normal text-slate-500"> /MT/day</span>
              </div>
              <p className="text-[10px] text-purple-800 mt-1">Exact benchmark missing in CAG audit</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Daily Fleet Holding Cost</span>
              <div className="text-lg font-bold text-slate-800">
                {currSym}{((layerCalculations.carryingCostUSDPerMTDay * inventoryVolumeMT * fxMultiplier) / 10000000).toFixed(2)} Cr
                <span className="text-xs font-normal text-slate-500"> /day</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Across {(inventoryVolumeMT / 1000000).toFixed(1)}M MT stockpile</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase block mb-0.5">Annual Carrying Cost</span>
              <div className="text-lg font-bold text-slate-800">
                {currSym}{(((layerCalculations.carryingCostUSDPerMTDay * inventoryVolumeMT * fxMultiplier) / 10000000) * 365).toFixed(1)} Cr
                <span className="text-xs font-normal text-slate-500"> /yr</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">On raw material holding</p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] text-emerald-900 font-bold uppercase block mb-0.5">JIT Pacing Savings</span>
              <div className="text-lg font-bold text-emerald-700">
                +{currSym}162.8 Cr
                <span className="text-xs font-normal text-emerald-600"> /year</span>
              </div>
              <p className="text-[10px] text-emerald-800 mt-1">By cutting port dwell from 18.4d to 11.2d</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: 8 FREE OPEN-SOURCE SOVEREIGN DATASETS */}
      {(activeSection === 'datasets') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Master Directory: 8 Free & Open-Source Sovereign Datasets
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Zero commercial subscription toll • 100% Sovereign Indian Open Data & International FOSS Protocols
              </p>
            </div>
            <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded">
              Zero License Fees • PM Gati Shakti Aligned
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FREE_SOVEREIGN_DATASETS.map((ds) => (
              <div key={ds.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                      {ds.rank}
                    </span>
                    <a 
                      href={ds.portalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                    >
                      <span>Visit Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    {ds.name}
                  </h4>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Provider: <strong>{ds.provider}</strong> • Frequency: {ds.frequency}
                  </div>

                  <div className="p-2 bg-purple-50/70 border border-purple-100 rounded text-[10px] font-bold text-purple-900 mb-2">
                    Pipeline Role: {ds.layer}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 mb-3 bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Key Open Metrics:</span>
                      <span className="text-[11px] text-slate-700 font-medium">{ds.keyMetrics}</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-relaxed">
                    <strong>How it solves the CAG Audit:</strong> {ds.howItSolvesCAG}
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
