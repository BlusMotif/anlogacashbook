// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, get, connectDatabaseEmulator } from "firebase/database";
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