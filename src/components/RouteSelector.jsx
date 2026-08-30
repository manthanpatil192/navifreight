import React from 'react';
import { Anchor, Navigation, Calendar, Package, Layers, Sliders, Info, Compass } from 'lucide-react';
import { ORIGIN_LOADING_PORTS, INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { VESSEL_CLASSES } from '../data/vesselTypes';
import InsightBulb from './InsightBulb';

export default function RouteSelector({
  selectedOrigin,
  setSelectedOrigin,
  selectedDestination,
  setSelectedDestination,
  selectedVessel,
  setSelectedVessel,
  cargoType,
  setCargoType,
  cargoVolumeMT,
  setCargoVolumeMT,
  contractHorizonMonths,
  setContractHorizonMonths,
  volatilityIndex,
  setVolatilityIndex
}) {
  const origin = ORIGIN_LOADING_PORTS[selectedOrigin];
  const dest = INDIAN_EAST_COAST_PORTS[selectedDestination];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-maritime-800" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
            <span>Phase 1: Cargo & Trade Route Configurator</span>
            <InsightBulb
              title="Phase 1: User Inputs & Trade Route Parameters"
              subtitle="Setting up the Procurement Envelope"
              dataset="DGCIS Import Invoices + World Bank Pink Sheet"
              logic="Captures cargo parcel volume, global origin hub (e.g. Australia Hay Point, US Hampton Roads, Mozambique Maputo), discharge port, and contract horizon. Dynamically computes one-way sailing distance, speed-dependent transit days, and base bunker fuel requirements."
              impact="Allows procurement managers to instantly model different parcel sizes (30k to 200k MT) and evaluate multi-voyage contract requirements."
            />
          </h2>
        </div>
        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded font-medium">
          Distance: <span className="font-semibold text-slate-800">{origin.distanceToEastCoastNM} NM</span> (~{origin.transitDaysAverage} Days)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Origin Loading Port */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center">
              <Anchor className="w-3.5 h-3.5 mr-1 text-maritime-700" />
              Origin Loading Port
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Global Hub</span>
          </label>
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-maritime-800 focus:border-transparent transition-all shadow-xs"
          >
            {Object.values(ORIGIN_LOADING_PORTS).map((port) => (
              <option key={port.id} value={port.id}>
                {port.name} - {port.country}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            {origin.primaryCargo} • Max Draft: {origin.maxDraft}m
          </p>
        </div>

        {/* 2. Destination Indian East Coast Port */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center">
              <Navigation className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Destination Port (India East Coast)
            </span>
            <span className="text-[10px] text-slate-400 font-normal">Discharge</span>
          </label>
          <select
            value={selectedDestination}
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-maritime-800 focus:border-transparent transition-all shadow-xs"
          >
            {Object.values(INDIAN_EAST_COAST_PORTS).map((port) => (
              <option key={port.id} value={port.id}>
                {port.name} ({port.state})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Max Draft: {dest.maxDraftLaden}m ({dest.maxDraftHighTide}m Tide) • {dest.handlingRateTPD.toLocaleString()} TPD
          </p>
        </div>

        {/* 3. Cargo Volume & Parcel Selection */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1.5">
            <span className="flex items-center">
              <Package className="w-3.5 h-3.5 mr-1 text-slate-600" />
              Cargo Parcel Size
            </span>
            <span className="font-bold text-maritime-900 tabular-nums">
              {cargoVolumeMT.toLocaleString()} MT
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="30000"
              max="200000"
              step="5000"
              value={cargoVolumeMT}
              onChange={(e) => setCargoVolumeMT(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-maritime-900"
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-slate-400 font-medium">
            <button type="button" onClick={() => setCargoVolumeMT(55000)} className="hover:text-slate-700">55k (Supra)</button>
            <button type="button" onClick={() => setCargoVolumeMT(75000)} className="hover:text-slate-700">75k (Panamax)</button>
            <button type="button" onClick={() => setCargoVolumeMT(120000)} className="hover:text-slate-700">120k (Cape)</button>
            <button type="button" onClick={() => setCargoVolumeMT(160000)} className="hover:text-slate-700">160k (Full)</button>
          </div>
        </div>

        {/* 4. Contract Horizon / Charter Mode */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-maritime-800" />
              Contract Duration (COA)
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
              Cost Saver
            </span>
          </label>
          <select
            value={contractHorizonMonths}
            onChange={(e) => setContractHorizonMonths(Number(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-maritime-800 focus:border-transparent transition-all shadow-xs"
          >
            <option value={1}>Single Spot Voyage (1-Month)</option>
            <option value={3}>3-Month Multiple Voyage (Recommended COA)</option>
            <option value={6}>6-Month Mid-Term Contract of Affreightment</option>
            <option value={12}>12-Month Annual Volume Framework</option>
          </select>
          <p className="mt-1 text-[11px] text-emerald-600 font-medium">
            {contractHorizonMonths === 1 ? 'Reactive daily spot pricing' : `Locks in ~${contractHorizonMonths === 3 ? '12%' : contractHorizonMonths === 6 ? '16%' : '19%'} discount vs spot escalation`}
          </p>
        </div>

      </div>

    </div>
  );
}
