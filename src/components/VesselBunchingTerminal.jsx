import React, { useState, useMemo, useEffect } from 'react';
import {
  Terminal, AlertTriangle, Ship, CheckCircle2, ArrowRight, Clock,
  Flame, TrendingDown, RefreshCw, Layers, ShieldCheck, Zap,
  Anchor, Cpu, Compass, Copy, Check, ChevronRight, Gauge, Activity, Navigation
} from 'lucide-react';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';

export default function VesselBunchingTerminal({
  selectedDestination = 'paradip',
  onSelectPort,
  vessels = [],
  onUpdateVesselSpeed
}) {
  const [activeTab, setActiveTab] = useState('radar'); // 'radar', 'cascade', 'actions', 'terminal'
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([
    { time: '13:40:02', level: 'SYS', msg: 'NaviFreight Anti-Bunching Telemetry Daemon initialized (FOIS & PCS 1x connected).' },
    { time: '13:40:15', level: 'WARN', msg: '[BUNCHING_DETECTED]: 3 bulk carriers approaching Paradip 80 NM fairway within 18.4h ETA window.' },
    { time: '13:40:18', level: 'DATA', msg: 'FOIS Audit: Paradip rake turnaround delayed (5.5 rakes/day). Berth deficit = -2 vessels.' },
    { time: '13:40:22', level: 'EXEC', msg: 'Auto-Triage complete: Express Berthing (Ship 1) | Virtual Arrival (Ship 2) | Smart Diversion (Ship 3).' }
  ]);

  const targetPort = INDIAN_EAST_COAST_PORTS[selectedDestination] || INDIAN_EAST_COAST_PORTS.paradip;

  // Synthesize 3 bunched vessels converging on the current target port
  const bunchedVessels = useMemo(() => {
    return [
      {
        id: 'v1',
        name: 'MV OLYMPIC GLORY',
        mmsi: '563112000',
        flag: 'Singapore 🇸🇬',
        vesselClass: 'Capesize',
        dwt: 178000,
        cargo: '160,000 MT Prime Hard Coking Coal',
        consignee: 'SAIL Rourkela Steel Plant (RSP)',
        distNM: 68.4,
        speedKnots: 12.4,
        etaHours: 5.5,
        bunkerOnboardMT: 1420,
        fuelStatus: 'Ample Fuel (1,420 MT)',
        dailyDemurrageLakhs: 65,
        dailyDemurrageUSD: '$75,000/day',
        role: 'Priority #1: Express Berthing',
        statusColor: 'emerald',
        actionSummary: 'Maintain cruising speed (12.4 kts). Direct berth CB-01 upon pilot boarding. 0h queue delay.'
      },
      {
        id: 'v2',
        name: 'MV CHENNAI VALAM',
        mmsi: '419001280',
        flag: 'India 🇮🇳',
        vesselClass: 'Panamax',
        dwt: 76000,
        cargo: '72,000 MT Australian PCI Coal',
        consignee: 'SAIL Durgapur / RSP Buffer Stock',
        distNM: 118.0,
        speedKnots: 12.8,
        etaHours: 9.2,
        bunkerOnboardMT: 620,
        fuelStatus: 'Standard Bunker (620 MT)',
        dailyDemurrageLakhs: 35,
        dailyDemurrageUSD: '$40,000/day',
        role: 'Priority #2: Virtual Arrival (Eco-Speed)',
        statusColor: 'amber',
        actionSummary: 'Throttle back from 12.8 kts to 8.9 kts. Slashes hourly fuel burn by 56.4%. Docks right as Berth 1 clears.'
      },
      {
        id: 'v3',
        name: 'MV CAPE ASIA',
        mmsi: '354890000',
        flag: 'Panama 🇵🇦',
        vesselClass: 'Capesize',
        dwt: 175000,
        cargo: '155,000 MT Queensland Coking Coal',
        consignee: 'SAIL Bokaro Steel Plant (BSL)',
        distNM: 175.5,
        speedKnots: 11.8,
        etaHours: 14.8,
        bunkerOnboardMT: 310,
        fuelStatus: 'Low Fuel Warning (310 MT)',
        dailyDemurrageLakhs: 68,
        dailyDemurrageUSD: '$78,000/day',
        role: 'Priority #3: Smart Diversion to Alternate Port',
        statusColor: 'cyan',
        actionSummary: 'Divert to Dhamra Port (62 NM at 9.0 kts). Direct FOIS rail to SAIL Bokaro. Saves ₹13.7 Cr road surcharge.'
      }
    ];
  }, []);

  const handleCopyDirective = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRunCommand = (cmdStr) => {
    const cmd = cmdStr.trim();
    if (!cmd) return;

    const newLogs = [...terminalLogs, { time: new Date().toLocaleTimeString(), level: 'CMD', msg: `$ ${cmd}` }];

    if (cmd === 'clear' || cmd === 'cls') {
      setTerminalLogs([{ time: new Date().toLocaleTimeString(), level: 'SYS', msg: 'Terminal screen cleared.' }]);
      setTerminalInput('');
      return;
    }

    if (cmd.includes('resolve-bunching')) {
      if (onUpdateVesselSpeed) {
        onUpdateVesselSpeed('563112000', 12.4, 'Underway - Priority Berthing Slot CB-01');
        onUpdateVesselSpeed('419001280', 8.9, 'Underway - Eco-Speed Virtual Arrival');
        onUpdateVesselSpeed('354890000', 13.5, 'Underway - Diverted to Dhamra Port');
      }
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        level: 'EXEC',
        msg: `RESOLVE BUNCHING: Port ${targetPort.name} - Slot CB-01 assigned to MV OLYMPIC GLORY; Eco-Speed (8.9 kts) dispatched to MV CHENNAI VALAM; Dhamra diversion slot reserved for MV CAPE ASIA.`
      });
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        level: 'SYS',
        msg: `[LIVE FLEET MOTION]: Speeds updated across map. MV CHENNAI VALAM throttled to 8.9 kts (-56.4% fuel burn, physical motion slowed in real-time).`
      });
    } else if (cmd.includes('audit-sail-coal')) {
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        level: 'DATA',
        msg: 'SAIL INVENTORY AUDIT: Bokaro (BSL): 4.1 days (CRITICAL) | Rourkela (RSP): 8.4 days (STABLE) | Bhilai (BSP): 11.2 days (HEALTHY). Priority diverted to Dhamra for Bokaro rail link.'
      });
    } else if (cmd.includes('eco-speed')) {
      if (onUpdateVesselSpeed) {
        onUpdateVesselSpeed('419001280', 8.9, 'Underway - Eco-Speed Virtual Arrival');
        onUpdateVesselSpeed('563112000', 8.9, 'Underway - Eco-Speed Virtual Arrival');
      }
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        level: 'CALC',
        msg: 'ECO-SPEED COMPUTATION: P ~ V^3. Speed reduction: 12.8 kts -> 8.9 kts (-30.4%). Engine load: 85% MCR -> 42% MCR. Fuel burn: 1.10 MT/h -> 0.48 MT/h (-56.4%). Fuel saved: 8.8 MT VLSFO (₹5.46 Lakhs).'
      });
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        level: 'SYS',
        msg: `[LIVE FLEET MOTION]: Vessel speed throttled to 8.9 kts. Physical movement on tracking map visibly slowed to Eco-Speed pace.`
      });
    } else if (cmd.includes('prebook-port')) {
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        level: 'EXEC',
        msg: 'PORT COMMUNITY SYSTEM (PCS 1x): Pre-booking request dispatched to Dhamra Port Bulk Berth CB-01. Notice of Readiness (NOR) accepted.'
      });
    } else {
      newLogs.push({
        time: new Date().toLocaleTimeString(),
        level: 'INFO',
        msg: `Command executed. Available commands: resolve-bunching, audit-sail-coal, eco-speed, prebook-port dhamra, clear`
      });
    }

    setTerminalLogs(newLogs);
    setTerminalInput('');
  };

  return (
    <div className="mt-4 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden text-slate-200">
      {/* Top Banner & Header */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
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
              Detects multi-vessel ETA overlap • 80 NM Fairway Geofencing • Indian Railways FOIS Evacuation • Low-Fuel Eco-Speed Advisor
            </p>
          </div>
        </div>

        {/* Live Port Selector & Metrics */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 text-[11px]">Monitored Gateway:</span>
          <span className="font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded">
            {targetPort.name} (Wait: {targetPort.avgWaitDays}d)
          </span>
          <span className="text-[10px] text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-1 rounded font-mono">
            3 Inbound Ships / 1 Coal Berth
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-950/50 border-b border-slate-800 px-4 flex space-x-1 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('radar')}
          className={`py-2.5 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition-all ${
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
          onClick={() => setActiveTab('cascade')}
          className={`py-2.5 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'cascade'
              ? 'border-rose-400 text-rose-300 bg-rose-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2. Congestion Cascade Breakdown</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actions')}
          className={`py-2.5 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'actions'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>3. 3-Tier Anti-Bunching Action Plan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('terminal')}
          className={`py-2.5 px-3.5 font-bold border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'terminal'
              ? 'border-amber-400 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>4. Live Dispatch Console</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-4">
        {/* TAB 1: FLEET COLLISION RADAR */}
        {activeTab === 'radar' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs bg-rose-950/30 border border-rose-900/40 p-2.5 rounded-lg text-rose-200">
              <span className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>
                  <b>CRITICAL SURGE OVERLAP:</b> 3 bulk carriers are converging on {targetPort.name} within an 18.4-hour window, carrying a cumulative 387,000 MT of coal against a nominal daily discharge rate of {targetPort.handlingRateTPD.toLocaleString()} TPD.
                </span>
              </span>
              <span className="font-mono text-rose-300 font-bold whitespace-nowrap ml-2">
                Potential Demurrage: ₹1.68 Cr/day
              </span>
            </div>

            {/* Table of Converging Vessels */}
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Vessel & MMSI</th>
                    <th className="p-2.5">Type & DWT</th>
                    <th className="p-2.5">Cargo & Consignee</th>
                    <th className="p-2.5">Fairway Dist</th>
                    <th className="p-2.5">Speed</th>
                    <th className="p-2.5">ETA to 80 NM</th>
                    <th className="p-2.5">Fuel Onboard</th>
                    <th className="p-2.5 text-right">Triage Action</th>
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
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${
                          i === 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          i === 1 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
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

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>* ETA to 80 NM represents the decisive point before entering port fairway and incurring statutory demurrage.</span>
              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1"
              >
                <span>View Triaged Action Solution</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: CONGESTION CASCADE BREAKDOWN */}
        {activeTab === 'cascade' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs leading-relaxed text-slate-300">
              <h4 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>The Vessel Bunching Cascade Dynamics (Chain Reaction)</span>
              </h4>
              <p className="text-slate-300">
                When multiple vessels arrive simultaneously without anti-bunching coordination, port congestion propagates through a deterministic six-stage ripple effect that paralyses maritime and inland supply chains:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="font-bold text-rose-400 text-xs mb-1">Stage 1: Arrival Clustering</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Uncoordinated departures or weather delays cause 3+ bulkers to cross the 80 NM sea gate simultaneously.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="font-bold text-rose-400 text-xs mb-1">Stage 2: Cargo Surge & Yard Saturation</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    387,000 MT of coal arrives in 18 hours. Port stockpile yards hit 94% storage capacity, slowing unloader conveyors.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="font-bold text-rose-400 text-xs mb-1">Stage 3: Equipment & Truck Overload</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Harbour cranes, harbor craft, and truck weighbridges face a 300% surge, creating 12-hour terminal bottlenecks.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="font-bold text-amber-400 text-xs mb-1">Stage 4: Road Surcharge Penalty</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Railway rake shortage forces steelmakers into road trucks at ₹4.15/TKM vs ₹1.85/NTKM by FOIS rail (+₹13.7 Cr road surcharge).
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="font-bold text-amber-400 text-xs mb-1">Stage 5: Outer Roads Demurrage</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Ships wait 3.5+ days at anchor, burning auxiliary diesel and incurring ₹65L–₹75L/day in charter party penalties.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg">
                  <div className="font-bold text-cyan-400 text-xs mb-1">Stage 6: Regional Contagion</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Vessels delayed at Paradip miss loading laycans at next ports (Haldia, Vizag), propagating delays across East Coast.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 3-TIER ANTI-BUNCHING ACTION PLAN */}
        {activeTab === 'actions' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              
              {/* Ship 1: Express Berthing */}
              <div className="bg-slate-950/80 border border-emerald-500/40 rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                      Tier 1 • Express Berthing
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">0h Wait</span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-1.5 flex items-center space-x-1.5">
                    <span>MV OLYMPIC GLORY</span>
                  </h4>
                  <div className="text-[10px] text-slate-400">Capesize (178k DWT) • 160k MT Coking Coal</div>
                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Consignee:</span>
                      <span className="font-bold text-amber-300">SAIL Rourkela (RSP)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Inventory Status:</span>
                      <span className="text-rose-400 font-bold">4.2 Days (Critical)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Sailing Order:</span>
                      <span className="text-emerald-300 font-bold">Maintain Full Speed (12.4 kts)</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">Berth Assigned:</span>
                      <span className="text-white font-mono font-bold">MCHP Berth CB-01</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 bg-emerald-950/30 p-2 rounded border border-emerald-900/50 mt-2">
                    Direct entry to berth upon reaching 80 NM. Coal dispatched immediately to 5.5 daily FOIS rakes for Rourkela blast furnaces.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyDirective("CONFIRM_EXPRESS_BERTHING: MV OLYMPIC GLORY assigned to Berth CB-01 upon pilot boarding.", 1);
                    if (onUpdateVesselSpeed) {
                      onUpdateVesselSpeed('563112000', 12.4, 'Underway - Priority Berthing Slot CB-01');
                    }
                  }}
                  className="w-full mt-2 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  {copiedIndex === 1 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 1 ? 'Priority Slot Dispatched!' : 'Issue Berthing Order (12.4 kts)'}</span>
                </button>
              </div>

              {/* Ship 2: Virtual Arrival (Eco-Speed) */}
              <div className="bg-slate-950/80 border border-amber-500/40 rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                      Tier 2 • Virtual Arrival
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">-56% Fuel Burn</span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-1.5 flex items-center space-x-1.5">
                    <span>MV CHENNAI VALAM</span>
                  </h4>
                  <div className="text-[10px] text-slate-400">Panamax (76k DWT) • 72k MT PCI Coal</div>
                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Normal Speed:</span>
                      <span className="line-through text-slate-500">12.8 knots</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Target Eco-Speed:</span>
                      <span className="font-bold text-amber-300 font-mono">8.9 knots</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Fuel Burn Drop:</span>
                      <span className="text-emerald-400 font-bold">1.10 → 0.48 MT/hour</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">Fuel Cost Saved:</span>
                      <span className="text-emerald-400 font-bold">₹5.46 Lakhs (8.8 MT)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-900/50 mt-2">
                    Slowing to 8.9 kts delays arrival to +14.2h—docking exactly as Berth CB-01 completes Ship 1. Zero anchorage waiting time or dues.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleCopyDirective("ISSUE_ECO_SPEED: MV CHENNAI VALAM reduce to 8.9 kts. Just-in-Time berth slot reserved.", 2);
                    if (onUpdateVesselSpeed) {
                      onUpdateVesselSpeed('419001280', 8.9, 'Underway - Eco-Speed Virtual Arrival');
                    }
                  }}
                  className="w-full mt-2 py-1.5 px-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  {copiedIndex === 2 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 2 ? 'Eco-Speed Dispatched (8.9 kts)!' : 'Issue Eco-Speed Order (8.9 kts)'}</span>
                </button>
              </div>

              {/* Ship 3: Smart Diversion & Multimodal Rail */}
              <div className="bg-slate-950/80 border border-cyan-500/40 rounded-lg p-3.5 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Tier 3 • Smart Diversion
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold">Save ₹13.7 Cr</span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-1.5 flex items-center space-x-1.5">
                    <span>MV CAPE ASIA</span>
                  </h4>
                  <div className="text-[10px] text-slate-400">Capesize (175k DWT) • 155k MT Coking Coal</div>
                  <div className="mt-2 text-xs text-slate-300 space-y-1">
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Candidate Port:</span>
                      <span className="font-bold text-cyan-300">Dhamra Port (DPCL - 18.0m)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Sea Deviation:</span>
                      <span className="font-mono text-white">62 NM @ 9.0 kts (6.9 hrs)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-1">
                      <span className="text-slate-400">Consignee Plant:</span>
                      <span className="text-amber-300 font-bold">SAIL Bokaro (BSL)</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">FOIS Rail Evacuation:</span>
                      <span className="text-indigo-300 font-bold font-mono">8.0 rakes/day (Low Risk)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-cyan-300/90 bg-cyan-950/30 p-2 rounded border border-cyan-900/50 mt-2">
                    Pre-booking Dhamra clears coal directly to SAIL Bokaro via train at ₹11.2 Cr instead of ₹24.9 Cr by road, completely saving ₹13.7 Cr.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPort && onSelectPort('dhamra');
                    handleCopyDirective("PRE-BOOK PORT DHAMRA FOR MV CAPE ASIA — FOIS RAKE PRIORITY: SAIL BOKARO", 3);
                    if (onUpdateVesselSpeed) {
                      onUpdateVesselSpeed('354890000', 13.5, 'Underway - Diverted to Dhamra Port');
                    }
                  }}
                  className="w-full mt-2 py-1.5 px-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                >
                  {copiedIndex === 3 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 3 ? 'Pre-Book Dispatched!' : 'Pre-Book Port Dhamra (PCS)'}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: LIVE DISPATCH TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="space-y-3 animate-in fade-in duration-150 font-mono text-xs">
            <div className="bg-black/90 rounded-lg p-3.5 border border-slate-800 text-emerald-400 h-64 overflow-y-auto space-y-1.5 shadow-inner">
              <div className="text-slate-500 pb-1 border-b border-slate-800 text-[10px]">
                NaviFreight Anti-Bunching Autonomous Terminal v2.4 • Integrated with FOIS / FreightFox / PCS 1x
              </div>
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed flex items-start space-x-2">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                    log.level === 'WARN' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    log.level === 'EXEC' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    log.level === 'DATA' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                    log.level === 'CALC' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {log.level}
                  </span>
                  <span className={log.level === 'WARN' ? 'text-rose-200' : log.level === 'EXEC' ? 'text-emerald-300' : 'text-slate-300'}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Command Bar */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-sans font-semibold">Quick Exec:</span>
              {[
                { label: 'Resolve Bunching', cmd: 'resolve-bunching' },
                { label: 'Audit SAIL Coal', cmd: 'audit-sail-coal' },
                { label: 'Calculate Eco-Speed', cmd: 'eco-speed' },
                { label: 'Pre-Book Dhamra', cmd: 'prebook-port dhamra' },
                { label: 'Clear Console', cmd: 'clear' },
              ].map((btn) => (
                <button
                  key={btn.cmd}
                  type="button"
                  onClick={() => handleRunCommand(btn.cmd)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition-colors border border-slate-700"
                >
                  ${btn.label}
                </button>
              ))}
            </div>

            {/* Interactive Command Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunCommand(terminalInput);
              }}
              className="flex items-center space-x-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5"
            >
              <span className="text-emerald-400 font-bold">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type command: resolve-bunching, audit-sail-coal, eco-speed, clear..."
                className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-hidden text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] font-sans transition-colors"
              >
                Execute
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
