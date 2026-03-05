// ─── LoginScreen.jsx ──────────────────────────────────────────
import { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { storage } from '../utils/storage';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode]         = useState('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    setError(''); setLoading(true);
    if (!email || !password) { setError('Please fill all fields.'); setLoading(false); return; }
    if (mode === 'signup' && !name) { setError('Please enter your name.'); setLoading(false); return; }

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        const user = { uid: cred.user.uid, email, name };
        storage.setUser(user);
        onLogin(user, true); // needs onboarding
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const user = { uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName };
        storage.setUser(user);
        // Load profile from Firestore
        const profile = await storage.loadProfile(cred.user.uid);
        onLogin(user, !profile);
      }
    } catch (e) {
      // Firebase error codes → friendly messages
      const msg = {
        'auth/email-already-in-use':  'This email is already registered. Please sign in.',
        'auth/invalid-email':         'Invalid email address.',
        'auth/wrong-password':        'Incorrect password.',
        'auth/user-not-found':        'No account found. Please sign up.',
        'auth/weak-password':         'Password must be at least 6 characters.',
        'auth/invalid-credential':    'Incorrect email or password.',
      }[e.code] || e.message;
      setError(msg);
    }
    setLoading(false);
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'60px 28px 28px' }}>

      {/* Logo */}
      <div style={{ marginBottom:40, animation:'slideUp 0.5s ease both' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(182,245,66,0.1)', border:'1px solid rgba(182,245,66,0.2)', borderRadius:100, padding:'6px 14px', marginBottom:20 }}>
          <span style={{ fontSize:16 }}>🥗</span>
          <span style={{ fontSize:11, fontFamily:'var(--font-head)', fontWeight:700, color:'var(--accent)', letterSpacing:'0.08em', textTransform:'uppercase' }}>NutriSync AI</span>
        </div>
        <div style={{ fontSize:30, fontFamily:'var(--font-head)', fontWeight:800, lineHeight:1.15, whiteSpace:'pre-line' }}>
          {mode === 'login' ? 'Welcome\nback 👋' : 'Create your\naccount ✨'}
        </div>
        <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:8, fontWeight:300 }}>
          {mode === 'login' ? 'Sign in to continue your journey.' : 'Your AI nutritionist awaits.'}
        </div>
      </div>

      {/* Form */}
      <div style={{ flex:1 }}>
        {mode === 'signup' && (
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input-field" placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div className="input-group">
          <label className="input-label">Email</label>
          <input className="input-field" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Password</label>
          <input className="input-field" type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>

        {error && (
          <div style={{ background:'rgba(255,94,94,0.08)', border:'1px solid rgba(255,94,94,0.25)', borderRadius:12, padding:'10px 14px', fontSize:12, color:'var(--red)', marginBottom:14 }}>
            ⚠️ {error}
          </div>
        )}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginBottom:12, display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          {loading ? <><div className="spinner" /> Please wait…</> : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
        <button className="btn-outline" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>

      <div style={{ textAlign:'center', fontSize:10, color:'var(--text-muted)', marginTop:20 }}>
        Secured by Firebase 🔒
      </div>
    </div>
  );
}