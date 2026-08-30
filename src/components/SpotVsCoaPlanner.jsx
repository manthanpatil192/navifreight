import React from 'react';
import { Layers, CheckCircle2, ArrowRight, ShieldCheck, DollarSign, Percent, TrendingDown, Clock } from 'lucide-react';
import { formatUSD, formatINR } from '../utils/financialCalculators';
import InsightBulb from './InsightBulb';

export default function SpotVsCoaPlanner({ forecast, cargoVolumeMT, contractHorizonMonths, currency }) {
  const isINR = currency === 'INR';
  const inrRate = 86.5;

  // Simulate total volume across the horizon
  const numberOfVoyages = contractHorizonMonths === 1 ? 1 : contractHorizonMonths === 3 ? 3 : contractHorizonMonths === 6 ? 6 : 12;
  const totalContractVolumeMT = cargoVolumeMT * numberOfVoyages;

  // Spot cost (averaging rising forecast spot drift)
  const spotRateAvgUSD = forecast.projectedSpotRateUSD;
  const totalSpotCostUSD = spotRateAvgUSD * totalContractVolumeMT;

  // COA cost
  const coaRateUSD = forecast.coaRateUSD;
  const totalCoaCostUSD = coaRateUSD * totalContractVolumeMT;

  // Net Savings
  const netSavingsUSD = totalSpotCostUSD - totalCoaCostUSD;
  const netSavingsINR = (netSavingsUSD * inrRate) / 10000000; // in ₹ Cr
  const savingsPercent = Number((((totalSpotCostUSD - totalCoaCostUSD) / totalSpotCostUSD) * 100).toFixed(1));

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 4: Multi-Voyage Contract (COA) vs Spot Chartering Financial Model</span>
              <InsightBulb
                title="Phase 4: Spot vs Multi-Voyage COA Transition (Main Objective)"
                subtitle="Transition from Single Spot to Committed Volume Contracts"
                dataset="DGCIS Landed Values + SSE Index Hedge Spreads"
                logic="Simulates shifting from fragmented daily spot charter contracts (which are reactive and vulnerable to spikes) to 3-month or 6-month multiple voyage contracts (Contracts of Affreightment - COAs). Fixes indexed freight rates, incorporates Bunker Adjustment Factor (BAF) clauses, and locks in priority laycan berths."
                impact="Delivers quantifiable savings of ₹18.4+ Crore ($2.13M USD), eliminates spot freight volatility, and provides ironclad supply chain reliability for Indian steel plants."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Objective: Transition from fragmented spot voyages to committed short/medium term voyage contracts
          </p>
        </div>

        <div className="inline-flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-md text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Recommended Strategy: {contractHorizonMonths}M Multiple Voyage COA</span>
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* Spot Strategy Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase mb-2">
            <span>Traditional Daily Spot</span>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
              High Volatility Risk
            </span>
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {isINR ? `₹${(spotRateAvgUSD * inrRate).toFixed(0)}` : `$${spotRateAvgUSD.toFixed(2)}`}
            <span className="text-xs font-normal text-slate-500"> /MT avg</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Total Volume ({numberOfVoyages} Voyages):</span>
              <span className="font-semibold">{totalContractVolumeMT.toLocaleString()} MT</span>
            </div>
            <div className="flex justify-between">
              <span>Total Freight Outlay:</span>
              <span className="font-bold text-slate-900">
                {isINR ? formatINR((totalSpotCostUSD * inrRate) / 10000000) : formatUSD(totalSpotCostUSD)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Bunker Fuel Risk:</span>
              <span className="text-rose-600 font-medium">100% Unhedged Exposure</span>
            </div>
          </div>
        </div>

        {/* Multi-Voyage COA Strategy Card */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-bl">
            AI OPTIMIZED
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 uppercase mb-2">
            <span>{contractHorizonMonths}-Month Multi-Voyage COA</span>
          </div>
          <div className="text-xl font-bold text-emerald-800 tabular-nums">
            {isINR ? `₹${(coaRateUSD * inrRate).toFixed(0)}` : `$${coaRateUSD.toFixed(2)}`}
            <span className="text-xs font-normal text-emerald-700"> /MT fixed</span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Total Volume ({numberOfVoyages} Voyages):</span>
              <span className="font-semibold">{totalContractVolumeMT.toLocaleString()} MT</span>
            </div>
            <div className="flex justify-between">
              <span>Total Freight Outlay:</span>
              <span className="font-bold text-emerald-800">
                {isINR ? formatINR((totalCoaCostUSD * inrRate) / 10000000) : formatUSD(totalCoaCostUSD)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-emerald-700">
              <span>Bunker Fuel Risk:</span>
              <span className="font-semibold">Fixed BAF Clause Protection</span>
            </div>
          </div>
        </div>

        {/* Quantified Value Creation Card */}
        <div className="bg-maritime-900 text-white rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Net Quantified Cost Reduction
            </div>
            <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
              {isINR ? formatINR(netSavingsINR) : formatUSD(netSavingsUSD)}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Logistics Savings: <span className="text-emerald-400 font-bold">+{savingsPercent}%</span> over spot market
            </div>
          </div>

          <div className="pt-3 border-t border-maritime-800 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Guaranteed Laycan & Priority Berthing Slots</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Eliminates Spot Demurrage Surcharges</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
