import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, ArrowRight, CheckCircle2, Sparkles, Leaf, Anchor, 
  MapPin, Zap, TrendingUp, CloudRain, Waves, Flame, Gauge, 
  Layers, Compass, AlertTriangle, Factory, Ship, Database
} from 'lucide-react';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import InsightBulb from './InsightBulb';
import CargoToHoldMatcher from './CargoToHoldMatcher';

export default function DeadheadOptimizer({ selectedDestination, currency, forecast, terminalMetrics = null, activeNewsSignal = null, onSelectPort = null }) {
  const [selectedLivePort, setSelectedLivePort] = useState(selectedDestination || 'paradip');
  const [selectedBerthedShipMmsi, setSelectedBerthedShipMmsi] = useState('563112000'); // MV OLYMPIC GLORY (Default)
  
  const isINR = currency === 'INR';
  const multiplier = isINR ? 95.0 : 1;
  const currSym = isINR ? '₹' : '$';

  // Keep internal active port in sync if selectedDestination prop changes from outside
  useEffect(() => {
    if (selectedDestination) {
      setSelectedLivePort(selectedDestination);
    }
  }, [selectedDestination]);

  // Vessels present at the selected port (at berth, discharging, or waiting in port roads)
  const portVessels = useMemo(() => {
    const list = LIVE_AIS_VESSELS.filter(
      v => v.destinationId === selectedLivePort && (
        v.status.toLowerCase().includes('berth') || 
        v.status.toLowerCase().includes('discharg') || 
        v.status.toLowerCase().includes('anchor')
      )
    );
    return list.length > 0 ? list : LIVE_AIS_VESSELS.filter(v => v.destinationId === selectedLivePort);
  }, [selectedLivePort]);

  // Active Ship Object: Always dynamically resolves to the selected MMSI
  const activeShip = useMemo(() => {
    return LIVE_AIS_VESSELS.find(v => v.mmsi === selectedBerthedShipMmsi) ||
      portVessels[0] ||
      LIVE_AIS_VESSELS[0];
  }, [selectedBerthedShipMmsi, portVessels]);



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

      </div>

      {/* Interactive Cargo-to-Hold Matcher (Coastal Triangulation Engine) */}
      <CargoToHoldMatcher 
        currency={currency} 
        selectedMmsi={selectedBerthedShipMmsi}
        onSelectShip={(ship) => {
          setSelectedBerthedShipMmsi(ship.mmsi);
          if (ship.destinationId) {
            setSelectedLivePort(ship.destinationId);
            if (onSelectPort) onSelectPort(ship.destinationId);
          }
        }}
      />

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
