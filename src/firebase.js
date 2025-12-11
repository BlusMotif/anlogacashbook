// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, connectDatabaseEmulator } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Test database connection
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing Firebase database connection...');
    const testRef = ref(db, '.info/connected');
    const snapshot = await get(testRef);
    const isConnected = snapshot.val();
    console.log('Database connection status:', isConnected);

    // Test reading from the database root
    console.log('Testing database read access...');
    const rootRef = ref(db);
    const rootSnapshot = await get(rootRef);
    console.log('Database root accessible:', rootSnapshot.exists());
    console.log('Database root data:', rootSnapshot.val());

    return isConnected;
  } catch (error) {
    console.error('Database connection test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    return false;
  }
};