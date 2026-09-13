import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertTriangle, Ship, CheckCircle2, ArrowRight,
  Anchor, Compass, Copy, Check, ChevronRight, Gauge
} from 'lucide-react';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';

export default function VesselBunchingTerminal({
  selectedDestination = 'paradip',
  onSelectPort,
  vessels = [],
  onUpdateVesselSpeed
}) {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' (Part 1) or 'actions' (Part 3)
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [activePortKey, setActivePortKey] = useState(selectedDestination || 'paradip');

  // Keep internal active port in sync if selectedDestination prop changes from outside
  useEffect(() => {
    if (selectedDestination && INDIAN_EAST_COAST_PORTS[selectedDestination]) {
      setActivePortKey(selectedDestination);
    }
  }, [selectedDestination]);

  const targetPort = INDIAN_EAST_COAST_PORTS[activePortKey] || INDIAN_EAST_COAST_PORTS.paradip;

  // Dynamic port routing configuration for all 10 Indian East Coast bulk ports (SAIL Steel Mills linked)
  const portConfig = useMemo(() => {
    const portKey = (activePortKey || 'paradip').toLowerCase();
    switch (portKey) {
      case 'dhamra':
        return {
          consignee1: 'SAIL Bokaro Steel Plant (BSL)',
          consignee2: 'SAIL Rourkela Steel Plant (RSP)',
          candidatePort: 'Paradip Port (PPT - 14.5m)',
          candidateKey: 'paradip',
          deviationNM: 62,
          deviationHours: 5.0,
          berthName: 'DPCL Bulk Berth BB-01',
          savedAmtCr: 11.4
        };
      case 'haldia':
        return {
          consignee1: 'SAIL Durgapur Steel Plant (DSP)',
          consignee2: 'SAIL IISCO Burnpur (ISP)',
          candidatePort: 'Dhamra Port (DPCL - 18.0m)',
          candidateKey: 'dhamra',
          deviationNM: 112,
          deviationHours: 8.8,
          berthName: 'HDC Berth 04A (River Lock)',
          savedAmtCr: 18.2
        };
      case 'vizag':
        return {
          consignee1: 'SAIL Bhilai Steel Plant (BSP)',
          consignee2: 'SAIL Rourkela (RSP Rail Link)',
          candidatePort: 'Gangavaram Port (GPL - 19.5m)',
          candidateKey: 'gangavaram',
          deviationNM: 12,
          deviationHours: 1.0,
          berthName: 'VPA VGCB Outer Berth 01',
          savedAmtCr: 14.8
        };
      case 'gangavaram':
        return {
          consignee1: 'SAIL Bhilai Steel Plant (BSP)',
          consignee2: 'SAIL Rourkela Steel Plant (RSP)',
          candidatePort: 'Visakhapatnam Port (VPT - 18.1m)',
          candidateKey: 'vizag',
          deviationNM: 12,
          deviationHours: 1.0,
          berthName: 'GPL Coal Berth 02',
          savedAmtCr: 9.6
        };
      case 'gopalpur':
        return {
          consignee1: 'SAIL Rourkela Steel Plant (RSP)',
          consignee2: 'SAIL Bhilai (BSP)',
          candidatePort: 'Paradip Port (PPT - 14.5m)',
          candidateKey: 'paradip',
          deviationNM: 128,
          deviationHours: 10.2,
          berthName: 'GPL Multipurpose Berth 01',
          savedAmtCr: 8.4
        };
      case 'ennore':
        return {
          consignee1: 'SAIL Salem Steel Plant (SSP)',
          consignee2: 'SAIL Visvesvaraya (VISL)',
          candidatePort: 'Chennai Port (ChPA - 14.0m)',
          candidateKey: 'chennai',
          deviationNM: 24,
          deviationHours: 2.0,
          berthName: 'KPL Coal Berth CB-02',
          savedAmtCr: 10.5
        };
      case 'chennai':
        return {
          consignee1: 'SAIL Salem Steel Plant (SSP)',
          consignee2: 'SAIL Bhilai (BSP Rail Link)',
          candidatePort: 'Kamarajar Ennore (KPL - 15.5m)',
          candidateKey: 'ennore',
          deviationNM: 24,
          deviationHours: 2.0,
          berthName: 'ChPA West Quay Coal Berth',
          savedAmtCr: 12.1
        };
      case 'krishnapatnam':
        return {
          consignee1: 'SAIL Bhilai Steel Plant (BSP)',
          consignee2: 'SAIL Salem Steel Plant (SSP)',
          candidatePort: 'Kamarajar Ennore (KPL - 15.5m)',
          candidateKey: 'ennore',
          deviationNM: 78,
          deviationHours: 6.2,
          berthName: 'KPCL Deep Draught Coal Berth',
          savedAmtCr: 13.2
        };
      case 'tuticorin':
        return {
          consignee1: 'SAIL Salem Steel Plant (SSP)',
          consignee2: 'SAIL Visvesvaraya (VISL)',
          candidatePort: 'Chennai Port (ChPA - 14.0m)',
          candidateKey: 'chennai',
          deviationNM: 320,
          deviationHours: 24.0,
          berthName: 'VOCPA Coal Jetty CJ-02',
          savedAmtCr: 7.9
        };
      case 'paradip':
      default:
        return {
          consignee1: 'SAIL Rourkela Steel Plant (RSP)',
          consignee2: 'SAIL Bokaro Steel Plant (BSL)',
          candidatePort: 'Dhamra Port (DPCL - 18.0m)',
          candidateKey: 'dhamra',
          deviationNM: 62,
          deviationHours: 5.0,
          berthName: 'MCHP Coal Berth CB-01',
          savedAmtCr: 13.7
        };
    }
  }, [activePortKey]);

  // Synthesize bunched vessels converging on the currently active target port
  const bunchedVessels = useMemo(() => {
    const matching = vessels.filter(v => 
      (v.destinationId || '').toLowerCase() === activePortKey.toLowerCase() ||
      (v.destinationPort || '').toLowerCase().includes(activePortKey.toLowerCase())
    );

    const ship1 = matching[0] || {
      name: 'MV OLYMPIC GLORY',
      mmsi: '563112000',
      flag: 'Singapore 🇸🇬',
      vesselClass: 'Capesize',
      dwt: 178000,
      cargo: '160,000 MT Prime Hard Coking Coal',
      speedKnots: 12.4,
      bunkerOnboardMT: 1420
    };

    const ship2 = matching[1] || {
      name: 'MV CAPE ASIA',
      mmsi: '354890000',
      flag: 'Panama 🇵🇦',
      vesselClass: 'Capesize',
      dwt: 175000,
      cargo: '155,000 MT Queensland Coking Coal',
      speedKnots: 11.8,
      bunkerOnboardMT: 310
    };

    return [
      {
        id: 'v1',
        name: ship1.name,
        mmsi: ship1.mmsi,
        flag: ship1.flag || 'Singapore 🇸🇬',
        vesselClass: ship1.vesselType || ship1.vesselClass || 'Capesize',
        dwt: ship1.dwt || 178000,
        cargo: ship1.cargo || '160,000 MT Prime Hard Coking Coal',
        consignee: portConfig.consignee1,
        distNM: 68.4,
        speedKnots: ship1.speedKnots || 12.4,
        etaHours: 5.5,
        bunkerOnboardMT: 1420,
        fuelStatus: 'Ample Fuel (1,420 MT)',
        dailyDemurrageLakhs: Math.round(targetPort.demurragePerDayINR / 100000),
        dailyDemurrageUSD: '$75,000/day',
        role: 'Tier 1 • Express Berthing',
        statusColor: 'emerald',
        actionSummary: `Maintain cruising speed (${ship1.speedKnots || 12.4} kts). Direct berth ${portConfig.berthName} upon pilot boarding. 0h queue delay.`
      },
      {
        id: 'v2',
        name: ship2.name,
        mmsi: ship2.mmsi,
        flag: ship2.flag || 'Panama 🇵🇦',
        vesselClass: ship2.vesselType || ship2.vesselClass || 'Capesize',
        dwt: ship2.dwt || 175000,
        cargo: ship2.cargo || '155,000 MT Queensland Coking Coal',
        consignee: portConfig.consignee2,
        distNM: 142.5,
        speedKnots: ship2.speedKnots || 11.8,
        etaHours: 11.5,
        bunkerOnboardMT: 310,
        fuelStatus: 'Standard Bunker (710 MT)',
        dailyDemurrageLakhs: Math.round(targetPort.demurragePerDayINR / 100000),
        dailyDemurrageUSD: '$78,000/day',
        role: `Tier 3 • Smart Diversion to ${portConfig.candidatePort.split(' ')[0]}`,
        statusColor: 'cyan',
        actionSummary: `Divert to ${portConfig.candidatePort} (${portConfig.deviationNM} NM). Direct FOIS rail to ${portConfig.consignee2}. Saves ₹${portConfig.savedAmtCr} Cr in demurrage and road surcharge.`
      }
    ];
  }, [activePortKey, portConfig, targetPort, vessels]);

  const handleCopyDirective = (text, index) => {
    try {
      navigator.clipboard.writeText(text);
    } catch (e) {}
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSelectPort = (portKey) => {
    setActivePortKey(portKey);
    if (onSelectPort) {
      onSelectPort(portKey);
    }
  };

  return (
    <div className="mt-4 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden text-slate-200">
      
      {/* Top Banner & Header */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5">
                <span>Vessel Bunching & Anti-Congestion Dispatch Terminal</span>
                <span className="text-[10px] font-mono font-semibold bg-rose-950 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-full uppercase">
                  ETA Collision Alert
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Detects multi-vessel ETA overlap • 80 NM Fairway Geofencing • Indian Railways FOIS Evacuation • Multi-Port Optimization
            </p>
          </div>
        </div>

        {/* Live Monitored Port Status Badge */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Monitored Gateway:</span>
          <span className="font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{targetPort.name}</span>
            <span className="text-[10px] text-cyan-400 font-mono font-normal">(Wait: {targetPort.avgWaitDays}d)</span>
          </span>
          <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded font-mono">
            {targetPort.handlingRateTPD.toLocaleString()} TPD Rate
          </span>
        </div>
      </div>

      {/* ALL PORTS SELECTOR BAR */}
      <div className="bg-slate-950/70 border-b border-slate-800 px-4 py-2 flex items-center space-x-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center space-x-1 mr-1">
          <Anchor className="w-3.5 h-3.5 text-cyan-400" />
          <span>Select Port:</span>
        </span>
        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          {Object.entries(INDIAN_EAST_COAST_PORTS).map(([key, p]) => {
            const isSelected = key === activePortKey;
            const isHighWait = p.avgWaitDays >= 3.5;
            const isMedWait = p.avgWaitDays >= 2.0 && p.avgWaitDays < 3.5;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPort(key)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md scale-[1.02]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                }`}
                title={`${p.name} • Wait: ${p.avgWaitDays}d • Draft: ${p.maxDraftLaden}m • Rate: ${p.handlingRateTPD.toLocaleString()} TPD`}
              >
                <span>{p.name.split(' ')[0]}</span>
                <span className={`text-[9.5px] px-1 py-0.2 rounded font-mono ${
                  isSelected 
                    ? 'bg-slate-950 text-cyan-300 font-bold' 
                    : isHighWait 
                    ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                    : isMedWait 
                    ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {p.avgWaitDays}d
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Tabs (Only Part 1 and Part 3 retained per user requirement) */}
      <div className="bg-slate-950/50 border-b border-slate-800 px-4 flex space-x-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`py-2.5 px-4 font-bold border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'radar'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>1. Fleet Collision Radar (ETAs)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`py-2.5 px-4 font-bold border-b-2 flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'actions'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>3. Anti-Bunching Action Plan (Berthing & Diversion)</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-4">
        
        {/* PART 1: FLEET COLLISION RADAR */}
        {activeTab === 'radar' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Surge Overlap Alert Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-rose-950/30 border border-rose-900/40 p-3 rounded-lg text-rose-200 gap-2">
              <span className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <b>CRITICAL ARRIVAL OVERLAP:</b> Multiple bulk carriers are converging on <b>{targetPort.name}</b> within an 18-hour window, against a nominal handling capacity of {targetPort.handlingRateTPD.toLocaleString()} TPD ({targetPort.maxDraftLaden}m draft).
                </span>
              </span>
              <span className="font-mono text-rose-300 font-bold whitespace-nowrap bg-rose-950/80 px-2 py-1 rounded border border-rose-800">
                Demurrage Risk: ₹{(targetPort.demurragePerDayINR / 100000).toFixed(0)}L/day
              </span>
            </div>

            {/* Table of Converging Vessels for Selected Port */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Vessel & MMSI</th>
                    <th className="p-2.5">Type & DWT</th>
                    <th className="p-2.5">Cargo & Consignee</th>
                    <th className="p-2.5">Fairway Dist</th>
                    <th className="p-2.5">Speed (SOG)</th>
                    <th className="p-2.5">ETA to 80 NM</th>
                    <th className="p-2.5">Fuel Onboard</th>
                    <th className="p-2.5 text-right">Triage Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {bunchedVessels.map((v, i) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-white flex items-center space-x-1.5">
                        <Ship className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <div>
                          <div>{v.name}</div>
                          <div className="text-[9px] text-slate-500 font-normal">{v.mmsi} • {v.flag}</div>
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-300">
                        <div>{v.vesselClass}</div>
                        <div className="text-[9px] text-slate-500 font-normal">{v.dwt.toLocaleString()} DWT</div>
                      </td>
                      <td className="p-2.5 text-slate-300 font-sans">
                        <div className="font-semibold text-slate-200">{v.cargo}</div>
                        <div className="text-[10px] text-amber-300/90 font-medium">🏭 {v.consignee}</div>
                      </td>
                      <td className="p-2.5 text-cyan-300 font-bold">
                        {v.distNM} NM
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {v.speedKnots} kts
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/80 font-bold">
                          +{v.etaHours}h
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-300 font-sans">
                        <span className={`text-[10px] font-semibold ${v.fuelStatus.includes('Low') ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {v.fuelStatus}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-sans">
                        <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold ${
                          i === 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          'bg-cyan-950 text-cyan-300 border border-cyan-800'
                        }`}>
                          {v.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ALL INDIAN EAST COAST PORTS CONGESTION MATRIX */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>All Indian East Coast Ports — Congestion & Anchorage Gateways</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Click any port row to inspect & monitor
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/90 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">Port Gateway</th>
                      <th className="p-2.5">State</th>
                      <th className="p-2.5">Avg Wait</th>
                      <th className="p-2.5">Congestion Risk</th>
                      <th className="p-2.5">Max Draft</th>
                      <th className="p-2.5">Discharge Rate</th>
                      <th className="p-2.5">SAIL Supply Cluster</th>
                      <th className="p-2.5 text-right">Switch Monitor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {Object.entries(INDIAN_EAST_COAST_PORTS).map(([pKey, p]) => {
                      const isCurrent = pKey === activePortKey;
                      const isHigh = p.avgWaitDays >= 3.5;
                      const isMed = p.avgWaitDays >= 2.0 && p.avgWaitDays < 3.5;
                      return (
                        <tr
                          key={pKey}
                          onClick={() => handleSelectPort(pKey)}
                          className={`cursor-pointer transition-colors ${
                            isCurrent
                              ? 'bg-cyan-950/40 font-bold border-l-4 border-l-cyan-400'
                              : 'hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="p-2.5 text-white flex items-center space-x-2">
                            <Anchor className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className={isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-200'}>
                              {p.name}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400">{p.state}</td>
                          <td className="p-2.5 font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${
                              isHigh
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : isMed
                                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            }`}>
                              {p.avgWaitDays} Days
                            </span>
                          </td>
                          <td className="p-2.5 font-semibold">
                            <span className={isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-emerald-400'}>
                              {p.congestionLevel}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-300">{p.maxDraftLaden}m</td>
                          <td className="p-2.5 font-mono text-slate-300">{p.handlingRateTPD.toLocaleString()} TPD</td>
                          <td className="p-2.5 text-slate-300 text-[10px]">
                            {p.hinterlandEvacuation?.primaryCluster?.split('(')[0] || 'SAIL Plant'}
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPort(pKey);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                                isCurrent
                                  ? 'bg-cyan-500 text-slate-950'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {isCurrent ? 'Monitoring' : 'Monitor Port'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>* Data synchronized with Indian East Coast Port Authorities & FOIS Rail Evacuation schedules.</span>
              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1 cursor-pointer"
              >
                <span>Proceed to Anti-Bunching Action Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* PART 3: ANTI-BUNCHING ACTION PLAN (Express Berthing & Smart Diversion) */}
        {activeTab === 'actions' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white">Active Anti-Bunching Directive for {targetPort.name}:</span>
                <span className="text-slate-400 ml-1.5">Express Berthing for Critical Consignee • Smart Congestion Diversion for Overlap Vessel</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-bold">
                2-Stage Optimization Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Part 1 (Tier 1): Express Berthing Priority Slot */}
              <div className="bg-slate-950/80 border border-emerald-500/40 rounded-lg p-4 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                      Part 1 (Tier 1) • Express Berthing
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">0h Wait Window</span>
                  </div>

                  <h4 className="font-bold text-white text-base mt-2 flex items-center space-x-1.5">
                    <span>{bunchedVessels[0]?.name || 'MV OLYMPIC GLORY'}</span>
                  </h4>
                  <div className="text-xs text-slate-400">{bunchedVessels[0]?.vesselClass} • {bunchedVessels[0]?.cargo}</div>

                  <div className="mt-3 text-xs text-slate-300 space-y-1.5 bg-slate-900/90 p-3 rounded border border-slate-800">
                    <div className="flex justify-between border-b border-slate-800/80 pb-1">
                      <span className="text-slate-400">Consignee Plant:</span>
                      <span className="font-bold text-amber-300">{portConfig.consignee1}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1">
                      <span className="text-slate-400">Inventory Status:</span>
                      <span className="text-rose-400 font-bold">4.2 Days (Critical Demand)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1">
                      <span className="text-slate-400">Target Gateway:</span>
                      <span className="text-cyan-300 font-bold">{targetPort.name}</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-slate-400">Berth Assigned:</span>
                      <span className="text-white font-mono font-bold">{portConfig.berthName}</span>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-300/90 bg-emerald-950/30 p-2.5 rounded border border-emerald-900/50 mt-3 leading-relaxed">
                    Direct entry to berth upon reaching 80 NM. Coal unloaded directly to daily FOIS rake trains for blast furnaces at <b>{portConfig.consignee1}</b>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleCopyDirective(`CONFIRM_EXPRESS_BERTHING: ${bunchedVessels[0]?.name} assigned to ${portConfig.berthName} at ${targetPort.name} upon arrival.`, 1);
                    if (onUpdateVesselSpeed) {
                      onUpdateVesselSpeed(bunchedVessels[0]?.mmsi, bunchedVessels[0]?.speedKnots, `Underway - Priority Berthing ${portConfig.berthName}`);
                    }
                  }}
                  className="w-full mt-3 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedIndex === 1 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedIndex === 1 ? 'Priority Berth Dispatched!' : `Issue Berthing Order (${targetPort.name.split(' ')[0]})`}</span>
                </button>
              </div>

              {/* Part 3 (Tier 3): Smart Congestion Diversion */}
              <div className="bg-slate-950/80 border border-cyan-500/40 rounded-lg p-4 space-y-3 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded border border-cyan-800">
                      Part 3 (Tier 3) • Smart Congestion Diversion
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">Save ₹{portConfig.savedAmtCr} Cr</span>
                  </div>

                  <h4 className="font-bold text-white text-base mt-2 flex items-center space-x-1.5">
                    <span>{bunchedVessels[1]?.name || 'MV CAPE ASIA'}</span>
                  </h4>
                  <div className="text-xs text-slate-400">{bunchedVessels[1]?.vesselClass} • {bunchedVessels[1]?.cargo}</div>

                  <div className="mt-3 text-xs text-slate-300 space-y-1.5 bg-slate-900/90 p-3 rounded border border-slate-800">
                    <div className="flex justify-between border-b border-slate-800/80 pb-1">
                      <span className="text-slate-400">Alternate Gateway:</span>
                      <span className="font-bold text-cyan-300">{portConfig.candidatePort}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1">
                      <span className="text-slate-400">Sea Deviation:</span>
                      <span className="font-mono text-white">{portConfig.deviationNM} NM (~{portConfig.deviationHours} hrs)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1">
                      <span className="text-slate-400">Consignee Plant:</span>
                      <span className="text-amber-300 font-bold">{portConfig.consignee2}</span>
                    </div>
                    <div className="flex justify-between pb-0.5">
                      <span className="text-slate-400">Net Logistics Arbitrage:</span>
                      <span className="text-emerald-400 font-bold font-mono">+₹{portConfig.savedAmtCr} Cr Saved</span>
                    </div>
                  </div>

                  <p className="text-xs text-cyan-300/90 bg-cyan-950/30 p-2.5 rounded border border-cyan-900/50 mt-3 leading-relaxed">
                    Pre-booking <b>{portConfig.candidatePort}</b> clears cargo directly via dedicated FOIS rail trains, completely bypassing the {targetPort.avgWaitDays}-day anchorage queue at {targetPort.name.split(' ')[0]}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleSelectPort(portConfig.candidateKey);
                    handleCopyDirective(`PRE-BOOK ${portConfig.candidatePort.toUpperCase()} FOR ${bunchedVessels[1]?.name} — FOIS RAKE PRIORITY: ${portConfig.consignee2}`, 3);
                    if (onUpdateVesselSpeed) {
                      onUpdateVesselSpeed(bunchedVessels[1]?.mmsi, bunchedVessels[1]?.speedKnots, `Underway - Diverted to ${portConfig.candidatePort.split(' ')[0]}`);
                    }
                  }}
                  className="w-full mt-3 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedIndex === 3 ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedIndex === 3 ? 'Pre-Book Dispatched!' : `Pre-Book Alternate Port ${portConfig.candidatePort.split(' ')[0]} (PCS)`}</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
