import React from 'react';
import MarketIntelligenceRadar from '../components/MarketIntelligenceRadar';
import { Activity, ShieldAlert, Radio, Database, Globe } from 'lucide-react';

export default function MarketVolatilityPage({
  activeNewsSignal,
  setActiveNewsSignal,
  currency,
  onOpenDatasets
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Early Warning System</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Market Volatility & Early Disruption Radar
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            4-Stage AI pipeline (GDELT + FinBERT + Zero-Shot + LexRank) analyzing real-time global news, weather shocks, and geopolitical chokepoints.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Live RSS & NLP Feed: Synchronized</span>
          </span>
        </div>
      </div>

      {/* 4-Stage AI Market Intelligence & Disruption Radar */}
      <MarketIntelligenceRadar
        activeNewsSignal={activeNewsSignal}
        onSelectNewsSignal={(signal) => setActiveNewsSignal(signal)}
        currency={currency}
      />

    </div>
  );
}
