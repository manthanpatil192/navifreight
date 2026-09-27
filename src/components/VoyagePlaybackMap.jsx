import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Play, Pause, FastForward
} from 'lucide-react';

// Fix Leaflet default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Destination Indian East Coast Ports (High-priority bulk terminals)
const INDIAN_DESTINATION_PORTS = [
  { name: 'Paradip (INPRT)', lat: 20.2644, lon: 86.6706, state: 'Odisha', role: 'Primary Coking Coal Hub' },
  { name: 'Visakhapatnam (INVTZ)', lat: 17.6868, lon: 83.2185, state: 'Andhra Pradesh', role: 'RINL Steel Terminal' },
  { name: 'Gangavaram (INGGV)', lat: 17.6200, lon: 83.2350, state: 'Andhra Pradesh', role: 'Deepwater Capesize Berth' },
  { name: 'Dhamra (INDHM)', lat: 20.8167, lon: 86.9667, state: 'Odisha', role: 'TATA / SAIL Bulk Gate' },
  { name: 'Haldia (INHAL)', lat: 22.0238, lon: 88.0628, state: 'West Bengal', role: 'Riverine Coal Dock' }
];

// Origin International Loading Ports
const ORIGIN_PORTS = [
  { name: 'Gladstone (Australia)', lat: -23.8431, lon: 151.2589 },
  { name: 'Samarinda (Indonesia)', lat: -0.5022, lon: 117.1536 },
  { name: 'Taboneo (Indonesia)', lat: -3.6000, lon: 114.4833 },
  { name: 'Port of Vostochny (Russia)', lat: 42.7381, lon: 133.0803 },
  { name: 'Maputo TCM (Mozambique)', lat: -25.9692, lon: 32.5732 },
  { name: 'Beira Port (Mozambique)', lat: -19.8333, lon: 34.8389 }
];

// 7 Active Simulated Vessels across Australia, Indonesia, Russia & Mozambique
const SIMULATED_FLEET = [
  // 1. Australia (Core Flagship Capesize)
  {
    id: 'vessel-aus-1',
    name: 'Ocean Star',
    fullName: 'MV OCEAN STAR',
    type: 'Capesize Bulker (178,000 DWT)',
    flag: '🇦🇺',
    origin: 'Gladstone, Australia',
    destination: 'Visakhapatnam (INVTZ)',
    cargo: '160,000 MT Premium Low-Vol HCC',
    speed: '13.2 kn',
    color: '#00f0ff', // Electric Cyan
    offset: 0.65,
    coordinates: [
      [-23.84, 151.26],
      [-19.50, 147.50],
      [-11.00, 143.00],
      [-10.50, 135.00],
      [-11.00, 125.00],
      [-8.70, 115.70],
      [-6.00, 105.80],
      [2.00, 95.00],
      [10.00, 88.00],
      [15.00, 85.50],
      [17.69, 83.29]
    ]
  },

  // 2. Indonesia (Vessel A: Samarinda -> Paradip)
  {
    id: 'vessel-indo-1',
    name: 'Nusantara Bulk',
    fullName: 'MV NUSANTARA BULK',
    type: 'Panamax Carrier (82,000 DWT)',
    flag: '🇮🇩',
    origin: 'Samarinda, Indonesia',
    destination: 'Paradip Port (INPRT)',
    cargo: '74,000 MT Thermal Steam Coal',
    speed: '13.8 kn',
    color: '#10b981', // Emerald
    offset: 0.42,
    coordinates: [
      [-0.50, 117.15],
      [-3.50, 117.50],
      [-5.50, 110.50],
      [-5.90, 106.00],
      [0.00, 97.50],
      [5.50, 93.00],
      [12.00, 88.00],
      [17.50, 86.50],
      [20.26, 86.67]
    ]
  },

  // 3. Indonesia (Vessel B: Taboneo -> Haldia)
  {
    id: 'vessel-indo-2',
    name: 'Borneo Pioneer',
    fullName: 'MV BORNEO PIONEER',
    type: 'Supramax Carrier (56,000 DWT)',
    flag: '🇮🇩',
    origin: 'Taboneo, Indonesia',
    destination: 'Haldia Port (INHAL)',
    cargo: '52,000 MT Low-Ash Coal',
    speed: '12.4 kn',
    color: '#38bdf8', // Sky Cyan
    offset: 0.82,
    coordinates: [
      [-3.60, 114.48],
      [-2.00, 109.00],
      [1.25, 104.00],
      [3.00, 100.50],
      [6.00, 95.00],
      [14.00, 90.00],
      [19.00, 88.50],
      [22.02, 88.06]
    ]
  },

  // 4. Russia (Vessel A: Vostochny -> Vizag)
  {
    id: 'vessel-rus-1',
    name: 'Russian Valiant',
    fullName: 'MV RUSSIAN VALIANT',
    type: 'Capesize Bulker (115,000 DWT)',
    flag: '🇷🇺',
    origin: 'Port of Vostochny, Russia',
    destination: 'Visakhapatnam (INVTZ)',
    cargo: '110,000 MT High-Rank Coking Coal',
    speed: '14.1 kn',
    color: '#f43f5e', // Crimson Rose
    offset: 0.58,
    coordinates: [
      [42.74, 133.08],
      [35.00, 129.50],
      [30.00, 124.00],
      [23.00, 119.50],
      [15.00, 114.00],
      [5.00, 107.00],
      [1.30, 104.20],
      [2.50, 101.50],
      [6.00, 95.50],
      [11.50, 86.00],
      [17.69, 83.29]
    ]
  },

  // 5. Russia (Vessel B: Vostochny -> Dhamra)
  {
    id: 'vessel-rus-2',
    name: 'Siberian Falcon',
    fullName: 'MV SIBERIAN FALCON',
    type: 'Kamsarmax Bulker (84,000 DWT)',
    flag: '🇷🇺',
    origin: 'Port of Vostochny, Russia',
    destination: 'Dhamra Port (INDHM)',
    cargo: '72,000 MT Russian Anthracite & PCI',
    speed: '13.0 kn',
    color: '#fbbf24', // Amber
    offset: 0.22,
    coordinates: [
      [42.74, 133.08],
      [34.50, 129.00],
      [28.00, 123.00],
      [21.00, 118.00],
      [10.00, 111.00],
      [1.30, 104.20],
      [4.00, 99.00],
      [9.00, 93.00],
      [16.50, 88.00],
      [20.82, 86.97]
    ]
  },

  // 6. Mozambique (Vessel A: Maputo -> Gangavaram)
  {
    id: 'vessel-moz-1',
    name: 'Mozambique Express',
    fullName: 'MV MOZAMBIQUE EXPRESS',
    type: 'Post-Panamax (93,000 DWT)',
    flag: '🇲🇿',
    origin: 'Maputo TCM, Mozambique',
    destination: 'Gangavaram (INGGV)',
    cargo: '88,000 MT Met Coke',
    speed: '13.5 kn',
    color: '#c084fc', // Purple
    offset: 0.72,
    coordinates: [
      [-25.97, 32.58],
      [-20.00, 37.00],
      [-12.00, 43.00],
      [-4.00, 52.00],
      [1.50, 68.00],
      [5.80, 80.50],
      [10.00, 83.50],
      [15.00, 84.50],
      [17.62, 83.24]
    ]
  },

  // 7. Mozambique (Vessel B: Beira -> Paradip)
  {
    id: 'vessel-moz-2',
    name: 'Zambezi Trader',
    fullName: 'MV ZAMBEZI TRADER',
    type: 'Handymax Carrier (52,000 DWT)',
    flag: '🇲🇿',
    origin: 'Beira Port, Mozambique',
    destination: 'Paradip Port (INPRT)',
    cargo: '48,000 MT Coking Coal',
    speed: '12.1 kn',
    color: '#2dd4bf', // Teal
    offset: 0.32,
    coordinates: [
      [-19.83, 34.84],
      [-15.00, 42.00],
      [-5.00, 55.00],
      [2.00, 72.00],
      [5.90, 80.60],
      [12.00, 85.00],
      [17.00, 86.00],
      [20.26, 86.67]
    ]
  }
];

// Distance between two lat/lon points
function getDist(p1, p2) {
  const dLat = p2[0] - p1[0];
  const dLon = p2[1] - p1[1];
  return Math.sqrt(dLat * dLat + dLon * dLon);
}

// Total route nautical distance
function getRouteDist(coords) {
  let d = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    d += getDist(coords[i], coords[i + 1]);
  }
  return d;
}

// Calculate interpolated position and bearing
function calculatePositionAlongRoute(coords, progress) {
  const clampedProgress = ((progress % 1) + 1) % 1; // Normalize to [0, 1)
  const total = getRouteDist(coords);
  const target = clampedProgress * total;

  let acc = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const seg = getDist(p1, p2);

    if (acc + seg >= target || i === coords.length - 2) {
      const frac = seg === 0 ? 0 : (target - acc) / seg;
      const lat = p1[0] + (p2[0] - p1[0]) * frac;
      const lon = p1[1] + (p2[1] - p1[1]) * frac;

      // Bearing calculation
      const dLon = (p2[1] - p1[1]) * (Math.PI / 180);
      const lat1Rad = p1[0] * (Math.PI / 180);
      const lat2Rad = p2[0] * (Math.PI / 180);
      const y = Math.sin(dLon) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
      let heading = (Math.atan2(y, x) * 180) / Math.PI;
      heading = (heading + 360) % 360;

      return {
        lat,
        lon,
        heading: Math.round(heading),
        segmentIndex: i,
        pos: [lat, lon]
      };
    }
    acc += seg;
  }
  return {
    lat: coords[coords.length - 1][0],
    lon: coords[coords.length - 1][1],
    heading: 0,
    segmentIndex: coords.length - 2,
    pos: coords[coords.length - 1]
  };
}

// Auto-fit geographic bounds once on load, offsetting right padding for the sign-in card
function AutoFitWorldBounds() {
  const map = useMap();
  useEffect(() => {
    try {
      const isMobile = window.innerWidth < 640;
      map.fitBounds([
        [-28.0, 26.0],  // Mozambique & Southern Indian Ocean
        [46.0, 152.0]   // Russia Far East / Japan / Australia East
      ], {
        paddingTopLeft: [20, 20],
        paddingBottomRight: isMobile ? [20, 20] : [320, 20],
        maxZoom: 5,
        animate: false
      });
    } catch {
      // safe fallback
    }
  }, [map]);
  return null;
}

export default function VoyagePlaybackMap() {
  const [baseProgress, setBaseProgress] = useState(0.50);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(performance.now());

  // Continuous animation loop (60 FPS)
  useEffect(() => {
    if (!isPlaying) return;

    const animate = (time) => {
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // ~45 seconds for full loop at 1x
      setBaseProgress((prev) => {
        const next = prev + (delta * (0.022 * playbackSpeed));
        return next >= 1 ? 0 : next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  // Compute live vessel positions and split paths
  const fleetData = useMemo(() => {
    return SIMULATED_FLEET.map((vessel) => {
      const vesselProgress = (baseProgress + vessel.offset) % 1.0;
      const state = calculatePositionAlongRoute(vessel.coordinates, vesselProgress);
      
      // Sailed portion
      const sailed = vessel.coordinates.slice(0, state.segmentIndex + 1);
      sailed.push(state.pos);

      // Remaining portion
      const remaining = [state.pos, ...vessel.coordinates.slice(state.segmentIndex + 1)];

      return {
        ...vessel,
        state,
        sailed,
        remaining,
        progressPercent: Math.round(vesselProgress * 100)
      };
    });
  }, [baseProgress]);

  // Create vessel DivIcon
  const createVesselIcon = (vessel, heading) => {
    return L.divIcon({
      className: 'custom-fleet-ship-marker',
      iconSize: [110, 32],
      iconAnchor: [55, 16],
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <!-- Floating Vessel Tag -->
          <div style="
            background: rgba(11, 18, 30, 0.94);
            border: 1px solid ${vessel.color};
            border-radius: 9999px;
            padding: 1.5px 6px;
            display: flex;
            align-items: center;
            gap: 3.5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.8);
            white-space: nowrap;
            margin-bottom: 2px;
          ">
            <span style="font-size: 9px;">${vessel.flag}</span>
            <span style="font-size: 8.5px; font-weight: 700; color: #ffffff; font-family: monospace;">${vessel.name}</span>
            <span style="font-size: 8px; font-weight: 800; color: ${vessel.color};">${vessel.speed}</span>
          </div>

          <!-- Directional Ship Pointer -->
          <div style="position: relative; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: ${vessel.color};
              opacity: 0.35;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              transform: rotate(${heading}deg);
              width: 12px;
              height: 12px;
              background: ${vessel.color};
              clip-path: polygon(50% 0%, 0% 100%, 50% 75%, 100% 100%);
              filter: drop-shadow(0 0 4px ${vessel.color});
            "></div>
          </div>
        </div>
      `
    });
  };

  // Indian Port Radar Beacon DivIcon
  const createPortIcon = (port) => {
    return L.divIcon({
      className: 'custom-port-marker',
      iconSize: [84, 28],
      iconAnchor: [42, 14],
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="position: relative; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              border: 1.5px solid #00f0ff;
              opacity: 0.75;
              animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="width: 7px; height: 7px; border-radius: 50%; background: #00f0ff; box-shadow: 0 0 8px #00f0ff;"></div>
          </div>
          <div style="
            background: rgba(8, 12, 22, 0.90);
            border: 1px solid rgba(0, 240, 255, 0.6);
            border-radius: 4px;
            padding: 1px 4px;
            font-size: 8px;
            font-weight: 700;
            color: #00f0ff;
            font-family: monospace;
            white-space: nowrap;
            margin-top: 1px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.6);
          ">
            ${port.name.split(' ')[0]}
          </div>
        </div>
      `
    });
  };

  // Origin Port Amber DivIcon
  const createOriginIcon = (port) => {
    return L.divIcon({
      className: 'custom-origin-marker',
      iconSize: [96, 26],
      iconAnchor: [48, 13],
      html: `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 6px; height: 6px; border-radius: 50%; background: #fbbf24; box-shadow: 0 0 6px #f59e0b;"></div>
          <div style="
            background: rgba(12, 18, 28, 0.90);
            border: 1px solid rgba(245, 158, 11, 0.5);
            border-radius: 4px;
            padding: 1px 4px;
            font-size: 8px;
            font-weight: 600;
            color: #fbbf24;
            font-family: monospace;
            white-space: nowrap;
            margin-top: 1px;
          ">
            ${port.name}
          </div>
        </div>
      `
    });
  };

  return (
    <div className="relative w-full h-full bg-[#080c14] overflow-hidden select-none">
      
      {/* 1. REAL WORLD LEAFLET MAP WITH ESRI WORLD DARK GRAY (Clean, No Watermarks) */}
      <MapContainer
        center={[12.0, 85.0]}
        zoom={3}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={false}
        style={{ width: '100%', height: '100%', background: '#080c14' }}
      >
        <AutoFitWorldBounds />

        {/* Esri World Dark Gray Basemap: High-res, authentic geography, zero watermark */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* A. Destination Indian East Coast Ports with Radar Pings */}
        {INDIAN_DESTINATION_PORTS.map((port) => (
          <Marker
            key={port.name}
            position={[port.lat, port.lon]}
            icon={createPortIcon(port)}
          >
            <Popup className="custom-maritime-popup">
              <div className="text-xs p-1 text-slate-800">
                <div className="font-bold text-slate-900">{port.name}</div>
                <div className="text-emerald-700 font-semibold">{port.role}</div>
                <div className="text-slate-500 text-[10px]">Bay of Bengal Bulk Terminal</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* B. International Origin Ports */}
        {ORIGIN_PORTS.map((port) => (
          <Marker
            key={port.name}
            position={[port.lat, port.lon]}
            icon={createOriginIcon(port)}
          />
        ))}

        {/* C. Shipping Route Lines (Solid for Sailed, Dashed for Remaining) */}
        {fleetData.map((vessel) => (
          <React.Fragment key={`corridor-${vessel.id}`}>
            {/* Sailed Route (Solid, High-Contrast Glow) */}
            <Polyline
              positions={vessel.sailed}
              pathOptions={{
                color: vessel.color,
                weight: 2.2,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Remaining Course (Dashed) */}
            <Polyline
              positions={vessel.remaining}
              pathOptions={{
                color: vessel.color,
                weight: 1.5,
                dashArray: '5 7',
                opacity: 0.4,
                lineCap: 'round'
              }}
            />
          </React.Fragment>
        ))}

        {/* D. Live Moving Vessels */}
        {fleetData.map((vessel) => (
          <Marker
            key={vessel.id}
            position={vessel.state.pos}
            icon={createVesselIcon(vessel, vessel.state.heading)}
          >
            <Popup>
              <div className="text-xs p-1 text-slate-900 leading-snug">
                <div className="font-extrabold flex items-center gap-1.5 border-b border-slate-200 pb-1 mb-1">
                  <span>{vessel.flag}</span>
                  <span>{vessel.fullName}</span>
                </div>
                <div className="text-slate-700 font-semibold text-[11px]">{vessel.type}</div>
                <div className="text-emerald-700 font-medium text-[10px] mt-0.5">Cargo: {vessel.cargo}</div>
                <div className="text-slate-600 text-[10px]">Speed: {vessel.speed} • Heading: {vessel.state.heading}°</div>
                <div className="text-cyan-700 text-[10px] font-bold mt-1">Route: {vessel.origin} ➔ {vessel.destination}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 2. BOTTOM PLAYBACK SCRUBBER BAR (Left 80%, No Clutter, Clean Controls) */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-[330px] z-[500] pointer-events-auto">
        <div className="bg-[#0b1220]/90 backdrop-blur-xl border border-slate-700/80 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl flex flex-col gap-2">
          
          {/* Top Row: Playback & Active Fleet Status */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            
            {/* Left: Play/Pause and Speed */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-md shadow-emerald-500/30"
                title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 4 : 1)}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                title="Simulation Speed"
              >
                <FastForward className="w-3 h-3 text-cyan-400" />
                <span>{playbackSpeed}x</span>
              </button>

              <div className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-semibold text-white">7 Simulated Bulkers</span>
                <span className="text-slate-500 hidden md:inline">| East Coast Inbound</span>
              </div>
            </div>

            {/* Right: Country Corridors Badges */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[9px]">
              <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                🇦🇺 Australia (1)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                🇮🇩 Indonesia (2)
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60">
                🇷🇺 Russia (2)
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60">
                🇲🇿 Mozambique (2)
              </span>
            </div>

          </div>

          {/* Bottom Row: Scrubber Range Slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 w-9">
              {Math.round(baseProgress * 100)}%
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={baseProgress}
              onChange={(e) => setBaseProgress(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-[10px] font-mono text-emerald-400 hidden sm:inline">
              LIVE AIS CORRIDORS
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
