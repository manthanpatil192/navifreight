import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, CheckCircle2, Sparkles, Leaf, Anchor, MapPin, Zap, TrendingUp, CloudRain, Waves, Flame, Gauge, ShieldCheck, DollarSign } from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import InsightBulb from './InsightBulb';

export default function DeadheadOptimizer({ selectedDestination, currency, forecast, terminalMetrics = null }) {
  const [selectedLivePort, setSelectedLivePort] = useState('paradip');
  const [selectedBerthedShipMmsi, setSelectedBerthedShipMmsi] = useState('');
  const [matchedId, setMatchedId] = useState(null);
  
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;
  const currSym = isINR ? '₹' : '$';

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
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Phase 6: Live Empty Vessel Management (Tramp Backhaul Optimizer)</span>
              <InsightBulb
                title="Phase 6: Live Tramp Routing"
                subtitle="Proactive Next-Fixture Engine"
                dataset="Live AIS + UN COMTRADE"
                logic="Unlike traditional brokers who wait for a ship to be empty, we match live vessels *while they are still discharging*. This locks in the exact export cargo (e.g., Paradip Iron Ore) that perfectly matches the vessel's live draft constraints."
                impact="Saves up to $25k/day in fuel from deadheading and perfectly aligns local cabotage/export requirements."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sources: AISStream.io + UN COMTRADE Bilateral Trade Flows
          </p>
        </div>

        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 rounded-md">
          Live Next-Fixture AI
        </span>
      </div>

      {/* Overview Explanation */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 mb-5 text-xs text-slate-600 flex items-start space-x-3">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Tramp Return Voyage Intelligence:</span> Select a live discharging vessel below. Our engine instantly pairs it with outbound exports that fit its exact dimensions, elevating Round-Voyage Time Charter Equivalent (TCE) earnings before the ship even drops its lines.
        </div>
      </div>

      {/* Live Selectors */}
      <div className="flex gap-4 mb-6 bg-blue-50/30 p-3 rounded-lg border border-blue-100">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1">Select Discharging Port</label>
          <select 
            className="w-full text-sm p-2 border border-blue-200 rounded-md bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedLivePort}
            onChange={(e) => setSelectedLivePort(e.target.value)}
          >
            <option value="paradip">Paradip Port (PPT)</option>
            <option value="vizag">Visakhapatnam (VPT)</option>
            <option value="gangavaram">Gangavaram Port</option>
            <option value="dhamra">Dhamra Port</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wide mb-1">Live Vessels at Berth (Status: Discharging)</label>
          <select 
            className="w-full text-sm p-2 border border-blue-200 rounded-md bg-white text-blue-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedBerthedShipMmsi}
            onChange={(e) => setSelectedBerthedShipMmsi(e.target.value)}
          >
            {dischargingVessels.length > 0 ? dischargingVessels.map(ship => (
              <option key={ship.mmsi} value={ship.mmsi}>
                {ship.name} ({ship.vesselType}) — {ship.cargo}
              </option>
            )) : <option value="">No vessels currently discharging</option>}
          </select>
        </div>
      </div>

      {/* Backhaul Opportunities Grid */}
      {activeShip ? (
        <div className="mb-6">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center">
            <Anchor className="w-4 h-4 mr-1 text-emerald-600" />
            Matched Backhaul For {activeShip.name} ({activeShip.vesselType}, {activeShip.dwt.toLocaleString()} DWT)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRoutes.map((route) => {
              const isMatched = matchedId === route.id;
              // Adjust cargo parcel based on vessel DWT
              const actualCargoMT = Math.min(route.cargoParcelSizeMT, activeShip.dwt * 0.95);
              const dynamicTCEBoost = Math.round(route.tceBoostUSDPerDay * (actualCargoMT / route.cargoParcelSizeMT));

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
                        <span className="text-slate-500">Live Ship Intake:</span>
                        <span className="font-semibold text-slate-800">{actualCargoMT.toLocaleString()} MT (Fits {activeShip.vesselType})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Net TCE Boost:</span>
                        <span className="font-bold text-emerald-600">
                          +{isINR ? `₹${(dynamicTCEBoost * multiplier).toFixed(0)}` : `$${dynamicTCEBoost.toLocaleString()}`} /Day
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

                  {/* Market Timing Advisory (Linked to Part A Forecast) */}
                  {forecast && (
                    <div className={`mt-3 p-2 rounded text-[10.5px] leading-snug border ${
                      forecast.trendDirection === 'Falling' 
                        ? 'bg-rose-50 border-rose-200 text-rose-800' 
                        : forecast.trendDirection === 'Rising'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}>
                      <div className="font-bold flex items-center mb-0.5">
                        <TrendingUp className={`w-3 h-3 mr-1 ${forecast.trendDirection === 'Falling' ? 'rotate-180' : ''}`} />
                        Dynamic Market Advisory
                      </div>
                      {forecast.trendDirection === 'Falling' 
                        ? 'Market Rates Falling: Lock in this backhaul IMMEDIATELY today to secure the current rate.' 
                        : forecast.trendDirection === 'Rising'
                          ? 'Market Rates Rising: Consider waiting 24-48 hours before fixing this backhaul to capture higher rates.'
                          : 'Market Stable: Proceed with booking now to minimize idle time.'}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setMatchedId(isMatched ? null : route.id)}
                      className={`w-full py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                        isMatched
                          ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isMatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Backhaul Locked & Paired for {activeShip ? activeShip.name : 'Vessel'}</span>
                        </>
                      ) : (
                        <>
                          <span>Pair Tramp Backhaul</span>
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Operational Execution Confirmation Banner when Locked */}
                  {isMatched && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-100 text-[11px] font-mono space-y-1.5 animate-fadeIn shadow-md">
                      <div className="flex items-center justify-between text-emerald-300 font-bold uppercase border-b border-emerald-800 pb-1 text-[10px]">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Charter Party Contract Clause Generated
                        </span>
                        <span className="text-amber-400">REF: CVC-NVF-2026</span>
                      </div>
                      <div className="text-white font-sans text-xs font-bold mt-1">
                        Commercial Rebate Executed: -{currSym}{(2.93 * multiplier).toFixed(1)}/MT Freight Discount Captured!
                      </div>
                      <p className="text-[10.5px] text-emerald-200/90 font-sans leading-tight">
                        Logistics Manager instructs broker: <strong>{activeShip ? activeShip.name : 'Vessel'}</strong> locks consecutive voyage charter for <strong>{route.exportCargo}</strong> ({route.destinationRegion}). Inbound coal freight reduced from {currSym}{(14.85 * multiplier).toFixed(1)} to {currSym}{(11.92 * multiplier).toFixed(1)}/MT. Net savings: <strong>{currSym}{(210000 * multiplier / (isINR ? 100000 : 1)).toFixed(2)} {isINR ? 'Lakhs' : 'USD'}</strong>.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
            
            {filteredRoutes.length === 0 && (
              <div className="col-span-full text-sm text-slate-500 italic p-3 bg-slate-50 rounded-md border border-slate-200">
                No standard backhaul cargo matched for this port. See advanced options below.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500 italic p-3 mb-6 bg-slate-50 rounded-md border border-slate-200">
          No live vessels currently discharging at {selectedLivePort}. Try selecting another port.
        </div>
      )}

      {/* ESSENTIAL MARITIME OPTIMIZATION SUGGESTIONS (PART C ESSENTIALS) */}
      <div className="border-t border-slate-200 pt-5 mt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Phase 6 Strategic Optimization Directives & Fuel Savings Intelligence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Suggestion 1: Eco-Speed Sailing & JIT Virtual Arrival */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-emerald-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <Flame className="w-4 h-4 mr-1.5 text-emerald-600" />
                1. Eco-Speed & Virtual Arrival JIT
              </div>
              <p className="text-xs text-emerald-950/80 mb-3 leading-relaxed">
                When anchorage queues at {selectedLivePort} are high (2.8d wait), steaming at 13.5 kts full speed wastes fuel only to sit idle at anchor. Reducing speed to 11.0 kts ("Eco-Speed") cuts daily fuel burn from 29.5 MT/day to 23.0 MT/day VLSFO.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-emerald-200 text-[11px] font-mono text-emerald-950">
              <span className="font-bold text-emerald-700">LIVE FUEL SAVINGS:</span><br/>
              Saves <strong>6.5 MT VLSFO/day</strong> = <strong className="text-emerald-700">+$4,030 USD (₹3.48 Lakhs/day)</strong> fuel reduction while aligning ETA with berth slot.
            </div>
          </div>

          {/* Suggestion 2: IMO CII Carbon Intensity & ESG Tax Shield */}
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
              Avoids <strong>1,420 MT CO2 emissions</strong> per voyage, shielding shipowner from <strong>$127,800 USD EU ETS carbon taxes</strong> and CII grade downgrades.
            </div>
          </div>

          {/* Suggestion 3: Bunker Price Arbitrage Positioning */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-rose-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <Zap className="w-4 h-4 mr-1.5 text-rose-600" />
                3. Bunker Refueling Arbitrage
              </div>
              <p className="text-xs text-rose-950/80 mb-3 leading-relaxed">
                Indian East Coast bunker prices ($645/MT) carry a $22–$25/MT premium over international bunkering hubs. Vessels awaiting spot orders should refuel at off-route anchorages.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-rose-200 text-[11px] font-mono text-rose-950">
              <span className="font-bold text-rose-700">REFUELS STRATEGY:</span><br/>
              Sail at eco-speed to Singapore/Colombo anchorage (VLSFO: <strong>-$25/MT cheaper</strong> than India) to refuel while awaiting next spot order.
            </div>
          </div>

          {/* Suggestion 4: DGS Indian Cabotage Waiver Coupling */}
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-4 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center text-indigo-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <MapPin className="w-4 h-4 mr-1.5 text-indigo-600" />
                4. Indian Cabotage Waiver Coupling
              </div>
              <p className="text-xs text-indigo-950/80 mb-3 leading-relaxed">
                Foreign-flagged vessels discharging import coal at Dhamra/Paradip can utilize Directorate General of Shipping (DGS) cabotage waivers to carry domestic thermal coal down to TANGEDCO power plants in Tamil Nadu.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-indigo-200 text-[11px] font-mono text-indigo-950">
              <span className="font-bold text-indigo-700">COASTAL TRADE LEVERAGE:</span><br/>
              Replaces 4,480 NM empty ballast to Mozambique with a high-yield 780 NM coastal coal leg to Ennore/Tuticorin (<strong>+$480,000 USD revenue</strong>).
            </div>
          </div>

          {/* Suggestion 5: Monsoon "Wet Coal" & Demurrage Shield */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 flex flex-col justify-between shadow-xs md:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-center text-amber-900 font-bold text-xs mb-2 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-amber-600" />
                5. Monsoon Discharge & Demurrage Shield
              </div>
              <p className="text-xs text-amber-950/80 mb-3 leading-relaxed">
                Monsoon rains slow grab-crane coal discharge rates by 40% ("Wet Coal Penalty"). NaviFreight shifts vessels to PPT Mechanized Ore Berth (`CQ-1/CQ-2`) equipped with high-speed 4,500 TPH conveyers and inserts 96h Weather Working Day (WWD) clauses into charter parties.
              </p>
            </div>
            <div className="bg-white/80 p-2.5 rounded border border-amber-200 text-[11px] font-mono text-amber-950">
              <span className="font-bold text-amber-700">DEMURRAGE PROTECTION:</span><br/>
              Eliminates <strong>₹21.62 Lakhs/day demurrage penalties</strong> ($25,000/day) and unlocks up to <strong>₹15–30 Lakhs in Dispatch Rewards</strong> for fast vessel turnaround.
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

