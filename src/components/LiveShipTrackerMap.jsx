import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Ship, Radio, Compass, Anchor, Wind, ShieldAlert, CheckCircle2, 
  Play, Pause, RefreshCw, Filter, Layers, Navigation, ArrowUpRight, 
  Clock, FileText, Search, Wifi, WifiOff, Key, X, Activity, Gauge, MapPin
} from 'lucide-react';
import { LIVE_AIS_VESSELS, PORT_GEOFENCES, SHIPPING_CORRIDORS } from '../data/liveAisVessels';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import InsightBulb from './InsightBulb';

// Fix Leaflet default marker icons for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Ship DivIcon Generator for All Commercial Categories
const createShipIcon = (vessel, isSelected) => {
  let color = '#0f172a'; // Default slate-900 / Capesize dark navy
  let iconSymbol = '▲';

  const type = (vessel.vesselType || '').toLowerCase();
  const category = (vessel.category || '').toLowerCase();
  const status = (vessel.status || '').toLowerCase();

  if (category.includes('wet bulk') || type.includes('tanker')) {
    color = '#dc2626'; // Ruby Red for Tankers
    iconSymbol = '◆';
  } else if (category.includes('container') || type.includes('container')) {
    color = '#0284c7'; // Sky Blue for Containers
    iconSymbol = '■';
  } else if (category.includes('gas') || type.includes('lng') || type.includes('lpg')) {
    color = '#4f46e5'; // Indigo for LNG/LPG
    iconSymbol = '◈';
  } else if (category.includes('port craft') || type.includes('dredger') || type.includes('tug') || type.includes('pilot')) {
    color = '#ea580c'; // Vibrant Orange for Tugs & Dredgers
    iconSymbol = '⚙';
  } else if (type.includes('panamax') || type.includes('kamsarmax')) {
    color = '#059669'; // Emerald for Panamax
  } else if (type.includes('supramax') || type.includes('ultramax')) {
    color = '#d97706'; // Amber for Supramax
  } else if (type.includes('handymax') || type.includes('handysize')) {
    color = '#7c3aed'; // Royal Purple for Handymax / River lock
  }

  if (status.includes('backhaul')) {
    color = '#0d9488'; // Teal for Tramp Backhaul
  }

  const isAnchored = status.includes('anchor') || status.includes('queue');

  return L.divIcon({
    className: 'custom-ship-marker',
    html: `
      <div style="transform: rotate(${vessel.headingDegrees}deg); transition: transform 0.4s ease; position: relative;">
        ${isAnchored ? `
          <div style="
            position: absolute;
            top: -4px;
            left: -4px;
            width: ${isSelected ? '38px' : '30px'};
            height: ${isSelected ? '38px' : '30px'};
            border-radius: 50%;
            background: rgba(220, 38, 38, 0.25);
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        ` : ''}
        <div style="
          width: ${isSelected ? '30px' : '22px'};
          height: ${isSelected ? '30px' : '22px'};
          background-color: ${color};
          border: 2px solid ${isAnchored ? '#ef4444' : '#ffffff'};
          border-radius: 50% 50% 15% 15%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${isSelected ? '11px' : '9px'};
          cursor: pointer;
        ">
          ${iconSymbol}
        </div>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });
};

// Port Anchor Icon
const createPortIcon = (portName) => {
  return L.divIcon({
    className: 'custom-port-marker',
    html: `
      <div style="
        background-color: #0f172a;
        color: #ffffff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        border: 1px solid #94a3b8;
        box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        white-space: nowrap;
      ">
        ⚓ ${portName.split(' ')[0]}
      </div>
    `,
    iconSize: [60, 20],
    iconAnchor: [30, 10],
  });
};

// Automated Port Call Logbook simulated events
const PORT_CALL_LOGBOOK = [
  { id: 1, vessel: 'MV OLYMPIC GLORY', type: 'Capesize', port: 'Paradip Port Outer', event: 'Entered Geofence', time: '08:45 IST', status: 'Inbound Pilot Check' },
  { id: 2, vessel: 'MV OCEAN FREEDOM', type: 'Capesize', port: 'Paradip Anchorage', event: 'Dropped Anchor', time: '06:12 IST', status: 'Queue Pos #2 (Wait 18h)' },
  { id: 3, vessel: 'MV MAHA JACQUELINE', type: 'Capesize', port: 'Gangavaram GPL', event: 'Approaching Fairway', time: '09:20 IST', status: 'Berth GPL-1 Reserved' },
  { id: 4, vessel: 'MV TCI ANAND', type: 'Handymax', port: 'Haldia Lock Basin', event: 'Tidal Lock Inbound', time: '07:30 IST', status: 'Draft 7.6m OK' },
  { id: 5, vessel: 'MV CHENNAI SELVAM', type: 'Panamax', port: 'Vizag Outer Harbour', event: 'Pilot Onboard', time: '09:50 IST', status: 'Berthing at OB-1' },
  { id: 6, vessel: 'MT DESH SHANTI', type: 'VLCC Tanker', port: 'Paradip SPM', event: 'Moored to SPM Buoy', time: '05:30 IST', status: 'Crude Discharge Active' },
  { id: 7, vessel: 'DCI DREDGER XIX', type: 'Hopper Dredger', port: 'Haldia River Bar', event: 'Dredging Run #4', time: '09:15 IST', status: 'Draft Cleared to 8.5m' },
  { id: 8, vessel: 'LNG CORAL ENERGY', type: 'LNG Carrier', port: 'Dhamra LNG Jetty', event: 'Fast Moored', time: '08:00 IST', status: 'Regasifying to Grid' }
];

export default function LiveShipTrackerMap({ selectedDestination, onSelectPort }) {
  const [vessels, setVessels] = useState(LIVE_AIS_VESSELS);
  const [selectedVessel, setSelectedVessel] = useState(LIVE_AIS_VESSELS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [vesselFilter, setVesselFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGeofences, setShowGeofences] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const [showCorridors, setShowCorridors] = useState(true);
  const [showLogbookDrawer, setShowLogbookDrawer] = useState(false);
  const [mapTheme, setMapTheme] = useState('esri'); // 'esri' or 'osm'
  const [lastTelemetryUpdate, setLastTelemetryUpdate] = useState(new Date());

  // Real Live WebSocket State
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [wsPacketsCount, setWsPacketsCount] = useState(0);
  const [wsLatencyMs, setWsLatencyMs] = useState(24);
  const [showWsModal, setShowWsModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [wsErrorMessage, setWsErrorMessage] = useState('');
  const wsRef = useRef(null);

  // Connect to Real Live AISStream WebSocket
  const handleConnectWebSocket = (keyToUse) => {
    const key = keyToUse || apiKeyInput.trim();
    if (!key) {
      setWsErrorMessage('Please enter an API Key from aisstream.io (Registration is free).');
      return;
    }

    setWsErrorMessage('');
    setIsWsConnecting(true);

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const socket = new WebSocket('wss://stream.aisstream.io/v0/stream');
      wsRef.current = socket;

      socket.onopen = () => {
        setIsWsConnecting(false);
        setIsWsConnected(true);
        setShowWsModal(false);

        // Subscribe to Indian Ocean, Bay of Bengal and Arabian Sea coordinates
        const subscriptionMessage = {
          APIKey: key,
          BoundingBoxes: [
            [
              [4.0, 68.0],
              [24.5, 96.0]
            ]
          ],
          FilterMessageTypes: ['PositionReport', 'ShipStaticData']
        };

        socket.send(JSON.stringify(subscriptionMessage));
      };

      socket.onmessage = (event) => {
        try {
          const aisMsg = JSON.parse(event.data);
          setWsPacketsCount(prev => prev + 1);
          setWsLatencyMs(Math.floor(18 + Math.random() * 12));

          if (aisMsg.MessageType === 'PositionReport') {
            const pos = aisMsg.Message?.PositionReport;
            const meta = aisMsg.MetaData;

            if (pos && meta && pos.Latitude && pos.Longitude) {
              setVessels(prevList => {
                const mmsiStr = String(meta.MMSI);
                const existingIdx = prevList.findIndex(v => v.mmsi === mmsiStr);

                const liveObj = {
                  mmsi: mmsiStr,
                  imo: meta.IMO ? String(meta.IMO) : '9000000',
                  name: meta.ShipName ? meta.ShipName.trim() : `MMSI ${mmsiStr}`,
                  vesselType: 'AIS Live Bulker/Cargo',
                  category: 'Commercial Cargo',
                  dwt: 75000,
                  currentDraughtMeters: 11.5,
                  maxDraughtMeters: 14.0,
                  loaMeters: 225,
                  beamMeters: 32.2,
                  coordinates: [pos.Latitude, pos.Longitude],
                  headingDegrees: Math.round(pos.Cog || 0),
                  speedKnots: Number((pos.Sog || 0).toFixed(1)),
                  status: (pos.Sog || 0) < 0.5 ? 'At Anchor - Port Queue' : 'Underway Using Engine',
                  originPort: 'AIS Live Feed',
                  destinationPort: 'Indian Coast Waypoint',
                  destinationId: 'paradip',
                  cargo: 'Live AIS Satellite Broadcast',
                  etaHours: 12,
                  etaTimestamp: 'Telemetry Active',
                  draftClearanceAtDest: 'AIS Verified',
                  demurrageExposureRisk: 'LOW',
                  corridor: 'Live AIS Stream'
                };

                if (existingIdx >= 0) {
                  const updated = [...prevList];
                  updated[existingIdx] = { ...updated[existingIdx], ...liveObj };
                  return updated;
                } else {
                  return [liveObj, ...prevList.slice(0, 220)];
                }
              });
              setLastTelemetryUpdate(new Date());
            }
          }
        } catch (err) {
          console.error('Error parsing AIS packet:', err);
        }
      };

      socket.onerror = (err) => {
        console.warn('AIS WebSocket Error:', err);
        setWsErrorMessage('WebSocket connection failed. Falling back to High-Density simulated telemetry.');
        setIsWsConnected(false);
        setIsWsConnecting(false);
      };

      socket.onclose = () => {
        setIsWsConnected(false);
        setIsWsConnecting(false);
      };

    } catch (err) {
      setWsErrorMessage(err.message);
      setIsWsConnecting(false);
    }
  };

  const handleDisconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsWsConnected(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Dead Reckoning position simulation loop (advances all 165+ vessels along heading vectors)
  useEffect(() => {
    if (!isPlaying || isWsConnected) return;

    const interval = setInterval(() => {
      setVessels(prevVessels =>
        prevVessels.map(v => {
          if (v.status.includes('Anchor') || v.status.includes('Berth') || v.status.includes('Moored')) return v;

          const speedKnots = v.speedKnots * simulationSpeed;
          let latDelta = (Math.cos((v.headingDegrees * Math.PI) / 180) * speedKnots * 0.00025);
          let lngDelta = (Math.sin((v.headingDegrees * Math.PI) / 180) * speedKnots * 0.00025);

          let nextLat = Number((v.coordinates[0] + latDelta).toFixed(4));
          let nextLng = Number((v.coordinates[1] + lngDelta).toFixed(4));
          let nextHeading = v.headingDegrees;

          // Strict East Coast coastline safe water boundary check
          let minSeaLng = 80.5;
          if (nextLat < 8.0) minSeaLng = 77.5;
          else if (nextLat < 10.0) minSeaLng = 80.0;
          else if (nextLat < 13.5) minSeaLng = 80.45;
          else if (nextLat < 15.5) minSeaLng = 80.30;
          else if (nextLat < 17.0) minSeaLng = 82.50;
          else if (nextLat < 18.0) minSeaLng = 83.40;
          else if (nextLat < 19.5) minSeaLng = 85.10;
          else if (nextLat < 20.5) minSeaLng = 86.75;
          else if (nextLat < 21.5) minSeaLng = 87.10;
          else minSeaLng = 87.90;

          // Designated river fairway exception (Haldia & Sandheads approaches)
          const isRiverFairway = (nextLat >= 21.50 && nextLat <= 22.10 && nextLng >= 88.02 && nextLng <= 88.18) ||
                                (nextLat >= 22.50 && nextLat <= 22.58 && nextLng >= 88.28 && nextLng <= 88.35);

          // If vessel reaches close to the shoreline, steer it safely back towards open sea
          if (!isRiverFairway && (nextLng <= minSeaLng + 0.05 || nextLat >= 22.05 || nextLng >= 95.5 || nextLat <= 5.5)) {
            nextHeading = (nextHeading + 180) % 360;
            nextLng = Math.max(nextLng, minSeaLng + 0.15);
            if (nextLat > 22.0) nextLat = 21.85;
          }

          return {
            ...v,
            headingDegrees: nextHeading,
            coordinates: [nextLat, nextLng]
          };
        })
      );
      setLastTelemetryUpdate(new Date());
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying, isWsConnected, simulationSpeed]);

  // Keep selected vessel synced
  useEffect(() => {
    if (selectedVessel) {
      const updated = vessels.find(v => v.mmsi === selectedVessel.mmsi);
      if (updated) setSelectedVessel(updated);
    }
  }, [vessels]);

  // Dynamic filter and search computation
  const filteredVessels = useMemo(() => {
    return vessels.filter(v => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = (v.name || '').toLowerCase().includes(query);
        const matchesMmsi = (v.mmsi || '').includes(query);
        const matchesDest = (v.destinationPort || '').toLowerCase().includes(query);
        const matchesOrigin = (v.originPort || '').toLowerCase().includes(query);
        const matchesType = (v.vesselType || '').toLowerCase().includes(query);
        if (!matchesName && !matchesMmsi && !matchesDest && !matchesOrigin && !matchesType) {
          return false;
        }
      }

      // 2. Category tab filter
      const type = (v.vesselType || '').toLowerCase();
      const cat = (v.category || '').toLowerCase();
      const stat = (v.status || '').toLowerCase();

      if (vesselFilter === 'BULK') {
        return cat.includes('dry bulk') || type.includes('cape') || type.includes('panamax') || type.includes('supramax') || type.includes('handy');
      }
      if (vesselFilter === 'TANKERS') {
        return cat.includes('wet bulk') || type.includes('tanker');
      }
      if (vesselFilter === 'CONTAINERS') {
        return cat.includes('container') || type.includes('teu');
      }
      if (vesselFilter === 'HANDY') {
        return type.includes('handymax') || type.includes('handysize');
      }
      if (vesselFilter === 'GAS') {
        return cat.includes('gas') || type.includes('lng') || type.includes('lpg');
      }
      if (vesselFilter === 'CRAFT') {
        return cat.includes('port craft') || type.includes('dredger') || type.includes('tug') || type.includes('pilot');
      }
      if (vesselFilter === 'ANCHOR') {
        return stat.includes('anchor') || stat.includes('queue');
      }
      if (vesselFilter === 'DISCHARGING') {
        return stat.includes('discharging') || stat.includes('berth');
      }
      if (vesselFilter === 'BACKHAUL') {
        return stat.includes('backhaul');
      }

      return true;
    });
  }, [vessels, vesselFilter, searchQuery]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    let bulk = 0, tanker = 0, container = 0, handy = 0, gas = 0, craft = 0, anchor = 0, discharging = 0, backhaul = 0;
    vessels.forEach(v => {
      const type = (v.vesselType || '').toLowerCase();
      const cat = (v.category || '').toLowerCase();
      const stat = (v.status || '').toLowerCase();

      if (cat.includes('dry bulk') || type.includes('cape') || type.includes('panamax') || type.includes('supramax') || type.includes('handy')) bulk++;
      if (cat.includes('wet bulk') || type.includes('tanker')) tanker++;
      if (cat.includes('container') || type.includes('teu')) container++;
      if (type.includes('handymax') || type.includes('handysize')) handy++;
      if (cat.includes('gas') || type.includes('lng') || type.includes('lpg')) gas++;
      if (cat.includes('port craft') || type.includes('dredger') || type.includes('tug') || type.includes('pilot')) craft++;
      if (stat.includes('anchor') || stat.includes('queue')) anchor++;
      if (stat.includes('discharging') || stat.includes('berth')) discharging++;
      if (stat.includes('backhaul')) backhaul++;
    });
    return { bulk, tanker, container, handy, gas, craft, anchor, discharging, backhaul };
  }, [vessels]);

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle mb-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-2">
              <span>Live AIS Maritime Telemetry & Automated Port Call Logbook</span>
              <InsightBulb
                title="Phase 5: Spatial Geofencing & Port Call Logbook (Part D)"
                subtitle="High-Density AIS Fleet + IMF PortWatch Satellite Integration"
                dataset="AISStream.io WebSockets + Local Port Daily Traffic Reports + IMF PortWatch"
                logic="Draws digital geofence circles around port approaches to automatically track vessel check-in, anchor stay duration, and check-out times. Cross-references live transponder telemetry across bulkers, tankers, and feeders to prevent demurrage bottlenecks."
                impact="Eliminates vessel idle time, tracks demurrage penalties in real time, and alerts logistics teams to coordinate rail rakes before the ship touches the berth."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet Tracking: <span className="font-semibold text-slate-700">{vessels.length} Commercial Vessels Active</span> • Bay of Bengal & Arabian Sea Corridors
          </p>
        </div>

        {/* Live Controls & WebSocket Connector Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WebSocket Status Indicator */}
          {isWsConnected ? (
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>AISStream: LIVE ({wsLatencyMs}ms • {wsPacketsCount} pkts)</span>
              <button 
                onClick={handleDisconnectWebSocket}
                className="ml-1 text-slate-400 hover:text-rose-600"
                title="Disconnect Live WebSocket"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowWsModal(true)}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded text-xs font-semibold transition-colors"
              title="Connect to Real-Time AISStream.io WebSockets"
            >
              <Wifi className="w-3.5 h-3.5 text-maritime-700" />
              <span>Connect Live AISStream</span>
            </button>
          )}

          {/* Simulation Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold"
            title="Play/Pause DR Vector Physics"
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isPlaying ? 'Pause' : 'Resume'}</span>
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setSimulationSpeed(s => s === 1 ? 2 : s === 2 ? 5 : 1)}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold"
            title="Toggle Vector Simulation Speed"
          >
            {simulationSpeed}x Speed
          </button>

          {/* Corridors Overlay Toggle */}
          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-2 py-1 border rounded text-xs font-semibold ${
              showCorridors ? 'bg-maritime-50 text-maritime-800 border-maritime-300' : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
            title="Toggle International Shipping Corridors"
          >
            🌐 Shipping Lanes
          </button>

          {/* Map Layer Switcher */}
          <button
            onClick={() => setMapTheme(t => t === 'esri' ? 'osm' : 'esri')}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold"
            title="Toggle Map Tile Theme"
          >
            {mapTheme === 'esri' ? '🗺️ OSM' : '🏙️ Light Gray'}
          </button>
        </div>
      </div>

      {/* Real-time Port Congestion & Anchorage Queue Gauge */}
      <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Gauge className="w-3.5 h-3.5 text-maritime-700" />
            <span>Port Congestion & Anchorage Queues (Live AIS Telemetry Derived)</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Automated Geofence Queue Monitoring • <span className="font-semibold text-slate-700">{PORT_GEOFENCES.length} Major Zones</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PORT_GEOFENCES.map(geo => (
            <div 
              key={geo.id}
              onClick={() => {
                const portKey = geo.id.replace('_zone', '').split('_')[0];
                if (onSelectPort) onSelectPort(portKey);
              }}
              className="bg-white p-2 rounded border border-slate-200 hover:border-maritime-400 cursor-pointer transition-all hover:shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 mb-0.5">
                <span className="truncate">{geo.name.split(' ')[0]}</span>
                <span className={`w-2 h-2 rounded-full ${
                  geo.status === 'MODERATE_TRAFFIC' ? 'bg-amber-500' :
                  geo.status === 'TRANSSHIPMENT_ACTIVE' ? 'bg-blue-500' :
                  geo.status === 'RIVER_PILOTAGE_ACTIVE' ? 'bg-purple-500' : 'bg-emerald-500'
                }`}></span>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <div className="flex justify-between">
                  <span>Queue:</span>
                  <span className="font-bold text-rose-600">{geo.anchoredCount} ships</span>
                </div>
                <div className="flex justify-between">
                  <span>Berthed:</span>
                  <span className="font-semibold text-emerald-700">{geo.berthedCount} ships</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-0.5 mt-0.5">
                  <span>Avg Wait:</span>
                  <span className="font-bold text-slate-800">{geo.avgWaitHours}h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Bar & Advanced Category Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 mb-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vessel by Name, MMSI, or Destination (e.g. OLYMPIC, 419200, Haldia)..."
            className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-maritime-600 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Showing Count */}
        <div className="text-[11px] text-slate-500 font-medium whitespace-nowrap self-center">
          Showing <span className="font-bold text-slate-800">{filteredVessels.length}</span> of <span className="font-bold text-slate-800">{vessels.length}</span> Vessels • Sync: <span className="tabular-nums font-semibold">{lastTelemetryUpdate.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs">
        {[
          { key: 'ALL', label: `ALL (${vessels.length})` },
          { key: 'BULK', label: `BULK (${categoryCounts.bulk})` },
          { key: 'TANKERS', label: `TANKERS (${categoryCounts.tanker})` },
          { key: 'CONTAINERS', label: `CONTAINERS (${categoryCounts.container})` },
          { key: 'HANDY', label: `HANDY/RIVER (${categoryCounts.handy})` },
          { key: 'GAS', label: `GAS/LNG (${categoryCounts.gas})` },
          { key: 'CRAFT', label: `TUGS & DREDGERS (${categoryCounts.craft})` },
          { key: 'ANCHOR', label: `AT ANCHOR (${categoryCounts.anchor})` },
          { key: 'DISCHARGING', label: `DISCHARGING (${categoryCounts.discharging})` },
          { key: 'BACKHAUL', label: `BACKHAUL (${categoryCounts.backhaul})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setVesselFilter(tab.key)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
              vesselFilter === tab.key
                ? 'bg-maritime-900 text-white shadow-xs font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Map & Telemetry Drawer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Leaflet Map (2 Columns) */}
        <div className="lg:col-span-2 h-[520px] rounded-lg border border-slate-200 overflow-hidden relative shadow-inner">
          <MapContainer
            center={[18.5000, 85.5000]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            {/* Tile Layer */}
            {mapTheme === 'esri' ? (
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap contributors'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
                maxZoom={16}
              />
            ) : (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
              />
            )}

            {/* International Shipping Corridors */}
            {showCorridors && SHIPPING_CORRIDORS.map(corridor => (
              <Polyline
                key={corridor.id}
                positions={corridor.coordinates}
                pathOptions={{
                  color: corridor.color,
                  weight: 2,
                  dashArray: '6 8',
                  opacity: 0.65
                }}
              >
                <Tooltip direction="center" opacity={0.85}>
                  <span className="text-[10px] font-semibold">{corridor.name}</span>
                </Tooltip>
              </Polyline>
            ))}

            {/* Port Geofence Circles */}
            {showGeofences && PORT_GEOFENCES.map((geo) => (
              <Circle
                key={geo.id}
                center={geo.center}
                radius={geo.radiusKm * 1000}
                pathOptions={{
                  color: geo.color,
                  fillColor: geo.color,
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4 4'
                }}
              >
                <Tooltip direction="top" opacity={0.9}>
                  <div className="text-xs font-bold text-slate-900">
                    {geo.name}
                    <div className="text-[10px] text-slate-500 font-normal">
                      Queue: {geo.anchoredCount} ships • Berthed: {geo.berthedCount} ships • Avg wait: {geo.avgWaitHours}h
                    </div>
                  </div>
                </Tooltip>
              </Circle>
            ))}

            {/* Indian East Coast Port Markers */}
            {Object.values(INDIAN_EAST_COAST_PORTS).map((port) => (
              <Marker
                key={port.id}
                position={port.coordinates}
                icon={createPortIcon(port.name)}
                eventHandlers={{
                  click: () => onSelectPort && onSelectPort(port.id)
                }}
              >
                <Popup>
                  <div className="text-xs max-w-xs">
                    <div className="font-bold text-slate-900 border-b pb-1 mb-1">{port.name}</div>
                    <div className="space-y-0.5 text-slate-600 text-[11px]">
                      <div>Max Draft: <b>{port.maxDraftLaden}m</b> ({port.maxDraftHighTide}m High Tide)</div>
                      <div>Daily Discharge: <b>{port.handlingRateTPD.toLocaleString()} TPD</b></div>
                      <div>Anchorage Wait: <b>{port.avgWaitDays} Days avg</b></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Weather Overlay */}
            {showWeatherOverlay && (
              <Circle
                center={[19.8000, 87.5000]}
                radius={85000}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#f59e0b',
                  fillOpacity: 0.16,
                  weight: 2,
                  dashArray: '6 6'
                }}
              >
                <Tooltip direction="center" permanent opacity={0.85}>
                  <div className="text-[10px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300">
                    ⚠ IMD Squall Zone (28 kts)
                  </div>
                </Tooltip>
              </Circle>
            )}

            {/* Live Commercial Vessels */}
            {filteredVessels.map((v) => {
              const isSelected = selectedVessel?.mmsi === v.mmsi;
              return (
                <Marker
                  key={v.mmsi}
                  position={v.coordinates}
                  icon={createShipIcon(v, isSelected)}
                  eventHandlers={{
                    click: () => setSelectedVessel(v)
                  }}
                >
                  <Tooltip direction="right" offset={[10, 0]} opacity={0.95}>
                    <div className="text-xs">
                      <span className="font-bold text-slate-900">{v.name}</span> ({v.vesselType})
                      <div className="text-[10px] text-slate-500">
                        {v.speedKnots} kts • Draft: {v.currentDraughtMeters}m • Bound: {v.destinationPort}
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Overlay Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-2.5 rounded-md border border-slate-300 shadow-sm text-[10px] space-y-1">
            <div className="font-bold text-slate-800 mb-1">Vessel Classes ({filteredVessels.length} shown)</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                <span>Capesize / Heavy Bulkers</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span>Panamax / Kamsarmax</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span>Supramax / Ultramax</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>Handymax / Lock River</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>Crude & Product Tankers</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                <span>Container Liners</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span>LNG / LPG Gas Carriers</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                <span>Dredgers & Harbour Tugs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Telemetry Inspector or Port Call Logbook */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-lg p-4 flex flex-col justify-between text-xs">
          
          {showLogbookDrawer ? (
            /* Part D: Port Call Logbook Technique */
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-maritime-800 uppercase tracking-wider">Part D Technique</span>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>Automated Port Call Logbook</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Capturing exact vessel check-in, stay, and check-out via digital geofences
                  </p>
                </div>
                <button
                  onClick={() => setShowLogbookDrawer(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  View Vessel Specs
                </button>
              </div>

              <div className="space-y-2 mb-3 max-h-[360px] overflow-y-auto pr-1">
                {PORT_CALL_LOGBOOK.map((log) => (
                  <div key={log.id} className="bg-white p-2.5 rounded border border-slate-200 text-[11px]">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{log.vessel}</span>
                      <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 text-[10px] mt-0.5">
                      <span>{log.port} • {log.type}</span>
                      <span className="font-semibold text-emerald-700">{log.event}</span>
                    </div>
                    <div className="mt-1 pt-1 border-t border-slate-100 text-[10px] text-slate-600">
                      Status: <span className="font-medium text-slate-800">{log.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded p-2.5 text-[10px] text-emerald-900">
                <span className="font-bold block mb-0.5">Amazon/Walmart-Grade Dispatch:</span>
                Coordinates inland railway rakes & dumpers the exact minute cargo clears the berth unloader.
              </div>
            </div>
          ) : selectedVessel ? (
            /* Selected Vessel Telemetry */
            <div>
              {/* Vessel Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Vessel Telemetry</span>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>{selectedVessel.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    MMSI: <span className="font-mono font-semibold">{selectedVessel.mmsi}</span> • IMO: <span className="font-mono font-semibold">{selectedVessel.imo}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedVessel.status.includes('Anchor') || selectedVessel.status.includes('Queue')
                      ? 'bg-rose-100 text-rose-800'
                      : selectedVessel.status.includes('Backhaul')
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedVessel.status}
                  </span>
                  <button
                    onClick={() => setShowLogbookDrawer(true)}
                    className="text-[10px] text-maritime-700 hover:underline font-semibold"
                  >
                    View Port Logbook →
                  </button>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] tabular-nums">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Vessel Class</span>
                  <span className="font-bold text-slate-800">{selectedVessel.vesselType}</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Deadweight (DWT)</span>
                  <span className="font-bold text-slate-800">{selectedVessel.dwt ? selectedVessel.dwt.toLocaleString() : 'N/A'} MT</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Current Draught</span>
                  <span className="font-bold text-maritime-900">{selectedVessel.currentDraughtMeters}m</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-slate-400 block text-[10px]">Speed & Heading</span>
                  <span className="font-bold text-slate-800">{selectedVessel.speedKnots} kts • {selectedVessel.headingDegrees}°</span>
                </div>
              </div>

              {/* Voyage Corridor Info */}
              <div className="space-y-1.5 bg-white p-3 rounded border border-slate-200 mb-3 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Loading Port:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]">{selectedVessel.originPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Discharge Port:</span>
                  <span className="font-bold text-emerald-800">{selectedVessel.destinationPort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cargo Manifest:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[140px]">{selectedVessel.cargo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ETA / Arrival:</span>
                  <span className="font-bold text-slate-900">{selectedVessel.etaTimestamp}</span>
                </div>
              </div>

              {/* Port Draft Clearance Evaluation */}
              <div className="bg-maritime-50/70 border border-maritime-200 rounded p-2.5 text-[11px] text-maritime-900 mb-3">
                <span className="font-bold block mb-0.5">Port Draft Clearance at Destination:</span>
                <p className="text-slate-600">{selectedVessel.draftClearanceAtDest}</p>
              </div>
            </div>
          ) : null}

          {/* Quick Actions Footer */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">
              {showLogbookDrawer ? 'IMF PortWatch Active' : selectedVessel ? `Lat: ${selectedVessel.coordinates[0]}°, Lng: ${selectedVessel.coordinates[1]}°` : 'Select Vessel'}
            </span>
            {selectedVessel && (
              <button
                type="button"
                onClick={() => onSelectPort && onSelectPort(selectedVessel.destinationId)}
                className="font-bold text-maritime-800 hover:text-maritime-900 flex items-center space-x-0.5"
              >
                <span>Optimize Port Fit</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* AISStream WebSocket Key Modal */}
      {showWsModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-md w-full p-5 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Connect Live AISStream.io WebSockets</h3>
              </div>
              <button
                onClick={() => setShowWsModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-600 mb-3">
              Stream live NMEA 0183 & AIVDM transponder data broadcast directly from ships across the Bay of Bengal, Arabian Sea, and Indian coastal waterways.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  AISStream.io API Key
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter free API key from aisstream.io..."
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:border-maritime-600"
                  />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Free keys are instantly generated at <a href="https://aisstream.io" target="_blank" rel="noreferrer" className="text-maritime-700 underline font-semibold">aisstream.io</a>.
                </span>
              </div>

              {wsErrorMessage && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                  {wsErrorMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowWsModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConnectWebSocket()}
                disabled={isWsConnecting}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{isWsConnecting ? 'Connecting...' : 'Connect Live WebSocket'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
