import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging and export a promise resolving to messaging 
// only if it's supported (browsers that support Push APIs)
export const messagingPromise = isSupported().then(supported => {
  if (supported) {
    return getMessaging(app);
  }
  return null;
});
