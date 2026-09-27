import React, { useState, useEffect } from 'react';
import { 
  Ship, Anchor, ShieldCheck, ArrowRight, Eye, EyeOff, 
  Lock, Mail, CheckCircle2, Building2, UserCheck,
  TrendingUp, RefreshCw, BarChart3, Layers, Compass, 
  Clock, AlertTriangle, Cpu, Radio, Sparkles, FileText,
  Maximize2, Minimize2, Navigation
} from 'lucide-react';
import shipHeroImage from '../assets/navifreight_ship_hero.jpg';
import VoyagePlaybackMap from './VoyagePlaybackMap';

const USER_ROLES = [
  {
    id: 'logistics_manager',
    label: 'Logistics Manager',
    badge: 'PRIMARY PROFILE',
    sublabel: 'Bulk Logistics & Multi-Voyage Dispatch',
    email: 'logistics.manager@navifreight.gov.in',
    code: 'NF-LOGISTICS-HEAD',
    roleTitle: 'Chief Logistics & Bulk Chartering Manager',
    organization: 'East Coast India Bulk Freight Alliance (SAIL / RINL / NTPC Desk)',
    default2FA: '782-941',
    description: 'Lead operator managing multimodal bulk freight distribution, 3M/6M COA allocation, and vessel schedules.'
  }
];

export default function LoginPage({ onLogin, onGuestAccess }) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const activeRole = USER_ROLES[selectedRoleIndex] || USER_ROLES[0];

  const [email, setEmail] = useState(activeRole.email);
  const [password, setPassword] = useState('Maritime@2026Secure');
  const [twoFactorCode, setTwoFactorCode] = useState(activeRole.default2FA);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // Live dual clocks (UTC & IST)
  const [timeState, setTimeState] = useState({ utc: '', ist: '' });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeState({
        utc: now.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ist: now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      });
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRoleChange = (index) => {
    setSelectedRoleIndex(0);
    const role = USER_ROLES[0];
    setEmail(role.email);
    setPassword('Maritime@2026Secure');
    setTwoFactorCode(role.default2FA);
    setLoginFeedback(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setLoginFeedback({ type: 'info', message: 'Verifying DG Shipping credentials & AIS security token...' });

    setTimeout(() => {
      setIsSubmitting(false);
      setLoginFeedback({ type: 'success', message: 'Authentication approved! Initializing Freight Engine...' });
      
      setTimeout(() => {
        if (onLogin) {
          onLogin({
            role: activeRole.id,
            roleName: activeRole.label,
            roleTitle: activeRole.roleTitle,
            email: email,
            organization: activeRole.organization,
            code: activeRole.code,
            token: twoFactorCode
          });
        }
      }, 600);
    }, 800);
  };

  const handleQuickDemo = (roleId) => {
    const role = USER_ROLES[0];
    setEmail(role.email);
    setPassword('Maritime@2026Secure');
    setTwoFactorCode(role.default2FA);
    setIsSubmitting(true);
    setLoginFeedback({ type: 'success', message: `Quick Demo authorized as ${role.label}...` });
    setTimeout(() => {
      setIsSubmitting(false);
      if (onLogin) {
        onLogin({
          role: role.id,
          roleName: role.label,
          roleTitle: role.roleTitle,
          email: role.email,
          organization: role.organization,
          code: role.code,
          token: role.default2FA
        });
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans relative selection:bg-slate-100 selection:text-slate-900">
      
      {/* TOP MARITIME UTILITY & BRAND HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo & Identity (NaviFreight) */}
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm border border-slate-800">
                <Ship className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                  NaviFreight
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  East Coast India Bulk Logistics & Chartering Decision Engine
                </p>
              </div>
            </div>

            {/* Right Status, Clocks & Quick Access */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Dual UTC / IST Time */}
              <div className="hidden lg:block text-right">
                <div className="text-xs font-mono font-bold text-slate-800">
                  IST {timeState.ist || '09:47:00'} <span className="text-slate-300 font-normal">|</span> UTC {timeState.utc || '04:17:00'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Bay of Bengal Maritime Operations
                </div>
              </div>

              {/* Direct Guest Access */}
              {onGuestAccess && (
                <button
                  onClick={onGuestAccess}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Direct preview into decision engine"
                >
                  <span>Guest Access</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              )}

              {/* Help & Support */}
              <button 
                onClick={() => alert('East Coast India Maritime Support Hotline: +91 6722 222 001 | Desk: desk@shippingfreight.gov.in')}
                className="hidden sm:block text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 bg-white cursor-pointer"
              >
                Help Desk
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN AUTHENTICATION & SHOWCASE SECTION                                    */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* ========================================================================= */}
        {/* CENTERED SHIP CONTAINER WITH LOGIN PART INSIDE                            */}
        {/* ========================================================================= */}
        {/* HERO CONTAINER: 80% MAP WITH LIVE MOVING VESSEL + 20% COMPACT SIGN-IN     */}
        {/* ========================================================================= */}
        <div className="max-w-7xl w-full mx-auto my-2">
          
          {/* THE MARITIME CONTAINER */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#080c14] h-[600px] sm:h-[640px] flex">
            
            {/* 1. 100% WIDE OPEN LIVE MOVING SHIP VOYAGE MAP (Dominates 80%+ of Visual Viewport) */}
            <div className="absolute inset-0 z-0">
              <VoyagePlaybackMap />
            </div>

            {/* 2. FOREGROUND: Right-aligned Compact ~20% Sign-In Card (Pointer events active on card only) */}
            <div className="relative z-10 w-full h-full p-4 sm:p-6 flex items-center justify-end pointer-events-none pb-24 sm:pb-20">
              
              {/* COMPACT ~20% SIGN-IN CARD */}
              <div className="w-full sm:w-[310px] bg-[#0c1322]/90 backdrop-blur-2xl rounded-2xl shadow-2xl p-4 sm:p-5 border border-slate-700/80 text-white pointer-events-auto flex flex-col justify-between">
                
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-700/50">
                        <Ship className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-extrabold text-white tracking-tight">
                        Freight Terminal
                      </h3>
                    </div>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-700/60">
                      ● LIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2.5">Logistics Manager Portal · 3M/6M COA</p>
                </div>

                {/* 1-Click Demo Access Button */}
                <button
                  type="button"
                  onClick={() => handleQuickDemo('logistics_manager')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer mb-2.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Logistics Manager Demo (1-Click)</span>
                </button>

                <div className="relative flex items-center justify-center my-1">
                  <div className="border-t border-slate-800 w-full" />
                  <span className="bg-[#0c1322] px-2 text-[10px] text-slate-500 uppercase font-semibold">
                    or credentials
                  </span>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-2 mt-1">
                  {/* Email */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Maritime Email / ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="logistics.manager@navifreight.gov.in"
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password & 2FA */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-2.5 pr-7 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-2 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          2FA
                        </label>
                        <span className="text-[9px] text-emerald-400 font-mono">DG-AUTH</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="782-941"
                        maxLength={8}
                        className="w-full px-2.5 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Remember me */}
                  <div className="flex items-center justify-between pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3 h-3 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                      />
                      <span className="text-[10px]">Remember (24h)</span>
                    </label>
                  </div>

                  {/* Feedback message */}
                  {loginFeedback && (
                    <div className={`p-1.5 rounded-lg text-[10px] font-medium flex items-center gap-1.5 ${
                      loginFeedback.type === 'success' 
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700' 
                        : 'bg-slate-900/80 text-slate-200 border border-slate-700'
                    }`}>
                      <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-400" />
                      <span className="truncate">{loginFeedback.message}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-black text-xs tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-75 cursor-pointer mt-1"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                        <span>AUTHORIZING...</span>
                      </>
                    ) : (
                      <>
                        <span>SIGN IN TO TERMINAL</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>

              </div>

            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* PLATFORM FEATURES & ARCHITECTURE (WHAT WE DO - REPLACES OLD STATS BAR)     */}
        {/* ========================================================================= */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          
          {/* Header section */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              SYSTEM CAPABILITIES & ARCHITECTURE
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2.5 tracking-tight">
              What NaviFreight Does: Core Platform Features
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              An integrated maritime intelligence and procurement optimization engine designed specifically for Indian steel plants (SAIL, RINL) and power utilities (NTPC) importing bulk commodities across the Bay of Bengal.
            </p>
          </div>

          {/* 6 Core Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Feature 1: Rate Forecasting */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  AI Freight Rate Forecasting
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Probabilistic forward spot rate forecasting using P10, P50 (expected), and P90 quantile cones. Trained on Breakwave Dry Bulk (<span className="font-mono font-medium">BDRY</span>) futures, ICE Brent VLSFO bunker fuel, and global commodity indices.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  Walk-Forward Pinball
                </span>
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  30-180 Day Cones
                </span>
              </div>
            </div>

            {/* Feature 2: Spot vs COA Planner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Spot vs. COA Allocation Optimizer
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Calculates optimal volume split between spot market voyages and 3-Month / 6-Month Contracts of Affreightment (COAs). Uses Conditional Value-at-Risk (<span className="font-mono font-medium">CVaR</span>) to prevent blast furnace stockouts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  Stockout Protection
                </span>
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  6-Day Buffer Shield
                </span>
              </div>
            </div>

            {/* Feature 3: Port Berth & Draft Limits */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                  <Anchor className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Port Draft & Berth Constraint Checker
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Validates operational draft and LOA limits across Paradip, Visakhapatnam, Dhamra, Haldia, and Gopalpur. Evaluates Capesize, Panamax, and Supramax discharge rates (TPD) with automated lighterage alerts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  Tidal Clearance
                </span>
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  TPD Discharge Pacing
                </span>
              </div>
            </div>

            {/* Feature 4: Anti-Bunching Terminal */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Vessel Bunching & Demurrage Defense
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Real-time collision radar identifying same-day ETA overlaps before vessels arrive at port anchorage. Recommends virtual queuing, staggered steaming speeds, and berth reassignments to eliminate $22,000/day demurrage fines.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  ETA Collision Radar
                </span>
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  Virtual Berthing Queue
                </span>
              </div>
            </div>

            {/* Feature 5: Tramp Deadhead Triangulation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Coastal Triangular Backhaul Optimizer
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Triangulates return voyages with domestic coastal bulk movements (iron ore pellets, coastal thermal coal, limestone). Converts empty ballast deadheading into revenue legs while reducing overall bunker fuel consumption.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  Hold Matching
                </span>
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  Zero Deadhead Routing
                </span>
              </div>
            </div>

            {/* Feature 6: Real-Time AIS & NLP Radar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-emerald-300 hover:shadow-md transition-all group flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform mb-4">
                  <Radio className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Live AIS Fleet & Weather Risk Radar
                </h4>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Live satellite AIS tracking of 165+ bulk carriers traversing the Bay of Bengal, coupled with 4-stage FinBERT NLP maritime news sentiment analysis, cyclone trajectory warnings, and early-warning congestion flags.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  165+ Live Vessels
                </span>
                <span className="text-[10px] bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded border border-slate-200">
                  FinBERT News Radar
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* COMPLIANCE & SECURITY CERTIFICATION BADGES                                */}
        {/* ========================================================================= */}
        <div className="mt-10 p-5 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-800">DG Shipping India Compliant</span>
            <span className="text-slate-400">· Directorate General of Shipping Reg. No. MAR-2026-IN</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
              ISO 27001 Certified
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
              256-Bit AIS Encrypted
            </span>
            <span className="px-2.5 py-1 rounded bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
              Indian Ports Association API
            </span>
          </div>
        </div>

      </main>

      {/* MINIMALIST FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 NaviFreight Maritime Systems. All rights reserved. East Coast India Bulk Logistics Architecture.
          </div>
          <div className="flex items-center space-x-4">
            <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-900 transition-colors">Port Tariff Agreements</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security Whitepaper</a>
          </div>
        </div>
      </footer>

    </div>
  );
}


