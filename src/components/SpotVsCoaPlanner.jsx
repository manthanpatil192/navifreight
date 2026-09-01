import React, { useState } from 'react';
import { Layers, CheckCircle2, ArrowRight, ShieldCheck, DollarSign, Percent, TrendingDown, Clock, Sliders, AlertTriangle, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { formatUSD, formatINR } from '../utils/financialCalculators';
import InsightBulb from './InsightBulb';

export default function SpotVsCoaPlanner({ forecast, cargoVolumeMT, contractHorizonMonths, currency }) {
  const isINR = currency === 'INR';
  const baseInrRate = 86.5;

  // 1. Volume Hedging Split State (Default: 70% COA / 30% Spot - Industry Benchmark)
  const [coaSplitPercent, setCoaSplitPercent] = useState(70);
  const spotSplitPercent = 100 - coaSplitPercent;

  // 2. FX Sensitivity State
  const [fxScenario, setFxScenario] = useState(0); // -4% to +8% INR depreciation
  const currentFxRate = Number((baseInrRate * (1 + fxScenario / 100)).toFixed(2));

  // Simulate total volume across the horizon
  const numberOfVoyages = contractHorizonMonths === 1 ? 1 : contractHorizonMonths === 3 ? 3 : contractHorizonMonths === 6 ? 6 : 12;
  const totalContractVolumeMT = cargoVolumeMT * numberOfVoyages;

  // Rates ($/MT)
  const spotRateAvgUSD = forecast.projectedSpotRateUSD;
  const coaRateUSD = forecast.coaRateUSD;

  // 100% Spot Cost
  const totalSpotCostUSD = spotRateAvgUSD * totalContractVolumeMT;
  // 100% COA Cost
  const totalCoaCostUSD = coaRateUSD * totalContractVolumeMT;

  // Blended Portfolio Cost based on Slider
  const coaVolumeMT = Math.round(totalContractVolumeMT * (coaSplitPercent / 100));
  const spotVolumeMT = totalContractVolumeMT - coaVolumeMT;
  const blendedRateUSD = Number(((coaRateUSD * (coaSplitPercent / 100)) + (spotRateAvgUSD * (spotSplitPercent / 100))).toFixed(2));
  const totalBlendedCostUSD = blendedRateUSD * totalContractVolumeMT;

  // Net Savings comparing Blended Portfolio vs 100% Spot
  const blendedSavingsUSD = totalSpotCostUSD - totalBlendedCostUSD;
  const blendedSavingsINR = (blendedSavingsUSD * currentFxRate) / 10000000; // in ₹ Cr
  const blendedSavingsPercent = Number((((totalSpotCostUSD - totalBlendedCostUSD) / totalSpotCostUSD) * 100).toFixed(1));

  // Risk Rating based on Split
  let riskBadge = { label: 'OPTIMAL HEDGE (Markowitz Benchmark)', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Guarantees plant feedstock supply while retaining spot flexibility for market dips.' };
  if (coaSplitPercent < 40) {
    riskBadge = { label: 'HIGH RISK / AGGRESSIVE SPOT', cls: 'bg-rose-100 text-rose-800 border-rose-300', desc: 'Heavily exposed to freight price spikes during post-monsoon restocking.' };
  } else if (coaSplitPercent < 65) {
    riskBadge = { label: 'MODERATE FLOATING HEDGE', cls: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Balanced risk, but higher procurement variance under fuel shocks.' };
  } else if (coaSplitPercent > 85) {
    riskBadge = { label: 'MAXIMUM SECURITY / ZERO SPOT PLAY', cls: 'bg-blue-100 text-blue-800 border-blue-300', desc: '100% volume protected, but forfeits potential freight rate drops.' };
  }

  // FX Sensitivity Table Data (Scenario Impact)
  const fxScenarios = [
    { label: '-3% Stronger ₹ (₹83.90)', fx: 83.90, desc: 'Landed cost drops' },
    { label: 'Current Base (₹86.50)', fx: 86.50, desc: 'Active RBI Benchmark' },
    { label: '+3% Weaker ₹ (₹89.10)', fx: 89.10, desc: 'Inflationary pressure' },
    { label: '+6% Severe Drop (₹91.70)', fx: 91.70, desc: 'Forex erosion alert' }
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6 space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 4: Dynamic Volume Hedging & FX Sensitivity Layer</span>
              <InsightBulb
                title="Dynamic Volume Hedging & Blended Freight Optimization"
                subtitle="Why 100% All-or-Nothing is a Critical Mistake"
                dataset="DGCIS Landed Values + Markowitz Portfolio Split Theory"
                logic="Real procurement desks never lock 100% COA or leave 100% to spot market. This slider simulates real-world portfolio allocation: lock 70% volume on long-term contracts to guarantee blast-furnace coal supply, while leaving 30% floating to capitalize on spot freight dips."
                impact="Eliminates catastrophic price-spike exposure while preserving multimillion-rupee market dip opportunities."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Optimize contract volume split (Spot vs COA) and stress-test landed costs against USD/INR currency swings
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-md text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Strategy: {coaSplitPercent}% COA / {spotSplitPercent}% Spot</span>
        </div>
      </div>

      {/* FEATURE 1: DYNAMIC VOLUME HEDGING SLIDER (PORTFOLIO ALLOCATOR) */}
      <div className="bg-gradient-to-r from-slate-50 via-maritime-50/40 to-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-maritime-800" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Procurement Volume Splitter (Markowitz Hedging Slider)
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${riskBadge.cls}`}>
            {riskBadge.label}
          </span>
        </div>

        {/* The Interactive Slider */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-800">
            <span className="text-emerald-700 flex items-center">
              🛡️ {coaSplitPercent}% Committed COA ({coaVolumeMT.toLocaleString()} MT)
            </span>
            <span className="text-rose-700 flex items-center">
              ⚡ {spotSplitPercent}% Floating Spot ({spotVolumeMT.toLocaleString()} MT)
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={coaSplitPercent}
            onChange={(e) => setCoaSplitPercent(Number(e.target.value))}
            className="w-full h-2.5 bg-gradient-to-r from-rose-400 via-amber-400 to-emerald-500 rounded-lg appearance-none cursor-pointer accent-maritime-900"
          />

          <div className="flex justify-between text-[10px] text-slate-600 font-semibold">
            <span>0% (100% Pure Spot - Risky)</span>
            <span className="text-emerald-800 font-bold">70% COA (Recommended Benchmark)</span>
            <span>100% (Pure COA - Rigid)</span>
          </div>
        </div>

        {/* Dynamic Blended Cost Output Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-0.5">
              Blended Landed Freight Rate
            </span>
            <div className="text-lg font-black text-slate-900 tabular-nums">
              {isINR ? `₹${(blendedRateUSD * currentFxRate).toFixed(0)}` : `$${blendedRateUSD.toFixed(2)}`}
              <span className="text-xs font-normal text-slate-500"> /MT</span>
            </div>
            <span className="text-[10px] text-slate-500">
              vs Pure Spot: <strong className="text-rose-600">${spotRateAvgUSD.toFixed(2)}</strong> | vs Pure COA: <strong className="text-emerald-600">${coaRateUSD.toFixed(2)}</strong>
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-0.5">
              Total Freight Outlay ({numberOfVoyages} Voyages)
            </span>
            <div className="text-lg font-black text-maritime-900 tabular-nums">
              {isINR ? formatINR((totalBlendedCostUSD * currentFxRate) / 10000000) : formatUSD(totalBlendedCostUSD)}
            </div>
            <span className="text-[10px] text-slate-500">
              For {totalContractVolumeMT.toLocaleString()} MT Total Cargo
            </span>
          </div>

          <div className="bg-emerald-900 text-white rounded-lg p-3 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block mb-0.5">
                Net Portfolio Savings vs 100% Spot
              </span>
              <div className="text-lg font-black text-white tabular-nums">
                {isINR ? formatINR(blendedSavingsINR) : formatUSD(blendedSavingsUSD)}
              </div>
            </div>
            <span className="text-[11px] text-emerald-200 font-bold">
              +{blendedSavingsPercent}% Net Logistics Reduction
            </span>
          </div>

        </div>

        {/* Simple Explanation Note */}
        <p className="text-[11px] text-slate-600 mt-3 pt-2 border-t border-slate-200/80 leading-relaxed">
          <strong className="text-slate-900">Why this works:</strong> {riskBadge.desc}
        </p>
      </div>

      {/* FEATURE 2: FX CURRENCY SENSITIVITY & LANDED RUPEE RISK LAYER */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-1.5">
              <span>USD/INR Currency Exposure & Landed Cost Sensitivity</span>
              <InsightBulb
                title="USD/INR Foreign Exchange (FX) Sensitivity"
                subtitle="The Hidden Multiplier That Erases Freight Savings"
                dataset="RBI Official Reference Rates + Landed Customs Valuation"
                logic="Ocean freight is invoiced in USD, but Indian steel majors (SAIL, Tata Steel) sell steel in Rupees. If freight drops by $1/ton but the Rupee weakens by ₹2 per USD, your savings are wiped out. This matrix models currency depreciation shocks so CFOs can hedge forex risks."
                impact="Protects balance sheets against currency shocks: an unhedged 5% Rupee depreciation adds ₹8+ Crores to bulk coal imports."
              />
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
            Active Exchange Rate: <strong>₹{currentFxRate} / USD</strong>
          </span>
        </div>

        {/* Currency Sensitivity Matrix Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          {fxScenarios.map((sc, idx) => {
            const scenarioCostINR = ((totalBlendedCostUSD * sc.fx) / 10000000).toFixed(2);
            const deltaFromBaseINR = (((totalBlendedCostUSD * sc.fx) - (totalBlendedCostUSD * baseInrRate)) / 10000000).toFixed(2);
            const isBase = sc.fx === baseInrRate;

            return (
              <div
                key={idx}
                className={`rounded-lg p-3 border text-xs transition-all ${
                  isBase
                    ? 'bg-maritime-50/80 border-maritime-300 ring-1 ring-maritime-400'
                    : sc.fx > baseInrRate
                    ? 'bg-rose-50/40 border-rose-200'
                    : 'bg-emerald-50/40 border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">{sc.label}</span>
                </div>
                <div className="text-base font-black text-slate-900 tabular-nums">
                  ₹{scenarioCostINR} Cr
                </div>
                <div className="mt-1 text-[10px]">
                  {isBase ? (
                    <span className="text-maritime-800 font-bold">● Base Model Benchmark</span>
                  ) : sc.fx > baseInrRate ? (
                    <span className="text-rose-700 font-bold">+₹{deltaFromBaseINR} Cr Extra Cost</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">-₹{Math.abs(deltaFromBaseINR)} Cr Forex Gain</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Plain-English CFO Takeaway */}
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong className="text-slate-900">Hedging Takeaway:</strong> Every <strong>₹1 depreciation</strong> per USD increases total freight cost by <strong>₹{(totalBlendedCostUSD / 10000000).toFixed(2)} Crores</strong>. Recommend locking RBI forward contracts for {contractHorizonMonths}-Month horizon.
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
