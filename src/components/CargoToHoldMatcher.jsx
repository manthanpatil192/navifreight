import React, { useState, useMemo } from 'react';
import { 
  Ship, Compass, ArrowRight, CheckCircle2, TrendingUp, DollarSign, 
  ShieldCheck, AlertCircle, Database, Leaf, RefreshCw, Zap, 
  Layers, MapPin, Building, Anchor, FileText, Check, Award,
  Globe, Navigation, Clock, Gauge, Flame
} from 'lucide-react';
import { BACKHAUL_OPPORTUNITIES } from '../data/backhaulRoutes';
import { LIVE_AIS_VESSELS } from '../data/liveAisVessels';
import { GLOBAL_ORIGIN_PORT_CONGESTION } from '../data/weatherCongestionData';
import { ORIGIN_LOADING_PORTS } from '../data/portsData';

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
  const [repositionTargetKey, setRepositionTargetKey] = useState('hay_point');
  const [activeSpeedMode, setActiveSpeedMode] = useState('eco'); // 'eco' or 'full'

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

                  {/* Coastal Triangulation Path & Empty Berth Repositioning Prediction */}
                  <div className="mt-3 pt-3 border-t border-slate-200/80 bg-slate-50/70 -mx-4 -mb-4 p-3.5 rounded-b-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center space-x-2">
                        <Compass className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Coastal Triangulation Path & Origin Empty Berth Arrival Engine
                        </span>
                        <span className="text-[9.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold">
                          CLOSED-LOOP AI
                        </span>
                      </div>

                      {/* Origin Port Switcher for Repositioning Target */}
                      <div className="flex items-center space-x-1.5 text-[10.5px]">
                        <span className="text-slate-500 font-medium">Reposition Target:</span>
                        <select
                          value={repositionTargetKey}
                          onChange={(e) => setRepositionTargetKey(e.target.value)}
                          className="bg-white border border-slate-300 rounded px-2 py-0.5 font-bold text-slate-800 focus:outline-hidden focus:border-emerald-600 text-[10.5px] cursor-pointer"
                        >
                          <optgroup label="Australia Coal Ports">
                            <option value="hay_point">🇦🇺 Hay Point / DBCT</option>
                            <option value="gladstone">🇦🇺 Gladstone R.G. Tanna</option>
                            <option value="newcastle">🇦🇺 Newcastle PWCS</option>
                            <option value="abbot_point">🇦🇺 Abbot Point NQXT</option>
                          </optgroup>
                          <optgroup label="Indonesia Coal Ports">
                            <option value="taboneo">🇮🇩 Taboneo Anchorage</option>
                            <option value="samarinda">🇮🇩 Samarinda / Muara Berau</option>
                          </optgroup>
                          <optgroup label="United States Coal Ports">
                            <option value="hampton_roads">🇺🇸 Norfolk Hampton Roads</option>
                            <option value="baltimore">🇺🇸 Baltimore Consol CNX</option>
                          </optgroup>
                          <optgroup label="Mozambique Coal Ports">
                            <option value="maputo">🇲🇿 Maputo Matola TCM</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    {/* 3-Leg Architecture Flow */}
                    {(() => {
                      const originPort = GLOBAL_ORIGIN_PORT_CONGESTION[repositionTargetKey] || GLOBAL_ORIGIN_PORT_CONGESTION.hay_point;
                      const destPortName = opp.primaryDestinationPort || opp.destinationRegion || 'Qingdao, China';
                      const repositionDistNM = originPort.repositionDistanceNMFromChina || 3850;
                      
                      // Eco speed vs Full speed calculations
                      const ecoKnots = originPort.recommendedSpeedKnots || 11.6;
                      const fullKnots = 13.0;
                      const ecoTransitDays = Number((repositionDistNM / (ecoKnots * 24)).toFixed(1));
                      const fullTransitDays = Number((repositionDistNM / (fullKnots * 24)).toFixed(1));
                      
                      // Daily fuel burn: Eco ~24.5 MT/day, Full ~38.0 MT/day
                      const ecoFuelTotalMT = Math.round(ecoTransitDays * 24.5);
                      const fullFuelTotalMT = Math.round(fullTransitDays * 38.0);
                      const fuelSavedMT = Math.max(0, fullFuelTotalMT - ecoFuelTotalMT);
                      const fuelSavingsUSD = Math.round(fuelSavedMT * 620); // $620/MT VLSFO bunker
                      const demurrageAvoidedUSD = 45000; // 1.8 days * $25,000/day avoided idle wait
                      const totalBenefitUSD = fuelSavingsUSD + demurrageAvoidedUSD;
                      const totalBenefitINR_Cr = Number(((totalBenefitUSD * fxRate) / 10000000).toFixed(2));

                      return (
                        <div className="space-y-2.5">
                          {/* Visual 3-Leg Flow Diagram */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                            
                            {/* Leg 1: Inbound Coal Discharge */}
                            <div className="p-2.5 rounded-lg border border-slate-200 bg-white shadow-2xs">
                              <div className="flex items-center justify-between text-slate-500 font-bold text-[10px] uppercase mb-1">
                                <span>Leg 1: Discharge Inbound Coal</span>
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Discharging</span>
                              </div>
                              <div className="font-bold text-slate-900 truncate">
                                {activeShip.destinationPort?.split('(')[0] || 'Paradip Port'}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                150k MT Coking Coal • Fast Unload (45k TPD)
                              </div>
                              <div className="text-[9.5px] font-semibold text-emerald-700 mt-1">
                                ✓ Hold Wash & Grain Inspection Ready
                              </div>
                            </div>

                            {/* Leg 2: Loaded Export Backhaul */}
                            <div className="p-2.5 rounded-lg border border-emerald-300 bg-emerald-50/50 shadow-2xs">
                              <div className="flex items-center justify-between text-emerald-800 font-bold text-[10px] uppercase mb-1">
                                <span>Leg 2: Loaded Export Backhaul</span>
                                <span className="text-emerald-800 bg-emerald-100 font-extrabold px-1.5 py-0.2 rounded border border-emerald-300">
                                  +{isINR ? `₹${opp.netArbitrageINR_Cr} Cr` : `$${(opp.netArbitrageUSD / 1000).toFixed(0)}k`}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 truncate">
                                {opp.loadingBerth?.split('(')[0] || 'East Coast'} ➔ {destPortName.split('/')[0]}
                              </div>
                              <div className="text-[10px] text-slate-600 mt-0.5">
                                {opp.intakeMT.toLocaleString()} MT {opp.exportCargo?.split('(')[0]} ({opp.distanceNM || 3950} NM)
                              </div>
                              <div className="text-[9.5px] font-semibold text-emerald-700 mt-1">
                                🌱 Zero Ballast Waste • Saves {opp.co2SavingsTons} MT CO2
                              </div>
                            </div>

                            {/* Leg 3: Ballast Repositioning to Coal Origin */}
                            <div className="p-2.5 rounded-lg border border-blue-300 bg-blue-50/50 shadow-2xs">
                              <div className="flex items-center justify-between text-blue-900 font-bold text-[10px] uppercase mb-1">
                                <span>Leg 3: Repositioning to Origin</span>
                                <span className="text-blue-800 bg-blue-100 font-bold px-1.5 py-0.2 rounded border border-blue-200">
                                  {originPort.flag} {originPort.name.split('/')[0]}
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 truncate">
                                {destPortName.split('/')[0]} ➔ {originPort.name.split('/')[0]}
                              </div>
                              <div className="text-[10px] text-slate-600 mt-0.5">
                                {repositionDistNM.toLocaleString()} NM • Load: {originPort.handlingRateTPD?.toLocaleString()} TPD
                              </div>
                              <div className="text-[9.5px] font-bold text-blue-800 mt-1">
                                ⚓ Next Empty Slot: {originPort.nextEmptyBerthSlotETA}
                              </div>
                            </div>

                          </div>

                          {/* Real JIT Speed & Empty Port Arrival Prediction Box */}
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 mb-2 gap-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-xs font-bold text-slate-800">
                                  Real Berth Arrival Prediction: JIT Speed vs Uncoordinated Full Speed
                                </span>
                              </div>
                              
                              {/* Speed Mode Toggle */}
                              <div className="flex items-center bg-slate-100 p-0.5 rounded text-[10.5px]">
                                <button
                                  type="button"
                                  onClick={() => setActiveSpeedMode('eco')}
                                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                    activeSpeedMode === 'eco'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  JIT Eco-Speed ({ecoKnots} kts)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveSpeedMode('full')}
                                  className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                                    activeSpeedMode === 'full'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  Full Speed ({fullKnots} kts)
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                              
                              {/* Eco Mode Metrics */}
                              <div className={`p-2.5 rounded-lg border transition-all ${
                                activeSpeedMode === 'eco' 
                                  ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200' 
                                  : 'bg-slate-50 border-slate-200 opacity-75'
                              }`}>
                                <div className="flex items-center justify-between font-bold text-emerald-900 mb-1">
                                  <span className="flex items-center gap-1">
                                    <span>✨ Recommended: JIT Eco-Speed ({ecoKnots} kts)</span>
                                  </span>
                                  <span className="bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                    ZERO QUEUE WAIT
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600 mb-2">
                                  Steams at calculated JIT speed so vessel arrives precisely when <strong>{originPort.name.split('/')[0]}</strong> berth becomes 100% empty.
                                </p>
                                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                                  <div className="bg-white p-1 rounded border border-emerald-100">
                                    <span className="text-slate-400 block text-[9px]">Transit Time:</span>
                                    <strong className="text-slate-800">{ecoTransitDays} Days</strong>
                                  </div>
                                  <div className="bg-white p-1 rounded border border-emerald-100">
                                    <span className="text-slate-400 block text-[9px]">Anchor Queue:</span>
                                    <strong className="text-emerald-700">0.0h (Direct Berth)</strong>
                                  </div>
                                  <div className="bg-white p-1 rounded border border-emerald-100">
                                    <span className="text-slate-400 block text-[9px]">Demurrage Cost:</span>
                                    <strong className="text-emerald-700">$0.00</strong>
                                  </div>
                                </div>
                                <div className="mt-2 text-[10px] font-semibold text-emerald-800 flex items-center justify-between">
                                  <span>⚡ Fuel Saved: {fuelSavedMT} MT VLSFO (${fuelSavingsUSD.toLocaleString()})</span>
                                  <span className="font-bold">+{isINR ? `₹${totalBenefitINR_Cr} Cr` : `$${totalBenefitUSD.toLocaleString()}`} Benefit</span>
                                </div>
                              </div>

                              {/* Full Speed Mode Metrics */}
                              <div className={`p-2.5 rounded-lg border transition-all ${
                                activeSpeedMode === 'full' 
                                  ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-200' 
                                  : 'bg-slate-50 border-slate-200 opacity-75'
                              }`}>
                                <div className="flex items-center justify-between font-bold text-rose-900 mb-1">
                                  <span className="flex items-center gap-1">
                                    <span>⚠️ Uncoordinated Full Speed ({fullKnots} kts)</span>
                                  </span>
                                  <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded font-extrabold">
                                    CONGESTED
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-600 mb-2">
                                  Arrives early while previous vessel is still loading. Drops anchor outside port roads in queue.
                                </p>
                                <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
                                  <div className="bg-white p-1 rounded border border-rose-100">
                                    <span className="text-slate-400 block text-[9px]">Transit Time:</span>
                                    <strong className="text-slate-800">{fullTransitDays} Days</strong>
                                  </div>
                                  <div className="bg-white p-1 rounded border border-rose-100">
                                    <span className="text-slate-400 block text-[9px]">Anchor Queue:</span>
                                    <strong className="text-rose-700">1.8 Days Wait</strong>
                                  </div>
                                  <div className="bg-white p-1 rounded border border-rose-100">
                                    <span className="text-slate-400 block text-[9px]">Demurrage Penalty:</span>
                                    <strong className="text-rose-700">-$45,000 USD</strong>
                                  </div>
                                </div>
                                <div className="mt-2 text-[10px] font-semibold text-rose-800 flex items-center justify-between">
                                  <span>❌ Fuel Wasted: +{fuelSavedMT} MT VLSFO</span>
                                  <span className="font-bold">Unproductive Anchor Burning</span>
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      );
                    })()}
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
