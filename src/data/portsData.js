// Comprehensive Maritime Port Limits & Operational Constraints Database
// Primary Indian East Coast Ports and Key Global Bulk Export Origins

export const INDIAN_EAST_COAST_PORTS = {
  paradip: {
    id: 'paradip',
    name: 'Paradip Port (PPT)',
    state: 'Odisha',
    coordinates: [20.2644, 86.6715],
    maxDraftLaden: 14.5,
    maxDraftHighTide: 16.0,
    maxLOA: 260,
    maxBeam: 45.0,
    maxDWT: 125000, // Baby Cape / Kamsarmax
    recommendedVessels: ['Panamax', 'Kamsarmax', 'Baby Cape', 'Supramax'],
    handlingRateTPD: 45000, // Tonnes per day
    primaryCargoes: ['Coking Coal', 'Thermal Coal', 'Iron Ore Pellets', 'Fluxes'],
    demurragePerDayINR: 6500000, // ₹65 Lakhs
    avgWaitDays: 2.8,
    congestionLevel: 'MODERATE',
    tidalRangeMeters: 1.8,
    transshipmentRequiredFor: ['Capesize (Fully Laden)'],
    description: 'Premier deepwater port in Odisha with automated coal handling terminal and tidal draft constraints for large Capesize vessels.'
  },
  vizag: {
    id: 'vizag',
    name: 'Visakhapatnam Port (VPT)',
    state: 'Andhra Pradesh',
    coordinates: [17.6868, 83.2185],
    maxDraftLaden: 18.1, // Outer Harbour
    maxDraftHighTide: 18.5,
    maxLOA: 300,
    maxBeam: 50.0,
    maxDWT: 200000, // Full Capesize at Outer Harbour (OB-1 / General Cargo Berth)
    recommendedVessels: ['Capesize', 'Kamsarmax', 'Panamax', 'Supramax'],
    handlingRateTPD: 60000,
    primaryCargoes: ['Coking Coal', 'Thermal Coal', 'Petcoke', 'Manganese Ore', 'Pellets'],
    demurragePerDayINR: 7200000, // ₹72 Lakhs
    avgWaitDays: 1.9,
    congestionLevel: 'LOW',
    tidalRangeMeters: 1.2,
    transshipmentRequiredFor: [],
    description: 'Outer harbour accommodates fully laden 200,000 DWT Capesize bulk carriers with high-speed gantry unloaders.'
  },
  gangavaram: {
    id: 'gangavaram',
    name: 'Gangavaram Port (GPL)',
    state: 'Andhra Pradesh',
    coordinates: [17.6200, 83.2350],
    maxDraftLaden: 19.5, // All-weather deep water
    maxDraftHighTide: 20.2,
    maxLOA: 320,
    maxBeam: 52.0,
    maxDWT: 220000, // Newcastlemax / Capesize
    recommendedVessels: ['Capesize', 'Newcastlemax', 'Kamsarmax', 'Panamax'],
    handlingRateTPD: 70000,
    primaryCargoes: ['Coking Coal', 'PCI Coal', 'Steam Coal', 'Bauxite', 'Iron Ore'],
    demurragePerDayINR: 7500000,
    avgWaitDays: 1.4,
    congestionLevel: 'LOW',
    tidalRangeMeters: 0.8,
    transshipmentRequiredFor: [],
    description: 'Deepest port on India East Coast; handles Super-Capesize with fast turnaround and direct rail connectivity to steel plants.'
  },
  dhamra: {
    id: 'dhamra',
    name: 'Dhamra Port (DPCL)',
    state: 'Odisha',
    coordinates: [20.8294, 86.9744],
    maxDraftLaden: 18.0,
    maxDraftHighTide: 18.5,
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
    description: 'All-weather port ideal for Panamax and geared Supramax bulk parcels.'
  },
  haldia: {
    id: 'haldia',
    name: 'Haldia Dock Complex (HDC - SMPK)',
    state: 'West Bengal',
    coordinates: [22.0232, 88.0641],
    maxDraftLaden: 7.8, // Severely restricted riverine lock draft
    maxDraftHighTide: 8.5,
    maxLOA: 215,
    maxBeam: 31.0,
    maxDWT: 35000, // Handymax / Lightened Supramax
    recommendedVessels: ['Handysize', 'Handymax', 'Lightened Supramax'],
    handlingRateTPD: 18000,
    primaryCargoes: ['Coking Coal (Lightened)', 'Petroleum Coke', 'Rock Phosphate', 'Manganese'],
    demurragePerDayINR: 5800000,
    avgWaitDays: 4.5,
    congestionLevel: 'HIGH',
    tidalRangeMeters: 3.8, // Severe tidal lock window
    transshipmentRequiredFor: ['Capesize', 'Kamsarmax', 'Panamax'],
    description: 'Riverine port with strict lock gate and draft limits (7.8m). Deep vessels require Sagar/Sandheads transshipment.'
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
    description: 'Open sea transshipment hub where Capesize vessels discharge partial parcels into daughter barges bound for Haldia/Kolkata.'
  }
};

export const ORIGIN_LOADING_PORTS = {
  hay_point: {
    id: 'hay_point',
    name: 'Hay Point / DBCT (Australia)',
    country: 'Australia',
    region: 'Queensland',
    coordinates: [-21.2858, 149.3003],
    maxDraft: 19.5,
    distanceToEastCoastNM: 5400, // Nautical Miles to Paradip
    transitDaysAverage: 16.5,
    primaryCargo: 'Premium Coking Coal',
    handlingRateTPD: 85000,
    typicalVessel: 'Capesize (160k-180k MT)',
    seasonalDisruptions: 'Q1 Cyclone season (Jan-March)'
  },
  gladstone: {
    id: 'gladstone',
    name: 'Gladstone Port (Australia)',
    country: 'Australia',
    region: 'Queensland',
    coordinates: [-23.8427, 151.2555],
    maxDraft: 17.5,
    distanceToEastCoastNM: 5550,
    transitDaysAverage: 17.0,
    primaryCargo: 'Hard Coking & Thermal Coal',
    handlingRateTPD: 75000,
    typicalVessel: 'Capesize / Panamax',
    seasonalDisruptions: 'Q1 Cyclone season'
  },
  newcastle: {
    id: 'newcastle',
    name: 'Port of Newcastle (Australia)',
    country: 'Australia',
    region: 'New South Wales',
    coordinates: [-32.9167, 151.7833],
    maxDraft: 15.2,
    distanceToEastCoastNM: 5850,
    transitDaysAverage: 18.0,
    primaryCargo: 'Semi-soft Coking & High-grade Thermal Coal',
    handlingRateTPD: 80000,
    typicalVessel: 'Capesize / Kamsarmax / Panamax',
    seasonalDisruptions: 'Occasional East Coast Lows'
  },
  hampton_roads: {
    id: 'hampton_roads',
    name: 'Hampton Roads / Norfolk (USA)',
    country: 'United States',
    region: 'Virginia - US East Coast',
    coordinates: [36.9500, -76.3333],
    maxDraft: 15.5,
    distanceToEastCoastNM: 9800, // via Cape of Good Hope
    transitDaysAverage: 29.5,
    primaryCargo: 'High-Vol & Low-Vol Met Coal',
    handlingRateTPD: 55000,
    typicalVessel: 'Capesize / Panamax',
    seasonalDisruptions: 'Winter freeze & rail congestion'
  },
  maputo: {
    id: 'maputo',
    name: 'Maputo / Matola Coal Terminal (Mozambique)',
    country: 'Mozambique',
    region: 'Southern Africa',
    coordinates: [-25.9667, 32.5667],
    maxDraft: 14.5,
    distanceToEastCoastNM: 4200,
    transitDaysAverage: 13.0,
    primaryCargo: 'Coking & Thermal Coal',
    handlingRateTPD: 35000,
    typicalVessel: 'Panamax / Supramax',
    seasonalDisruptions: 'Q1 SW Indian Ocean Tropical Cyclones'
  },
  samarinda_taboneo: {
    id: 'samarinda_taboneo',
    name: 'Taboneo / Samarinda Anchorage (Indonesia)',
    country: 'Indonesia',
    region: 'Kalimantan',
    coordinates: [-3.7500, 114.4500],
    maxDraft: 14.5, // Anchorage barge transshipment
    distanceToEastCoastNM: 2450,
    transitDaysAverage: 7.8,
    primaryCargo: 'Low/Mid-CV Thermal Coal',
    handlingRateTPD: 28000,
    typicalVessel: 'Supramax / Panamax / Capesize (Barge loading)',
    seasonalDisruptions: 'Monsoon heavy rains slowing barge conveyor loading'
  },
  taman_russia: {
    id: 'taman_russia',
    name: 'Taman Bulk Terminal (Russia)',
    country: 'Russia',
    region: 'Black Sea',
    coordinates: [45.1300, 36.6800],
    maxDraft: 18.5,
    distanceToEastCoastNM: 5900, // via Suez / Red Sea alternative
    transitDaysAverage: 22.0,
    primaryCargo: 'PCI & Metallurgical Coal',
    handlingRateTPD: 60000,
    typicalVessel: 'Capesize / Panamax',
    seasonalDisruptions: 'Geopolitical straits risk & winter fog'
  }
};
