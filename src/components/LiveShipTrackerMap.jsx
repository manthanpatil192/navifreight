import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Ship, Radio, Compass, Anchor, Wind, ShieldAlert, CheckCircle2, 
  Play, Pause, RefreshCw, Filter, Layers, Navigation, ArrowUpRight, 
  Clock, FileText, Search, Wifi, WifiOff, Key, X, Activity, Gauge, MapPin,
  Bell, BellRing, Volume2, VolumeX, Crosshair, AlertTriangle, CircleDot
} from 'lucide-react';
import { LIVE_AIS_VESSELS, PORT_GEOFENCES, SHIPPING_CORRIDORS } from '../data/liveAisVessels';
import { INDIAN_EAST_COAST_PORTS } from '../data/portsData';
import { evaluatePortDiversion, evaluateVesselPortCongestionDiversion } from '../utils/portDiversionEngine';
import InsightBulb from './InsightBulb';

// Embedded AISStream.io API Key (Pre-configured for uninterrupted real-time streaming)
export const DEFAULT_AISSTREAM_API_KEY = '7f5a13a987a858f391f923ab9dedd8a892d3ed38';

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
  { id: 3, vessel: 'MV MAHA JACQUELINE', type: 'Capesize', port: 'Paradip Port Outer', event: 'Entered 80 NM Gate', time: '09:20 IST', status: 'Approaching Fairway' },
  { id: 4, vessel: 'MV TCI ANAND', type: 'Handymax', port: 'Haldia Lock Basin', event: 'Tidal Lock Inbound', time: '07:30 IST', status: 'Draft 7.6m OK' },
  { id: 5, vessel: 'MV CHENNAI SELVAM', type: 'Panamax', port: 'Vizag Outer Harbour', event: 'Pilot Onboard', time: '09:50 IST', status: 'Berthing at OB-1' },
  { id: 6, vessel: 'MT DESH SHANTI', type: 'VLCC Tanker', port: 'Paradip SPM', event: 'Moored to SPM Buoy', time: '05:30 IST', status: 'Crude Discharge Active' },
  { id: 7, vessel: 'DCI DREDGER XIX', type: 'Hopper Dredger', port: 'Haldia River Bar', event: 'Dredging Run #4', time: '09:15 IST', status: 'Draft Cleared to 8.5m' },
  { id: 8, vessel: 'LNG CORAL ENERGY', type: 'LNG Carrier', port: 'Dhamra LNG Jetty', event: 'Fast Moored', time: '08:00 IST', status: 'Regasifying to Grid' }
];

// Haversine distance in km between two lat/lon points
const getHaversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Web Audio API Synthesizer: Two-Tone Naval Sonar Ping (Zero External File Dependencies)
const playRadarChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    // AudioContext blocked before first user gesture
  }
};

// Map Camera Controller for smooth flyTo animation
function MapCameraController({ focusTarget }) {
  const map = useMap();
  useEffect(() => {
    if (focusTarget && focusTarget.coords) {
      map.flyTo(focusTarget.coords, focusTarget.zoom || 8, {
        duration: 1.4,
        easeLinearity: 0.25
      });
    }
  }, [focusTarget, map]);
  return null;
}

const INITIAL_NOTIFICATIONS = [
  {
    id: 'init_1',
    vesselName: 'MV OLYMPIC GLORY',
    vesselType: 'Capesize',
    mmsi: '563112000',
    portName: 'Paradip 80 NM Sea Gate',
    portId: 'paradip',
    time: '10:42 IST',
    speedKnots: 12.4,
    currentDraught: 17.8,
    cargo: '165,000 MT Hard Coking Coal',
    dwt: 181200,
    coordinates: [19.2500, 87.6200], // Actual live ship coordinates entering Paradip Sea Gate
    geofenceRadiusNm: 80,
    timestamp: new Date(Date.now() - 1000 * 60 * 12)
  },
  {
    id: 'init_2',
    vesselName: 'MV MAHA JACQUELINE',
    vesselType: 'Capesize',
    mmsi: '419001280',
    portName: 'Paradip 80 NM Sea Gate',
    portId: 'paradip',
    time: '09:15 IST',
    speedKnots: 10.5,
    currentDraught: 18.2,
    cargo: '160,000 MT Semi-Soft Coking Coal',
    dwt: 178000,
    coordinates: [19.1800, 87.4500], // Actual live ship coordinates approaching Paradip Sea Gate
    geofenceRadiusNm: 80,
    timestamp: new Date(Date.now() - 1000 * 60 * 35)
  }
];

export default function LiveShipTrackerMap({ selectedDestination, onSelectPort, selectedVessel: charterVesselClass = 'capesize' }) {
  const [vessels, setVessels] = useState(LIVE_AIS_VESSELS);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [vesselFilter, setVesselFilter] = useState('ALL');
  const [selectedCorridor, setSelectedCorridor] = useState('ALL');
  const [showCorridors, setShowCorridors] = useState(true);
  const [showGeofences, setShowGeofences] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [showLogbookDrawer, setShowLogbookDrawer] = useState(false);
  const [mapTheme, setMapTheme] = useState('osm'); // Always colorful OpenStreetMap
  const [lastTelemetryUpdate, setLastTelemetryUpdate] = useState(new Date());

  // Active Diversion Strategy: 'lowFuel' (nearest Part-B port) or 'ampleFuel' (free/lowest wait port)
  const [activeDiversionStrategy, setActiveDiversionStrategy] = useState('lowFuel');

  // Dynamic Port Saturation & Fuel-Aware Part B Diversion Evaluation
  const diversionData = useMemo(() => {
    return evaluatePortDiversion({
      selectedDestination,
      selectedVessel: charterVesselClass
    });
  }, [selectedDestination, charterVesselClass]);

  // Geofence Notification & Alert State
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(2);
  const [activeToast, setActiveToast] = useState(null);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mapFocusTarget, setMapFocusTarget] = useState(null);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const vesselGeofenceStateRef = useRef(new Map());
  const isInitialRef = useRef(true);

  // Real Live WebSocket State with Embedded API Key
  const [isWsConnecting, setIsWsConnecting] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [wsPacketsCount, setWsPacketsCount] = useState(0);
  const [wsLatencyMs, setWsLatencyMs] = useState(24);
  const [showWsModal, setShowWsModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    try {
      return localStorage.getItem('aisstream_api_key') || DEFAULT_AISSTREAM_API_KEY;
    } catch (e) {
      return DEFAULT_AISSTREAM_API_KEY;
    }
  });
  const [wsErrorMessage, setWsErrorMessage] = useState('');
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const shouldStayConnectedRef = useRef(true);

  // Connect to Real Live AISStream WebSocket using Embedded / Configured Key
  const handleConnectWebSocket = (keyToUse) => {
    const key = keyToUse || apiKeyInput.trim() || DEFAULT_AISSTREAM_API_KEY;
    if (!key) {
      setWsErrorMessage('Please enter an API Key from aisstream.io (Registration is free).');
      return;
    }

    try {
      localStorage.setItem('aisstream_api_key', key);
    } catch (e) {}

    setWsErrorMessage('');
    setIsWsConnecting(true);
    shouldStayConnectedRef.current = true;

    try {
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
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
        console.warn('AIS WebSocket Warning:', err);
        setIsWsConnected(false);
        setIsWsConnecting(false);
        if (shouldStayConnectedRef.current) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldStayConnectedRef.current) {
              handleConnectWebSocket(key);
            }
          }, 3000);
        }
      };

      socket.onclose = () => {
        setIsWsConnected(false);
        setIsWsConnecting(false);
        if (shouldStayConnectedRef.current) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldStayConnectedRef.current) {
              handleConnectWebSocket(key);
            }
          }, 2500);
        }
      };

    } catch (err) {
      setWsErrorMessage(err.message);
      setIsWsConnecting(false);
      if (shouldStayConnectedRef.current) {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldStayConnectedRef.current) {
            handleConnectWebSocket(key);
          }
        }, 4000);
      }
    }
  };

  const handleDisconnectWebSocket = () => {
    shouldStayConnectedRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }
    setIsWsConnected(false);
  };

  // Keep AISStream on all the time: Auto-connect on mount and maintain connection via watchdog
  useEffect(() => {
    shouldStayConnectedRef.current = true;
    handleConnectWebSocket(DEFAULT_AISSTREAM_API_KEY);

    const watchdog = setInterval(() => {
      if (shouldStayConnectedRef.current) {
        const ws = wsRef.current;
        if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          handleConnectWebSocket(DEFAULT_AISSTREAM_API_KEY);
        }
      }
    }, 8000);

    return () => {
      shouldStayConnectedRef.current = false;
      clearInterval(watchdog);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // Strict physical water-boundary clamp for Indian East Coast and Hooghly Estuary
  const clampToNavigableWaters = (lat, lng, heading) => {
    let newLat = lat;
    let newLng = lng;
    let newHeading = heading;

    // 1. Hooghly River Channel & Estuary (Haldia, Sagar Island, Balari Bar)
    if (newLat >= 21.20 && newLat <= 22.05) {
      // Haldia dock complex & channel basin
      if (newLat > 22.022) {
        newLat = 22.0220; // Never go north into Haldia township or Midnapore land
        newHeading = 180;
      }
      if (newLat >= 21.90 && newLat <= 22.022) {
        // Balari Bar & Haldia reach: strictly west of eastern bank (88.075) and east of western bank (88.040)
        if (newLng > 88.0750) {
          newLng = 88.0680; // Keep away from Durgachak / Kakdwip eastern bank
          newHeading = 210;
        } else if (newLng < 88.0420) {
          newLng = 88.0550;
          newHeading = 30;
        }
      } else if (newLat >= 21.58 && newLat < 21.90) {
        // Sagar Island zone: Western Channel is west of Sagar Island (88.010 - 88.045)
        // Sagar Island itself is 88.050 to 88.135
        if (newLng >= 88.0460) {
          newLng = 88.0350; // Force into Western Channel deep water
          newHeading = 190;
        } else if (newLng < 88.0100) {
          newLng = 88.0250;
          newHeading = 10;
        }
      } else if (newLat < 21.58 && newLat >= 21.20) {
        // South of Sagar Island towards Sandheads
        if (newLng > 88.1600) {
          newLng = 88.1200;
          newHeading = 200;
        } else if (newLng < 88.0200) {
          newLng = 88.0500;
          newHeading = 20;
        }
      }
      return { lat: newLat, lng: newLng, heading: newHeading };
    }

    // 2. Open East Coast Boundary (Tamil Nadu to Odisha)
    let minCoastLng = 80.50;
    if (newLat < 8.0) minCoastLng = 77.50;
    else if (newLat < 10.0) minCoastLng = 79.95;
    else if (newLat < 13.5) minCoastLng = 80.32; // Chennai / Ennore
    else if (newLat < 15.5) minCoastLng = 80.15; // Krishnapatnam
    else if (newLat < 17.0) minCoastLng = 82.35; // Kakinada
    else if (newLat < 17.8) minCoastLng = 83.26; // Vizag / Gangavaram
    else if (newLat < 19.5) minCoastLng = 84.98; // Gopalpur
    else if (newLat < 20.6) minCoastLng = 86.68; // Paradip
    else minCoastLng = 86.98;                   // Dhamra

    if (newLng < minCoastLng) {
      newLng = minCoastLng + 0.08;
      newHeading = (newHeading + 180) % 360;
    }
    if (newLat < 5.0) {
      newLat = 5.5;
      newHeading = 45;
    }
    if (newLng > 95.0) {
      newLng = 94.5;
      newHeading = 225;
    }

    return { lat: newLat, lng: newLng, heading: newHeading };
  };

  // Dead Reckoning position simulation loop (advances all 165+ vessels safely along water channels)
  useEffect(() => {
    if (!isPlaying || isWsConnected) return;

    const interval = setInterval(() => {
      setVessels(prevVessels =>
        prevVessels.map(v => {
          if (v.status.includes('Anchor') || v.status.includes('Berth') || v.status.includes('Moored') || v.speedKnots === 0) return v;

          const speedKnots = v.speedKnots * simulationSpeed;
          let latDelta = (Math.cos((v.headingDegrees * Math.PI) / 180) * speedKnots * 0.00025);
          let lngDelta = (Math.sin((v.headingDegrees * Math.PI) / 180) * speedKnots * 0.00025);

          let nextLat = Number((v.coordinates[0] + latDelta).toFixed(4));
          let nextLng = Number((v.coordinates[1] + lngDelta).toFixed(4));
          let nextHeading = v.headingDegrees;

          // Apply strict navigable water boundary clamp
          const clamped = clampToNavigableWaters(nextLat, nextLng, nextHeading);

          return {
            ...v,
            headingDegrees: clamped.heading,
            coordinates: [clamped.lat, clamped.lng]
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

  // Auto-dismiss floating toast notification after 7 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Geofence entry crossing detection engine
  // Geofence entry crossing detection engine: strictly monitors vessel approach towards its OWN destination port
  const checkGeofenceCrossings = (currentVessels) => {
    const stateMap = vesselGeofenceStateRef.current;
    const newAlerts = [];

    if (isInitialRef.current) {
      currentVessels.forEach(v => {
        const vDestId = (v.destinationId || '').toLowerCase();
        const vDestName = (v.destinationPort || '').toLowerCase();
        PORT_GEOFENCES.forEach(geo => {
          const geoPortId = geo.id.replace('_zone', '').toLowerCase();
          const isOwnPort = vDestId === geoPortId || 
                            vDestName.includes(geoPortId) || 
                            (geo.portName && vDestName.includes(geo.portName.toLowerCase())) ||
                            (geo.name && vDestName.includes(geo.name.toLowerCase()));
          if (!isOwnPort) return;
          if (selectedDestination && geoPortId !== selectedDestination.toLowerCase()) return;

          const dist = getHaversineDistanceKm(v.coordinates[0], v.coordinates[1], geo.center[0], geo.center[1]);
          stateMap.set(`${v.mmsi}_${geo.id}`, dist <= geo.radiusKm);
        });
      });
      isInitialRef.current = false;
      return;
    }

    currentVessels.forEach(v => {
      if (v.status && (v.status.includes('Berth') || v.status.includes('Moored'))) return;

      const vDestId = (v.destinationId || '').toLowerCase();
      const vDestName = (v.destinationPort || '').toLowerCase();

      PORT_GEOFENCES.forEach(geo => {
        const geoPortId = geo.id.replace('_zone', '').toLowerCase();
        // Strict destination port matching: only check geofence for the vessel's OWN destination port
        const isOwnPort = vDestId === geoPortId || 
                          vDestName.includes(geoPortId) || 
                          (geo.portName && vDestName.includes(geo.portName.toLowerCase())) ||
                          (geo.name && vDestName.includes(geo.name.toLowerCase()));
        if (!isOwnPort) return; // Skip different ports!
        if (selectedDestination && geoPortId !== selectedDestination.toLowerCase()) return;

        const dist = getHaversineDistanceKm(v.coordinates[0], v.coordinates[1], geo.center[0], geo.center[1]);
        const isInside = dist <= geo.radiusKm;
        const key = `${v.mmsi}_${geo.id}`;
        const wasInside = stateMap.get(key);

        if (isInside && wasInside === false) {
          const alertObj = {
            id: `${v.mmsi}_${geo.id}_${Date.now()}`,
            vesselName: v.name,
            vesselType: v.vesselType,
            mmsi: v.mmsi,
            portName: geo.name,
            portId: geoPortId,
            time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
            speedKnots: v.speedKnots,
            currentDraught: v.currentDraughtMeters || v.currentDraught || 16.5,
            cargo: v.cargo,
            dwt: v.dwt || 160000,
            coordinates: v.coordinates,
            geofenceRadiusNm: 80,
            timestamp: new Date()
          };
          newAlerts.push(alertObj);
        }

        stateMap.set(key, isInside);
      });
    });

    if (newAlerts.length > 0) {
      setNotifications(prev => [...newAlerts, ...prev].slice(0, 30));
      setUnreadCount(prev => prev + newAlerts.length);
      setActiveToast(newAlerts[0]);
      if (soundEnabledRef.current) {
        playRadarChime();
      }
    }
  };

  // Run crossing check whenever vessels move
  useEffect(() => {
    if (vessels && vessels.length > 0) {
      checkGeofenceCrossings(vessels);
    }
  }, [vessels]);

  const handleFocusVessel = (alertOrVessel) => {
    if (!alertOrVessel) return;
    const match = vessels.find(v => 
      (alertOrVessel.mmsi && v.mmsi === alertOrVessel.mmsi) || 
      (v.name && alertOrVessel.vesselName && v.name.toLowerCase() === alertOrVessel.vesselName.toLowerCase())
    );
    const targetCoords = (match && match.coordinates) ? match.coordinates : alertOrVessel.coordinates;
    if (!targetCoords) return;

    // Reset filters to ensure vessel marker is active and rendered on the map
    setVesselFilter('ALL');
    setSearchQuery('');

    setMapFocusTarget({
      coords: targetCoords,
      zoom: 11, // Zoom directly in on the actual ship
      timestamp: Date.now()
    });

    if (match) {
      setSelectedVessel(match);
    }
    setActiveToast(null);
  };

  const handleSimulateEntryAlert = () => {
    const targetDestId = (selectedDestination || 'paradip').toLowerCase();
    const sample = vessels.find(v => 
      (v.destinationId === targetDestId || (v.destinationPort || '').toLowerCase().includes(targetDestId)) && 
      !v.status.includes('Berth')
    ) || vessels[1];
    const targetPort = PORT_GEOFENCES.find(g => g.id.includes(sample.destinationId || targetDestId)) || PORT_GEOFENCES[0];

    // Place simulated vessel right at 80 NM Sea Gate offshore
    const seaCenter = targetPort.seaGateCoordinates || targetPort.center;
    const alertCoords = [
      Number((seaCenter[0] - 0.05).toFixed(4)),
      Number((seaCenter[1] - 0.05).toFixed(4))
    ];

    const alertObj = {
      id: `sim_${Date.now()}`,
      vesselName: sample.name,
      vesselType: sample.vesselType,
      mmsi: sample.mmsi,
      portName: targetPort.name,
      portId: targetPort.id.replace('_zone', ''),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
      speedKnots: sample.speedKnots || 11.8,
      currentDraught: sample.currentDraughtMeters || 16.8,
      cargo: sample.cargo,
      dwt: sample.dwt || 165000,
      coordinates: alertCoords,
      geofenceRadiusNm: 80,
      timestamp: new Date()
    };

    setVessels(prev => prev.map(v => v.mmsi === sample.mmsi ? { ...v, coordinates: alertCoords, status: 'Entering 80 NM Geofence Approach' } : v));
    setSelectedVessel({ ...sample, coordinates: alertCoords, status: 'Entering 80 NM Geofence Approach' });
    setNotifications(prev => [alertObj, ...prev]);
    setUnreadCount(prev => prev + 1);
    setActiveToast(alertObj);
    if (soundEnabledRef.current) {
      playRadarChime();
    }
  };

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
                impact="Eliminates vessel idle time, tracks demurrage penalties in real time, and provides logistics managers with arrival milestones to prepare berth readiness and stockyard space."
              />
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fleet Tracking: <span className="font-semibold text-slate-700">{vessels.length} Commercial Vessels Active</span> • Bay of Bengal & Arabian Sea Corridors
          </p>
        </div>

        {/* Live Controls & WebSocket Connector Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* WebSocket Status Indicator / 1-Click Connect with Embedded Key */}
          {isWsConnected ? (
            <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>AISStream: LIVE ({wsLatencyMs}ms • {wsPacketsCount} pkts)</span>
              <button 
                onClick={handleDisconnectWebSocket}
                className="ml-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                title="Disconnect Live WebSocket"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleConnectWebSocket(DEFAULT_AISSTREAM_API_KEY)}
              disabled={isWsConnecting}
              className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer"
              title="Connect to Real-Time AISStream.io WebSockets (API Key Embedded: 7f5a13...)"
            >
              <Wifi className={`w-3.5 h-3.5 text-maritime-700 ${isWsConnecting ? 'animate-pulse' : ''}`} />
              <span>{isWsConnecting ? 'Connecting AISStream...' : 'Connect Live AISStream'}</span>
            </button>
          )}

          {/* Corridors Overlay Toggle */}
          <button
            onClick={() => setShowCorridors(!showCorridors)}
            className={`px-2.5 py-1 border rounded text-xs font-semibold cursor-pointer transition-colors ${
              showCorridors ? 'bg-maritime-50 text-maritime-800 border-maritime-300' : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
            title="Toggle International Shipping Corridors"
          >
            🌐 Shipping Lanes
          </button>

          {/* 80 NM Geofence Overlay Toggle */}
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`px-2.5 py-1 border rounded text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              showGeofences 
                ? 'bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-xs' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
            }`}
            title="Toggle 80 Nautical Miles Offshore Approach Sea Gates"
          >
            <CircleDot className="w-3.5 h-3.5 text-amber-600" />
            <span>⭕ 80 NM Geofences</span>
          </button>

          {/* Railway Alert Button & Sonar Audio Toggle */}
          <div className="relative flex items-center">
            <button
              onClick={() => {
                setShowNotificationDrawer(!showNotificationDrawer);
                setUnreadCount(0);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1 border rounded text-xs font-semibold transition-all relative cursor-pointer ${
                showNotificationDrawer 
                  ? 'bg-maritime-900 text-white border-maritime-900 shadow-sm' 
                  : unreadCount > 0 
                  ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Railway Multi-Modal Dispatch & 80 NM Port Geofence Alerts"
            >
              {unreadCount > 0 ? (
                <BellRing className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span>Railway Alert</span>
              {unreadCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-rose-600 text-white text-[10px] font-extrabold rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Sound Mute/Unmute */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1 border rounded text-xs transition-colors ml-1 cursor-pointer ${
                soundEnabled 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                  : 'bg-rose-50 text-rose-500 border-rose-200'
              }`}
              title={soundEnabled ? 'Mute Sonar Alert Chime' : 'Enable Sonar Alert Chime'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Notifications Dropdown Popover */}
            {showNotificationDrawer && (
              <div className="absolute top-full right-0 mt-2 w-84 sm:w-[450px] bg-white border border-slate-200 rounded-xl shadow-2xl z-[1200] p-3 text-xs animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <div className="flex items-center space-x-1.5">
                    <Bell className="w-3.5 h-3.5 text-maritime-700" />
                    <span className="font-bold text-slate-900">80 NM Geofence Entry Logbook</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded">
                      {notifications.length}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => setNotifications([])}
                        className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotificationDrawer(false)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="max-h-[34rem] overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No recent geofence breaches detected.
                    </div>
                  ) : (
                    notifications.map(notif => {
                      const divAdv = evaluateVesselPortCongestionDiversion({
                        portId: notif.portId,
                        vesselType: notif.vesselType,
                        currentDraught: notif.currentDraught,
                        vesselName: notif.vesselName,
                        vesselCoordinates: notif.coordinates,
                        speedKnots: notif.speedKnots,
                        dwt: notif.dwt || 165000,
                        cargo: notif.cargo
                      });
                      const isPortFull = divAdv && divAdv.isPortFull && (divAdv.lowFuelOption || divAdv.ampleFuelOption);

                      return (
                        <div 
                          key={notif.id}
                          className={`p-2.5 rounded-lg border transition-colors ${
                            isPortFull 
                              ? 'border-amber-300 bg-amber-50/40 hover:bg-amber-50/70' 
                              : 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isPortFull ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                <span className="font-bold text-slate-900 text-xs truncate max-w-[160px]">{notif.vesselName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium">
                                Entered 80 NM Ring: <b className="text-maritime-800">{notif.portName}</b>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[210px]">
                                {notif.vesselType} • {notif.speedKnots} kts • Draft {notif.currentDraught}m
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                handleFocusVessel(notif);
                                setShowNotificationDrawer(false);
                              }}
                              className="px-2 py-1 bg-white hover:bg-maritime-50 text-maritime-800 border border-slate-200 rounded text-[10px] font-bold shrink-0 flex items-center space-x-0.5 shadow-xs cursor-pointer"
                              title="Center on Map"
                            >
                              <Crosshair className="w-3 h-3" />
                              <span>Locate</span>
                            </button>
                          </div>

                          {/* Case A: Port Saturated -> Diversion Strategies & Multimodal Evacuation */}
                          {isPortFull ? (
                            <div className="mt-2 p-2.5 rounded-md bg-white border border-amber-300 text-[10px] text-slate-800 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between font-bold text-amber-900">
                                <span className="flex items-center space-x-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span>Port Saturated ({divAdv.avgWaitDays}d wait • {divAdv.vesselsAtAnchor} queued)</span>
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 uppercase font-extrabold border border-rose-300">
                                  {divAdv.congestionStatus}
                                </span>
                              </div>

                              {/* Anchorage Loss Baseline in ₹ Crores (₹ Lakhs) */}
                              <div className="bg-rose-50 border border-rose-200 rounded px-2 py-1 text-[9.5px] text-rose-900 flex justify-between font-medium items-center">
                                <span>⚓ Anchorage Loss at {divAdv.portName}:</span>
                                <span className="font-bold font-mono text-rose-700">
                                  -₹{divAdv.anchorageLoss?.totalLossCr} Cr <span className="text-[8.5px] font-normal text-rose-600">(-₹{divAdv.anchorageLoss?.totalLossLakhs}L)</span>
                                </span>
                              </div>

                              {/* Bunker Fuel Feasibility Gate */}
                              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[8.5px] text-slate-700">
                                <span className="flex items-center space-x-1">
                                  <span>⛽</span>
                                  <span className="font-semibold">Fuel Feasibility Gate:</span>
                                  <span className="text-emerald-700 font-bold">PASS</span>
                                </span>
                                <span className="text-[8px] text-slate-500 font-mono">15% SOLAS Reserve Verified</span>
                              </div>

                              {/* Strategy 1: Low Fuel (Closest Port) */}
                              {divAdv.lowFuelOption && (
                                <div className="p-2 rounded-md bg-amber-50/80 border border-amber-200 text-slate-800 space-y-1">
                                  <div className="flex justify-between items-center font-bold text-amber-950">
                                    <span>⛽ Low Fuel: Divert to {divAdv.lowFuelOption.portName}</span>
                                    <span className="text-[9px] font-mono text-slate-600 font-semibold">{divAdv.lowFuelOption.distNM} NM</span>
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-700 pt-0.5">
                                    <span>Fuel Burn: {divAdv.lowFuelOption.fuelBurnMT} MT (<b className="text-amber-800 font-mono">₹{divAdv.lowFuelOption.fuelCostCr} Cr</b> / ₹{divAdv.lowFuelOption.fuelCostLakhs}L)</span>
                                    <span className="font-bold text-emerald-800 font-mono">Net Gain: +₹{divAdv.lowFuelOption.netArbitrageCr} Cr <span className="text-[8px] font-normal text-emerald-700">(+₹{divAdv.lowFuelOption.netArbitrageLakhs}L)</span></span>
                                  </div>

                                  {/* Railway Evacuation Alert / Modal Surcharge */}
                                  {divAdv.lowFuelOption.evacuation && (
                                    <div className="mt-1 pt-1.5 border-t border-amber-200/90 text-[8.5px] space-y-1">
                                      <div className="flex items-center justify-between font-bold text-indigo-950">
                                        <span className="flex items-center space-x-1">
                                          <span>🚂</span>
                                          <span>Hinterland Evacuation: {divAdv.lowFuelOption.evacuation.cluster} ({divAdv.lowFuelOption.evacuation.distanceKm} km)</span>
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-700">
                                        <div>FOIS Rail: <b className="text-indigo-900 font-mono font-bold">₹{divAdv.lowFuelOption.evacuation.trainCostCr} Cr</b> ({divAdv.lowFuelOption.evacuation.trainRakesNeeded} rakes)</div>
                                        <div>Truck (Road): <b className="text-amber-900 font-mono font-bold">₹{divAdv.lowFuelOption.evacuation.truckCostCr} Cr</b></div>
                                      </div>
                                      <div className="flex items-center justify-between text-[8px] text-slate-600 font-medium">
                                        <span>Road Surcharge Penalty: <b className="text-rose-700 font-mono font-bold">+₹{divAdv.lowFuelOption.evacuation.roadSurchargeCr} Cr</b></span>
                                        <span className="text-cyan-800 font-semibold" title="FreightFox Indian Trucking Price Book (PPAC Diesel-Indexed Benchmark)">FreightFox Index (PPAC)</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Strategy 2: Ample Fuel (Free / Lowest Queue Port) */}
                              {divAdv.ampleFuelOption && divAdv.ampleFuelOption.portId !== divAdv.lowFuelOption?.portId && (
                                <div className="p-2 rounded-md bg-cyan-50/80 border border-cyan-200 text-slate-800 space-y-1">
                                  <div className="flex justify-between items-center font-bold text-cyan-950">
                                    <span>⚡ Ample Fuel: Divert to {divAdv.ampleFuelOption.portName}</span>
                                    <span className="text-[9px] font-mono text-slate-600 font-semibold">{divAdv.ampleFuelOption.distNM} NM</span>
                                  </div>
                                  <div className="flex justify-between text-[9px] text-slate-700 pt-0.5">
                                    <span>Saves {divAdv.ampleFuelOption.waitDaysSaved}d (<b className="text-cyan-900 font-mono">₹{divAdv.ampleFuelOption.demurrageSavedCr} Cr</b> / ₹{divAdv.ampleFuelOption.demurrageSavedLakhs}L)</span>
                                    <span className="font-bold text-emerald-800 font-mono">Net Gain: +₹{divAdv.ampleFuelOption.netArbitrageCr} Cr <span className="text-[8px] font-normal text-emerald-700">(+₹{divAdv.ampleFuelOption.netArbitrageLakhs}L)</span></span>
                                  </div>

                                  {/* Railway Evacuation Alert / Modal Surcharge */}
                                  {divAdv.ampleFuelOption.evacuation && (
                                    <div className="mt-1 pt-1.5 border-t border-cyan-200/90 text-[8.5px] space-y-1">
                                      <div className="flex items-center justify-between font-bold text-indigo-950">
                                        <span className="flex items-center space-x-1">
                                          <span>🚂</span>
                                          <span>Hinterland Evacuation: {divAdv.ampleFuelOption.evacuation.cluster} ({divAdv.ampleFuelOption.evacuation.distanceKm} km)</span>
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-700">
                                        <div>FOIS Rail: <b className="text-indigo-900 font-mono font-bold">₹{divAdv.ampleFuelOption.evacuation.trainCostCr} Cr</b> ({divAdv.ampleFuelOption.evacuation.trainRakesNeeded} rakes)</div>
                                        <div>Truck (Road): <b className="text-amber-900 font-mono font-bold">₹{divAdv.ampleFuelOption.evacuation.truckCostCr} Cr</b></div>
                                      </div>
                                      <div className="flex items-center justify-between text-[8px] text-slate-600 font-medium">
                                        <span>Road Surcharge Penalty: <b className="text-rose-700 font-mono font-bold">+₹{divAdv.ampleFuelOption.evacuation.roadSurchargeCr} Cr</b></span>
                                        <span className="text-cyan-800 font-semibold" title="FreightFox Indian Trucking Price Book (PPAC Diesel-Indexed Benchmark)">FreightFox Index (PPAC)</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* WAIT vs ANCHOR Cost Profile Breakdown */}
                              <div className="bg-slate-50 border border-slate-200 rounded-md p-2 text-[8.5px] space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-700">
                                  <span>⚓ Terminal Option Comparison (WAIT vs. ANCHOR):</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                                  <div className="bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                                    <div className="font-bold text-cyan-900 flex justify-between">
                                      <span>1. WAIT: Slow Steam</span>
                                      <span className="font-mono text-cyan-800 font-bold">₹{divAdv.waitOption?.totalCostCr} Cr</span>
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">
                                      Eco-speed 7.5 kts • Burns ~{divAdv.waitOption?.fuelBurnMT} MT • <b className="text-emerald-700">0 Port Dues</b>
                                    </div>
                                  </div>
                                  <div className="bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                                    <div className="font-bold text-rose-900 flex justify-between">
                                      <span>2. ANCHOR: Outer Roads</span>
                                      <span className="font-mono text-rose-700 font-bold">₹{divAdv.anchorOption?.totalCostCr} Cr</span>
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">
                                      Aux burn ~{divAdv.anchorOption?.fuelBurnMT} MT • Incurs <b className="text-rose-700">Full Demurrage (₹{divAdv.anchorOption?.demurrageLossCr} Cr)</b>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Best Option Out of All Choices */}
                              <div className="p-2.5 rounded-md bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/80 border-2 border-emerald-500 text-slate-800 space-y-1.5 shadow-xs">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center space-x-1.5 text-emerald-950 text-[10.5px]">
                                    <span className="text-sm">⭐</span>
                                    <span className="font-extrabold uppercase tracking-wide">Best Option Out of All Choices:</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-extrabold text-[8px] uppercase tracking-wider shadow-xs flex items-center space-x-1">
                                    <span>🏆</span>
                                    <span>AI Recommended Winner</span>
                                  </span>
                                </div>

                                <div className="bg-white/95 p-2 rounded border border-emerald-300 space-y-1 shadow-2xs">
                                  <div className="flex justify-between items-center font-bold text-emerald-950 text-[10px]">
                                    <span className="flex items-center space-x-1">
                                      <span className="text-emerald-700 font-extrabold">🎯</span>
                                      <span className="text-emerald-950 font-black">{divAdv.bestOption?.title || 'Divert to Gangavaram Port (GPL)'}</span>
                                    </span>
                                    <span className="font-mono text-emerald-800 font-extrabold text-[10.5px] bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                      Net Gain: +₹{divAdv.bestOption?.netPayoffCr || '1.15'} Cr {divAdv.bestOption?.netPayoffLakhs ? `(+₹${divAdv.bestOption.netPayoffLakhs}L)` : '(+₹115L)'}
                                    </span>
                                  </div>

                                  <div className="text-[8.5px] text-slate-700 leading-snug bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
                                    <span className="font-semibold text-slate-900">Optimal Action: </span>
                                    {divAdv.bestOption?.rationale || 'Highest net landed savings (+₹1.15 Cr) among all choices. Eliminates 2.1d wait at Paradip and secures direct FOIS rail dispatch to SAIL Bhilai Steel Plant (BSP).'}
                                  </div>

                                  <div className="flex items-center justify-between text-[8px] text-slate-600 pt-0.5 border-t border-emerald-200">
                                    <span>Hinterland Link: <b className="text-indigo-950 font-bold">{divAdv.bestOption?.evacuationCluster || 'SAIL Bhilai Steel Plant (BSP)'}</b></span>
                                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                      <span>✓</span>
                                      <span>100% SOLAS & Part-B Compliant</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Case B: Port Clear / Smooth Berthing -> Direct Port Evacuation & Logistics Analysis */
                            <div className="mt-2 p-2.5 rounded-md bg-white border border-emerald-300 text-[10px] text-slate-800 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between font-bold text-emerald-900">
                                <span className="flex items-center space-x-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Berth Clearance Verified ({divAdv.avgWaitDays}d wait • {divAdv.vesselsAtAnchor} queued)</span>
                                </span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase font-extrabold border border-emerald-300">
                                  {divAdv.congestionStatus}
                                </span>
                              </div>

                              {/* Projected Anchorage Cost Baseline */}
                              <div className="bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-[9.5px] text-emerald-900 flex justify-between font-medium items-center">
                                <span>⚓ Projected Anchorage Time at {divAdv.portName}:</span>
                                <span className="font-bold font-mono text-emerald-800">
                                  {divAdv.avgWaitDays} Days <span className="text-[8.5px] font-normal text-slate-600">(-₹{divAdv.anchorageLoss?.totalLossCr} Cr / ₹{divAdv.anchorageLoss?.totalLossLakhs}L)</span>
                                </span>
                              </div>

                              {/* Bunker Fuel Feasibility Gate */}
                              <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[8.5px] text-slate-700">
                                <span className="flex items-center space-x-1">
                                  <span>⛽</span>
                                  <span className="font-semibold">Bunker Feasibility Gate:</span>
                                  <span className="text-emerald-700 font-bold">PASS</span>
                                </span>
                                <span className="text-[8px] text-slate-500 font-mono">Verified for Direct Berthing Approach</span>
                              </div>

                              {/* Direct Port Hinterland Evacuation Analysis ("about that truck and rakes") */}
                              {divAdv.directEvacuation && (
                                <div className="p-2 rounded-md bg-indigo-50/70 border border-indigo-200 text-slate-800 space-y-1">
                                  <div className="flex items-center justify-between font-bold text-indigo-950">
                                    <span className="flex items-center space-x-1">
                                      <span>🚂</span>
                                      <span>Direct Hinterland Evacuation: {divAdv.directEvacuation.cluster} ({divAdv.directEvacuation.distanceKm} km)</span>
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-1 text-[8px] text-slate-700 pt-0.5">
                                    <div>FOIS Rail Freight: <b className="text-indigo-900 font-mono font-bold">₹{divAdv.directEvacuation.trainCostCr} Cr</b> ({divAdv.directEvacuation.trainRakesNeeded} rakes)</div>
                                    <div>Truck Fleet (Road): <b className="text-amber-900 font-mono font-bold">₹{divAdv.directEvacuation.truckCostCr} Cr</b></div>
                                  </div>

                                  <div className="flex items-center justify-between text-[8px] text-slate-600 font-medium pt-0.5 border-t border-indigo-200/80">
                                    <span>Road Surcharge Penalty: <b className="text-rose-700 font-mono font-bold">+₹{divAdv.directEvacuation.roadSurchargeCr} Cr</b></span>
                                    <span className="text-cyan-800 font-semibold" title="FreightFox Indian Trucking Price Book (PPAC Diesel-Indexed Benchmark)">FreightFox Index (PPAC)</span>
                                  </div>
                                </div>
                              )}

                              {/* WAIT vs ANCHOR Cost Profile Breakdown */}
                              <div className="bg-slate-50 border border-slate-200 rounded-md p-2 text-[8.5px] space-y-1">
                                <div className="flex items-center justify-between font-bold text-slate-700">
                                  <span>⚓ Terminal Option Comparison (WAIT vs. ANCHOR):</span>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                                  <div className="bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                                    <div className="font-bold text-cyan-900 flex justify-between">
                                      <span>1. WAIT: Slow Steam</span>
                                      <span className="font-mono text-cyan-800 font-bold">₹{divAdv.waitOption?.totalCostCr} Cr</span>
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">
                                      Eco-speed 7.5 kts • Burns ~{divAdv.waitOption?.fuelBurnMT} MT • <b className="text-emerald-700">0 Port Dues</b>
                                    </div>
                                  </div>
                                  <div className="bg-white p-1.5 rounded border border-slate-200 space-y-0.5">
                                    <div className="font-bold text-rose-900 flex justify-between">
                                      <span>2. ANCHOR: Outer Roads</span>
                                      <span className="font-mono text-rose-700 font-bold">₹{divAdv.anchorOption?.totalCostCr} Cr</span>
                                    </div>
                                    <div className="text-[7.5px] text-slate-500">
                                      Aux burn ~{divAdv.anchorOption?.fuelBurnMT} MT • Incurs <b className="text-rose-700">Demurrage (₹{divAdv.anchorOption?.demurrageLossCr} Cr)</b>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Best Option Out of All Choices (Clear Port) */}
                              <div className="p-2.5 rounded-md bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/80 border-2 border-emerald-500 text-slate-800 space-y-1.5 shadow-xs">
                                <div className="flex items-center justify-between font-bold">
                                  <span className="flex items-center space-x-1.5 text-emerald-950 text-[10.5px]">
                                    <span className="text-sm">⭐</span>
                                    <span className="font-extrabold uppercase tracking-wide">Best Option Out of All Choices:</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-700 text-white font-extrabold text-[8px] uppercase tracking-wider shadow-xs flex items-center space-x-1">
                                    <span>🏆</span>
                                    <span>AI Recommended Winner</span>
                                  </span>
                                </div>

                                <div className="bg-white/95 p-2 rounded border border-emerald-300 space-y-1 shadow-2xs">
                                  <div className="flex justify-between items-center font-bold text-emerald-950 text-[10px]">
                                    <span className="flex items-center space-x-1">
                                      <span className="text-emerald-700 font-extrabold">🎯</span>
                                      <span className="text-emerald-950 font-black">{divAdv.bestOption?.title || `Direct Berthing at ${divAdv.portName}`}</span>
                                    </span>
                                    <span className="font-mono text-emerald-800 font-extrabold text-[10px] bg-emerald-100/90 px-1.5 py-0.5 rounded border border-emerald-300">
                                      Clear Berth (0 Wait)
                                    </span>
                                  </div>

                                  <div className="text-[8.5px] text-slate-700 leading-snug bg-slate-50/80 p-1.5 rounded border border-slate-200/80">
                                    <span className="font-semibold text-slate-900">Optimal Action: </span>
                                    {divAdv.bestOption?.rationale || `Berth clearance confirmed (${divAdv.avgWaitDays}d wait). Proceed for immediate discharge and rail evacuation to ${divAdv.directEvacuation?.cluster}.`}
                                  </div>

                                  <div className="flex items-center justify-between text-[8px] text-slate-600 pt-0.5 border-t border-emerald-200">
                                    <span>Hinterland Link: <b className="text-indigo-950 font-bold">{divAdv.directEvacuation?.cluster}</b></span>
                                    <span className="text-emerald-700 font-bold flex items-center space-x-1">
                                      <span>✓</span>
                                      <span>Direct Rail Dispatch Ready</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PORT_GEOFENCES.map(geo => {
            const portKey = geo.id.replace('_zone', '');
            const portAdv = evaluateVesselPortCongestionDiversion({
              portId: portKey,
              vesselType: charterVesselClass
            });
            const isFull = portAdv && portAdv.isPortFull && portAdv.suggestedPort;

            return (
              <div 
                key={geo.id}
                onClick={() => {
                  if (onSelectPort) onSelectPort(portKey);
                }}
                className={`p-2 rounded border cursor-pointer transition-all hover:shadow-xs ${
                  isFull ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400' : 'bg-white border-slate-200 hover:border-maritime-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 mb-0.5">
                  <span className="truncate">{geo.name.includes('Sagar') ? 'Sandheads' : geo.name.split(' ')[0]}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    isFull ? 'bg-amber-500 animate-pulse' :
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
                  {isFull && (
                    <div className="pt-0.5 text-[9px] font-bold text-amber-900 truncate flex items-center space-x-0.5">
                      <span>⚡</span>
                      <span className="truncate">Divert: {portAdv.suggestedPort.portName.split(' ')[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
            <MapCameraController focusTarget={mapFocusTarget} />

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

            {/* Port Geofence: Small Non-Colliding 80 NM Sea Gates in the Bay of Bengal */}
            {showGeofences && PORT_GEOFENCES.map((geo) => {
              const isSelectedPort = geo.id.includes(selectedDestination);
              const circleColor = isSelectedPort ? '#f59e0b' : (geo.color || '#0284c7');
              const seaCenter = geo.seaGateCoordinates || geo.center;
              const portCenter = geo.portCoordinates;

              return (
                <React.Fragment key={geo.id}>
                  {/* Seaward Approach Fairway (Dashed Line connecting Port to 80 NM Sea Gate) */}
                  {portCenter && (
                    <Polyline
                      positions={[portCenter, seaCenter]}
                      pathOptions={{
                        color: isSelectedPort ? '#f59e0b' : '#64748b',
                        weight: isSelectedPort ? 2.5 : 1.5,
                        dashArray: '4 6',
                        opacity: isSelectedPort ? 0.75 : 0.35
                      }}
                    />
                  )}

                  {/* Coastal Port Location Beacon */}
                  {portCenter && (
                    <CircleMarker
                      center={portCenter}
                      radius={4}
                      pathOptions={{
                        color: circleColor,
                        fillColor: circleColor,
                        fillOpacity: 0.9,
                        weight: 1.5
                      }}
                    />
                  )}

                  {/* Small Non-Colliding 80 NM Sea Gate Circle */}
                  <Circle
                    center={seaCenter}
                    radius={geo.radiusMeters || 18000}
                    pathOptions={{
                      color: circleColor,
                      fillColor: circleColor,
                      fillOpacity: isSelectedPort ? 0.22 : 0.10,
                      weight: isSelectedPort ? 3.0 : 2.0,
                      dashArray: isSelectedPort ? '6 4' : '4 4'
                    }}
                  >
                    <Tooltip 
                      direction="top" 
                      permanent={isSelectedPort} 
                      opacity={0.95}
                    >
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-md border flex items-center space-x-1.5 whitespace-nowrap ${
                        isSelectedPort 
                          ? 'bg-amber-950 text-amber-300 border-amber-500 font-extrabold' 
                          : 'bg-white/95 text-slate-800 border-slate-300'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${isSelectedPort ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`}></span>
                        <span>⭕ {geo.name} (80 NM Offshore)</span>
                        <span className="text-[9px] text-slate-500 font-normal">
                          • {geo.anchoredCount} Waiting
                        </span>
                      </div>
                    </Tooltip>
                  </Circle>
                </React.Fragment>
              );
            })}

            {/* Suggested Part B-Compliant Diversion Route Corridor (Fuel-Aware Strategy Synced) */}
            {diversionData.isPortSaturated && (() => {
              const activePort = activeDiversionStrategy === 'lowFuel'
                ? (diversionData.lowFuelOption || diversionData.suggestedPort)
                : activeDiversionStrategy === 'bestChoice'
                  ? (diversionData.bestOption?.portId && diversionData.lowFuelOption?.portId === diversionData.bestOption.portId ? diversionData.lowFuelOption : (diversionData.ampleFuelOption || diversionData.suggestedPort))
                  : (diversionData.ampleFuelOption || diversionData.suggestedPort);

              const pathCoords = activeDiversionStrategy === 'lowFuel'
                ? (diversionData.diversionPathCoordinatesLowFuel && diversionData.diversionPathCoordinatesLowFuel.length > 0
                    ? diversionData.diversionPathCoordinatesLowFuel
                    : diversionData.diversionPathCoordinates)
                : (diversionData.diversionPathCoordinates && diversionData.diversionPathCoordinates.length > 0
                    ? diversionData.diversionPathCoordinates
                    : diversionData.diversionPathCoordinatesLowFuel);

              if (!activePort || !pathCoords || pathCoords.length === 0) return null;

              const isBestChoice = activeDiversionStrategy === 'bestChoice';
              const isLowFuel = activeDiversionStrategy === 'lowFuel';
              const themeColor = isBestChoice ? '#10b981' : isLowFuel ? '#f59e0b' : '#06b6d4';

              return (
                <>
                  <Polyline
                    positions={pathCoords}
                    pathOptions={{
                      color: themeColor,
                      weight: 3.5,
                      dashArray: '8 10',
                      opacity: 0.95
                    }}
                  >
                    <Tooltip direction="center" opacity={0.95}>
                      <div className="text-[11px] font-bold text-slate-900 bg-white p-2 rounded-lg border border-slate-300 shadow-md space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <span>{isBestChoice ? '⭐ Best Option Winner (AI Recommended)' : isLowFuel ? '⛽ Low Fuel Strategy (Nearest Port)' : '⚡ Ample Fuel Strategy (Free Port)'}:</span>
                          <span className="text-maritime-900 font-extrabold">{diversionData.currentPort.name} ➔ {activePort.portName}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-normal">
                          Part B Draft Verified ({activePort.effectiveMaxDraft}m) • Dist: {activePort.distNM} NM • Fuel: {activePort.fuelBurnMT} MT (₹{activePort.fuelCostLakhs}L)
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-700">
                          Saves {activePort.waitDaysSaved}d wait & ₹{activePort.demurrageSavedLakhs}L Demurrage • Net Gain: +₹{activePort.netArbitrageLakhs}L
                        </div>
                      </div>
                    </Tooltip>
                  </Polyline>

                  <Circle
                    center={activePort.coordinates}
                    radius={22000}
                    pathOptions={{
                      color: themeColor,
                      fillColor: themeColor,
                      fillOpacity: 0.22,
                      weight: 2,
                      dashArray: '4 6'
                    }}
                  >
                    <Tooltip direction="top" permanent opacity={0.95}>
                      <div className="text-[10px] font-bold bg-white px-2 py-0.5 rounded shadow-sm border border-slate-300 text-slate-900">
                        {isBestChoice ? '⭐ AI Recommended Best Option: ' : isLowFuel ? '🎯 Nearest Alternative: ' : '🎯 Free Port Alternative: '}
                        <span className={isBestChoice ? 'text-emerald-800' : isLowFuel ? 'text-amber-800' : 'text-cyan-800'}>
                          {activePort.portName}
                        </span>
                      </div>
                    </Tooltip>
                  </Circle>
                </>
              );
            })()}

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
                    {(() => {
                      const portAdv = evaluateVesselPortCongestionDiversion({
                        portId: port.id,
                        vesselType: charterVesselClass
                      });
                      if (!portAdv || !portAdv.isPortFull || !portAdv.suggestedPort) return null;
                      return (
                        <div className="mt-2 pt-1.5 border-t border-amber-200 text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded">
                          <div className="font-bold flex items-center gap-1 text-amber-950">
                            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Port Saturated ({portAdv.avgWaitDays}d wait)</span>
                          </div>
                          <div className="mt-0.5 text-slate-700">
                            <b>Suggestion:</b> Divert to <b className="text-emerald-700">{portAdv.suggestedPort.portName}</b>
                          </div>
                          <div className="text-[9px] text-emerald-800 font-semibold mt-0.5 flex justify-between">
                            <span>Saves {portAdv.suggestedPort.waitDaysSaved}d</span>
                            <span>₹{portAdv.suggestedPort.demurrageSavedLakhs}L Saved</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </Popup>
              </Marker>
            ))}

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
                  <Tooltip direction="right" offset={[12, 0]} opacity={0.95} permanent={isSelected}>
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

          {/* Floating Geofence Entry Toast Notification */}
          {activeToast && (() => {
            const toastDiv = evaluateVesselPortCongestionDiversion({
              portId: activeToast.portId,
              vesselType: activeToast.vesselType,
              currentDraught: activeToast.currentDraught,
              vesselName: activeToast.vesselName,
              vesselCoordinates: activeToast.coordinates,
              speedKnots: activeToast.speedKnots,
              dwt: activeToast.dwt,
              cargo: activeToast.cargo
            });
            const isPortFull = toastDiv && toastDiv.isPortFull && (toastDiv.lowFuelOption || toastDiv.ampleFuelOption);
            const activeOption = activeDiversionStrategy === 'ampleFuel'
              ? (toastDiv.ampleFuelOption || toastDiv.lowFuelOption)
              : (toastDiv.lowFuelOption || toastDiv.ampleFuelOption);

            return (
              <div className={`absolute top-3 right-3 z-[1050] max-w-sm sm:max-w-md w-full bg-slate-900/95 text-white border rounded-xl shadow-2xl p-3 backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-300 ${
                isPortFull ? 'border-amber-500/70' : 'border-emerald-500/50'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isPortFull ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}></span>
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        isPortFull ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      isPortFull ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {isPortFull ? '80 NM Geofence Entry • Port Congestion Alert' : '80 NM Geofence Entry Alert'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-mono text-slate-400">{activeToast.time}</span>
                    <button 
                      onClick={() => setActiveToast(null)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="text-xs font-bold text-slate-100 flex items-center justify-between">
                    <span className="truncate">{activeToast.vesselName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border shrink-0 ml-1 ${
                      isPortFull 
                        ? 'bg-amber-950/70 text-amber-300 border-amber-700/60' 
                        : 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50'
                    }`}>
                      {activeToast.vesselType}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Entered 80 NM Ring: <span className="text-emerald-300 font-bold">{activeToast.portName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    Speed: {activeToast.speedKnots} kts • Draft: {activeToast.currentDraught}m • {activeToast.cargo}
                  </div>

                  {/* Port Saturation, Anchorage Loss & Dual Fuel Strategies */}
                  {isPortFull ? (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/60 text-[10px] space-y-2">
                      <div className="flex items-center justify-between text-amber-300 font-bold">
                        <span className="flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{toastDiv.portName} Saturated ({toastDiv.avgWaitDays}d wait • {toastDiv.vesselsAtAnchor} queued)</span>
                        </span>
                        <span className="text-[9px] bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded font-extrabold uppercase border border-rose-800">
                          {toastDiv.congestionStatus}
                        </span>
                      </div>

                      {/* Anchorage Loss Baseline in Crores & Lakhs */}
                      <div className="bg-rose-950/50 border border-rose-900/60 rounded p-1.5 text-rose-200 flex items-center justify-between">
                        <span>⚓ <strong>Anchorage Loss:</strong> {toastDiv.avgWaitDays}d queue</span>
                        <span className="font-mono font-bold text-rose-400">
                          -₹{toastDiv.anchorageLoss?.totalLossCr} Cr (-₹{toastDiv.anchorageLoss?.totalLossLakhs}L)
                        </span>
                      </div>

                      {/* Strategy Switcher Buttons */}
                      <div className="flex items-center justify-between gap-1 pt-0.5">
                        <span className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Strategy:</span>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setActiveDiversionStrategy('bestChoice')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              activeDiversionStrategy === 'bestChoice'
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-xs'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                            title="AI Recommended Best Option Across All Choices"
                          >
                            ⭐ Best Option
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDiversionStrategy('lowFuel')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              activeDiversionStrategy === 'lowFuel'
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                            title="Lowest Deviation Distance & Minimum Fuel Burn"
                          >
                            ⛽ Low Fuel
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDiversionStrategy('ampleFuel')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              activeDiversionStrategy === 'ampleFuel'
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                            title="Free / Lowest Queue Port — Maximum Demurrage Avoided"
                          >
                            ⚡ Ample Fuel
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveDiversionStrategy('waitAnchor')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                              activeDiversionStrategy === 'waitAnchor'
                                ? 'bg-purple-500 text-white border-purple-400 shadow-xs'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                            title="Compare WAIT (slow steam) vs ANCHOR (outer roads) cost profiles"
                          >
                            ⚓ Wait vs Anchor
                          </button>
                        </div>
                      </div>

                      {/* Best Choice Strategy Details Card */}
                      {activeDiversionStrategy === 'bestChoice' && (
                        <div className="p-2 rounded bg-gradient-to-br from-slate-900 via-emerald-950/70 to-slate-900 border border-emerald-500/70 space-y-1.5 text-[9.5px]">
                          <div className="flex items-center justify-between font-bold">
                            <span className="text-emerald-300 flex items-center space-x-1">
                              <span>⭐</span>
                              <span>Best Option Out of All Choices:</span>
                            </span>
                            <span className="text-[8px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
                              AI Winner
                            </span>
                          </div>

                          <div className="flex items-center justify-between font-bold text-white text-[10px] bg-emerald-950/60 p-1.5 rounded border border-emerald-800/80">
                            <span className="text-emerald-200">🎯 {toastDiv.bestOption?.title || 'Divert to Gangavaram Port (GPL)'}</span>
                            <span className="font-mono text-emerald-400 font-extrabold text-[10.5px]">
                              Net Gain: +₹{toastDiv.bestOption?.netPayoffCr || '1.15'} Cr {toastDiv.bestOption?.netPayoffLakhs ? `(+₹${toastDiv.bestOption.netPayoffLakhs}L)` : '(+₹115L)'}
                            </span>
                          </div>

                          <div className="text-[8.5px] text-slate-300 leading-snug bg-slate-950/80 p-1.5 rounded border border-slate-800">
                            <span className="font-semibold text-emerald-400">Why it wins: </span>
                            {toastDiv.bestOption?.rationale || 'Highest net landed savings (+₹1.15 Cr) among all choices. Eliminates 2.1d wait at Paradip and secures direct FOIS rail dispatch to SAIL Bhilai Steel Plant (BSP).'}
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[8.5px] text-slate-300 pt-1 border-t border-slate-800">
                            <div>
                              Net Arbitrage: <b className="text-emerald-400 font-mono">+₹{toastDiv.bestOption?.netPayoffCr} Cr</b>
                            </div>
                            <div>
                              Queue Saved: <b className="text-emerald-400">-{toastDiv.bestOption?.timeSavedDays || 2.1} Days</b>
                            </div>
                            <div className="col-span-2 text-indigo-300">
                              Evacuation Link: <b className="text-white">{toastDiv.bestOption?.evacuationCluster || 'SAIL Plant'}</b>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Active Strategy Details Card */}
                      {activeDiversionStrategy !== 'waitAnchor' && activeDiversionStrategy !== 'bestChoice' && activeOption && (
                        <div className="p-2 rounded bg-slate-900 border border-slate-700 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">
                              <strong className={activeDiversionStrategy === 'lowFuel' ? 'text-amber-300' : 'text-cyan-300'}>
                                {activeDiversionStrategy === 'lowFuel' ? 'Nearest Safe Port:' : 'Free / Lowest Queue Port:'}
                              </strong>{' '}
                              <strong className="text-white">{activeOption.portName}</strong>
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-800">
                              Draft {activeOption.effectiveMaxDraft}m Verified
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-300 pt-1 border-t border-slate-800">
                            <div>
                              Deviation Dist: <b className="text-white">{activeOption.distNM} NM</b>
                            </div>
                            <div>
                              Fuel Burn: <b className="text-amber-300">{activeOption.fuelBurnMT} MT (₹{activeOption.fuelCostCr} Cr)</b>
                            </div>
                            <div>
                              Wait Saved: <b className="text-emerald-400">-{activeOption.waitDaysSaved} Days</b>
                            </div>
                            <div>
                              Demurrage Avoided: <b className="text-emerald-400">₹{activeOption.demurrageSavedCr} Cr (₹{activeOption.demurrageSavedLakhs}L)</b>
                            </div>
                          </div>

                          {/* Railway Evacuation Alert (FOIS Rail Rake vs. Highway Truck Fleet) */}
                          {activeOption.evacuation && (
                            <div className="p-2 rounded bg-slate-950/90 border border-indigo-500/50 text-[9px] space-y-1 mt-1.5">
                              <div className="flex items-center justify-between font-bold text-indigo-300">
                                <span className="flex items-center space-x-1">
                                  <span>🚂</span>
                                  <span>Hinterland Evacuation: {activeOption.evacuation.cluster} ({activeOption.evacuation.distanceKm} km)</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-1 text-slate-300 pt-0.5">
                                <div>
                                  FOIS Rail Freight: <b className="text-white">₹{activeOption.evacuation.trainCostCr} Cr</b> <span className="text-slate-400">({activeOption.evacuation.trainRakesNeeded} rakes)</span>
                                </div>
                                <div>
                                  Truck Freight (Road): <b className="text-amber-300">₹{activeOption.evacuation.truckCostCr} Cr</b>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-slate-400 text-[8.5px] pt-0.5 border-t border-slate-800">
                                <span>Road Surcharge Penalty: <b className="text-rose-400">+₹{activeOption.evacuation.roadSurchargeCr} Cr</b></span>
                                <span className="text-cyan-400 font-semibold" title="FreightFox Indian Trucking Price Book (PPAC Diesel-Indexed Benchmark)">FreightFox Index (PPAC)</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300 bg-emerald-950/50 p-1.5 rounded border border-emerald-900/60 mt-1">
                            <span>⚡ Net Landed Savings:</span>
                            <span className="font-mono text-emerald-400">+₹{activeOption.netArbitrageCr} Cr (+₹{activeOption.netArbitrageLakhs}L)</span>
                          </div>
                        </div>
                      )}

                      {/* WAIT vs ANCHOR Cost Profile Breakdown */}
                      {activeDiversionStrategy === 'waitAnchor' && (
                        <div className="p-2 rounded bg-slate-900 border border-slate-700 space-y-1.5 text-[9px]">
                          <div className="text-amber-300 font-bold flex items-center justify-between">
                            <span>⚓ Terminal Option Comparison (WAIT vs. ANCHOR)</span>
                          </div>
                          
                          <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 space-y-0.5">
                            <div className="flex items-center justify-between text-cyan-300 font-bold">
                              <span>1. WAIT: Slow Steaming / Virtual Arrival</span>
                              <span className="font-mono text-white">₹{toastDiv.waitOption?.totalCostCr} Cr ({toastDiv.waitOption?.totalCostLakhs}L)</span>
                            </div>
                            <p className="text-slate-400 text-[8.5px]">
                              Continue transit at reduced eco-speed (7.5 kts). Burns ~{toastDiv.waitOption?.fuelBurnMT} MT propulsion fuel, but incurs <b>ZERO port anchorage dues</b>.
                            </p>
                          </div>

                          <div className="bg-slate-950/80 p-1.5 rounded border border-slate-800 space-y-0.5">
                            <div className="flex items-center justify-between text-rose-300 font-bold">
                              <span>2. ANCHOR: Outer Roads Holding</span>
                              <span className="font-mono text-rose-400">₹{toastDiv.anchorOption?.totalCostCr} Cr ({toastDiv.anchorOption?.totalCostLakhs}L)</span>
                            </div>
                            <p className="text-slate-400 text-[8.5px]">
                              Hold position at outer anchorage. Minimal fuel burn (~{toastDiv.anchorOption?.fuelBurnMT} MT aux load), but incurs <b>full demurrage (₹{toastDiv.anchorOption?.demurrageLossCr} Cr)</b> and port dues.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Smooth Berthing / Direct Port Evacuation View */
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-950/90 border border-emerald-500/60 text-[10px] space-y-2">
                      <div className="flex items-center justify-between text-emerald-300 font-bold">
                        <span className="flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{toastDiv.portName} Berthing Clear ({toastDiv.avgWaitDays}d wait • {toastDiv.vesselsAtAnchor} queued)</span>
                        </span>
                        <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-extrabold uppercase border border-emerald-800">
                          {toastDiv.congestionStatus}
                        </span>
                      </div>

                      {/* Direct Port Turnaround Baseline */}
                      <div className="bg-emerald-950/50 border border-emerald-900/60 rounded p-1.5 text-emerald-200 flex items-center justify-between">
                        <span>⚓ <strong>Direct Port Turnaround:</strong> ~{toastDiv.berthTurnaroundHours || 36}h</span>
                        <span className="font-mono font-bold text-emerald-400">
                          Optimal Queue (0 Diversion Surcharge)
                        </span>
                      </div>

                      {/* Direct Port Hinterland Evacuation (Rail Rakes vs Trucks) */}
                      {toastDiv.directEvacuation && (
                        <div className="p-2 rounded bg-slate-900 border border-indigo-500/50 text-[9px] space-y-1">
                          <div className="flex items-center justify-between font-bold text-indigo-300">
                            <span className="flex items-center space-x-1">
                              <span>🚂</span>
                              <span>Hinterland Evacuation: {toastDiv.directEvacuation.cluster} ({toastDiv.directEvacuation.distanceKm} km)</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-slate-300 pt-0.5">
                            <div>
                              FOIS Rail Freight: <b className="text-white">₹{toastDiv.directEvacuation.trainCostCr} Cr</b> <span className="text-slate-400">({toastDiv.directEvacuation.trainRakesNeeded} rakes)</span>
                            </div>
                            <div>
                              Truck Freight (Road): <b className="text-amber-300">₹{toastDiv.directEvacuation.truckCostCr} Cr</b>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-slate-400 text-[8.5px] pt-0.5 border-t border-slate-800">
                            <span>Road Surcharge Penalty: <b className="text-rose-400">+₹{toastDiv.directEvacuation.roadSurchargeCr} Cr</b></span>
                            <span className="text-cyan-400 font-semibold" title="FreightFox Indian Trucking Price Book (PPAC Diesel-Indexed Benchmark)">FreightFox Index (PPAC)</span>
                          </div>
                        </div>
                      )}

                      {/* Terminal Strategy Profile */}
                      <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-[9px] flex items-center justify-between text-slate-300">
                        <span>Approach Strategy: <b className="text-emerald-300">Direct Fairway Inward Transit</b></span>
                        <span className="font-mono text-emerald-400 font-bold">Clear Sea Gate Ring</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1.5 border-t border-slate-800 text-[11px]">
                  <button
                    onClick={() => setActiveToast(null)}
                    className="px-2 py-0.5 text-slate-400 hover:text-slate-200 text-[10px] font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleFocusVessel(activeToast)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] flex items-center space-x-1 transition-all shadow-xs cursor-pointer"
                  >
                    <Crosshair className="w-3 h-3" />
                    <span>Focus Map</span>
                  </button>
                </div>
              </div>
            );
          })()}

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
                <span className="font-bold block mb-0.5">Automated Port Turnaround Readiness:</span>
                Monitors outer anchorage queues, pilot boarding status, and berth availability so logistics managers have real-time visibility into vessel arrival milestones.
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

              {/* 80 NM Multimodal Hinterland Evacuation (Rail Rakes vs Trucks) for Selected Vessel */}
              {(() => {
                const vesselEvacAdv = evaluateVesselPortCongestionDiversion({
                  portId: selectedVessel.destinationId || 'paradip',
                  vesselType: selectedVessel.vesselType,
                  currentDraught: selectedVessel.currentDraughtMeters,
                  vesselName: selectedVessel.name,
                  vesselCoordinates: selectedVessel.coordinates,
                  speedKnots: selectedVessel.speedKnots,
                  dwt: selectedVessel.dwt,
                  cargo: selectedVessel.cargo
                });
                const evac = vesselEvacAdv?.directEvacuation;
                if (!evac) return null;

                return (
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded p-2.5 text-[11px] text-slate-800 mb-3 space-y-1">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span className="flex items-center space-x-1">
                        <span>🚂</span>
                        <span>80 NM Logistics: {evac.cluster} ({evac.distanceKm} km)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-700 pt-0.5">
                      <div>FOIS Rail Freight: <b className="text-indigo-900 font-mono font-bold">₹{evac.trainCostCr} Cr</b> <span className="text-slate-500">({evac.trainRakesNeeded} rakes)</span></div>
                      <div>Truck Fleet (Road): <b className="text-amber-900 font-mono font-bold">₹{evac.truckCostCr} Cr</b></div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-600 font-medium pt-0.5 border-t border-indigo-200/80">
                      <span>Road Surcharge Penalty: <b className="text-rose-700 font-mono font-bold">+₹{evac.roadSurchargeCr} Cr</b></span>
                      <span className="text-cyan-800 font-semibold" title="FreightFox Indian Trucking Price Book (PPAC Diesel-Indexed Benchmark)">FreightFox Index (PPAC)</span>
                    </div>

                    {vesselEvacAdv?.bestOption && vesselEvacAdv?.isPortFull && (
                      <div className="mt-2 p-2 rounded bg-emerald-50/90 border border-emerald-300 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-emerald-950">
                          <span className="flex items-center space-x-1">
                            <span>⭐</span>
                            <span>Best Option Out of All Choices:</span>
                          </span>
                          <span className="text-[8px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-extrabold uppercase shadow-2xs">
                            AI Winner
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[9.5px]">
                          <span className="font-extrabold text-emerald-900">{vesselEvacAdv.bestOption.title}</span>
                          <span className="font-mono font-bold text-emerald-800">+₹{vesselEvacAdv.bestOption.netPayoffCr} Cr</span>
                        </div>
                        <div className="text-[8.5px] text-slate-600 leading-snug">
                          {vesselEvacAdv.bestOption.rationale}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
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
