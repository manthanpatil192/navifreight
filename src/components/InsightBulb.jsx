import React, { useState } from 'react';
import { Lightbulb, X, Sparkles, Database, ArrowRight, ShieldCheck } from 'lucide-react';

export default function InsightBulb({
  title = "Phase Insight",
  subtitle = "How this module works",
  dataset = "Shanghai Shipping Exchange (SSE)",
  logic = "Extracts daily spot proxies and applies machine learning to forecast forward rates.",
  impact = "Reduces logistics procurement costs and eliminates spot market volatility.",
  position = "right"
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      
      {/* Interactive Glowing Bulb Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="group relative flex items-center justify-center p-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-600 transition-all shadow-xs"
        title="Click for System Insight & AI Logic"
      >
        <Lightbulb className="w-3.5 h-3.5 fill-amber-400 text-amber-600 group-hover:scale-110 transition-transform" />
        <span className="sr-only">System Insight</span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute z-50 top-6 ${
            position === 'left' ? 'right-0' : 'left-0'
          } w-80 sm:w-96 bg-white border border-slate-200 rounded-xl shadow-elevated p-4 text-xs animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-2 border-b border-slate-100 mb-2.5">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Lightbulb className="w-3.5 h-3.5 fill-white text-white" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-tight">{title}</h4>
                <p className="text-[10px] text-slate-400">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-2 text-slate-600 text-[11px] leading-relaxed">
            
            {/* 1. Underlying Logic */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider mb-1 flex items-center">
                <Sparkles className="w-3 h-3 text-amber-500 mr-1" />
                System Logic & Methodology:
              </span>
              <p>{logic}</p>
            </div>

            {/* 2. Free Public Dataset */}
            {dataset && (
              <div className="flex items-center space-x-2 text-[10px] bg-emerald-50 text-emerald-800 px-2 py-1.5 rounded border border-emerald-200">
                <Database className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>
                  <strong className="font-semibold">Dataset Ingested:</strong> {dataset}
                </span>
              </div>
            )}

            {/* 3. Business / Operational Impact */}
            {impact && (
              <div className="text-[10px] text-slate-500 pt-1 flex items-start space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-maritime-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-700">Operational Value:</strong> {impact}
                </span>
              </div>
            )}

          </div>

          {/* Footer note */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400">
            <span>NaviFreight AI Logic Framework</span>
            <span className="text-amber-600 font-semibold">100% Free Open Data</span>
          </div>
        </div>
      )}

    </div>
  );
}
