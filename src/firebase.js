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
    console.log('🔍 Testing Firebase database connection...');
    console.log('📡 Checking connection status...');

    const connectedRef = ref(db, '.info/connected');
    const snapshot = await get(connectedRef);
    const isConnected = snapshot.val();

    console.log('📊 Connection status:', isConnected ? '✅ Connected' : '❌ Disconnected');

    if (!isConnected) {
      console.error('❌ Database is disconnected. Possible causes:');
      console.error('   - Network connectivity issues');
      console.error('   - Firebase project billing/quota exceeded');
      console.error('   - Firebase project disabled');
      console.error('   - Invalid API keys or configuration');
      return false;
    }

    // Test reading from the database root
    console.log('📖 Testing database read access...');
    const rootRef = ref(db);
    const rootSnapshot = await get(rootRef);
    console.log('📁 Database root accessible:', rootSnapshot.exists() ? '✅ Yes' : '⚠️ No data found');

    // Test writing to a test location
    console.log('✏️ Testing database write access...');
    const testRef = ref(db, 'connection_test');
    const testData = {
      timestamp: Date.now(),
      message: 'Connection test successful'
    };

    await set(testRef, testData);
    console.log('💾 Write test successful');

    // Clean up test data
    await set(testRef, null);
    console.log('🧹 Test data cleaned up');

    console.log('🎉 All database tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    console.error('🔍 Error details:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);

    // Common Firebase error codes and solutions
    switch (error.code) {
      case 'PERMISSION_DENIED':
        console.error('💡 Solution: Check Firebase security rules and authentication');
        break;
      case 'UNAVAILABLE':
        console.error('💡 Solution: Check network connection and Firebase service status');
        break;
      case 'QUOTA_EXCEEDED':
        console.error('💡 Solution: Check Firebase billing and usage limits');
        break;
      case 'PROJECT_NOT_FOUND':
        console.error('💡 Solution: Verify Firebase project ID and configuration');
        break;
      default:
        console.error('💡 Solution: Check Firebase console for project status and configuration');
    }

    return false;
  }
};

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