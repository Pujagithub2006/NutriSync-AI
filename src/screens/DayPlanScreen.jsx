// ─── DayPlanScreen.jsx ────────────────────────────────────────
import { useState } from 'react';
import { storage } from '../utils/storage';

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:6, padding:'12px 0', alignItems:'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:8, height:8, borderRadius:'50%', background:'var(--accent)',
          animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,
        }} />
      ))}
      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:6 }}>Building your full day plan…</span>
    </div>
  );
}

function calcVitalsScore(meal, vitals, profile) {
  let score = 60;
  const reasons = [], warnings = [];
  const combined = ((meal.key_nutrient || '') + ' ' + (meal.reason || '')).toLowerCase();

  if (vitals.spo2 < 96) {
    if (combined.includes('iron') || combined.includes('spinach') || combined.includes('lentil')) { score += 10; reasons.push('🩸 Iron for SpO₂'); }
    else { score -= 5; warnings.push('⚠️ Needs iron'); }
  }
  if (vitals.stress === 'High') {
    if (combined.includes('magnesium') || combined.includes('nuts') || combined.includes('seeds')) { score += 10; reasons.push('🧘 Mg for stress'); }
    else { score -= 5; }
  }
  if (vitals.hr > 85) {
    if (combined.includes('electrolyte') || combined.includes('potassium') || combined.includes('coconut')) { score += 10; reasons.push('⚡ Electrolytes'); }
  }
  const isDiabetic = profile?.diseases?.some(d => d.toLowerCase().includes('diabetes'));
  if (isDiabetic && meal.gi === 'Low') { score += 10; reasons.push('✅ Low GI'); }
  if (isDiabetic && meal.gi === 'High') { score -= 10; warnings.push('⚠️ High GI'); }
  if (profile?.goal === 'weightloss' && meal.kcal < 450) { score += 10; reasons.push('🔥 Low cal'); }
  if (profile?.goal === 'muscle' && meal.protein > 25) { score += 10; reasons.push('💪 High protein'); }
  if (vitals.hrv > 55) { score += 5; reasons.push('✅ HRV bonus'); }

  return { score: Math.min(100, Math.max(0, score)), reasons, warnings };
}

const MEAL_ICONS = { Breakfast:'🌅', Lunch:'☀️', Snack:'🍎', Dinner:'🌙' };

export default function DayPlanScreen({ vitals }) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan]       = useState(null);
  const [error, setError]     = useState('');
  const [logged, setLogged]   = useState({});

  const profile = storage.getProfile();

  async function fetchFoodImage(mealName) {
    try {
      const res  = await fetch(`http://localhost:5000/api/food-image?query=${encodeURIComponent(mealName)}`);
      const data = await res.json();
      return data.image || null;
    } catch { return null; }
  }

  async function generate() {
    setLoading(true); setPlan(null); setError(''); setLogged({});

    const bmi      = profile?.bmi || 'Unknown';
    const diseases = profile?.diseases?.filter(d => d !== 'None').join(', ') || 'None';
    const allergies= profile?.allergies?.join(', ') || 'None';
    const diet     = profile?.vegan ? 'Vegan' : profile?.vegetarian ? 'Vegetarian' : 'Non-vegetarian';
    const kcalGoal = profile?.goal === 'weightloss' ? 1600 : profile?.goal === 'muscle' ? 2800 : 2200;
    const isRecoveryMode = vitals.hrv < 35 || vitals.stress === 'High';

    const prompt = `You are NutriSync AI, an expert clinical nutritionist and lifestyle medicine specialist.

=================================================================
USER PROFILE
=================================================================
Name: ${profile?.name || 'User'}, Age: ${profile?.age}, Gender: ${profile?.gender}
Weight: ${profile?.weight}kg, Height: ${profile?.height}cm, BMI: ${bmi}
Location: ${profile?.state || 'Maharashtra'}, ${profile?.country || 'India'}
Diet: ${diet} | Allergies: ${allergies} | Medical Conditions: ${diseases}
Goal: ${profile?.goal} | Activity: ${profile?.activity}
Daily Calorie Target: ${kcalGoal} kcal

=================================================================
MORNING VITALS (basis for full day plan)
=================================================================
❤️ HR: ${vitals.hr} BPM | 🫁 SpO₂: ${vitals.spo2}% | 🧠 HRV: ${vitals.hrv}ms
📊 Stress: ${vitals.stress} | 👣 Steps: ${vitals.steps} | ⚡ Activity: ${vitals.activity}
Mode: ${isRecoveryMode ? 'RECOVERY — anti-inflammatory focus' : 'PERFORMANCE — energy and macros focus'}

=================================================================
TASK: Generate Complete Full Day Plan
=================================================================
Create a FULL DAY nutrition + fitness plan with:
- Breakfast, Lunch, Afternoon Snack, Dinner (1 option each)
- Total calories spread across meals = ${kcalGoal} kcal
- Full day exercise schedule
- Hydration schedule

RULES:
1. NO allergens: ${allergies}
2. Prefer Indian foods (poha, idli, dal, roti, sabzi, etc.)
3. Use simple English names for image search
4. Mention iron/magnesium/electrolytes explicitly in reasons when included
5. ${isRecoveryMode ? 'Anti-inflammatory focus: turmeric, ginger, omega-3s' : 'Performance focus: lean protein, complex carbs'}
6. Total protein should match goal: ${profile?.goal === 'muscle' ? '2g per kg body weight' : '1.2g per kg body weight'}

Return ONLY valid JSON, no markdown:
{
  "day_summary": {
    "total_kcal": 2200,
    "total_protein": 120,
    "total_carbs": 250,
    "total_fat": 65,
    "theme": "One sentence describing today's nutrition theme based on vitals",
    "mode": "Recovery/Performance"
  },
  "meals": [
    {
      "type": "Breakfast",
      "time": "7:30 AM",
      "name": "Meal name",
      "emoji": "🍳",
      "kcal": 450,
      "protein": 25,
      "carbs": 55,
      "fat": 15,
      "gi": "Low",
      "gl": 10,
      "key_nutrient": "Iron, Magnesium",
      "reason": "Why this meal at this time based on morning vitals",
      "ingredients": ["ingredient1", "ingredient2", "ingredient3"]
    },
    { "type": "Lunch", ... },
    { "type": "Snack", ... },
    { "type": "Dinner", ... }
  ],
  "exercise_schedule": [
    {
      "time": "6:30 AM",
      "activity": "Morning Walk",
      "duration": "30 mins",
      "intensity": "Low",
      "calories_burned": 120,
      "reason": "Why this exercise at this time"
    }
  ],
  "hydration_schedule": [
    { "time": "7:00 AM", "amount": "500ml", "tip": "Warm water with lemon to kickstart metabolism" },
    { "time": "10:00 AM", "amount": "300ml", "tip": "Hydrate before mid-morning snack" },
    { "time": "1:00 PM",  "amount": "500ml", "tip": "Hydrate with lunch" },
    { "time": "4:00 PM",  "amount": "300ml", "tip": "Afternoon hydration" },
    { "time": "7:00 PM",  "amount": "300ml", "tip": "Light hydration before dinner" }
  ]
}`;

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ messages:[{ role:'user', content:prompt }] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const text   = data.content?.map(b => b.text || '').join('') || '';
      const clean  = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      // Fetch images for all meals in parallel
      const mealsWithImages = await Promise.all(
        (parsed.meals || []).map(async (meal) => ({
          ...meal,
          foodImage: await fetchFoodImage(meal.name),
        }))
      );
      parsed.meals = mealsWithImages;
      setPlan(parsed);

    } catch (e) {
      setError('AI error: ' + e.message);
    }
    setLoading(false);
  }

  function logMeal(meal) {
    const user = storage.getUser();
    storage.addMeal(user?.uid, { ...meal, mealType: meal.type });
    setLogged(l => ({ ...l, [meal.name]: true }));
  }

  function logAllMeals() {
    if (!plan?.meals) return;
    const user = storage.getUser();
    plan.meals.forEach(meal => {
      if (!logged[meal.name]) {
        storage.addMeal(user?.uid, { ...meal, mealType: meal.type });
      }
    });
    const all = {};
    plan.meals.forEach(m => { all[m.name] = true; });
    setLogged(all);
  }

  const giColor = (v) => v === 'Low' ? 'var(--accent2)' : v === 'Medium' ? 'var(--orange)' : 'var(--red)';
  const intensityColor = (v) => v === 'Low' ? 'var(--accent2)' : v === 'Moderate' ? 'var(--accent)' : 'var(--red)';

  const allLogged = plan?.meals?.every(m => logged[m.name]);

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding:'48px 24px 0' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(182,245,66,0.1)', border:'1px solid rgba(182,245,66,0.2)', borderRadius:100, padding:'5px 12px', marginBottom:12 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block', animation:'pulseDot 1.4s infinite' }} />
          <span style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Full Day Plan</span>
        </div>
        <div style={{ fontSize:24, fontFamily:'var(--font-head)', fontWeight:800, lineHeight:1.15 }}>
          Your complete<br /><span style={{ color:'var(--accent)' }}>day, automated 🗓️</span>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, fontWeight:300 }}>
          Breakfast → Lunch → Snack → Dinner + Exercise + Hydration
        </div>
      </div>

      {/* Vitals strip */}
      <div style={{ margin:'14px 24px 0', padding:'12px 14px', background:'var(--surface)', borderRadius:16, border:'1px solid var(--card-border)' }}>
        <div style={{ fontSize:9, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Planning based on your vitals</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {[
            { label:`❤️ ${vitals.hr} BPM`, hi:true },
            { label:`🫁 ${vitals.spo2}%`, hi:true },
            { label:`🧬 HRV ${vitals.hrv}ms` },
            { label:`🧠 ${vitals.stress} stress`, hi: vitals.stress === 'High' },
            { label:`⚡ ${vitals.activity}` },
          ].map(c => (
            <div key={c.label} className={`pill ${c.hi ? 'selected' : ''}`} style={{ cursor:'default' }}>{c.label}</div>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div style={{ margin:'14px 24px 0' }}>
        <button className="btn-primary" onClick={generate} disabled={loading}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          {loading ? <><div className="spinner" /> Building your day plan…</> : '🗓️ Generate Full Day Plan'}
        </button>
      </div>

      {loading && <div style={{ padding:'0 24px' }}><TypingDots /></div>}

      {error && (
        <div style={{ margin:'14px 24px 0', background:'rgba(255,94,94,0.08)', border:'1px solid rgba(255,94,94,0.25)', borderRadius:14, padding:'12px 16px', fontSize:12, color:'var(--red)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Day Summary card ── */}
      {plan?.day_summary && (
        <div style={{ margin:'14px 24px 0' }} className="animate-up">
          <div style={{ background:'linear-gradient(135deg, rgba(182,245,66,0.12), rgba(76,255,176,0.08))', borderRadius:20, border:'1px solid rgba(182,245,66,0.2)', padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                  Today's Plan
                </div>
                <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.5, maxWidth:'80%' }}>{plan.day_summary.theme}</div>
              </div>
              <div style={{ background: plan.day_summary.mode === 'Recovery' ? 'rgba(76,255,176,0.15)' : 'rgba(182,245,66,0.15)', borderRadius:10, padding:'4px 10px' }}>
                <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color: plan.day_summary.mode === 'Recovery' ? 'var(--accent2)' : 'var(--accent)' }}>
                  {plan.day_summary.mode === 'Recovery' ? '🛡️ Recovery' : '⚡ Performance'}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { label:'Calories', val:`${plan.day_summary.total_kcal}`, unit:'kcal', color:'var(--accent)' },
                { label:'Protein',  val:`${plan.day_summary.total_protein}g`, color:'var(--accent2)' },
                { label:'Carbs',    val:`${plan.day_summary.total_carbs}g`,   color:'var(--accent)' },
                { label:'Fat',      val:`${plan.day_summary.total_fat}g`,     color:'var(--orange)' },
              ].map(s => (
                <div key={s.label} style={{ flex:1, background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'8px 4px', textAlign:'center' }}>
                  <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                  <div style={{ fontSize:14, fontFamily:'var(--font-head)', fontWeight:800, color:s.color, marginTop:2 }}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* Log all button */}
            {!allLogged && (
              <button onClick={logAllMeals} style={{
                width:'100%', marginTop:12, padding:'11px', borderRadius:14, border:'1px solid rgba(182,245,66,0.3)',
                background:'rgba(182,245,66,0.08)', color:'var(--accent)',
                fontFamily:'var(--font-head)', fontWeight:800, fontSize:12, cursor:'pointer',
              }}>
                + Log All Meals to Diary
              </button>
            )}
            {allLogged && (
              <div style={{ marginTop:12, textAlign:'center', fontSize:12, color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:700 }}>
                ✓ All meals logged to diary!
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Meal cards ── */}
      {plan?.meals?.map((meal, i) => {
        const isLogged = logged[meal.name];
        const { score, reasons, warnings } = calcVitalsScore(meal, vitals, profile);
        const scoreColor = score >= 85 ? 'var(--accent2)' : score >= 70 ? 'var(--accent)' : score >= 50 ? 'var(--orange)' : 'var(--red)';

        return (
          <div key={i} style={{ margin:'12px 24px 0' }} className="animate-up">
            {/* Meal type header */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <span style={{ fontSize:18 }}>{MEAL_ICONS[meal.type] || '🍽️'}</span>
              <div style={{ fontSize:12, fontFamily:'var(--font-head)', fontWeight:800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{meal.type}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:600 }}>{meal.time}</div>
              <div style={{ marginLeft:'auto', fontSize:12, fontFamily:'var(--font-head)', fontWeight:800, color:scoreColor }}>{score}/100</div>
            </div>

            <div style={{ background:'var(--surface)', borderRadius:20, border:`1px solid ${isLogged ? 'rgba(182,245,66,0.4)' : 'var(--card-border)'}`, overflow:'hidden', opacity: isLogged ? 0.75 : 1 }}>
              {/* Food image */}
              {meal.foodImage ? (
                <div style={{ width:'100%', height:130, position:'relative', overflow:'hidden' }}>
                  <img src={meal.foodImage} alt={meal.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(17,25,21,0.9) 0%, transparent 60%)' }} />
                  <div style={{ position:'absolute', bottom:10, left:14 }}>
                    <div style={{ fontSize:16, fontFamily:'var(--font-head)', fontWeight:800, color:'#fff' }}>{meal.name}</div>
                  </div>
                  <div style={{ position:'absolute', top:8, right:8, fontSize:22, background:'rgba(17,25,21,0.7)', borderRadius:8, padding:'3px 7px', backdropFilter:'blur(8px)' }}>{meal.emoji}</div>
                  {/* Score badge */}
                  <div style={{ position:'absolute', top:8, left:10, background:'rgba(17,25,21,0.8)', borderRadius:8, padding:'3px 8px', backdropFilter:'blur(8px)' }}>
                    <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:800, color:scoreColor }}>{score}/100</div>
                  </div>
                </div>
              ) : (
                <div style={{ padding:'14px 16px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontSize:15, fontFamily:'var(--font-head)', fontWeight:800 }}>{meal.name}</div>
                  <span style={{ fontSize:28 }}>{meal.emoji}</span>
                </div>
              )}

              <div style={{ padding:'12px 16px 14px' }}>
                {/* Score bar */}
                <div style={{ marginBottom:10 }}>
                  <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', marginBottom:6 }}>
                    <div style={{ height:'100%', width:`${score}%`, background:`linear-gradient(90deg, ${scoreColor}, ${scoreColor}88)`, borderRadius:4 }} />
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                    {reasons.map((r, ri) => (
                      <div key={ri} style={{ fontSize:8, padding:'2px 7px', borderRadius:100, background:'rgba(182,245,66,0.08)', border:'1px solid rgba(182,245,66,0.15)', color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:600 }}>{r}</div>
                    ))}
                    {warnings.map((w, wi) => (
                      <div key={wi} style={{ fontSize:8, padding:'2px 7px', borderRadius:100, background:'rgba(255,179,71,0.08)', border:'1px solid rgba(255,179,71,0.2)', color:'var(--orange)', fontFamily:'var(--font-head)', fontWeight:600 }}>{w}</div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5, marginBottom:10, background:'var(--surface2)', borderRadius:8, padding:'8px 10px', borderLeft:'2px solid var(--accent)' }}>
                  💡 {meal.reason}
                </div>

                {/* Macros */}
                <div style={{ display:'flex', gap:5, marginBottom:10 }}>
                  {[
                    { label:'Cal',     val:meal.kcal,          color:'var(--accent)'  },
                    { label:'Protein', val:`${meal.protein}g`, color:'var(--accent2)' },
                    { label:'Carbs',   val:`${meal.carbs}g`,   color:'var(--accent)'  },
                    { label:'Fat',     val:`${meal.fat}g`,     color:'var(--orange)'  },
                  ].map(m => (
                    <div key={m.label} style={{ flex:1, background:'var(--surface2)', borderRadius:8, padding:'6px 4px', textAlign:'center' }}>
                      <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{m.label}</div>
                      <div style={{ fontSize:12, fontFamily:'var(--font-head)', fontWeight:800, color:m.color, marginTop:1 }}>{m.val}</div>
                    </div>
                  ))}
                  {meal.gi && (
                    <div style={{ flex:1, background:'var(--surface2)', borderRadius:8, padding:'6px 4px', textAlign:'center' }}>
                      <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>GI</div>
                      <div style={{ fontSize:12, fontFamily:'var(--font-head)', fontWeight:800, color:giColor(meal.gi), marginTop:1 }}>{meal.gi}</div>
                    </div>
                  )}
                </div>

                {/* Ingredients */}
                {meal.ingredients && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:10 }}>
                    {meal.ingredients.map(ing => (
                      <div key={ing} style={{ fontSize:9, background:'var(--surface2)', border:'1px solid var(--card-border)', borderRadius:100, padding:'2px 8px', color:'var(--text-muted)' }}>{ing}</div>
                    ))}
                  </div>
                )}

                {/* Log button */}
                <button onClick={() => !isLogged && logMeal(meal)} disabled={isLogged} style={{
                  width:'100%', padding:'10px', borderRadius:12, border:'none',
                  background: isLogged ? 'rgba(182,245,66,0.1)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  color: isLogged ? 'var(--accent)' : 'var(--bg)',
                  fontFamily:'var(--font-head)', fontWeight:800, fontSize:12,
                  cursor: isLogged ? 'default' : 'pointer', transition:'all 0.2s',
                }}>
                  {isLogged ? '✓ Logged' : `+ Log ${meal.type}`}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Exercise schedule ── */}
      {plan?.exercise_schedule?.length > 0 && (
        <div style={{ margin:'16px 24px 0' }}>
          <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>💪 Exercise Schedule</div>
          {plan.exercise_schedule.map((ex, i) => (
            <div key={i} className="animate-up" style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--card-border)', padding:'12px 16px', marginBottom:8, display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{ width:48, textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent)' }}>{ex.time}</div>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                  <div style={{ fontSize:13, fontFamily:'var(--font-head)', fontWeight:800 }}>{ex.activity}</div>
                  <div style={{ display:'flex', gap:5 }}>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:100, background:'rgba(182,245,66,0.1)', color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:700 }}>{ex.duration}</span>
                    <span style={{ fontSize:9, padding:'2px 7px', borderRadius:100, background:'var(--surface2)', color:intensityColor(ex.intensity), fontFamily:'var(--font-head)', fontWeight:700, border:'1px solid var(--card-border)' }}>{ex.intensity}</span>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.4 }}>{ex.reason}</div>
                {ex.calories_burned && <div style={{ fontSize:10, color:'var(--orange)', fontFamily:'var(--font-head)', fontWeight:700, marginTop:4 }}>🔥 ~{ex.calories_burned} kcal burned</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Hydration schedule ── */}
      {plan?.hydration_schedule?.length > 0 && (
        <div style={{ margin:'16px 24px 0' }}>
          <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>💧 Hydration Schedule</div>
          <div style={{ background:'var(--surface)', borderRadius:16, border:'1px solid var(--card-border)', overflow:'hidden' }}>
            {plan.hydration_schedule.map((h, i) => (
              <div key={i} style={{ display:'flex', gap:12, alignItems:'center', padding:'11px 16px', borderBottom: i < plan.hydration_schedule.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                <div style={{ width:52, fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent2)', flexShrink:0 }}>{h.time}</div>
                <div style={{ fontSize:22 }}>💧</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent2)' }}>{h.amount}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{h.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height:24 }} />
    </div>
  );
}