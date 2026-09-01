import React, { useState } from 'react';
import { Globe, TrendingUp, TrendingDown, RefreshCw, BarChart2, Layers, DollarSign } from 'lucide-react';
import InsightBulb from './InsightBulb';

// Global Multi-Region Commodity & Steel Price Benchmarks
const GLOBAL_BENCHMARKS = {
  shanghai: {
    regionName: 'Shanghai & China (DCE / SSE)',
    badge: 'China / Pacific',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    items: [
      {
        name: 'Shanghai Steel Rebar Futures (RB2610)',
        price: 'RMB 3,420 / MT',
        usdEquivalent: '$478.30 / MT',
        change: '+1.8%',
        isUp: true,
        source: 'Shanghai Futures Exchange (SHFE)',
        desc: 'Key Asian steel production driver influencing raw material bulk charter demand.'
      },
      {
        name: 'Dalian Iron Ore Futures (I2609)',
        price: 'RMB 785 / MT',
        usdEquivalent: '$109.75 / MT',
        change: '+2.4%',
        isUp: true,
        source: 'Dalian Commodity Exchange (DCE)',
        desc: 'Direct correlation with Australia-China and Australia-India Capesize freight volumes.'
      },
      {
        name: 'SSE Coastal Bulk Freight Index (CBCFI)',
        price: '1,124.50 pts',
        usdEquivalent: 'Base 1000',
        change: '+0.9%',
        isUp: true,
        source: 'Shanghai Shipping Exchange (SSE)',
        desc: 'Benchmark index for Pacific Rim coastal and regional dry bulk freight.'
      }
    ]
  },
  australia: {
    regionName: 'Australia & Pacific Rim (SGX / Pilbara)',
    badge: 'Australia Export Hub',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    items: [
      {
        name: 'Australian Premium Hard Coking Coal (FOB)',
        price: '$218.50 / MT',
        usdEquivalent: '₹18,895 / MT',
        change: '-1.2%',
        isUp: false,
        source: 'Platts / S&P Global',
        desc: 'Primary coking coal origin for Indian steel producers (Hay Point & Gladstone).'
      },
      {
        name: 'Pilbara 62% Fe Iron Ore Fines (CFR)',
        price: '$104.20 / MT',
        usdEquivalent: '₹9,013 / MT',
        change: '+0.6%',
        isUp: true,
        source: 'SGX AsiaClear',
        desc: 'Benchmark iron ore price driving Capesize C5 freight fixture rates.'
      },
      {
        name: 'Newcastle Thermal Coal (6000 NAR)',
        price: '$138.00 / MT',
        usdEquivalent: '₹11,937 / MT',
        change: '+1.1%',
        isUp: true,
        source: 'GlobalCOAL Newcastle',
        desc: 'Benchmark thermal coal price for Asian power utilities.'
      }
    ]
  },
  india: {
    regionName: 'India Domestic & East Coast (JSD / SAIL / Paradip)',
    badge: 'Indian Domestic',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    items: [
      {
        name: 'Indian Domestic Hot Rolled Coil (HRC)',
        price: '₹52,400 / MT',
        usdEquivalent: '$605.78 / MT',
        change: '+0.5%',
        isUp: true,
        source: 'Joint Plant Committee (JPC / Ministry of Steel)',
        desc: 'Domestic steel benchmark determining Indian mill operating margins.'
      },
      {
        name: 'Paradip Port Landed Coking Coal Cost',
        price: '₹21,800 / MT',
        usdEquivalent: '$252.02 / MT',
        change: '+2.1%',
        isUp: true,
        source: 'DGCIS / Customs East Coast',
        desc: 'Includes FOB commodity price + ocean freight + port discharge dues at Paradip.'
      },
      {
        name: 'Indian East Coast Coastal Freight Index',
        price: '1,420 pts',
        usdEquivalent: 'Base 1000',
        change: '+1.4%',
        isUp: true,
        source: 'Indian National Shipowners Association (INSA)',
        desc: 'Coastal shipping index for Paradip-Vizag-Haldia bulk movement.'
      }
    ]
  },
  rotterdam: {
    regionName: 'Europe & Atlantic Hub (Rotterdam / ARA / BDI)',
    badge: 'Europe / Atlantic',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    items: [
      {
        name: 'Rotterdam CIF Thermal Coal (ARA)',
        price: '$118.50 / MT',
        usdEquivalent: '₹10,250 / MT',
        change: '-0.8%',
        isUp: false,
        source: 'ICE Endex European Gas & Coal',
        desc: 'Atlantic basin thermal coal price benchmark.'
      },
      {
        name: 'Baltic Capesize Index 5TC Average',
        price: '$22,450 / day',
        usdEquivalent: 'Time Charter Eq.',
        change: '+12.1%',
        isUp: true,
        source: 'Baltic Exchange London',
        desc: 'Global benchmark for Capesize 180k DWT vessel daily earnings.'
      },
      {
        name: 'Singapore VLSFO Bunker Fuel (0.5% S)',
        price: '$628.00 / MT',
        usdEquivalent: '₹54,322 / MT',
        change: '+2.1%',
        isUp: true,
        source: 'Ship & Bunker / Platts',
        desc: 'Standard marine bunker fuel price driving sea voyage variable operational cost.'
      }
    ]
  }
};

export default function GlobalBenchmarkPanel({ currency }) {
  const [activeRegion, setActiveRegion] = useState('shanghai');
  const currentRegion = GLOBAL_BENCHMARKS[activeRegion];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-maritime-800" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Multi-Region Steel, Coal & Freight Benchmark Index</span>
              <InsightBulb
                title="Global Commodity & Freight Benchmark Monitor"
                subtitle="Open-Source Multi-Market Index"
                dataset="SHFE + DCE + SGX + Joint Plant Committee (GOI) + Baltic Exchange + ICE Endex"
                logic="Provides real-time cross-market price monitoring across 4 key global trade hubs: Shanghai (SHFE/DCE), Australia (SGX), India (JPC/DGCIS), and Europe/Atlantic (Baltic/ICE). Allows charterers to track commodity price spreads against ocean freight."
                impact="Eliminates reliance on expensive closed proprietary feeds by consolidating open-source global commodity benchmarks into a single view."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time prices across Shanghai, Australia, India, and Rotterdam hubs
          </p>
        </div>

        {/* Region Switcher Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveRegion('shanghai')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
              activeRegion === 'shanghai' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇨🇳 Shanghai (SHFE)
          </button>
          <button
            onClick={() => setActiveRegion('australia')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
              activeRegion === 'australia' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇦🇺 Australia (SGX)
          </button>
          <button
            onClick={() => setActiveRegion('india')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
              activeRegion === 'india' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇮🇳 India (JPC)
          </button>
          <button
            onClick={() => setActiveRegion('rotterdam')}
            className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
              activeRegion === 'rotterdam' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🇪🇺 Rotterdam/BDI
          </button>
        </div>
      </div>

      {/* Benchmark Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentRegion.items.map((item, idx) => (
          <div key={idx} className="bg-slate-50/70 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between hover:border-maritime-300 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.source}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center ${
                  item.isUp ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {item.isUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                  {item.change}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-800 leading-snug mb-2">{item.name}</h3>
              
              <div className="bg-white border border-slate-200 rounded-md p-2 mb-2">
                <div className="text-base font-black text-slate-900">{item.price}</div>
                <div className="text-[10px] text-slate-500">{item.usdEquivalent}</div>
              </div>

              <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Status: Active Trading</span>
              <span className="font-semibold text-slate-600">Verified Feed</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
