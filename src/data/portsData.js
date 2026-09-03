// Comprehensive Maritime Port Limits & Operational Constraints Database
// Primary Indian East Coast Ports and Key Global Bulk Export Origins
// Ground-Truth Data Sourced directly from Official Port Authority Gazette Notifications,
// PPT Berth Particulars, VPT Outer Harbour Gazette, Adani GPL/DPCL Technical Specs, and HDC Lock Guidelines.

export const INDIAN_EAST_COAST_PORTS = {
  paradip: {
    id: 'paradip',
    name: 'Paradip Port (PPT)',
    state: 'Odisha',
    coordinates: [20.2644, 86.6715],
    maxDraftLaden: 14.5, // Standard Coal Berths 05, 06, 07
    maxDraftHighTide: 16.0, // High-tide spring tide allowance (Up to 16.5m at KICT Berth 03)
    maxLOA: 300, // Berth 03 & MCHP Coal Berths accommodate up to 300m LOA
    maxBeam: 46.0,
    maxDWT: 125000, // Baby Cape / Kamsarmax (Full draft), Capesize (Light-loaded)
    recommendedVessels: ['Panamax', 'Kamsarmax', 'Baby Cape', 'Supramax'],
    handlingRateTPD: 45000, // Mechanised Coal Handling Plant (MCHP) rated at 4,000 MT/hr
    primaryCargoes: ['Coking Coal', 'Thermal Coal', 'Iron Ore Pellets', 'Fluxes'],
    demurragePerDayINR: 6500000, // ₹65 Lakhs / day ($75,000 USD)
    avgWaitDays: 3.2,
    congestionLevel: 'MODERATE',
    tidalRangeMeters: 1.8,
    transshipmentRequiredFor: ['Capesize (Fully Laden >16.0m draft)'],
    officialSource: 'Paradip Port Authority Official Gazette Berth Particulars 2024-2026 (Berths 03, 05, 06)',
    description: 'Premier deepwater port in Odisha with automated coal handling terminal and tidal draft constraints for large Capesize vessels.'
  },
  vizag: {
    id: 'vizag',
    name: 'Visakhapatnam Port (VPT/VPA)',
    state: 'Andhra Pradesh',
    coordinates: [17.6868, 83.2185],
    maxDraftLaden: 14.0, // Official 2025 VPA Trade Circular for Inner Harbour Berths (EQ-1, WQ-1)
    maxDraftHighTide: 14.5,
    outerHarbourDraft: 18.1, // Outer Harbour VGCB (Vizag General Cargo Berth)
    maxLOA: 300,
    maxBeam: 50.0,
    maxDWT: 200000, // Full Capesize at Outer Harbour, Panamax at Inner Harbour
    recommendedVessels: ['Capesize (Outer)', 'Kamsarmax', 'Panamax', 'Supramax'],
    handlingRateTPD: 60000,
    primaryCargoes: ['Coking Coal', 'Thermal Coal', 'Petcoke', 'Manganese Ore', 'Pellets'],
    demurragePerDayINR: 7200000, // ₹72 Lakhs / day ($83,000 USD)
    avgWaitDays: 1.4,
    congestionLevel: 'LOW',
    tidalRangeMeters: 1.2,
    transshipmentRequiredFor: ['Capesize at Inner Harbour berths (>14.0m draft)'],
    officialSource: 'Visakhapatnam Port Authority Trade Circular No. 168 (2025) & Outer Harbour Gazette',
    description: 'Dual-harbour configuration: 14.0m permissible draft at Inner Harbour, and 18.1m deep-water berth at Outer Harbour (VGCB).'
  },
  gangavaram: {
    id: 'gangavaram',
    name: 'Gangavaram Port (GPL)',
    state: 'Andhra Pradesh',
    coordinates: [17.6200, 83.2350],
    maxDraftLaden: 19.5, // All-weather deep water (Channel depth up to 21.0m)
    maxDraftHighTide: 20.2,
    maxLOA: 320,
    maxBeam: 52.0,
    maxDWT: 220000, // Newcastlemax / Super-Capesize
    recommendedVessels: ['Capesize', 'Newcastlemax', 'Kamsarmax', 'Panamax'],
    handlingRateTPD: 70000,
    primaryCargoes: ['Coking Coal', 'PCI Coal', 'Steam Coal', 'Bauxite', 'Iron Ore'],
    demurragePerDayINR: 7500000,
    avgWaitDays: 1.1,
    congestionLevel: 'LOW',
    tidalRangeMeters: 0.8,
    transshipmentRequiredFor: [],
    officialSource: 'Adani Gangavaram Port Ltd Deep-Draft Technical Operations Manual 2025',
    description: 'Deepest port on India East Coast; handles Super-Capesize with fast turnaround and direct rail connectivity to steel plants.'
  },
  dhamra: {
    id: 'dhamra',
    name: 'Dhamra Port (DPCL)',
    state: 'Odisha',
    coordinates: [20.8294, 86.9744],
    maxDraftLaden: 18.0, // All-weather Capesize Bulk Berths 1 & 2
    maxDraftHighTide: 18.5, // High-tide window allowance
    maxLOA: 310,
    maxBeam: 50.0,
    maxDWT: 180000, // Capesize
    recommendedVessels: ['Capesize', 'Kamsarmax', 'Panamax'],
    handlingRateTPD: 65000,
    primaryCargoes: ['Coking Coal', 'Thermal Coal', 'Limestone', 'Gypsum'],
    demurragePerDayINR: 6800000,
    avgWaitDays: 2.1,
    congestionLevel: 'LOW',
    tidalRangeMeters: 1.5,
    transshipmentRequiredFor: [],
    officialSource: 'Adani Ports Dhamra DPCL Bulk Terminal Guidelines 2025',
    description: 'Modern privately operated deep draught port with quick Cape turnaround and dedicated conveyor systems.'
  },
  gopalpur: {
    id: 'gopalpur',
    name: 'Gopalpur Port (GPL-Odisha)',
    state: 'Odisha',
    coordinates: [19.2965, 84.9650],
    maxDraftLaden: 13.5,
    maxDraftHighTide: 14.0,
    maxLOA: 230,
    maxBeam: 32.2,
    maxDWT: 75000, // Panamax / Supramax
    recommendedVessels: ['Panamax', 'Supramax', 'Ultramax', 'Handysize'],
    handlingRateTPD: 25000,
    primaryCargoes: ['Thermal Coal', 'Ilmenite Sand', 'Fertilizers', 'Petcoke'],
    demurragePerDayINR: 5200000,
    avgWaitDays: 3.2,
    congestionLevel: 'MODERATE',
    tidalRangeMeters: 1.4,
    transshipmentRequiredFor: ['Capesize', 'Kamsarmax'],
    officialSource: 'Gopalpur Ports Limited Berth Capacity Notification 2024',
    description: 'All-weather port ideal for Panamax and geared Supramax bulk parcels.'
  },
  haldia: {
    id: 'haldia',
    name: 'Haldia Dock Complex (HDC - SMPK)',
    state: 'West Bengal',
    coordinates: [22.0232, 88.0641],
    maxDraftLaden: 8.5, // Severely restricted riverine Hooghly lock draft (8.5m - 9.1m)
    maxDraftHighTide: 9.1,
    maxLOA: 230,
    maxBeam: 31.0,
    maxDWT: 35000, // Handymax / Lightened Supramax
    recommendedVessels: ['Handysize', 'Handymax', 'Lightened Supramax'],
    handlingRateTPD: 18000,
    primaryCargoes: ['Coking Coal (Lightened)', 'Petroleum Coke', 'Rock Phosphate', 'Manganese'],
    demurragePerDayINR: 5800000,
    avgWaitDays: 5.2,
    congestionLevel: 'HIGH',
    tidalRangeMeters: 3.8, // Severe tidal lock window
    transshipmentRequiredFor: ['Capesize', 'Kamsarmax', 'Panamax'],
    officialSource: 'Syama Prasad Mookerjee Port Kolkata (HDC) Lock Channel Circular 2025',
    description: 'Riverine port with strict lock gate and draft limits (8.5m). Deep vessels require Sagar/Sandheads transshipment.'
  },
  sandheads: {
    id: 'sandheads',
    name: 'Sagar / Sandheads Anchorage (Transshipment)',
    state: 'West Bengal',
    coordinates: [21.0500, 88.2000],
    maxDraftLaden: 14.8,
    maxDraftHighTide: 15.5,
    maxLOA: 300,
    maxBeam: 50.0,
    maxDWT: 180000, // Capesize Lightening
    recommendedVessels: ['Capesize (Lightening)', 'Panamax (Transshipment)', 'Barge Feeder'],
    handlingRateTPD: 22000,
    primaryCargoes: ['Coking Coal Transshipment', 'Thermal Coal Topping'],
    demurragePerDayINR: 7000000,
    avgWaitDays: 3.5,
    congestionLevel: 'MODERATE',
    tidalRangeMeters: 2.2,
    transshipmentRequiredFor: [],
    officialSource: 'Kolkata Port Trust Sandheads Offshore Transshipment Gazette',
    description: 'Open sea transshipment hub where Capesize vessels discharge partial parcels into daughter barges bound for Haldia/Kolkata.'
  }
};

export const ORIGIN_LOADING_PORTS = {
  hay_point: {
    id: 'hay_point',
    name: 'Hay Point / DBCT (Australia)',
    country: 'Australia',
    coordinates: [-21.2861, 149.2972],
    maxDraftLaden: 19.1,
    maxLOA: 330,
    handlingRateTPD: 85000,
    primaryCargoes: ['Premium Hard Coking Coal', 'PCI Coal'],
    distanceToEastCoastNM: 4120, // Nautical miles to Paradip
    officialSource: 'Dalrymple Bay Coal Terminal (DBCT) Australia Port Operations Manual'
  },
  gladstone: {
    id: 'gladstone',
    name: 'Gladstone R.G. Tanna (Australia)',
    country: 'Australia',
    coordinates: [-23.8344, 151.2589],
    maxDraftLaden: 17.8,
    maxLOA: 315,
    handlingRateTPD: 75000,
    primaryCargoes: ['Coking Coal', 'Thermal Coal'],
    distanceToEastCoastNM: 4250,
    officialSource: 'Gladstone Ports Corporation Operations Manual'
  },
  samarinda: {
    id: 'samarinda',
    name: 'Muara Berau / Samarinda (Indonesia)',
    country: 'Indonesia',
    coordinates: [-0.5022, 117.1536],
    maxDraftLaden: 14.2,
    maxLOA: 240,
    handlingRateTPD: 35000,
    primaryCargoes: ['Sub-bituminous Thermal Coal'],
    distanceToEastCoastNM: 2450,
    officialSource: 'Indonesian Directorate General of Sea Transportation'
  },
  richards_bay: {
    id: 'richards_bay',
    name: 'Richards Bay RBCT (South Africa)',
    country: 'South Africa',
    coordinates: [-28.8000, 32.0833],
    maxDraftLaden: 17.5,
    maxLOA: 310,
    handlingRateTPD: 70000,
    primaryCargoes: ['High-CV Thermal Coal', 'Anthracite'],
    distanceToEastCoastNM: 4680,
    officialSource: 'Richards Bay Coal Terminal (RBCT) Technical Specs'
  }
};
