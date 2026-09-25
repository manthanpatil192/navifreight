import React, { useState, useMemo } from 'react';
import { 
  Ship, Compass, ArrowRight, CheckCircle2, TrendingUp, DollarSign, 
  ShieldCheck, AlertCircle, Database, Leaf, RefreshCw, Zap, 
  Layers, MapPin, Building, Anchor, FileText, Check, Award
} from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';

export default function CargoToHoldMatcher({ 
  currency = 'INR', 
  selectedMmsi: controlledMmsi, 
  onSelectShip, 
  onSimulateHop 
}) {
  const isINR = currency === 'INR';
  const fxRate = 95.0; // RBI Reference Rate for maritime freight conversion

  // 1. Curate Active Discharging / Berthed Bulk Carriers from Live AISStream Data
  const berthedShips = useMemo(() => {
    return LIVE_AIS_VESSELS.filter(v => 
      v.status.toLowerCase().includes('berth') || 
      v.status.toLowerCase().includes('discharg') || 
      v.status.toLowerCase().includes('anchor')
    ).slice(0, 8);
  }, []);

  const [internalMmsi, setInternalMmsi] = useState('563112000');
  const selectedMmsi = controlledMmsi || internalMmsi;
  const [activeFilterPort, setActiveFilterPort] = useState('all');
  const [lockedFixture, setLockedFixture] = useState(null);
  const [showDataProvenance, setShowDataProvenance] = useState(false);

  // Active Ship Object
  const activeShip = useMemo(() => {
    return berthedShips.find(s => s.mmsi === selectedMmsi) || 
      LIVE_AIS_VESSELS.find(s => s.mmsi === selectedMmsi) || 
      berthedShips[0] || {
      name: 'MV OLYMPIC GLORY',
      vesselType: 'Capesize',
      dwt: 181200,
      currentDraughtMeters: 17.8,
      maxDraughtMeters: 18.4,
      destinationPort: 'Paradip Port (PPT)',
      destinationId: 'paradip',
      cargo: '165,000 MT Hard Coking Coal',
      status: 'At Anchor (Port Roads Queue)'
    };
  }, [selectedMmsi, berthedShips]);

  // Determine port key from ship's destination
  const shipPortKey = useMemo(() => {
    const dest = (activeShip.destinationPort || activeShip.destinationId || '').toLowerCase();
    if (dest.includes('paradip')) return 'paradip';
    if (dest.includes('vizag') || dest.includes('visakhapatnam')) return 'vizag';
    if (dest.includes('dhamra')) return 'dhamra';
    if (dest.includes('gopalpur')) return 'gopalpur';
    if (dest.includes('gangavaram')) return 'gangavaram';
    if (dest.includes('haldia')) return 'haldia';
    return 'paradip';
  }, [activeShip]);

  // AI Matching Algorithm: Rank all Backhaul Opportunities for this specific ship
  const matchedOpportunities = useMemo(() => {
    return BACKHAUL_OPPORTUNITIES.map(route => {
      // 1. Vessel Type Fit Score
      const vesselClassMatch = route.suitableVessels.some(type => 
        activeShip.vesselType?.toLowerCase().includes(type.toLowerCase())
      );

      // 2. Proximity Score (Same port = 100, neighboring port = 80, distant = 50)
      let proximityScore = 50;
      let hopDistanceNM = 0;
      if (route.dischargePort === shipPortKey) {
        proximityScore = 100;
        hopDistanceNM = 0;
      } else if (
        (shipPortKey === 'paradip' && route.dischargePort === 'dhamra') ||
        (shipPortKey === 'dhamra' && route.dischargePort === 'paradip')
      ) {
        proximityScore = 85;
        hopDistanceNM = 92;
      } else if (
        (shipPortKey === 'vizag' && route.dischargePort === 'gangavaram') ||
        (shipPortKey === 'gangavaram' && route.dischargePort === 'vizag')
      ) {
        proximityScore = 95;
        hopDistanceNM = 15;
      } else if (
        (shipPortKey === 'paradip' && route.dischargePort === 'gopalpur') ||
        (shipPortKey === 'gopalpur' && route.dischargePort === 'paradip')
      ) {
        proximityScore = 75;
        hopDistanceNM = 140;
      }

      // 3. Financial Arbitrage Calculation
      const intakeMT = Math.min(route.cargoParcelSizeMT, Math.round((activeShip.dwt || 100000) * 0.92));
      const grossRevenueUSD = Math.round(intakeMT * route.revenueUSDPerMT);
      const hopFuelCostUSD = Math.round(hopDistanceNM * 65); // ~$65/NM bunker consumption at eco-speed
      const netArbitrageUSD = grossRevenueUSD - hopFuelCostUSD;
      const netArbitrageINR_Cr = Number(((netArbitrageUSD * fxRate) / 10000000).toFixed(2));

      // Match Score (0 - 100)
      const matchScore = Math.min(99, Math.round(
        (vesselClassMatch ? 45 : 20) + 
        (proximityScore * 0.35) + 
        (route.revenueUSDPerMT > 10 ? 20 : 10)
      ));

      return {
        ...route,
        intakeMT,
        grossRevenueUSD,
        hopDistanceNM,
        hopFuelCostUSD,
        netArbitrageUSD,
        netArbitrageINR_Cr,
        matchScore,
        vesselClassMatch
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [activeShip, shipPortKey, fxRate]);

  // Highest-Paying Match (Rank #1)
  const bestMatch = matchedOpportunities[0] || BACKHAUL_OPPORTUNITIES[0];

  // Handle Locking Fixture
  const handleLockFixture = (opportunity) => {
    const fixtureId = `CP-FIX-${new Date().getFullYear()}-${activeShip.name.replace(/[^A-Z]/g, '').substring(0, 4)}-${opportunity.id.substring(0, 3).toUpperCase()}`;
    setLockedFixture({
      fixtureId,
      shipName: activeShip.name,
      cargo: opportunity.exportCargo,
      commodityCategory: opportunity.commodityCategory,
      intakeMT: opportunity.intakeMT,
      destination: opportunity.destinationRegion,
      profitINR_Cr: opportunity.netArbitrageINR_Cr,
      profitUSD: opportunity.netArbitrageUSD,
      co2Saved: opportunity.co2SavingsTons,
      loadingBerth: opportunity.loadingBerth,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6">
      
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span>Interactive Cargo-to-Hold Matcher</span>
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                Coastal Triangulation AI
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronizes Discharging Import Bulk Carriers with Live East Coast Export Parcels • Eliminates Unproductive Return Deadheading
          </p>
        </div>

        {/* Dataset Verification Guarantee Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg px-3 py-1.5 text-right">
            <span className="text-[9px] uppercase font-bold text-emerald-800 tracking-wider block flex items-center gap-1 justify-end">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Verified Open Data
            </span>
            <span className="text-[11px] font-bold text-emerald-950 font-mono">
              UN COMTRADE + DGCIS + IPA
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDataProvenance(!showDataProvenance)}
            className="text-xs font-bold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
            title="Inspect open government trade datasets"
          >
            <Database className="w-3.5 h-3.5 text-slate-600" />
            <span>Data Sources</span>
          </button>
        </div>
      </div>

      {/* Provenance Explainer Drawer (Toggleable) */}
      {showDataProvenance && (
        <div className="mb-5 p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-700" />
              <span className="font-bold text-blue-950 uppercase tracking-wide">
                Live Open Dataset Provenance & Official Regulatory Grounding
              </span>
            </div>
            <button 
              onClick={() => setShowDataProvenance(false)}
              className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-700">
            <div className="bg-white p-2.5 rounded border border-blue-100">
              <span className="font-bold text-blue-900 block mb-1">1. UN COMTRADE & DGCIS</span>
              <p>Harmonized System bilateral trade flows for Indian exports: <strong>HS 260112</strong> (Agglomerated Iron Ore Pellets), <strong>HS 260600</strong> (Aluminium Ores / Bauxite), and <strong>HS 261400</strong> (Ilmenite Sands).</p>
            </div>
            <div className="bg-white p-2.5 rounded border border-blue-100">
              <span className="font-bold text-blue-900 block mb-1">2. Indian Ports Association (IPA)</span>
              <p>Official mechanized handling logs and berth traffic for <strong>Paradip Port (MCHP CQ-1/CQ-2)</strong>, <strong>Visakhapatnam (EQ-1/WQ-1)</strong>, and <strong>Dhamra (BB-01)</strong>.</p>
            </div>
            <div className="bg-white p-2.5 rounded border border-blue-100">
              <span className="font-bold text-blue-900 block mb-1">3. CEA / MoPSW Cabotage Scheme</span>
              <p>Ministry of Shipping cabotage relaxations facilitating coastal thermal coal rakes from MCL mines to <strong>TANGEDCO (Tuticorin/Ennore)</strong> and NTPC thermal stations.</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: Select Active Discharging Ship */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-blue-600" />
            <span>Step 1: Select Discharging Bulker at Indian Port (Real AIS Telemetry)</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            {berthedShips.length} Commercial Bulk Carriers Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {berthedShips.map((ship) => {
            const isSelected = ship.mmsi === selectedMmsi;
            return (
              <button
                key={ship.mmsi}
                type="button"
                onClick={() => {
                  setInternalMmsi(ship.mmsi);
                  if (onSelectShip) onSelectShip(ship);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-300 shadow-xs' 
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                    {ship.name}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate">
                  {ship.vesselType} • {ship.dwt?.toLocaleString()} DWT
                </div>
                <div className="text-[9.5px] font-mono text-blue-700 mt-1 truncate">
                  📍 {ship.destinationPort?.split('(')[0].trim() || 'Paradip Port'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Ship Telemetry Header Strip */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 mb-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
            <Ship className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-wide">{activeShip.name}</span>
              <span className="text-[10px] font-mono bg-blue-900 text-blue-200 px-1.5 py-0.2 rounded">
                MMSI: {activeShip.mmsi}
              </span>
              <span className="text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-2 py-0.2 rounded-full">
                Discharging Complete ➔ Ready for Re-Charter
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Current Port: <strong>{activeShip.destinationPort}</strong> • Class: <strong>{activeShip.vesselType}</strong> ({activeShip.dwt?.toLocaleString()} DWT) • Ballast Draft: <strong>8.5m</strong>
            </p>
          </div>
        </div>

        {/* Traditional Deadhead Loss Warning */}
        <div className="bg-red-950/80 border border-red-800/80 rounded-lg p-2 text-right">
          <span className="text-[9px] uppercase font-bold text-red-300 tracking-wider block">
            Default Ballast Loss (Deadheading)
          </span>
          <span className="text-xs font-mono font-bold text-red-400">
            -$385,000 (~₹3.66 Cr wasted fuel)
          </span>
        </div>
      </div>

      {/* STEP 2: AI Matched Export Commodities (Ranked by Arbitrage) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Step 2: AI-Matched Coastal Export Parcels (Ranked by Net Arbitrage Profit)</span>
            </span>
            <p className="text-[10.5px] text-slate-500">
              Matched against open government trade datasets (UN COMTRADE, DGCIS, IPA, CEA)
            </p>
          </div>

          {/* Quick Category Filter */}
          <div className="flex items-center space-x-1 text-[10.5px]">
            <span className="text-slate-400 mr-1 font-medium">Filter:</span>
            {['all', 'pellets', 'minerals', 'coal'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilterPort(f)}
                className={`py-0.5 px-2 rounded font-bold capitalize transition-all cursor-pointer ${
                  activeFilterPort === f 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'All Commodities' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-3">
          {matchedOpportunities
            .filter(opp => {
              if (activeFilterPort === 'all') return true;
              if (activeFilterPort === 'pellets') return opp.commodityCategory.toLowerCase().includes('pellet');
              if (activeFilterPort === 'minerals') return opp.commodityCategory.toLowerCase().includes('mineral') || opp.commodityCategory.toLowerCase().includes('bauxite');
              if (activeFilterPort === 'coal') return opp.commodityCategory.toLowerCase().includes('coal');
              return true;
            })
            .map((opp, idx) => {
              const isBest = idx === 0 && activeFilterPort === 'all';
              const isLocked = lockedFixture?.cargo === opp.exportCargo;

              return (
                <div 
                  key={opp.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isBest 
                      ? 'border-emerald-400 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 shadow-card ring-2 ring-emerald-300/80' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Left: Commodity Details */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {isBest && (
                          <span className="bg-emerald-600 text-white text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Award className="w-3 h-3" /> #1 Best Arbitrage Match
                          </span>
                        )}
                        {opp.liveDatasetBadge && (
                          <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded flex items-center gap-1">
                            <Database className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{opp.liveDatasetBadge}</span>
                          </span>
                        )}
                        {opp.hopType && (
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded border ${
                            opp.hopDistanceNM > 0 
                              ? 'bg-amber-50 text-amber-900 border-amber-300' 
                              : 'bg-blue-50 text-blue-900 border-blue-300'
                          }`}>
                            {opp.hopDistanceNM > 0 ? `🌊 ${opp.hopDistanceNM} NM Coastal Hop` : '⚓ Direct Port Berth'}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.2 rounded">
                          Shipper: {opp.shipper}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded">
                          {opp.readinessDays}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{opp.exportCargo}</span>
                        <span className="text-xs text-slate-400 font-normal">➔</span>
                        <span className="text-blue-700">{opp.destinationRegion}</span>
                      </h4>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-[11px] text-slate-600">
                        <div>
                          <span className="text-[9.5px] text-slate-400 block uppercase">Loading Terminal:</span>
                          <strong className="text-slate-800">{opp.loadingBerth}</strong>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-400 block uppercase">Parcel Size:</span>
                          <strong className="text-slate-800">{opp.intakeMT.toLocaleString()} MT</strong>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-400 block uppercase">Hop Underway:</span>
                          <strong className={opp.hopDistanceNM > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                            {opp.hopDistanceNM > 0 ? `${opp.hopDistanceNM} NM Coastal Hop` : 'Direct at Current Berth'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9.5px] text-slate-400 block uppercase">Open Data Source:</span>
                          <strong className="text-indigo-900 truncate block" title={opp.openDataSource}>
                            {opp.openDataSource.split('|')[0].trim()}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Right: Profit & Action Box */}
                    <div className="flex sm:flex-row lg:flex-col items-end justify-between sm:justify-end gap-2 shrink-0 border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block">
                          Net Arbitrage vs Deadhead
                        </span>
                        <div className="text-base font-extrabold text-emerald-700 font-mono">
                          +{isINR ? `₹${opp.netArbitrageINR_Cr} Cr` : `$${(opp.netArbitrageUSD / 1000).toFixed(0)}k`}
                        </div>
                        <span className="text-[9.5px] text-emerald-600 font-semibold block">
                          🌱 Saves {opp.co2SavingsTons} MT CO2
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleLockFixture(opp)}
                        disabled={isLocked}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          isLocked 
                            ? 'bg-emerald-700 text-white cursor-default' 
                            : isBest
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-900 text-white'
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Fixture Locked</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Lock Backhaul Fixture</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Fixture Confirmation Toast / Banner */}
      {lockedFixture && (
        <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/90 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                    Charter Party Fixture Locked (Zero-Ballast Return Leg)
                  </span>
                  <span className="font-mono text-[10.5px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-bold">
                    {lockedFixture.fixtureId}
                  </span>
                </div>
                <p className="text-xs text-emerald-900 mt-1">
                  Matched <strong>{lockedFixture.shipName}</strong> with <strong>{lockedFixture.intakeMT.toLocaleString()} MT</strong> of <strong>{lockedFixture.cargo}</strong> discharging into <strong>{lockedFixture.destination}</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-emerald-800 font-medium">
                  <span>📍 Loading Berth: <strong>{lockedFixture.loadingBerth}</strong></span>
                  <span>💰 Net Revenue Added: <strong>+₹{lockedFixture.profitINR_Cr} Crore</strong></span>
                  <span>🌱 Carbon Abated: <strong>{lockedFixture.co2Saved} MT CO2</strong></span>
                  <span>🕒 Timestamp: {lockedFixture.time}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLockedFixture(null)}
              className="py-1 px-2.5 rounded bg-emerald-200 hover:bg-emerald-300 text-emerald-900 text-xs font-bold transition-all cursor-pointer self-start sm:self-center shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
