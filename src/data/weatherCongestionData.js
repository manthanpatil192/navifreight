// Real-Time Port Congestion & IMD Bay of Bengal Meteorological Disruption Radar
// Sources: India Meteorological Department (IMD), Port Authority Daily PDF Traffic Reports, IMF PortWatch

export const IMD_WEATHER_ALERTS = [
  {
    id: 'imd-2026-08-bob-01',
    category: 'LOW PRESSURE DEPRESSION ALERT',
    severity: 'MODERATE', // LOW, MODERATE, HIGH, CRITICAL
    region: 'North-West Bay of Bengal (Off Odisha & Bengal Coast)',
    windSpeedKnots: 28,
    waveHeightMeters: 2.8,
    status: 'ACTIVE MONITORING',
    affectedPorts: ['Paradip Port', 'Dhamra Port', 'Haldia Dock Complex'],
    forecastImpact: 'Intermittent squally weather over next 72 hours; berthing pilotage suspended during peak squall bursts.',
    recommendation: 'Plan Laycan buffer (+24 hrs); prioritize sheltered deepwater berths at Dhamra/Gangavaram.',
    bulletinNo: 'IMD/CWC/BBS-2026/08/29'
  },
  {
    id: 'imd-2026-08-south-bob',
    category: 'MONSOON SWELL ADVISORY',
    severity: 'LOW',
    region: 'Central & South Bay of Bengal (Off Andhra Coast)',
    windSpeedKnots: 18,
    waveHeightMeters: 1.8,
    status: 'NORMAL MONSOON CONDITIONS',
    affectedPorts: ['Visakhapatnam Port', 'Gangavaram Port'],
    forecastImpact: 'Normal deepwater berthing operations; outer harbour pilotage operating seamlessly.',
    recommendation: 'Optimal berthing window for Capesize bulk carriers.',
    bulletinNo: 'IMD/CWC/VSKP-2026/08/30'
  }
];

export const PORT_CONGESTION_STATUS = {
  paradip: {
    portId: 'paradip',
    portName: 'Paradip Port',
    vesselsAtAnchor: 9,
    vesselsBerthWorking: 14,
    avgAnchorageWaitDays: 2.8,
    demurrageDailyExposureINR: 6500000,
    congestionStatus: 'MODERATE',
    trafficRiskScore: 58, // Out of 100
    berthTurnaroundHours: 36,
    pilotageAvailability: 'Normal',
    nextBerthSlotETA: '48 Hours'
  },
  vizag: {
    portId: 'vizag',
    portName: 'Visakhapatnam Port',
    vesselsAtAnchor: 4,
    vesselsBerthWorking: 18,
    avgAnchorageWaitDays: 1.9,
    demurrageDailyExposureINR: 7200000,
    congestionStatus: 'LOW',
    trafficRiskScore: 28,
    berthTurnaroundHours: 28,
    pilotageAvailability: 'Immediate 24/7',
    nextBerthSlotETA: '18 Hours'
  },
  gangavaram: {
    portId: 'gangavaram',
    portName: 'Gangavaram Port',
    vesselsAtAnchor: 2,
    vesselsBerthWorking: 8,
    avgAnchorageWaitDays: 1.4,
    demurrageDailyExposureINR: 7500000,
    congestionStatus: 'LOW',
    trafficRiskScore: 18,
    berthTurnaroundHours: 22,
    pilotageAvailability: 'Immediate 24/7',
    nextBerthSlotETA: '12 Hours'
  },
  dhamra: {
    portId: 'dhamra',
    portName: 'Dhamra Port',
    vesselsAtAnchor: 5,
    vesselsBerthWorking: 6,
    avgAnchorageWaitDays: 2.1,
    demurrageDailyExposureINR: 6800000,
    congestionStatus: 'LOW',
    trafficRiskScore: 32,
    berthTurnaroundHours: 26,
    pilotageAvailability: 'Normal',
    nextBerthSlotETA: '24 Hours'
  },
  gopalpur: {
    portId: 'gopalpur',
    portName: 'Gopalpur Port',
    vesselsAtAnchor: 6,
    vesselsBerthWorking: 3,
    avgAnchorageWaitDays: 3.2,
    demurrageDailyExposureINR: 5200000,
    congestionStatus: 'MODERATE',
    trafficRiskScore: 62,
    berthTurnaroundHours: 48,
    pilotageAvailability: 'Daylight Only',
    nextBerthSlotETA: '60 Hours'
  },
  haldia: {
    portId: 'haldia',
    portName: 'Haldia Dock Complex',
    vesselsAtAnchor: 12,
    vesselsBerthWorking: 11,
    avgAnchorageWaitDays: 4.5,
    demurrageDailyExposureINR: 5800000,
    congestionStatus: 'HIGH',
    trafficRiskScore: 84,
    berthTurnaroundHours: 64,
    pilotageAvailability: 'Strict Tidal Windows',
    nextBerthSlotETA: '96 Hours'
  }
};
