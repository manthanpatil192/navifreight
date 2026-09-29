import React, { useState } from 'react';
import CargoToHoldMatcher from '../components/CargoToHoldMatcher';
import DeadheadOptimizer from '../components/DeadheadOptimizer';
import { 
  Ship, Gauge, Compass, CheckCircle2, Clock, 
  Layers, ArrowRight, Building, Award, ShieldCheck 
} from 'lucide-react';

export default function CargoMatchingPage({
  selectedDestination,
  setSelectedDestination,
  currency,
  forecast,
  terminalMetrics,
  activeNewsSignal
}) {
  const [selectedPlant, setSelectedPlant] = useState('sail_rourkela');
  const [activeTab, setActiveTab] = useState('backhaul_routing'); // 'backhaul_routing' | 'hold_matching'

  const PLANT_PROFILES = [
    {
      id: 'rinl_vizag',
      name: 'RINL Visakhapatnam Steel Plant',
      location: 'Vizag, Andhra Pradesh',
      specRequired: 'Hard Coking Coal (CSR > 66%, Ash < 9.5%, VM 21-24%)',
      dailyBurn: '18,500 MT / day',
      bufferDays: '9.2 Days',
      status: 'High Priority Allocation'
    },
    {
      id: 'sail_rourkela',
      name: 'SAIL Rourkela Steel Plant (RSP)',
      location: 'Rourkela, Odisha',
      specRequired: 'Queensland Prime Coking Coal (CSR > 68%, Moisture < 8.5%)',
      dailyBurn: '14,200 MT / day',
      bufferDays: '6.4 Days (Critical)',
      status: 'Emergency Rake Dispatch'
    },
    {
      id: 'tata_kalinganagar',
      name: 'Tata Steel Kalinganagar (TSK)',
      location: 'Jajpur, Odisha',
      specRequired: 'Low-Volatile PCI & Premium Hard Coking Blend',
      dailyBurn: '12,800 MT / day',
      bufferDays: '14.5 Days',
      status: 'Optimal Buffer'
    },
    {
      id: 'ntpc_thermal',
      name: 'NTPC Super Thermal Power Station',
      location: 'Talcher / Ramagundam',
      specRequired: 'Non-Coking Thermal Grade (GCV 4200-4800 kcal/kg)',
      dailyBurn: '22,000 MT / day',
      bufferDays: '7.8 Days',
      status: 'Steady Replenishment'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Berth Discharge & Coastal Optimization</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Berth Discharge, Cargo Matching & Coastal Hop Triangulation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            2,000 MT/hr discharge rate, demurrage clock cessation, coal spec allocation to PSU plants, and Wetzel & Tierney backhaul triangulation.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-purple-50 text-purple-800 border border-purple-200 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Triangulation Engine: ACTIVE (18.4% Rebate)</span>
          </span>
        </div>
      </div>

      {/* Top Architecture Summary: Berth Discharge & Plant Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Step 4.1: Berth Discharge & Demurrage Clock Stop (4 Cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-sky-600" />
              Berth Discharge Clock
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
              CLOCK STOPPED
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
            <div className="text-[10.5px] uppercase font-bold text-slate-500">Mechanized Conveyor Speed</div>
            <div className="text-3xl font-black text-slate-900 my-1 font-mono">
              2,000 <span className="text-sm font-bold text-slate-500">MT / hr</span>
            </div>
            <p className="text-[11px] text-slate-600">
              High-throughput continuous grab unloader eliminates port bottlenecks.
            </p>
          </div>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Standard 150k MT Turnaround:</span>
              <span className="font-mono font-bold text-slate-900">75.0 Hours (3.1 Days)</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Demurrage Clock Stop:</span>
              <span className="font-semibold text-emerald-700">Instant on Pilot Boarding</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500">EEXI Berth Emission Mode:</span>
              <span className="font-semibold text-sky-700">Cold-Ironing Shore Power</span>
            </div>
          </div>
        </div>

        {/* Step 4.2: Cargo Matching to Plants (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-subtle">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <span className="text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-purple-600" />
              Cargo Matching: Coal Specifications to Consignee Plants
            </span>
            <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-bold border border-purple-200">
              Direct Rake Allocation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PLANT_PROFILES.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedPlant(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedPlant === p.id
                    ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-300/40 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    p.status.includes('Emergency') || p.status.includes('Critical')
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[10.5px] text-slate-500 mb-2">{p.location}</div>
                <div className="text-[11px] font-medium text-purple-950 bg-white p-2 rounded-lg border border-purple-100 mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Spec Requirement:</span>
                  {p.specRequired}
                </div>
                <div className="flex justify-between text-[10.5px] text-slate-600 font-mono">
                  <span>Burn: {p.dailyBurn}</span>
                  <span className="font-bold text-slate-800">Buffer: {p.bufferDays}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Sub-Tabs: Switch between Tramp Return Optimizer and Cargo-to-Hold Matcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('backhaul_routing')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'backhaul_routing'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Coastal Hop Triangulation & Tramp Return Optimizer (Wetzel & Tierney 2020)
        </button>
        <button
          onClick={() => setActiveTab('hold_matching')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'hold_matching'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Berthed Fleet Cargo-to-Hold Allocation Engine
        </button>
      </div>

      {/* Tab 1: Coastal Hop Triangulation & Tramp Return */}
      {activeTab === 'backhaul_routing' && (
        <DeadheadOptimizer
          selectedDestination={selectedDestination}
          currency={currency}
          forecast={forecast}
          terminalMetrics={terminalMetrics}
          activeNewsSignal={activeNewsSignal}
          onSelectPort={(portId) => setSelectedDestination(portId)}
        />
      )}

      {/* Tab 2: Cargo to Hold Matcher */}
      {activeTab === 'hold_matching' && (
        <CargoToHoldMatcher
          currency={currency}
          onSelectShip={(ship) => console.log('Selected ship for hold match:', ship)}
        />
      )}

    </div>
  );
}
