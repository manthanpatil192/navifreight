import React, { useState, useEffect } from 'react';
import { 
  Ship, Anchor, ShieldCheck, ArrowRight, Eye, EyeOff, 
  Lock, Mail, CheckCircle2, Building2, UserCheck
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
  },
  {
    id: 'port_authority',
    label: 'Port Infrastructure Authority',
    badge: 'PORT CONSTRAINT',
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
    label: 'Tramp Fleet Controller',
    badge: 'DEADHEAD OPTIMIZER',
    sublabel: 'Backhaul Tramp Routing & Ballast Reduction',
    email: 'fleet.dispatch@navifreight.com',
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
    // Map 'charterer' to 'logistics_manager' for backward compatibility
    const normalizedId = (roleId === 'charterer' || !roleId) ? 'logistics_manager' : roleId;
    const index = USER_ROLES.findIndex(r => r.id === normalizedId);
    const targetIndex = index !== -1 ? index : 0;
    
    handleRoleChange(targetIndex);
    const role = USER_ROLES[targetIndex];
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
                            <span className={`text-[8px] truncate w-full ${isSelected ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
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

                  {/* 1-Click Quick Demo Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Quick Profiles:
                    </span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('logistics_manager')}
                        className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Logistics Manager
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('port_authority')}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Port Auth
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo('dispatch')}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Dispatch
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* WHITE STATISTICS BAR                                                      */}
        {/* ========================================================================= */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
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
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">26+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Years of Maritime Experience</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Established operations in Indian ports</p>
            </div>

            {/* Stat 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Ship className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">284+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Owned & Chartered Vessels</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Capesize, Panamax & Supramax</p>
            </div>

            {/* Stat 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">650+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Port & Dispatch Staff</div>
              <p className="text-[11px] text-slate-400 mt-0.5">24/7 continuous operations team</p>
            </div>

            {/* Stat 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors shadow-subtle group">
              <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Anchor className="w-5 h-5" />
              </div>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">374k+</div>
              <div className="text-xs font-bold text-slate-700 mt-1">Voyages Safely Completed</div>
              <p className="text-[11px] text-slate-400 mt-0.5">Zero environmental incidents recorded</p>
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


