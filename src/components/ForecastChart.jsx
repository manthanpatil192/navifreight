import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, Award, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateDynamicTimeSeries } from '../utils/forecastingEngine';
import InsightBulb from './InsightBulb';

export default function ForecastChart({ forecast, currency, terminalMetrics }) {
  const [viewWindow, setViewWindow] = useState('forward'); // 'all', 'forward', 'historical'
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;
  const unit = isINR ? '₹/MT' : '$/MT';
  const currSym = isINR ? '₹' : '$';

  // Dynamically compute time series scaling directly from Phase 1 forecast inputs + Terminal metrics
  const { 
    historical, 
    forecast: dynamicForecast,
    terminalP10,
    terminalP50,
    terminalP90,
    terminalCoa
  } = generateDynamicTimeSeries(forecast, multiplier, terminalMetrics);

  let chartData = [];
  if (viewWindow === 'forward') {
    // Show last 3 historical months + 6 forward months
    chartData = [...historical.slice(-4), ...dynamicForecast];
  } else if (viewWindow === 'historical') {
    chartData = historical;
  } else {
    chartData = [...historical, ...dynamicForecast];
  }

  // Active P10, P50, P90 display values for badges and reference lines
  const displayP10 = terminalP10 || Math.round((forecast.lowerBound95 || 14.85) * multiplier);
  const displayP50 = terminalP50 || Math.round((forecast.projectedSpotRateUSD || 17.32) * multiplier);
  const displayP90 = terminalP90 || Math.round((forecast.upperBound95 || 21.18) * multiplier);

  // Custom rich tooltip with explicit P10, P50, P90 points
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-elevated text-xs max-w-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="font-bold text-slate-800">{label}</span>
            {data.isForecast ? (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                Terminal ML Quantile Cones
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded">
                DGCIS Ground Truth
              </span>
            )}
          </div>

          <div className="space-y-1.5 tabular-nums">
            {data.p90 && (
              <div className="flex justify-between items-center text-rose-600 font-semibold">
                <span>🔴 P90 Stress Ceiling:</span>
                <span>{currSym}{data.p90} {unit}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-blue-700 font-bold">
              <span>🔵 P50 Expected Median:</span>
              <span>{currSym}{data.p50 || data.spotRate} {unit}</span>
            </div>

            {data.p10 && (
              <div className="flex justify-between items-center text-emerald-600 font-semibold">
                <span>🟢 P10 Optimistic Dip:</span>
                <span>{currSym}{data.p10} {unit}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-teal-700 font-bold">
              <span>🛡️ Multi-Voyage COA Lock:</span>
              <span>{currSym}{data.coaRate} {unit}</span>
            </div>

            {data.isForecast && (
              <div className="mt-2 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-1 text-[11px] font-semibold text-slate-800">
                  <Sparkles className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate">Directive: {data.recommendation}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                  {data.rationale}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-3">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 2: Live Forward Freight Rate Trajectory & ML Quantile Cones (P10 / P50 / P90)</span>
              <InsightBulb
                title="Phase 2: Freight Forecasting & Bayesian Confidence (Point A)"
                subtitle="Terminal Engine & ML Quantile Coupling"
                dataset="Shanghai Shipping Exchange (SSE) + Baltic Exchange + Terminal GBDT Regressors"
                logic="Directly couples with the Web Terminal inference results. Plots the P10 optimistic dip floor (Strike Window), P50 expected median forecast, and P90 stress tail-risk bound (Blackout Window)."
                impact="Empowers charterers to time 3-month and 6-month COA locks exactly when forward trajectories touch P10 dip windows."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-horizon forecast dynamically synchronized with the Web Terminal GBDT quantile engine
          </p>
        </div>

        {/* Time Window Tabs */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setViewWindow('forward')}
            className={`px-3 py-1 rounded transition-colors ${
              viewWindow === 'forward'
                ? 'bg-white text-maritime-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            6-Month Forward AI Forecast
          </button>
          <button
            onClick={() => setViewWindow('all')}
            className={`px-3 py-1 rounded transition-colors ${
              viewWindow === 'all'
                ? 'bg-white text-maritime-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3-Year Trend & Projection
          </button>
          <button
            onClick={() => setViewWindow('historical')}
            className={`px-3 py-1 rounded transition-colors ${
              viewWindow === 'historical'
                ? 'bg-white text-maritime-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historical Ground Truth
          </button>
        </div>
      </div>


      {/* Live Web Terminal ML Coupling Banner with P10, P50, and P90 metric points */}
      <div className="bg-slate-900 text-white rounded-lg p-3 mb-4 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Connected to Web Terminal ML Quantile Engine
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/60 px-2 py-0.5 rounded font-mono">
                P10 / P50 / P90 Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Trajectory and quantile envelopes reflect terminal directives for {forecast.origin.name} → {forecast.destination.name}.
            </p>
          </div>
        </div>

        {/* Dynamic P10, P50, P90 Metric Badges */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="bg-slate-800/90 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-center shadow-xs">
            <span className="text-[9px] text-emerald-400 font-black uppercase block">🟢 P10 (Dip Floor)</span>
            <span className="text-xs font-mono font-black text-emerald-300">
              {currSym}{displayP10.toLocaleString()} {unit}
            </span>
          </div>
          <div className="bg-slate-800/90 border border-blue-500/50 rounded-lg px-2.5 py-1 text-center shadow-xs">
            <span className="text-[9px] text-blue-400 font-black uppercase block">🔵 P50 (Expected Median)</span>
            <span className="text-xs font-mono font-black text-blue-300">
              {currSym}{displayP50.toLocaleString()} {unit}
            </span>
          </div>
          <div className="bg-slate-800/90 border border-rose-500/50 rounded-lg px-2.5 py-1 text-center shadow-xs">
            <span className="text-[9px] text-rose-400 font-black uppercase block">🔴 P90 (Stress Ceiling)</span>
            <span className="text-xs font-mono font-black text-rose-300">
              {currSym}{displayP90.toLocaleString()} {unit}
            </span>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(v) => `${isINR ? '₹' : '$'}${v}`}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />

            {/* Shaded 90% Quantile Risk Envelope (P10 to P90) */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="none"
              fill="#fee2e2"
              fillOpacity={0.4}
              name="90% Quantile Risk Envelope (P10–P90 Coverage)"
            />
            <Area
              type="monotone"
              dataKey="p10"
              stroke="none"
              fill="#ffffff"
              fillOpacity={1.0}
              name=""
            />

            {/* P90 Stress Bound Line */}
            <Line
              type="monotone"
              dataKey="p90"
              stroke="#e11d48"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3.5, fill: '#e11d48', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 6, stroke: '#9f1239', strokeWidth: 2 }}
              name={`🔴 P90 Stress Ceiling (Blackout Surge ${unit})`}
            />

            {/* P50 Expected Median Trajectory */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 6, stroke: '#1d4ed8', strokeWidth: 2 }}
              name={`🔵 P50 Expected Median (Base AI Forecast ${unit})`}
            />

            {/* P10 Optimistic Dip Line */}
            <Line
              type="monotone"
              dataKey="p10"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#059669', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 6, stroke: '#047857', strokeWidth: 2 }}
              name={`🟢 P10 Optimistic Dip (Strike Window ${unit})`}
            />

            {/* Multi-Voyage COA Fixed Benchmark */}
            <Line
              type="monotone"
              dataKey="coaRate"
              stroke="#0d9488"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3.5, fill: '#0d9488', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 6, stroke: '#0f766e', strokeWidth: 2 }}
              name={`🛡️ Multi-Voyage Contract (COA Fixed ${unit})`}
            />

            {/* Reference Line for Live Terminal P10 Dip */}
            <ReferenceLine
              y={displayP10}
              stroke="#059669"
              strokeDasharray="3 3"
              label={{ value: `P10 Dip: ${currSym}${displayP10.toLocaleString()}`, position: 'insideBottomLeft', fill: '#059669', fontSize: 10, fontWeight: 'bold' }}
            />

            {/* Reference Line for Live Terminal P90 Stress */}
            <ReferenceLine
              y={displayP90}
              stroke="#e11d48"
              strokeDasharray="3 3"
              label={{ value: `P90 Stress: ${currSym}${displayP90.toLocaleString()}`, position: 'insideTopLeft', fill: '#e11d48', fontSize: 10, fontWeight: 'bold' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Action Recommendation Banner — Dynamic Market Intelligence */}
      <div className={`mt-4 border rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
        forecast.percentageSavings >= 10 ? 'bg-emerald-50 border-emerald-200' : 
        forecast.percentageSavings >= 5 ? 'bg-amber-50 border-amber-200' : 
        'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center space-x-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            forecast.percentageSavings >= 10 ? 'bg-emerald-100 text-emerald-700' : 
            forecast.percentageSavings >= 5 ? 'bg-amber-100 text-amber-700' : 
            'bg-slate-100 text-slate-700'
          }`}>
            {forecast.percentageSavings >= 5 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800">
              {forecast.percentageSavings >= 10 ? (
                <>Optimal Contract Entry Window: <span className="text-emerald-700">{forecast.recommendationBadge}</span></>
              ) : forecast.percentageSavings >= 5 ? (
                <>Moderate Opportunity: <span className="text-amber-700">CONSIDER SHORT-TERM COA</span></>
              ) : (
                <>Market Stable: <span className="text-slate-700">{forecast.recommendationBadge}</span></>
              )}
            </span>
            <p className="text-[11px] text-slate-500">
              {forecast.adviceRationale}
              {' '}• P10 Strike Floor: {currSym}{displayP10.toLocaleString()} {unit}
              {' '}• P50 Median: {currSym}{displayP50.toLocaleString()} {unit}
              {' '}• P90 Tail-Risk: {currSym}{displayP90.toLocaleString()} {unit}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-bold text-slate-800 tabular-nums">
            Estimated Arbitrage: <span className={forecast.percentageSavings >= 10 ? 'text-emerald-600' : forecast.percentageSavings >= 5 ? 'text-amber-600' : 'text-slate-600'}>+{forecast.percentageSavings}% Net Freight Gain</span>
          </span>
        </div>
      </div>

    </div>
  );
}
