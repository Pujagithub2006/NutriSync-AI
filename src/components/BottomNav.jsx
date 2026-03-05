// ─── BottomNav.jsx ────────────────────────────────────────────

const NAV = [
  { key: 'home',     label: 'Home',     icon: HomeIcon },
  { key: 'ai',       label: 'AI Meals', icon: AIIcon },
  { key: 'exercise', label: 'Exercise', icon: ExerciseIcon },
  { key: 'diary',    label: 'Diary',    icon: DiaryIcon },
  { key: 'profile',  label: 'Profile',  icon: UserIcon },
  { key: 'plan', label: 'Day Plan', icon: PlanIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 80,
      background: 'rgba(17,25,21,0.96)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(182,245,66,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px 10px',
      zIndex: 50,
    }}>
      {NAV.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <div key={key} onClick={() => onChange(key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            cursor: 'pointer', padding: '8px 14px', borderRadius: 16,
            transition: 'all 0.2s',
            background: isActive ? 'rgba(182,245,66,0.08)' : 'transparent',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
          }}>
            <Icon size={22} />
            <span style={{ fontSize: 9, fontFamily: 'var(--font-head)', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────
function HomeIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function AIIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/>
      <path d="M8 10H5a2 2 0 0 0-2 2v1a9 9 0 0 0 18 0v-1a2 2 0 0 0-2-2h-3"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </svg>
  );
}
function DiaryIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <line x1="8" y1="8" x2="16" y2="8"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
      <line x1="8" y1="16" x2="12" y2="16"/>
    </svg>
  );
}
function UserIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function ExerciseIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  );
}

function PlanIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      <line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/>
      <line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="8" y2="18"/>
      <line x1="12" y1="18" x2="12" y2="18"/>
    </svg>
  );
}