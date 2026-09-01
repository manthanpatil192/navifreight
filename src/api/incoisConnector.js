// INCOIS (Indian National Centre for Ocean Information Services) API Simulator
// Simulates a live REST API feed for maritime weather and tidal harmonic data.
// In production, this would be replaced with `fetch('https://api.incois.gov.in/tides/v1/...')`

export const fetchLiveINCOISData = async (portId) => {
  // Simulate network latency (200-500ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  const now = new Date();
  
  // Real-world tide physics: Semi-diurnal tide (2 highs, 2 lows per lunar day = ~24.84 hrs)
  // One cycle = 12.42 hours.
  const hoursSinceMidnight = now.getHours() + now.getMinutes() / 60;
  const lunarPhaseOffset = 2.5; // Arbitrary offset to make the tide look dynamic during the demo
  const lunarDayPhase = ((hoursSinceMidnight + lunarPhaseOffset) % 12.42) / 12.42;
  
  // Math.sin for height, Math.cos for derivative (rising/falling)
  const tideSine = Math.sin(lunarDayPhase * Math.PI * 2);
  const tideCosine = Math.cos(lunarDayPhase * Math.PI * 2);
  const isRising = tideCosine > 0;

  // Port specific mean sea level (datum) and tidal amplitude (meters)
  const portParams = {
    paradip:    { datum: 14.5, amplitude: 0.9 }, // High tide ~15.4m, Low ~13.6m
    vizag:      { datum: 18.1, amplitude: 0.6 },
    gangavaram: { datum: 19.5, amplitude: 0.4 },
    dhamra:     { datum: 18.4, amplitude: 0.75 },
    gopalpur:   { datum: 13.5, amplitude: 0.7 },
    haldia:     { datum: 8.5,  amplitude: 1.9 }, // High tidal variation on Hooghly river
    sandheads:  { datum: 14.8, amplitude: 1.1 }
  };

  const params = portParams[portId] || portParams['paradip'];
  
  // Calculate exact current metrics
  const currentTideHeightMeters = params.amplitude * tideSine;
  const livePermissibleDraft = params.datum + currentTideHeightMeters;

  // Calculate next high tide time
  let hoursToNextHighTide = 0;
  if (isRising) {
    // If rising, next high tide is when phase hits 0.25 (90 degrees)
    let targetPhase = 0.25;
    if (lunarDayPhase > 0.25) targetPhase = 1.25;
    hoursToNextHighTide = (targetPhase - lunarDayPhase) * 12.42;
  } else {
    // If falling, next high tide is next cycle 0.25
    hoursToNextHighTide = (1.25 - lunarDayPhase) * 12.42;
  }
  
  const nextHighTideDate = new Date(now.getTime() + hoursToNextHighTide * 60 * 60 * 1000);
  const formattedNextHigh = nextHighTideDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Generate some realistic semi-random weather data
  const windKnots = 8 + Math.floor(Math.random() * 12); // 8-19 knots
  const waveHeight = 0.5 + Math.random() * 1.5; // 0.5 - 2.0m

  return {
    meta: {
      source: "INCOIS_REST_API",
      status: "200 OK",
      timestamp: now.toISOString(),
      station: portId.toUpperCase(),
      latencyMs: Math.floor(Math.random() * 40) + 12
    },
    oceanographic: {
      tideState: isRising ? 'FLOODING TIDE (RISING)' : 'EBBING TIDE (FALLING)',
      tideIndicator: isRising ? '▲' : '▼',
      currentTideHeight: +currentTideHeightMeters.toFixed(2),
      livePermissibleDraft: +livePermissibleDraft.toFixed(2),
      nextHighWaterTime: formattedNextHigh,
      nextHighWaterDraft: +(params.datum + params.amplitude).toFixed(2),
      waterDensity: 1.025 // Standard seawater
    },
    meteorological: {
      windSpeedKnots: windKnots,
      windDirection: 'SW',
      waveHeightMeters: +waveHeight.toFixed(1),
      swellCondition: waveHeight > 1.5 ? 'MODERATE' : 'SLIGHT'
    }
  };
};
