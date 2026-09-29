import React from 'react';
import WebTerminalModelTrainer from '../components/WebTerminalModelTrainer';
import CharterTimingDecisionMatrix from '../components/CharterTimingDecisionMatrix';
import DetailedRouteScenarioAnalysis from '../components/DetailedRouteScenarioAnalysis';
import ForecastChart from '../components/ForecastChart';
import { TrendingUp, Terminal, BarChart3, Calculator, ShieldCheck } from 'lucide-react';

export default function FreightForecastsPage({
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
  marketData
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-sky-600 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Predictive Intelligence Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Freight Forecasts & Chartering Decision Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            In-browser GBDT Quantile Model training, 21-day tender booking windows, P10/P50/P90 probability envelopes, and voyage economic simulations.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-sky-50 text-sky-800 border border-sky-200 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Model: GBDT Quantile v2.0 (Active)</span>
          </span>
        </div>
      </div>

      {/* 1. Web Terminal & Live Model Training Console (Placed FIRST) */}
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

      {/* 2. Optimal Market Entry Timing, PSU Tender & Contract Horizon Matrix */}
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

      {/* 3. Detailed Route Scenario Analysis */}
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

      {/* 4. Freight Forecasting Graphs with Ship Selector */}
      <ForecastChart
        forecast={forecast}
        currency={currency}
        terminalMetrics={terminalMetrics}
        selectedVessel={selectedVessel}
        onSelectVessel={setSelectedVessel}
      />

    </div>
  );
}
