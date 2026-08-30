import React from 'react';
import { Compass, Navigation, Anchor, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';

export default function InteractiveRouteMap({ selectedOrigin, selectedDestination }) {
  const origin = ORIGIN_LOADING_PORTS[selectedOrigin];
  const dest = INDIAN_EAST_COAST_PORTS[selectedDestination];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Maritime Corridor Telemetry & Trade Lane Dynamics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AIS-tracked bulk trade corridor: <span className="font-semibold text-slate-700">{origin.name}</span> to <span className="font-semibold text-slate-700">{dest.name}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="bg-slate-100 px-2.5 py-1 rounded font-semibold text-slate-700 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-maritime-700" />
            Transit: ~{origin.transitDaysAverage} Days (12.8 kts)
          </span>
          <span className="bg-maritime-50 text-maritime-800 px-2.5 py-1 rounded font-semibold border border-maritime-200">
            {origin.distanceToEastCoastNM.toLocaleString()} Nautical Miles
          </span>
        </div>
      </div>

      {/* SVG Interactive Route Diagram */}
      <div className="relative bg-slate-50/70 border border-slate-200 rounded-lg p-6 overflow-hidden">
        
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Origin Node */}
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm w-full md:w-64 text-center md:text-left">
            <div className="flex items-center space-x-2 text-xs font-bold text-maritime-900 mb-1">
              <Anchor className="w-4 h-4 text-maritime-700 shrink-0" />
              <span>ORIGIN: {origin.name}</span>
            </div>
            <div className="text-[11px] text-slate-500 mb-2">
              {origin.region}, {origin.country}
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2 tabular-nums">
              <div className="flex justify-between">
                <span>Max Draft:</span>
                <span className="font-semibold">{origin.maxDraft}m</span>
              </div>
              <div className="flex justify-between">
                <span>Loading TPD:</span>
                <span className="font-semibold">{origin.handlingRateTPD.toLocaleString()} MT/day</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Primary Cargo:</span>
                <span className="font-medium truncate max-w-[120px]">{origin.primaryCargo}</span>
              </div>
            </div>
          </div>

          {/* Center Route Path Graphic */}
          <div className="flex-1 w-full flex flex-col items-center justify-center px-4">
            
            {/* Choke Points / Sea Lane Badges */}
            <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-medium mb-2">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                {selectedOrigin.includes('indonesia') ? 'Sunda / Lombok Strait' : selectedOrigin.includes('hay') ? 'Torres / Lombok Strait' : selectedOrigin.includes('hampton') ? 'Cape of Good Hope' : 'Indian Ocean Lane'}
              </span>
              <span>→</span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                Bay of Bengal Outer Approaches
              </span>
            </div>

            {/* Visual Animated Wave Line */}
            <div className="w-full relative flex items-center justify-center my-2">
              <div className="w-full h-0.5 bg-slate-300 relative">
                <div className="absolute top-0 left-0 h-full bg-emerald-500 w-3/4 animate-pulse"></div>
              </div>
              <div className="absolute bg-maritime-900 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 shadow-sm">
                <Navigation className="w-3 h-3 text-emerald-400 rotate-90" />
                <span>{origin.distanceToEastCoastNM} NM</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 font-medium mt-1 text-center">
              Eco-Steaming (12.8 kts) • Bunker Consumption: ~{Math.round(origin.transitDaysAverage * 33)} MT VLSFO
            </div>
          </div>

          {/* Destination Node */}
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm w-full md:w-64 text-center md:text-left">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 mb-1">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>DISCHARGE: {dest.name}</span>
            </div>
            <div className="text-[11px] text-slate-500 mb-2">
              {dest.state}, India East Coast
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2 tabular-nums">
              <div className="flex justify-between">
                <span>Berth Max Draft:</span>
                <span className="font-semibold">{dest.maxDraftLaden}m ({dest.maxDraftHighTide}m Tide)</span>
              </div>
              <div className="flex justify-between">
                <span>Discharge TPD:</span>
                <span className="font-semibold">{dest.handlingRateTPD.toLocaleString()} MT/day</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Anchorage Wait:</span>
                <span className="font-medium">{dest.avgWaitDays} Days avg</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
