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

// Check network connectivity
export const checkNetworkConnectivity = async () => {
  try {
    // Test basic internet connectivity
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
};

// Enhanced error handler for Firebase operations
export const handleFirebaseError = (error, operation = 'operation') => {
  console.error(`Firebase ${operation} error:`, error);

  let errorTitle = 'Database Error';
  let errorMessage = `Failed to complete ${operation}. Please try again.`;

  if (error.code === 'PERMISSION_DENIED') {
    errorTitle = 'Access Denied';
    errorMessage = 'You do not have permission to perform this action.';
  } else if (error.code === 'NETWORK_ERROR' ||
             error.message?.includes('network') ||
             error.message?.includes('connection') ||
             error.message?.includes('ERR_CONNECTION_CLOSED')) {
    errorTitle = 'Connection Problem';
    errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
  } else if (error.code === 'UNAVAILABLE') {
    errorTitle = 'Service Unavailable';
    errorMessage = 'The service is temporarily unavailable. Please try again later.';
  } else if (error.code === 'NOT_FOUND') {
    errorTitle = 'Data Not Found';
    errorMessage = 'The requested data could not be found.';
  } else if (error.code === 'ALREADY_EXISTS') {
    errorTitle = 'Duplicate Entry';
    errorMessage = 'This entry already exists.';
  }

  return { errorTitle, errorMessage };
};