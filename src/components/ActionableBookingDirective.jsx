import React from 'react';
import { Clock, ShieldAlert, CheckCircle2, ArrowRight, TrendingUp, AlertTriangle, FileText, Zap, DollarSign, Calendar, Sparkles, Radio, Target, Lock, Ship, Navigation } from 'lucide-react';
import InsightBulb from './InsightBulb';
import { formatDynamicDateRange, formatSingleDate } from '../utils/forecastingEngine';

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
    coaBookingWindow: formatDynamicDateRange(0, 7),
    coaFirstLaycanWindow: formatDynamicDateRange(7, 12),
    coaArrivalEta: formatDynamicDateRange(14, 18),
    spotDipWindow: formatDynamicDateRange(28, 35),
    spotArrivalEta: formatDynamicDateRange(45, 52),
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
    <div className={`rounded-xl border p-5 shadow-sm text-slate-900 mb-6 transition-all duration-300 ${
      isCritical 
        ? 'bg-white border-2 border-rose-300'
        : isLull
        ? 'bg-white border-2 border-emerald-300'
        : 'bg-white border-2 border-slate-200'
    }`}>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
            isCritical ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
          }`}>
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
                isCritical ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                Route-Parameterized Day-of-Booking Directive
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center font-bold">
                <Target className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                {sched.distanceNM.toLocaleString()} NM • {sched.sailingDays} Sailing Days
              </span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 mt-0.5 flex items-center space-x-2">
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
            <div className="text-[10px] text-slate-500 font-medium">Projected Value Arbitrage</div>
            <div className={`text-sm font-black ${isLull ? 'text-indigo-700' : 'text-emerald-700'}`}>
              {formattedSavings} ({pctSavings}%)
            </div>
          </div>
        </div>
      </div>

      {/* DUAL-TRACK DAY OF BOOKING CALENDAR BAR (FULLY PARAMETERIZED) */}
      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        
        {/* Track 1: COA Window */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider block">
              1. Day of Booking for Base COA ({coaSplitPercent}%)
            </span>
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{sched.coaBookingWindow}</span>
              <span className="text-slate-500 font-normal">({coaVolumeMT.toLocaleString()} MT at ${coaRate.toFixed(2)}/MT)</span>
            </div>
            <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
              First Laycan: {sched.coaFirstLaycanWindow} ➔ ETA: {sched.coaArrivalEta}
            </span>
          </div>
        </div>

        {/* Track 2: Spot Sniping Window */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
            <Target className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-amber-800 tracking-wider block">
              2. Day of Booking for Spot Sniping ({spotSplitPercent}%)
            </span>
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{sched.spotDipWindow}</span>
              <span className="text-slate-500 font-normal">({spotVolumeMT.toLocaleString()} MT at ${sched.spotDipRateUSD}/MT dip)</span>
            </div>
            <span className="text-[10px] text-amber-700 block mt-0.5 font-medium">
              Target ETA at {destName}: {sched.spotArrivalEta} (Saved: ₹{sched.spotDipSavingsINR} Cr)
            </span>
          </div>
        </div>

      </div>

      {/* 3 Core Output Cards: WHEN, HOW, CONSEQUENCES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        
        {/* CARD 1: WHEN TO BOOK */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-700 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">1. When to Book</span>
            </div>
            
            <div className={`rounded-md p-2.5 mb-3 border ${
              isCritical ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5 opacity-80">Primary Route Execution Window</span>
              <div className="text-xs font-black flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{sched.coaBookingWindow}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Execute Track 1 Promptly:</strong> Lock the {coaSplitPercent}% baseload ({coaVolumeMT.toLocaleString()} MT) in the <strong className="text-slate-900">{sched.coaBookingWindow}</strong> window for {sched.sailingDays} days transit. Hold the remaining {spotSplitPercent}% ({spotVolumeMT.toLocaleString()} MT) until the <strong className="text-amber-700">{sched.spotDipWindow}</strong> dip.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Route Transit Time:</span>
            <span className="font-bold text-slate-900">
              {sched.sailingDays}d sea + {sched.portDischargeDays}d unloader
            </span>
          </div>
        </div>

        {/* CARD 2: HOW TO BOOK */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-blue-700 mb-2">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">2. How to Book</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 mb-3">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest block mb-0.5">Execution Allocation</span>
              <div className="text-xs font-bold text-blue-900">
                {coaSplitPercent}% COA Fixed + {spotSplitPercent}% Spot Sniping
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Fix <strong className="text-slate-900">{coaVolumeMT.toLocaleString()} MT</strong> on {contractHorizonMonths}-Month COA at ${coaRate.toFixed(2)}/MT. Schedule the remaining <strong className="text-slate-900">{spotVolumeMT.toLocaleString()} MT</strong> for spot fixture during the <strong className="text-amber-700">{sched.spotDipWindow}</strong> valley.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Vessel Type:</span>
            <span className="font-bold text-slate-900">{vesselName} ({cargoVolumeMT.toLocaleString()} MT)</span>
          </div>
        </div>

        {/* CARD 3: CONSEQUENCES OF DELAY */}
        <div className="bg-slate-50/70 border border-rose-200 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-rose-700 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">3. Consequences of Delay</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-md p-2.5 mb-3">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-widest block mb-0.5">Penalty If Unhedged</span>
              <div className="text-xs font-bold text-rose-900">
                +${(projectedSpot - coaRate).toFixed(2)}/MT Spot Premium Penalty
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Delaying the base COA fixture past {sched.coaBookingWindow.split('–')[1] || formatSingleDate(7)} exposes the entire {cargoVolumeMT.toLocaleString()} MT volume on {originName} to spot surges (${projectedSpot.toFixed(2)}/MT) and unloader delays.
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>Risk Exposure:</span>
            <span className="font-bold text-rose-700">{isLull ? 'Low Volatility' : 'Spot Surge + Demurrage'}</span>
          </div>
        </div>

      </div>

      {/* Dynamic Summary Strip */}
      <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Route Context:</strong> {originName} ➔ {destName} ({sched.distanceNM.toLocaleString()} NM, {sched.totalVoyageDays} days round-trip turnaround)
          </span>
        </div>
        <div className="text-emerald-700 font-bold shrink-0">
          Calendar Dates: Parameterized to Route & Vessel
        </div>
      </div>

    </div>
  );
}
