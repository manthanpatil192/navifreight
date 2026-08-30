import React, { useState } from 'react';
import Navbar from './components/Navbar';
import MetricCards from './components/MetricCards';
import RouteSelector from './components/RouteSelector';
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
import ScenarioPresetsBar from './components/ScenarioPresetsBar';
import { calculateFreightForecast } from './utils/forecastingEngine';
import { PORT_CONGESTION_STATUS } from './data/weatherCongestionData';
import { Ship, FileText, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Application State
  const [selectedOrigin, setSelectedOrigin] = useState('hay_point');
  const [selectedDestination, setSelectedDestination] = useState('paradip');
  const [selectedVessel, setSelectedVessel] = useState('capesize');
  const [cargoType, setCargoType] = useState('coking_coal');
  const [cargoVolumeMT, setCargoVolumeMT] = useState(150000);
  const [contractHorizonMonths, setContractHorizonMonths] = useState(3);
  const [volatilityIndex, setVolatilityIndex] = useState(1.0);
  const [currency, setCurrency] = useState('INR'); // 'INR' or 'USD'
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Dynamic Freight Forecast Calculation
  const forecast = calculateFreightForecast({
    originId: selectedOrigin,
    destinationId: selectedDestination,
    vesselId: selectedVessel,
    cargoMT: cargoVolumeMT,
    horizonMonths: contractHorizonMonths,
    marketVolatilityMultiplier: volatilityIndex
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

        {/* SIH26006 Problem Study Scenario Presets Bar */}
        <ScenarioPresetsBar
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
          selectedVessel={selectedVessel}
          onApplyScenario={handleApplyScenario}
        />

        {/* 2. Top Metric Cards */}
        <MetricCards
          forecast={forecast}
          currency={currency}
          portCongestion={currentPortCongestion}
        />

        {/* 3. Trade Route & Cargo Configurator */}
        <RouteSelector
          selectedOrigin={selectedOrigin}
          setSelectedOrigin={setSelectedOrigin}
          selectedDestination={selectedDestination}
          setSelectedDestination={setSelectedDestination}
          selectedVessel={selectedVessel}
          setSelectedVessel={setSelectedVessel}
          cargoType={cargoType}
          setCargoType={setCargoType}
          cargoVolumeMT={cargoVolumeMT}
          setCargoVolumeMT={setCargoVolumeMT}
          contractHorizonMonths={contractHorizonMonths}
          setContractHorizonMonths={setContractHorizonMonths}
          volatilityIndex={volatilityIndex}
          setVolatilityIndex={setVolatilityIndex}
        />

        {/* 4. Interactive Freight Forecasting Chart */}
        <ForecastChart
          forecast={forecast}
          currency={currency}
        />

        {/* 5. Part C & D: Multi-Variable Risk Score Engine & Decision Matrix */}
        <SystemLogicRiskMatrix
          selectedVessel={selectedVessel}
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
          contractHorizonMonths={contractHorizonMonths}
          forecast={forecast}
          portCongestion={currentPortCongestion}
          currency={currency}
        />

        {/* 6. Vessel Suitability & Real-Time Port Match Optimizer */}
        <VesselOptimization
          selectedDestination={selectedDestination}
          cargoVolumeMT={cargoVolumeMT}
          currency={currency}
          onSelectVessel={setSelectedVessel}
          currentVesselId={selectedVessel}
          onSelectPort={(portId) => setSelectedDestination(portId)}
        />

        {/* 6. Spot vs Multi-Voyage COA Financial Planner */}
        <SpotVsCoaPlanner
          forecast={forecast}
          cargoVolumeMT={cargoVolumeMT}
          contractHorizonMonths={contractHorizonMonths}
          currency={currency}
        />

        {/* 7. Live AIS Ship Tracking Map & Geofencing Radar */}
        <LiveShipTrackerMap
          selectedDestination={selectedDestination}
          onSelectPort={(portId) => setSelectedDestination(portId)}
        />

        {/* 8. Live Market Intelligence & News Feed */}
        <MarketNewsFeed
          selectedOrigin={selectedOrigin}
          selectedDestination={selectedDestination}
        />

        {/* 8. Deadheading & Tramp Return Optimizer */}
        <DeadheadOptimizer
          selectedDestination={selectedDestination}
          currency={currency}
        />

        {/* 9. Bay of Bengal Weather & Demurrage Risk Radar */}
        <RiskCongestionRadar
          selectedDestination={selectedDestination}
          currency={currency}
        />

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
