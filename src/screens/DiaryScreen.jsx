// ─── DiaryScreen.jsx ──────────────────────────────────────────
import { useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const MEAL_SECTIONS = ['Breakfast','Lunch','Dinner','Snack'];

export default function DiaryScreen({ onNavigate }) {
  const [diary, setDiary]   = useState(storage.getDiary());
  const [loading, setLoading] = useState(true);
  const user = storage.getUser();

  // Load today's diary from Firestore on mount
  useEffect(() => {
    async function load() {
      if (user?.uid) {
        const meals = await storage.loadDiary(user.uid);
        setDiary(meals);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function remove(id) {
    if (user?.uid) {
      const updated = await storage.removeMeal(user.uid, id);
      setDiary(updated);
    }
  }

  const totals = diary.reduce((acc, m) => ({
    kcal:    acc.kcal    + (m.kcal    || 0),
    protein: acc.protein + (m.protein || 0),
    carbs:   acc.carbs   + (m.carbs   || 0),
    fat:     acc.fat     + (m.fat     || 0),
  }), { kcal:0, protein:0, carbs:0, fat:0 });

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding:'48px 24px 0' }}>
        <div style={{ fontSize:10, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Food Diary</div>
        <div style={{ fontSize:24, fontFamily:'var(--font-head)', fontWeight:800 }}>Today's Log 📖</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{today}</div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', padding:'40px 0' }}>
          <div className="spinner" style={{ width:24, height:24, borderTopColor:'var(--accent)', borderColor:'rgba(182,245,66,0.2)' }} />
        </div>
      )}

      {/* Daily totals */}
      {!loading && (
        <>
          <div style={{ margin:'16px 20px 0' }} className="card">
            <div style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Daily Totals</div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { label:'Calories', val:totals.kcal,          unit:'kcal', color:'var(--accent)'  },
                { label:'Protein',  val:`${totals.protein}g`, unit:'',     color:'var(--accent2)' },
                { label:'Carbs',    val:`${totals.carbs}g`,   unit:'',     color:'var(--accent)'  },
                { label:'Fat',      val:`${totals.fat}g`,     unit:'',     color:'var(--orange)'  },
              ].map(m => (
                <div key={m.label} style={{ flex:1, background:'var(--surface2)', borderRadius:12, padding:'10px 6px', textAlign:'center', border:'1px solid var(--card-border)' }}>
                  <div style={{ fontSize:7, color:'var(--text-muted)', fontFamily:'var(--font-head)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{m.label}</div>
                  <div style={{ fontSize:15, fontFamily:'var(--font-head)', fontWeight:800, color:m.color }}>{m.val}</div>
                  {m.unit && <div style={{ fontSize:8, color:'var(--text-muted)' }}>{m.unit}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Meal sections */}
          {MEAL_SECTIONS.map(section => {
            const items = diary.filter(m => m.mealType === section);
            return (
              <div key={section}>
                <div className="section-title">
                  {section}
                  <span className="section-title-action" onClick={() => onNavigate('ai')}>+ Add</span>
                </div>
                {items.length === 0 ? (
                  <div style={{ margin:'0 20px 6px', padding:'14px 18px', background:'var(--surface)', borderRadius:14, border:'1px dashed rgba(182,245,66,0.15)', textAlign:'center', fontSize:12, color:'var(--text-muted)' }}>
                    No {section.toLowerCase()} logged yet —{' '}
                    <span style={{ color:'var(--accent)', cursor:'pointer' }} onClick={() => onNavigate('ai')}>get suggestions →</span>
                  </div>
                ) : (
                  items.map(m => (
                    <div key={m.id} style={{ margin:'0 20px 8px', background:'var(--surface)', border:'1px solid var(--card-border)', borderRadius:16, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, animation:'slideUp 0.3s ease both' }}>
                      <div style={{ fontSize:26, width:40, height:40, background:'var(--surface2)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {m.emoji || '🍽️'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{m.time}</div>
                        <div style={{ display:'flex', gap:8, marginTop:4 }}>
                          {[
                            { v:m.kcal,           c:'var(--accent)'  },
                            { v:`${m.protein||0}g`, c:'var(--accent2)' },
                            { v:`${m.carbs||0}g`,   c:'var(--text-muted)' },
                            { v:`${m.fat||0}g`,     c:'var(--orange)'  },
                          ].map((x, i) => (
                            <span key={i} style={{ fontSize:10, color:x.c, fontFamily:'var(--font-head)', fontWeight:700 }}>{x.v}</span>
                          ))}
                        </div>
                      </div>
                      <div onClick={() => remove(m.id)} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,94,94,0.1)', border:'1px solid rgba(255,94,94,0.2)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:13, color:'var(--red)', flexShrink:0 }}>
                        ×
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}

          {diary.length === 0 && (
            <div style={{ textAlign:'center', padding:'40px 24px', color:'var(--text-muted)' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🍽️</div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:16, color:'var(--text)', marginBottom:8 }}>Your diary is empty</div>
              <div style={{ fontSize:13, marginBottom:20 }}>Get AI meal suggestions and log what you eat.</div>
              <button className="btn-primary" onClick={() => onNavigate('ai')} style={{ maxWidth:200, margin:'0 auto', display:'block' }}>
                Get AI Suggestions
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}