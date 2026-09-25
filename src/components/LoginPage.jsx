import React, { useState, useEffect } from 'react';
import { 
  Ship, Anchor, ShieldCheck, ArrowRight, Eye, EyeOff, 
  Lock, Mail, CheckCircle2, Building2, UserCheck,
  TrendingUp, RefreshCw, BarChart3, Layers, Compass, 
  Clock, AlertTriangle, Cpu, Radio, Sparkles, FileText
} from 'lucide-react';
import shipHeroImage from '../assets/navifreight_ship_hero.jpg';

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
        <div className="max-w-6xl w-full mx-auto my-2">
          
          {/* THE SHIP PART CONTAINER (Focal center element with high-definition bulk freight ship) */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-900">
            
            {/* High-Resolution Ship & Ocean Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-slate-950">
              <img
                src={shipHeroImage}
                alt="NaviFreight Bulk Carrier Vessel Sailing Across Azure Ocean"
                className="w-full h-full object-cover object-[22%_center] scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/navifreight_ship_hero.jpg';
                }}
              />
              {/* Balanced subtle gradient overlays ensuring the ship hull and sea are clearly visible while text remains sharp */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/15 to-slate-950/20 pointer-events-none" />
              <div className="absolute inset-y-0 left-0 w-full lg:w-3/5 bg-gradient-to-r from-slate-950/70 via-slate-950/20 to-transparent pointer-events-none" />
            </div>

            {/* Inner Content Layer inside the Ship Part */}
            <div className="relative z-10 p-5 sm:p-7 lg:p-9 flex flex-col justify-between min-h-[540px]">
              
              {/* Main Center Body: Left side has clean typography over ship/ocean, Right side has Login */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
                
                {/* Left Side: Clean branding over unobstructed ship & ocean background */}
                <div className="lg:col-span-5 text-white space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/70 border border-white/20 backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-300">
                      East Coast Freight Command
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-lg">
                    NaviFreight
                  </h2>

                  <p className="text-sm sm:text-base text-slate-200 leading-relaxed drop-shadow-md font-medium max-w-md">
                    Transitioning East Coast Indian bulk procurement from daily spot market volatility to optimized 3-Month & 6-Month Multiple Voyage Contracts (COAs).
                  </p>

                  <div className="pt-2">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                      <Anchor className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Paradip · Vizag · Dhamra · Haldia · Gopalpur</span>
                    </div>
                  </div>
                </div>

                {/* Right Side inside Ship Part: THE LOGIN PART INSIDE THE SHIP CONTAINER */}
                <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-5 sm:p-6 border border-white/80 text-slate-900">
                  
                  {/* Logistics Manager Target Profile Banner */}
                  <div className="mb-4 p-3.5 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800">
                    <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                      Logistics Manager
                    </h3>
                    <p className="text-[11px] text-slate-300 mb-2.5 leading-snug">
                      Bulk logistics dispatch, multi-voyage contract scheduling & East Coast port clearance.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('logistics_manager')}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>Access as Logistics Manager</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Header Title */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Sign In to Freight Terminal
                      </h3>
                      <p className="text-xs text-slate-500">Logistics Manager Portal · Multi-voyage COA forecasting & port fit checks.</p>
                    </div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      LIVE TERMINAL
                    </span>
                  </div>

                  {/* Active Terminal Profile Card (Replaces redundant role tabs) */}
                  <div className="mb-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          Logistics Manager Terminal
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Bulk Procurement, COA Hedging & Port Dispatch
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      PRIMARY ACCESS
                    </span>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Email */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Corporate Maritime Email / ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. logistics.manager@navifreight.gov.in"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Password & 2FA row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            Password
                          </label>
                          <a 
                            href="#forgot" 
                            onClick={(e) => { e.preventDefault(); alert('For credential recovery, please contact your Port Security Officer or email security@shippingfreight.gov.in.'); }}
                            className="text-[10px] text-rose-600 hover:underline font-medium"
                          >
                            Forgot?
                          </a>
                        </div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                            2FA Token
                          </label>
                          <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                            ● DG-AUTH
                          </span>
                        </div>
                        <input
                          type="text"
                          required
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          placeholder="000-000"
                          maxLength={8}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs sm:text-sm font-mono tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                        <span className="text-[11px]">Remember session (24h)</span>
                      </label>
                    </div>

                    {/* Feedback message */}
                    {loginFeedback && (
                      <div className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                        loginFeedback.type === 'success' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>{loginFeedback.message}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>AUTHORIZING...</span>
                        </>
                      ) : (
                        <>
                          <span>SIGN IN AS LOGISTICS MANAGER</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* 1-Click Instant Demo Access (Cleaned up, no extra roles) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      1-Click Instant Access:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('logistics_manager')}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Logistics Manager Demo</span>
                    </button>
                  </div>

                </div>

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
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    PART A · ML ENGINE
                  </span>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    CVaR HEDGING
                  </span>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Anchor className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    PART B · PORT FIT
                  </span>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    PART C · DISPATCH
                  </span>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    BALLAST REDUCTION
                  </span>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Radio className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    PART D · SATELLITE AIS
                  </span>
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

          {/* 4-Step Continuous Decision Pipeline Bar */}
          <div className="mt-8 p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="text-center lg:text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
                  DECISION PIPELINE
                </span>
                <h4 className="text-lg font-extrabold text-white mt-0.5">
                  How NaviFreight Optimizes Every Bulk Voyage
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  From raw market signals to berthing discharge, decisions are mathematically validated at each stage.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
                  <div className="text-emerald-400 font-bold text-xs font-mono">STEP 1</div>
                  <div className="text-xs font-bold text-white mt-1">Predict</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">P10/50/90 Cones</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
                  <div className="text-emerald-400 font-bold text-xs font-mono">STEP 2</div>
                  <div className="text-xs font-bold text-white mt-1">Hedge</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Spot vs COA CVaR</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
                  <div className="text-emerald-400 font-bold text-xs font-mono">STEP 3</div>
                  <div className="text-xs font-bold text-white mt-1">Dispatch</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Anti-Bunching Fit</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center">
                  <div className="text-emerald-400 font-bold text-xs font-mono">STEP 4</div>
                  <div className="text-xs font-bold text-white mt-1">Monitor</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Live AIS Satellite</div>
                </div>
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


