/**
 * firebase-config.js — Firebase project initialization.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  BEFORE THIS FILE WILL WORK, YOU NEED TO DO 3 THINGS:          ║
 * ║                                                                  ║
 * ║  STEP 1: Create a Firebase project                              ║
 * ║   → Go to https://console.firebase.google.com                   ║
 * ║   → Click "Add project" and follow the wizard.                  ║
 * ║   → Once created, click the </> (Web) icon to register a       ║
 * ║     web app. Firebase will show you a config object — copy      ║
 * ║     those values into the firebaseConfig object below.          ║
 * ║                                                                  ║
 * ║  STEP 2: Enable Email/Password Authentication                   ║
 * ║   → In your Firebase console, go to Authentication → Sign-in   ║
 * ║     method → Email/Password → Enable it → Save.                ║
 * ║                                                                  ║
 * ║  STEP 3: Create a Cloud Firestore database                      ║
 * ║   → In your Firebase console, go to Firestore Database.         ║
 * ║   → Click "Create database".                                    ║
 * ║   → Choose "Start in test mode" (for development only).         ║
 * ║   → Pick a region close to India (e.g., asia-south1).          ║
 * ║                                                                  ║
 * ║  After all 3 steps, replace the placeholder strings below       ║
 * ║  with YOUR actual Firebase project values.                      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

// ─── Firebase configuration object ─────────────────────────────
// Replace each "YOUR_..." value with the real value from your
// Firebase console → Project settings → Your apps → Config.
const firebaseConfig = {
  apiKey: "AIzaSyC_n4V2Pn1Qu61osD95XddaNuxxZSVwYbw", // Looks like "AIzaSy..."
  authDomain: "infosyssb-501215.firebaseapp.com",
  projectId: "infosyssb-501215", // e.g., "sakshar-ai-12345"
  storageBucket: "infosyssb-501215.firebasestorage.app",
  messagingSenderId: "506576411881", // A number like "123456789"
  appId: "1:506576411881:web:a50036b0c20e876505e478", // Looks like "1:123:web:abc..."
};

// ─── Initialize Firebase ────────────────────────────────────────
// firebase.initializeApp() connects our web page to the Firebase project.
// After this line, we can use firebase.auth() and firebase.firestore().
firebase.initializeApp(firebaseConfig);

// ─── Enable Firestore offline persistence (PWA) ────────────────
firebase
  .firestore()
  .enablePersistence()
  .catch(function (err) {
    console.warn("Persistence not enabled:", err.code);
  });

// ─── Create shorthand references ────────────────────────────────
// We create these constants so we don't have to type "firebase.auth()"
// every single time — just "auth" and "db" is cleaner and shorter.
const auth = firebase.auth(); // For login and registration
const db = firebase.firestore(); // For reading/writing user profiles
