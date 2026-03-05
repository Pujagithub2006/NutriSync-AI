// ─── ProfileScreen.jsx ────────────────────────────────────────
import { useState } from 'react';
import { storage } from '../utils/storage';

const ALLERGIES = ['Nuts','Dairy','Gluten','Seafood','Eggs','Soy','Shellfish','Sesame'];
const DISEASES  = ['Diabetes (Type 1)','Diabetes (Type 2)','Hypertension','PCOS','Thyroid','Celiac','Heart Disease','None'];
const ACTIVITY  = ['Sedentary','Lightly Active','Moderately Active','Very Active','Athlete'];
const GOALS     = [
  { key:'balance',    icon:'⚖️', label:'Balanced Diet' },
  { key:'weightloss', icon:'🔥', label:'Fat Loss' },
  { key:'muscle',     icon:'💪', label:'Muscle Gain' },
  { key:'energy',     icon:'⚡', label:'More Energy' },
  { key:'recovery',   icon:'🛡️', label:'Recovery' },
];

export default function ProfileScreen({ onLogout }) {
  const user    = storage.getUser();
  const saved   = storage.getProfile() || {};
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ ...saved });
  const [saving, setSaving]   = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]:val })); }
  function toggleArr(key, val) {
    setForm(f => ({ ...f, [key]: f[key]?.includes(val) ? f[key].filter(x=>x!==val) : [...(f[key]||[]), val] }));
  }

  async function save() {
    setSaving(true);
    try {
      const bmi = (parseFloat(form.weight) / ((parseFloat(form.height)/100)**2)).toFixed(1);
      await storage.setProfile(user.uid, { ...form, bmi });
      setSavedMsg(true);
      setEditing(false);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (e) {
      alert('Failed to save: ' + e.message);
    }
    setSaving(false);
  }

  const profile = form;
  const bmi = profile.weight && profile.height
    ? (parseFloat(profile.weight) / ((parseFloat(profile.height)/100)**2)).toFixed(1)
    : '–';

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding:'48px 24px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Profile</div>
          <div style={{ fontSize:24, fontFamily:'var(--font-head)', fontWeight:800 }}>{profile.name || 'Your Profile'}</div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{user?.email}</div>
        </div>
        <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), var(--accent2))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, color:'var(--bg)' }}>
          {(profile.name || user?.email || 'U')[0].toUpperCase()}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ margin:'16px 20px 0', display:'flex', gap:8 }}>
        {[
          { label:'BMI',    val:bmi,                   color:'var(--accent)' },
          { label:'Weight', val:`${profile.weight||'–'}kg`, color:'var(--text)'   },
          { label:'Height', val:`${profile.height||'–'}cm`, color:'var(--text)'   },
          { label:'Age',    val:profile.age||'–',      color:'var(--text)'   },
        ].map(s => (
          <div key={s.label} style={{ flex:1, background:'var(--surface)', border:'1px solid var(--card-border)', borderRadius:14, padding:'12px 6px', textAlign:'center' }}>
            <div style={{ fontSize:7, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:16, fontFamily:'var(--font-head)', fontWeight:800, color:s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Firebase badge */}
      <div style={{ margin:'10px 20px 0', padding:'8px 14px', background:'rgba(182,245,66,0.05)', border:'1px solid rgba(182,245,66,0.15)', borderRadius:12, display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:14 }}>☁️</span>
        <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:600 }}>Synced to Firebase Cloud</span>
        <span style={{ marginLeft:'auto', fontSize:10, color:'var(--accent)', fontFamily:'var(--font-head)', fontWeight:700 }}>● LIVE</span>
      </div>

      {/* Edit toggle */}
      <div style={{ margin:'14px 20px 0', display:'flex', gap:10 }}>
        <button className={editing ? 'btn-outline' : 'btn-primary'} style={{ flex:1 }}
          onClick={() => editing ? save() : setEditing(true)} disabled={saving}>
          {saving ? <><div className="spinner" style={{ display:'inline-block', marginRight:8, borderTopColor: editing ? 'var(--bg)' : 'var(--accent)', borderColor:'rgba(182,245,66,0.2)' }} />Saving…</> : editing ? '💾 Save Changes' : '✏️ Edit Profile'}
        </button>
        {editing && (
          <button className="btn-outline" style={{ flex:1 }} onClick={() => { setForm({ ...saved }); setEditing(false); }}>
            Cancel
          </button>
        )}
      </div>

      {savedMsg && (
        <div style={{ margin:'10px 20px 0', background:'rgba(182,245,66,0.1)', border:'1px solid rgba(182,245,66,0.3)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'var(--accent)', textAlign:'center', fontFamily:'var(--font-head)', fontWeight:700 }}>
          ✓ Profile saved to cloud!
        </div>
      )}

      {/* View mode */}
      {!editing && (
        <div style={{ padding:'0 20px' }}>
          {[
            { label:'Gender',     val:profile.gender },
            { label:'Activity',   val:profile.activity },
            { label:'Diet',       val:profile.vegan ? 'Vegan' : profile.vegetarian ? 'Vegetarian' : 'Non-Vegetarian' },
            { label:'Location',   val:`${profile.state||'–'}, ${profile.country||'–'}` },
            { label:'Goal',       val:GOALS.find(g=>g.key===profile.goal)?.label || profile.goal },
            { label:'Allergies',  val:profile.allergies?.join(', ') || 'None' },
            { label:'Conditions', val:profile.diseases?.filter(d=>d!=='None').join(', ') || 'None' },
          ].map(row => (
            <div key={row.label} style={{ borderBottom:'1px solid var(--card-border)', padding:'14px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{row.label}</div>
              <div style={{ fontSize:13, fontFamily:'var(--font-head)', fontWeight:600, color:'var(--text)', textAlign:'right', maxWidth:'55%' }}>{row.val || '–'}</div>
            </div>
          ))}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div style={{ padding:'16px 20px' }} className="animate-fade">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div className="input-group">
              <label className="input-label">Name</label>
              <input className="input-field" value={form.name||''} onChange={e=>set('name',e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Age</label>
              <input className="input-field" type="number" value={form.age||''} onChange={e=>set('age',e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Weight (kg)</label>
              <input className="input-field" type="number" value={form.weight||''} onChange={e=>set('weight',e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Height (cm)</label>
              <input className="input-field" type="number" value={form.height||''} onChange={e=>set('height',e.target.value)} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Gender</label>
            <select className="input-field" value={form.gender||''} onChange={e=>set('gender',e.target.value)}>
              <option>Male</option><option>Female</option><option>Non-binary</option><option>Prefer not to say</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Activity Level</label>
            <select className="input-field" value={form.activity||''} onChange={e=>set('activity',e.target.value)}>
              {ACTIVITY.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Goal</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
              {GOALS.map(g => (
                <div key={g.key} className={`pill ${form.goal===g.key?'selected':''}`} onClick={()=>set('goal',g.key)}>
                  {g.icon} {g.label}
                </div>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Allergies</label>
            <div className="tag-row">
              {ALLERGIES.map(a=>(
                <div key={a} className={`pill ${form.allergies?.includes(a)?'selected':''}`} onClick={()=>toggleArr('allergies',a)}>
                  {form.allergies?.includes(a)?'✓ ':''}{a}
                </div>
              ))}
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Medical Conditions</label>
            <div className="tag-row">
              {DISEASES.map(d=>(
                <div key={d} className={`pill ${form.diseases?.includes(d)?'selected':''}`} onClick={()=>toggleArr('diseases',d)}>
                  {form.diseases?.includes(d)?'✓ ':''}{d}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ margin:'16px 20px 24px' }}>
        <button className="btn-outline" onClick={onLogout} style={{ color:'var(--red)', borderColor:'rgba(255,94,94,0.3)' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}