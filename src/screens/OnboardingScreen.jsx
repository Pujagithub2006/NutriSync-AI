// ─── OnboardingScreen.jsx ─────────────────────────────────────
import { useState } from 'react';
import { storage } from '../utils/storage';
import { calculatePhysiology } from '../services/api';

const ALLERGIES = ['Nuts','Dairy','Gluten','Seafood','Eggs','Soy','Shellfish','Sesame'];
const DISEASES  = ['Diabetes (Type 1)','Diabetes (Type 2)','Hypertension','PCOS','Thyroid','Celiac','Heart Disease','None'];
const GOALS     = [
  { key:'balance',    icon:'⚖️', label:'Balanced Diet' },
  { key:'weightloss', icon:'🔥', label:'Fat Loss' },
  { key:'muscle',     icon:'💪', label:'Muscle Gain' },
  { key:'energy',     icon:'⚡', label:'More Energy' },
  { key:'recovery',   icon:'🛡️', label:'Recovery' },
];
const ACTIVITY  = ['Sedentary','Lightly Active','Moderately Active','Very Active','Athlete'];
const STATES_IN = ['Maharashtra','Delhi','Karnataka','Tamil Nadu','Gujarat','Rajasthan','West Bengal','Uttar Pradesh','Kerala','Other'];

export default function OnboardingScreen({ user, onDone }) {
  const [step, setStep]   = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm]   = useState({
    name: user?.name || '', age:'', gender:'', weight:'', height:'',
    country:'India', state:'',
    allergies:[], diseases:[], goal:'balance', activity:'Moderately Active',
    vegetarian:false, vegan:false,
  });
  const [error, setError] = useState('');

  function set(key, val) { setForm(f => ({ ...f, [key]:val })); }
  function toggleArr(key, val) {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x=>x!==val) : [...f[key], val] }));
  }

  async function nextStep() {
    setError('');
    if (step === 1 && (!form.age || !form.gender || !form.weight || !form.height)) {
      setError('Please fill all fields.'); return;
    }
    if (step === 2 && !form.state) {
      setError('Please select your state.'); return;
    }
    if (step < 3) { setStep(s => s+1); return; }

    // Step 3 — save to Firestore and calculate physiology
    setSaving(true);
    try {
      const bmi = (parseFloat(form.weight) / ((parseFloat(form.height)/100)**2)).toFixed(1);
      const profile = { ...form, bmi };
      
      // Call physiology API with user health data
      try {
        await calculatePhysiology({
          age: parseInt(form.age),
          gender: form.gender,
          weight: parseFloat(form.weight),
          height: parseFloat(form.height),
          activity: form.activity,
          allergies: form.allergies,
          diseases: form.diseases,
          goal: form.goal,
          bmi: parseFloat(bmi)
        });
      } catch (apiError) {
        console.warn('Physiology API call failed:', apiError);
        // Continue with profile save even if API fails
      }
      
      await storage.setProfile(user.uid, profile);
      onDone();
    } catch (e) {
      setError('Failed to save: ' + e.message);
    }
    setSaving(false);
  }

  const progress = (step / 3) * 100;

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Progress */}
      <div style={{ padding:'52px 24px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em' }}>Step {step} of 3</div>
          <div style={{ fontSize:11, color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:700 }}>{Math.round(progress)}%</div>
        </div>
        <div style={{ height:4, background:'var(--surface2)', borderRadius:4, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius:4, transition:'width 0.4s ease' }} />
        </div>
        <div style={{ fontSize:22, fontFamily:'var(--font-head)', fontWeight:800, marginTop:16 }}>
          {step === 1 && 'About You 👤'}
          {step === 2 && 'Location & Diet 🌍'}
          {step === 3 && 'Your Goals 🎯'}
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4, fontWeight:300 }}>
          {step === 1 && 'We use this to personalise your nutrition plan.'}
          {step === 2 && 'Location helps with regional food suggestions.'}
          {step === 3 && 'What matters most to you right now?'}
        </div>
      </div>

      <div className="screen" style={{ padding:'20px 24px', paddingBottom:100 }}>

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-up">
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="input-group" style={{ gridColumn:'1/-1' }}>
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="Alex Johnson" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Age</label>
                <input className="input-field" type="number" placeholder="25" value={form.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Gender</label>
                <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Weight (kg)</label>
                <input className="input-field" type="number" placeholder="68" value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Height (cm)</label>
                <input className="input-field" type="number" placeholder="172" value={form.height} onChange={e => set('height', e.target.value)} />
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Activity Level</label>
              <select className="input-field" value={form.activity} onChange={e => set('activity', e.target.value)}>
                {ACTIVITY.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Allergies</label>
              <div className="tag-row">
                {ALLERGIES.map(a => (
                  <div key={a} className={`pill ${form.allergies.includes(a) ? 'selected' : ''}`} onClick={() => toggleArr('allergies', a)}>
                    {form.allergies.includes(a) ? '✓ ' : ''}{a}
                  </div>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Medical Conditions</label>
              <div className="tag-row">
                {DISEASES.map(d => (
                  <div key={d} className={`pill ${form.diseases.includes(d) ? 'selected' : ''}`} onClick={() => toggleArr('diseases', d)}>
                    {form.diseases.includes(d) ? '✓ ' : ''}{d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="animate-up">
            <div className="input-group">
              <label className="input-label">Country</label>
              <select className="input-field" value={form.country} onChange={e => set('country', e.target.value)}>
                <option>India</option><option>USA</option><option>UK</option><option>Australia</option><option>Canada</option><option>UAE</option><option>Other</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">State / Region</label>
              <select className="input-field" value={form.state} onChange={e => set('state', e.target.value)}>
                <option value="">Select state</option>
                {STATES_IN.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Diet Preference</label>
              <div className="tag-row">
                {[
                  { key:'vegetarian', label:'🌿 Vegetarian' },
                  { key:'vegan',      label:'🌱 Vegan' },
                ].map(({ key, label }) => (
                  <div key={key} className={`pill ${form[key] ? 'selected' : ''}`} onClick={() => set(key, !form[key])}>
                    {form[key] ? '✓ ' : ''}{label}
                  </div>
                ))}
                <div className={`pill ${!form.vegetarian && !form.vegan ? 'selected' : ''}`} onClick={() => { set('vegetarian', false); set('vegan', false); }}>
                  {!form.vegetarian && !form.vegan ? '✓ ' : ''}🍖 Non-Veg
                </div>
              </div>
            </div>
            {form.weight && form.height && (
              <div className="card animate-fade" style={{ marginTop:8 }}>
                <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>BMI Preview</div>
                <div style={{ fontSize:28, fontFamily:'var(--font-head)', fontWeight:800, color:'var(--accent)' }}>
                  {(parseFloat(form.weight) / ((parseFloat(form.height)/100)**2)).toFixed(1)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="animate-up">
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {GOALS.map(g => (
                <div key={g.key} onClick={() => set('goal', g.key)} style={{
                  display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:16,
                  border:`1px solid ${form.goal===g.key ? 'rgba(182,245,66,0.5)' : 'var(--card-border)'}`,
                  background: form.goal===g.key ? 'rgba(182,245,66,0.07)' : 'var(--surface)',
                  cursor:'pointer', transition:'all 0.2s',
                }}>
                  <span style={{ fontSize:28 }}>{g.icon}</span>
                  <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:15, color: form.goal===g.key ? 'var(--accent)' : 'var(--text)' }}>{g.label}</div>
                  {form.goal===g.key && (
                    <div style={{ marginLeft:'auto', width:20, height:20, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--bg)', fontWeight:800 }}>✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(255,94,94,0.08)', border:'1px solid rgba(255,94,94,0.25)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'var(--red)', margin:'14px 0' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding:'12px 24px 28px', display:'flex', gap:10, flexShrink:0 }}>
        {step > 1 && (
          <button className="btn-outline" style={{ flex:1 }} onClick={() => setStep(s => s-1)}>← Back</button>
        )}
        <button className="btn-primary" style={{ flex:2 }} onClick={nextStep} disabled={saving}>
          {saving ? <><div className="spinner" style={{ borderTopColor:'var(--bg)', borderColor:'rgba(0,0,0,0.2)', margin:'0 auto' }} /> Saving…</> : step < 3 ? 'Continue →' : 'Start My Journey 🚀'}
        </button>
      </div>
    </div>
  );
}