// lib/firebase/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD8FirgrvJ4Uvnq4l3Oi9bGg2Vvb0mkE5c",
  authDomain: "event-sphere-a1939.firebaseapp.com",
  projectId: "event-sphere-a1939",
  storageBucket: "event-sphere-a1939.appspot.com",
  messagingSenderId: "44376973512",
  appId: "1:44376973512:web:04a67d11c95a91d22385fd",
  measurementId: "G-384YR1RGKD"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);