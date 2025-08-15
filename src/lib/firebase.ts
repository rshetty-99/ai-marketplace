import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && !globalThis.__FIREBASE_EMULATOR_CONNECTED) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectStorageEmulator(storage, 'localhost', 9199);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    globalThis.__FIREBASE_EMULATOR_CONNECTED = true;
  } catch (error) {
    console.warn('Firebase emulator connection failed:', error);
  }
}

export default app;

// Admin SDK for server-side operations (API routes only)
let adminDb: any = null;
let adminAuth: any = null;

export const getAdminDb = async () => {
  if (!adminDb && typeof window === 'undefined') {
    try {
      const admin = (await import('firebase-admin')).default;
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
          databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`,
        });
      }
      
      adminDb = admin.firestore();
      adminAuth = admin.auth();
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error('Firebase Admin SDK initialization failed');
    }
  }
  return adminDb;
};

export const getAdminAuth = async () => {
  if (!adminAuth) await getAdminDb();
  return adminAuth;
};

// Type declarations for global Firebase emulator state
declare global {
  var __FIREBASE_EMULATOR_CONNECTED: boolean | undefined;
}