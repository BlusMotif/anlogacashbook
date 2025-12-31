import React, { useState } from 'react';
import { testDatabaseConnection } from '../firebase';
import { useTheme } from '../ThemeContext';

const DatabaseConnectionTest = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const { theme } = useTheme();

  const runConnectionTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testDatabaseConnection();
      setTestResult({
        success: result,
        message: result ? 'Database connection is working!' : 'Database connection failed. Check console for details.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: `Test failed: ${error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${
      theme === 'dark'
        ? 'bg-gray-800 border-gray-600'
        : 'bg-white border-gray-300'
    }`}>
      <h3 className={`text-lg font-semibold mb-3 ${
        theme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        🔍 Database Connection Test
      </h3>

      <button
        onClick={runConnectionTest}
        disabled={isTesting}
        className={`px-4 py-2 rounded-lg font-medium ${
          isTesting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isTesting ? '🧪 Testing...' : 'Test Database Connection'}
      </button>

      {testResult && (
        <div className={`mt-3 p-3 rounded-lg ${
          testResult.success
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          <p className="font-medium">
            {testResult.success ? '✅ Success' : '❌ Failed'}
          </p>
          <p>{testResult.message}</p>
        </div>
      )}

      <div className={`mt-3 text-sm ${
        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
      }`}>
        <p><strong>💡 Troubleshooting Tips:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Check your internet connection</li>
          <li>Verify Firebase project is active in Firebase Console</li>
          <li>Check if billing/quota limits are exceeded</li>
          <li>Ensure API keys are correct in .env file</li>
          <li>Open browser developer tools (F12) and check Console tab for errors</li>
        </ul>
      </div>
    </div>
  );
};

export default DatabaseConnectionTest;