// Firebase Admin SDK Configuration
// Server-side Firebase operations

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')!
  };

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  });
}

// Initialize admin app
const adminApp = initializeFirebaseAdmin();

// Export admin services
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);

// Helper functions for server-side operations

/**
 * Verify a user's custom claims
 */
export async function verifyUserClaims(uid: string) {
  try {
    const user = await adminAuth.getUser(uid);
    return user.customClaims || {};
  } catch (error) {
    console.error('Error verifying user claims:', error);
    return {};
  }
}

/**
 * Set custom claims for a user
 */
export async function setUserClaims(uid: string, claims: Record<string, any>) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Error setting user claims:', error);
    return false;
  }
}

/**
 * Create a custom token for a user
 */
export async function createCustomToken(uid: string, additionalClaims?: Record<string, any>) {
  try {
    return await adminAuth.createCustomToken(uid, additionalClaims);
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw error;
  }
}

/**
 * Delete a user from Firebase Auth
 */
export async function deleteUser(uid: string) {
  try {
    await adminAuth.deleteUser(uid);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

/**
 * Batch write to Firestore
 */
export async function batchWrite(operations: Array<{
  type: 'set' | 'update' | 'delete';
  path: string;
  data?: any;
}>) {
  const batch = adminDb.batch();

  operations.forEach(op => {
    const ref = adminDb.doc(op.path);
    switch (op.type) {
      case 'set':
        batch.set(ref, op.data);
        break;
      case 'update':
        batch.update(ref, op.data);
        break;
      case 'delete':
        batch.delete(ref);
        break;
    }
  });

  return await batch.commit();
}

export default adminApp;