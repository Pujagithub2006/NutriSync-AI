// ─── AIScreen.jsx ─────────────────────────────────────────────
import { useState } from 'react';
import { storage } from '../utils/storage';
import { calculateHealthScore, getHealthTier, getTierPrompt, calculateGlycemicImpact } from '../utils/healthScore';
import { calculateHealthScoreEnhanced } from '../services/healthScoreEnhanced';

const MEAL_TIMES = ['Breakfast','Lunch','Dinner','Snack'];
const EMOJIS = ['🥗','🍱','🥙','🫙','🍳','🥘','🫕','🥣','🍛','🥩','🐟','🥦'];

function getMealTime() {
  const h = new Date().getHours();
  if (h<10) return 'Breakfast';
  if (h<14) return 'Lunch';
  if (h<18) return 'Snack';
  return 'Dinner';
}

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:6, padding:'12px 0', alignItems:'center' }}>
      {[0,1,2].map(i=>(
        <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }}/>
      ))}
      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:6 }}>NutriSync AI is thinking…</span>
    </div>
  );
}

// ── Health Score Card ─────────────────────────────────────────
function HealthScoreCard({ healthData }) {
  const [expanded, setExpanded] = useState(false);
  const { percentage, tier, breakdown } = healthData;
  return (
    <div style={{ margin:'14px 24px 0' }} className="animate-up">
      <div style={{ background:`linear-gradient(135deg,${tier.color}18,${tier.color}08)`, borderRadius:20, border:`1px solid ${tier.color}40`, padding:18 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div>
            <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Health Score · 10 Parameters</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <div style={{ fontSize:42, fontFamily:'var(--font-head)', fontWeight:800, color:tier.color, lineHeight:1 }}>{percentage}</div>
              <div style={{ fontSize:16, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:700 }}>/100</div>
            </div>
            <div style={{ fontSize:12, fontFamily:'var(--font-head)', fontWeight:700, color:tier.color, marginTop:2 }}>{tier.icon} {tier.label}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{tier.description}</div>
          </div>
          <div style={{ position:'relative', width:80, height:80 }}>
            <svg width="80" height="80" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
              <circle cx="40" cy="40" r="32" fill="none" stroke={tier.color} strokeWidth="7"
                strokeDasharray={`${2*Math.PI*32}`} strokeDashoffset={`${2*Math.PI*32*(1-percentage/100)}`}
                strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s ease' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{tier.icon}</div>
          </div>
        </div>
        <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', marginBottom:12 }}>
          <div style={{ height:'100%', width:`${percentage}%`, background:`linear-gradient(90deg,${tier.color},${tier.color}99)`, borderRadius:4, transition:'width 1.2s ease' }}/>
        </div>
        {/* Mini bars top 5 */}
        <div style={{ display:'flex', gap:4, marginBottom:10 }}>
          {breakdown.slice(0,5).map(p=>(
            <div key={p.key} style={{ flex:1, textAlign:'center' }}>
              <div style={{ height:28, background:'rgba(255,255,255,0.04)', borderRadius:6, overflow:'hidden', display:'flex', alignItems:'flex-end', marginBottom:3 }}>
                <div style={{ width:'100%', height:`${p.score}%`, background:p.score>=70?`${tier.color}99`:p.score>=50?'rgba(255,179,71,0.6)':'rgba(255,94,94,0.6)', transition:'height 1s ease' }}/>
              </div>
              <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:600, lineHeight:1.2 }}>{p.label.split(' ')[0]}</div>
              <div style={{ fontSize:8, fontFamily:'var(--font-head)', fontWeight:800, color:p.score>=70?tier.color:p.score>=50?'var(--orange)':'var(--red)' }}>{p.score}</div>
            </div>
          ))}
        </div>
        <div onClick={()=>setExpanded(!expanded)} style={{ display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', padding:'4px 0' }}>
          <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)' }}>
            {expanded?'Hide breakdown ▲':'View all 10 parameters ▼'}
          </div>
        </div>
        {expanded && (
          <div style={{ marginTop:12, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
            {breakdown.map(p=>(
              <div key={p.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:130, fontSize:10, fontFamily:'var(--font-head)', fontWeight:600, color:'var(--text-muted)', flexShrink:0 }}>{p.label}</div>
                <div style={{ flex:1, height:4, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${p.score}%`, background:p.score>=70?tier.color:p.score>=50?'#ffb347':'#ff5e5e', borderRadius:4, transition:'width 0.8s ease' }}/>
                </div>
                <div style={{ width:28, fontSize:10, fontFamily:'var(--font-head)', fontWeight:800, color:p.score>=70?tier.color:p.score>=50?'var(--orange)':'var(--red)', textAlign:'right' }}>{p.score}</div>
                <div style={{ width:36, fontSize:9, color:'var(--text-muted)', textAlign:'right' }}>w:{p.weight}</div>
              </div>
            ))}
            <div style={{ marginTop:8, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:10, fontSize:10, color:'var(--text-muted)' }}>
              Formula: Σ(param_score × weight) / 100 · Weights redistribute to always sum to 100
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Glycemic Impact Card ──────────────────────────────────────
function GlycemicImpactCard({ impact }) {
  const [expanded, setExpanded] = useState(false);
  const { score, label, color, icon, breakdown, insight } = impact;

  return (
    <div style={{ marginBottom:12, background:'var(--surface2)', borderRadius:16, border:`2px solid ${color}40`, padding:'13px 14px' }}>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div>
          <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>
            Glycemic Impact
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:16 }}>{icon}</span>
            <span style={{ fontSize:14, fontFamily:'var(--font-head)', fontWeight:800, color }}>{label}</span>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:32, fontFamily:'var(--font-head)', fontWeight:800, color, lineHeight:1 }}>{score}</div>
          <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'var(--font-head)' }}>/100</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height:6, background:'rgba(255,255,255,0.06)', borderRadius:4, overflow:'hidden', marginBottom:8 }}>
        <div style={{ height:'100%', width:`${score}%`, background:`linear-gradient(90deg,${color},${color}88)`, borderRadius:4, transition:'width 1s ease' }}/>
      </div>

      {/* Insight */}
      <div style={{ fontSize:11, color:'var(--text-muted)', lineHeight:1.5, marginBottom:8, padding:'8px 10px', background:'rgba(255,255,255,0.03)', borderRadius:8, borderLeft:`2px solid ${color}` }}>
        {insight}
      </div>

      {/* Expand factors */}
      <div onClick={()=>setExpanded(!expanded)} style={{ cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
        <div style={{ fontSize:9, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)' }}>
          {expanded?'Hide factors ▲':`${breakdown.length} scoring factors ▼`}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:5 }}>
          {breakdown.map((f,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'6px 8px', background:'rgba(255,255,255,0.02)', borderRadius:8 }}>
              <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:800, color:f.positive?'var(--accent2)':'var(--red)', minWidth:30, flexShrink:0 }}>{f.value}</div>
              <div>
                <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text)' }}>{f.label}</div>
                <div style={{ fontSize:9, color:'var(--text-muted)', marginTop:1 }}>{f.reason}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function AIScreen({ vitals }) {
  const [mealType, setMealType]     = useState(getMealTime());
  const [loading, setLoading]       = useState(false);
  const [meals, setMeals]           = useState([]);
  const [exercise, setExercise]     = useState(null);
  const [hydration, setHydration]   = useState(null);
  const [error, setError]           = useState('');
  const [logged, setLogged]         = useState([]);
  const [healthData, setHealthData] = useState(null);

  const profile    = storage.getProfile();
  const eatenToday = storage.getEatenToday();
  const diary      = storage.getDiary();

  async function fetchFoodImage(name) {
    try {
      const res  = await fetch(`http://localhost:5000/api/food-image?query=${encodeURIComponent(name)}`);
      const data = await res.json();
      return data.image||null;
    } catch { return null; }
  }

  async function generate() {
    setLoading(true); setMeals([]); setExercise(null); setHydration(null); setError('');

    const bmi      = profile?.bmi||'Unknown';
    const diseases = profile?.diseases?.filter(d=>d!=='None').join(', ')||'None';
    const allergies= profile?.allergies?.join(', ')||'None';
    const diet     = profile?.vegan?'Vegan':profile?.vegetarian?'Vegetarian':'Non-vegetarian';

    // 10-parameter health score (enhanced with Python backend)
    const { percentage, breakdown, totalWeight, enhanced, state, reasons } = await calculateHealthScoreEnhanced(profile, vitals, diary);
    const tier     = getHealthTier(percentage);
    const tierText = getTierPrompt(tier.tier, percentage, profile, vitals, breakdown);
    setHealthData({ percentage, tier, breakdown, totalWeight });

    const todayKcal     = diary.reduce((a,m)=>a+(m.kcal||0),0);
    const kcalGoal      = profile?.goal==='weightloss'?1600:profile?.goal==='muscle'?2800:2200;
    const remainingKcal = Math.max(0, kcalGoal-todayKcal);
    const hour          = new Date().getHours();
    const timeOfDay     = hour<10?'morning':hour<14?'midday':hour<18?'afternoon':'evening';

    const prompt = `You are NutriSync AI, an expert clinical nutritionist and lifestyle medicine specialist.

${tierText}

=================================================================
USER PROFILE
=================================================================
Name: ${profile?.name||'User'}, Age: ${profile?.age}, Gender: ${profile?.gender}
Weight: ${profile?.weight}kg, Height: ${profile?.height}cm, BMI: ${bmi}
Location: ${profile?.state||'Maharashtra'}, ${profile?.country||'India'}
Diet: ${diet} | Allergies: ${allergies} | Conditions: ${diseases}
Goal: ${profile?.goal} | Activity: ${profile?.activity}

=================================================================
REAL-TIME PHYSIOLOGICAL DATA
=================================================================
❤️ HR: ${vitals.hr} BPM | 🫁 SpO₂: ${vitals.spo2}% | 🧠 HRV: ${vitals.hrv}ms
📊 Stress: ${vitals.stress} | 👣 Steps: ${vitals.steps} | ⚡ Activity: ${vitals.activity}
Time: ${timeOfDay} | Meal: ${mealType} | Remaining calories: ${remainingKcal} kcal

=================================================================
GLYCEMIC INTELLIGENCE REQUIREMENTS
=================================================================
For each meal you MUST provide accurate:
- gi: "Low" (<55), "Medium" (55-69), or "High" (70+) based on main ingredients
- gl: Glycemic Load = (GI value × net carbs) / 100 (provide numeric value)
- ingredients: list all main ingredients (used for glycemic impact analysis)
- key_nutrient: mention fiber, protein, anti-inflammatory properties if present

Two meals can have identical calories but completely different glycemic impact.
Prioritize meals with:
${profile?.diseases?.some(d=>d.toLowerCase().includes('diabetes'))?'- LOW GI and LOW GL (critical for diabetes management)':''}
${vitals.stress==='High'?'- LOW GI (cortisol already elevates blood sugar)':''}
${profile?.goal==='weightloss'?'- LOW GI/GL (keeps insulin low = promotes fat burning)':''}
${vitals.hr>85?'- ANTI-INFLAMMATORY ingredients (reduces cardiovascular stress)':''}

=================================================================
TOP PARAMETERS NEEDING ATTENTION
=================================================================
${breakdown.filter(b=>b.score<60).slice(0,3).map(b=>`- ${b.label}: ${b.score}/100 (weight:${b.weight})`).join('\n')||'All parameters in good range'}

=================================================================
ALREADY EATEN TODAY — DO NOT REPEAT
=================================================================
${eatenToday.length>0?eatenToday.join(', '):'Nothing yet'}

=================================================================
RULES
=================================================================
1. NEVER include allergens: ${allergies}
2. PREFER Indian foods with accurate GI/GL values
3. Use SIMPLE English names for image search
4. Mention fiber/protein/anti-inflammatory in reason when present
5. Ensure gl is a NUMBER not a string

Return ONLY valid JSON, no markdown:
{
  "meal_options": [
    {
      "name": "Meal name",
      "emoji": "single emoji",
      "kcal": 450,
      "protein": 25,
      "carbs": 55,
      "fat": 15,
      "gi": "Low",
      "gl": 10,
      "key_nutrient": "Iron, Fiber, Magnesium",
      "best_time": "Have within 30 mins",
      "reason": "2-3 sentences referencing glycemic impact, vitals (HR:${vitals.hr}, SpO₂:${vitals.spo2}) and health tier ${tier.tier}",
      "ingredients": ["ingredient1","ingredient2","ingredient3","ingredient4"]
    }
  ],
  "exercise": {
    "type": "Exercise type",
    "duration": "X minutes",
    "intensity": "Low/Moderate/High",
    "description": "Specific plan",
    "best_time": "Time of day",
    "reason": "Why ideal for health score ${percentage}/100"
  },
  "hydration": {
    "target": "X liters",
    "reminder": "Tip",
    "electrolytes": "Yes/No with reason"
  }
}`;

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages:[{role:'user',content:prompt}] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const text   = data.content?.map(b=>b.text||'').join('')||'';
      const clean  = text.replace(/```json|```/g,'').trim();
      const parsed = JSON.parse(clean);
      const mealList = parsed.meal_options||(Array.isArray(parsed)?parsed:[]);

      const mealsWithImages = await Promise.all(
        mealList.map(async meal=>({ ...meal, foodImage:await fetchFoodImage(meal.name) }))
      );
      setMeals(mealsWithImages);
      if (parsed.exercise)  setExercise(parsed.exercise);
      if (parsed.hydration) setHydration(parsed.hydration);
    } catch(e) { setError('AI error: '+e.message); }
    setLoading(false);
  }

  function logMeal(meal) {
    const user = storage.getUser();
    storage.addMeal(user?.uid, {...meal, mealType});
    setLogged(l=>[...l,meal.name]);
  }

  const giColor        = v => v==='Low'?'var(--accent2)':v==='Medium'?'var(--orange)':'var(--red)';
  const glColor        = v => v<10?'var(--accent2)':v<20?'var(--orange)':'var(--red)';
  const intensityColor = v => v==='Low'?'var(--accent2)':v==='Moderate'?'var(--accent)':'var(--red)';

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding:'48px 24px 0' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(182,245,66,0.1)', border:'1px solid rgba(182,245,66,0.2)', borderRadius:100, padding:'5px 12px', marginBottom:12 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block', animation:'pulseDot 1.4s infinite' }}/>
          <span style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.08em' }}>AI Nutritionist</span>
        </div>
        <div style={{ fontSize:24, fontFamily:'var(--font-head)', fontWeight:800, lineHeight:1.15 }}>
          Meals made for<br/><span style={{ color:'var(--accent)' }}>your body, right now</span>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>
          10-parameter health score + glycemic impact analysis
        </div>
      </div>

      {/* Live vitals */}
      <div style={{ margin:'14px 24px 0', padding:'12px 14px', background:'var(--surface)', borderRadius:16, border:'1px solid var(--card-border)' }}>
        <div style={{ fontSize:9, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Live Bio-Context</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {[
            {label:`❤️ ${vitals.hr} BPM`,hi:true},
            {label:`🫁 SpO₂ ${vitals.spo2}%`,hi:true},
            {label:`👟 ${vitals.steps.toLocaleString()} steps`},
            {label:`🧠 ${vitals.stress} stress`,hi:vitals.stress==='High'},
            {label:`🧬 HRV ${vitals.hrv}ms`},
            {label:`⚡ ${vitals.activity}`},
          ].map(c=>(
            <div key={c.label} className={`pill ${c.hi?'selected':''}`} style={{cursor:'default'}}>{c.label}</div>
          ))}
        </div>
      </div>

      {/* Alert banners */}
      {vitals.hr>90&&<div style={{margin:'10px 24px 0',padding:'10px 14px',background:'rgba(255,179,71,0.08)',border:'1px solid rgba(255,179,71,0.25)',borderRadius:12,fontSize:12,color:'var(--orange)'}}>⚠️ Elevated HR — low GI meals recommended</div>}
      {vitals.spo2<96&&<div style={{margin:'10px 24px 0',padding:'10px 14px',background:'rgba(255,94,94,0.08)',border:'1px solid rgba(255,94,94,0.25)',borderRadius:12,fontSize:12,color:'var(--red)'}}>🩸 Low SpO₂ — iron-rich foods prioritised</div>}
      {vitals.stress==='High'&&<div style={{margin:'10px 24px 0',padding:'10px 14px',background:'rgba(76,255,176,0.08)',border:'1px solid rgba(76,255,176,0.25)',borderRadius:12,fontSize:12,color:'var(--accent2)'}}>🧘 High stress — low GI prevents cortisol-glucose double spike</div>}

      {/* Meal selector */}
      <div style={{ margin:'14px 24px 0', display:'flex', gap:8 }}>
        {MEAL_TIMES.map(t=>(
          <div key={t} onClick={()=>{setMealType(t);setMeals([]);setExercise(null);setHydration(null);}} style={{
            flex:1,padding:'10px 4px',borderRadius:14,textAlign:'center',
            border:`1px solid ${mealType===t?'rgba(182,245,66,0.5)':'var(--card-border)'}`,
            background:mealType===t?'rgba(182,245,66,0.1)':'var(--surface)',
            color:mealType===t?'var(--accent)':'var(--text-muted)',
            fontFamily:'var(--font-head)',fontWeight:700,fontSize:10,
            cursor:'pointer',transition:'all 0.2s',textTransform:'uppercase',letterSpacing:'0.04em',
          }}>{t}</div>
        ))}
      </div>

      {/* Generate button */}
      <div style={{ margin:'14px 24px 0' }}>
        <button className="btn-primary" onClick={generate} disabled={loading}
          style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          {loading?<><div className="spinner"/>Analysing 10 parameters…</>:'✦ Generate My Plan'}
        </button>
      </div>

      {loading&&<div style={{padding:'0 24px'}}><TypingDots/></div>}

      {error&&<div style={{margin:'14px 24px 0',background:'rgba(255,94,94,0.08)',border:'1px solid rgba(255,94,94,0.25)',borderRadius:14,padding:'12px 16px',fontSize:12,color:'var(--red)'}}>⚠️ {error}</div>}

      {/* Health Score */}
      {healthData&&<HealthScoreCard healthData={healthData}/>}

      {/* Meals header */}
      {meals.length>0&&(
        <div style={{padding:'16px 24px 8px',fontSize:11,fontFamily:'var(--font-head)',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em'}}>
          🍽️ {mealType} Options · {healthData?.tier?.label}
        </div>
      )}

      {/* Meal cards */}
      {meals.map((meal,i)=>{
        const isLogged = logged.includes(meal.name);
        const impact   = calculateGlycemicImpact(meal, vitals, profile);

        return (
          <div key={i} className="animate-up" style={{
            margin:'0 24px 14px',background:'var(--surface)',borderRadius:20,
            border:`1px solid ${isLogged?'rgba(182,245,66,0.4)':'var(--card-border)'}`,
            overflow:'hidden',animationDelay:`${i*0.08}s`,opacity:isLogged?0.7:1,
          }}>
            {/* Food image */}
            {meal.foodImage?(
              <div style={{width:'100%',height:155,position:'relative',overflow:'hidden'}}>
                <img src={meal.foodImage} alt={meal.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(17,25,21,0.95) 0%,rgba(17,25,21,0.2) 55%,transparent 100%)'}}/>
                <div style={{position:'absolute',bottom:12,left:16,right:60}}>
                  <div style={{fontSize:9,fontFamily:'var(--font-head)',fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>Option {i+1}</div>
                  <div style={{fontSize:17,fontFamily:'var(--font-head)',fontWeight:800,color:'#fff',lineHeight:1.2}}>{meal.name}</div>
                </div>
                {/* Glycemic impact badge on image */}
                <div style={{position:'absolute',top:10,left:12,background:'rgba(17,25,21,0.88)',borderRadius:10,padding:'4px 10px',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:12}}>{impact.icon}</span>
                  <div style={{fontSize:11,fontFamily:'var(--font-head)',fontWeight:800,color:impact.color}}>{impact.score}</div>
                  <div style={{fontSize:8,color:'var(--text-muted)',fontFamily:'var(--font-head)'}}>GI Impact</div>
                </div>
                <div style={{position:'absolute',top:10,right:10,fontSize:26,background:'rgba(17,25,21,0.75)',borderRadius:10,padding:'4px 8px',backdropFilter:'blur(8px)'}}>
                  {meal.emoji||EMOJIS[i%EMOJIS.length]}
                </div>
              </div>
            ):(
              <div style={{padding:'18px 18px 0',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:9,fontFamily:'var(--font-head)',fontWeight:700,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>Option {i+1}</div>
                  <div style={{fontSize:16,fontFamily:'var(--font-head)',fontWeight:800}}>{meal.name}</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2}}>
                  <span style={{fontSize:28}}>{meal.emoji||EMOJIS[i%EMOJIS.length]}</span>
                  <div style={{fontSize:11,fontFamily:'var(--font-head)',fontWeight:800,color:impact.color}}>{impact.icon} {impact.score}/100</div>
                </div>
              </div>
            )}

            <div style={{padding:'12px 18px 18px'}}>

              {/* ── GLYCEMIC IMPACT CARD ── */}
              <GlycemicImpactCard impact={impact}/>

              {/* AI Reason */}
              <div style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.55,marginBottom:12,background:'var(--surface2)',borderRadius:10,padding:'10px 12px',borderLeft:'2px solid var(--accent)'}}>
                💡 {meal.reason}
              </div>

              {/* Key nutrient + timing */}
              {(meal.key_nutrient||meal.best_time)&&(
                <div style={{display:'flex',gap:8,marginBottom:12}}>
                  {meal.key_nutrient&&(
                    <div style={{flex:1,background:'rgba(76,255,176,0.08)',border:'1px solid rgba(76,255,176,0.2)',borderRadius:10,padding:'7px 10px'}}>
                      <div style={{fontSize:7,color:'var(--accent2)',fontFamily:'var(--font-head)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Key Nutrients</div>
                      <div style={{fontSize:11,fontFamily:'var(--font-head)',fontWeight:700,color:'var(--text)',marginTop:2}}>{meal.key_nutrient}</div>
                    </div>
                  )}
                  {meal.best_time&&(
                    <div style={{flex:1,background:'rgba(182,245,66,0.06)',border:'1px solid rgba(182,245,66,0.15)',borderRadius:10,padding:'7px 10px'}}>
                      <div style={{fontSize:7,color:'var(--accent)',fontFamily:'var(--font-head)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>Timing</div>
                      <div style={{fontSize:11,fontFamily:'var(--font-head)',fontWeight:700,color:'var(--text)',marginTop:2}}>{meal.best_time}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Ingredients */}
              {meal.ingredients&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
                  {meal.ingredients.map(ing=>(
                    <div key={ing} style={{fontSize:10,background:'var(--surface2)',border:'1px solid var(--card-border)',borderRadius:100,padding:'3px 9px',color:'var(--text-muted)'}}>{ing}</div>
                  ))}
                </div>
              )}

              {/* Macros + GI + GL */}
              <div style={{display:'flex',gap:5,marginBottom:12}}>
                {[
                  {label:'Cal',    val:meal.kcal,          color:'var(--accent)'},
                  {label:'Protein',val:`${meal.protein}g`, color:'var(--accent2)'},
                  {label:'Carbs',  val:`${meal.carbs}g`,   color:'var(--accent)'},
                  {label:'Fat',    val:`${meal.fat}g`,     color:'var(--orange)'},
                ].map(m=>(
                  <div key={m.label} style={{flex:1,background:'var(--surface2)',borderRadius:10,padding:'8px 4px',textAlign:'center'}}>
                    <div style={{fontSize:7,color:'var(--text-muted)',fontFamily:'var(--font-head)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>{m.label}</div>
                    <div style={{fontSize:13,fontFamily:'var(--font-head)',fontWeight:800,color:m.color,marginTop:2}}>{m.val}</div>
                  </div>
                ))}
                {meal.gi&&(
                  <div style={{flex:1,background:'var(--surface2)',borderRadius:10,padding:'8px 4px',textAlign:'center'}}>
                    <div style={{fontSize:7,color:'var(--text-muted)',fontFamily:'var(--font-head)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>GI</div>
                    <div style={{fontSize:13,fontFamily:'var(--font-head)',fontWeight:800,color:giColor(meal.gi),marginTop:2}}>{meal.gi}</div>
                  </div>
                )}
                {meal.gl&&(
                  <div style={{flex:1,background:'var(--surface2)',borderRadius:10,padding:'8px 4px',textAlign:'center'}}>
                    <div style={{fontSize:7,color:'var(--text-muted)',fontFamily:'var(--font-head)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em'}}>GL</div>
                    <div style={{fontSize:13,fontFamily:'var(--font-head)',fontWeight:800,color:glColor(meal.gl),marginTop:2}}>{meal.gl}</div>
                  </div>
                )}
              </div>

              {/* Log button */}
              <button onClick={()=>!isLogged&&logMeal(meal)} disabled={isLogged} style={{
                width:'100%',padding:'12px',borderRadius:14,border:'none',
                background:isLogged?'rgba(182,245,66,0.1)':'linear-gradient(135deg,var(--accent),var(--accent2))',
                color:isLogged?'var(--accent)':'var(--bg)',
                fontFamily:'var(--font-head)',fontWeight:800,fontSize:13,
                cursor:isLogged?'default':'pointer',transition:'all 0.2s',
              }}>
                {isLogged?'✓ Added to Diary':`+ Log as ${mealType}`}
              </button>
            </div>
          </div>
        );
      })}

      {/* Exercise */}
      {exercise&&(
        <div style={{margin:'4px 24px 12px'}}>
          <div style={{fontSize:11,fontFamily:'var(--font-head)',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',padding:'8px 0 10px'}}>💪 Exercise Recommendation</div>
          <div className="animate-up" style={{background:'var(--surface)',borderRadius:20,border:'1px solid var(--card-border)',padding:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{fontSize:17,fontFamily:'var(--font-head)',fontWeight:800}}>{exercise.type}</div>
                <div style={{display:'flex',gap:6,marginTop:6,flexWrap:'wrap'}}>
                  <span style={{fontSize:10,padding:'3px 10px',borderRadius:100,background:'rgba(182,245,66,0.1)',color:'var(--accent)',fontFamily:'var(--font-head)',fontWeight:700}}>{exercise.duration}</span>
                  <span style={{fontSize:10,padding:'3px 10px',borderRadius:100,background:'var(--surface2)',color:intensityColor(exercise.intensity),fontFamily:'var(--font-head)',fontWeight:700,border:'1px solid var(--card-border)'}}>{exercise.intensity}</span>
                  {exercise.best_time&&<span style={{fontSize:10,padding:'3px 10px',borderRadius:100,background:'var(--surface2)',color:'var(--text-muted)',fontFamily:'var(--font-head)',fontWeight:600,border:'1px solid var(--card-border)'}}>{exercise.best_time}</span>}
                </div>
              </div>
              <span style={{fontSize:32}}>🏃</span>
            </div>
            <div style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.55,marginBottom:10,background:'var(--surface2)',borderRadius:10,padding:'10px 12px',borderLeft:'2px solid var(--accent2)'}}>
              💡 {exercise.reason}
            </div>
            {exercise.description&&<div style={{fontSize:12,color:'var(--text-muted)',lineHeight:1.6}}>{exercise.description}</div>}
          </div>
        </div>
      )}

      {/* Hydration */}
      {hydration&&(
        <div style={{margin:'0 24px 12px'}}>
          <div style={{fontSize:11,fontFamily:'var(--font-head)',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.1em',padding:'8px 0 10px'}}>💧 Hydration Guide</div>
          <div className="animate-up" style={{background:'var(--surface)',borderRadius:20,border:'1px solid var(--card-border)',padding:18,display:'flex',gap:14,alignItems:'center'}}>
            <div style={{fontSize:40}}>💧</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:18,color:'var(--accent2)'}}>{hydration.target}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:4,lineHeight:1.5}}>{hydration.reminder}</div>
              {hydration.electrolytes&&hydration.electrolytes!=='No'&&(
                <div style={{marginTop:6,fontSize:11,color:'var(--orange)',fontFamily:'var(--font-head)',fontWeight:600}}>⚡ {hydration.electrolytes}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{height:20}}/>
    </div>
  );
}