/**
 * NaviFreight Central API Client & Service Configuration
 * 
 * Configured for Render Free Cloud Hosting:
 * Git Repo: https://github.com/manthanpatil192/navifreight.git
 */

// Production Render URL or user custom URL, falling back to localhost during local dev
export const BACKEND_BASE_URL = 
  import.meta.env.VITE_BACKEND_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:5000' 
    : 'https://navifreight-backend.onrender.com');

/**
 * Health check helper to verify if the Render backend service is awake
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/health`, { 
      signal: AbortSignal.timeout(3000) 
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Offline or sleeping on free tier
  }
  return null;
}

/**
 * Fetch vessel bunching collision telemetry from backend
 */
export async function fetchVesselBunchingTelemetry(port = 'paradip') {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/bunching?port=${encodeURIComponent(port)}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fall back to client-side data
  }
  return null;
}

/**
 * Fetch live maritime market intelligence news from backend
 */
export async function fetchBackendMarketNews() {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/news`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Fall back to static JSON
  }
  return null;
}
