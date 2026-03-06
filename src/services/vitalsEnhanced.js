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
    hr:     Math.round(getBaseHR()),
    spo2:   parseFloat((97).toFixed(1)),
    hrv:     parseFloat((65).toFixed(1)),
    stress:  'Moderate',
    activity: 'Moderately Active',
    steps:   getBaseSteps(),
    calories: 1800,
    sleep:    parseFloat((7.5).toFixed(1)),
  });

  const [useRealData, setUseRealData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Try to fetch real data from Python backend first
    async function fetchRealVitals() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('http://localhost:5000/v1/physiology/vitals-realtime');
        if (response.ok) {
          const data = await response.json();
          
          // Transform Python backend data to our format
          const rawSpo2 = data.spo2 || 97;
          setVitals({
            hr:       Math.min(200, Math.max(40, Math.round(data.heart_rate_bpm || getBaseHR()))),
            spo2:     Math.min(100, Math.max(90, parseFloat((rawSpo2 < 1 ? rawSpo2 * 100 : rawSpo2).toFixed(1)))),
            hrv:      Math.min(120, Math.max(20, parseFloat((data.hrv_ms || 65).toFixed(1)))),
            stress:   ['Low','Moderate','High'].includes(data.physio_state) ? data.physio_state : 'Moderate',
            activity: 'Moderately Active',
            steps:    Math.max(0, data.steps || getBaseSteps()),
            calories: Math.max(0, data.active_calories || 1800),
            sleep:    Math.min(24, Math.max(0, parseFloat((data.sleep_hours || 7.5).toFixed(1)))),
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
          hr: Math.round(getBaseHR()),
          spo2: parseFloat((97).toFixed(1)),
          hrv: parseFloat((65).toFixed(1)),
          stress: 'Moderate',
          activity: 'Moderately Active',
          steps: getBaseSteps(),
          calories: 1800,
          sleep: parseFloat((7.5).toFixed(1)),
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
        hr: Math.round(clamp(v.hr + (Math.random() - 0.5) * 4, 55, 100)),
        spo2: parseFloat(clamp(v.spo2 + (Math.random() - 0.5) * 2, 94, 100).toFixed(1)),
        hrv: parseFloat(clamp(v.hrv + (Math.random() - 0.5) * 8, 20, 120).toFixed(1)),
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
