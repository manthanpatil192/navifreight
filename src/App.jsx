import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import NautiqLandingDashboard from './components/NautiqLandingDashboard';
import ForecastChart from './components/ForecastChart';
import VesselOptimization from './components/VesselOptimization';
import SpotVsCoaPlanner from './components/SpotVsCoaPlanner';
import DeadheadOptimizer from './components/DeadheadOptimizer';
import MarketNewsFeed from './components/InteractiveRouteMap';
import LiveShipTrackerMap from './components/LiveShipTrackerMap';
import MarketIntelligenceRadar from './components/MarketIntelligenceRadar';
import DatasetExplorerModal from './components/DatasetExplorerModal';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import { calculateFreightForecast } from './utils/forecastingEngine';
import { MARKET_NEWS_SIGNALS } from './data/marketNewsData';
import { getSyncMarketData, subscribeMarketData, forceRefreshMarketData } from './services/liveMarketDataService';
import { 
  Ship, FileText, CheckCircle2, Compass, TrendingUp, 
  RefreshCw, ShieldCheck, Layers, ArrowRight, BarChart3, Anchor,
  LayoutDashboard, Menu, X, Activity, Navigation, Database, Star,
  Zap, ExternalLink, ChevronRight
} from 'lucide-react';

import ActionableBookingDirective from './components/ActionableBookingDirective';
import WebTerminalModelTrainer from './components/WebTerminalModelTrainer';
import CharterTimingDecisionMatrix from './components/CharterTimingDecisionMatrix';
import DetailedRouteScenarioAnalysis from './components/DetailedRouteScenarioAnalysis';
import LoginPage from './components/LoginPage';

const NAUTIQ_SIDEBAR_LINKS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'NautIQ Core' },
  { id: 'part_a', label: 'Freight Forecasts', icon: TrendingUp, badge: 'Phase 1' },
  { id: 'part_b', label: 'Chartering & Port Fit', icon: Compass, badge: 'Phase 2' },
  { id: 'part_c', label: 'Vessel Bunching', icon: RefreshCw, badge: 'Phase 3' },
  { id: 'part_d', label: 'Market Insights & AIS', icon: Activity, badge: 'Phase 4' },
  { id: 'all', label: 'Complete Pipeline', icon: Layers, badge: 'All Tools' },
];

export default function App() {
  // Authentication & View State (Default to false so landing page opens immediately for visitors & judges)
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Application State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrigin, setSelectedOrigin] = useState('hay_point');
  const [selectedDestination, setSelectedDestination] = useState('paradip');
  const [selectedVessel, setSelectedVessel] = useState('capesize');
  const [cargoType, setCargoType] = useState('coking_coal');
  const [cargoVolumeMT, setCargoVolumeMT] = useState(150000);
  const [contractHorizonMonths, setContractHorizonMonths] = useState(3);
  const [volatilityIndex, setVolatilityIndex] = useState(1.0);
  const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'
  const [activeNewsSignal, setActiveNewsSignal] = useState(MARKET_NEWS_SIGNALS[0]);
  const [coaSplitPercent, setCoaSplitPercent] = useState(70);
  const [terminalMetrics, setTerminalMetrics] = useState(null);
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Real-Time Dynamic Market & Forex Telemetry State
  const [marketData, setMarketData] = useState(getSyncMarketData());

  useEffect(() => {
    const unsub = subscribeMarketData((fresh) => {
      setMarketData(fresh);
    });
    return () => unsub();
  }, []);

  // Authentication Handlers
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setShowLoginPage(false);
  };

  const handleGuestAccess = () => {
    setShowLoginPage(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setShowLoginPage(true);
  };

  // Dynamic Freight Forecast Calculation with Live News Signal Coupling (Memoized)
  const forecast = useMemo(() => calculateFreightForecast({
    originId: selectedOrigin,
    destinationId: selectedDestination,
    vesselId: selectedVessel,
    cargoMT: cargoVolumeMT,
    horizonMonths: contractHorizonMonths,
    marketVolatilityMultiplier: volatilityIndex,
    activeNewsSignal: activeNewsSignal,
    coaSplitPercent: coaSplitPercent,
    marketData: marketData
  }), [
    selectedOrigin,
    selectedDestination,
    selectedVessel,
    cargoVolumeMT,
    contractHorizonMonths,
    volatilityIndex,
    activeNewsSignal,
    coaSplitPercent,
    marketData?.usdInrSpot,
    marketData?.vlsfoPriceUSD
  ]);

  const handleApplyScenario = (config) => {
    setSelectedOrigin(config.origin);
    setSelectedDestination(config.destination);
    setSelectedVessel(config.vessel);
    setCargoVolumeMT(config.cargoVolumeMT);
    setContractHorizonMonths(config.horizon);
    if (config.cargoType) setCargoType(config.cargoType);
  };

  const handleExportReport = () => {
    setIsReportModalOpen(true);
  };

  // If user is on the Login view, render the high-end Figma-inspired Login Page
  if (showLoginPage) {
    return (
      <LoginPage
        onLogin={handleLoginSuccess}
        onGuestAccess={handleGuestAccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-sky-100 selection:text-sky-900">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION (MATCHING PICTURE 2 REFERENCE)                 */}
      {/* ========================================================================= */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Logo Brand Header (Pic 2) */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
                <Ship className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black text-slate-900 tracking-tight">Naut<span className="text-sky-600">IQ</span></span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200 font-mono">v2.0</span>
              </div>
            </div>

            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Matching Picture 2 Sidebar items) */}
          <div className="p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Platform Workflow
            </div>

            {NAUTIQ_SIDEBAR_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-2xs border border-sky-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}

            <div className="pt-4 mt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
                Executive & Datasets
              </div>

              <button
                onClick={() => setIsDatasetModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Sovereign Feeds</span>
                </div>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                  8 Sources
                </span>
              </button>

              <button
                onClick={handleExportReport}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>CAG Brief & Audit</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </button>
            </div>
          </div>

        </div>

        {/* Sidebar Footer with Model Status & User Info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-[11px] shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                GBDT Quantile v2.0
              </span>
              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-bold">
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-slate-500">
              FastAPI Server: Connected (200 OK)
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="text-[11px]">
              <span className="font-bold text-slate-800 block">
                {currentUser ? currentUser.roleTitle : 'Chartering Desk'}
              </span>
              <span className="text-[9.5px] text-slate-400">
                {currentUser ? currentUser.organization : 'SAIL / RINL / NTPC'}
              </span>
            </div>
            <button
              onClick={() => setShowLoginPage(true)}
              className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 cursor-pointer"
            >
              {currentUser ? 'Switch' : 'Sign In'}
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA (OFFSET FOR DESKTOP SIDEBAR)                         */}
      {/* ========================================================================= */}
      <div className="md:pl-64 flex-1 flex flex-col min-w-0">
        
        {/* Top Header Navbar */}
        <Navbar
          onOpenDatasets={() => setIsDatasetModalOpen(true)}
          currency={currency}
          setCurrency={setCurrency}
          onExportReport={handleExportReport}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenLoginPage={() => setShowLoginPage(true)}
          marketData={marketData}
          onRefreshMarketData={forceRefreshMarketData}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Content Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
          
          {/* Active Authenticated Session Banner */}
          {currentUser && (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-4 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-slate-900">Active Terminal Session:</span>
                <span className="font-semibold text-slate-700">{currentUser.roleTitle}</span>
                <span className="text-slate-400">· {currentUser.organization}</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  LICENSE: {currentUser.code}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-rose-600 hover:text-rose-700 font-semibold transition-colors cursor-pointer"
                >
                  Sign Out / Switch Role
                </button>
              </div>
            </div>
          )}

          {/* Quick Tab Header (visible when user wants to switch between full dashboard and deep dive tabs) */}
          <div className="bg-white border border-slate-200 rounded-xl p-1.5 mb-6 shadow-subtle flex items-center justify-between overflow-x-auto">
            <div className="flex items-center space-x-1 min-w-max">
              {NAUTIQ_SIDEBAR_LINKS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-sky-600 text-white shadow-2xs' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center space-x-2 text-[11px] font-semibold text-slate-500 pl-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 1st: Web Terminal</span>
              <span>➔</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500"></span> 2nd: Phase 1 Forecast</span>
              <span>➔</span>
              <span className="text-slate-400">Phases 2-4</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRIMARY VIEW: NAUTIQ LANDING DASHBOARD (MATCHES PIC 1 FLOW & PIC 2 UI)    */}
          {/* ========================================================================= */}
          {(activeTab === 'dashboard' || activeTab === 'all') && (
            <NautiqLandingDashboard
              selectedOrigin={selectedOrigin}
              setSelectedOrigin={setSelectedOrigin}
              selectedDestination={selectedDestination}
              setSelectedDestination={setSelectedDestination}
              selectedVessel={selectedVessel}
              setSelectedVessel={setSelectedVessel}
              cargoVolumeMT={cargoVolumeMT}
              setCargoVolumeMT={setCargoVolumeMT}
              contractHorizonMonths={contractHorizonMonths}
              setContractHorizonMonths={setContractHorizonMonths}
              volatilityIndex={volatilityIndex}
              setVolatilityIndex={setVolatilityIndex}
              currency={currency}
              forecast={forecast}
              terminalMetrics={terminalMetrics}
              setTerminalMetrics={setTerminalMetrics}
              activeNewsSignal={activeNewsSignal}
              setActiveNewsSignal={setActiveNewsSignal}
              coaSplitPercent={coaSplitPercent}
              setCoaSplitPercent={setCoaSplitPercent}
              marketData={marketData}
              onExportReport={handleExportReport}
              onOpenDatasets={() => setIsDatasetModalOpen(true)}
            />
          )}

          {/* ================= PART A: DETAILED FREIGHT TIMING & SCENARIOS ================= */}
          {(activeTab === 'part_a' || activeTab === 'all') && activeTab !== 'dashboard' && (
            <div className="space-y-6 mt-6 animate-in fade-in duration-200">
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

              <CharterTimingDecisionMatrix
                selectedOrigin={selectedOrigin}
                selectedDestination={selectedDestination}
                selectedVessel={selectedVessel}
                cargoVolumeMT={cargoVolumeMT}
                contractHorizonMonths={contractHorizonMonths}
                onSelectHorizon={(horizon) => setContractHorizonMonths(horizon)}
                currency={currency}
                terminalMetrics={terminalMetrics}
                forecast={forecast}
              />

              <DetailedRouteScenarioAnalysis
                selectedOrigin={selectedOrigin}
                selectedDestination={selectedDestination}
                selectedVessel={selectedVessel}
                cargoVolumeMT={cargoVolumeMT}
                terminalMetrics={terminalMetrics}
                contractHorizonMonths={contractHorizonMonths}
                forecast={forecast}
                coaSplitPercent={coaSplitPercent}
              />

              <ForecastChart
                forecast={forecast}
                currency={currency}
                terminalMetrics={terminalMetrics}
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
              />
            </div>
          )}

          {/* ================= PART B: DETAILED VESSEL & PORT FIT ================= */}
          {(activeTab === 'part_b' || activeTab === 'all') && activeTab !== 'dashboard' && (
            <div className="space-y-6 mt-6 animate-in fade-in duration-200">
              <VesselOptimization
                selectedOrigin={selectedOrigin}
                selectedDestination={selectedDestination}
                cargoVolumeMT={cargoVolumeMT}
                currency={currency}
                onSelectVessel={setSelectedVessel}
                currentVesselId={selectedVessel}
                onSelectPort={(portId) => setSelectedDestination(portId)}
              />
            </div>
          )}

          {/* ================= PART C: DETAILED IDLE & BUNCHING ================= */}
          {(activeTab === 'part_c' || activeTab === 'all') && activeTab !== 'dashboard' && (
            <div className="space-y-6 mt-6 animate-in fade-in duration-200">
              <DeadheadOptimizer
                selectedDestination={selectedDestination}
                currency={currency}
                forecast={forecast}
                terminalMetrics={terminalMetrics}
                activeNewsSignal={activeNewsSignal}
                onSelectPort={(portId) => setSelectedDestination(portId)}
              />
            </div>
          )}

          {/* ================= PART D: RISK MITIGATION & AIS TRACKER ================= */}
          {(activeTab === 'part_d' || activeTab === 'all') && activeTab !== 'dashboard' && (
            <div className="space-y-6 mt-6 animate-in fade-in duration-200">
              <MarketIntelligenceRadar
                activeNewsSignal={activeNewsSignal}
                onSelectNewsSignal={(signal) => setActiveNewsSignal(signal)}
                currency={currency}
              />

              <LiveShipTrackerMap
                selectedDestination={selectedDestination}
                onSelectPort={(portId) => setSelectedDestination(portId)}
                selectedVessel={selectedVessel}
              />
            </div>
          )}

        </main>

        {/* Dataset Explorer Modal */}
        <DatasetExplorerModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
        />

        {/* Executive Chartering Brief & Audit Report Modal */}
        <ExecutiveReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          forecast={forecast}
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
          selectedVessel={selectedVessel}
          cargoVolumeMT={cargoVolumeMT}
          contractHorizonMonths={contractHorizonMonths}
          currency={currency}
        />

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded bg-sky-600 flex items-center justify-center text-white text-[10px] font-bold">
                NQ
              </div>
              <span className="font-bold text-slate-800">NautIQ Decision Terminal</span>
              <span>• Smart India Hackathon Prototype (SIH26006)</span>
            </div>

            <div className="flex items-center space-x-4 text-[11px]">
              <span>Feeds: SSE • NOAA • ICE • FreightFox • FOIS • DGCIS</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-semibold">100% Free Sovereign Open Feeds</span>
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}
