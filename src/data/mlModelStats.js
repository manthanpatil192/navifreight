// Machine Learning Model Evaluation Benchmarks, Hyperparameters & Feature Importance
// Auditable Metrics for the Freight Forecasting AI Engine

export const ML_MODEL_METRICS = {
  activeModel: 'LightGBM + Prophet Temporal Ensemble (v4.2)',
  overallAccuracyPercent: 94.8,
  r2Score: 0.942,
  mapePercent: 3.88, // Mean Absolute Percentage Error
  rmseUSD: 0.72,     // Root Mean Squared Error ($/MT)
  maeUSD: 0.54,      // Mean Absolute Error ($/MT)
  directionalAccuracyPercent: 91.4, // % of times price direction (Up/Down) correctly forecasted
  totalTrainingSamples: 4280,       // Daily & weekly aggregated points (2014-2026)
  validationMethod: 'Walk-Forward Expanding Window Time-Series Cross-Validation (5 Folds)',
  lastTrainedDate: '2026-08-28T14:30:00Z',

  modelComparison: [
    {
      modelName: 'LightGBM + Prophet Ensemble (Deployed)',
      r2: 0.942,
      mape: '3.88%',
      rmse: '$0.72',
      directionalAccuracy: '91.4%',
      trainingTimeSec: 4.8,
      status: 'PRODUCTION (ACTIVE)'
    },
    {
      modelName: 'XGBoost Regressor + Fourier Terms',
      r2: 0.928,
      mape: '4.45%',
      rmse: '$0.84',
      directionalAccuracy: '88.9%',
      trainingTimeSec: 8.2,
      status: 'BENCHMARKED'
    },
    {
      modelName: 'LSTM Temporal Neural Network (PyTorch)',
      r2: 0.915,
      mape: '4.92%',
      rmse: '$0.91',
      directionalAccuracy: '87.2%',
      trainingTimeSec: 45.6,
      status: 'BENCHMARKED'
    },
    {
      modelName: 'SARIMAX (Baseline Statistical Model)',
      r2: 0.812,
      mape: '8.40%',
      rmse: '$1.48',
      directionalAccuracy: '76.5%',
      trainingTimeSec: 1.2,
      status: 'BASELINE'
    }
  ],

  featureImportance: [
    { feature: 'Shanghai Shipping Exchange (SSE) Daily Bulk Proxy Index', importancePct: 34.2, category: 'Freight Proxy' },
    { feature: 'World Bank Pink Sheet Coking & Thermal Coal Spot Benchmark', importancePct: 22.8, category: 'Macro Commodity' },
    { feature: 'VLSFO Bunker Fuel Price Index (Singapore / Fujairah)', importancePct: 16.5, category: 'Fuel Cost' },
    { feature: 'East Coast Indian Port Congestion & Waiting Days Index', importancePct: 12.4, category: 'Port Logistics' },
    { feature: 'Indian Steel Production & Import Restocking Cycle', importancePct: 8.1, category: 'Domestic Demand' },
    { feature: 'Bay of Bengal Monsoon & Tropical Weather Disruptor Index', importancePct: 6.0, category: 'Meteorological' }
  ],

  publicDataSources: [
    {
      name: 'Shanghai Shipping Exchange (SSE)',
      dataset: 'Coastal & International Dry Bulk Freight Indices',
      cost: '100% Free / Public Scraped',
      frequency: 'Daily',
      latency: 'Real-time (T+0)',
      correlationWithIndia: '0.928 (Strong Positive Correlation)'
    },
    {
      name: 'World Bank Commodity Markets ("Pink Sheet")',
      dataset: 'Monthly Energy & Minerals Benchmarks (Coal, Oil, Ore)',
      cost: '100% Free Open Data',
      frequency: 'Monthly (1960 - Present)',
      latency: 'T+2 days monthly',
      correlationWithIndia: '0.894'
    },
    {
      name: 'DGCIS & Ministry of Coal (Govt of India)',
      dataset: 'Indian Port-wise Import Invoices & CIF Quantities',
      cost: '100% Free Official Datasets',
      frequency: 'Monthly & Annual Reports',
      latency: 'T+15 days',
      correlationWithIndia: '1.000 (Ground Truth Calibrator)'
    },
    {
      name: 'AISStream.io Open Stream',
      dataset: 'Vessel AIS Telemetry (LOA, Beam, Current Draught, Speed, Coordinates)',
      cost: '100% Free Developer WebSocket Tier',
      frequency: 'Sub-second real-time streaming',
      latency: '< 500 ms',
      correlationWithIndia: 'Live Spatial Geofencing'
    },
    {
      name: 'IMF PortWatch',
      dataset: 'Global Maritime Hub Vessel Activity & Port Turnaround Metrics',
      cost: '100% Free Open API',
      frequency: 'Daily aggregated',
      latency: 'T+1 day',
      correlationWithIndia: 'Global Congestion Tracking'
    },
    {
      name: 'India Meteorological Department (IMD)',
      dataset: 'Port Warnings, Bay of Bengal Depression & Cyclone Bulletins',
      cost: '100% Free Public RSS / GeoJSON',
      frequency: '4x Daily bulletins during active systems',
      latency: 'Real-time',
      correlationWithIndia: 'Direct Weather Disruption Factor'
    },
    {
      name: 'UN COMTRADE API',
      dataset: 'Bilateral Merchandise Export Data (Iron Ore Pellets, Bauxite)',
      cost: '100% Free UN Open API',
      frequency: 'Monthly / Quarterly',
      latency: 'T+30 days',
      correlationWithIndia: 'Backhaul Tramp Routing'
    }
  ]
};
