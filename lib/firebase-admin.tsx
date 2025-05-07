import admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    console.log('Firebase Admin SDK already initialized');
    return admin.apps[0]!;
  }

  try {
    console.log('Initializing Firebase Admin SDK...');
    console.log('Environment variables:', {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'Not set',
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'Not set',
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? 'Set (hidden for security)' : 'Not set',
    });

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('Missing Firebase Admin SDK environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY');
    }

    // Log the processed private key (first few characters for debugging)
    const processedPrivateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    console.log('Processed FIREBASE_PRIVATE_KEY (first 50 chars):', processedPrivateKey.substring(0, 50));

    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: processedPrivateKey,
      }),
    });

    console.log('Firebase Admin SDK initialized successfully');
    return app;
  } catch (error) {
    console.error('Firebase Admin SDK initialization error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

// Initialize the Firebase Admin SDK
const app = initializeFirebaseAdmin();

export const adminAuth = app.auth();
export const adminDb = app.firestore();