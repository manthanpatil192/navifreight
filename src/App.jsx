import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import DatasetExplorerModal from './components/DatasetExplorerModal';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import LoginPage from './components/LoginPage';
import { calculateFreightForecast } from './utils/forecastingEngine';
import { MARKET_NEWS_SIGNALS } from './data/marketNewsData';
import { getSyncMarketData, subscribeMarketData, forceRefreshMarketData } from './services/liveMarketDataService';

// Dedicated Pages (Matching the User's Exact 6-Stage Process Sequence + Master Dashboard)
import DashboardLandingPage from './pages/DashboardLandingPage';
import FreightForecastsPage from './pages/FreightForecastsPage';
import MarketVolatilityPage from './pages/MarketVolatilityPage';
import VesselPortFitPage from './pages/VesselPortFitPage';
import VesselBunchingPage from './pages/VesselBunchingPage';
import MultimodalRailwayMapPage from './pages/MultimodalRailwayMapPage';
import CargoMatchingPage from './pages/CargoMatchingPage';

import { 
  LayoutGrid, TrendingUp, Activity, Compass, RefreshCw, 
  Train, Ship, FileText, Database, ShieldCheck, X, ChevronRight 
} from 'lucide-react';

const SIDEBAR_NAV_ITEMS = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: LayoutGrid, 
    badge: '4-Phase Flow',
    description: 'Executive Overview of 4-Phase Pipeline'
  },
  { 
    id: 'forecasts', 
    label: 'Freight Forecasts & Chartering', 
    icon: TrendingUp, 
    badge: 'Step 1',
    description: 'Part A: Web Terminal & Quantile Modeling'
  },
  { 
    id: 'volatility', 
    label: 'Market Volatility Radar', 
    icon: Activity, 
    badge: 'Step 2',
    description: '4-Stage AI Disruption & News Stream'
  },
  { 
    id: 'port_fit', 
    label: 'Vessel & Port Fit', 
    icon: Compass, 
    badge: 'Step 3',
    description: 'Part B: Draft, LOA & TPD Engineering'
  },
  { 
    id: 'bunching', 
    label: 'Vessel Bunching Engine', 
    icon: RefreshCw, 
    badge: 'Step 4',
    description: 'Tier-1 ETA & Emergency Coal Priority'
  },
  { 
    id: 'multimodal', 
    label: 'Multimodal Railway & Map', 
    icon: Train, 
    badge: 'Step 5',
    description: '3-Way Cost Gate & Live AIS Tracker'
  },
  { 
    id: 'cargo_matching', 
    label: 'Cargo Matching & Coastal Hop', 
    icon: Ship, 
    badge: 'Step 6',
    description: '2,000 MT/hr Berth & Tramp Triangulation'
  },
];

export default function App() {
  // Authentication & View State (Default to false so visitors land directly on Dashboard)
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginPage, setShowLoginPage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Application Page State (Defaults to 'dashboard' 4-phase overview)
  const [activePage, setActivePage] = useState('dashboard');

  // Shared Domain State
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

  const handleExportReport = () => {
    setIsReportModalOpen(true);
  };

  // If user opened the Login view, render the Figma-grade LoginPage
  if (showLoginPage) {
    return (
      <LoginPage
        onLogin={handleLoginSuccess}
        onGuestAccess={handleGuestAccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-sky-100 selection:text-sky-900">
      
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ========================================================================= */}
      {/* LEFT SIDEBAR NAVIGATION (MATCHING USER SCREENSHOT)                       */}
      {/* ========================================================================= */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Logo Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-xs">
                <Ship className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-black text-slate-900 tracking-tight">
                  NaviFreight<span className="text-sky-600">.AI</span>
                </span>
              </div>
            </div>

            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links (Exact Match of Screenshot Layout) */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1.5">
              Decision Workflow
            </div>

            {SIDEBAR_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsSidebarOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-2xs border border-sky-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  title={item.description}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
                    isActive ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.badge}
                  </span>
                </button>
              );
            })}

            {/* Sovereign Data & CAG Brief Actions */}
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
                  8 Feeds
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
          </nav>

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
      {/* MAIN CONTENT CANVAS (OFFSET FOR FIXED DESKTOP SIDEBAR)                    */}
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Active Authenticated Session Banner */}
          {currentUser && (
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 mb-5 shadow-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
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

          {/* ========================================================================= */}
          {/* DEDICATED PAGE RENDERING                                                 */}
          {/* ========================================================================= */}

          {/* PAGE 0: DASHBOARD (Landing Page with End-to-End 4-Phase Architecture Flow) */}
          {activePage === 'dashboard' && (
            <DashboardLandingPage
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
              onNavigateToPage={(pageId) => {
                setActivePage(pageId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenDatasets={() => setIsDatasetModalOpen(true)}
              onExportReport={handleExportReport}
            />
          )}

          {/* PAGE 1: FREIGHT FORECASTS & CHARTERING (Part A: Web Terminal first + Model + Curves) */}
          {activePage === 'forecasts' && (
            <FreightForecastsPage
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
            />
          )}

          {/* PAGE 2: MARKET VOLATILITY RADAR (Early Market Volatility + News + Sovereign Feeds) */}
          {activePage === 'volatility' && (
            <MarketVolatilityPage
              activeNewsSignal={activeNewsSignal}
              setActiveNewsSignal={setActiveNewsSignal}
              currency={currency}
              onOpenDatasets={() => setIsDatasetModalOpen(true)}
            />
          )}

          {/* PAGE 3: VESSEL & PORT FIT (Part B: Vessel Suitability & East Coast Port Limits) */}
          {activePage === 'port_fit' && (
            <VesselPortFitPage
              selectedOrigin={selectedOrigin}
              selectedDestination={selectedDestination}
              cargoVolumeMT={cargoVolumeMT}
              currency={currency}
              selectedVessel={selectedVessel}
              setSelectedVessel={setSelectedVessel}
              setSelectedDestination={setSelectedDestination}
            />
          )}

          {/* PAGE 4: VESSEL BUNCHING ENGINE (Tier-1 ETA + Congestion + Emergency Coal Priority) */}
          {activePage === 'bunching' && (
            <VesselBunchingPage
              selectedDestination={selectedDestination}
              setSelectedDestination={setSelectedDestination}
              currency={currency}
            />
          )}

          {/* PAGE 5: MULTIMODAL RAILWAY & MAP (3-Way Decision Equation + FOIS Rail + Live Map) */}
          {activePage === 'multimodal' && (
            <MultimodalRailwayMapPage
              selectedDestination={selectedDestination}
              setSelectedDestination={setSelectedDestination}
              selectedVessel={selectedVessel}
              cargoVolumeMT={cargoVolumeMT}
              currency={currency}
              marketData={marketData}
            />
          )}

          {/* PAGE 6: CARGO MATCHING & COASTAL HOP (2,000 MT/hr Berth + Plant Matching + Backhaul) */}
          {activePage === 'cargo_matching' && (
            <CargoMatchingPage
              selectedDestination={selectedDestination}
              setSelectedDestination={setSelectedDestination}
              currency={currency}
              forecast={forecast}
              terminalMetrics={terminalMetrics}
              activeNewsSignal={activeNewsSignal}
            />
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

        {/* Platform Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded bg-sky-600 flex items-center justify-center text-white text-[10px] font-bold">
                NF
              </div>
              <span className="font-bold text-slate-800">NaviFreight AI Decision Terminal</span>
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
