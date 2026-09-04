import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ForecastChart from './components/ForecastChart';
import VesselOptimization from './components/VesselOptimization';
import SpotVsCoaPlanner from './components/SpotVsCoaPlanner';
import DeadheadOptimizer from './components/DeadheadOptimizer';
import RiskCongestionRadar from './components/RiskCongestionRadar';
import MarketNewsFeed from './components/InteractiveRouteMap';
import LiveShipTrackerMap from './components/LiveShipTrackerMap';
import SystemLogicRiskMatrix from './components/SystemLogicRiskMatrix';
import DatasetExplorerModal from './components/DatasetExplorerModal';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import { calculateFreightForecast } from './utils/forecastingEngine';
import { PORT_CONGESTION_STATUS } from './data/weatherCongestionData';
import { MARKET_NEWS_SIGNALS } from './data/marketNewsData';
import { 
  Ship, FileText, CheckCircle2, Compass, TrendingUp, 
  RefreshCw, ShieldCheck, Layers, ArrowRight, BarChart3, Anchor
} from 'lucide-react';

import ActionableBookingDirective from './components/ActionableBookingDirective';
import WebTerminalModelTrainer from './components/WebTerminalModelTrainer';
import CharterTimingDecisionMatrix from './components/CharterTimingDecisionMatrix';

const PS_TABS = [
  { id: 'part_a', label: 'Part A: Market Timing', sublabel: 'Freight Forecasting & Entry', badge: 'Section (a)', icon: TrendingUp },
  { id: 'part_b', label: 'Part B: Vessel & Port Fit', sublabel: 'Draft & TPD Optimization', badge: 'Section (b)', icon: Ship },
  { id: 'part_c', label: 'Part C: Idle & Deadhead', sublabel: 'Backhaul Tramp Routing', badge: 'Section (c)', icon: RefreshCw },
  { id: 'part_d', label: 'Part D: Risk & Congestion', sublabel: '4-Factor Matrix & AIS Radar', badge: 'Section (d)', icon: ShieldCheck },
  { id: 'all', label: 'Complete Pipeline', sublabel: 'Full Continuous Flow', badge: 'All Phases', icon: Layers },
];

export default function App() {
  // Application State
  const [activeTab, setActiveTab] = useState('part_a');
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

  // Dynamic Freight Forecast Calculation with Live News Signal Coupling
  const forecast = calculateFreightForecast({
    originId: selectedOrigin,
    destinationId: selectedDestination,
    vesselId: selectedVessel,
    cargoMT: cargoVolumeMT,
    horizonMonths: contractHorizonMonths,
    marketVolatilityMultiplier: volatilityIndex,
    activeNewsSignal: activeNewsSignal,
    coaSplitPercent: coaSplitPercent
  });

  const currentPortCongestion = PORT_CONGESTION_STATUS[selectedDestination];

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

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-maritime-100 selection:text-maritime-900">
      
      {/* 1. Header & Navigation */}
      <Navbar
        onOpenDatasets={() => setIsDatasetModalOpen(true)}
        currency={currency}
        setCurrency={setCurrency}
        onExportReport={handleExportReport}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Executive Summary Banner */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h1 className="text-base font-bold text-slate-900">
                East Coast India Bulk Procurement & Predictive Chartering Decision Engine
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transitioning from reactive daily spot chartering to optimized <span className="font-semibold text-slate-700">3-Month / 6-Month Multiple Voyage Contracts (COAs)</span> using AI freight forecasts, port draft feasibility checks, and return tramp backhaul routing.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsDatasetModalOpen(true)}
              className="text-xs font-semibold text-maritime-800 hover:text-maritime-900 bg-maritime-50 border border-maritime-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Auditable Open Datasets (7 Sources)
            </button>
          </div>
        </div>


        {/* Problem Statement Part Navigation Tab Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-1.5 mb-6 shadow-subtle">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
            {PS_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-start text-left p-2.5 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-maritime-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {tab.badge}
                    </span>
                  </div>
                  <span className="text-xs font-bold truncate w-full">{tab.label}</span>
                  <span className={`text-[10px] truncate w-full ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                    {tab.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= PART A: MARKET TIMING & FORECASTING ================= */}
        {(activeTab === 'part_a' || activeTab === 'all') && (
          <div className="space-y-6 mt-6 animate-in fade-in duration-200">

            {/* OPTIMAL MARKET ENTRY TIMING & CONTRACT HORIZON DECISION MATRIX (PS PART A CORE) */}
            <CharterTimingDecisionMatrix
              selectedOrigin={selectedOrigin}
              selectedDestination={selectedDestination}
              selectedVessel={selectedVessel}
              cargoVolumeMT={cargoVolumeMT}
              contractHorizonMonths={contractHorizonMonths}
              onSelectHorizon={(horizon) => setContractHorizonMonths(horizon)}
              currency={currency}
            />

            {/* IN-BUILT WEB TERMINAL & LIVE MODEL TRAINING CONSOLE */}
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
            />

            {/* Freight Forecasting Chart - Automatically coupled with terminal execution */}
            <ForecastChart
              forecast={forecast}
              currency={currency}
              terminalMetrics={terminalMetrics}
            />
          </div>
        )}

        {/* ================= PAGE 3: PART B - VESSEL & PORT INFRASTRUCTURE FIT ================= */}
        {(activeTab === 'part_b' || activeTab === 'all') && (
          <div className="space-y-6 mt-6 animate-in fade-in duration-200">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Ship className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-900">
                  PS Part (b): Vessel Type Optimization & East Coast Indian Port Engineering Constraints
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                Draft, LOA, Beam & TPD Limits
              </span>
            </div>

            {/* Vessel Suitability & Real-Time Port Match Optimizer */}
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

        {/* ================= PAGE 4: PART C - IDLE SCENARIO & DEADHEADING REDUCTION ================= */}
        {(activeTab === 'part_c' || activeTab === 'all') && (
          <div className="space-y-6 mt-6 animate-in fade-in duration-200">
            <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 text-purple-700" />
                <span className="text-xs font-bold text-purple-900">
                  PS Part (c): Idle Scenario Management & Return Tramp (Backhaul) Deadheading Elimination
                </span>
              </div>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                Rebate Credit: $3.50–$5.20/MT
              </span>
            </div>

            {/* Deadheading & Tramp Return Optimizer */}
            <DeadheadOptimizer
              selectedDestination={selectedDestination}
              currency={currency}
              forecast={forecast}
            />
          </div>
        )}

        {/* ================= PAGE 5: PART D - RISK MITIGATION & PORT CONGESTION ================= */}
        {(activeTab === 'part_d' || activeTab === 'all') && (
          <div className="space-y-6 mt-6 animate-in fade-in duration-200">
            <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">
                  PS Part (d): Risk Mitigation, 4-Factor Decision Matrix & Real-Time AIS Port Radar
                </span>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Early Disruption Warning
              </span>
            </div>

            {/* 4-Factor Risk Score Engine & Decision Matrix */}
            <SystemLogicRiskMatrix
              selectedVessel={selectedVessel}
              selectedOrigin={selectedOrigin}
              selectedDestination={selectedDestination}
              contractHorizonMonths={contractHorizonMonths}
              forecast={forecast}
              portCongestion={currentPortCongestion}
              currency={currency}
            />

            {/* Live AIS Ship Tracking Map & Geofencing Radar */}
            <LiveShipTrackerMap
              selectedDestination={selectedDestination}
              onSelectPort={(portId) => setSelectedDestination(portId)}
            />

            {/* Bay of Bengal Weather & Demurrage Risk Radar */}
            <RiskCongestionRadar
              selectedDestination={selectedDestination}
              currency={currency}
            />
          </div>
        )}

      </main>

      {/* Dataset & ML Auditing Modal */}
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
            <div className="w-5 h-5 rounded bg-maritime-900 flex items-center justify-center text-white text-[10px] font-bold">
              NF
            </div>
            <span className="font-semibold text-slate-800">NaviFreight AI Engine</span>
            <span>• Smart India Hackathon Prototype (SIH26006)</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span>Sources: SSE • World Bank • DGCIS • AISStream • IMD • PortWatch</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-semibold">100% Free Public Datasets</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
