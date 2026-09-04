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

          {/* Currency Switcher */}
          <div className="flex items-center space-x-3">
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
          </div>

        </div>
      </div>
    </header>
  );
}
