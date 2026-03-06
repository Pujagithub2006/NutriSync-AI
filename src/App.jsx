// ─── App.jsx ──────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import './index.css';

import { onAuthStateChanged } from 'firebase/auth';
import { auth }               from './firebase';
import { storage }            from './utils/storage';
import { useVitalsEnhanced } from './services/vitalsEnhanced';

import BottomNav              from './components/BottomNav';
import LoginScreen            from './screens/LoginScreen';
import OnboardingScreen       from './screens/OnboardingScreen';
import HomeScreen             from './screens/HomeScreen';
import AIScreen               from './screens/AIScreen';
import DiaryScreen            from './screens/DiaryScreen';
import ProfileScreen          from './screens/ProfileScreen';
import ExerciseScreen         from './screens/ExerciseScreen';
import DayPlanScreen from './screens/DayPlanScreen';

function StatusBar() {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false });
  return (
    <div className="status-bar">
      <span>{time}</span>
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <rect x="0" y="4"  width="2.5" height="7"  rx="1"/>
          <rect x="4" y="2"  width="2.5" height="9"  rx="1"/>
          <rect x="8" y="0"  width="2.5" height="11" rx="1"/>
          <rect x="12" y="0" width="2.5" height="11" rx="1" opacity="0.3"/>
        </svg>
        <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
          <rect x="0.5" y="1.5" width="18" height="9" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/>
          <rect x="19" y="4" width="2.5" height="4" rx="1.25" fill="currentColor" fillOpacity="0.4"/>
          <rect x="1.5" y="2.5" width="13" height="7" rx="1.5" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
}

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser]           = useState(null);
  const [tab, setTab]             = useState('home');
  const { vitals, loading, error } = useVitalsEnhanced();

  useEffect(() => {
    // Firebase auth state listener — fires on login, logout, and page refresh
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setAuthState('login');
        return;
      }
      const user = {
        uid:   firebaseUser.uid,
        email: firebaseUser.email,
        name:  firebaseUser.displayName,
      };
      storage.setUser(user);
      setUser(user);

      // Try loading profile from Firestore
      const profile = await storage.loadProfile(firebaseUser.uid);
      setAuthState(profile ? 'app' : 'onboarding');
    });
    return () => unsub();
  }, []);

  function handleLogin(u, needsOnboarding) {
    setUser(u);
    setAuthState(needsOnboarding ? 'onboarding' : 'app');
  }

  async function handleLogout() {
    await auth.signOut();
    storage.clearUser();
    setUser(null);
    setAuthState('login');
  }

  // ── Loading splash ────────────────────────────────────────
  if (authState === 'loading') {
    return (
      <div className="phone-shell" style={{ alignItems:'center', justifyContent:'center', display:'flex' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:44, marginBottom:14 }}>🥗</div>
          <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, color:'var(--accent)' }}>NutriSync AI</div>
          <div style={{ marginTop:18 }}>
            <div className="spinner" style={{ margin:'0 auto', borderTopColor:'var(--accent)', borderColor:'rgba(182,245,66,0.2)', width:22, height:22 }} />
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <div className="phone-shell">
        <div className="notch" />
        <StatusBar />
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  if (authState === 'onboarding') {
    return (
      <div className="phone-shell">
        <div className="notch" />
        <StatusBar />
        <OnboardingScreen user={user} onDone={() => setAuthState('app')} />
      </div>
    );
  }

  // ── Main app ─────────────────────────────────────────────
  return (
    <div className="phone-shell">
      <div className="notch" />
      <StatusBar />
      
      {error && (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(255, 94, 94, 0.08)',
          borderBottom: '1px solid rgba(255, 94, 94, 0.25)',
          fontSize: '11px',
          color: 'var(--red)',
          fontFamily: 'var(--font-head)',
          fontWeight: 500
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {tab === 'home'     && <HomeScreen     vitals={vitals} onNavigate={setTab} />}
      {tab === 'ai'       && <AIScreen       vitals={vitals} />}
      {tab === 'exercise' && <ExerciseScreen vitals={vitals} />}
      {tab === 'diary'    && <DiaryScreen    onNavigate={setTab} />}
      {tab === 'profile'  && <ProfileScreen  onLogout={handleLogout} />}
      {tab === 'plan' && <DayPlanScreen vitals={vitals} />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}