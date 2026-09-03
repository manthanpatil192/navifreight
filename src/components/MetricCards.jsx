import React from 'react';
import { TrendingUp, ShieldCheck, AlertTriangle, IndianRupee, DollarSign, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatUSD, formatINR } from '../utils/financialCalculators';

export default function MetricCards({ forecast, currency, portCongestion }) {
  const isINR = currency === 'INR';
  const spotRateDisplay = isINR 
    ? `₹${(forecast.projectedSpotRateUSD * 86.5).toFixed(0)} /MT`
    : `$${forecast.projectedSpotRateUSD.toFixed(2)} /MT`;

  const coaRateDisplay = isINR
    ? `₹${(forecast.coaRateUSD * 86.5).toFixed(0)} /MT`
    : `$${forecast.coaRateUSD.toFixed(2)} /MT`;

  const savingsDisplay = isINR
    ? formatINR(forecast.netSavingsINR)
    : formatUSD(forecast.netSavingsUSD);

  const congestion = portCongestion || { congestionStatus: 'LOW', avgAnchorageWaitDays: 2.1 };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Predicted Freight Rate Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Predicted Freight Rate</span>
          <span className="inline-flex items-center text-maritime-700 bg-maritime-50 px-2 py-0.5 rounded text-[11px] font-bold">
            {forecast.destination.name.split(' ')[0]}
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {spotRateDisplay}
          </span>
          <span className="text-xs font-semibold text-rose-600 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            Spot +{forecast.percentageSavings}%
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>COA Multi-Voyage Target:</span>
          <span className="font-semibold text-emerald-700">{coaRateDisplay}</span>
        </div>
      </div>

      {/* 2. Forecast ML Accuracy Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Forward 30-Day Error (MAPE)</span>
          <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200">
            <ShieldCheck className="w-3 h-3" />
            <span>89.9% 90%CI</span>
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            15.5%
          </span>
          <span className="text-xs font-medium text-slate-500">
            MAPE (BDRY Benchmark)
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Entry Timing Resolution:</span>
          <span className="font-semibold text-emerald-800">Calibrated P10–P90 Risk Cones</span>
        </div>
      </div>

      {/* 3. Port & Weather Risk Level Card */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Demurrage & Weather Risk</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
            congestion.congestionStatus === 'HIGH' 
              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
              : congestion.congestionStatus === 'MODERATE'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {congestion.congestionStatus}
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {congestion.avgAnchorageWaitDays} Days
          </span>
          <span className="text-xs font-medium text-slate-500">
            Avg Turnaround
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>IMD Cyclone Status:</span>
          <span className="font-semibold text-slate-800 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Bay of Bengal Clear</span>
          </span>
        </div>
      </div>

      {/* 4. Multi-Voyage Contract Potential Savings */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-subtle hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Potential COA Savings</span>
          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold">
            +{forecast.percentageSavings}% Gain
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">
            {savingsDisplay}
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Charter Strategy:</span>
          <span className="font-semibold text-maritime-800">{forecast.recommendationBadge}</span>
        </div>
      </div>

    </div>
  );
}
