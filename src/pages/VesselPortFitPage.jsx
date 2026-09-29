import React from 'react';
import VesselOptimization from '../components/VesselOptimization';
import { Ship, Anchor, Compass, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function VesselPortFitPage({
  selectedOrigin,
  selectedDestination,
  cargoVolumeMT,
  currency,
  selectedVessel,
  setSelectedVessel,
  setSelectedDestination
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Anchor className="w-4 h-4" />
            <span>Infrastructure Engineering Gateway</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vessel Suitability & Port Feasibility Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Validating vessel classes against East Coast Indian port permissible draft, LOA, beam, and daily discharge rates (TPD).
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Draft & TPD Constraints Enforced</span>
          </span>
        </div>
      </div>

      {/* Entire Part B: Vessel Optimization Component */}
      <VesselOptimization
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        cargoVolumeMT={cargoVolumeMT}
        currency={currency}
        onSelectVessel={setSelectedVessel}
        currentVesselId={selectedVessel}
        onSelectPort={(portId) => setSelectedDestination(portId)}
      />

    </div>
  );
}
