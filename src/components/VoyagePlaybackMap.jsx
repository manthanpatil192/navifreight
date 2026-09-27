import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Search, Plus, Minus, RotateCcw, 
  Navigation, Maximize2, Minimize2, Anchor, Wind, AlertTriangle, ShieldCheck
} from 'lucide-react';

/**
 * High-Precision Vector Voyage Playback Map
 * 
 * Recreates the dark maritime AIS voyage tracking UI from the user's screenshot:
 * - Real-time animated bulk carrier ("Ocean Star • 13 kn") sailing from Gladstone, Australia to East Coast India (Gangavaram / Vizag / Paradip).
 * - Solid cyan "Travelled Route", dashed cyan "Remaining Route", and emerald "Shortcut Pass".
 * - Congestion radar pulses at destination ports, weather/cyclone risk zones.
 * - Interactive top search, layer checkboxes (Weather, Congestion, Nav Restrictions, Alternative Routes).
 * - Full bottom playback scrubber (Play/Pause, Departure, Progress %, AIS telemetry, Legend).
 */

// Key Geographic coordinates mapped to SVG viewbox [0, 0, 1000, 520]
// Equirectangular projection bounds: Lon 15°E to 160°E, Lat -42°S to 38°N
function project(lon, lat) {
  const x = ((lon - 15) / (160 - 15)) * 1000;
  const y = ((38 - lat) / (38 - (-42))) * 520;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

// 1. Australian Gladstone Departure -> East Coast India Main Route Waypoints
const VOYAGE_WAYPOINTS = [
  { lon: 151.25, lat: -23.84, name: 'Gladstone, Australia', speed: '12.8 kn', status: 'Departed Outer Terminal' },
  { lon: 147.50, lat: -19.50, name: 'Great Barrier Reef Corridor', speed: '13.1 kn', status: 'Eco-Steaming Transit' },
  { lon: 143.00, lat: -11.00, name: 'Torres Strait Approach', speed: '11.8 kn', status: 'Pilotage Inward' },
  { lon: 135.00, lat: -10.50, name: 'Arafura Sea Deepwater', speed: '13.4 kn', status: 'Full Sea Speed' },
  { lon: 125.00, lat: -11.00, name: 'Timor Sea Transit', speed: '13.2 kn', status: 'Navigating Open Corridor' },
  { lon: 116.00, lat: -9.00,  name: 'Lombok Strait Gateway', speed: '12.0 kn', status: 'Tidal Current Navigation' },
  { lon: 105.00, lat: -6.50,  name: 'Sunda Strait Alternative Bypass', speed: '13.5 kn', status: 'Open Ocean Steaming' },
  { lon: 95.00,  lat: 2.00,   name: 'North Sumatra Basin', speed: '13.3 kn', status: 'Deep Water Passage' },
  { lon: 88.00,  lat: 10.00,  name: 'Bay of Bengal Deepwater Gate', speed: '13.0 kn', status: 'Monitoring Synoptic Sea-State' },
  { lon: 85.50,  lat: 15.00,  name: 'Bay of Bengal Central Corridor', speed: '13.1 kn', status: 'Approaching 80 NM Siding Gate' },
  { lon: 83.25,  lat: 17.65,  name: 'Gangavaram / Visakhapatnam Approach', speed: '10.5 kn', status: 'Outer Anchorage Standby' }
];

// Pre-calculate SVG pixel points for route
const ROUTE_POINTS = VOYAGE_WAYPOINTS.map(w => project(w.lon, w.lat));

// 2. Shortcut Pass Waypoints (Through Lombok & Sunda Strait inner corridor)
const SHORTCUT_WAYPOINTS = [
  { lon: 135.00, lat: -10.50 },
  { lon: 122.00, lat: -8.50 },
  { lon: 115.80, lat: -8.30 }, // Lombok Pass
  { lon: 108.50, lat: -4.50 }, // Java Sea
  { lon: 105.90, lat: -5.90 }, // Sunda Strait
  { lon: 98.00,  lat: 0.50 },
  { lon: 88.00,  lat: 10.00 }
];
const SHORTCUT_POINTS = SHORTCUT_WAYPOINTS.map(w => project(w.lon, w.lat));

export default function VoyagePlaybackMap({ 
  onPortSelect,
  className = '',
  embedded = false,
  showControls = true
}) {
  const [progress, setProgress] = useState(68); // Start ~68% into voyage (Bay of Bengal entry, matching screenshot)
  const [isPlaying, setIsPlaying] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Layer Toggles matching screenshot checkboxes
  const [layers, setLayers] = useState({
    weather: true,
    congestion: true,
    navRestrictions: true,
    alternativeRoutes: true
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  // Continuous Voyage Animation
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (time) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // Complete full journey in ~40 seconds
      setProgress((prev) => {
        const next = prev + (delta * 2.5);
        return next > 100 ? 0 : next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  // Calculate current ship coordinate along polyline based on progress % (0 - 100)
  const currentSegment = (() => {
    const totalSegments = ROUTE_POINTS.length - 1;
    const fraction = (progress / 100) * totalSegments;
    const index = Math.min(Math.floor(fraction), totalSegments - 1);
    const segmentProgress = fraction - index;

    const p1 = ROUTE_POINTS[index];
    const p2 = ROUTE_POINTS[index + 1];

    const currentX = p1[0] + (p2[0] - p1[0]) * segmentProgress;
    const currentY = p1[1] + (p2[1] - p1[1]) * segmentProgress;

    // Heading calculation in degrees
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    const wp = VOYAGE_WAYPOINTS[Math.min(index + 1, VOYAGE_WAYPOINTS.length - 1)];

    return {
      x: currentX,
      y: currentY,
      angle: angleDeg,
      waypoint: wp,
      index
    };
  })();

  // Build Travelled Route (solid cyan) and Remaining Route (dashed cyan) SVG paths
  const travelledPath = (() => {
    let d = `M ${ROUTE_POINTS[0][0]} ${ROUTE_POINTS[0][1]}`;
    for (let i = 1; i <= currentSegment.index; i++) {
      d += ` L ${ROUTE_POINTS[i][0]} ${ROUTE_POINTS[i][1]}`;
    }
    d += ` L ${currentSegment.x} ${currentSegment.y}`;
    return d;
  })();

  const remainingPath = (() => {
    let d = `M ${currentSegment.x} ${currentSegment.y}`;
    for (let i = currentSegment.index + 1; i < ROUTE_POINTS.length; i++) {
      d += ` L ${ROUTE_POINTS[i][0]} ${ROUTE_POINTS[i][1]}`;
    }
    return d;
  })();

  const shortcutPathD = (() => {
    return SHORTCUT_POINTS.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt[0]} ${pt[1]}`, '');
  })();

  // Key Destination & Origin Port coordinates
  const pGladstone = project(151.25, -23.84);
  const pGangavaram = project(83.22, 17.62);
  const pVizag = project(83.30, 17.70);
  const pParadip = project(86.67, 20.26);
  const pDhamra = project(87.01, 20.82);

  // Weather risk coordinates (Bay of Bengal Depression & Coral Sea)
  const pWeatherBob = project(88.5, 15.0);
  const pWeatherCoral = project(149.0, -18.0);

  return (
    <div className={`relative w-full h-full bg-[#080c14] overflow-hidden select-none font-sans text-slate-200 ${className}`}>
      
      {/* 1. TOP INTERACTION BAR (Search Box + Layer Checkboxes) */}
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-auto">
        
        {/* Left: Vessel / Port Search */}
        <div className="relative w-64 sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vessel, port, or UN/LOCODE..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#0e1726]/90 hover:bg-[#0e1726] focus:bg-[#0e1726] border border-slate-700/70 focus:border-cyan-500/80 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-md transition-all shadow-lg"
          />
        </div>

        {/* Right: Checkbox Filters (Weather, Congestion, Nav Restrictions, Alternative Routes) */}
        <div className="flex items-center flex-wrap gap-2 text-xs bg-[#0e1726]/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-700/60 shadow-lg">
          
          {/* Weather */}
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={layers.weather}
              onChange={(e) => setLayers({ ...layers, weather: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-slate-300">Weather</span>
          </label>

          {/* Congestion */}
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={layers.congestion}
              onChange={(e) => setLayers({ ...layers, congestion: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-slate-300">Congestion</span>
          </label>

          {/* Nav Restrictions */}
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={layers.navRestrictions}
              onChange={(e) => setLayers({ ...layers, navRestrictions: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-slate-300">Nav Restrictions</span>
          </label>

          {/* Alternative Routes */}
          <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={layers.alternativeRoutes}
              onChange={(e) => setLayers({ ...layers, alternativeRoutes: e.target.checked })}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
            />
            <span className="text-[11px] font-medium text-slate-300">Alternative Routes</span>
          </label>

        </div>

      </div>

      {/* 2. FLOATING RIGHT ZOOM & NAVIGATION TOOLS */}
      <div className="absolute right-4 top-16 z-20 flex flex-col gap-1 bg-[#0e1726]/85 backdrop-blur-md border border-slate-700/60 rounded-xl p-1 shadow-xl">
        <button
          onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
          title="Zoom In"
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.85))}
          title="Zoom Out"
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomLevel(1)}
          title="Reset Zoom"
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setProgress(68)}
          title="Center on Active Ship"
          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. MAIN SVG VECTOR MAP CANVAS */}
      <div 
        className="w-full h-full transition-transform duration-300 ease-out origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg
          viewBox="0 0 1000 520"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Cyan Glow for Active Travelled Route */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Vessel Radar Pulse Gradient */}
            <radialGradient id="vesselPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>

            {/* Congested Port Red Pulse */}
            <radialGradient id="portRedPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Weather Risk Orange Pulse */}
            <radialGradient id="weatherPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Deep Ocean Background */}
          <rect x="0" y="0" width="1000" height="520" fill="#0b1120" />

          {/* Graticule Grid Lines (Longitudinal & Latitudinal oceanic tracks) */}
          <line x1="210" y1="0" x2="210" y2="520" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="470" y1="0" x2="470" y2="520" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="720" y1="0" x2="720" y2="520" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="0" y1="260" x2="1000" y2="260" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* ========================================================================= */}
          {/* LANDMASSES (Dark Charcoal #1a2234 with subtle borders)                    */}
          {/* ========================================================================= */}
          <g fill="#182234" stroke="#2a3850" strokeWidth="0.75" strokeLinejoin="round">
            
            {/* AFRICA & ARABIA (Left Side) */}
            <path d="
              M 80 40 
              Q 120 45 160 40 
              L 180 60 L 195 85 L 185 110 L 205 135 L 225 150 L 235 180 
              L 230 220 L 210 260 L 195 310 L 180 370 L 155 420 L 140 450 
              L 125 435 L 100 380 L 85 340 L 75 300 L 60 250 L 50 190 
              L 55 120 L 70 60 Z
            " />

            {/* Madagascar */}
            <path d="M 235 340 Q 248 370 230 420 Q 215 390 222 350 Z" />

            {/* Arabian Peninsula & Red Sea */}
            <path d="
              M 205 135 
              L 240 120 L 275 140 L 290 175 L 260 205 L 235 180 Z
            " />

            {/* Persian Gulf & Iran/Pakistan Coast */}
            <path d="
              M 275 140 
              L 310 125 L 340 135 L 370 150 L 400 160 Z
            " />

            {/* INDIA & SOUTH ASIA (Central Geographic Focus) */}
            <path d="
              M 370 150 
              L 410 155 
              L 430 140 
              L 470 110 
              L 515 90 
              L 550 100 
              L 520 120 
              L 504 110 
              L 494 122 
              L 470 140 
              L 450 171 
              L 440 220 
              L 425 245 
              L 415 220 
              L 395 185 
              L 370 150 Z
            " fill="#1b2538" stroke="#364969" strokeWidth="1" />

            {/* Sri Lanka */}
            <path d="M 445 235 Q 455 255 448 265 Q 438 250 445 235 Z" fill="#1b2538" stroke="#364969" />

            {/* SOUTHEAST ASIA & MALAY PENINSULA */}
            <path d="
              M 550 100 
              L 580 130 L 600 170 L 610 220 L 615 255 
              L 600 250 L 590 210 L 570 180 L 550 140 Z
            " />

            {/* INDONESIA (Sumatra, Java, Borneo, Sulawesi) */}
            {/* Sumatra */}
            <path d="M 590 240 L 640 295 L 625 315 L 575 255 Z" />
            {/* Java & Bali & Lombok */}
            <path d="M 630 315 L 720 325 L 715 338 L 625 328 Z" />
            {/* Borneo */}
            <path d="M 645 225 L 690 215 L 710 260 L 660 280 Z" />
            {/* Sulawesi */}
            <path d="M 725 230 L 760 240 L 745 290 L 720 270 Z" />
            {/* Papua New Guinea */}
            <path d="M 830 265 L 910 285 L 890 325 L 825 305 Z" />

            {/* AUSTRALIA (Right Side Departure Focus) */}
            <path d="
              M 770 345 
              L 810 340 
              L 845 320 
              L 877 335 
              L 865 375 
              L 910 395 
              L 940 425 
              L 945 470 
              L 915 500 
              L 850 495 
              L 790 480 
              L 740 430 
              L 714 401 
              L 730 355 
              Z
            " fill="#1c273b" stroke="#3b5073" strokeWidth="1" />

          </g>

          {/* ========================================================================= */}
          {/* GEOGRAPHICAL LABELS (Matching User Screenshot Typography)                 */}
          {/* ========================================================================= */}
          <g fill="#475569" fontSize="9" fontWeight="700" letterSpacing="0.08em" className="select-none">
            <text x="95" y="55">LIBYA</text>
            <text x="145" y="60">EGYPT</text>
            <text x="215" y="85">SAUDI ARABIA</text>
            <text x="75" y="115">NIGER</text>
            <text x="115" y="125">CHAD</text>
            <text x="150" y="130">SUDAN</text>
            <text x="180" y="175">ETHIOPIA</text>
            <text x="100" y="240">DR CONGO</text>
            <text x="165" y="255">TANZANIA</text>
            <text x="80" y="300">ANGOLA</text>
            <text x="125" y="315">ZAMBIA</text>
            <text x="85" y="380">NAMIBIA</text>
            <text x="110" y="440">SOUTH AFRICA</text>

            <text x="635" y="285" fill="#64748b" fontSize="10">INDONESIA</text>
            <text x="815" y="420" fill="#64748b" fontSize="12">AUSTRALIA</text>

            <text x="360" y="380" fill="#334155" fontSize="14" fontStyle="italic" letterSpacing="0.15em">
              Indian Ocean
            </text>
            <text x="880" y="80" fill="#334155" fontSize="13" fontStyle="italic">
              Pacific Ocean
            </text>
          </g>

          {/* ========================================================================= */}
          {/* WEATHER / CYCLONE RISK ZONES (If Layer Active)                           */}
          {/* ========================================================================= */}
          {layers.weather && (
            <g>
              {/* Bay of Bengal Weather Alert */}
              <circle cx={pWeatherBob[0]} cy={pWeatherBob[1]} r="32" fill="url(#weatherPulse)" />
              <circle 
                cx={pWeatherBob[0]} 
                cy={pWeatherBob[1]} 
                r="30" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="1.5" 
                strokeDasharray="4 4"
                className="animate-spin"
                style={{ transformOrigin: `${pWeatherBob[0]}px ${pWeatherBob[1]}px`, animationDuration: '18s' }}
              />
              <circle cx={pWeatherBob[0]} cy={pWeatherBob[1]} r="4" fill="#f59e0b" />

              {/* Coral Sea Cyclonic Swell */}
              <circle cx={pWeatherCoral[0]} cy={pWeatherCoral[1]} r="24" fill="url(#weatherPulse)" />
              <circle cx={pWeatherCoral[0]} cy={pWeatherCoral[1]} r="22" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3" />
            </g>
          )}

          {/* ========================================================================= */}
          {/* ALTERNATIVE SHORTCUT PASS ROUTE (Green Dashed)                            */}
          {/* ========================================================================= */}
          {layers.alternativeRoutes && (
            <g>
              <path
                d={shortcutPathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="5 5"
                opacity="0.8"
              />
              <text x="640" y="300" fill="#10b981" fontSize="8" fontWeight="bold">
                Lombok / Sunda Shortcut
              </text>
            </g>
          )}

          {/* ========================================================================= */}
          {/* REMAINING ROUTE (Cyan Dashed)                                             */}
          {/* ========================================================================= */}
          <path
            d={remainingPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.2"
            strokeDasharray="6 4"
            opacity="0.85"
          />

          {/* ========================================================================= */}
          {/* TRAVELLED ROUTE (Solid Glowing Cyan)                                      */}
          {/* ========================================================================= */}
          <path
            d={travelledPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="3"
            filter="url(#cyanGlow)"
            strokeLinecap="round"
          />

          {/* ========================================================================= */}
          {/* DESTINATION CONGESTED PORTS (Red Pulsing Circles)                         */}
          {/* ========================================================================= */}
          {layers.congestion && (
            <g>
              {/* Gangavaram Port (INGGV) */}
              <circle cx={pGangavaram[0]} cy={pGangavaram[1]} r="20" fill="url(#portRedPulse)" />
              <circle cx={pGangavaram[0]} cy={pGangavaram[1]} r="18" fill="none" stroke="#ef4444" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: `${pGangavaram[0]}px ${pGangavaram[1]}px`, animationDuration: '3s' }} />
              <circle cx={pGangavaram[0]} cy={pGangavaram[1]} r="4" fill="#ef4444" />
              <g transform={`translate(${pGangavaram[0] - 80}, ${pGangavaram[1] + 5})`}>
                <rect x="0" y="0" width="75" height="15" rx="3" fill="#0f172a" stroke="#ef4444" strokeWidth="0.8" />
                <text x="4" y="11" fill="#fca5a5" fontSize="8" fontWeight="bold">Gangavaram INGGV</text>
              </g>

              {/* Visakhapatnam Port (INVTZ) */}
              <circle cx={pVizag[0]} cy={pVizag[1]} r="4" fill="#06b6d4" />
              <g transform={`translate(${pVizag[0] + 8}, ${pVizag[1] - 4})`}>
                <rect x="0" y="0" width="55" height="15" rx="3" fill="#0f172a" stroke="#06b6d4" strokeWidth="0.8" />
                <text x="4" y="11" fill="#67e8f9" fontSize="8" fontWeight="bold">Vizag INVTZ</text>
              </g>

              {/* Paradip Port (INPRT) */}
              <circle cx={pParadip[0]} cy={pParadip[1]} r="18" fill="url(#portRedPulse)" opacity="0.7" />
              <circle cx={pParadip[0]} cy={pParadip[1]} r="4" fill="#ef4444" />
              <g transform={`translate(${pParadip[0] + 8}, ${pParadip[1] - 4})`}>
                <rect x="0" y="0" width="60" height="15" rx="3" fill="#0f172a" stroke="#ef4444" strokeWidth="0.8" />
                <text x="4" y="11" fill="#fca5a5" fontSize="8" fontWeight="bold">Paradip INPRT</text>
              </g>
            </g>
          )}

          {/* Departure Port: Gladstone, Australia */}
          <g transform={`translate(${pGladstone[0]}, ${pGladstone[1]})`}>
            <circle cx="0" cy="0" r="10" fill="url(#vesselPulse)" />
            <circle cx="0" cy="0" r="4" fill="#06b6d4" />
            <text x="-75" y="16" fill="#e2e8f0" fontSize="8" fontWeight="bold">
              Gladstone Terminal 🇦🇺
            </text>
          </g>

          {/* ========================================================================= */}
          {/* THE MOVING BULK CARRIER ("Ocean Star • 13 kn")                            */}
          {/* ========================================================================= */}
          <g transform={`translate(${currentSegment.x}, ${currentSegment.y})`}>
            
            {/* Animated Radar Pulse behind vessel */}
            <circle cx="0" cy="0" r="16" fill="url(#vesselPulse)" />
            <circle 
              cx="0" 
              cy="0" 
              r="22" 
              fill="none" 
              stroke="#06b6d4" 
              strokeWidth="1.2" 
              opacity="0.6"
              className="animate-ping"
              style={{ transformOrigin: '0 0', animationDuration: '2.5s' }}
            />

            {/* Ship Body & Directional Arrow */}
            <g transform={`rotate(${currentSegment.angle + 90})`}>
              <circle cx="0" cy="0" r="8" fill="#0e7490" stroke="#22d3ee" strokeWidth="2" />
              {/* Directional navigation chevron pointer */}
              <polygon points="0,-7 5,5 0,2 -5,5" fill="#ffffff" />
            </g>

            {/* FLOATING VESSEL BADGE: "Ocean Star • 13 kn" (Matching Screenshot Exactly) */}
            <g transform="translate(-46, -26)">
              <rect
                x="0"
                y="0"
                width="92"
                height="18"
                rx="9"
                fill="#0f172a"
                stroke="#22d3ee"
                strokeWidth="1.2"
                filter="drop-shadow(0 2px 5px rgba(0,0,0,0.7))"
              />
              <circle cx="9" cy="9" r="3" fill="#22d3ee" className="animate-pulse" />
              <text
                x="17"
                y="12.5"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                letterSpacing="0.02em"
              >
                Ocean Star • {currentSegment.waypoint.speed}
              </text>
            </g>

          </g>

        </svg>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM PLAYBACK SCRUBBER & TELEMETRY CONTROLS (Exact Match)             */}
      {/* ========================================================================= */}
      {showControls && (
        <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-[#080c14] via-[#080c14]/95 to-transparent pt-6 pb-3 px-4 sm:px-6">
          
          {/* Control Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs mb-2">
            
            {/* Play/Pause Button + Departure Label */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg transition-transform cursor-pointer shrink-0"
                title={isPlaying ? 'Pause Playback' : 'Play Simulation'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-slate-950" /> : <Play className="w-4 h-4 fill-slate-950 ml-0.5" />}
              </button>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Departure:</span>
                <span className="text-white font-bold">Gladstone, Australia</span>
              </div>
            </div>

            {/* Playback Scrubber Slider */}
            <div className="flex-1 w-full max-w-md flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-mono shrink-0">
                Playback Progress: <strong className="text-cyan-400">{Math.round(progress)}%</strong>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress}
                onChange={(e) => {
                  setProgress(parseFloat(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Current AIS Telemetry */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span>Current AIS:</span>
              <span className="text-cyan-300 font-bold truncate max-w-[210px]">
                {currentSegment.waypoint.name}
              </span>
            </div>

          </div>

          {/* 5. LEGEND PILLS (Active Vessel, Travelled Route, Remaining Route, Shortcut Pass, Congested Port, Weather) */}
          <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 font-medium">
            
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-slate-200">Active Vessel</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-cyan-400 rounded" />
              <span>Travelled Route</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b border-cyan-400 border-dashed" />
              <span>Remaining Route</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-b border-emerald-400 border-dashed" />
              <span>Shortcut Pass</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Congested Port</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Weather / Nav Risk</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
