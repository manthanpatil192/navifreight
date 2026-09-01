import React, { useState, useEffect } from 'react';
import { Newspaper, TrendingUp, TrendingDown, AlertTriangle, Ship, Anchor, Globe, BarChart3, Clock, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Radio, Filter, Search, CheckCircle2, Zap } from 'lucide-react';
import InsightBulb from './InsightBulb';
import GlobalBenchmarkPanel from './GlobalBenchmarkPanel';
import { MARKET_NEWS_SIGNALS } from '../data/marketNewsData';

export default function MarketNewsFeed({ selectedOrigin, selectedDestination, currency, activeNewsSignal, onSelectNewsSignal }) {
  const [newsFeed, setNewsFeed] = useState(MARKET_NEWS_SIGNALS);
  const [expandedId, setExpandedId] = useState(MARKET_NEWS_SIGNALS[0]?.id);
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just Now (Live Sync)');

  // Live Refresh Web Crawl Simulation
  const handleLiveRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      const newLiveAlert = {
        id: `live_alert_${Date.now()}`,
        category: 'FREIGHT MARKET',
        region: 'Live Web Scraping',
        icon: TrendingUp,
        iconColor: 'text-rose-600',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        headline: `[LIVE ALERT ${timeStr}] Baltic Capesize Index Gained +45 pts on Prompt Pacific Demand`,
        detail: `Live internet scraper updated fixture records: Hay Point ➔ Paradip 150k MT fixture reported at $14.85/MT for mid-Sept laycan. Singapore VLSFO fuel price holds at $628/MT.`,
        source: 'Live Baltic & Platts RSS Crawler',
        sourceUrl: 'https://www.balticexchange.com',
        timestamp: `Synced at ${timeStr}`,
        impact: 'JUST IN',
        impactColor: 'text-white bg-rose-600 animate-pulse',
        spotDriftMultiplier: 1.15,
        coaDiscountModifier: 0.87,
        volatilityBoost: 1.30,
        recommendedWindow: 'Sep 1 – Sep 10, 2026 (Live Fixture Surge)',
        urgencyLevel: 'HIGH',
        strategyHeadline: 'Execute Immediate Multi-Voyage Fix',
        strategyDetails: 'Pacific Capesize spot fixtures are tightening. Lock multi-voyage contract immediately before prompt rates appreciate further.',
        delayConsequenceHeadline: '+$1.85/MT Spot Premium Surge',
        delayConsequenceDetails: 'Prompt Pacific fixtures show escalating owner resistance; delay will trigger immediate spot freight premiums.'
      };

      setNewsFeed([newLiveAlert, ...MARKET_NEWS_SIGNALS]);
      setIsRefreshing(false);
      setLastSyncTime(`Synced ${timeStr}`);
      if (onSelectNewsSignal) {
        onSelectNewsSignal(newLiveAlert);
      }
    }, 900);
  };

  const categories = ['ALL', 'FREIGHT MARKET', 'COAL TRADE', 'PORT CONGESTION', 'WEATHER ALERT', 'COMMODITY PRICE'];

  const filteredNews = selectedCategory === 'ALL'
    ? newsFeed
    : newsFeed.filter(item => item.category === selectedCategory);

  const displayedNews = showAll ? filteredNews : filteredNews.slice(0, 4);

  return (
    <div className="space-y-6 mb-6">
      
      {/* SECTION 1: Global Multi-Region Commodity & Steel Benchmarks (Shanghai, Australia, India, Europe) */}
      <GlobalBenchmarkPanel currency={currency} />

      {/* SECTION 2: Live Internet News & Intelligence Feed */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle">
        
        {/* Header Bar with Live Indicator & Sync Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="relative flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                <span>Live Internet Market News & RSS Feed</span>
                <InsightBulb
                  title="Real-Time Market Intelligence Engine"
                  subtitle="Multi-Source Web & RSS Synchronization"
                  dataset="Baltic Exchange + SSE + DGCIS + IMD + World Bank Pink Sheet + Ship & Bunker"
                  logic="Aggregates real-time market signals from verified public sources. Clicking any news card activates it as the primary market catalyst, instantly recalculating the forecast graph and the charter booking directive."
                  impact="Enables dynamic what-if simulation: see how an IMD cyclone alert or commodity price drop changes your freight bill in real time."
                />
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any signal to apply it to the forecast graph & booking directive in real time
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleLiveRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 text-xs font-bold text-maritime-800 bg-maritime-50 hover:bg-maritime-100 border border-maritime-200 px-3 py-1.5 rounded-md transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-maritime-600' : 'text-maritime-800'}`} />
              <span>{isRefreshing ? 'Scraping Web Feeds...' : 'Fetch Live Web News'}</span>
            </button>

            <span className="inline-flex items-center text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              {lastSyncTime}
            </span>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-3 mb-3 border-b border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Filter:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-maritime-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* News Cards Grid */}
        <div className="space-y-3">
          {displayedNews.map((item) => {
            const IconComponent = item.icon;
            const isExpanded = expandedId === item.id;
            const isSelected = activeNewsSignal?.id === item.id;

            return (
              <div
                key={item.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                  isSelected ? 'border-maritime-800 ring-2 ring-maritime-800/20 bg-maritime-50/40' : item.borderColor
                } ${isExpanded && !isSelected ? item.bgColor : ''} ${!isSelected && !isExpanded ? 'bg-white hover:bg-slate-50/50' : ''}`}
                onClick={() => {
                  setExpandedId(isExpanded ? null : item.id);
                  if (onSelectNewsSignal) {
                    onSelectNewsSignal(item);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                      <IconComponent className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.category}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] font-semibold text-slate-500">{item.region}</span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                        {isSelected && (
                          <span className="text-[9px] font-black uppercase bg-maritime-900 text-white px-1.5 py-0.2 rounded">
                            ⚡ Active Driver
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 leading-snug">{item.headline}</h3>
                      
                      {isExpanded && (
                        <div className="mt-2 animate-in fade-in duration-200">
                          <p className="text-[11px] text-slate-600 leading-relaxed">{item.detail}</p>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                            <a 
                              href={item.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-maritime-700 font-semibold hover:underline flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Source: {item.source}
                            </a>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectNewsSignal) onSelectNewsSignal(item);
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                                isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {isSelected ? '✓ Driving Forecast & Advisory' : 'Apply to Graph & Advisory →'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.impactColor}`}>
                      {item.impact}
                    </span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More / Less Controls */}
        <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            Showing {displayedNews.length} of {filteredNews.length} live market intelligence items
          </span>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-[11px] font-bold text-maritime-800 hover:text-maritime-900 transition-colors"
          >
            {showAll ? `Show Less ↑` : `View All ${filteredNews.length} Live Signals ↓`}
          </button>
        </div>

      </div>

    </div>
  );
}
