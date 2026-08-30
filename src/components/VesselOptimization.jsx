import React from 'react';
import { Ship, CheckCircle2, AlertTriangle, XCircle, Info, ShieldAlert, ArrowRight, Anchor } from 'lucide-react';
import { evaluateAllVesselsForPort } from '../utils/financialCalculators';
import InsightBulb from './InsightBulb';

export default function VesselOptimization({ selectedDestination, cargoVolumeMT, currency, onSelectVessel, currentVesselId }) {
  const evaluations = evaluateAllVesselsForPort(selectedDestination, cargoVolumeMT);
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;
  const unit = isINR ? '₹/MT' : '$/MT';

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Ship className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 3: Vessel Suitability & Port Draft Feasibility Matrix</span>
              <InsightBulb
                title="Phase 3: Vessel Type Optimization & Port Fit (Point B)"
                subtitle="Draft, LOA, Beam & Demurrage Risk Analyzer"
                dataset="Hardcoded East Coast Port Engineering Dimensions + AISStream Telemetry"
                logic="Cross-references vessel physical parameters (Capesize 18.2m draft vs Handysize 10.1m draft) against exact East Coast Indian port infrastructure. Flags high-tide windows for Paradip/Vizag and automatically warns if Haldia (7.8m Lock limit) requires daughter vessel lightening at Sagar/Sandheads."
                impact="Eliminates catastrophic ship grounding risks, avoids ₹60–80 Lakhs/day demurrage penalties, and picks the largest feasible vessel to maximize economies of scale."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-referenced with East Coast Port LOA, Beam, Laden Draft & Daily Discharge Handling TPD
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Optimal
          </span>
          <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> High Tide Window
          </span>
          <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200">
            <Anchor className="w-3 h-3 mr-1" /> Transshipment
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-3.5 py-2.5 text-left">Vessel Class</th>
              <th className="px-3 py-2.5 text-center">DWT / Capacity</th>
              <th className="px-3 py-2.5 text-center">Laden Draft</th>
              <th className="px-3 py-2.5 text-center">Port Clearance</th>
              <th className="px-3 py-2.5 text-center">Discharge Time</th>
              <th className="px-3 py-2.5 text-center">Demurrage Risk</th>
              <th className="px-3 py-2.5 text-center">Landed Freight</th>
              <th className="px-3.5 py-2.5 text-center">Fit Score & Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {evaluations.map((item) => {
              const isSelected = currentVesselId === item.vessel.id;
              return (
                <tr
                  key={item.vessel.id}
                  onClick={() => onSelectVessel(item.vessel.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-maritime-50/70 border-l-4 border-maritime-800' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Vessel Name & LOA */}
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        item.status === 'OPTIMAL' ? 'bg-emerald-500' : item.status === 'TIDAL WINDOW REQUIRED' ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <span>{item.vessel.name}</span>
                          {isSelected && (
                            <span className="bg-maritime-800 text-white text-[9px] px-1.5 py-0.2 rounded font-semibold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          LOA: {item.vessel.loaMeters}m • Beam: {item.vessel.beamMeters}m • {item.vessel.geared ? 'Geared (4x35T)' : 'Gearless'}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* DWT & Parcel Cap */}
                  <td className="px-3 py-3 text-center whitespace-nowrap tabular-nums">
                    <div className="font-semibold text-slate-800">
                      {item.vessel.cargoCapacityMT.toLocaleString()} MT
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {item.tripsRequired > 1 ? `${item.tripsRequired} Voyages` : 'Single Voyage'}
                    </div>
                  </td>

                  {/* Draft */}
                  <td className="px-3 py-3 text-center whitespace-nowrap tabular-nums">
                    <span className="font-medium text-slate-800">{item.ladenDraft}m</span>
                  </td>

                  {/* Port Clearance */}
                  <td className="px-3 py-3 text-center whitespace-nowrap tabular-nums">
                    {item.draftMargin >= 0 ? (
                      <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        +{item.draftMargin}m Clearance
                      </span>
                    ) : item.draftMarginHighTide >= 0 ? (
                      <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-bold">
                        +{item.draftMarginHighTide}m (High Tide)
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-bold">
                        {item.draftMargin}m (Draft Deficit)
                      </span>
                    )}
                  </td>

                  {/* Discharge Time */}
                  <td className="px-3 py-3 text-center whitespace-nowrap tabular-nums">
                    <div className="font-semibold text-slate-800">{item.dischargeDays} Days</div>
                    <div className="text-[10px] text-slate-400">@{item.port.handlingRateTPD.toLocaleString()} TPD</div>
                  </td>

                  {/* Demurrage Exposure */}
                  <td className="px-3 py-3 text-center whitespace-nowrap tabular-nums">
                    <div className="font-semibold text-slate-800">₹{item.demurrageExposureLakhs} L</div>
                    <div className="text-[10px] text-slate-400">~{item.estimatedWaitDays}d wait</div>
                  </td>

                  {/* Landed Freight */}
                  <td className="px-3 py-3 text-center whitespace-nowrap tabular-nums">
                    <div className="font-bold text-slate-900">
                      {isINR ? '₹' : '$'}{(item.landedFreightUSD * multiplier).toFixed(1)} {unit}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-medium">
                      x{item.vessel.economyOfScaleMultiplier} scale
                    </div>
                  </td>

                  {/* Fit Score & Status */}
                  <td className="px-3.5 py-3 text-center whitespace-nowrap">
                    <div className="flex flex-col items-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        item.status === 'OPTIMAL'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'TIDAL WINDOW REQUIRED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.fitScore}/100 • {item.status}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 max-w-[170px] truncate" title={item.remarks}>
                        {item.remarks}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Haldia / Shallow Port Transshipment Callout */}
      {selectedDestination === 'haldia' && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-3.5 flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <span className="font-bold">Haldia Lock Gate Draft Alert (7.8m Max):</span> Large Capesize/Panamax vessels carrying over 40,000 MT must discharge partial cargo at <span className="font-bold">Sagar / Sandheads Anchorage</span> into shallow-draft daughter barges before entering Haldia Dock Complex. Direct shipments should utilize <span className="font-bold">Handysize (35k MT)</span> to avoid transshipment double-handling costs ($3.20/MT).
          </div>
        </div>
      )}

    </div>
  );
}
