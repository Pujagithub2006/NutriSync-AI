// ─── HomeScreen.jsx ───────────────────────────────────────────
import VitalsStrip from '../components/VitalsStrip';
import { storage } from '../utils/storage';

function Ring({ pct, size = 96, stroke = 9 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(182,245,66,0.08)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#rg)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b6f542"/>
          <stop offset="100%" stopColor="#4cffb0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function HomeScreen({ vitals, onNavigate }) {
  const profile = storage.getProfile();
  const diary   = storage.getDiary();

  // Calorie totals from diary
  const totals = diary.reduce((acc, m) => ({
    kcal:   acc.kcal   + (m.kcal   || 0),
    protein:acc.protein+ (m.protein|| 0),
    carbs:  acc.carbs  + (m.carbs  || 0),
    fat:    acc.fat    + (m.fat    || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  const goal     = profile?.goal || 'balance';
  const kcalGoal = goal === 'weightloss' ? 1600 : goal === 'muscle' ? 2800 : 2200;
  const pct      = Math.min(100, Math.round((totals.kcal / kcalGoal) * 100));

  const days   = ['M','T','W','T','F','S','S'];
  const heights= [35, 60, 45, 80, 55, 90, 70];
  const today  = new Date().getDay(); // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1;

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const mealTypes = ['Breakfast','Lunch','Dinner','Snack'];

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '48px 24px 0' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginRight: 6, animation: 'pulseDot 1.4s infinite' }} />
          Live Sync Active
        </div>
        <div style={{ fontSize: 26, fontFamily: 'var(--font-head)', fontWeight: 800, lineHeight: 1.2 }}>
          {greeting},<br />{profile?.name?.split(' ')[0] || 'there'} 👋
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontWeight: 300 }}>
          Your body's talking — let's listen.
        </div>
      </div>

      {/* Vitals */}
      <VitalsStrip vitals={vitals} />

      {/* Calorie ring + macros */}
      <div style={{ margin: '14px 20px 0' }} className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 96, height: 96, flexShrink: 0 }}>
            <Ring pct={pct} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 16, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--accent)' }}>{totals.kcal}</div>
              <div style={{ fontSize: 7, color: 'var(--text-muted)', fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>kcal</div>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 8 }}>
              Today's Nutrition
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 6 }}>Goal: {kcalGoal} kcal</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: 'Protein', val: totals.protein, unit: 'g', color: 'var(--accent2)' },
                { label: 'Carbs',   val: totals.carbs,   unit: 'g', color: 'var(--accent)'  },
                { label: 'Fat',     val: totals.fat,     unit: 'g', color: 'var(--orange)'  },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, background: 'var(--surface2)', borderRadius: 10, padding: '8px 4px', textAlign: 'center', border: '1px solid var(--card-border)' }}>
                  <div style={{ fontSize: 7, color: 'var(--text-muted)', fontFamily: 'var(--font-head)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontFamily: 'var(--font-head)', fontWeight: 800, color: m.color, marginTop: 2 }}>{m.val}{m.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI CTA */}
      <div style={{ margin: '14px 20px 0' }}>
        <div onClick={() => onNavigate('ai')} style={{
          background: 'linear-gradient(135deg, rgba(182,245,66,0.12), rgba(76,255,176,0.08))',
          border: '1px solid rgba(182,245,66,0.25)',
          borderRadius: 18, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <div style={{ fontSize: 32 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 14, color: 'var(--accent)' }}>Get AI Meal Suggestions</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Personalised to your live vitals right now</div>
          </div>
          <div style={{ fontSize: 18, color: 'var(--accent)' }}>→</div>
        </div>
      </div>

      {/* Weekly activity */}
      <div style={{ margin: '14px 20px 0' }} className="card">
        <div style={{ fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: 12 }}>Weekly Activity</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 56 }}>
          {days.map((d, i) => (
            <div key={d + i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ width: '100%', height: 48, background: 'var(--surface2)', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: 5,
                  height: `${heights[i]}%`,
                  background: i === todayIdx ? 'linear-gradient(180deg, var(--accent2), var(--accent))' : 'rgba(182,245,66,0.15)',
                  transition: 'height 1s ease',
                }} />
              </div>
              <div style={{ fontSize: 8, fontFamily: 'var(--font-head)', fontWeight: 700, textTransform: 'uppercase', color: i === todayIdx ? 'var(--accent)' : 'var(--text-muted)' }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's diary preview */}
      <div className="section-title">
        Today's Log
        <span className="section-title-action" onClick={() => onNavigate('diary')}>View all →</span>
      </div>

      {diary.length === 0 ? (
        <div style={{ margin: '0 20px', padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No meals logged yet.<br />
          <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => onNavigate('ai')}>Get AI suggestions →</span>
        </div>
      ) : (
        diary.slice(-3).map((m, i) => (
          <div key={m.id || i} style={{
            margin: '0 20px 10px',
            background: 'var(--surface)', border: '1px solid var(--card-border)',
            borderRadius: 16, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ fontSize: 24, width: 40, height: 40, background: 'var(--surface2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {m.emoji || '🍽️'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13 }}>{m.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.mealType} · {m.time}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{m.kcal} kcal</div>
          </div>
        ))
      )}
    </div>
  );
}