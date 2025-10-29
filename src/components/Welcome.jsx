import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white bg-opacity-10 backdrop-blur-lg p-12 rounded-2xl shadow-2xl w-full max-w-lg border border-white border-opacity-20 text-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src="/logo.png"
            alt="Anloga Ambulance Station"
            className="h-20 mx-auto mb-6"
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        {/* Welcome Content */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome Back!
          </h1>
          <p className="text-xl text-white text-opacity-90 mb-2">
            Anloga Ambulance Cashbook System
          </p>
          <p className="text-white text-opacity-80">
            Timely Care Saves Lives
          </p>
        </div>

        {/* Loading Animation */}
        <div className="mb-8">
          <div className="flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-white text-opacity-70 text-sm mt-4">
            Redirecting to dashboard...
          </p>
        </div>

        {/* Manual Continue Button */}
        <button
          onClick={handleContinue}
          className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-500 hover:to-emerald-600 transition duration-300 shadow-lg"
        >
          Continue to Dashboard
        </button>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-white border-opacity-20">
          <p className="text-white text-opacity-60 text-sm">
            © 2025 Anloga Ambulance Station
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
