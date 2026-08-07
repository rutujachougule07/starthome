// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBDSNnjJZgy62vI9whs0DXG3mxhJclDynk",
    authDomain: "smart-d00eb.firebaseapp.com",
    projectId: "smart-d00eb",
    storageBucket: "smart-d00eb.firebasestorage.app",
    messagingSenderId: "583380850367",
    appId: "1:583380850367:web:1564395a75f7e5297e180a",
    measurementId: "G-MDB5X9V0DH"
};

import { getAuth } from "firebase/auth";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and export it
export const db = getFirestore(app);

// Initialize Firebase Auth and export it
export const auth = getAuth(app);

// Safe Analytics check for SSR
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}