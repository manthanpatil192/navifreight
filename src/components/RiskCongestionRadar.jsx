import React, { useState, useEffect } from 'react';
import { Wind, AlertTriangle, ShieldCheck, Clock, CloudLightning, Compass, DollarSign, RefreshCw, Radio, Waves, ArrowRight, CheckCircle2, XCircle, Anchor, Navigation } from 'lucide-react';
import { IMD_WEATHER_ALERTS, PORT_CONGESTION_STATUS } from '../data/weatherCongestionData';
import { fetchLiveBayOfBengalWeather } from '../services/imdWeatherService';
import { formatUSD, formatINR } from '../utils/financialCalculators';
import { evaluatePortDiversion } from '../utils/portDiversionEngine';
import InsightBulb from './InsightBulb';

export default function RiskCongestionRadar({ selectedDestination, currency, selectedVessel = 'capesize' }) {
  const [customDailyDemurrageLakhs, setCustomDailyDemurrageLakhs] = useState(65); // ₹65 Lakhs default
  const [activeSector, setActiveSector] = useState(selectedDestination || 'paradip');
  const [liveWeather, setLiveWeather] = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;

  const diversionData = evaluatePortDiversion({
    selectedDestination: activeSector,
    selectedVessel,
    customDailyDemurrageLakhs
  });

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
              onClick={() => handleSectorChange('gopalpur')}
              className={`px-2 py-0.5 rounded ${activeSector === 'gopalpur' ? 'bg-white shadow-sm text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              title="South Odisha: Gopalpur Port"
            >
              South Odisha (Gopalpur)
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

      {/* ================= PART B PORT SATURATION & COMPLIANT DIVERSION ADVISORY ================= */}
      <div className="mt-5 p-4 rounded-xl border border-cyan-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-slate-100 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cyan-800/50 gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-500/20 text-cyan-400">
              <Anchor className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-2">
                <span>Part B Compliant Port Saturation & Diversion Suggestion Engine</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  diversionData.isPortSaturated 
                    ? 'bg-rose-900 text-rose-200 border border-rose-700 animate-pulse' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                }`}>
                  {diversionData.isPortSaturated ? '⚠️ CAPACITY SATURATED' : '🟢 NORMAL BERTHING QUEUE'}
                </span>
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Vessel: <span className="font-bold text-cyan-300 uppercase">{diversionData.vessel.name}</span> (Draft: {diversionData.vessel.ladenDraft}m, LOA: {diversionData.vessel.loa}m) • Dynamic physical clearance verification
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Advisory Suggestion Mode Only
          </span>
        </div>

        {diversionData.isPortSaturated && diversionData.suggestedPort ? (
          <div className="space-y-3 text-xs">
            {/* Saturated Alert Banner */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-rose-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-1.5 text-rose-300 font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{diversionData.currentPort.name} is at Capacity ({diversionData.currentPort.avgWaitDays} Days Turnaround Wait)</span>
                </div>
                <div className="text-[11px] text-slate-300 leading-snug">
                  High anchorage queue depth detected. Suggested alternative: <span className="font-bold text-cyan-300">Divert to {diversionData.suggestedPort.portName}</span> ({diversionData.suggestedPort.state}).
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Wait Saved</span>
                  <span className="text-sm font-bold text-emerald-400">-{diversionData.suggestedPort.waitDaysSaved} Days</span>
                </div>
                <div className="w-px h-6 bg-slate-700"></div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block">Demurrage Avoided</span>
                  <span className="text-sm font-bold text-emerald-400">₹{diversionData.suggestedPort.demurrageSavedLakhs} Lakhs</span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison: Current Port vs. Suggested Alternative */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Current Port Card */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-rose-900/50">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
                  <span className="font-bold text-rose-300 text-xs flex items-center gap-1">
                    <span>⛔ Current Port: {diversionData.currentPort.name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/70 px-1.5 py-0.5 rounded">
                    Saturated
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Avg Anchorage Wait:</span>
                    <span className="font-bold text-rose-400 font-mono">{diversionData.currentPort.avgWaitDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Max Laden Draft:</span>
                    <span className="font-bold text-slate-200">{diversionData.currentPort.maxDraftLaden}m</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Daily Discharge Rate:</span>
                    <span className="font-bold text-slate-200">{diversionData.currentPort.handlingRateTPD.toLocaleString()} TPD</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Demurrage Rate / Day:</span>
                    <span className="font-bold text-rose-400">₹{customDailyDemurrageLakhs} Lakhs</span>
                  </div>
                </div>
              </div>

              {/* Suggested Alternative Card */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-600/50">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
                  <span className="font-bold text-cyan-300 text-xs flex items-center gap-1">
                    <span>⚡ Suggested: {diversionData.suggestedPort.portName}</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                    Part B Cleared
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Avg Anchorage Wait:</span>
                    <span className="font-bold text-emerald-400 font-mono">{diversionData.suggestedPort.avgWaitDays} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Max Permissible Draft:</span>
                    <span className="font-bold text-emerald-300">{diversionData.suggestedPort.effectiveMaxDraft}m (Laden OK)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Daily Discharge Rate:</span>
                    <span className="font-bold text-slate-200">{diversionData.suggestedPort.handlingRateTPD.toLocaleString()} TPD</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Discharge Advantage:</span>
                    <span className="font-bold text-emerald-400">
                      {diversionData.suggestedPort.handlingRateAdvantageTPD > 0 ? `+${diversionData.suggestedPort.handlingRateAdvantageTPD.toLocaleString()}` : 'Equal'} TPD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Part B Technical Compatibility & Disqualified Ports */}
            <div className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>Part B Physical Fit & Technical Verification Audit:</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Draft, LOA & TPD Verified for {diversionData.vessel.name}
                </span>
              </div>

              {diversionData.disqualifiedPorts.length > 0 && (
                <div className="pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                    Strict Part B Disqualification Guardrails (Ports Incompatible with {diversionData.vessel.name}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {diversionData.disqualifiedPorts.map(dp => (
                      <span key={dp.portId} className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-900/60 text-[10px] text-rose-300 flex items-center gap-1">
                        <XCircle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                        <span className="font-bold">{dp.portName}:</span> {dp.disqualificationReasons.join('; ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>{diversionData.currentPort.name}</strong> has manageable queue levels ({diversionData.currentPort.avgWaitDays} days avg wait). Normal berthing schedule confirmed for <strong>{diversionData.vessel.name}</strong>.
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Queue Status: Optimal</span>
          </div>
        )}
      </div>

      {/* ================= GEOPOLITICAL AIS ROUTE CHANGE & DETOUR RECALIBRATION ================= */}
      <div className="mt-5 p-4 rounded-xl border border-rose-200 bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 text-slate-100 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-800/60 gap-2 mb-3">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-rose-500/20 text-rose-400">
              <Compass className="w-4 h-4" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-100 flex items-center gap-2">
              <span>Geopolitical AIS Route Change & Rerouting Engine</span>
              <span className="animate-pulse px-2 py-0.5 rounded text-[10px] bg-rose-600 text-white font-extrabold">
                AUTOMATED RECALIBRATION
              </span>
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            Red Sea / Cape of Good Hope Detour
          </span>
        </div>

        {/* Route Change Detection Banner */}
        <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-700/60 text-xs mb-3">
          <div className="flex items-center justify-between font-mono font-bold text-rose-200 mb-1">
            <span className="flex items-center gap-1.5 text-rose-300">
              <Wind className="w-3.5 h-3.5 animate-spin text-rose-400" />
              AIS Signal Trigger: "This ship has changed its route"
            </span>
            <span className="text-[11px] text-amber-300">Cape of Good Hope Rerouting</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-1 sm:space-y-0 text-slate-300 font-mono text-[11px] mt-1.5">
            <span className="line-through text-slate-500">Standard: Asia ──► Red Sea / Suez Canal ──► Europe / India</span>
            <span className="text-amber-400 font-bold">──► Rerouted Path: Asia ──► Around Africa (Cape of Good Hope) ──► Europe / India</span>
          </div>
        </div>

        {/* Automatically Updated Parameters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          
          {/* 1. ETA */}
          <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">1. Updated ETA</span>
            <div className="text-sm font-extrabold text-amber-400 mt-0.5">+12.5 Days</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Sep 14 ──► Sep 27</span>
          </div>

          {/* 2. Distance */}
          <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">2. Sailing Distance</span>
            <div className="text-sm font-extrabold text-cyan-400 mt-0.5">+3,450 NM</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">7,200 ──► 10,650 NM</span>
          </div>

          {/* 3. Fuel Requirement */}
          <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">3. Fuel Requirement</span>
            <div className="text-sm font-extrabold text-rose-400 mt-0.5">+385 MT VLSFO</div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">+$238,700 USD Extra</span>
          </div>

          {/* 4. Freight Cost */}
          <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">4. Freight Rate Impact</span>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">+$3.40 /MT</div>
            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">+₹294 /MT Squeeze</span>
          </div>

          {/* 5. Delay Risk */}
          <div className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">5. Delay & Queue Risk</span>
            <div className="text-sm font-extrabold text-rose-400 mt-0.5">92/100 (CRITICAL)</div>
            <span className="text-[10px] text-slate-400 block mt-0.5">Anchorage Queue Risk</span>
          </div>

        </div>
      </div>

    </div>
  );
}
