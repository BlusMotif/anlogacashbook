// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBQWRHpDxxkPu9lu9W5NF39vfo89mFtafI",
  authDomain: "anlogacashbook.firebaseapp.com",
  databaseURL: "https://anlogacashbook-default-rtdb.firebaseio.com",
  projectId: "anlogacashbook",
  storageBucket: "anlogacashbook.firebasestorage.app",
  messagingSenderId: "575478946401",
  appId: "1:575478946401:web:807b86b247519d7ad8a820",
  measurementId: "G-VG29026N10"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);