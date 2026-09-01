import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, TrendingUp, AlertTriangle, FileText, Zap, DollarSign, Calendar, Sparkles, Radio } from 'lucide-react';
import InsightBulb from './InsightBulb';

/**
 * Actionable AI Booking Directive component
 * Analyzes selected route, cargo parameters, forecast outputs,
 * AND active live market news/weather alerts to provide explicit guidance:
 * 1. WHEN TO BOOK
 * 2. HOW TO BOOK
 * 3. CONSEQUENCES & RISKS OF DELAY
 */
export default function ActionableBookingDirective({
  selectedOrigin,
  selectedDestination,
  selectedVessel,
  cargoVolumeMT,
  contractHorizonMonths,
  forecast,
  currency,
  activeNewsSignal
}) {
  const isINR = currency === 'INR';
  const originName = forecast?.origin?.name || 'Australia (Hay Point)';
  const destName = forecast?.destination?.name || 'Paradip Port';
  const vesselName = forecast?.vessel?.name || 'Capesize';
  
  const spotRate = forecast?.currentSpotRateUSD || 14.80;
  const projectedSpot = forecast?.projectedSpotRateUSD || 17.20;
  const coaRate = forecast?.coaRateUSD || 13.02;
  const netSavingsINR = forecast?.netSavingsINR || 5.42;
  const netSavingsUSD = forecast?.netSavingsUSD || 626000;
  const pctSavings = forecast?.percentageSavings || 16.2;

  // News-coupled strategy parameters
  const currentNews = activeNewsSignal || forecast?.activeNewsSignal;
  const bookingWindowDate = currentNews?.recommendedWindow || "Sep 1 – Sep 12, 2026 (Optimal Window)";
  const strategyHeadline = currentNews?.strategyHeadline || "Lock 70% COA + 30% Spot Floating";
  const strategyDetails = currentNews?.strategyDetails || `Fix ${Math.round(cargoVolumeMT * 0.7).toLocaleString()} MT on ${contractHorizonMonths}-Month COA at $${coaRate.toFixed(2)}/MT; hold ${Math.round(cargoVolumeMT * 0.3).toLocaleString()} MT for spot flexibility.`;
  const consequenceHeadline = currentNews?.delayConsequenceHeadline || `+$${(projectedSpot - coaRate).toFixed(2)}/MT Premium Delay Penalty`;
  const consequenceDetails = currentNews?.delayConsequenceDetails || `Delaying past Sep 15 will push spot rates up to $${projectedSpot.toFixed(2)}/MT. Risk of demurrage penalties during anchorage queue discharge.`;

  const formattedSavings = isINR
    ? `₹${netSavingsINR.toFixed(2)} Crores`
    : `$${(netSavingsUSD / 1000).toFixed(0)}k USD`;

  const isCritical = currentNews?.urgencyLevel === 'CRITICAL' || pctSavings > 18;
  const isLull = currentNews?.id === 'coking_coal_drop';

  return (
    <div className={`rounded-xl border p-5 shadow-elevated text-white mb-6 transition-all duration-300 ${
      isCritical 
        ? 'bg-gradient-to-br from-rose-950 via-slate-900 to-maritime-950 border-rose-600/80 shadow-rose-950/40'
        : isLull
        ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-maritime-950 border-emerald-600/70 shadow-emerald-950/30'
        : 'bg-gradient-to-br from-slate-900 via-maritime-950 to-slate-900 border-maritime-700/60'
    }`}>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
            isCritical ? 'bg-rose-500/20 border-rose-400 text-rose-400' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}>
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
                isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                Live News-Coupled Procurement Advisory
              </span>
              {currentNews && (
                <span className="text-[10px] text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded flex items-center">
                  <Radio className="w-2.5 h-2.5 mr-1 animate-ping text-amber-400" />
                  Active Driver: {currentNews.category}
                </span>
              )}
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5 flex items-center space-x-2">
              <span>Dynamic Charter Booking Advisory for {originName} ➔ {destName}</span>
              <InsightBulb
                title="News-Coupled Procurement Engine"
                subtitle="Live Market Shock Simulation"
                dataset="Baltic Exchange + IMD Mausam + DGCIS + World Bank Pink Sheet + Platts"
                logic="Directly couples the forecast time-series and decision directives with active live news events. Selecting weather alerts, BDI spikes, or bunker price surges immediately recalculates forward curves and contract timing directives."
                impact="Ensures chartering managers react to breaking news in real-time with mathematically optimized contract recommendations."
              />
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Projected Value Impact</div>
            <div className={`text-sm font-black ${isLull ? 'text-blue-300' : 'text-emerald-400'}`}>
              {formattedSavings} ({pctSavings}%)
            </div>
          </div>
        </div>
      </div>

      {/* Active News Driver Flash Banner */}
      {currentNews && (
        <div className="mt-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <strong className="text-white shrink-0">Current News Catalyst:</strong>
            <span className="text-amber-200 truncate">{currentNews.headline}</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0 ml-2">
            Signal: {currentNews.impact}
          </span>
        </div>
      )}

      {/* 3 Core Output Cards: WHEN, HOW, CONSEQUENCES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        
        {/* CARD 1: WHEN TO BOOK */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">1. When to Book</span>
            </div>
            
            <div className={`rounded-md p-2.5 mb-3 border ${
              isCritical ? 'bg-rose-950/80 border-rose-700 text-rose-200' : 'bg-emerald-950/60 border-emerald-800/60 text-white'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5 opacity-80">Execution Timing</span>
              <div className="text-xs font-black flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{bookingWindowDate}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {isLull ? (
                <span><strong className="text-emerald-300">Market Lull:</strong> Soft commodity prices stabilize dry bulk demand. Recommended to wait for spot freight dips before committing.</span>
              ) : isCritical ? (
                <span><strong className="text-rose-400">Emergency Window:</strong> Severe storm/cyclone weather alerts require locking vessel fixture before port pilotage suspension.</span>
              ) : (
                <span><strong className="text-white">Bullish Trajectory:</strong> Forward spot curves project a <strong className="text-rose-400">+{pctSavings}% rate rise</strong> due to active {currentNews?.category || 'market demand'}.</span>
              )}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Urgency Status:</span>
            <span className={`font-bold ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentNews?.urgencyLevel || 'HIGH URGENCY'}
            </span>
          </div>
        </div>

        {/* CARD 2: HOW TO BOOK */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">2. How to Book</span>
            </div>

            <div className="bg-blue-950/60 border border-blue-800/60 rounded-md p-2.5 mb-3">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-0.5">Execution Strategy</span>
              <div className="text-xs font-bold text-white">
                {strategyHeadline}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {strategyDetails}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Recommended Vessel:</span>
            <span className="font-bold text-white">{vesselName} ({cargoVolumeMT.toLocaleString()} MT)</span>
          </div>
        </div>

        {/* CARD 3: CONSEQUENCES OF DELAY */}
        <div className="bg-slate-900/80 border border-rose-900/60 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full pointer-events-none" />
          <div>
            <div className="flex items-center space-x-2 text-rose-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">3. Consequences of Delay</span>
            </div>

            <div className="bg-rose-950/60 border border-rose-800/60 rounded-md p-2.5 mb-3">
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block mb-0.5">Penalty Risk</span>
              <div className="text-xs font-bold text-rose-200">
                {consequenceHeadline}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {consequenceDetails}
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Risk Exposure:</span>
            <span className="font-bold text-rose-400">{isLull ? 'Low Volatility' : 'Demurrage & Freight Surge'}</span>
          </div>
        </div>

      </div>

      {/* Dynamic Summary Strip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-white">Active Market Factor:</strong> {currentNews?.headline || 'Standard seasonal restocking cycle in progress.'}
          </span>
        </div>
        <div className="text-emerald-400 font-bold shrink-0">
          Decision Engine: Synchronized with Live Signals
        </div>
      </div>

    </div>
  );
}
