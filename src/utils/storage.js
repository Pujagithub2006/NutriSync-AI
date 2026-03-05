// ─── storage.js ───────────────────────────────────────────────
// Now uses Firebase Firestore for cloud storage.
// localStorage is only used as a fast local cache.

import { db } from '../firebase';
import {
  doc, getDoc, setDoc, updateDoc,
  collection, addDoc, getDocs, deleteDoc, query, orderBy,
} from 'firebase/firestore';

// ── Get today's date key ──────────────────────────────────────
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Local cache helpers ───────────────────────────────────────
function cacheGet(key)      { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function cacheSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

export const storage = {

  // ── Profile ────────────────────────────────────────────────
  getProfile: () => cacheGet('ns_profile'),

  setProfile: async (uid, profile) => {
    cacheSet('ns_profile', profile);
    await setDoc(doc(db, 'users', uid, 'data', 'profile'), profile);
  },

  loadProfile: async (uid) => {
    const snap = await getDoc(doc(db, 'users', uid, 'data', 'profile'));
    if (snap.exists()) {
      const data = snap.data();
      cacheSet('ns_profile', data);
      return data;
    }
    return null;
  },

  // ── Diary ──────────────────────────────────────────────────
  getTodayKey: todayKey,

  getDiary: () => cacheGet(`ns_diary_${todayKey()}`) || [],

  loadDiary: async (uid, dateKey) => {
    const key  = dateKey || todayKey();
    const ref  = collection(db, 'users', uid, 'diary', key, 'meals');
    const snap = await getDocs(query(ref, orderBy('timestamp', 'asc')));
    const meals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cacheSet(`ns_diary_${key}`, meals);
    return meals;
  },

  addMeal: async (uid, meal) => {
    const key  = todayKey();
    const time = new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    const entry = { ...meal, time, timestamp: Date.now() };

    // Save to Firestore
    const ref    = collection(db, 'users', uid, 'diary', key, 'meals');
    const docRef = await addDoc(ref, entry);
    entry.id = docRef.id;

    // Update local cache
    const current = cacheGet(`ns_diary_${key}`) || [];
    cacheSet(`ns_diary_${key}`, [...current, entry]);

    return entry;
  },

  removeMeal: async (uid, mealId) => {
    const key = todayKey();
    await deleteDoc(doc(db, 'users', uid, 'diary', key, 'meals', mealId));
    const current = (cacheGet(`ns_diary_${key}`) || []).filter(m => m.id !== mealId);
    cacheSet(`ns_diary_${key}`, current);
    return current;
  },

  getEatenToday: () => (cacheGet(`ns_diary_${todayKey()}`) || []).map(m => m.name),

  // ── User session (still localStorage) ─────────────────────
  getUser:   () => cacheGet('ns_user'),
  setUser:   (u) => cacheSet('ns_user', u),
  clearUser: () => {
    localStorage.removeItem('ns_user');
    localStorage.removeItem('ns_profile');
  },
};