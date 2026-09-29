import React, { useState } from 'react';
import LiveShipTrackerMap from '../components/LiveShipTrackerMap';
import { 
  Train, Truck, Fuel, DollarSign, CheckCircle2, Clock, 
  MapPin, Navigation, ArrowRight, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';

export default function MultimodalRailwayMapPage({
  selectedDestination,
  setSelectedDestination,
  selectedVessel,
  cargoVolumeMT,
  currency,
  marketData
}) {
  const isINR = currency === 'INR';
  const fxRate = isINR ? (marketData?.usdInrSpot || 95.93) : 1.0;
  const currSym = isINR ? '₹' : '$';

  // State for 3-Way Optimization Simulation
  const [waitHours, setWaitHours] = useState(36);
  const [diversionPort, setDiversionPort] = useState('dhamra');
  const [inlandMode, setInlandMode] = useState('fois_rail'); // 'fois_rail' | 'freightfox_truck'

  // Cost Modeling
  const parcelMT = cargoVolumeMT || 150000;
  const demurragePerDayUSD = 25000;
  const costADemurrageUSDMT = ((waitHours / 24) * demurragePerDayUSD) / parcelMT;
  const costBBunkerDiversionUSDMT = 3.80; // Extra VLSFO for 120 NM deviation
  const costCRailTariffUSDMT = inlandMode === 'fois_rail' ? 5.20 : 6.85; // FOIS Rake vs FreightFox Truck
  const totalMultimodalUSDMT = costBBunkerDiversionUSDMT + costCRailTariffUSDMT;
  const netSavingsUSDMT = costADemurrageUSDMT - totalMultimodalUSDMT;
  const isDiversionFavorable = netSavingsUSDMT > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Train className="w-4 h-4" />
            <span>Multimodal Decision Engine & Live Telemetry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Multimodal Railway Diversion & Live AIS Map
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            6h ETA Critical Decision Gate: 3-way optimization equation balancing anchorage demurrage against bunker fuel and FOIS rail freight.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>6h ETA Critical Gate: ACTIVE</span>
          </span>
        </div>
      </div>

      {/* 3-Way Optimization Equation (Phase 3 from Flow Diagram) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-5 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              3-Way Optimization Equation & Diversion Decision Gate (6h Threshold)
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated 6 hours prior to pilot boarding: Cost B (Port Diversion Bunker) + Cost C (FOIS 48hr Inland Rail) vs Anchorage Demurrage Cost A.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">Mode:</span>
            <button
              onClick={() => setInlandMode('fois_rail')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                inlandMode === 'fois_rail' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              Indian Railways FOIS
            </button>
            <button
              onClick={() => setInlandMode('freightfox_truck')}
              className={`px-2.5 py-1 rounded font-bold cursor-pointer transition-all ${
                inlandMode === 'freightfox_truck' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              FreightFox Trucking
            </button>
          </div>
        </div>

        {/* 3 Cost Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Cost A: Demurrage Penalty */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Baseline Exposure</div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Cost A: Demurrage Penalty</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Waiting at anchorage for {waitHours} hours @ $25,000/day charter party demurrage clause.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-xs text-slate-500">Demurrage Cost per MT:</div>
              <div className="text-xl font-black text-rose-600 font-mono">
                {currSym}{(costADemurrageUSDMT * fxRate).toFixed(2)} / MT
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Total parcel loss: {currSym}{((costADemurrageUSDMT * fxRate) * parcelMT).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Cost B: Port Diversion Bunker Fuel */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-sky-700">Maritime Re-Routing</div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Cost B: Port Diversion Bunker Fuel</h4>
              <p className="text-[11px] text-slate-600 mt-1">
                Diverting 120 NM to {INDIAN_EAST_COAST_PORTS[diversionPort]?.name || 'Dhamra Port'} at 13.0 knots speed.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-sky-200">
              <div className="text-xs text-slate-500">Bunker Deviation Cost:</div>
              <div className="text-xl font-black text-sky-800 font-mono">
                {currSym}{(costBBunkerDiversionUSDMT * fxRate).toFixed(2)} / MT
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                ICE VLSFO fuel: $632/MT calibrated
              </div>
            </div>
          </div>

          {/* Cost C: Multimodal Inland Rail / Truck */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-emerald-700">Inland Logistics Tariff</div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Cost C: FOIS Rail / Truck Freight</h4>
              <p className="text-[11px] text-slate-600 mt-1">
                {inlandMode === 'fois_rail' 
                  ? 'Indian Railways FOIS 48-hr rake freight tariff directly to plant rake unloader.' 
                  : 'FreightFox road logistics index + PPAC diesel fuel surcharge adjustment.'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-200">
              <div className="text-xs text-slate-500">Inland Logistics Rate:</div>
              <div className="text-xl font-black text-emerald-800 font-mono">
                {currSym}{(costCRailTariffUSDMT * fxRate).toFixed(2)} / MT
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                {inlandMode === 'fois_rail' ? 'FOIS Rail: 4,000 MT per rake' : 'Fleet Trucking: 35 MT per tipper'}
              </div>
            </div>
          </div>

        </div>

        {/* Verdict Banner */}
        <div className="mt-5 p-4 bg-slate-900 text-white rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
              6h THRESHOLD OPTIMIZATION VERDICT
            </div>
            <h4 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
              {isDiversionFavorable ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>EXECUTE MULTIMODAL DIVERSION (Dhamra + FOIS Rakes)</span>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-sky-400" />
                  <span>PROCEED TO CURRENT ANCHORAGE (Virtual Arrival Pacing)</span>
                </>
              )}
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Multimodal cost Cost B ({currSym}{(costBBunkerDiversionUSDMT * fxRate).toFixed(2)}) + Cost C ({currSym}{(costCRailTariffUSDMT * fxRate).toFixed(2)}) = {currSym}{(totalMultimodalUSDMT * fxRate).toFixed(2)}/MT vs Demurrage Cost A ({currSym}{(costADemurrageUSDMT * fxRate).toFixed(2)}/MT).
              {isDiversionFavorable 
                ? ` Net savings: ${currSym}${(netSavingsUSDMT * fxRate).toFixed(2)}/MT (${currSym}${Math.round(netSavingsUSDMT * fxRate * parcelMT).toLocaleString()} on parcel).`
                : ' Anchorage wait is cost-effective; virtual arrival saves bunker fuel.'}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setWaitHours(waitHours === 36 ? 14 : 36)}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/20 cursor-pointer transition-all"
            >
              Simulate {waitHours === 36 ? '14h Low Wait' : '36h High Queue'}
            </button>
          </div>
        </div>
      </div>

      {/* Live AIS Ship Tracking Map & Geofencing Radar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Navigation className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live AIS Ship Tracking & Port Geofencing Radar
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
            OpenStreetMap • Leaflet GIS Live
          </span>
        </div>

        <LiveShipTrackerMap
          selectedDestination={selectedDestination}
          onSelectPort={(portId) => setSelectedDestination(portId)}
          selectedVessel={selectedVessel}
        />
      </div>

    </div>
  );
}
