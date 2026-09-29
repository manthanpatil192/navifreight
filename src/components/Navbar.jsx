import React, { useState, useRef, useEffect } from 'react';
import { 
  Ship, Activity, Database, Download, ShieldCheck, Clock, 
  ExternalLink, LogIn, LogOut, UserCheck, RefreshCw, TrendingUp,
  DollarSign, ChevronDown, CheckCircle2, ArrowRight, Zap, Info
} from 'lucide-react';
import { calculateForwardFxRate } from '../services/liveMarketDataService';

export default function Navbar({ 
  onOpenDatasets, 
  currency, 
  setCurrency, 
  onExportReport, 
  currentUser, 
  onSignOut, 
  onOpenLoginPage,
  marketData,
  onRefreshMarketData
}) {
  const [showFxDetail, setShowFxDetail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fxDropdownRef = useRef(null);

  const spotFx = marketData?.usdInrSpot || 95.93;
  const bidFx = marketData?.usdInrBid || (spotFx - 0.02);
  const askFx = marketData?.usdInrAsk || (spotFx + 0.02);
  const fwd1 = calculateForwardFxRate(1, spotFx);
  const fwd3 = calculateForwardFxRate(3, spotFx);
  const fwd6 = calculateForwardFxRate(6, spotFx);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (fxDropdownRef.current && !fxDropdownRef.current.contains(e.target)) {
        setShowFxDetail(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async (e) => {
    e.stopPropagation();
    if (isRefreshing) return;
    setIsRefreshing(true);
    if (onRefreshMarketData) {
      await onRefreshMarketData();
    }
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-maritime-900 flex items-center justify-center text-white shadow-sm">
              <Ship className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-maritime-900">NaviFreight</span>
                <span className="bg-maritime-50 text-maritime-800 text-xs font-semibold px-2 py-0.5 rounded border border-maritime-200">
                  AI TERMINAL
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                East Coast India Bulk Freight Forecasting & Multi-Voyage Chartering Optimizer
              </p>
            </div>
          </div>

          {/* Right Controls: Real-Time Forex Ticker, User Profile & Currency */}
          <div className="flex items-center space-x-3">
            
            {/* REAL-TIME DYNAMIC USD/INR FOREX TELEMETRY BADGE */}
            <div className="relative" ref={fxDropdownRef}>
              <div
                onClick={() => setShowFxDetail(!showFxDetail)}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all shadow-2xs group"
                title="Click to view Real-Time USD/INR Interbank & Forward Telemetry"
              >
                {/* Live Pulsing Beacon */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-emerald-800 tracking-wider">USD/INR</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">₹{spotFx.toFixed(2)}</span>
                  <span className="hidden lg:inline text-[10px] text-slate-500 font-mono">(3M: ₹{fwd3.toFixed(2)})</span>
                </div>

                <button
                  onClick={handleManualSync}
                  className="p-0.5 text-emerald-700 hover:text-emerald-950 transition-transform active:rotate-180 cursor-pointer"
                  title="Force Instant Interbank Live Sync"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing || marketData?.isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                </button>
                <ChevronDown className={`w-3 h-3 text-emerald-700 transition-transform ${showFxDetail ? 'rotate-180' : ''}`} />
              </div>

              {/* Dynamic Forex Dropdown Card */}
              {showFxDetail && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Forex Telemetry</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                      {marketData?.forexStatus === 'LIVE_INTERBANK_FEED' ? 'LIVE FEED' : 'CALIBRATED DAILY'}
                    </span>
                  </div>

                  {/* Spot Rate Highlights */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Spot Interbank Rate:</span>
                      <span className="text-lg font-bold font-mono text-slate-900">1 USD = ₹{spotFx.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-mono mt-1 pt-1 border-t border-slate-200/60">
                      <span>Bid: ₹{bidFx.toFixed(2)}</span>
                      <span>Ask: ₹{askFx.toFixed(2)}</span>
                      <span className="text-emerald-600 font-bold">Spread: ₹0.03</span>
                    </div>
                  </div>

                  {/* Forward Curve Projections */}
                  <div className="space-y-1.5 mb-3 text-xs">
                    <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">RBI Forward Reference Trend:</div>
                    <div className="flex justify-between text-slate-600 bg-white px-2 py-1 rounded border border-slate-100">
                      <span>1-Month Forward</span>
                      <span className="font-mono font-semibold text-slate-900">₹{fwd1.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-900 bg-emerald-50/70 px-2 py-1 rounded border border-emerald-200 font-medium">
                      <span>3-Month Horizon (Current)</span>
                      <span className="font-mono font-bold text-emerald-950">₹{fwd3.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 bg-white px-2 py-1 rounded border border-slate-100">
                      <span>6-Month Forward</span>
                      <span className="font-mono font-semibold text-slate-900">₹{fwd6.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Fuel / Cargo Impact Metric */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5 text-[11px] text-blue-900 mb-3 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-blue-600" />
                      <span>Freight Conversion Impact:</span>
                    </div>
                    <div className="text-slate-600">
                      A $15.80/MT Capesize spot charter converts to <span className="font-mono font-bold text-slate-900">₹{Math.round(15.80 * spotFx).toLocaleString('en-IN')}/MT</span> at current spot.
                    </div>
                  </div>

                  {/* Footer & Sync Button */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                    <span>Updated: {marketData?.lastUpdatedTime || 'Just now'}</span>
                    <button
                      onClick={handleManualSync}
                      className="flex items-center space-x-1 text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span>Sync Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated User Role Badge / Sign In Trigger */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.roleName ? currentUser.roleName.charAt(0) : 'L'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.roleName || 'Logistics Manager'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {currentUser.code || 'AUTHENTICATED'}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  className="ml-1 text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-white transition-colors cursor-pointer"
                  title="Switch Role or Sign Out to Login Page"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLoginPage}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login Portal</span>
              </button>
            )}

            {/* Currency Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  currency === 'INR'
                    ? 'bg-white text-maritime-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ INR
              </button>
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  currency === 'USD'
                    ? 'bg-white text-maritime-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                $ USD
              </button>
            </div>

            {/* Quick Link to View Login Page anytime */}
            {currentUser && onOpenLoginPage && (
              <button
                onClick={onOpenLoginPage}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-2 py-1 rounded-md bg-white hover:bg-slate-50 transition-colors hidden sm:inline-flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3 h-3" />
                <span>Login View</span>
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
}

