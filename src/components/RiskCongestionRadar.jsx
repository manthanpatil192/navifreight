import React, { useState } from 'react';
import { Wind, AlertTriangle, ShieldCheck, Clock, CloudLightning, Compass, DollarSign } from 'lucide-react';
import { IMD_WEATHER_ALERTS, PORT_CONGESTION_STATUS } from '../data/weatherCongestionData';
import { formatUSD, formatINR } from '../utils/financialCalculators';
import InsightBulb from './InsightBulb';

export default function RiskCongestionRadar({ selectedDestination, currency }) {
  const [customDailyDemurrageLakhs, setCustomDailyDemurrageLakhs] = useState(65); // ₹65 Lakhs default
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;

  const currentPortCongestion = PORT_CONGESTION_STATUS[selectedDestination] || PORT_CONGESTION_STATUS.paradip;
  const estimatedDemurrageINR = (currentPortCongestion.avgAnchorageWaitDays * (customDailyDemurrageLakhs * 100000)) / 10000000; // in ₹ Cr
  const estimatedDemurrageUSD = (estimatedDemurrageINR * 10000000) / 86.5;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <CloudLightning className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 7: Bay of Bengal Weather & Port Demurrage Risk Radar</span>
              <InsightBulb
                title="Phase 7: Meteorological Disruption & Demurrage Exposure"
                subtitle="IMD Coastal Warning System"
                dataset="India Meteorological Department (IMD) + Port Traffic PDFs"
                logic="Ingests real-time cyclone tracks, coastal depression alerts, and wave height forecasts from IMD. Integrates with daily anchorage queue depths (₹65 Lakhs/day demurrage rate) to compute total financial exposure if a storm shuts down pilotage."
                impact="Allows charterers to insert 48-hour weather laycan extension clauses in voyage contracts, avoiding massive demurrage dispute bills."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time feeds from India Meteorological Department (IMD) Bulletins & Local Port Daily Traffic PDFs
          </p>
        </div>

        <span className="inline-flex items-center text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-md">
          <Wind className="w-3.5 h-3.5 mr-1 text-maritime-700" />
          IMD Coastal Cyclone Alert Status: ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Left Column: IMD Weather Disruption Bulletins */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
            <Compass className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Active IMD Meteorological Advisories
          </h3>

          {IMD_WEATHER_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-lg border text-xs ${
                alert.severity === 'HIGH' || alert.severity === 'CRITICAL'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : alert.severity === 'MODERATE'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between font-bold mb-1">
                <span>{alert.category}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-white/80 border">
                  {alert.severity} RISK
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-700 mb-1.5">
                {alert.region} • Wind: {alert.windSpeedKnots} kts • Wave: {alert.waveHeightMeters}m
              </p>
              <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                {alert.forecastImpact}
              </p>
              <div className="text-[10px] font-semibold text-slate-500 bg-white/60 p-1.5 rounded border border-slate-200/50">
                <span className="font-bold text-slate-700">Mitigation:</span> {alert.recommendation}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Port Congestion & Demurrage Calculator */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center mb-3">
            <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Anchorage Queue & Demurrage Risk Calculator
          </h3>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
            
            {/* Selected Port Congestion Status */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <div>
                <span className="font-bold text-slate-900 text-sm">{currentPortCongestion.portName}</span>
                <p className="text-[11px] text-slate-500">
                  {currentPortCongestion.vesselsAtAnchor} vessels waiting at anchor • {currentPortCongestion.vesselsBerthWorking} at working berths
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                currentPortCongestion.congestionStatus === 'HIGH'
                  ? 'bg-rose-100 text-rose-800'
                  : currentPortCongestion.congestionStatus === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {currentPortCongestion.congestionStatus} CONGESTION
              </span>
            </div>

            {/* Interactive Demurrage Rate Input */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1 text-slate-600 font-semibold">
                <span>Vessel Daily Demurrage Penalty Rate:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  ₹{customDailyDemurrageLakhs} Lakhs / Day (~${Math.round((customDailyDemurrageLakhs * 100000) / 86.5).toLocaleString()})
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={customDailyDemurrageLakhs}
                onChange={(e) => setCustomDailyDemurrageLakhs(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-maritime-900"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₹40L (Supramax)</span>
                <span>₹65L (Panamax avg)</span>
                <span>₹90L (Capesize peak)</span>
              </div>
            </div>

            {/* Calculated Risk Outlay */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium">Estimated Demurrage Exposure:</span>
                <p className="text-[10px] text-slate-400">Based on {currentPortCongestion.avgAnchorageWaitDays} days turnaround backlog</p>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-rose-600 tabular-nums">
                  {isINR ? `₹${estimatedDemurrageINR.toFixed(2)} Cr` : formatUSD(estimatedDemurrageUSD)}
                </div>
                <span className="text-[10px] font-semibold text-emerald-700">
                  COA Priority Laycan saves this penalty
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
