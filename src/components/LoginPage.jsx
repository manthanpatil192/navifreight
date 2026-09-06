import React, { useState, useEffect, useRef } from 'react';
import { 
  Ship, Anchor, Navigation, ShieldCheck, ArrowRight, Eye, EyeOff, 
  Lock, Mail, KeyRound, CheckCircle2, Star, Globe2, Compass, 
  Activity, Layers, Sliders, ExternalLink, Sparkles, Building2, UserCheck,
  X, FileText, AlertTriangle, TrendingUp, RefreshCw
} from 'lucide-react';

const USER_ROLES = [
  {
    id: 'charterer',
    label: 'Bulk Procurement & Chartering Manager',
    badge: '★ TARGET PS PROFILE',
    sublabel: '3M/6M Multi-Voyage COA vs Spot Optimizer',
    email: 'procurement.head@eastcoast-freight.gov.in',
    code: 'PS26006-COA-LEAD',
    roleTitle: 'Chief Bulk Procurement & Multi-Voyage Chartering Manager',
    organization: 'East Coast India Bulk Freight Alliance (SAIL / RINL / NTPC Desk)',
    default2FA: '782-941',
    description: 'Directly addresses PS Objective: Moving from reactive single spot contracts to 3-6 month Multiple Voyage Contracts (COAs).'
  },
  {
    id: 'port_authority',
    label: 'Port Infrastructure Authority',
    badge: 'SECTION (B) CONSTRAINT',
    sublabel: 'Paradip, Vizag & Dhamra Draft Clearance',
    email: 'operations@paradip-port.gov.in',
    code: 'PA-EASTCOAST-01',
    roleTitle: 'Chief Marine Berthing & Draft Officer',
    organization: 'Paradip, Visakhapatnam & Dhamra Port Authorities',
    default2FA: '492-108',
    description: 'Enforces draft, LOA, beam, and daily discharge TPD restrictions at East Coast Indian ports.'
  },
  {
    id: 'dispatch',
    label: 'Tramp Fleet & Deadhead Controller',
    badge: 'SECTION (C) OPTIMIZER',
    sublabel: 'Backhaul Tramp Routing & Ballast Reduction',
    email: 'fleet.dispatch@navifreight-tramp.com',
    code: 'FD-TRAMP-BACKHAUL',
    roleTitle: 'Global Tramp Routing & Ballast Avoidance Lead',
    organization: 'Bay of Bengal Tramp Vessel Coordination Command',
    default2FA: '331-502',
    description: 'Eliminates vessel idle time and empty deadheading via triangular backhaul trade routes.'
  }
];

export default function LoginPage({ onLogin, onGuestAccess }) {
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const activeRole = USER_ROLES[selectedRoleIndex];

  const [email, setEmail] = useState(activeRole.email);
  const [password, setPassword] = useState('Maritime@2026Secure');
  const [twoFactorCode, setTwoFactorCode] = useState(activeRole.default2FA);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginFeedback, setLoginFeedback] = useState(null);
  const [isPSModalOpen, setIsPSModalOpen] = useState(false);

  // Simple static vessel telemetry
  const vesselSpeedKts = 14.8;
  const liveHeading = '084° ENE';
  const engineRpm = 78;

  // Figma Prototype Controls
  const [showFigmaBar, setShowFigmaBar] = useState(true);
  const [showGridOverlay, setShowGridOverlay] = useState(false);
  const [showTokenInspector, setShowTokenInspector] = useState(false);

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
    setSelectedRoleIndex(index);
    const role = USER_ROLES[index];
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
    const index = USER_ROLES.findIndex(r => r.id === roleId);
    if (index !== -1) {
      handleRoleChange(index);
      const role = USER_ROLES[index];
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
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans relative selection:bg-slate-100 selection:text-slate-900">
      
      {/* Optional Figma Design Grid Overlay */}
      {showGridOverlay && (
        <div className="fixed inset-0 pointer-events-none z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-12 gap-6 opacity-20">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-full bg-rose-400 border-x border-rose-500" />
          ))}
        </div>
      )}

      {/* FIGMA PROTOTYPE TOOLBAR (TOP CONTROL BAR) */}
      {showFigmaBar && (
        <div className="bg-slate-900 text-white text-xs border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 z-40">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px] font-semibold border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              FIGMA CANVAS SPEC
            </span>
            <span className="text-slate-300 hidden sm:inline text-[11px]">
              East Coast India Maritime Terminal · Clean White Canvas System (12-Col Grid)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGridOverlay(!showGridOverlay)}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                showGridOverlay ? 'bg-rose-500 text-white border-rose-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3 h-3" />
              {showGridOverlay ? 'Hide 12-Col Grid' : 'Show Grid'}
            </button>

            <button
              onClick={() => setShowTokenInspector(!showTokenInspector)}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                showTokenInspector ? 'bg-sky-600 text-white border-sky-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-3 h-3" />
              Design Tokens
            </button>

            <button
              onClick={onGuestAccess}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              title="Bypass login and open decision engine directly"
            >
              Direct Guest Access <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={() => setShowFigmaBar(false)}
              className="text-slate-400 hover:text-white px-1 py-0.5 text-xs ml-1 cursor-pointer"
              title="Close toolbar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* FIGMA DESIGN TOKEN INSPECTOR DRAWER */}
      {showTokenInspector && (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs text-slate-700">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-slate-900">Color System:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-white inline-block" />
                <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">#FFFFFF Canvas Pure</code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#001e40] inline-block" />
                <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">#001E40 Deep Maritime</code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#e11d48] inline-block" />
                <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">#E11D48 Action Highlight</code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] inline-block" />
                <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">#10B981 AIS Live Green</code>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#e2e8f0] inline-block" />
                <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">#E2E8F0 Low-Contrast Border</code>
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Font: Inter / Hanken Grotesk · Elevation: Low-contrast 1px outlines
            </div>
          </div>
        </div>
      )}

      {/* TOP MARITIME UTILITY & BRAND HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo & Identity (BeyRoute & NaviFreight Co-Brand) */}
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm border border-slate-800">
                <Ship className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-extrabold tracking-tight text-slate-900">
                    BeyRoute <span className="font-light text-slate-400">/</span> NaviFreight
                  </span>
                  <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 tracking-wide">
                    TERMINAL PORTAL
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  East Coast India Bulk Procurement & Chartering Decision Engine
                </p>
              </div>
            </div>

            {/* Right Status & Clocks */}
            <div className="hidden lg:flex items-center space-x-6">
              {/* AIS Radar Feed Status */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  AIS Radar Feed: <span className="text-emerald-600 font-bold">100% Operational</span>
                </span>
              </div>

              {/* Dual UTC / IST Time */}
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-800">
                  IST {timeState.ist || '09:47:00'} <span className="text-slate-300 font-normal">|</span> UTC {timeState.utc || '04:17:00'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Bay of Bengal Maritime Operations
                </div>
              </div>

              {/* Help & Support */}
              <button 
                onClick={() => alert('East Coast India Maritime Support Hotline: +91 6722 222 001 | Desk: desk@shippingfreight.gov.in')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 bg-white cursor-pointer"
              >
                Help Desk
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN AUTHENTICATION & SHOWCASE SECTION (MAXIMUM WHITE BACKGROUND)         */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
        
        {/* Top Tagline Banner (Inspired by Image 2: "✦ Moving Businesses Beyond Borders") */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>✦ Moving Businesses Beyond Borders · East Coast Indian Ports</span>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Verified Capesize & Panamax Charter Network</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="font-semibold text-slate-700">ISO 27001 & DG Shipping Validated</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTERED SHIP CONTAINER WITH LOGIN PART INSIDE (USER REQUESTED ARCHITECTURE) */}
        {/* ========================================================================= */}
        <div className="max-w-6xl w-full mx-auto my-2 sm:my-3">
          
          {/* THE SHIP PART CONTAINER (Focal center element with aerial container ship) */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-[#032f50]">
            
            {/* Aerial Container Vessel Background Image - Clean, Static & High-Res */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src="/maritime_vessel_hero.jpg"
                alt="Aerial view of container freight vessel sailing through azure ocean water"
                className="w-full h-full object-cover object-center"
              />
              {/* Gentle gradient overlay for high contrast and crystal-clear text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20 pointer-events-none" />
              <div className="absolute inset-y-0 left-0 w-full lg:w-3/5 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />
            </div>

            {/* Inner Content Layer inside the Ship Part */}
            <div className="relative z-10 p-4 sm:p-6 lg:p-7 flex flex-col justify-between">
              
              {/* 1. Top Badges Row (Matches user screenshot: "● FLEET IN MOTION · LIVE" & "IMO: 9845722 · CAPESIZE") */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-5">
                <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full shadow-md">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-wide">
                    FLEET IN MOTION · LIVE
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 font-mono text-xs sm:text-sm font-bold text-white bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-md">
                  IMO: 9845722 · CAPESIZE
                </div>
              </div>

              {/* 2. Main Center Body: Left side has Headline & Metrics, Right side has the Login Part! */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Side inside Ship Part: Headline & Stats from User Screenshot */}
                <div className="lg:col-span-5 text-white space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-emerald-400 tracking-widest uppercase mb-1 drop-shadow">
                      AUTONOMOUS DISPATCH & ECONOMETRIC FORECASTING
                    </p>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white drop-shadow-lg">
                      BEYOND BORDERS TO FASTER.
                    </h2>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed drop-shadow-sm">
                    Transitioning East Coast Indian bulk procurement from daily spot market volatility to optimized 3-Month & 6-Month Multiple Voyage Contracts (COAs).
                  </p>

                  {/* Floating Metric Badges */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <div className="text-xl sm:text-2xl font-black text-white">5M+ <span className="text-xs text-rose-400 font-bold">MT</span></div>
                      <div className="text-[11px] font-semibold text-slate-300">Tons Delivered</div>
                      <div className="text-[10px] text-slate-400">Zero demurrage delays</div>
                    </div>
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                      <div className="text-xl sm:text-2xl font-black text-emerald-400">99.4%</div>
                      <div className="text-[11px] font-semibold text-slate-300">ETA Accuracy</div>
                      <div className="text-[10px] text-slate-400">IMD weather coupled</div>
                    </div>
                  </div>

                  {/* Clean Static Telemetry Card */}
                  <div className="p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-white/20 text-xs font-mono text-slate-300 flex flex-wrap items-center justify-between gap-2 shadow-md">
                    <div>Speed: <span className="text-white font-bold">14.8 kts</span></div>
                    <div>Course: <span className="text-white font-bold">084° ENE</span></div>
                    <div>Engine: <span className="text-emerald-400 font-bold">78 RPM</span></div>
                    <div>Transit: <span className="text-emerald-400 font-bold">Bay of Bengal</span></div>
                  </div>

                </div>

                {/* Right Side inside Ship Part: THE LOGIN PART INSIDE THE SHIP CONTAINER */}
                <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 sm:p-6 border border-white/80 text-slate-900">
                  
                  {/* SIH Mandate Target Profile Hero Banner */}
                  <div className="mb-4 p-3.5 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-extrabold border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        SIH26006 TARGET PROFILE
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">COA MANDATE</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white mb-0.5">
                      Chief Bulk Procurement & Multi-Voyage Chartering Manager
                    </h3>
                    <p className="text-[11px] text-slate-300 mb-2.5 leading-snug">
                      Moving from reactive spot contracts to 3M/6M Multiple Voyage Contracts (COAs).
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('charterer')}
                        className="flex-1 min-w-[140px] py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <span>Access This Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPSModalOpen(true)}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Analyze PS
                      </button>
                    </div>
                  </div>

                  {/* Header Title */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Sign In to Freight Terminal
                      </h3>
                      <p className="text-xs text-slate-500">Access multi-voyage COA forecasting & port fit checks.</p>
                    </div>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      v2.6 PRO
                    </span>
                  </div>

                  {/* Role Tabs */}
                  <div className="mb-3.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Select Terminal Role
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                      {USER_ROLES.map((role, idx) => {
                        const isSelected = selectedRoleIndex === idx;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => handleRoleChange(idx)}
                            className={`flex flex-col items-center justify-center text-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white text-slate-900 font-bold shadow-sm border border-slate-200/80'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium'
                            }`}
                          >
                            <span className="text-[11px] truncate w-full">{role.label.split('/')[0].trim()}</span>
                            <span className={`text-[8px] truncate w-full ${isSelected ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                              {role.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
                          placeholder="e.g. charterer@beyroute.com"
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
                          <span>SIGN IN TO FREIGHT TERMINAL</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* 1-Click Quick Demo Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Quick Demos:
                    </span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('charterer')}
                        className="px-2 py-1 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-900 border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Charterer
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('port_authority')}
                        className="px-2 py-1 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-900 border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Port Auth
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('dispatch')}
                        className="px-2 py-1 bg-slate-50 hover:bg-sky-50 hover:border-sky-200 hover:text-sky-900 border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Dispatch
                      </button>
                    </div>
                  </div>

                </div>

              </div>

              {/* 3. Bottom Subtitle / AIS Feed status inside Ship Card */}
              <div className="mt-6 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  EAST COAST BULK CHARTERING TERMINAL · AIS LINK ACTIVE
                </span>
                <span className="text-slate-400 font-mono">PARADIP / VIZAG / DHAMRA / HALDIA</span>
              </div>

            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* WHITE STATISTICS BAR (Directly from Image 1 reference, pure white canvas) */}
        {/* ========================================================================= */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
              MARITIME EXCELLENCE & INFRASTRUCTURE
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
              Company Fueled by Passion for Logistics
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Providing integrated bulk freight intelligence for coking coal, iron ore, and limestone across the Bay of Bengal.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            
            {/* Stat 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-rose-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">26+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Years of Maritime Experience</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Established operations in Indian ports</p>
            </div>

            {/* Stat 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-rose-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <Ship className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">284+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Our Owned & Chartered Vessels</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Capesize, Panamax & Supramax</p>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-rose-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">650+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Port & Dispatch Staff</div>
              <p className="text-[11px] text-slate-400 mt-0.5">24/7 continuous operations team</p>
            </div>

            {/* Stat 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-rose-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                <Anchor className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">374k+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Voyages Safely Completed</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Zero environmental incidents recorded</p>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* COMPLIANCE & SECURITY CERTIFICATION BADGES (PURE WHITE SECTION)          */}
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
            © 2026 BeyRoute / NaviFreight Maritime Systems. All rights reserved. East Coast India Bulk Procurement Architecture.
          </div>
          <div className="flex items-center space-x-4">
            <a href="#privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-slate-900 transition-colors">Port Tariff Agreements</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security Whitepaper</a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* SIH26006 PROBLEM STATEMENT ANALYSIS & PROFILE CLEARANCE MODAL             */}
      {/* ========================================================================= */}
      {isPSModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold tracking-tight">SIH26006 Problem Statement Analysis & Profile Clearance</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bulk Cargo Procurement Architecture for India's East Coast Ports
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPSModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm">
              
              {/* Primary Objective Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Core Objective of the Problem Statement
                </div>
                <p className="text-sm font-bold text-emerald-950 leading-relaxed">
                  "Development of model to facilitate moving from multiple single spot contracts being entered into currently to short term / medium term multiple voyage contracts (COAs)."
                </p>
                <p className="text-xs text-emerald-800 mt-2">
                  Target Profile: <span className="font-bold text-slate-900">Chief Bulk Procurement & Chartering Manager</span> (Managing Coking Coal, Thermal Coal & Iron Ore for East Coast Indian Ports).
                </p>
              </div>

              {/* Problem Analysis & Flaws of Current Daily Spot Exploration */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  1. Critical Flaws of Current Daily Spot Operations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">High Volatility & Reactive Losses:</span>
                    <p className="text-slate-600 mt-1">
                      Daily engagements leave procurement exposed to sudden Baltic Dry Index (BDI) spikes, geopolitical bottlenecks, and seasonal peaks without forward rate lock-ins.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">Port Infrastructure Mismatch:</span>
                    <p className="text-slate-600 mt-1">
                      Chartering Capesize vessels for shallow ports (e.g., Haldia riverine draft 8.5m or Gopalpur 14.5m) forces expensive offshore lighterage at Sagar Sandheads or severe deadfreight.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">Severe Idle & Deadhead Losses:</span>
                    <p className="text-slate-600 mt-1">
                      Vessels return empty on ballast legs to Australia or Indonesia without return tramp cargo, inflating voyage freight costs.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">Demurrage & Congestion Blindspots:</span>
                    <p className="text-slate-600 mt-1">
                      Failure to integrate real-time port waiting days and Bay of Bengal monsoon cyclone alerts results in $15,000–$30,000/day vessel demurrage penalties.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Pillars Expected Solution Matrix */}
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  2. Architecture Mapping: How Our Platform Solves the 4 Requirements
                </h4>
                <div className="space-y-2.5 text-xs">
                  
                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
                    <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-600 font-bold shrink-0">
                      PART A
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">(a) Optimal Market Entry Timing:</span>
                      <p className="text-slate-600 mt-0.5">
                        Forecasts future freight curves (1M to 6M forward) using econometric regression, forward freight agreements (FFA), and commodity news coupling. Evaluates optimal timing windows to secure 3-Month / 6-Month COAs to capture rate bottoms.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold shrink-0">
                      PART B
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">(b) Vessel Type & Port Infrastructure Fit:</span>
                      <p className="text-slate-600 mt-0.5">
                        Evaluates Capesize, Panamax, Supramax, and Handysize feasibility across 5 origins (Australia, US, Mozambique, Indonesia, Russia) and East Coast Indian discharge ports: Paradip (17.1m), Vizag (18.1m), Gangavaram (21m), Gopalpur (14.5m), Dhamra (18.5m), Haldia (8.5m), factoring in draft, LOA, beam, and daily discharge TPD rates.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
                    <div className="p-2 rounded bg-purple-50 border border-purple-200 text-purple-600 font-bold shrink-0">
                      PART C
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">(c) Idle Scenario Management & Deadhead Reduction:</span>
                      <p className="text-slate-600 mt-0.5">
                        Algorithms detect empty ballast legs and automatically compute triangular backhaul routing (e.g. Paradip/Dhamra discharge ➔ SE Asia / Australia backhaul tramp) cutting ballast days from 18 to 4.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-start gap-3">
                    <div className="p-2 rounded bg-sky-50 border border-sky-200 text-sky-600 font-bold shrink-0">
                      PART D
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">(d) Risk Mitigation & Early Warning Radar:</span>
                      <p className="text-slate-600 mt-0.5">
                        Coupled with live IMD weather data (depression, cyclone risk, swell height) and AIS port waiting queues to compute demurrage risk buffers and dynamic spot-vs-COA hedge ratios (e.g., 70% COA / 30% Spot).
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Profile Credentials Clearance */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900">Verified Profile Clearance:</span>
                  <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px] font-bold">
                    CLEARANCE: LEVEL 5 (UNRESTRICTED)
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Officer Name</span>
                    <span className="font-semibold text-slate-800">Lead Chartering Officer</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Organization</span>
                    <span className="font-semibold text-slate-800">East Coast Bulk Alliance</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Access Token</span>
                    <span className="font-mono font-semibold text-slate-800">PS26006-COA-LEAD</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contract Authority</span>
                    <span className="font-semibold text-emerald-700">3M/6M COA Execution</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Ready to explore with this role? Click below to instantly authenticate.
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPSModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPSModalOpen(false);
                    handleQuickDemo('charterer');
                  }}
                  className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Grant Profile Access & Launch Terminal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
