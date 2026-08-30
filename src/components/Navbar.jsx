import React from 'react';
import { Ship, Activity, Database, Download, ShieldCheck, Clock, ExternalLink } from 'lucide-react';

export default function Navbar({ onOpenDatasets, currency, setCurrency, onExportReport }) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-maritime-900 flex items-center justify-center text-white shadow-sm">
              <Ship className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-maritime-900">NaviFreight</span>
                <span className="bg-maritime-50 text-maritime-800 text-xs font-semibold px-2 py-0.5 rounded border border-maritime-200">
                  AI PROTOTYPE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                East Coast India Bulk Freight Forecasting & Multi-Voyage Chartering Optimizer
              </p>
            </div>
          </div>

          {/* Real-time Status Badges */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600 font-medium">ML Model:</span>
              <span className="font-semibold text-slate-900">Ensemble v4.2 (94.8% Acc)</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-xs">
              <Database className="w-3.5 h-3.5 text-maritime-700" />
              <span className="text-slate-600 font-medium">Open Data:</span>
              <span className="font-semibold text-slate-900">SSE + World Bank + IMD + DGCIS</span>
            </div>
          </div>

          {/* Action Buttons & Currency Switcher */}
          <div className="flex items-center space-x-3">
            {/* Currency Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  currency === 'INR'
                    ? 'bg-white text-maritime-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  currency === 'USD'
                    ? 'bg-white text-maritime-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
            </div>

            {/* Inspect Datasets Button */}
            <button
              onClick={onOpenDatasets}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-xs font-medium rounded-md shadow-xs transition-colors"
            >
              <Database className="w-3.5 h-3.5 text-maritime-700" />
              <span className="hidden sm:inline">Datasets & ML Metrics</span>
              <span className="sm:hidden">Data</span>
            </button>

            {/* Export Report Button */}
            <button
              onClick={onExportReport}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-maritime-900 hover:bg-maritime-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Report</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
