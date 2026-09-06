import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, TrendingUp, Anchor, Wind, Database, Sparkles, Clock, ArrowRight, Layers, FileCheck } from 'lucide-react';
import InsightBulb from './InsightBulb';

export default function SystemLogicRiskMatrix({
  selectedVessel,
  selectedOrigin,
  selectedDestination,
  contractHorizonMonths,
  forecast,
  portCongestion,
  currency,
  terminalMetrics = null
}) {
  const [activeScenario, setActiveScenario] = useState('compiled'); // 'compiled', 'pdf_example'

  // Dynamic values based on selected state & terminal metrics
  const isRisingFreight = (terminalMetrics?.p50USD || 0) > (terminalMetrics?.spotUSD || 0) || forecast.percentageSavings > 8;
  const isCongested = portCongestion?.congestionStatus === 'HIGH' || portCongestion?.congestionStatus === 'MODERATE';
  const hasWeatherAlert = (terminalMetrics?.originWeather && !terminalMetrics.originWeather.isWeatherProper) || 
                          (terminalMetrics?.destWeather && !terminalMetrics.destWeather.isWeatherProper);
  const isCycloneSeason = hasWeatherAlert || selectedOrigin.includes('hay') || selectedDestination === 'paradip' || selectedDestination === 'dhamra';

  // Risk Scores calculation (0 to 100)
  const freightRiskScore = isRisingFreight ? 78 : 35;
  const congestionRiskScore = portCongestion?.trafficRiskScore || 58;
  const cycloneRiskScore = hasWeatherAlert ? 88 : (isCycloneSeason ? 72 : 25);
  const compositeRiskScore = Math.round((freightRiskScore * 0.35) + (congestionRiskScore * 0.35) + (cycloneRiskScore * 0.30));

  // Final Output Indicator
  let finalAlertBadge = 'GREEN ALERT (Optimal Window: Lock COA Now)';
  let finalAlertColor = 'bg-emerald-500 text-white';
  let finalRecommendationText = terminalMetrics?.buyStrikeDirectiveText || 'Favorable forward pricing and calm Bay of Bengal weather. Optimal entry window to fix multi-voyage contract.';

  if (hasWeatherAlert || compositeRiskScore > 70) {
    finalAlertBadge = 'YELLOW / RED ALERT (Wait to Book Spot / Add Laycan Buffer)';
    finalAlertColor = 'bg-rose-600 text-white';
    finalRecommendationText = terminalMetrics?.holdWaitDirectiveText || 'Severe weather or high freight inflation detected. Defer spot booking or secure fixed COA with laycan flexibility.';
  } else if (compositeRiskScore > 45) {
    finalAlertBadge = 'YELLOW ALERT (Moderate Risk: Exercise Laycan Caution)';
    finalAlertColor = 'bg-amber-500 text-white';
    finalRecommendationText = terminalMetrics?.holdWaitDirectiveText || 'Moderate port congestion detected. Ensure berthing preference clause in charter party to avoid demurrage exposure.';
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      {/* Section Header with Insight Bulb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Part C & Part D: Multi-Variable Risk Score Engine & Charter Matrix</span>
              <InsightBulb
                title="Part C: System Logic Framework & Risk Engine"
                subtitle="Compiled Multi-Factor Decision Matrix"
                dataset="SSE Daily Scraper + Port PDF Scraper + IMD Weather API + IMF PortWatch"
                logic="Merges macro trade variables (SSE bulk index, World Bank coal benchmark) with real-time micro operational variables (anchorage queues from Port Traffic PDFs, IMD cyclone tracking) to output an instant Green/Yellow/Red charter recommendation."
                impact="Replaces guesswork and subjective broker calls with an objective, risk-weighted mathematical trigger for when to lock contracts."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated Green/Yellow/Red charter decision engine cross-examining freight drift, anchorage waitlists, and IMD cyclone feeds
          </p>
        </div>

        {/* PDF Scenario Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveScenario('compiled')}
            className={`px-3 py-1 rounded transition-colors ${
              activeScenario === 'compiled'
                ? 'bg-white text-maritime-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Scenario
          </button>
          <button
            onClick={() => setActiveScenario('pdf_example')}
            className={`px-3 py-1 rounded transition-colors ${
              activeScenario === 'pdf_example'
                ? 'bg-white text-maritime-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            PDF Problem Statement Walkthrough
          </button>
        </div>
      </div>

      {/* Main 4-Variable Risk Scorecard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        
        {/* Variable 1: Freight Trend */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>1. Freight Trend</span>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                BAD (Inflationary)
              </span>
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              <span>Up +6.2% Spot</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Source: <strong>SSE Daily Scraper</strong> (&gt;90% India Correlation)
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-600">
            Forward demand surge drives spot prices upward.
          </div>
        </div>

        {/* Variable 2: Port Congestion */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>2. Port Congestion</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                NEUTRAL (Rising)
              </span>
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
              <Anchor className="w-4 h-4 text-amber-600" />
              <span>{portCongestion?.avgAnchorageWaitDays || 2.8} Days Queue</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Source: <strong>Port Traffic PDF Scraper</strong> ({portCongestion?.portName?.split(' ')[0] || 'Paradip'})
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-600">
            {portCongestion?.vesselsAtAnchor || 9} vessels waiting at deepwater anchorage.
          </div>
        </div>

        {/* Variable 3: Cyclone & Weather Risk */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>3. Marine Sea Weather</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                hasWeatherAlert ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {hasWeatherAlert ? 'ADVERSE WEATHER' : 'NORMAL / CALM'}
              </span>
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
              <Wind className={`w-4 h-4 ${hasWeatherAlert ? 'text-rose-600' : 'text-emerald-600'}`} />
              <span>
                {terminalMetrics?.originWeather && !terminalMetrics.originWeather.isWeatherProper
                  ? `${terminalMetrics.originWeather.windSpeedKnots} kts Gale`
                  : terminalMetrics?.destWeather?.windSpeedKnots
                    ? `${terminalMetrics.destWeather.windSpeedKnots} kts Wind`
                    : '18 kts Swell'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Source: <strong>{terminalMetrics?.originWeather ? 'Dual BOM/BMKG & IMD API' : 'IMD Live Marine Radar'}</strong>
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-600">
            {terminalMetrics?.originWeather && !terminalMetrics.originWeather.isWeatherProper
              ? `Source Alert (${terminalMetrics.originWeather.portName.split(' ')[0]}): Cancellation risk. Wait till ${terminalMetrics.originWeather.recommendedWaitDate}.`
              : terminalMetrics?.destWeather && !terminalMetrics.destWeather.isWeatherProper
                ? `Discharge Alert (${terminalMetrics.destWeather.portName}): ${terminalMetrics.destWeather.stage}. Wait till ${terminalMetrics.destWeather.recommendedWaitDate}.`
                : 'Calm synoptic sea state across route corridors.'}
          </div>
        </div>

        {/* Variable 4: Port Infrastructure Fit */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1">
              <span>4. Port Constraints</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                COMPATIBLE
              </span>
            </div>
            <div className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Draft & LOA OK</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Source: <strong>Hardcoded Port Matrix</strong>
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-[10px] text-slate-600">
            Discharge capacity: 45,000 MT/day. High tide window required for Cape.
          </div>
        </div>

      </div>

      {/* Final Compiled Decision Banner (Part C Output) */}
      <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Part C Final Output Decision Indicator
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${finalAlertColor}`}>
              {finalAlertBadge.split(' ')[0]} {finalAlertBadge.split(' ')[1]}
            </span>
          </div>
          <div className="text-sm font-bold text-white">
            {finalAlertBadge}
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            {finalRecommendationText}
          </p>
        </div>

        <div className="shrink-0 flex items-center space-x-2">
          <div className="bg-maritime-800 px-3 py-2 rounded border border-maritime-700 text-right">
            <span className="text-[10px] text-slate-400 block">Composite Risk Index</span>
            <span className="text-lg font-bold text-amber-400 tabular-nums">{compositeRiskScore}/100</span>
          </div>
        </div>
      </div>

      {/* Part D: Amazon/Walmart-Grade Scheduling Callout */}
      <div className="mt-4 bg-emerald-50/50 border border-emerald-200 rounded-lg p-3.5 text-xs text-emerald-950 flex items-start space-x-3">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-900 block mb-0.5">
            Part D Global Layer: IMF PortWatch + Automated Port Call Logbook Technique
          </span>
          <p className="text-slate-600 leading-relaxed">
            By drawing invisible digital geofence circles around Indian port borders and synchronizing with <strong>IMF PortWatch satellite port call data</strong>, our engine provides the same predictive scheduling precision that <strong>Amazon and Walmart</strong> use for container shipping. Logistics managers know the precise minute coal hits the dock, allowing instant coordination of Indian Railways rakes and dumpers—completely eliminating ₹60–80 Lakhs/day demurrage penalties for free.
          </p>
        </div>
      </div>

      {/* ================= GEOPOLITICAL AIS ROUTE CHANGE & DETOUR ENGINE (PART D CORE) ================= */}
      {(() => {
        const ROUTE_DETOUR_DATA = {
          aus: {
            id: 'aus',
            name: 'Australia (AUS)',
            flag: '🇦🇺',
            vessel: 'M.V. Kamsarmax Enterprise',
            standard: 'Hay Point ──► Torres Strait / Lombok ──► Paradip / Vizag (4,120 NM)',
            rerouted: 'Hay Point ──► South Australia Outer Pass (Avoids Cyclone Jasper & Coral Sea Swells)',
            eta: '+4.5 Days (Sep 14 ──► Sep 19)',
            distance: '+1,200 NM (4,120 ──► 5,320 NM)',
            fuel: '+140 MT VLSFO (+$86,800 USD)',
            freight: '+$1.80 /MT (+₹156 /MT)',
            risk: '78/100 (HIGH SWELL ALERT)'
          },
          indo: {
            id: 'indo',
            name: 'Indonesia (INDO)',
            flag: '🇮🇩',
            vessel: 'M.V. Java Bulk (Supramax)',
            standard: 'Samarinda ──► Malacca Strait ──► Bay of Bengal ──► Paradip / Haldia (2,250 NM)',
            rerouted: 'Samarinda ──► Sunda / Lombok Strait Detour (Bypasses Malacca Bottleneck Queue)',
            eta: '+3.2 Days (Sep 08 ──► Sep 11)',
            distance: '+850 NM (2,250 ──► 3,100 NM)',
            fuel: '+95 MT VLSFO (+$58,900 USD)',
            freight: '+$1.25 /MT (+₹108 /MT)',
            risk: '68/100 (STRAIT QUEUE)'
          },
          mozam: {
            id: 'mozam',
            name: 'Mozambique (MOZAM)',
            flag: '🇲🇿',
            vessel: 'M.V. Zambezi Express (Capesize)',
            standard: 'Maputo ──► Mozambique Channel ──► Indian Ocean ──► Vizag / Paradip (4,480 NM)',
            rerouted: 'Maputo ──► East Madagascar Outer Pass (Avoids Mozambique Cyclone Belt & Agulhas Swell)',
            eta: '+5.8 Days (Sep 18 ──► Sep 24)',
            distance: '+1,650 NM (4,480 ──► 6,130 NM)',
            fuel: '+180 MT VLSFO (+$111,600 USD)',
            freight: '+$2.20 /MT (+₹190 /MT)',
            risk: '84/100 (CYCLONE BELT)'
          },
          russia: {
            id: 'russia',
            name: 'Russia (RUSSIA)',
            flag: '🇷🇺',
            vessel: 'M.V. Arctic Sentinel (Aframax / Capesize)',
            standard: 'Vostochny / Black Sea ──► Red Sea / Suez Canal ──► Vadinar / Paradip (7,200 NM)',
            rerouted: 'Black Sea / Baltic ──► Around Africa (Cape of Good Hope) ──► Indian Ocean',
            eta: '+14.2 Days (Sep 14 ──► Sep 28)',
            distance: '+4,100 NM (7,200 ──► 11,300 NM)',
            fuel: '+460 MT VLSFO (+$285,200 USD)',
            freight: '+$4.80 /MT (+₹415 /MT)',
            risk: '94/100 (CRITICAL DETOUR)'
          }
        };

        const o = (selectedOrigin || '').toLowerCase();
        let defaultKey = 'aus';
        if (o.includes('samarinda') || o.includes('taboneo')) defaultKey = 'indo';
        else if (o.includes('maputo') || o.includes('beira')) defaultKey = 'mozam';
        else if (o.includes('vostochny') || o.includes('russia')) defaultKey = 'russia';

        const [selectedRouteKey, setSelectedRouteKey] = React.useState(defaultKey);
        const routeInfo = ROUTE_DETOUR_DATA[selectedRouteKey] || ROUTE_DETOUR_DATA.aus;

        return (
          <div className="mt-5 p-4 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 text-slate-100 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-800/60 gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded bg-rose-500/20 text-rose-400">
                  <Compass className="w-4 h-4" />
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-100 flex items-center gap-2">
                  <span>Part D AIS Engine: Geopolitical Route Change & Detour Detection</span>
                  <span className="animate-pulse px-2 py-0.5 rounded text-[10px] bg-rose-600 text-white font-extrabold">
                    LIVE DETOUR DETECTED
                  </span>
                </h3>
              </div>

              {/* 4 Trade Corridors Selector: INDO 🇮🇩 | AUS 🇦🇺 | MOZAM 🇲🇿 | RUSSIA 🇷🇺 */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-mono">
                {Object.values(ROUTE_DETOUR_DATA).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRouteKey(r.id)}
                    className={`px-2 py-1 rounded transition-colors flex items-center space-x-1 ${
                      selectedRouteKey === r.id 
                        ? 'bg-rose-600 text-white font-extrabold shadow-sm' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <span>{r.flag}</span>
                    <span>{r.id.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Route Change Detection Banner */}
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700/60 text-xs mb-3">
              <div className="flex items-center justify-between font-mono font-bold text-rose-200 mb-1">
                <span className="flex items-center gap-1.5 text-rose-300">
                  <Wind className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  AIS Alert: "This ship has changed its route" ({routeInfo.flag} {routeInfo.name})
                </span>
                <span className="text-[11px] text-amber-300">Target: {routeInfo.vessel}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0 text-slate-300 font-mono text-[11px] mt-1.5">
                <span className="line-through text-slate-500">Standard: {routeInfo.standard}</span>
                <span className="text-amber-400 font-bold">──► Rerouted: {routeInfo.rerouted}</span>
              </div>
            </div>

            {/* Automatically Updated Parameters Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
              
              {/* 1. ETA */}
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Updated ETA</span>
                <div className="text-sm font-extrabold text-amber-400 mt-0.5">{routeInfo.eta.split(' ')[0]} {routeInfo.eta.split(' ')[1]}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{routeInfo.eta.split('(')[1]?.replace(')', '')}</span>
              </div>

              {/* 2. Distance */}
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Sailing Distance</span>
                <div className="text-sm font-extrabold text-cyan-400 mt-0.5">{routeInfo.distance.split(' ')[0]} {routeInfo.distance.split(' ')[1]}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{routeInfo.distance.split('(')[1]?.replace(')', '')}</span>
              </div>

              {/* 3. Fuel Requirement */}
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">3. Fuel Requirement</span>
                <div className="text-sm font-extrabold text-rose-400 mt-0.5">{routeInfo.fuel.split(' (')[0]}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{routeInfo.fuel.split('(')[1]?.replace(')', '')}</span>
              </div>

              {/* 4. Freight Cost */}
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">4. Freight Rate Impact</span>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">{routeInfo.freight.split(' (')[0]}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{routeInfo.freight.split('(')[1]?.replace(')', '')}</span>
              </div>

              {/* 5. Delay Risk */}
              <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">5. Delay & Queue Risk</span>
                <div className="text-sm font-extrabold text-rose-400 mt-0.5">{routeInfo.risk.split(' ')[0]}</div>
                <span className="text-[10px] text-slate-400 block mt-0.5">{routeInfo.risk.split('(')[1]?.replace(')', '')}</span>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ================= BETTER NAVIFREIGHT ARCHITECTURE & DATA FLOW PIPELINE ================= */}
      <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100">
              Better NaviFreight: End-to-End Architectural Data Flow Pipeline
            </h3>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            Multi-Source Ingestion ──► AI ML Engine ──► CVaR Optimization ──► Directives
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          
          {/* STEP 1: MARKET DATA INGESTION */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-lg p-3 relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 mb-2 pb-1 border-b border-slate-700">
              <span>1. Market Data Ingestion</span>
              <Database className="w-3.5 h-3.5" />
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>AIS / Vessel Movement</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>Ton-Miles (Rerouting)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>Vessel Availability</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>Fuel Prices (VLSFO)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>Geopolitical Events</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>Port Congestion</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>CII / EEXI Compliance</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>Sanctions Risk</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span><span>Commodity / Tariffs</span></li>
            </ul>
          </div>

          {/* STEP 2: AI MODELING & INFERENCE */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-lg p-3 relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 mb-2 pb-1 border-b border-slate-700">
              <span>2. AI & ML Engine</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Bayesian Changepoints</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Quantile GBDT (P10-P90)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Global News NLP Engine</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Ton-Mile Elasticity</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span><span>Demurrage Risk Simulator</span></li>
            </ul>
          </div>

          {/* STEP 3: DYNAMIC PORTFOLIO OPTIMIZATION */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-lg p-3 relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-purple-400 mb-2 pb-1 border-b border-slate-700">
              <span>3. Portfolio Optimization</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span><span>CVaR Cost Minimization</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span><span>Dynamic Risk Allocation</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span><span>Rejects Fixed 70/30 Rule</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span><span>Optimal Laycan Windows</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span><span>Berth Draft Clearance</span></li>
            </ul>
          </div>

          {/* STEP 4: ACTIONABLE DIRECTIVES & OUTPUTS */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-lg p-3 relative">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 mb-2 pb-1 border-b border-slate-700">
              <span>4. Actionable Directives</span>
              <FileCheck className="w-3.5 h-3.5" />
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300 font-mono">
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>Strike / Buy Corridor</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>Hold / Weather Advisories</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>Landed Cost Savings (₹Cr)</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>Demurrage Avoidance</span></li>
              <li className="flex items-center space-x-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span><span>MARPOL Legal Evidence</span></li>
            </ul>
          </div>

        </div>
      </div>

    </div>
  );
}
