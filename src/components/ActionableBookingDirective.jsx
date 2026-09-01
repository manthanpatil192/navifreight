import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, TrendingUp, AlertTriangle, FileText, Zap, DollarSign, Calendar, Sparkles, Radio, Target, Lock, Ship, Navigation } from 'lucide-react';
import InsightBulb from './InsightBulb';

/**
 * Actionable AI Booking Directive component
 * Fully parameterized by selected Origin, Destination, Vessel Class, Cargo Tonnage, and News Catalysts:
 * 1. Dynamic Route-Specific Day of Booking Schedule for COA and Spot Buffer
 * 2. Nautical Lead-Time & Laycan Transit Breakdown
 * 3. Financial Consequences of Delay
 */
export default function ActionableBookingDirective({
  selectedOrigin,
  selectedDestination,
  selectedVessel,
  cargoVolumeMT,
  contractHorizonMonths,
  forecast,
  currency,
  activeNewsSignal,
  coaSplitPercent = 70
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

  // Split calculations
  const spotSplitPercent = 100 - coaSplitPercent;
  const coaVolumeMT = Math.round(cargoVolumeMT * (coaSplitPercent / 100));
  const spotVolumeMT = cargoVolumeMT - coaVolumeMT;

  // Dynamic Route-Parameterized Booking Schedule from Forecast Engine
  const sched = forecast?.bookingSchedule || {
    coaBookingWindow: 'Sep 3 – Sep 11, 2026',
    coaFirstLaycanWindow: 'Sep 16 – Sep 21, 2026',
    coaArrivalEta: 'Sep 23 – Sep 27, 2026',
    spotDipWindow: 'Oct 12 – Oct 19, 2026',
    spotArrivalEta: 'Nov 02 – Nov 09, 2026',
    spotDipRateUSD: 12.50,
    spotDipSavingsINR: 1.42,
    sailingDays: 13.4,
    portDischargeDays: 3.3,
    totalVoyageDays: 18.7,
    distanceNM: 4120
  };

  const currentNews = activeNewsSignal || forecast?.activeNewsSignal;
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
                Route-Parameterized Day-of-Booking Directive
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center">
                <Target className="w-2.5 h-2.5 mr-1 text-emerald-400" />
                {sched.distanceNM.toLocaleString()} NM • {sched.sailingDays} Sailing Days
              </span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5 flex items-center space-x-2">
              <span>Dynamic Charter Booking Advisory for {originName} ➔ {destName}</span>
              <InsightBulb
                title="Fully Parameterized Day-of-Booking Intelligence"
                subtitle="Nautical Distance & Route-Specific Lead Time Engine"
                dataset="Port Distances (NM) + Vessel Speeds + Prophet Forward Price Valleys"
                logic="Booking dates are computed dynamically for each specific route. Short routes (e.g. Indonesia ~7 sailing days) require tight 3-day booking windows and earlier spot dip targets (Sep 18–25), while long routes (e.g. Australia/USA ~14–35 sailing days) require longer advance lead times (Sep 3–11) and later dip windows (Oct 12–19)."
                impact="Guarantees exact, nautical-distance-accurate calendar booking windows for every global origin and vessel pairing."
              />
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Projected Value Arbitrage</div>
            <div className={`text-sm font-black ${isLull ? 'text-blue-300' : 'text-emerald-400'}`}>
              {formattedSavings} ({pctSavings}%)
            </div>
          </div>
        </div>
      </div>

      {/* DUAL-TRACK DAY OF BOOKING CALENDAR BAR (FULLY PARAMETERIZED) */}
      <div className="mt-3 bg-slate-950/90 border border-slate-800 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Track 1: COA Window */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-900/60 border border-emerald-700 flex items-center justify-center shrink-0 text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-300 tracking-wider block">
              1. Day of Booking for Base COA ({coaSplitPercent}%)
            </span>
            <div className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>{sched.coaBookingWindow}</span>
              <span className="text-slate-400 font-normal">({coaVolumeMT.toLocaleString()} MT at ${coaRate.toFixed(2)}/MT)</span>
            </div>
            <span className="text-[10px] text-emerald-400/80 block mt-0.5">
              First Laycan: {sched.coaFirstLaycanWindow} ➔ ETA: {sched.coaArrivalEta}
            </span>
          </div>
        </div>

        {/* Track 2: Spot Sniping Window */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-900/60 border border-amber-700 flex items-center justify-center shrink-0 text-amber-400">
            <Target className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-300 tracking-wider block">
              2. Day of Booking for Spot Sniping ({spotSplitPercent}%)
            </span>
            <div className="text-xs font-bold text-white flex items-center space-x-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{sched.spotDipWindow}</span>
              <span className="text-slate-400 font-normal">({spotVolumeMT.toLocaleString()} MT at ${sched.spotDipRateUSD}/MT dip)</span>
            </div>
            <span className="text-[10px] text-amber-300/80 block mt-0.5">
              Target ETA at {destName}: {sched.spotArrivalEta} (Saved: ₹{sched.spotDipSavingsINR} Cr)
            </span>
          </div>
        </div>

      </div>

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
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5 opacity-80">Primary Route Execution Window</span>
              <div className="text-xs font-black flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{sched.coaBookingWindow}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">Execute Track 1 Promptly:</strong> Lock the {coaSplitPercent}% baseload ({coaVolumeMT.toLocaleString()} MT) in the <strong className="text-white">{sched.coaBookingWindow}</strong> window for {sched.sailingDays} days transit. Hold the remaining {spotSplitPercent}% ({spotVolumeMT.toLocaleString()} MT) until the <strong className="text-amber-300">{sched.spotDipWindow}</strong> dip.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Route Transit Time:</span>
            <span className="font-bold text-white">
              {sched.sailingDays}d sea + {sched.portDischargeDays}d unloader
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
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-0.5">Execution Allocation</span>
              <div className="text-xs font-bold text-white">
                {coaSplitPercent}% COA Fixed + {spotSplitPercent}% Spot Sniping
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Fix <strong className="text-white">{coaVolumeMT.toLocaleString()} MT</strong> on {contractHorizonMonths}-Month COA at ${coaRate.toFixed(2)}/MT. Schedule the remaining <strong className="text-white">{spotVolumeMT.toLocaleString()} MT</strong> for spot fixture during the <strong className="text-amber-300">{sched.spotDipWindow}</strong> valley.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Vessel Type:</span>
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
              <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest block mb-0.5">Penalty If Unhedged</span>
              <div className="text-xs font-bold text-rose-200">
                +${(projectedSpot - coaRate).toFixed(2)}/MT Spot Premium Penalty
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Delaying the base COA fixture past {sched.coaBookingWindow.split('–')[1] || 'Sep 15'} exposes the entire {cargoVolumeMT.toLocaleString()} MT volume on {originName} to spot surges (${projectedSpot.toFixed(2)}/MT) and unloader delays.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Risk Exposure:</span>
            <span className="font-bold text-rose-400">{isLull ? 'Low Volatility' : 'Spot Surge + Demurrage'}</span>
          </div>
        </div>

      </div>

      {/* Dynamic Summary Strip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong className="text-white">Route Context:</strong> {originName} ➔ {destName} ({sched.distanceNM.toLocaleString()} NM, {sched.totalVoyageDays} days round-trip turnaround)
          </span>
        </div>
        <div className="text-emerald-400 font-bold shrink-0">
          Calendar Dates: Parameterized to Route & Vessel
        </div>
      </div>

    </div>
  );
}
