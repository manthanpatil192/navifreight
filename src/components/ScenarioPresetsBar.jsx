import React from 'react';
import { PlayCircle, Compass, AlertTriangle, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

const PRESET_SCENARIOS = [
  {
    id: 'aus_paradip_cape',
    title: 'Case 1: Australia → Paradip Coking Coal (Peak Restocking)',
    badge: 'HIGH DEMURRAGE RISK',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
    description: '150k MT Capesize cargo facing 14 vessels at Paradip anchorage + IMD low pressure warning. Model recommends locking 6M COA & evaluating Gangavaram switch.',
    config: {
      origin: 'hay_point',
      destination: 'paradip',
      vessel: 'capesize',
      cargoVolumeMT: 150000,
      horizon: 6,
      cargoType: 'coking_coal'
    }
  },
  {
    id: 'indo_haldia_handy',
    title: 'Case 2: Indonesia → Haldia Thermal Coal (7.8m Lock Gate)',
    badge: 'TIDAL LOCK CONSTRAINT',
    badgeCls: 'bg-blue-100 text-blue-800 border-blue-300',
    description: '55k MT thermal coal to Haldia. Model detects 7.8m river lock limit, prevents Capesize grounding, and routes to Handysize / Sagar Anchorage transshipment.',
    config: {
      origin: 'samarinda_taboneo',
      destination: 'haldia',
      vessel: 'handysize',
      cargoVolumeMT: 55000,
      horizon: 3,
      cargoType: 'thermal_coal'
    }
  },
  {
    id: 'usa_vizag_cape',
    title: 'Case 3: US East Coast → Vizag Met Coal (Cape of Good Hope)',
    badge: 'OPTIMAL CAPESIZE ENTRY',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: '160k MT high-vol met coal from Hampton Roads. Deep draft outer harbour at Vizag allows full Cape discharge with 0 demurrage delay.',
    config: {
      origin: 'hampton_roads',
      destination: 'vizag',
      vessel: 'capesize',
      cargoVolumeMT: 160000,
      horizon: 6,
      cargoType: 'coking_coal'
    }
  }
];

export default function ScenarioPresetsBar({
  selectedOrigin,
  selectedDestination,
  selectedVessel,
  onApplyScenario
}) {
  return (
    <div className="bg-slate-900 text-white rounded-lg p-4 mb-6 shadow-md border border-slate-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            One-Click Problem Study Scenarios (Directly from SIH26006 Research)
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Click any preset to simulate live freight swings, port bottlenecks, and COA arbitrage
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESET_SCENARIOS.map((scenario) => {
          const isCurrent = 
            selectedOrigin === scenario.config.origin &&
            selectedDestination === scenario.config.destination &&
            selectedVessel === scenario.config.vessel;

          return (
            <div
              key={scenario.id}
              onClick={() => onApplyScenario(scenario.config)}
              className={`rounded-lg p-3.5 cursor-pointer transition-all border text-left flex flex-col justify-between ${
                isCurrent 
                  ? 'bg-slate-800/90 border-emerald-400 shadow-md ring-1 ring-emerald-400/40'
                  : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/70 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${scenario.badgeCls}`}>
                    {scenario.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-100 leading-snug">
                  {scenario.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-emerald-400 font-bold">
                <span>Simulate Scenario</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
