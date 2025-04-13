import { cert, initializeApp, App, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Initialize Firebase Admin with explicit types
let adminApp: App;

try {
  // Debug log to verify environment variable
  console.log('Service account key loaded:', 
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 20) + '...');

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
  }

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  // Initialize only if not already initialized
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    adminApp = getApps()[0];
    console.log('✅ Using existing Firebase Admin instance');
  }

} catch (error) {
  console.error('🔥 Firebase Admin initialization failed:', error);
  throw error;
}

// Initialize services with explicit types and new export names
const adminDb: Firestore = getFirestore(adminApp);
const adminAuth: Auth = getAuth(adminApp);

// Export initialized services with more explicit names
export { adminDb, adminAuth };
export default adminApp;