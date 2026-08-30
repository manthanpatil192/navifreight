import React, { useState } from 'react';
import { RefreshCw, ArrowRight, CheckCircle2, TrendingUp, Sparkles, DollarSign, Leaf, ExternalLink } from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import InsightBulb from './InsightBulb';

export default function DeadheadOptimizer({ selectedDestination, currency }) {
  const [matchedId, setMatchedId] = useState(null);
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;

  // Filter backhaul routes for current discharge port or default to all
  const filteredRoutes = BACKHAUL_OPPORTUNITIES.filter(
    r => r.dischargePort === selectedDestination
  );
  const displayRoutes = filteredRoutes.length > 0 ? filteredRoutes : BACKHAUL_OPPORTUNITIES;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 6: Empty Vessel Management (Deadheading & Tramp Backhaul Optimizer)</span>
              <InsightBulb
                title="Phase 6: Tramp Routing & Backhaul Optimization (Point C)"
                subtitle="Eliminating Empty Ballast Voyages"
                dataset="UN COMTRADE Open API + IMF PortWatch Regional Flows"
                logic="When bulk carriers drop off imported coal at Indian East Coast ports, they traditionally sail empty back to Australia/Indonesia ('deadheading'), burning $20,000/day in fuel with zero revenue. Our tramp matching engine pairs discharged vessels with nearby export cargoes (iron ore pellets from Paradip to Qingdao, bauxite from Vizag to SE Asia, coastal thermal coal to Ennore/Tuticorin)."
                impact="Boosts Round-Voyage Time Charter Equivalent (TCE) earnings by +$4,800 to +$7,200/day, saves 74%–92% in empty ballast days, and avoids over 1,400 tonnes of CO2 per voyage."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sources: UN COMTRADE Bilateral Trade Flows & IMF PortWatch Activity Trackers
          </p>
        </div>

        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-md">
          Prevents Empty Ballast Loss
        </span>
      </div>

      {/* Overview Explanation */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 mb-4 text-xs text-slate-600 flex items-start space-x-3">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Tramp Return Voyage Intelligence:</span> After completing discharge of imported coking/thermal coal at Indian East Coast ports, vessels traditionally sail back in ballast (empty deadhead) burning <span className="font-semibold text-rose-700">~$18,000–$25,000/day</span> in fuel. Our tramp matching engine pairs discharged tonnage with high-paying East Coast outbound exports to elevate Round-Voyage Time Charter Equivalent (TCE) earnings.
        </div>
      </div>

      {/* Backhaul Opportunities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayRoutes.map((route) => {
          const isMatched = matchedId === route.id;
          return (
            <div
              key={route.id}
              className={`border rounded-lg p-4 transition-all flex flex-col justify-between ${
                isMatched
                  ? 'border-emerald-500 bg-emerald-50/40 shadow-card ring-1 ring-emerald-400'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
                  <span className="font-bold text-xs text-slate-800">{route.dischargePortName}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                    {route.distanceNM} NM Return Leg
                  </span>
                </div>

                {/* Cargo */}
                <div className="text-xs font-bold text-maritime-900 mb-1">
                  {route.exportCargo}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center mb-3">
                  <ArrowRight className="w-3 h-3 mr-1 text-slate-400" />
                  <span>Bound for: <span className="font-semibold text-slate-700">{route.destinationRegion}</span></span>
                </div>

                {/* Metrics */}
                <div className="space-y-1.5 text-xs text-slate-600 tabular-nums pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Parcel Volume:</span>
                    <span className="font-semibold text-slate-800">{route.cargoParcelSizeMT.toLocaleString()} MT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">TCE Boost:</span>
                    <span className="font-bold text-emerald-600">
                      +{isINR ? `₹${(route.tceBoostUSDPerDay * multiplier).toFixed(0)}` : `$${route.tceBoostUSDPerDay.toLocaleString()}`} /Day
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ballast Reduction:</span>
                    <span className="font-bold text-slate-900">{route.emptyBallastReductionPercent}% Empty Days Saved</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-emerald-700 font-medium">
                    <span className="flex items-center">
                      <Leaf className="w-3 h-3 mr-1" /> CO2 Avoided:
                    </span>
                    <span>{route.co2SavingsTons} MT</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMatchedId(isMatched ? null : route.id)}
                  className={`w-full py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                    isMatched
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {isMatched ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Backhaul Matched (Locked)</span>
                    </>
                  ) : (
                    <>
                      <span>Pair Tramp Backhaul</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
