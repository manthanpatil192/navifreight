import React, { useState, useEffect } from 'react';
import { Wind, AlertTriangle, ShieldCheck, Clock, CloudLightning, Compass, DollarSign, RefreshCw, Radio, Waves } from 'lucide-react';
import { IMD_WEATHER_ALERTS, PORT_CONGESTION_STATUS } from '../data/weatherCongestionData';
import { fetchLiveBayOfBengalWeather } from '../services/imdWeatherService';
import { formatUSD, formatINR } from '../utils/financialCalculators';
import InsightBulb from './InsightBulb';

export default function RiskCongestionRadar({ selectedDestination, currency }) {
  const [customDailyDemurrageLakhs, setCustomDailyDemurrageLakhs] = useState(65); // ₹65 Lakhs default
  const [activeSector, setActiveSector] = useState(selectedDestination || 'paradip');
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;

  const loadWeather = async (sectorKey = activeSector) => {
    setIsLoadingWeather(true);
    const data = await fetchLiveBayOfBengalWeather(sectorKey);
    setLiveWeather(data);
    setIsLoadingWeather(false);
  };

  useEffect(() => {
    const target = selectedDestination || 'paradip';
    setActiveSector(target);
    loadWeather(target);
  }, [selectedDestination]);

  const handleSectorChange = (sectorId) => {
    setActiveSector(sectorId);
    loadWeather(sectorId);
  };

  const currentPortCongestion = PORT_CONGESTION_STATUS[activeSector] || PORT_CONGESTION_STATUS.paradip;
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
            Real-time telemetry from India Meteorological Department (IMD) Bulletins & Bay of Bengal Maritime Feeds
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sector Quick Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-md text-[11px] font-medium text-slate-600">
            <button
              onClick={() => handleSectorChange('paradip')}
              className={`px-2 py-0.5 rounded ${activeSector === 'paradip' || activeSector === 'dhamra' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              title="NW Bay: Paradip & Dhamra"
            >
              NW Bay (Paradip)
            </button>
            <button
              onClick={() => handleSectorChange('vizag')}
              className={`px-2 py-0.5 rounded ${activeSector === 'vizag' || activeSector === 'gangavaram' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              title="Central Bay: Vizag & Gangavaram"
            >
              Central (Vizag)
            </button>
            <button
              onClick={() => handleSectorChange('haldia')}
              className={`px-2 py-0.5 rounded ${activeSector === 'haldia' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              title="Head Bay: Haldia & Hooghly"
            >
              Head Bay (Haldia)
            </button>
            <button
              onClick={() => handleSectorChange('krishnapatnam')}
              className={`px-2 py-0.5 rounded ${activeSector === 'krishnapatnam' || activeSector === 'kamarajar' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              title="SW Bay: Krishnapatnam & Kamarajar"
            >
              SW Bay
            </button>
          </div>

          <button
            onClick={() => loadWeather(activeSector)}
            disabled={isLoadingWeather}
            className="inline-flex items-center space-x-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingWeather ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <span className="inline-flex items-center text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            IMD Radar: {liveWeather?.isLive ? 'LIVE' : 'ACTIVE'}
          </span>
        </div>
      </div>

      {/* Live IMD Bay of Bengal Real-Time Marine Telemetry Card */}
      {liveWeather && (
        <div className="mb-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-lg p-3.5 text-white border border-blue-900/60 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-blue-800/40">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-xs font-bold tracking-wide uppercase text-slate-200">
                  {liveWeather.sectorName || 'Bay of Bengal Live Telemetry'} ({liveWeather.coordinates})
                </span>
                <p className="text-[10px] text-blue-300">
                  Authority: {liveWeather.cwcAuthority || liveWeather.source} • Synced: {liveWeather.observedAt} • Bulletin: {liveWeather.cwcBulletin}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                liveWeather.severity === 'CRITICAL' || liveWeather.severity === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : liveWeather.severity === 'MODERATE'
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}>
                {liveWeather.stage}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div className="bg-slate-950/60 p-2 rounded border border-blue-900/40">
              <span className="text-[10px] text-slate-400 block flex items-center space-x-1">
                <Wind className="w-3 h-3 text-cyan-400 inline mr-1" />
                Sustained Wind Speed
              </span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {liveWeather.windSpeedKnots} kts <span className="text-[10px] text-slate-400 font-sans">({liveWeather.windSpeedKmh} km/h)</span>
              </span>
              <span className="text-[9px] text-slate-500 block">Gusts: {liveWeather.windGustsKnots} kts</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-blue-900/40">
              <span className="text-[10px] text-slate-400 block flex items-center space-x-1">
                <Waves className="w-3 h-3 text-blue-400 inline mr-1" />
                Significant Wave Height
              </span>
              <span className="text-sm font-bold text-blue-300 font-mono">
                {liveWeather.waveHeightMeters} m
              </span>
              <span className="text-[9px] text-slate-500 block">Period: {liveWeather.wavePeriodSeconds}s</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-blue-900/40">
              <span className="text-[10px] text-slate-400 block flex items-center space-x-1">
                <Compass className="w-3 h-3 text-amber-400 inline mr-1" />
                Barometric Pressure
              </span>
              <span className="text-sm font-bold text-amber-300 font-mono">
                {liveWeather.surfacePressureHpa} hPa
              </span>
              <span className="text-[9px] text-slate-500 block">Air Temp: {liveWeather.temperatureC}°C</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded border border-blue-900/40">
              <span className="text-[10px] text-slate-400 block flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-rose-400 inline mr-1" />
                Official Port Signal
              </span>
              <span className="text-xs font-bold text-rose-300 truncate block" title={liveWeather.signal}>
                {liveWeather.signal}
              </span>
              <span className="text-[9px] text-emerald-400 block font-semibold">Laycan Buffer: +{liveWeather.laycanBufferHours}h</span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-blue-800/40 text-[11px] text-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>
              <strong className="text-white">IMD Advisory:</strong> {liveWeather.operationalAdvice}
            </span>
            {liveWeather.laycanBufferHours > 0 && (
              <span className="text-amber-300 font-semibold text-[10px] bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded self-start sm:self-auto">
                Unhedged Exposure: ${liveWeather.demurrageUSD?.toLocaleString()} (₹{liveWeather.demurrageINRCrore} Cr)
              </span>
            )}
          </div>
        </div>
      )}

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
