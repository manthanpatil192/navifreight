import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import DatasetExplorerModal from './components/DatasetExplorerModal';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import LoginPage from './components/LoginPage';
import { calculateFreightForecast } from './utils/forecastingEngine';
import { MARKET_NEWS_SIGNALS } from './data/marketNewsData';
import { getSyncMarketData, subscribeMarketData, forceRefreshMarketData } from './services/liveMarketDataService';

// Authentic Original Core Components (NO synthetic wrapper cards)
import WebTerminalModelTrainer from './components/WebTerminalModelTrainer';
import CharterTimingDecisionMatrix from './components/CharterTimingDecisionMatrix';
import DetailedRouteScenarioAnalysis from './components/DetailedRouteScenarioAnalysis';
import ForecastChart from './components/ForecastChart';
import MarketIntelligenceRadar from './components/MarketIntelligenceRadar';
import VesselOptimization from './components/VesselOptimization';
import VesselBunchingTerminal from './components/VesselBunchingTerminal';
import LiveShipTrackerMap from './components/LiveShipTrackerMap';
import CargoToHoldMatcher from './components/CargoToHoldMatcher';
import DeadheadOptimizer from './components/DeadheadOptimizer';

import { 
  TrendingUp, Activity, Compass, RefreshCw, 
  Train, Ship, X, LogOut, User, LogIn 
} from 'lucide-react';

const SIDEBAR_NAV_ITEMS = [
  { id: 'forecasts', label: 'Freight Forecasts & Chartering', icon: TrendingUp },
  { id: 'volatility', label: 'Early Market Volatility', icon: Activity },
  { id: 'port_fit', label: 'Vessel & Port Fit', icon: Compass },
  { id: 'bunching', label: 'Vessel Bunching', icon: RefreshCw },
  { id: 'railway_map', label: 'Railway & Map', icon: Train },
  { id: 'cargo_port', label: 'Cargo to Port', icon: Ship },
];

export default function App() {
  // Authentication & View State (Default to true so visitors land on the Main Landing Page initially)
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginPage, setShowLoginPage] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Application Page State (Defaults to 'forecasts' as requested)
  const [activePage, setActivePage] = useState('forecasts');

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

  // If user opened the Login view, render the LoginPage
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
      {/* 1. LEFT SIDEBAR NAVIGATION (CLEAN MINIMAL DESIGN, NO EXTRA CARDS)          */}
      {/* ========================================================================= */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-sm
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Single Unified Official NaviFreight Logo Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-maritime-900 flex items-center justify-center text-white shadow-sm shrink-0">
                <Ship className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">NaviFreight</span>
                <span className="bg-maritime-50 text-maritime-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-maritime-200">
                  AI TERMINAL
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

          {/* Clean Navigation Links Only */}
          <nav className="p-3 space-y-1">
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
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-50 text-sky-700 shadow-2xs border border-sky-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Footer: User Status & Logout */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-maritime-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.roleTitle ? currentUser.roleTitle.charAt(0) : 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {currentUser.roleTitle || 'Chartering Desk'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {currentUser.organization || 'SAIL / RINL / NTPC'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 truncate">
                    Chartering Desk
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Guest / Demo Session
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowLoginPage(true)}
                title="Sign In / Switch Role"
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer shrink-0 ml-1 flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            </div>
          )}
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
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Active Authenticated Session Banner (if logged in) */}
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
          {/* 1. FREIGHT FORECASTS & CHARTERING (ENTIRE PART A CONTENT)                 */}
          {/* ========================================================================= */}
          {activePage === 'forecasts' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* 1. First: Web Terminal & Model Trainer Console */}
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

              {/* 2. Second: Charter Timing Decision Matrix */}
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

              {/* 3. Third: Detailed Route Scenario Analysis */}
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

              {/* 4. Fourth: Freight Forecasting Graphs */}
              <ForecastChart
                forecast={forecast}
                currency={currency}
                terminalMetrics={terminalMetrics}
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
              />

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. EARLY MARKET VOLATILITY                                               */}
          {/* ========================================================================= */}
          {activePage === 'volatility' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <MarketIntelligenceRadar
                activeNewsSignal={activeNewsSignal}
                onSelectNewsSignal={(signal) => setActiveNewsSignal(signal)}
                currency={currency}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. ENTIRE PART B: VESSEL & PORT FIT                                       */}
          {/* ========================================================================= */}
          {activePage === 'port_fit' && (
            <div className="space-y-6 animate-in fade-in duration-150">
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

          {/* ========================================================================= */}
          {/* 4. VESSEL BUNCHING PART                                                  */}
          {/* ========================================================================= */}
          {activePage === 'bunching' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <VesselBunchingTerminal
                selectedDestination={selectedDestination}
                onSelectPort={(portId) => setSelectedDestination(portId)}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 5. RAILWAY PART AND MAP                                                  */}
          {/* ========================================================================= */}
          {activePage === 'railway_map' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <LiveShipTrackerMap
                selectedDestination={selectedDestination}
                onSelectPort={(portId) => setSelectedDestination(portId)}
                selectedVessel={selectedVessel}
              />
            </div>
          )}

          {/* ========================================================================= */}
          {/* 6. CARGO TO PORT PART                                                    */}
          {/* ========================================================================= */}
          {activePage === 'cargo_port' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <CargoToHoldMatcher
                currency={currency}
                onSelectShip={(ship) => console.log('Selected ship:', ship)}
              />
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
              <div className="w-5 h-5 rounded bg-maritime-900 flex items-center justify-center text-white text-[10px] font-bold">
                NF
              </div>
              <span className="font-bold text-slate-800">NaviFreight AI Engine</span>
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
