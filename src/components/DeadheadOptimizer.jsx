import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, ArrowRight, CheckCircle2, Sparkles, Leaf, Anchor, 
  MapPin, Zap, TrendingUp, CloudRain, Waves, Flame, Gauge, 
  ShieldCheck, DollarSign, Layers, Compass, GitMerge, FileText
} from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import InsightBulb from './InsightBulb';
import MasterDecisionPipeline from './MasterDecisionPipeline';

export default function DeadheadOptimizer({ selectedDestination, currency, forecast, terminalMetrics = null }) {
  const [activeSubTab, setActiveSubTab] = useState('pipeline'); // 'pipeline', 'tramp', 'all'
  const [selectedLivePort, setSelectedLivePort] = useState(selectedDestination || 'paradip');
  const [selectedBerthedShipMmsi, setSelectedBerthedShipMmsi] = useState('');
  const [matchedId, setMatchedId] = useState(null);
  
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;
  const currSym = isINR ? '₹' : '$';

  // Keep internal active port in sync if selectedDestination prop changes from outside
  useEffect(() => {
    if (selectedDestination) {
      setSelectedLivePort(selectedDestination);
    }
  }, [selectedDestination]);

  // Filter vessels that are discharging at the selected port
  const dischargingVessels = LIVE_AIS_VESSELS.filter(
    v => v.destinationId === selectedLivePort && v.status.includes('Discharging')
  );

  // Auto-select first vessel when port changes
  useEffect(() => {
    if (dischargingVessels.length > 0) {
      setSelectedBerthedShipMmsi(dischargingVessels[0].mmsi);
    } else {
      setSelectedBerthedShipMmsi('');
    }
  }, [selectedLivePort]);

  const activeShip = dischargingVessels.find(v => v.mmsi === selectedBerthedShipMmsi);

  // Filter backhaul routes for current discharge port
  const filteredRoutes = BACKHAUL_OPPORTUNITIES.filter(
    r => r.dischargePort === selectedLivePort
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header with Sub-Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <span>Part C: Idle Scenario Management & Return Tramp Deadheading Elimination</span>
                <InsightBulb
                  title="Part C Operational Engine"
                  subtitle="Inbound Detection ➔ Hop-and-Load ➔ Hull Health"
                  dataset="AISStream + UN COMTRADE + Open-Meteo Marine"
                  logic="Evaluates inbound vessels 7–30 days before arrival. Detects berth congestion early, switches to Virtual Arrival, triggers 100 NM coastal 'Hop-and-Load' hops if no local cargo is found, validates hold-cleaning sea states, and shields against sub-surface biofouling drag."
                  impact="Saves up to $25,000/day in wasted fuel and generates $1.2M+ in export freight arbitrage."
                />
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Closed-Loop Operational Architecture: Inbound Coal Vessel ──► Commercial Optimization ──► Zero-Ballast Resolution
            </p>
          </div>

          <span className="bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold px-3 py-1 rounded-md">
            100% Software • Zero IoT
          </span>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveSubTab('pipeline')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'pipeline'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GitMerge className="w-3.5 h-3.5" />
            <span>1. Master Operational Flowchart (7–30d ETA)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('tramp')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'tramp'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Live Tramp & "Hop-and-Load" Pairs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('all')}
            className={`py-2 px-3 rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-purple-900 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>View All Modules</span>
          </button>
        </div>
      </div>

      {/* MODULE 1: Master Operational Flowchart Simulator */}
      {(activeSubTab === 'pipeline' || activeSubTab === 'all') && (
        <MasterDecisionPipeline 
          currency={currency} 
          selectedPort={selectedLivePort} 
        />
      )}

      {/* MODULE 2: Live Tramp Backhaul & Hop-and-Load Matching */}
      {(activeSubTab === 'tramp' || activeSubTab === 'all') && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Compass className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Live Next-Fixture AI & Coastal Triangulation Directory
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Matches active discharging bulk carriers with export parcels before lines are cast off
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded">
              UN COMTRADE + AIS Live
            </span>
          </div>

          {/* Port & Ship Selector Bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5 bg-purple-50/40 p-3 rounded-lg border border-purple-100">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wide mb-1">
                Select Discharge Port
              </label>
              <select 
                className="w-full text-xs p-2 border border-purple-200 rounded-md bg-white text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                value={selectedLivePort}
                onChange={(e) => setSelectedLivePort(e.target.value)}
              >
                <option value="paradip">Paradip Port (PPT - Odisha)</option>
                <option value="vizag">Visakhapatnam (VPT - Andhra)</option>
                <option value="gangavaram">Gangavaram Port (GPL)</option>
                <option value="dhamra">Dhamra Port (DPCL - Capesize Hub)</option>
                <option value="haldia">Haldia Dock Complex (HDC)</option>
                <option value="gopalpur">Gopalpur Port (GPL-Odisha)</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wide mb-1">
                Live Vessels at Berth (Status: Discharging)
              </label>
              <select 
                className="w-full text-xs p-2 border border-purple-200 rounded-md bg-white text-purple-900 font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                value={selectedBerthedShipMmsi}
                onChange={(e) => setSelectedBerthedShipMmsi(e.target.value)}
              >
                {dischargingVessels.length > 0 ? dischargingVessels.map(ship => (
                  <option key={ship.mmsi} value={ship.mmsi}>
                    {ship.name} ({ship.vesselType}) — {ship.cargo}
                  </option>
                )) : <option value="">No vessels currently discharging at {selectedLivePort}</option>}
              </select>
            </div>
          </div>

          {/* Backhaul Opportunities Grid */}
          {activeShip ? (
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span className="flex items-center">
                  <Anchor className="w-4 h-4 mr-1 text-emerald-600" />
                  Matched Backhaul For {activeShip.name} ({activeShip.vesselType}, {activeShip.dwt.toLocaleString()} DWT)
                </span>
                <span className="text-[10px] font-mono text-slate-500 font-normal">
                  DWT Fit: {(activeShip.dwt * 0.95).toLocaleString()} MT Max Intake
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRoutes.map((route) => {
                  const isMatched = matchedId === route.id;
                  const actualCargoMT = Math.min(route.cargoParcelSizeMT, activeShip.dwt * 0.95);
                  const dynamicTCEBoost = Math.round(route.tceBoostUSDPerDay * (actualCargoMT / route.cargoParcelSizeMT));

                  return (
                    <div
                      key={route.id}
                      className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                        isMatched
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-card ring-2 ring-emerald-400'
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
                          <span>Bound for: <strong className="text-slate-700">{route.destinationRegion}</strong></span>
                        </div>

                        {/* Metrics */}
                        <div className="space-y-1.5 text-xs text-slate-600 tabular-nums pt-2 border-t border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Live Ship Intake:</span>
                            <span className="font-semibold text-slate-800">{actualCargoMT.toLocaleString()} MT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Net TCE Boost:</span>
                            <span className="font-bold text-emerald-600">
                              +{currSym}{(dynamicTCEBoost * multiplier).toFixed(0)} /Day
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ballast Elimination:</span>
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
                          className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                            isMatched
                              ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {isMatched ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Backhaul Fixture Locked & Contract Executed</span>
                            </>
                          ) : (
                            <>
                              <span>Pair Backhaul Parcel</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Contract Clause Confirmation Banner */}
                      {isMatched && (
                        <div className="mt-3 p-3 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-100 text-[11px] font-mono space-y-1.5 animate-fadeIn shadow-md">
                          <div className="flex items-center justify-between text-emerald-300 font-bold uppercase border-b border-emerald-800 pb-1 text-[10px]">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Consecutive Voyage Charter Executed
                            </span>
                            <span className="text-amber-400">REF: NVF-CVC-2026</span>
                          </div>
                          <div className="text-white font-sans text-xs font-bold mt-1">
                            Commercial Rebate Captured: -{currSym}{(2.93 * multiplier).toFixed(1)}/MT Discount
                          </div>
                          <p className="text-[10.5px] text-emerald-200/90 font-sans leading-tight">
                            Logistics Manager instructs master: <strong>{activeShip.name}</strong> locks outbound <strong>{route.exportCargo}</strong> ({route.destinationRegion}). Inbound coal freight discounted, saving <strong>{currSym}{(210000 * multiplier / (isINR ? 100000 : 1)).toFixed(2)} {isINR ? 'Lakhs' : 'USD'}</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic p-4 text-center bg-slate-50 rounded-lg border border-slate-200">
              No live vessels currently discharging at {selectedLivePort}. Select another port above.
            </div>
          )}
        </div>
      )}

      {/* MODULE 4: Strategic Fuel & ESG Directives */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex items-center space-x-2 mb-4 pb-3 border-b border-slate-100">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Strategic Optimization Directives & Fuel Savings Intelligence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Directive 1: Virtual Arrival */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-emerald-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <Flame className="w-4 h-4 mr-1.5 text-emerald-600" />
                1. Eco-Speed & Virtual Arrival JIT
              </div>
              <p className="text-xs text-emerald-950/80 mb-3 leading-relaxed">
                When anchorage queues at {selectedLivePort} exceed 2 days, steaming at 13.5 kts wastes fuel only to sit idle at anchor. Reducing speed to 11.0 kts ("Eco-Speed") cuts daily fuel burn from 29.5 MT/day to 23.0 MT/day VLSFO.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200 text-[11px] font-mono text-emerald-950">
              <span className="font-bold text-emerald-700">LIVE FUEL SAVINGS:</span><br/>
              Saves <strong>6.5 MT VLSFO/day</strong> = <strong className="text-emerald-700">+{currSym}{(4030 * multiplier).toFixed(0)}/day</strong> fuel reduction while aligning ETA with berth slot.
            </div>
          </div>

          {/* Directive 2: IMO CII Carbon Shield */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-teal-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <Leaf className="w-4 h-4 mr-1.5 text-teal-600" />
                2. IMO CII & EU ETS Carbon Shield
              </div>
              <p className="text-xs text-teal-950/80 mb-3 leading-relaxed">
                Sailing empty ballast severely degrades vessel Carbon Intensity Indicator (CII) rating from Grade B down to D/E. Pairing inbound coal with outbound iron ore pellets eliminates empty sailing.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-teal-200 text-[11px] font-mono text-teal-950">
              <span className="font-bold text-teal-700">ENVIRONMENTAL IMPACT:</span><br/>
              Avoids <strong>1,420 MT CO2 emissions</strong> per voyage, shielding shipowner from <strong>$127,800 USD carbon penalties</strong> and CII grade downgrades.
            </div>
          </div>

          {/* Directive 3: Cabotage Waiver */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-indigo-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 mr-1.5 text-indigo-600" />
                3. Indian Cabotage Waiver Coupling
              </div>
              <p className="text-xs text-indigo-950/80 mb-3 leading-relaxed">
                Foreign-flagged vessels discharging import coal at Dhamra/Paradip can utilize Directorate General of Shipping (DGS) cabotage waivers to carry domestic thermal coal down to TANGEDCO power plants in Tamil Nadu.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-indigo-200 text-[11px] font-mono text-indigo-950">
              <span className="font-bold text-indigo-700">COASTAL TRADE LEVERAGE:</span><br/>
              Replaces 4,480 NM empty ballast with a high-yield 780 NM coastal coal leg to Ennore/Tuticorin (<strong>+$480,000 USD revenue</strong>).
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
