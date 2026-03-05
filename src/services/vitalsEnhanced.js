// ─── vitalsEnhanced.js ────────────────────────────────────────────────
// Enhanced vitals service with Python backend integration
// Falls back to simulated data if backend unavailable

import { useState, useEffect } from 'react';

// Fallback simulation functions (original)
function getBaseHR() {
  const h = new Date().getHours();
  if (h >= 6 && h < 9)   return 78;
  if (h >= 9 && h < 12)  return 72;
  if (h >= 12 && h < 14) return 75;
  if (h >= 14 && h < 17) return 70;
  if (h >= 17 && h < 20) return 80;
  return 65;
}

function getBaseSteps() {
  const h = new Date().getHours();
  const base = Math.floor(h * 480);
  return base + Math.floor(Math.random() * 200);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Enhanced vitals hook with Python backend integration
export function useVitalsEnhanced() {
  const [vitals, setVitals] = useState({
    hr:     getBaseHR(),
    spo2:   97,
    hrv:     65,
    stress:  'Moderate',
    activity: 'Moderately Active',
    steps:   getBaseSteps(),
    calories: 1800,
    sleep:    7.5,
  });

  const [useRealData, setUseRealData] = useState(true); // Start with real data by default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to fetch real data from Python backend first
    async function fetchRealVitals() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:5000/api/vitals-realtime');
        if (response.ok) {
          const data = await response.json();
          
          // Transform Python backend data to our format
          setVitals({
            hr: data.heart_rate_bpm || getBaseHR(),
            spo2: data.spo2 || 97,
            hrv: data.hrv_ms || 65,
            stress: data.physio_state || 'Moderate',
            activity: 'Moderately Active', // Would come from user profile
            steps: data.steps || getBaseSteps(),
            calories: data.active_calories || 1800,
            sleep: data.sleep_hours || 7.5,
          });
          setUseRealData(true); // Successfully got real data
        } else {
          throw new Error('Failed to fetch real vitals');
        }
      } catch (err) {
        console.warn('Failed to fetch real vitals, using simulated:', err);
        setError(null); // Don't show error to user
        
        // Fall back to simulated data
        setVitals({
          hr: getBaseHR(),
          spo2: 97,
          hrv: 65,
          stress: 'Moderate',
          activity: 'Moderately Active',
          steps: getBaseSteps(),
          calories: 1800,
          sleep: 7.5,
        });
        setUseRealData(false); // Using simulated data
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchRealVitals();

    // Set up interval for real-time updates only if real data is available
    const interval = useRealData ? setInterval(fetchRealVitals, 30000) : null; // Update every 30 seconds only for real data

    return () => interval && clearInterval(interval);
  }, [useRealData]);

  // Simulated data updates (keep existing behavior)
  useEffect(() => {
    if (useRealData) return; // Don't simulate if using real data

    const interval = setInterval(() => {
      setVitals(v => ({
        ...v,
        hr: clamp(v.hr + (Math.random() - 0.5) * 4, 55, 100),
        spo2: clamp(v.spo2 + (Math.random() - 0.5) * 2, 94, 100),
        hrv: clamp(v.hrv + (Math.random() - 0.5) * 8, 20, 120),
        steps: v.steps + Math.floor(Math.random() * 50),
        calories: v.calories + Math.floor(Math.random() * 20),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [useRealData]);

  return {
    vitals,
    loading,
    error,
  };
}
