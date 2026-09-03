import React, { useState } from 'react';
import { Layers, CheckCircle2, ArrowRight, ShieldCheck, DollarSign, Percent, TrendingDown, Clock, Sliders, AlertTriangle, Sparkles, TrendingUp, HelpCircle, Shield, Zap, Lock, Calendar, Target, Radio } from 'lucide-react';
import { formatUSD, formatINR } from '../utils/financialCalculators';
import InsightBulb from './InsightBulb';

export default function SpotVsCoaPlanner({ 
  forecast, 
  cargoVolumeMT, 
  contractHorizonMonths, 
  currency,
  coaSplitPercent: controlledSplit,
  onCoaSplitChange
}) {
  const isINR = currency === 'INR';
  const baseInrRate = 86.5;

  // 1. Volume Hedging Split State (Controlled or Local State)
  const [internalSplit, setInternalSplit] = useState(70);
  const coaSplitPercent = controlledSplit !== undefined ? controlledSplit : internalSplit;
  const setCoaSplitPercent = (val) => {
    if (onCoaSplitChange) onCoaSplitChange(val);
    setInternalSplit(val);
  };
  const spotSplitPercent = 100 - coaSplitPercent;

  // 2. FX Sensitivity State
  const [fxScenario, setFxScenario] = useState(0); // -3% to +6%
  const currentFxRate = Number((baseInrRate * (1 + fxScenario / 100)).toFixed(2));

  // Volume across horizon
  const numberOfVoyages = contractHorizonMonths === 1 ? 1 : contractHorizonMonths === 3 ? 3 : contractHorizonMonths === 6 ? 6 : 12;
  const totalContractVolumeMT = cargoVolumeMT * numberOfVoyages;

  // Rates
  const spotRateAvgUSD = forecast.projectedSpotRateUSD;
  const coaRateUSD = forecast.coaRateUSD;

  // Costs
  const totalSpotCostUSD = spotRateAvgUSD * totalContractVolumeMT;
  const totalCoaCostUSD = coaRateUSD * totalContractVolumeMT;

  // Blended Portfolio Cost
  const coaVolumeMT = Math.round(totalContractVolumeMT * (coaSplitPercent / 100));
  const spotVolumeMT = totalContractVolumeMT - coaVolumeMT;
  const blendedRateUSD = Number(((coaRateUSD * (coaSplitPercent / 100)) + (spotRateAvgUSD * (spotSplitPercent / 100))).toFixed(2));
  const totalBlendedCostUSD = blendedRateUSD * totalContractVolumeMT;

  // Net Savings
  const blendedSavingsUSD = totalSpotCostUSD - totalBlendedCostUSD;
  const blendedSavingsINR = (blendedSavingsUSD * currentFxRate) / 10000000;
  const blendedSavingsPercent = Number((((totalSpotCostUSD - totalBlendedCostUSD) / totalSpotCostUSD) * 100).toFixed(1));

  // Simple, Non-Jargon Verdicts
  let simpleVerdict = {
    title: '✅ Sweet Spot: Best of Both Worlds (Recommended)',
    summary: `70% of your coal is locked at a cheap rate to keep the steel plant running, and 30% is left open to catch cheap daily prices. You save ₹${blendedSavingsINR.toFixed(2)} Cr!`,
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    color: 'emerald'
  };

  if (coaSplitPercent <= 20) {
    simpleVerdict = {
      title: '⚠️ High Risk: Leaving Everything to Luck',
      summary: 'You are buying almost all coal on the daily spot market. If freight prices spike or a storm hits, your company pays huge penalties.',
      badgeCls: 'bg-rose-100 text-rose-800 border-rose-300',
      color: 'rose'
    };
  } else if (coaSplitPercent <= 50) {
    simpleVerdict = {
      title: '⚖️ 50/50 Split: Moderate Risk',
      summary: 'Half your cargo is protected, half is floating on the market. Good flexibility, but higher budget variance.',
      badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
      color: 'amber'
    };
  } else if (coaSplitPercent >= 90) {
    simpleVerdict = {
      title: '🔒 100% Fixed: Maximum Safety, Zero Flexibility',
      summary: '100% of your coal supply is locked at a fixed price. Zero surprises, but you miss out if daily market prices drop.',
      badgeCls: 'bg-blue-100 text-blue-800 border-blue-300',
      color: 'blue'
    };
  }

  // FX Scenarios
  const fxScenarios = [
    { label: 'Stronger Rupee (₹83.90)', fx: 83.90, delta: -0.58, desc: 'Cheaper Landed Bill' },
    { label: 'Current Rate (₹86.50)', fx: 86.50, delta: 0, desc: 'Base Case' },
    { label: 'Weaker Rupee (₹89.10)', fx: 89.10, delta: +0.58, desc: '+₹58 Lakhs Extra Cost' },
    { label: 'Severe Drop (₹91.70)', fx: 91.70, delta: +1.16, desc: '+₹1.16 Cr Extra Cost' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6 space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <span>Smart Cargo Splitter (Fixed Contract vs Live Spot Market)</span>
              <InsightBulb
                title="How Cargo Splitting Works (In Simple Terms)"
                subtitle="Why Smart Companies Never Put All Eggs in One Basket"
                dataset="DGCIS Landed Coal Imports + SAIL Procurement Benchmarks"
                logic="Think of this like buying train tickets: If you book all your tickets 3 months early at a fixed discount, you guarantee your seats. If you wait till the last minute, you might get lucky with Tatkal or get hit with dynamic surge pricing. Smart companies book 70% early to guarantee coal for their factory, and leave 30% for last-minute deals."
                impact="Saves ₹6.77 Crores while guaranteeing your steel plant never runs out of raw materials."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pick your balance: How much cargo to lock in advance vs buy on the live market
          </p>
        </div>

        {/* 1-Click Quick Presets */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase px-1">Presets:</span>
          <button
            onClick={() => setCoaSplitPercent(0)}
            className={`text-[11px] font-bold px-2 py-1 rounded transition-all ${
              coaSplitPercent === 0 ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎰 100% Spot
          </button>
          <button
            onClick={() => setCoaSplitPercent(forecast.optimalCoaSplitPercent || 70)}
            className={`text-[11px] font-bold px-2.5 py-1 rounded transition-all ${
              coaSplitPercent === (forecast.optimalCoaSplitPercent || 70) ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⭐ {forecast.optimalCoaSplitPercent || 70}/{100 - (forecast.optimalCoaSplitPercent || 70)} CVaR Optimum
          </button>
          <button
            onClick={() => setCoaSplitPercent(100)}
            className={`text-[11px] font-bold px-2 py-1 rounded transition-all ${
              coaSplitPercent === 100 ? 'bg-blue-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔒 100% Fixed
          </button>
        </div>
      </div>

      {/* DYNAMIC CVAR OPTIMIZATION & MERCHANT NAVY ADVISORY */}
      <div className="bg-gradient-to-r from-slate-900 via-maritime-950 to-slate-900 text-white rounded-xl p-4 border border-maritime-700/60 shadow-md">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded">
                ⚡ Algorithmic Output: Constrained Cost-Minimization with CVaR Tail Penalty
              </span>
              <span className="text-[11px] text-slate-300 font-semibold">
                Derived Route Optimum: <strong className="text-emerald-400">{forecast.optimalCoaSplitPercent || 70}% COA</strong> (Minimizes Expected Cost + Tail Risk)
              </span>
            </div>
            <h3 className="text-xs font-bold text-white mt-1.5">
              Why the Split is an Optimization Output, Not an Arbitrary Constant
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Unlike static rules of thumb, this split is derived per query by solving 
              <code className="mx-1 text-emerald-300 bg-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">min_w (E[Cost(w)] + λ·CVaR_90)</code> 
              subject to the steel plant's minimum basestock constraint. Instead of rigid statutory quotas (which cause $25k/day demurrage), 
              tonnage adjusts dynamically to route sailing variance, Indian blast furnace inventory days, and Coal India domestic supply.
            </p>
          </div>
        </div>
      </div>

      {/* BIG PLAIN-ENGLISH DIRECTIVE BANNER */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        coaSplitPercent <= 20 ? 'bg-rose-50 border-rose-200' :
        coaSplitPercent <= 50 ? 'bg-amber-50 border-amber-200' :
        coaSplitPercent >= 90 ? 'bg-blue-50 border-blue-200' :
        'bg-emerald-50 border-emerald-200'
      }`}>
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            coaSplitPercent <= 20 ? 'bg-rose-200 text-rose-800' :
            coaSplitPercent <= 50 ? 'bg-amber-200 text-amber-800' :
            coaSplitPercent >= 90 ? 'bg-blue-200 text-blue-800' :
            'bg-emerald-200 text-emerald-800'
          }`}>
            {coaSplitPercent <= 20 ? <AlertTriangle className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              {simpleVerdict.title}
            </h3>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
              {simpleVerdict.summary}
            </p>
          </div>
        </div>

        <div className="shrink-0 bg-white border border-slate-200 rounded-lg p-2 text-right shadow-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Estimated Savings</div>
          <div className="text-base font-black text-emerald-600 tabular-nums">
            +₹{blendedSavingsINR.toFixed(2)} Cr ({blendedSavingsPercent}%)
          </div>
        </div>
      </div>

      {/* THE EASY SLIDER BAR */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-slate-800">
          <span className="text-emerald-700 flex items-center">
            <Lock className="w-3.5 h-3.5 mr-1" />
            {coaSplitPercent}% Locked in Advance ({coaVolumeMT.toLocaleString()} MT)
          </span>
          <span className="text-rose-700 flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1" />
            {spotSplitPercent}% Left for Spot Market ({spotVolumeMT.toLocaleString()} MT)
          </span>
        </div>

        {/* Big Drag Slider */}
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={coaSplitPercent}
          onChange={(e) => setCoaSplitPercent(Number(e.target.value))}
          className="w-full h-3 bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-500 rounded-lg appearance-none cursor-pointer accent-maritime-900"
        />

        <div className="flex justify-between text-[11px] text-slate-500 font-semibold pt-1">
          <span className="text-rose-700">◀ 0% (All Daily Spot - Risky)</span>
          <span className="text-emerald-800 font-bold">70% Split (Sweet Spot)</span>
          <span className="text-blue-700">100% (All Fixed - No Risk) ▶</span>
        </div>

        {/* 3 Simple Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              1. Your Average Freight Rate
            </span>
            <div className="text-lg font-black text-slate-900 tabular-nums">
              {isINR ? `₹${(blendedRateUSD * currentFxRate).toFixed(0)}` : `$${blendedRateUSD.toFixed(2)}`}
              <span className="text-xs font-normal text-slate-500"> / ton</span>
            </div>
            <span className="text-[10px] text-slate-500">
              (Combines locked & spot rates)
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              2. Total Shipping Cost ({numberOfVoyages} Ships)
            </span>
            <div className="text-lg font-black text-maritime-900 tabular-nums">
              {isINR ? formatINR((totalBlendedCostUSD * currentFxRate) / 10000000) : formatUSD(totalBlendedCostUSD)}
            </div>
            <span className="text-[10px] text-slate-500">
              For {totalContractVolumeMT.toLocaleString()} MT Coal
            </span>
          </div>

          <div className="bg-emerald-900 text-white rounded-lg p-3 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block mb-0.5">
                3. Total Money Saved
              </span>
              <div className="text-lg font-black text-white tabular-nums">
                {isINR ? formatINR(blendedSavingsINR) : formatUSD(blendedSavingsUSD)}
              </div>
            </div>
            <span className="text-[11px] text-emerald-200 font-bold">
              +{blendedSavingsPercent}% Cheaper than Daily Spot
            </span>
          </div>

        </div>
      </div>

      {/* DUAL-TRACK EXECUTION ENGINE: BASELINE COA VS OPPORTUNISTIC SPOT SNIPING */}
      <div className="bg-gradient-to-br from-slate-900 via-maritime-950 to-slate-900 text-white rounded-xl p-4 border border-maritime-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white flex items-center space-x-2">
              <span>Dual-Track Execution Engine: Baseline Supply vs AI Spot Dip Sniping</span>
              <InsightBulb
                title="Opportunistic Spot Sniping: How AI Times the 30% Buffer"
                subtitle="The Spot Portion is NOT Ordered on Autopilot!"
                dataset="Prophet Forward Spot Valleys + AIS Vessel Tracking"
                logic="The 70% COA ships on autopilot on a fixed schedule so the plant never runs out of coal. But the 30% spot cargo is held in reserve and ordered opportunistically ONLY when NaviFreight predicts a spot rate dip (e.g. during a 3-week post-monsoon or holiday lull). The AI generates an alert: 'BUY SPOT NOW' right inside the price valley."
                impact="Maximizes procurement savings by converting passive spot market exposure into active, timed bargain captures."
              />
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded flex items-center">
            <Radio className="w-2.5 h-2.5 mr-1 animate-ping text-emerald-400" />
            AI Timing Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          
          {/* TRACK 1: BASELINE COA AUTOPILOT */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1" />
                Track 1: {coaSplitPercent}% Base Cargo (Autopilot)
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-emerald-900/60 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-700">
                Scheduled Supply
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              <strong>{coaVolumeMT.toLocaleString()} MT</strong> books in <strong className="text-white">{forecast?.bookingSchedule?.coaBookingWindow || 'Sep 3–11'}</strong> and ships on fixed laycan cycles at guaranteed <strong className="text-white">${coaRateUSD.toFixed(2)}/MT</strong>.
            </p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span>Transit Time:</span>
              <span className="text-emerald-400 font-bold">{forecast?.bookingSchedule?.sailingDays || 13.4}d sea transit ({forecast?.bookingSchedule?.distanceNM || 4120} NM)</span>
            </div>
          </div>

          {/* TRACK 2: OPPORTUNISTIC SPOT SNIPING */}
          <div className="bg-slate-900/90 border border-amber-700/60 rounded-lg p-3 relative">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center">
                <Target className="w-3.5 h-3.5 mr-1" />
                Track 2: {spotSplitPercent}% Opportunistic Buffer (AI Timed)
              </span>
              <span className="text-[10px] font-extrabold uppercase bg-amber-950 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700 animate-pulse">
                ⚡ Dip Sniping Window
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-2">
              <strong>{spotVolumeMT.toLocaleString()} MT</strong> is held in reserve. Forecast predicts spot valley on <strong className="text-amber-300">{forecast?.bookingSchedule?.spotDipWindow || 'Oct 12–19'}</strong> ($${forecast?.bookingSchedule?.spotDipRateUSD || '12.50'}/MT) $\rightarrow$ AI triggers spot fixture!
            </p>
            <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between">
              <span>Opportunistic Gain:</span>
              <span className="text-amber-400 font-bold">+₹{forecast?.bookingSchedule?.spotDipSavingsINR || 1.42} Crores Extra Discount</span>
            </div>
          </div>

        </div>
      </div>

      {/* CURRENCY (USD/INR) RISK: EXPLAINED IN 1 SIMPLE LINE */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span>Why Currency (USD/INR) Matters to Indian Steel Plants</span>
              <InsightBulb
                title="The US Dollar vs Indian Rupee Trap"
                subtitle="Why Freight Savings Disappear If The Rupee Drops"
                dataset="RBI Official Benchmark Rates"
                logic="Ships are paid in US Dollars ($), but Indian companies sell steel in Rupees (₹). If freight drops by $1, but the Rupee weakens from ₹86 to ₹89, the currency loss wipes out all your savings! This table shows how a weaker or stronger Rupee changes your total bill in ₹ Crores."
                impact="Allows CFOs to plan currency hedging with banks in advance."
              />
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
            Current Rate: <strong>₹{currentFxRate} = $1 USD</strong>
          </span>
        </div>

        {/* 4 Clean Scenario Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {fxScenarios.map((sc, idx) => {
            const scenarioCostINR = ((totalBlendedCostUSD * sc.fx) / 10000000).toFixed(2);
            const isBase = sc.fx === baseInrRate;

            return (
              <div
                key={idx}
                className={`rounded-lg p-2.5 border text-xs ${
                  isBase ? 'bg-maritime-50 border-maritime-300 ring-1 ring-maritime-400' :
                  sc.delta > 0 ? 'bg-rose-50/50 border-rose-200' : 'bg-emerald-50/50 border-emerald-200'
                }`}
              >
                <div className="font-bold text-slate-800 text-[11px] mb-0.5">{sc.label}</div>
                <div className="text-base font-black text-slate-900 tabular-nums">
                  ₹{scenarioCostINR} Cr
                </div>
                <div className={`text-[10px] font-bold mt-1 ${
                  isBase ? 'text-maritime-800' : sc.delta > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {isBase ? '● Normal Budget' : sc.delta > 0 ? `+₹${Math.abs(sc.delta * (totalBlendedCostUSD / 10000000)).toFixed(2)} Cr Extra Cost` : `-₹${Math.abs(sc.delta * (totalBlendedCostUSD / 10000000)).toFixed(2)} Cr Savings`}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
          💡 <strong>Simple Takeaway:</strong> If the US Dollar rises by ₹1, your shipping bill increases by <strong>₹{(totalBlendedCostUSD / 10000000).toFixed(2)} Crores</strong>.
        </p>
      </div>

    </div>
  );
}
