import * as admin from 'firebase-admin';

const initializeAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  try {
    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson) {
      console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is not set. Push notifications will not work.');
      return null;
    }

    // Strip wrapping single or double quotes if present (common .env.local issue)
    serviceAccountJson = serviceAccountJson.trim();
    if (
      (serviceAccountJson.startsWith("'") && serviceAccountJson.endsWith("'")) ||
      (serviceAccountJson.startsWith('"') && serviceAccountJson.endsWith('"'))
    ) {
      serviceAccountJson = serviceAccountJson.slice(1, -1);
    }

    let serviceAccount = JSON.parse(serviceAccountJson);

    // Handle double-stringified JSON
    if (typeof serviceAccount === 'string') {
      serviceAccount = JSON.parse(serviceAccount);
    }

    if (serviceAccount.private_key) {
      // Fix all escaping levels:
      // \\\\n (4 backslashes) → \\n (2) → \n (real newline)
      let key = serviceAccount.private_key;
      // Keep replacing until no more literal backslash-n remain
      while (key.includes('\\n')) {
        key = key.replace(/\\n/g, '\n');
      }
      serviceAccount.private_key = key;
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    return null;
  }
};

export const adminApp = initializeAdmin();
export const messaging = adminApp ? admin.messaging() : null;
