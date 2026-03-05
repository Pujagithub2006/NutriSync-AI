// ─── healthScoreEnhanced.js ─────────────────────────────────────────────
// Enhanced health scoring with Python backend integration
// Falls back to original scoring if backend unavailable

import { calculateHealthScore } from '../utils/healthScore';

// Enhanced health scoring with Python backend integration
export async function calculateHealthScoreEnhanced(profile, vitals, diary = []) {
  try {
    // Try to get enhanced scoring from Python backend
    const response = await fetch('http://localhost:5000/api/physiology-enhanced', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: parseInt(profile?.age) || 25,
        gender: profile?.gender || 'unknown',
        weight_kg: parseFloat(profile?.weight) || 70,
        height_cm: parseFloat(profile?.height) || 170,
        activity_level: profile?.activity || 'moderately_active',
        heart_rate_bpm: vitals?.hr || 75,
        hrv_ms: vitals?.hrv || 65,
        spo2: vitals?.spo2 || 97,
        sleep_hours: vitals?.sleep || 7.5,
        steps: vitals?.steps || 8000,
        active_calories: vitals?.calories || 1800,
        stress_score: vitals?.stress === 'High' ? 8 : vitals?.stress === 'Moderate' ? 5 : 2,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Transform Python backend response to our format
      return {
        percentage: data.score || 75,
        breakdown: [
          {
            key: 'enhanced',
            label: '🧬 AI-Powered Analysis',
            score: data.score || 75,
            weight: 100,
            contribution: data.score || 75,
          }
        ],
        scores: {
          enhanced: (data.score || 75) / 100,
        },
        weights: { enhanced: 100 },
        totalWeight: 100,
        enhanced: true,
        state: data.physio_state || 'normal',
        reasons: data.reasons || ['AI analysis completed'],
      };
    } else {
      throw new Error('Enhanced scoring unavailable');
    }
  } catch (error) {
    console.warn('Enhanced health scoring failed, using fallback:', error);
    
    // Fall back to original scoring
    const originalScore = calculateHealthScore(profile, vitals, diary);
    return {
      ...originalScore,
      enhanced: false,
      state: 'normal',
      reasons: ['Using standard health scoring'],
    };
  }
}

// Get daily targets from Python backend
export async function getDailyTargetsEnhanced(profile, vitals) {
  try {
    const response = await fetch('http://localhost:5000/api/vitals-realtime');
    
    if (response.ok) {
      const data = await response.json();
      return {
        calories: data.adjusted_calories || 2200,
        baseCalories: data.base_calories || 2000,
        water: 2500, // ml
        steps: 10000,
        sleep: 8,
        enhanced: true,
      };
    }
  } catch (error) {
    console.warn('Enhanced targets unavailable, using defaults:', error);
  }

  // Fallback targets
  const goal = profile?.goal || 'balance';
  const baseTargets = {
    weightloss: { calories: 1600, water: 2500, steps: 8000, sleep: 8 },
    muscle: { calories: 2800, water: 3000, steps: 12000, sleep: 8 },
    energy: { calories: 2200, water: 2500, steps: 10000, sleep: 7 },
    balance: { calories: 2000, water: 2000, steps: 8000, sleep: 8 },
  };

  return {
    ...baseTargets[goal],
    enhanced: false,
  };
}
