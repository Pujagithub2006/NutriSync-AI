// ─── vitals.js ────────────────────────────────────────────────
// Simulates real-time physiological data every 5 seconds.
// In production: replace with Google Fit / Apple Health API calls.

import { useState, useEffect } from 'react';

function getBaseHR() {
  const h = new Date().getHours();
  if (h >= 6 && h < 9)   return 78; // morning activity
  if (h >= 9 && h < 12)  return 72;
  if (h >= 12 && h < 14) return 75; // after lunch
  if (h >= 14 && h < 17) return 70;
  if (h >= 17 && h < 20) return 80; // evening workout
  return 65; // night rest
}

function getBaseSteps() {
  const h = new Date().getHours();
  const base = Math.floor(h * 480); // ~480 steps/hr average
  return base + Math.floor(Math.random() * 200);
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function useVitals() {
  const [vitals, setVitals] = useState({
    hr:     getBaseHR(),
    spo2:   97,
    steps:  getBaseSteps(),
    hrv:    42,         // heart rate variability ms
    stress: 'Low',
    activity: 'Moderate',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setVitals(prev => {
        const newHR   = clamp(prev.hr + (Math.random() > 0.5 ? 1 : -1) * Math.ceil(Math.random() * 3), 55, 110);
        const newSpo2 = clamp(prev.spo2 + (Math.random() > 0.75 ? 1 : -1), 94, 99);
        const newSteps = prev.steps + Math.floor(Math.random() * 12);
        const newHRV  = clamp(prev.hrv + (Math.random() > 0.5 ? 1 : -1) * Math.ceil(Math.random() * 2), 20, 80);

        // Derive stress from HRV
        const stress = newHRV > 55 ? 'Low' : newHRV > 35 ? 'Moderate' : 'High';

        // Derive activity from HR
        const activity = newHR > 90 ? 'High' : newHR > 75 ? 'Moderate' : 'Low';

        return { hr: newHR, spo2: newSpo2, steps: newSteps, hrv: newHRV, stress, activity };
      });
    }, 5000); // update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return vitals;
}

// Builds a plain object summary string for the AI prompt
export function vitalsContext(vitals) {
  return `Heart Rate: ${Math.round(vitals.hr)} BPM, SpO₂: ${parseFloat(vitals.spo2).toFixed(1)}%, Steps Today: ${vitals.steps.toLocaleString()}, HRV: ${parseFloat(vitals.hrv).toFixed(1)}ms, Stress Level: ${vitals.stress}, Activity Level: ${vitals.activity}`;
}