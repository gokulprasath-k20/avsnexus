import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Make sure to set FIREBASE_SERVICE_ACCOUNT_KEY in your environment variables
// It should be a stringified JSON of your service account key
const initializeAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountJson) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Push notifications will not work.');
      return null;
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin', error);
    return null;
  }
};

export const adminApp = initializeAdmin();
export const messaging = adminApp ? admin.messaging() : null;
