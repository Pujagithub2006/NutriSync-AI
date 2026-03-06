// ─── healthScore.js ───────────────────────────────────────────
// Dynamic Weighted Health Score Engine
// 10 parameters, weights always redistribute to sum = 100
// + Glycemic Impact Score for each meal

// ================================================================
// PARAMETER SCORERS — each returns 0.0 to 1.0
// ================================================================

function scoreHR(hr) {
  if (hr >= 60 && hr <= 80) return 1.0;
  if (hr >= 55 && hr <  60) return 0.85;
  if (hr >  80 && hr <= 90) return 0.70;
  if (hr >  90 && hr <= 100)return 0.45;
  if (hr > 100)              return 0.15;
  if (hr <  55)              return 0.75;
  return 0.5;
}
function scoreSpO2(spo2) {
  if (spo2 >= 98) return 1.0;
  if (spo2 === 97)return 0.90;
  if (spo2 === 96)return 0.70;
  if (spo2 === 95)return 0.50;
  if (spo2 === 94)return 0.30;
  return 0.10;
}
function scoreHRV(hrv) {
  if (hrv >= 70)             return 1.0;
  if (hrv >= 55 && hrv < 70) return 0.85;
  if (hrv >= 40 && hrv < 55) return 0.65;
  if (hrv >= 30 && hrv < 40) return 0.40;
  if (hrv <  30)             return 0.20;
  return 0.5;
}
function scoreStress(stress) {
  if (stress === 'Low')      return 1.0;
  if (stress === 'Moderate') return 0.60;
  if (stress === 'High')     return 0.20;
  return 0.5;
}
function scoreSteps(steps) {
  if (steps >= 10000) return 1.0;
  if (steps >= 7500)  return 0.85;
  if (steps >= 5000)  return 0.65;
  if (steps >= 2500)  return 0.40;
  if (steps >= 1000)  return 0.20;
  return 0.10;
}
function scoreBMI(bmi) {
  const b = parseFloat(bmi);
  if (b >= 18.5 && b <= 24.9) return 1.0;
  if (b >= 25.0 && b <= 27.0) return 0.75;
  if (b >= 27.1 && b <= 29.9) return 0.55;
  if (b >= 30.0 && b <= 34.9) return 0.30;
  if (b >= 35.0)               return 0.10;
  if (b <  18.5)               return 0.50;
  return 0.5;
}
function scoreCalories(diary, goal) {
  const todayKcal = diary.reduce((a, m) => a + (m.kcal || 0), 0);
  if (todayKcal === 0) return 0.7;
  const target = goal === 'weightloss' ? 1600 : goal === 'muscle' ? 2800 : 2200;
  const ratio  = todayKcal / target;
  if (ratio >= 0.85 && ratio <= 1.10) return 1.0;
  if (ratio >= 0.70 && ratio <  0.85) return 0.75;
  if (ratio >  1.10 && ratio <= 1.25) return 0.60;
  if (ratio <  0.70)                  return 0.40;
  return 0.25;
}
function scoreMedicalRisk(diseases) {
  const count = (diseases || []).filter(d => d !== 'None').length;
  if (count === 0) return 1.0;
  if (count === 1) return 0.75;
  if (count === 2) return 0.55;
  return 0.30;
}
function scoreGoalAlignment(profile, vitals, diary) {
  const goal    = profile?.goal;
  const protein = diary.reduce((a, m) => a + (m.protein || 0), 0);
  const kcal    = diary.reduce((a, m) => a + (m.kcal    || 0), 0);
  let score     = 0.6;
  if (goal === 'weightloss') {
    if (kcal > 0 && kcal < 1700) score += 0.2;
    if (vitals.steps > 7000)     score += 0.2;
  } else if (goal === 'muscle') {
    if (protein > parseFloat(profile?.weight || 70) * 1.5) score += 0.3;
    if (vitals.activity === 'High') score += 0.1;
  } else if (goal === 'energy') {
    if (vitals.stress !== 'High' && vitals.hr < 85) score += 0.3;
  } else if (goal === 'recovery') {
    if (vitals.hrv > 40) score += 0.3;
  } else { score = 0.8; }
  return Math.min(1.0, score);
}
function scoreGI(diary) {
  if (!diary || diary.length === 0) return 0.75;
  const giMap  = { Low: 1.0, Medium: 0.60, High: 0.20 };
  const scores = diary.map(m => giMap[m.gi] ?? 0.60);
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

// ================================================================
// DYNAMIC WEIGHT REDISTRIBUTION — total always = 100
// Base weight = 10 for each parameter, adjusted based on conditions
// ================================================================
function getDynamicWeights(profile, vitals) {
  const diseases = profile?.diseases || [];
  const goal     = profile?.goal     || 'balance';
  const age      = parseInt(profile?.age) || 25;
  const activity = profile?.activity || 'Moderately Active';
  const allergies = profile?.allergies || [];

  // Medical condition detection
  const hasDiabetes     = diseases.some(d => d.toLowerCase().includes('diabetes'));
  const hasHypertension = diseases.some(d => d.toLowerCase().includes('hypertension'));
  const hasHeartDisease = diseases.some(d => d.toLowerCase().includes('heart'));
  const hasPCOS         = diseases.some(d => d.toLowerCase().includes('pcos'));
  const hasThyroid      = diseases.some(d => d.toLowerCase().includes('thyroid'));
  const isAthlete       = activity === 'Athlete' || activity === 'Very Active';
  const isOlder         = age > 45;

  // ALLERGY-BASED WEIGHT ADJUSTMENTS
  const hasNutAllergy = allergies.some(a => a.toLowerCase().includes('nut') || a.toLowerCase().includes('peanut'));
  const hasLactoseIntolerance = allergies.some(a => a.toLowerCase().includes('lactose') || a.toLowerCase().includes('dairy'));
  const hasGlutenAllergy = allergies.some(a => a.toLowerCase().includes('gluten') || a.toLowerCase().includes('wheat'));

  // BASE WEIGHTS - exactly 10 for each parameter
  let w = { 
    hr:10, spo2:10, hrv:10, stress:10, steps:10, 
    bmi:10, calories:10, medicalRisk:10, goalAlign:10, gi:10 
  };

  // MEDICAL CONDITION WEIGHT ADJUSTMENTS
  // Heart disease: increase heart-related weights, decrease others
  if (hasHeartDisease) {
    w.hr += 5;        // Heart rate becomes critical
    w.spo2 += 3;      // Blood oxygen important
    w.gi += 2;        // Glycemic impact affects heart
    // Decrease others to maintain balance
    w.steps -= 3;
    w.bmi -= 2;
    w.calories -= 2;
    w.goalAlign -= 3;
  }

  // Diabetes: prioritize glucose management
  if (hasDiabetes) {
    w.gi += 5;         // Glycemic index critical
    w.calories += 3;   // Calorie management important
    w.hrv += 2;       // HRV affects glucose regulation
    // Decrease others
    w.steps -= 3;
    w.bmi -= 2;
    w.stress -= 2;
    w.medicalRisk -= 2;
  }

  // Hypertension: focus on heart and stress
  if (hasHypertension) {
    w.hr += 5;         // Heart rate monitoring critical
    w.stress += 3;     // Stress affects blood pressure
    w.spo2 += 2;      // Oxygen important
    // Decrease others
    w.gi -= 3;
    w.steps -= 2;
    w.calories -= 2;
    w.bmi -= 2;
  }

  // PCOS: focus on hormones and weight
  if (hasPCOS) {
    w.bmi += 5;        // Weight management critical
    w.gi += 3;         // Insulin resistance management
    w.hrv += 2;        // Hormonal balance
    // Decrease others
    w.steps -= 3;
    w.calories -= 2;
    w.stress -= 2;
    w.goalAlign -= 2;
  }

  // Thyroid: metabolism and weight focus
  if (hasThyroid) {
    w.calories += 5;   // Metabolism management
    w.bmi += 3;        // Weight monitoring
    w.steps += 2;      // Activity affects thyroid
    // Decrease others
    w.gi -= 3;
    w.hr -= 2;
    w.stress -= 2;
    w.medicalRisk -= 2;
  }

  // ALLERGY-BASED ADJUSTMENTS
  if (hasNutAllergy) {
    w.medicalRisk += 4;  // Allergy risk increases
    w.gi += 3;           // Need careful food selection
    w.goalAlign += 3;     // Alignment with restrictions critical
    // Decrease others
    w.steps -= 2;
    w.bmi -= 2;
    w.calories -= 2;
    w.hr -= 2;
    w.spo2 -= 2;
  }

  if (hasLactoseIntolerance) {
    w.medicalRisk += 3;  // Dietary restrictions
    w.calories += 4;     // Need alternative calcium sources
    w.goalAlign += 3;     // Meal planning critical
    // Decrease others
    w.gi -= 2;
    w.steps -= 2;
    w.bmi -= 2;
    w.stress -= 2;
    w.hrv -= 2;
  }

  if (hasGlutenAllergy) {
    w.medicalRisk += 3;  // Celiac considerations
    w.gi += 4;           // Gluten-free affects glycemic response
    w.goalAlign += 3;     // Meal planning essential
    // Decrease others
    w.calories -= 2;
    w.steps -= 2;
    w.bmi -= 2;
    w.stress -= 2;
    w.hrv -= 2;
  }

  // GOAL-BASED ADJUSTMENTS
  if (goal === 'weightloss') {
    w.calories += 5;   // Calorie deficit critical
    w.bmi += 3;        // Weight tracking important
    w.steps += 2;      // Activity for weight loss
    // Decrease others
    w.gi -= 3;
    w.hr -= 2;
    w.stress -= 2;
    w.medicalRisk -= 2;
  }

  if (goal === 'muscle') {
    w.calories += 5;   // Calorie surplus needed
    w.steps += 3;      // Resistance training
    w.protein = 5;     // Protein intake critical (new parameter)
    // Decrease others
    w.gi -= 3;
    w.bmi -= 2;
    w.stress -= 2;
    w.hrv -= 2;
  }

  if (goal === 'energy') {
    w.calories += 4;   // Energy availability
    w.hr += 3;         // Heart rate for performance
    w.steps += 3;      // Activity for energy
    // Decrease others
    w.gi -= 2;
    w.bmi -= 2;
    w.stress -= 2;
    w.medicalRisk -= 2;
    w.hrv -= 2;
  }

  if (goal === 'recovery') {
    w.hrv += 5;        // Recovery monitoring critical
    w.stress += 3;     // Stress management
    w.spo2 += 2;      // Oxygen for recovery
    // Decrease others
    w.gi -= 3;
    w.steps -= 2;
    w.calories -= 2;
    w.bmi -= 2;
    w.hr -= 2;
  }

  // AGE-BASED ADJUSTMENTS
  if (isOlder) {
    w.medicalRisk += 4;  // Age-related health risks
    w.hr += 3;           // Heart monitoring
    w.spo2 += 3;         // Oxygen monitoring
    // Decrease others
    w.steps -= 3;
    w.gi -= 2;
    w.calories -= 2;
    w.stress -= 2;
    w.bmi -= 2;
  }

  // ACTIVITY-BASED ADJUSTMENTS
  if (isAthlete) {
    w.hr += 4;         // Performance heart rate
    w.steps += 4;      // Training volume
    w.calories += 2;   // Energy needs
    // Decrease others
    w.medicalRisk -= 3;
    w.bmi -= 2;
    w.gi -= 2;
    w.stress -= 2;
    w.hrv -= 1;
  }

  // VITALS-BASED REAL-TIME ADJUSTMENTS
  if (vitals.hr > 90) {
    w.hr += 3;         // Elevated heart rate needs attention
    w.stress += 2;     // Stress affects heart rate
    // Decrease others
    w.gi -= 2;
    w.steps -= 1;
    w.calories -= 1;
    w.bmi -= 1;
  }

  if (vitals.spo2 < 96) {
    w.spo2 += 4;       // Low oxygen needs attention
    w.medicalRisk += 3; // Health risk increases
    // Decrease others
    w.gi -= 2;
    w.steps -= 2;
    w.calories -= 1;
    w.bmi -= 1;
    w.stress -= 1;
  }

  if (vitals.hrv < 35) {
    w.hrv += 5;        // Low HRV critical for recovery
    w.stress += 3;     // Stress affects HRV
    // Decrease others
    w.gi -= 3;
    w.steps -= 2;
    w.calories -= 2;
    w.bmi -= 1;
  }

  if (vitals.stress === 'High') {
    w.stress += 4;     // High stress needs management
    w.hrv += 3;        // HRV affected by stress
    // Decrease others
    w.gi -= 2;
    w.steps -= 2;
    w.calories -= 1;
    w.bmi -= 1;
    w.hr -= 1;
  }

  // ENSURE TOTAL WEIGHT = 100 (normalization)
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    const factor = 100 / total;
    // Scale all weights proportionally to maintain 100 total
    Object.keys(w).forEach(key => {
      w[key] = Math.round(w[key] * factor);
    });
    
    // Final adjustment to ensure exactly 100
    const finalTotal = Object.values(w).reduce((a, b) => a + b, 0);
    if (finalTotal !== 100) {
      w.goalAlign += (100 - finalTotal);
    }
  }

  return w;
}

// ================================================================
// MAIN HEALTH SCORE CALCULATOR
// Score = Σ(score_i × weight_i) / 100 → always 0–100
// ================================================================
export function calculateHealthScore(profile, vitals, diary = []) {
  const w = getDynamicWeights(profile, vitals);
  const scores = {
    hr:          scoreHR(vitals.hr),
    spo2:        scoreSpO2(vitals.spo2),
    hrv:         scoreHRV(vitals.hrv),
    stress:      scoreStress(vitals.stress),
    steps:       scoreSteps(vitals.steps),
    bmi:         scoreBMI(profile?.bmi),
    calories:    scoreCalories(diary, profile?.goal),
    medicalRisk: scoreMedicalRisk(profile?.diseases),
    goalAlign:   scoreGoalAlignment(profile, vitals, diary),
    gi:          scoreGI(diary),
  };

  let weightedSum = 0;
  for (const key of Object.keys(scores)) weightedSum += scores[key] * (w[key] || 10);
  const percentage = Math.round(weightedSum);

  const LABELS = {
    hr:'❤️ Heart Rate', spo2:'🫁 Blood Oxygen', hrv:'🧬 HRV',
    stress:'🧠 Stress', steps:'👟 Steps', bmi:'⚖️ BMI',
    calories:'🔥 Calories', medicalRisk:'🏥 Medical Risk',
    goalAlign:'🎯 Goal Alignment', gi:'📊 Glycemic Index',
  };

  const breakdown = Object.keys(scores).map(key => ({
    key, label: LABELS[key]||key,
    score:        Math.round(scores[key] * 100),
    weight:       w[key] || 10,
    contribution: Math.round(scores[key] * (w[key]||10)),
  })).sort((a, b) => b.weight - a.weight);

  const totalWeight = Object.values(w).reduce((a,b)=>a+b,0);
  return { percentage, breakdown, scores, weights:w, totalWeight };
}

// ================================================================
// GLYCEMIC IMPACT SCORE
// Explains WHY two same-calorie meals are completely different
// for this specific person's body right now
// ================================================================

// Known fiber-rich ingredients
const FIBER_FOODS = ['oats','dal','lentil','rajma','chana','beans','spinach','broccoli',
  'carrot','apple','pear','banana','sweet potato','brown rice','quinoa','barley',
  'methi','palak','whole wheat','roti','poha','sabzi','vegetable'];

// Known anti-spike / slow-release foods
const ANTI_SPIKE = ['cinnamon','vinegar','lemon','lime','fenugreek','methi','oats',
  'barley','lentil','dal','nuts','seeds','curd','yogurt','buttermilk'];

// Known anti-inflammatory foods
const ANTI_INFLAM = ['turmeric','ginger','garlic','omega','salmon','flaxseed','walnut',
  'berries','spinach','kale','green tea','amla','tulsi','ashwagandha'];

function containsAny(ingredients, list) {
  if (!ingredients || ingredients.length === 0) return false;
  const joined = ingredients.join(' ').toLowerCase();
  return list.some(item => joined.includes(item));
}

export function calculateGlycemicImpact(meal, vitals, profile) {
  const diseases  = profile?.diseases || [];
  const goal      = profile?.goal     || 'balance';
  const gi        = meal.gi           || 'Medium';
  const gl        = meal.gl           || 15;
  const protein   = meal.protein      || 0;
  const fat       = meal.fat          || 0;
  const carbs     = meal.carbs        || 0;
  const ingredients = (meal.ingredients || []).map(i => i.toLowerCase());

  const isDiabetic     = diseases.some(d => d.toLowerCase().includes('diabetes'));
  const hasPCOS        = diseases.some(d => d.toLowerCase().includes('pcos'));
  const hasHeartDisease= diseases.some(d => d.toLowerCase().includes('heart'));
  const isPostExercise = vitals.steps > 8000 && vitals.activity === 'High';

  const breakdown = []; // tracks each factor with reason
  let score = 0;

  // ── 1. Base GI Score (most important factor) ─────────────────
  let giBase = 0;
  if (gi === 'Low')    { giBase = 40; breakdown.push({ label:'Low GI',        value:'+40', positive:true,  reason:'Slow glucose release — no blood sugar spike' }); }
  else if (gi==='Medium'){ giBase=22; breakdown.push({ label:'Medium GI',     value:'+22', positive:true,  reason:'Moderate glucose release — manageable impact' }); }
  else                  { giBase = 8; breakdown.push({ label:'High GI',        value:'+8',  positive:false, reason:'Rapid glucose spike — energy crash likely' }); }
  score += giBase;

  // ── 2. Glycemic Load (GL) — GI × actual carb quantity ────────
  // GL = (GI × carbs) / 100, but we use meal's gl directly
  if (gl < 10)       { score += 15; breakdown.push({ label:'Low GL',         value:'+15', positive:true,  reason:'Small actual carb load — minimal insulin demand' }); }
  else if (gl <= 20) { score +=  5; breakdown.push({ label:'Moderate GL',    value:'+5',  positive:true,  reason:'Moderate carb load — manageable for most people' }); }
  else               { score -= 10; breakdown.push({ label:'High GL',        value:'-10', positive:false, reason:'Large carb load — significant insulin response' }); }

  // ── 3. Protein buffer (slows glucose absorption) ─────────────
  if (protein >= 25) { score += 12; breakdown.push({ label:'High Protein',   value:'+12', positive:true,  reason:`${protein}g protein slows glucose into bloodstream` }); }
  else if (protein >= 15) { score += 6; breakdown.push({ label:'Moderate Protein', value:'+6', positive:true, reason:`${protein}g protein partially buffers glucose spike` }); }
  else               { score -=  3; breakdown.push({ label:'Low Protein',    value:'-3',  positive:false, reason:'Low protein means faster glucose absorption' }); }

  // ── 4. Fat buffer (further slows digestion) ──────────────────
  if (fat >= 10 && fat <= 25) { score += 5; breakdown.push({ label:'Healthy Fat',   value:'+5',  positive:true,  reason:`${fat}g healthy fat slows gastric emptying` }); }
  else if (fat > 25)          { score -= 5; breakdown.push({ label:'Excess Fat',    value:'-5',  positive:false, reason:'Too much fat causes sluggishness and poor absorption' }); }

  // ── 5. Fiber-rich ingredients ─────────────────────────────────
  if (containsAny(ingredients, FIBER_FOODS)) {
    const bonus = hasHeartDisease ? 14 : 8;
    score += bonus;
    breakdown.push({ label:'Fiber-Rich',    value:`+${bonus}`, positive:true,  reason:'Soluble fiber traps glucose — prevents sharp spikes' });
  }

  // ── 6. Anti-spike ingredients ─────────────────────────────────
  if (containsAny(ingredients, ANTI_SPIKE)) {
    score += 8;
    breakdown.push({ label:'Anti-Spike Foods', value:'+8', positive:true, reason:'Fenugreek/curd/lemon proven to lower post-meal glucose' });
  }

  // ── 7. Anti-inflammatory ingredients ─────────────────────────
  if (containsAny(ingredients, ANTI_INFLAM)) {
    const bonus = vitals.hrv < 35 ? 12 : 6;
    score += bonus;
    breakdown.push({ label:'Anti-Inflammatory', value:`+${bonus}`, positive:true, reason:'Reduces oxidative stress that impairs insulin sensitivity' });
  }

  // ── 8. Medical condition modifiers ───────────────────────────
  if (isDiabetic) {
    if (gi === 'Low') {
      score += 15;
      breakdown.push({ label:'Diabetic Bonus',   value:'+15', positive:true,  reason:'Low GI critical for your diabetes — excellent choice' });
    } else if (gi === 'High') {
      score -= 20;
      breakdown.push({ label:'Diabetic Penalty', value:'-20', positive:false, reason:'High GI dangerous for diabetes — spikes blood glucose' });
    }
    if (gl > 20) {
      score -= 10;
      breakdown.push({ label:'High GL Warning',  value:'-10', positive:false, reason:'High glycemic load especially harmful for diabetics' });
    }
  }

  if (hasPCOS) {
    if (gi === 'Low') { score += 10; breakdown.push({ label:'PCOS Friendly',   value:'+10', positive:true,  reason:'Low GI reduces insulin resistance common in PCOS' }); }
    else              { score -=  8; breakdown.push({ label:'PCOS Concern',    value:'-8',  positive:false, reason:'High GI worsens insulin resistance in PCOS' }); }
  }

  if (hasHeartDisease && fat > 20) {
    score -= 8;
    breakdown.push({ label:'Heart Risk',       value:'-8',  positive:false, reason:'High fat intake strains cardiovascular system' });
  }

  // ── 9. Live vitals modifiers ──────────────────────────────────
  if (vitals.hr > 90) {
    if (gi === 'High') { score -= 12; breakdown.push({ label:'HR Alert',       value:'-12', positive:false, reason:'High GI + elevated HR = extra cardiovascular stress' }); }
    else               { score +=  5; breakdown.push({ label:'HR Safe',        value:'+5',  positive:true,  reason:'Low/Medium GI safer for your elevated heart rate' }); }
  }

  if (vitals.stress === 'High') {
    // Cortisol already raises blood sugar — low GI even more important
    if (gi === 'Low') { score += 10; breakdown.push({ label:'Stress Sync',    value:'+10', positive:true,  reason:'Low GI counters cortisol-driven glucose elevation' }); }
    else              { score -= 10; breakdown.push({ label:'Stress Risk',    value:'-10', positive:false, reason:'High stress + high GI = dangerous glucose double-spike' }); }
  }

  if (vitals.hrv < 35) {
    // Low HRV = poor recovery = inflammation — anti-inflammatory helps
    if (containsAny(ingredients, ANTI_INFLAM)) {
      score += 8;
      breakdown.push({ label:'Recovery Boost', value:'+8',  positive:true,  reason:'Anti-inflammatory foods aid HRV recovery' });
    }
  }

  if (isPostExercise && gi === 'High') {
    // Post exercise, glycogen replenishment — high GI is actually ok
    score += 10;
    breakdown.push({ label:'Post-Exercise',   value:'+10', positive:true,  reason:'High steps + high GI = glycogen replenishment window' });
  }

  // ── 10. Goal alignment ────────────────────────────────────────
  if (goal === 'weightloss' && gi === 'Low' && gl < 15) {
    score += 8;
    breakdown.push({ label:'Fat Loss Aligned', value:'+8', positive:true, reason:'Low GI/GL keeps insulin low — promotes fat burning' });
  }
  if (goal === 'muscle' && protein >= 25) {
    score += 6;
    breakdown.push({ label:'Muscle Aligned',   value:'+6', positive:true, reason:'High protein post-meal supports muscle protein synthesis' });
  }
  if (goal === 'energy' && gi === 'Low' && gl < 15) {
    score += 8;
    breakdown.push({ label:'Energy Aligned',   value:'+8', positive:true, reason:'Slow glucose = sustained energy without crash' });
  }

  // ── Final score — clamp 0-100 ─────────────────────────────────
  score = Math.max(0, Math.min(100, score));

  // Impact label
  const label    = score>=80?'Excellent':score>=65?'Good':score>=45?'Fair':score>=25?'Poor':'Harmful';
  const color    = score>=80?'#4cffb0':score>=65?'#b6f542':score>=45?'#ffb347':score>=25?'#ff9a3c':'#ff5e5e';
  const icon     = score>=80?'🟢':score>=65?'🟡':score>=45?'🟠':score>=25?'🔴':'⛔';

  // Generate comparison insight
  return { score, label, color, icon, breakdown };
}

// ================================================================
export function getHealthTier(percentage) {
  if (percentage >= 85) return { tier:'PEAK',     label:'Peak Performance', color:'#b6f542', icon:'🏆', description:'Your body is in optimal state today.' };
  if (percentage >= 70) return { tier:'GOOD',     label:'Good Health',      color:'#4cffb0', icon:'✅', description:'Minor optimizations can enhance your day.' };
  if (percentage >= 55) return { tier:'MODERATE', label:'Moderate',         color:'#ffb347', icon:'⚡', description:'Specific deficiencies need attention.' };
  if (percentage >= 40) return { tier:'LOW',      label:'Recovery Needed',  color:'#ff9a3c', icon:'🛡️', description:'Your body needs recovery nutrition.' };
  return                       { tier:'CRITICAL', label:'Critical Care',    color:'#ff5e5e', icon:'🚨', description:'Medical nutrition focus required.' };
}

// ================================================================
// TIER-SPECIFIC PROMPT INJECTOR
// ================================================================
export function getTierPrompt(tier, percentage, profile, vitals, breakdown) {
  const topIssues = breakdown.filter(b=>b.score<60).slice(0,3)
    .map(b=>`${b.label} (${b.score}/100, weight:${b.weight})`).join(', ') || 'all parameters normal';

  const prompts = {
    PEAK:`
=================================================================
HEALTH SCORE: ${percentage}/100 — 🏆 PEAK PERFORMANCE MODE
=================================================================
All 10 physiological parameters are in optimal range.
NUTRITION STRATEGY: High-energy, nutrient-dense performance meals.
Emphasize complex carbs, lean protein, healthy fats. Low-Medium GI.
EXERCISE STRATEGY: HIGH intensity training is safe today.
TONE: Celebratory and motivating.`,

    GOOD:`
=================================================================
HEALTH SCORE: ${percentage}/100 — ✅ GOOD HEALTH MODE
=================================================================
Weak parameters: ${topIssues}
NUTRITION STRATEGY: Balanced meals targeting weak parameters.
Prioritize Low-Medium GI foods. Address micronutrient gaps.
EXERCISE STRATEGY: Moderate intensity is ideal.
TONE: Positive and encouraging.`,

    MODERATE:`
=================================================================
HEALTH SCORE: ${percentage}/100 — ⚡ MODERATE MODE
=================================================================
Needs attention: ${topIssues}
NUTRITION STRATEGY — TARGETED THERAPEUTIC:
${vitals.spo2<96      ?'- 🩸 IRON-RICH: spinach, lentils, dates':''}
${vitals.stress==='High'?'- 🧘 MAGNESIUM-RICH: nuts, seeds, leafy greens':''}
${vitals.hr>85        ?'- ⚡ ELECTROLYTES: coconut water, bananas':''}
${vitals.hrv<35       ?'- 🛡️ ANTI-INFLAMMATORY: turmeric, ginger, omega-3':''}
Prioritize LOW GI foods. Lighter, easily digestible meals.
EXERCISE STRATEGY: Light to moderate only.
TONE: Caring and supportive.`,

    LOW:`
=================================================================
HEALTH SCORE: ${percentage}/100 — 🛡️ RECOVERY MODE
=================================================================
Critical: ${topIssues}
NUTRITION STRATEGY: Anti-inflammatory recovery foods only.
STRICT LOW GI — NO high GI foods whatsoever.
Small, frequent, easily digestible meals.
NO fried, spicy, processed foods or caffeine.
EXERCISE STRATEGY: Rest or 10-min gentle walk only.
TONE: Gentle and nurturing.`,

    CRITICAL:`
=================================================================
HEALTH SCORE: ${percentage}/100 — 🚨 CRITICAL NUTRITION MODE
=================================================================
Critical: ${topIssues}
NUTRITION STRATEGY — MEDICAL NUTRITION THERAPY:
Strictly LOW GI therapeutic meals only.
Conditions (${profile?.diseases?.filter(d=>d!=='None').join(', ')||'none'}) respected absolutely.
Therapeutic foods: khichdi, steamed dal, curd rice, warm soups.
EXERCISE STRATEGY: NO exercise. Complete rest.
TONE: Serious but calm.`,
  };
  return prompts[tier] || prompts.MODERATE;
}

// ================================================================
// AI PROMPT GENERATOR BASED ON WEIGHT ANALYSIS & SCORE RANGES
// Exclusive prompts based on weighted parameter importance
// ================================================================
export function generateTierPrompt(percentage, profile, vitals, breakdown) {
  const diseases = profile?.diseases || [];
  const goal = profile?.goal || 'balance';
  const age = parseInt(profile?.age) || 25;
  const allergies = profile?.allergies || [];
  
  // Analyze highest weighted parameters
  const topWeights = breakdown.sort((a, b) => b.weight - a.weight).slice(0, 3);
  const topParameters = topWeights.map(w => w.label).join(', ');
  const criticalIssues = breakdown.filter(b => b.score < 60).map(b => b.label).join(', ');
  
  // Medical condition context
  const hasDiabetes = diseases.some(d => d.toLowerCase().includes('diabetes'));
  const hasHeartDisease = diseases.some(d => d.toLowerCase().includes('heart'));
  const hasHypertension = diseases.some(d => d.toLowerCase().includes('hypertension'));
  const hasPCOS = diseases.some(d => d.toLowerCase().includes('pcos'));
  const hasThyroid = diseases.some(d => d.toLowerCase().includes('thyroid'));
  
  // Allergy context
  const hasNutAllergy = allergies.some(a => a.toLowerCase().includes('nut'));
  const hasLactoseIntolerance = allergies.some(a => a.toLowerCase().includes('lactose'));
  const hasGlutenAllergy = allergies.some(a => a.toLowerCase().includes('gluten'));
  
  // Vitals context
  const elevatedHR = vitals.hr > 90;
  const lowSpO2 = vitals.spo2 < 96;
  const lowHRV = vitals.hrv < 35;
  const highStress = vitals.stress === 'High';
  
  // Generate exclusive prompts based on score ranges
  if (percentage >= 90) {
    return `
=================================================================
ELITE HEALTH MODE: ${percentage}/100 — 🏆 OPTIMAL PERFORMANCE
=================================================================
TOP PARAMETERS: ${topParameters}
MEDICAL PROFILE: ${diseases.length > 0 ? diseases.join(', ') : 'None'}
ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None'}

🎯 EXCLUSIVE STRATEGY:
You are in elite health territory. Your body is operating at peak efficiency.
Focus on performance optimization, nutrient timing, and athletic nutrition.

NUTRITION STRATEGY — PERFORMANCE OPTIMIZATION:
${hasDiabetes ? '- DIABETES ELITE: Maintain perfect glucose control with precision carb timing' : ''}
${hasHeartDisease ? '- CARDIO ELITE: Heart-healthy performance nutrition with optimal omega-3 ratio' : ''}
- Macronutrient precision: Protein ${goal === 'muscle' ? '2.2g/kg' : '1.6g/kg'} for performance
- Nutrient timing: Pre-workout carbs 90min before, post-workout protein within 30min
- Hydration: 30-35ml/kg body weight with electrolyte optimization
- Micronutrient focus: Iron, B12, Vitamin D for energy metabolism

EXERCISE STRATEGY — PEAK PERFORMANCE:
${elevatedHR ? '- HR OPTIMIZATION: Focus on zone 2 training for cardiovascular efficiency' : ''}
${lowHRV ? '- RECOVERY ELITE: Active recovery, mobility, sleep optimization' : ''}
- High-intensity interval training 2x/week
- Strength training 3-4x/week with progressive overload
- Recovery protocols: Cryotherapy, compression, sleep 7-9h

AI PROMPT FOCUS:
"Generate elite performance meal plans with precise macronutrient timing, micronutrient optimization, and advanced sports nutrition strategies. Focus on nutrient density, anti-inflammatory compounds, and recovery nutrition."

TONE: Performance-focused, scientific, motivating.
=================================================================`;
  }
  
  if (percentage >= 80) {
    return `
=================================================================
EXCELLENT HEALTH MODE: ${percentage}/100 — ✅ VITALITY OPTIMIZED
=================================================================
TOP PARAMETERS: ${topParameters}
CRITICAL ISSUES: ${criticalIssues || 'None'}
MEDICAL PROFILE: ${diseases.length > 0 ? diseases.join(', ') : 'None'}

🎯 EXCLUSIVE STRATEGY:
Excellent health with minor optimization opportunities. 
Focus on maintaining current status while addressing specific parameter needs.

NUTRITION STRATEGY — MAINTENANCE & OPTIMIZATION:
${hasDiabetes ? '- DIABETES EXCELLENCE: Continue low GI excellence with advanced carb cycling' : ''}
${hasHeartDisease ? '- HEART HEALTH: Maintain cardiovascular nutrition with Mediterranean principles' : ''}
${hasPCOS ? '- PCOS CONTROL: Hormone balancing nutrition with insulin sensitivity focus' : ''}
- Consistent meal timing: 3 main meals + 1-2 strategic snacks
- Glycemic control: Low-medium GI foods, fiber 25-35g/day
- Protein distribution: 20-30g per meal for muscle synthesis
- Healthy fats: Omega-3 rich foods 2-3x/week

EXERCISE STRATEGY — CONSISTENT EXCELLENCE:
${elevatedHR ? '- HR MANAGEMENT: Maintain cardiovascular fitness with zone 2 emphasis' : ''}
${lowSpO2 ? '- OXYGEN OPTIMIZATION: Breathing exercises, aerobic conditioning' : ''}
- Consistent activity: 150-300min moderate intensity weekly
- Strength maintenance: 2-3x/week full body training
- Active recovery: Walking, yoga, stretching 3-4x/week

AI PROMPT FOCUS:
"Generate excellent health maintenance plans with nutrient timing, glycemic optimization, and lifestyle integration. Focus on sustainable nutrition, energy balance, and preventive health."

TONE: Encouraging, educational, sustainable.
=================================================================`;
  }
  
  if (percentage >= 65) {
    return `
=================================================================
GOOD HEALTH MODE: ${percentage}/100 — 🟢 STABLE & IMPROVING
=================================================================
TOP PARAMETERS: ${topParameters}
NEEDS ATTENTION: ${criticalIssues}
MEDICAL CONDITIONS: ${diseases.length > 0 ? diseases.join(', ') : 'None'}
ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None'}

🎯 EXCLUSIVE STRATEGY:
Good health foundation with specific areas needing targeted improvement.
Focus on addressing weak parameters while maintaining strengths.

NUTRITION STRATEGY — TARGETED IMPROVEMENT:
${hasDiabetes ? '- DIABETES FOCUS: Strict glycemic control with carb counting and timing' : ''}
${hasHeartDisease ? '- HEART FOCUS: Sodium restriction, healthy fats, portion control' : ''}
${hasHypertension ? '- BP FOCUS: DASH diet principles, potassium-rich foods, low sodium' : ''}
${hasPCOS ? '- PCOS FOCUS: Insulin resistance management, hormone balance nutrition' : ''}
${hasNutAllergy ? '- ALLERGY SAFE: Nut-free alternatives with adequate protein and healthy fats' : ''}
${hasLactoseIntolerance ? '- LACTOSE FREE: Calcium-rich alternatives, vitamin D optimization' : ''}
${hasGlutenAllergy ? '- GLUTEN FREE: Balanced nutrition with iron, B12, fiber focus' : ''}
- Address ${criticalIssues}: Specific nutritional interventions
- Meal structure: Regular timing, portion control, balanced macros
- Fiber increase: 5-10g more daily for satiety and glucose control
- Hydration: 2-3L daily with electrolyte balance

EXERCISE STRATEGY — CONDITIONING:
${elevatedHR ? '- CARDIO CONDITIONING: Gradual intensity increase, heart rate monitoring' : ''}
${lowSpO2 ? '- OXYGEN BUILDING: Breathing exercises, gradual aerobic conditioning' : ''}
${lowHRV ? '- RECOVERY BUILDING: Stress management, sleep hygiene, gentle movement' : ''}
${highStress ? '- STRESS REDUCTION: Yoga, meditation, nature walks, mindful movement' : ''}
- Progressive program: Start where you are, build gradually
- Consistency over intensity: 150min moderate weekly minimum
- Strength foundation: 2x/week basic movements, proper form

AI PROMPT FOCUS:
"Generate good health improvement plans targeting ${criticalIssues} with medical condition awareness, allergy safety, and progressive lifestyle changes. Focus on sustainable habits, education, and gradual improvement."

TONE: Supportive, educational, progressive.
=================================================================`;
  }
  
  if (percentage >= 45) {
    return `
=================================================================
MODERATE HEALTH MODE: ${percentage}/100 — ⚡ NEEDS ATTENTION
=================================================================
PRIORITY PARAMETERS: ${topParameters}
CRITICAL ISSUES: ${criticalIssues}
MEDICAL CONDITIONS: ${diseases.length > 0 ? diseases.join(', ') : 'None'}
ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None'}

🎯 EXCLUSIVE STRATEGY:
Multiple health parameters need attention. Focus on foundational improvements
while managing medical conditions and preventing further decline.

NUTRITION STRATEGY — FOUNDATIONAL REBUILD:
${hasDiabetes ? '- DIABETES URGENT: Strict glycemic control, medication coordination, education' : ''}
${hasHeartDisease ? '- HEART URGENT: Cardiac rehabilitation diet, strict medical supervision' : ''}
${hasHypertension ? '- BP URGENT: Intensive DASH protocol, medication coordination' : ''}
${hasPCOS ? '- PCOS URGENT: Intensive hormone management, fertility nutrition' : ''}
${hasThyroid ? '- THYROID URGENT: Thyroid-specific nutrition, medication timing' : ''}
${hasNutAllergy ? '- ALLERGY CRITICAL: Strict avoidance protocols, emergency planning' : ''}
${hasLactoseIntolerance ? '- LACTOSE CRITICAL: Complete avoidance, nutrient deficiency prevention' : ''}
${hasGlutenAllergy ? '- CELIAC CRITICAL: Strict healing protocol, nutrient monitoring' : ''}
- Priority focus: ${criticalIssues} - immediate intervention needed
- Meal rehabilitation: 3 balanced meals, no skipping, portion control
- Blood sugar stabilization: Low GI every 3-4 hours, protein at each meal
- Nutrient density: Maximum nutrition per calorie, whole foods focus
- Hydration protocol: 2.5L minimum, electrolyte balance

EXERCISE STRATEGY — GENTLE REBUILD:
${elevatedHR ? '- HR REHABILITATION: Medical clearance, very light activity, monitoring' : ''}
${lowSpO2 ? '- OXYGEN REHABILITATION: Breathing exercises, seated activities, medical supervision' : ''}
${lowHRV ? '- RECOVERY REHABILITATION: Gentle movement, stress reduction, sleep priority' : ''}
${highStress ? '- STRESS REHABILITATION: Professional mental health support, gentle therapies' : ''}
- Medical clearance required before starting
- Begin with 10-15min gentle walking, progress slowly
- Focus on activities of daily living, gradual progression
- Include flexibility, balance, breathing exercises

AI PROMPT FOCUS:
"Generate moderate health rehabilitation plans addressing ${criticalIssues} with medical condition management, allergy safety, and gentle progression. Focus on education, habit building, and sustainable lifestyle changes with medical supervision."

TONE: Caring, cautious, educational, medically aware.
=================================================================`;
  }
  
  if (percentage >= 25) {
    return `
=================================================================
LOW HEALTH MODE: ${percentage}/100 — 🛡️ RECOVERY REQUIRED
=================================================================
CRITICAL PARAMETERS: ${topParameters}
URGENT ISSUES: ${criticalIssues}
MEDICAL CONDITIONS: ${diseases.length > 0 ? diseases.join(', ') : 'None'}
ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None'}

🎯 EXCLUSIVE STRATEGY:
Significant health issues requiring immediate attention and medical supervision.
Focus on stabilization, recovery, and preventing further decline.

NUTRITION STRATEGY — MEDICAL NUTRITION THERAPY:
${hasDiabetes ? '- DIABETES CRITICAL: Intensive glucose management, medical nutrition therapy' : ''}
${hasHeartDisease ? '- HEART CRITICAL: Cardiac rehabilitation diet, strict medical supervision' : ''}
${hasHypertension ? '- BP CRITICAL: Intensive DASH protocol, medication coordination' : ''}
${hasPCOS ? '- PCOS CRITICAL: Intensive hormone management, fertility nutrition' : ''}
${hasThyroid ? '- THYROID CRITICAL: Thyroid-specific nutrition, medication timing' : ''}
${hasNutAllergy ? '- ALLERGY EMERGENCY: Strict avoidance protocols, emergency planning' : ''}
${hasLactoseIntolerance ? '- LACTOSE EMERGENCY: Complete avoidance, nutrient deficiency prevention' : ''}
${hasGlutenAllergy ? '- CELIAC EMERGENCY: Strict healing protocol, nutrient monitoring' : ''}
- Medical supervision essential for all nutrition changes
- Therapeutic nutrition: Address ${criticalIssues} with clinical precision
- Meal timing: Every 2-3 hours for glucose stability
- Nutrient rehabilitation: Correct deficiencies, support healing
- Anti-inflammatory focus: Reduce systemic inflammation, support recovery

EXERCISE STRATEGY — MEDICAL REHABILITATION:
${elevatedHR ? '- CARDIAC REHABILITATION: Medically supervised, very light progression' : ''}
${lowSpO2 ? '- RESPIRATORY REHABILITATION: Breathing therapy, oxygen monitoring' : ''}
${lowHRV ? '- AUTONOMIC REHABILITATION: Nervous system regulation, very gentle movement' : ''}
${highStress ? '- STRESS REHABILITATION: Professional mental health support, gentle therapies' : ''}
- Medical clearance and supervision mandatory
- Start with 5-10min gentle movement, bed exercises if needed
- Focus on activities of daily living, gradual progression
- Include breathing, gentle stretching, seated exercises

AI PROMPT FOCUS:
"Generate critical health recovery plans with medical nutrition therapy addressing ${criticalIssues}. Focus on clinical precision, safety protocols, professional coordination, and gentle rehabilitation. All recommendations must be medically supervised."

TONE: Clinical, cautious, supportive, safety-focused.
=================================================================`;
  }
  
  // CRITICAL HEALTH MODE (<25)
  return `
=================================================================
CRITICAL HEALTH MODE: ${percentage}/100 — 🚨 MEDICAL INTERVENTION NEEDED
=================================================================
CRITICAL PARAMETERS: ${topParameters}
MEDICAL EMERGENCIES: ${criticalIssues}
MEDICAL CONDITIONS: ${diseases.length > 0 ? diseases.join(', ') : 'None'}
ALLERGIES: ${allergies.length > 0 ? allergies.join(', ') : 'None'}

🎯 EXCLUSIVE STRATEGY:
CRITICAL health status requiring immediate medical intervention.
This is beyond lifestyle modification - medical treatment essential.

NUTRITION STRATEGY — CLINICAL INTERVENTION:
${hasDiabetes ? '- DIABETES EMERGENCY: Immediate medical care, possible hospitalization' : ''}
${hasHeartDisease ? '- HEART EMERGENCY: Immediate cardiac care, possible hospitalization' : ''}
${hasHypertension ? '- BP EMERGENCY: Immediate medical attention, medication adjustment' : ''}
${hasPCOS ? '- PCOS EMERGENCY: Immediate endocrine intervention, fertility preservation' : ''}
${hasThyroid ? '- THYROID EMERGENCY: Immediate thyroid care, hormone crisis management' : ''}
${hasNutAllergy ? '- ALLERGY EMERGENCY: EpiPen availability, emergency protocols' : ''}
${hasLactoseIntolerance ? '- NUTRITION EMERGENCY: Deficiency correction, medical nutrition therapy' : ''}
${hasGlutenAllergy ? '- CELIAC EMERGENCY: Healing protocol, malnutrition prevention' : ''}
- SEEK IMMEDIATE MEDICAL ATTENTION
- This requires hospitalization or emergency medical care
- Nutrition only supportive to medical treatment
- Focus on stabilization, not optimization

EXERCISE STRATEGY — MEDICAL REST:
- COMPLETE REST until medically cleared
- Only activities medically approved
- Focus on basic activities of daily living
- No exercise without explicit medical approval

AI PROMPT FOCUS:
"Generate emergency medical support information with immediate action steps, emergency contacts, and safety protocols. This requires medical intervention, not lifestyle changes."

TONE: Urgent, medical, safety-focused, directive.
=================================================================
`;
}