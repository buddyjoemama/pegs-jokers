import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if not already initialized and config is valid
let app: FirebaseApp;
let database: Database | null = null;
let auth: Auth | null = null;

// Only initialize if we have a valid config (browser environment with env vars)
if (typeof window !== 'undefined' && firebaseConfig.projectId) {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  // Initialize Realtime Database with explicit URL
  database = getDatabase(app, firebaseConfig.databaseURL);
  
  // Initialize Firebase Authentication
  auth = getAuth(app);
} else if (typeof window === 'undefined') {
  // Server-side rendering / build time - don't initialize
  console.log('Firebase initialization skipped during build/SSR');
} else {
  console.error('Firebase configuration error: Missing projectId or other config');
}

export { database, auth };
export default app!;