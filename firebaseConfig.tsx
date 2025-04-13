// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8FirgrvJ4Uvnq4l3Oi9bGg2Vvb0mkE5c",
  authDomain: "event-sphere-a1939.firebaseapp.com",
  projectId: "event-sphere-a1939",
  storageBucket: "event-sphere-a1939.firebasestorage.app",
  messagingSenderId: "44376973512",
  appId: "1:44376973512:web:04a67d11c95a91d22385fd",
  measurementId: "G-384YR1RGKD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth();
export const db=getFirestore(app);
export default app;


let analytics;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}