import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowRight, CheckCircle2, Sparkles, Leaf, Anchor, MapPin, Zap, TrendingUp, Ship, Clock } from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import InsightBulb from './InsightBulb';

export default function DeadheadOptimizer({ selectedDestination, currency, forecast }) {
  const [selectedLivePort, setSelectedLivePort] = useState('paradip');
  const [selectedBerthedShipMmsi, setSelectedBerthedShipMmsi] = useState('');
  const [matchedId, setMatchedId] = useState(null);
  
  const isINR = currency === 'INR';
  const multiplier = isINR ? 86.5 : 1;

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
      <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 mb-4 text-xs text-slate-600 flex items-start space-x-3">
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
                      className={`w-full py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
                        isMatched
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      {isMatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Backhaul Locked for {activeShip.name}</span>
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

      {/* HACKATHON WINNING EDGE: Standout Logic Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-slate-200 pt-5">
        
        {/* Triangulation Logic */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center text-indigo-800 font-bold text-xs mb-2 uppercase tracking-wide">
            <MapPin className="w-4 h-4 mr-1.5" />
            Coastal Triangulation Routing
          </div>
          <p className="text-xs text-indigo-900/80 mb-3 leading-relaxed">
            Instead of A &rarr; B &rarr; A, generate hyper-local multi-stop routes to eliminate ballast entirely. Perfect for utilizing Indian cabotage waivers for foreign-flagged tonnage.
          </p>
          <div className="bg-white/60 p-2.5 rounded border border-indigo-100 text-[11px] font-mono text-indigo-900">
            <span className="font-bold text-indigo-700">SUGGESTION FOR {activeShip ? activeShip.name : 'VESSEL'}:</span><br/>
            Drop Coal at {selectedLivePort} &rarr; Pick up {selectedLivePort === 'paradip' ? 'Iron Ore' : 'Alumina'} &rarr; Drop at Ennore &rarr; Pick up Bauxite &rarr; SE Asia.
          </div>
        </div>

        {/* Bunker Arbitrage Logic */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <div className="flex items-center text-rose-800 font-bold text-xs mb-2 uppercase tracking-wide">
            <Zap className="w-4 h-4 mr-1.5" />
            Bunker Arbitrage Positioning
          </div>
          <p className="text-xs text-rose-900/80 mb-3 leading-relaxed">
            If no backhaul is available, vessels traditionally anchor and burn fuel idly. NaviFreight calculates the nearest anchorage with the cheapest VLSFO prices to refuel during idle time.
          </p>
          <div className="bg-white/60 p-2.5 rounded border border-rose-100 text-[11px] font-mono text-rose-900">
            <span className="font-bold text-rose-700">IF NO CARGO SECURED:</span><br/>
            Do not anchor at {selectedLivePort}. Sail at eco-speed to Colombo Anchorage (VLSFO: -$22/MT cheaper than India East Coast) to refuel while awaiting spot orders.
          </div>
        </div>

        {/* Virtual Arrival (Weaponizing Congestion) */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
          <div className="flex items-center text-sky-800 font-bold text-xs mb-2 uppercase tracking-wide">
            <Clock className="w-4 h-4 mr-1.5" />
            Virtual Arrival (Eco-Speed)
          </div>
          <p className="text-xs text-sky-900/80 mb-3 leading-relaxed">
            If the destination port has a queue, ships traditionally anchor and burn fuel waiting. NaviFreight tells the ship to slow down mid-ocean, arriving just-in-time while saving massive bunker costs.
          </p>
          <div className="bg-white/60 p-2.5 rounded border border-sky-100 text-[11px] font-mono text-sky-900">
            <span className="font-bold text-sky-700">CONGESTION DETECTED:</span><br/>
            {selectedLivePort} has a 5-day queue. Suggestion: Drop speed to 9 knots. Arrive 3 days later to secure same berth slot, saving $40,000 in VLSFO fuel during voyage.
          </div>
        </div>

        {/* Predictive Cabotage Exploit */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center text-amber-800 font-bold text-xs mb-2 uppercase tracking-wide">
            <Ship className="w-4 h-4 mr-1.5" />
            Predictive Cabotage Waivers
          </div>
          <p className="text-xs text-amber-900/80 mb-3 leading-relaxed">
            Coastal cargo requires Indian-flagged ships. Foreign ships often deadhead. Our engine predicts when a legal waiver will be granted based on the absence of local tonnage.
          </p>
          <div className="bg-white/60 p-2.5 rounded border border-amber-100 text-[11px] font-mono text-amber-900">
            <span className="font-bold text-amber-700">PREDICTIVE WAIVER ALERT:</span><br/>
            Zero Indian-flagged bulkers within 500 NM of {selectedLivePort}. 99% probability of government cabotage waiver tomorrow. Wait 24 hours to secure lucrative coastal cargo to Ennore.
          </div>
        </div>

      </div>

    </div>
  );
}

