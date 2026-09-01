import React, { useState } from 'react';
import { Globe, TrendingUp, TrendingDown, RefreshCw, BarChart2, Layers, DollarSign, Sparkles, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Zap, Target } from 'lucide-react';
import InsightBulb from './InsightBulb';

// Global Multi-Region Commodity & Steel Price Benchmarks with Actionable Decision Feedback
const GLOBAL_BENCHMARKS = {
  shanghai: {
    regionName: 'Shanghai & China (SHFE / DCE / SSE)',
    badge: 'China / Pacific Trade',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    executiveTakeaway: {
      headline: '🔴 Chinese Mill Restocking Ramping Up: Expect Pacific Capesize Rate Spikes',
      detail: 'Rebar futures (+1.8%) and Dalian iron ore (+2.4%) indicate rising steel output. Chinese charterers are aggressively absorbing Pacific bulk carriers, which will push Australia ➔ India spot freight rates up by +$1.20 to +$1.80/MT over the next 3 weeks.',
      actionDirective: 'Lock 70%+ volume on multi-voyage COA immediately before Pacific vessel capacity tightens further.',
      urgency: 'HIGH URGENCY'
    },
    items: [
      {
        name: 'Shanghai Steel Rebar Futures (RB2610)',
        price: 'RMB 3,420 / MT',
        usdEquivalent: '$478.30 / MT',
        change: '+1.8%',
        isUp: true,
        source: 'Shanghai Futures Exchange (SHFE)',
        verdictBadge: '🔴 FREIGHT DEMAND UP',
        verdictCls: 'bg-rose-100 text-rose-800 border-rose-200',
        feedback: 'Chinese steel production is expanding. Higher raw material imports will absorb Capesize ships and drive up Pacific shipping rates.',
        impactMetric: 'Pacific Freight Impact: +$0.80/MT'
      },
      {
        name: 'Dalian Iron Ore Futures (I2609)',
        price: 'RMB 785 / MT',
        usdEquivalent: '$109.75 / MT',
        change: '+2.4%',
        isUp: true,
        source: 'Dalian Commodity Exchange (DCE)',
        verdictBadge: '🔴 TONNAGE SQUEEZE',
        verdictCls: 'bg-rose-100 text-rose-800 border-rose-200',
        feedback: 'Surge in iron ore fixtures from Australia ties up dry bulk ships, leaving fewer open vessels for Indian coking coal shipments.',
        impactMetric: 'Capesize Availability: TIGHTENING'
      },
      {
        name: 'SSE Coastal Bulk Freight Index (CBCFI)',
        price: '1,124.50 pts',
        usdEquivalent: 'Base 1000',
        change: '+0.9%',
        isUp: true,
        source: 'Shanghai Shipping Exchange (SSE)',
        verdictBadge: '🟡 PACIFIC FREIGHT FIRMING',
        verdictCls: 'bg-amber-100 text-amber-800 border-amber-200',
        feedback: 'Regional Asian bulk freight benchmarks are trending upwards. Daily spot charter prices will remain elevated through October.',
        impactMetric: 'Charter Directive: LOCK FORWARD COA'
      }
    ]
  },
  australia: {
    regionName: 'Australia & Pacific Rim (SGX / Platts / Newcastle)',
    badge: 'Australia Export Hub',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    executiveTakeaway: {
      headline: '🟢 Australian Coal Prices Softening: Favorable Landed Cost Window for Indian Mills',
      detail: 'Premium hard coking coal FOB dropped to $218.50/MT (-1.2%). This softens raw material import costs by ~₹380/MT, offsetting ocean shipping inflation. An ideal window to schedule 150,000 MT Capesize parcels.',
      actionDirective: 'Maximize cargo parcel sizes to 150k MT to capture lower FOB commodity pricing and lower $/MT freight.',
      urgency: 'BUYER ADVANTAGE'
    },
    items: [
      {
        name: 'Australian Premium Hard Coking Coal (FOB)',
        price: '$218.50 / MT',
        usdEquivalent: '₹18,895 / MT',
        change: '-1.2%',
        isUp: false,
        source: 'Platts / S&P Global',
        verdictBadge: '🟢 COMMODITY DISCOUNT',
        verdictCls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        feedback: 'Cheaper FOB coal price! Indian steel mills save ₹230/MT on raw material bills, giving you more budget flexibility.',
        impactMetric: 'Landed Raw Material: SAVINGS'
      },
      {
        name: 'Pilbara 62% Fe Iron Ore Fines (CFR)',
        price: '$104.20 / MT',
        usdEquivalent: '₹9,013 / MT',
        change: '+0.6%',
        isUp: true,
        source: 'SGX AsiaClear',
        verdictBadge: '🟡 STABLE TRADE FLOW',
        verdictCls: 'bg-amber-100 text-amber-800 border-amber-200',
        feedback: 'Stable iron ore trade maintains baseline Australia-India Capesize freight fixture benchmarks ($14.50–$15.20/MT).',
        impactMetric: 'Rate Volatility: LOW-MODERATE'
      },
      {
        name: 'Newcastle Thermal Coal (6000 NAR)',
        price: '$138.00 / MT',
        usdEquivalent: '₹11,937 / MT',
        change: '+1.1%',
        isUp: true,
        source: 'GlobalCOAL Newcastle',
        verdictBadge: '🟡 POWER SECTOR DEMAND',
        verdictCls: 'bg-amber-100 text-amber-800 border-amber-200',
        feedback: 'Steady thermal coal purchases by Indian coastal power utilities keep Panamax & Supramax charter rates well supported.',
        impactMetric: 'Recommended Vessel: PANAMAX'
      }
    ]
  },
  india: {
    regionName: 'India Domestic & East Coast (JPC / DGCIS / Paradip)',
    badge: 'Indian Domestic Trade',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    executiveTakeaway: {
      headline: '🔴 Port Congestion & Landed Demurrage Pressure: Paradip Coal Costs Up +2.1%',
      detail: 'While domestic steel selling prices remain healthy (₹52,400/MT), landed coal import costs at Paradip rose to ₹21,800/MT (+2.1%) driven by 14 vessels at outer anchorage and 3.2-day average waiting times (₹65L/day demurrage penalty).',
      actionDirective: 'Divert deep-draft Capesize shipments to Gangavaram or Dhamra to eliminate outer anchorage demurrage.',
      urgency: 'DEMURRAGE RISK'
    },
    items: [
      {
        name: 'Indian Domestic Hot Rolled Coil (HRC)',
        price: '₹52,400 / MT',
        usdEquivalent: '$605.78 / MT',
        change: '+0.5%',
        isUp: true,
        source: 'Joint Plant Committee (JPC / GOI)',
        verdictBadge: '🟢 HEALTHY STEEL MARGIN',
        verdictCls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        feedback: 'Domestic finished steel prices provide strong operational profit margins for Indian mills, absorbing minor shipping fluctuations.',
        impactMetric: 'Steel Profitability: SECURE'
      },
      {
        name: 'Paradip Port Landed Coking Coal Cost',
        price: '₹21,800 / MT',
        usdEquivalent: '$252.02 / MT',
        change: '+2.1%',
        isUp: true,
        source: 'DGCIS / Customs East Coast',
        verdictBadge: '🔴 DEMURRAGE PENALTY UP',
        verdictCls: 'bg-rose-100 text-rose-800 border-rose-200',
        feedback: 'Landed coal costs at Paradip rose by ₹450/MT due to outer anchorage queue waiting fines (3.2 days wait).',
        impactMetric: 'Congestion Impact: +₹65L/Day Risk'
      },
      {
        name: 'Indian East Coast Coastal Freight Index',
        price: '1,420 pts',
        usdEquivalent: 'Base 1000',
        change: '+1.4%',
        isUp: true,
        source: 'Indian National Shipowners (INSA)',
        verdictBadge: '🟡 BERTH CAPACITY TIGHT',
        verdictCls: 'bg-amber-100 text-amber-800 border-amber-200',
        feedback: 'Heavy coastal bulk traffic between Paradip, Vizag, and Haldia creates tight berth availability for incoming foreign ships.',
        impactMetric: 'Berth Availability: CONSTRAINED'
      }
    ]
  },
  rotterdam: {
    regionName: 'Europe & Atlantic / Global Shipping (BDI / Platts / ICE)',
    badge: 'Europe / Atlantic / Global BDI',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    executiveTakeaway: {
      headline: '🔴 Global Capesize Rates Jump to $22,450/day (+12.1%): Shipowners Driving Hard Bargains',
      detail: 'The Baltic Dry Capesize 5TC index broke $22,450/day while Singapore marine fuel rose to $628/MT (+2.1%). Shipowners are demanding rate premiums and ballast bonuses for uncommitted spot voyages.',
      actionDirective: 'Lock 3-Month COA with 11.5 knots eco-steaming clauses to insulate your company against fuel & spot rate surges.',
      urgency: 'HIGH CHARTER COSTS'
    },
    items: [
      {
        name: 'Rotterdam CIF Thermal Coal (ARA)',
        price: '$118.50 / MT',
        usdEquivalent: '₹10,250 / MT',
        change: '-0.8%',
        isUp: false,
        source: 'ICE Endex European Gas & Coal',
        verdictBadge: '🟢 ATLANTIC MARKET LULL',
        verdictCls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        feedback: 'European coal import demand is subdued, keeping Atlantic shipping rates soft and providing potential backhaul opportunities.',
        impactMetric: 'Atlantic Rates: SOFT'
      },
      {
        name: 'Baltic Capesize Index 5TC Average',
        price: '$22,450 / day',
        usdEquivalent: 'Time Charter Eq.',
        change: '+12.1%',
        isUp: true,
        source: 'Baltic Exchange London',
        verdictBadge: '🔴 GLOBAL RATE SURGE',
        verdictCls: 'bg-rose-100 text-rose-800 border-rose-200',
        feedback: 'Global Capesize day-rates surged above $22k/day. Uncommitted spot charterers will face sharp rate spikes for September-October.',
        impactMetric: 'Shipowner Power: MAXIMUM'
      },
      {
        name: 'Singapore VLSFO Bunker Fuel (0.5% S)',
        price: '$628.00 / MT',
        usdEquivalent: '₹54,322 / MT',
        change: '+2.1%',
        isUp: true,
        source: 'Ship & Bunker / Platts',
        verdictBadge: '🔴 FUEL SURCHARGE RISK',
        verdictCls: 'bg-rose-100 text-rose-800 border-rose-200',
        feedback: 'Higher marine fuel prices add ~$0.35/MT to Australia-India ocean freight. Request eco-speed (11.5 knots) charter clauses.',
        impactMetric: 'Fuel Surcharge: +$0.35/MT'
      }
    ]
  }
};

export default function GlobalBenchmarkPanel({ currency }) {
  const [activeRegion, setActiveRegion] = useState('shanghai');
  const currentRegion = GLOBAL_BENCHMARKS[activeRegion];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle mb-6 space-y-4">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-maritime-100 flex items-center justify-center text-maritime-800">
              <Globe className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <span>Multi-Region Steel, Coal & Freight Market Signals</span>
              <InsightBulb
                title="Cross-Market Intelligence & Decision Feedback"
                subtitle="Translating Raw Prices into Actionable Freight Strategy"
                dataset="SHFE + DCE + SGX + Joint Plant Committee (GOI) + Baltic Exchange + Platts"
                logic="Looking at raw numbers (like RMB 3,420 or $218/MT) doesn't tell a manager what to do. This engine translates cross-market price movements into concrete decision verdicts: whether Chinese mill demand will squeeze Pacific ships, whether Australian coal price drops offset ocean freight, and how fuel spikes affect your landed bill."
                impact="Replaces confusing price tickers with plain-English logistics directives: reveals whether you should lock contracts, negotiate eco-speed, or divert ports."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time market feedback: What price movements in Shanghai, Australia, India & Rotterdam mean for your shipping bill
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
            🇪🇺 Rotterdam / BDI
          </button>
        </div>
      </div>

      {/* REGIONAL STRATEGIC DIRECTIVE BANNER (PLAIN ENGLISH FEEDBACK) */}
      <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300">
                {currentRegion.regionName} Market Signal
              </span>
              <span className="text-[10px] bg-rose-900/60 text-rose-300 border border-rose-700 px-1.5 py-0.2 rounded font-bold">
                {currentRegion.executiveTakeaway.urgency}
              </span>
            </div>
            <h3 className="text-xs font-black text-white mt-1">
              {currentRegion.executiveTakeaway.headline}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {currentRegion.executiveTakeaway.detail}
            </p>
          </div>
        </div>

        <div className="shrink-0 bg-slate-800/90 border border-slate-700 rounded-lg p-3 text-right max-w-xs">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Decision Directive</div>
          <div className="text-xs font-bold text-emerald-300 mt-0.5">
            {currentRegion.executiveTakeaway.actionDirective}
          </div>
        </div>
      </div>

      {/* BENCHMARK CARDS WITH PLAIN-ENGLISH FEEDBACK */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currentRegion.items.map((item, idx) => (
          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-maritime-400 hover:shadow-sm transition-all">
            <div>
              
              {/* Card Top: Source & Verdict Badge */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.source}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${item.verdictCls}`}>
                  {item.verdictBadge}
                </span>
              </div>

              {/* Price & Change Banner */}
              <div className="bg-white border border-slate-200 rounded-lg p-2.5 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-base font-black text-slate-900">{item.price}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">{item.usdEquivalent}</div>
                </div>
                <div className={`text-xs font-black px-2 py-1 rounded flex items-center ${
                  item.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {item.isUp ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  {item.change}
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-900 leading-snug mb-2">{item.name}</h3>

              {/* Actionable Feedback Explanation */}
              <div className="bg-blue-50/60 border border-blue-200/70 rounded-lg p-2 mb-2">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider flex items-center mb-0.5">
                  <Sparkles className="w-3 h-3 mr-1 text-blue-700" />
                  What this means for you:
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  {item.feedback}
                </p>
              </div>

            </div>

            {/* Bottom Impact Metric */}
            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Key Takeaway:</span>
              <span className="font-bold text-slate-800">{item.impactMetric}</span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
