import React from 'react';
import { Ship, Activity, Database, Download, ShieldCheck, Clock, ExternalLink, LogIn, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ onOpenDatasets, currency, setCurrency, onExportReport, currentUser, onSignOut, onOpenLoginPage }) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

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
                <span className="text-xl font-bold tracking-tight text-maritime-900">BeyRoute / NaviFreight</span>
                <span className="bg-maritime-50 text-maritime-800 text-xs font-semibold px-2 py-0.5 rounded border border-maritime-200">
                  AI TERMINAL
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                East Coast India Bulk Freight Forecasting & Multi-Voyage Chartering Optimizer
              </p>
            </div>
          </div>

          {/* Right Controls: User Profile & Currency */}
          <div className="flex items-center space-x-3">
            
            {/* Authenticated User Role Badge / Sign In Trigger */}
            {currentUser ? (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.roleName ? currentUser.roleName.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.roleName || 'Chartering Officer'}
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
