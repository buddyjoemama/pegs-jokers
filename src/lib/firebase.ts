import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validate critical config values
if (!firebaseConfig.projectId) {
  console.error('Firebase configuration error: Missing projectId');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_')));
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database with explicit URL
export const database = getDatabase(app, firebaseConfig.databaseURL);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;