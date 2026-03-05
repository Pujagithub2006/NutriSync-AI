// ─── VitalsStrip.jsx ──────────────────────────────────────────

export default function VitalsStrip({ vitals }) {
  const items = [
    { label: 'Heart Rate', value: vitals.hr,               unit: 'BPM',   color: 'var(--accent)',  live: true },
    { label: 'SpO₂',       value: vitals.spo2,             unit: '%',     color: 'var(--accent2)', live: true },
    { label: 'Steps',      value: vitals.steps.toLocaleString(), unit: 'today', color: 'var(--orange)',  live: false },
    { label: 'Stress',     value: vitals.stress,           unit: '',      color: vitals.stress === 'Low' ? 'var(--accent2)' : vitals.stress === 'Moderate' ? 'var(--orange)' : 'var(--red)', live: false },
  ];

  return (
    <div style={{
      margin: '14px 20px 0',
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--card-border)',
      padding: '14px 16px',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated top border */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: 'linear-gradient(90deg, var(--accent), var(--accent2), transparent)',
        animation: 'scanAnim 3s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes scanAnim {
          0%,100% { opacity:0.4; transform:scaleX(0.3); transform-origin:left; }
          50%      { opacity:1;   transform:scaleX(1); }
        }
      `}</style>

      {items.map((item, i) => (
        <div key={item.label} style={{
          flex: 1, textAlign: 'center',
          borderLeft: i > 0 ? '1px solid var(--card-border)' : 'none',
          padding: '0 4px',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-head)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
            {item.live && <span style={{
              display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
              background: 'var(--accent)', marginRight: 3,
              animation: 'pulseDot 1.4s ease-in-out infinite',
            }} />}
            {item.label}
          </div>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-head)', fontWeight: 800, color: item.color, lineHeight: 1.2 }}>
            {item.value}
          </div>
          {item.unit && (
            <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>{item.unit}</div>
          )}
        </div>
      ))}
    </div>
  );
}