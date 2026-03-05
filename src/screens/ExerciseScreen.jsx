// ─── ExerciseScreen.jsx ───────────────────────────────────────
import { useState } from 'react';
import { storage } from '../utils/storage';
import { vitalsContext } from '../utils/vitals';

function TypingDots() {
  return (
    <div style={{ display:'flex', gap:6, padding:'12px 0', alignItems:'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:8, height:8, borderRadius:'50%', background:'var(--accent)',
          animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`,
        }} />
      ))}
      <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:6 }}>Analysing your body data…</span>
    </div>
  );
}

const INTENSITY = ['Light','Moderate','Intense'];

export default function ExerciseScreen({ vitals }) {
  const [intensity, setIntensity] = useState('Moderate');
  const [loading, setLoading]     = useState(false);
  const [exercises, setExercises] = useState([]);
  const [error, setError]         = useState('');
  const [done, setDone]           = useState([]);

  const profile = storage.getProfile();

  async function generate() {
    setLoading(true); setExercises([]); setError('');

    const diseases = profile?.diseases?.filter(d => d !== 'None').join(', ') || 'None';
    const diary    = storage.getDiary();
    const todayKcal = diary.reduce((a, m) => a + (m.kcal || 0), 0);

    const prompt = `You are NutriSync AI's personal fitness coach.

USER PROFILE:
- Age: ${profile?.age}, Gender: ${profile?.gender}
- Weight: ${profile?.weight}kg, Height: ${profile?.height}cm, BMI: ${profile?.bmi}
- Fitness Goal: ${profile?.goal}
- Activity Level: ${profile?.activity}
- Medical Conditions: ${diseases}

LIVE PHYSIOLOGICAL DATA:
${vitalsContext(vitals)}

TODAY'S NUTRITION:
- Calories consumed today: ${todayKcal} kcal
- Meals logged: ${diary.length}

EXERCISE REQUEST:
- Preferred intensity: ${intensity}
- Suggest exercises appropriate for RIGHT NOW based on their current vitals
- If HR is high (>85), suggest recovery/light exercises
- If stress is high, suggest yoga/breathing exercises
- If steps are low (<3000), suggest walking/cardio
- Consider medical conditions strictly

Return ONLY valid JSON array, no markdown:
[
  {
    "name": "Exercise name",
    "emoji": "single emoji",
    "duration": "20 mins",
    "sets": "3 sets x 12 reps",
    "calories_burned": 120,
    "intensity": "Moderate",
    "muscle_group": "Full Body",
    "reason": "1-2 sentences why this is ideal for their current vitals",
    "steps": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"]
  }
]`;

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text  = data.content?.map(b => b.text || '').join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setExercises(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setError('Error: ' + e.message);
    }
    setLoading(false);
  }

  const intensityColor = (i) =>
    i === 'Light' ? 'var(--accent2)' : i === 'Moderate' ? 'var(--accent)' : 'var(--red)';

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding:'48px 24px 0' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(182,245,66,0.1)', border:'1px solid rgba(182,245,66,0.2)', borderRadius:100, padding:'5px 12px', marginBottom:12 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', display:'inline-block', animation:'pulseDot 1.4s infinite' }} />
          <span style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'0.08em' }}>AI Fitness Coach</span>
        </div>
        <div style={{ fontSize:24, fontFamily:'var(--font-head)', fontWeight:800, lineHeight:1.15 }}>
          Exercises for<br /><span style={{ color:'var(--accent)' }}>your body, right now</span>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6, fontWeight:300 }}>
          Based on your live vitals + today's nutrition
        </div>
      </div>

      {/* Live vitals context */}
      <div style={{ margin:'14px 24px 0', padding:'12px 14px', background:'var(--surface)', borderRadius:16, border:'1px solid var(--card-border)' }}>
        <div style={{ fontSize:9, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Current Body State</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {[
            { label:`❤️ ${vitals.hr} BPM`,             hi: vitals.hr > 85 },
            { label:`🫁 SpO₂ ${vitals.spo2}%`,         hi: true },
            { label:`👟 ${vitals.steps.toLocaleString()} steps` },
            { label:`🧠 Stress: ${vitals.stress}`,      hi: vitals.stress === 'High' },
            { label:`⚡ ${vitals.activity} activity` },
          ].map(c => (
            <div key={c.label} className={`pill ${c.hi ? 'selected' : ''}`} style={{ cursor:'default' }}>{c.label}</div>
          ))}
        </div>
      </div>

      {/* Smart suggestion banner */}
      {vitals.hr > 85 && (
        <div style={{ margin:'10px 24px 0', padding:'10px 14px', background:'rgba(255,179,71,0.08)', border:'1px solid rgba(255,179,71,0.25)', borderRadius:12, fontSize:12, color:'var(--orange)' }}>
          ⚠️ Your HR is elevated. Light or recovery exercises recommended.
        </div>
      )}
      {vitals.stress === 'High' && (
        <div style={{ margin:'10px 24px 0', padding:'10px 14px', background:'rgba(255,94,94,0.08)', border:'1px solid rgba(255,94,94,0.25)', borderRadius:12, fontSize:12, color:'var(--red)' }}>
          🧘 High stress detected. Yoga or breathing exercises recommended.
        </div>
      )}
      {vitals.steps < 3000 && (
        <div style={{ margin:'10px 24px 0', padding:'10px 14px', background:'rgba(76,255,176,0.08)', border:'1px solid rgba(76,255,176,0.25)', borderRadius:12, fontSize:12, color:'var(--accent2)' }}>
          🚶 Low step count. A brisk walk would be great right now.
        </div>
      )}

      {/* Intensity selector */}
      <div style={{ margin:'14px 24px 0', display:'flex', gap:8 }}>
        {INTENSITY.map(t => (
          <div key={t} onClick={() => { setIntensity(t); setExercises([]); }} style={{
            flex:1, padding:'10px 4px', borderRadius:14, textAlign:'center',
            border:`1px solid ${intensity===t ? 'rgba(182,245,66,0.5)' : 'var(--card-border)'}`,
            background: intensity===t ? 'rgba(182,245,66,0.1)' : 'var(--surface)',
            color: intensity===t ? 'var(--accent)' : 'var(--text-muted)',
            fontFamily:'var(--font-head)', fontWeight:700, fontSize:11,
            cursor:'pointer', transition:'all 0.2s',
          }}>{t}</div>
        ))}
      </div>

      {/* Generate button */}
      <div style={{ margin:'14px 24px 0' }}>
        <button className="btn-primary" onClick={generate} disabled={loading}
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          {loading ? <><div className="spinner" />Generating plan…</> : '💪 Generate Exercise Plan'}
        </button>
      </div>

      {loading && <div style={{ padding:'0 24px' }}><TypingDots /></div>}

      {error && (
        <div style={{ margin:'14px 24px 0', background:'rgba(255,94,94,0.08)', border:'1px solid rgba(255,94,94,0.25)', borderRadius:14, padding:'12px 16px', fontSize:12, color:'var(--red)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Exercise cards */}
      {exercises.map((ex, i) => {
        const isDone = done.includes(ex.name);
        return (
          <div key={i} className="animate-up" style={{
            margin:'12px 24px 0', background:'var(--surface)',
            borderRadius:20, border:`1px solid ${isDone ? 'rgba(182,245,66,0.4)' : 'var(--card-border)'}`,
            padding:18, animationDelay:`${i*0.08}s`,
            opacity: isDone ? 0.7 : 1,
          }}>
            {/* Top row */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:6, marginBottom:4, flexWrap:'wrap' }}>
                  <span style={{ fontSize:9, fontFamily:'var(--font-head)', fontWeight:700, color:intensityColor(ex.intensity), textTransform:'uppercase', letterSpacing:'0.08em', background:`rgba(182,245,66,0.08)`, padding:'2px 8px', borderRadius:100 }}>
                    {ex.intensity}
                  </span>
                  <span style={{ fontSize:9, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', background:'var(--surface2)', padding:'2px 8px', borderRadius:100 }}>
                    {ex.muscle_group}
                  </span>
                </div>
                <div style={{ fontSize:17, fontFamily:'var(--font-head)', fontWeight:800, lineHeight:1.2 }}>{ex.name}</div>
              </div>
              <div style={{ fontSize:36, marginLeft:8 }}>{ex.emoji}</div>
            </div>

            {/* Stats row */}
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              {[
                { label:'Duration', val:ex.duration,        color:'var(--accent)'  },
                { label:'Sets',     val:ex.sets,            color:'var(--accent2)' },
                { label:'Burns',    val:`${ex.calories_burned} kcal`, color:'var(--orange)'  },
              ].map(s => (
                <div key={s.label} style={{ flex:1, background:'var(--surface2)', borderRadius:10, padding:'8px 4px', textAlign:'center' }}>
                  <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                  <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:800, color:s.color, marginTop:2 }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* AI Reason */}
            <div style={{
              fontSize:12, color:'var(--text-muted)', lineHeight:1.55, marginBottom:12,
              background:'var(--surface2)', borderRadius:10, padding:'10px 12px',
              borderLeft:'2px solid var(--accent)',
            }}>
              💡 {ex.reason}
            </div>

            {/* Steps */}
            {ex.steps && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:9, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>How to do it</div>
                {ex.steps.map((step, si) => (
                  <div key={si} style={{ display:'flex', gap:10, marginBottom:6, alignItems:'flex-start' }}>
                    <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(182,245,66,0.15)', border:'1px solid rgba(182,245,66,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontFamily:'var(--font-head)', fontWeight:800, color:'var(--accent)', flexShrink:0 }}>
                      {si+1}
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.5, paddingTop:2 }}>{step}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Mark done button */}
            <button
              onClick={() => !isDone && setDone(d => [...d, ex.name])}
              disabled={isDone}
              style={{
                width:'100%', padding:'12px', borderRadius:14, border:'none',
                background: isDone ? 'rgba(182,245,66,0.1)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                color: isDone ? 'var(--accent)' : 'var(--bg)',
                fontFamily:'var(--font-head)', fontWeight:800, fontSize:13,
                cursor: isDone ? 'default' : 'pointer', transition:'all 0.2s',
              }}
            >
              {isDone ? '✓ Done!' : '💪 Mark as Done'}
            </button>
          </div>
        );
      })}

      <div style={{ height:20 }} />
    </div>
  );
}