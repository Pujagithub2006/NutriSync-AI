// ─── firebase.js ──────────────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCGcLuSFmmzmMVcUao9xWI111r1sSjOiEc",
  authDomain: "nutrisync-ai-99b95.firebaseapp.com",
  projectId: "nutrisync-ai-99b95",
  storageBucket: "nutrisync-ai-99b95.firebasestorage.app",
  messagingSenderId: "580061502119",
  appId: "1:580061502119:web:d4139e39a4829cb6c11982"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);