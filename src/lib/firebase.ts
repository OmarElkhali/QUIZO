import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD_dCI8kVmfIAhW52qPC6wK-zawdx6nmMk",
  authDomain: "ests-quiz.firebaseapp.com",
  projectId: "ests-quiz",
  storageBucket: "ests-quiz.firebasestorage.app",
  messagingSenderId: "520344746317",
  appId: "1:520344746317:web:6be8fd307eea9222b61f04",
  measurementId: "G-MYDPS4XE5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);

export default app;
