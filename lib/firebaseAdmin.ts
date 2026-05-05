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

    let serviceAccount = JSON.parse(serviceAccountJson);
    if (typeof serviceAccount === 'string') {
      serviceAccount = JSON.parse(serviceAccount);
    }

    if (serviceAccount.private_key) {
      // The most reliable way to fix the key from env vars
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

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
