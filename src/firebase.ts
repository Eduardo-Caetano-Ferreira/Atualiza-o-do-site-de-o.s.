import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('TODO')) {
  console.error("Firebase configuration is missing or contains placeholder values. Please check firebase-applet-config.json.");
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
