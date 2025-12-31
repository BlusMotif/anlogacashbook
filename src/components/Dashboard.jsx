import React, { useState, useEffect } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../ThemeContext';
import SummaryCards from './SummaryCards';
import CashbookForm from './CashbookForm';
import CashbookTable from './CashbookTable';
import GoCardForm from './GoCardForm';
import GoCardTable from './GoCardTable';
import Settings from './Settings';
import StandbyForm from './StandbyForm';
import StandbyTable from './StandbyTable';
import AssetRegisterForm from './AssetRegisterForm';
import AssetRegisterTable from './AssetRegisterTable';
import EquipmentChecklistForm from './EquipmentChecklistForm';
import EquipmentChecklistTable from './EquipmentChecklistTable';
import VehicleInspectionForm from './VehicleInspectionForm';
import VehicleInspectionTable from './VehicleInspectionTable';

const StandbyDashboard = () => {
  const [editingEntry, setEditingEntry] = useState(null);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <StandbyForm editingEntry={editingEntry} onCancelEdit={handleCancelEdit} />
      <StandbyTable onEdit={handleEdit} />
    </div>
  );
};

const AssetRegisterDashboard = () => {
  const [editingEntry, setEditingEntry] = useState(null);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <AssetRegisterForm editingEntry={editingEntry} onCancelEdit={handleCancelEdit} />
      <AssetRegisterTable onEdit={handleEdit} />
    </div>
  );
};

const EquipmentChecklistDashboard = () => {
  const [editingEntry, setEditingEntry] = useState(null);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <EquipmentChecklistForm editingEntry={editingEntry} onCancelEdit={handleCancelEdit} />
      <EquipmentChecklistTable onEdit={handleEdit} />
    </div>
  );
};

const VehicleInspectionDashboard = () => {
  const [editingEntry, setEditingEntry] = useState(null);

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <VehicleInspectionForm editingEntry={editingEntry} onCancelEdit={handleCancelEdit} />
      <VehicleInspectionTable onEdit={handleEdit} />
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Inactivity timeout - 10 minutes
  useEffect(() => {
    let timeoutId;
    const TIMEOUT_DURATION = 600000; // 10 minutes in milliseconds

    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        if (user) {
          // Clear saved page state
          try {
            localStorage.removeItem('currentPage');
          } catch (error) {
            console.warn('Could not clear localStorage');
          }
          // Sign out user
          signOut(auth).then(() => {
            navigate('/', { replace: true });
          });
        }
      }, TIMEOUT_DURATION);
    };

    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeout);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, [user, navigate]);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Clear any saved page state and always start with welcome page on login
        try {
          localStorage.removeItem('currentPage');
        } catch (error) {
          console.warn('Could not clear localStorage');
        }
        setCurrentPage('welcome');
      } else {
        // User is not authenticated, redirect to login
        navigate('/', { replace: true });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load saved page from localStorage on component mount
  useEffect(() => {
    try {
      const savedPage = localStorage.getItem('currentPage');
      if (savedPage && user) {
        setCurrentPage(savedPage);
      }
    } catch (error) {
      // localStorage not available (private browsing, disabled, etc.)
      console.warn('localStorage not available for page persistence');
    }
  }, [user]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-emerald-600 to-teal-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Function to set current page and save to localStorage
  const setCurrentPageAndSave = (page) => {
    setCurrentPage(page);
    try {
      localStorage.setItem('currentPage', page);
    } catch (error) {
      // localStorage not available (private browsing, disabled, etc.)
      console.warn('localStorage not available for page persistence');
    }
  };

  const handleLogout = async () => {
    // Clear saved page state before logout
    try {
      localStorage.removeItem('currentPage');
    } catch (error) {
      console.warn('Could not clear localStorage');
    }
    await signOut(auth);
    navigate('/');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'welcome':
        return (
          <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50'} px-4 py-12`}>
            <div className="w-full max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12 animate-fade-in">
                <div className="mb-6">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${theme === 'dark' ? 'bg-green-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'} mb-4 shadow-xl`}>
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <p className={`text-xl md:text-2xl font-semibold mb-3 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  Management System Dashboard
                </p>
                <p className={`text-base md:text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto leading-relaxed`}>
                  Comprehensive tools to efficiently manage operations, track resources, and maintain records
                </p>
              </div>

              {/* System Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {/* Fuel Support System */}
                <div 
                  onClick={() => setCurrentPageAndSave('dashboard')}
                  className={`group cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} p-8 rounded-2xl shadow-lg border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-green-500`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-green-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-green-600 transition-colors`}>
                      Fuel Support
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed mb-5`}>
                      Track fuel transactions, expenses, and maintain real-time balance calculations
                    </p>
                    <div className={`flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} group-hover:translate-x-2 transition-transform duration-300`}>
                      <span>Open System</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Gocard System */}
                <div 
                  onClick={() => setCurrentPageAndSave('go-card-dashboard')}
                  className={`group cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} p-8 rounded-2xl shadow-lg border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-green-500`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-green-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-green-600 transition-colors`}>
                      Gocard
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed mb-5`}>
                      Manage Gocard transactions with merchant and attendant details
                    </p>
                    <div className={`flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} group-hover:translate-x-2 transition-transform duration-300`}>
                      <span>Open System</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Standby System */}
                <div 
                  onClick={() => setCurrentPageAndSave('standby')}
                  className={`group cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} p-8 rounded-2xl shadow-lg border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-green-500`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-green-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-green-600 transition-colors`}>
                      Standby
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed mb-5`}>
                      Track standby operations with watch assignments and locations
                    </p>
                    <div className={`flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} group-hover:translate-x-2 transition-transform duration-300`}>
                      <span>Open System</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Asset Register System */}
                <div 
                  onClick={() => setCurrentPageAndSave('asset-register')}
                  className={`group cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} p-8 rounded-2xl shadow-lg border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-green-500`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-green-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-green-600 transition-colors`}>
                      Asset Register
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed mb-5`}>
                      Manage station assets with detailed records and condition monitoring
                    </p>
                    <div className={`flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} group-hover:translate-x-2 transition-transform duration-300`}>
                      <span>Open System</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Equipment Checklist System */}
                <div 
                  onClick={() => setCurrentPageAndSave('equipment-checklist')}
                  className={`group cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} p-8 rounded-2xl shadow-lg border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-green-500`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-green-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-green-600 transition-colors`}>
                      Medical Equipment
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed mb-5`}>
                      Comprehensive checklist for medical equipment shift inspections
                    </p>
                    <div className={`flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} group-hover:translate-x-2 transition-transform duration-300`}>
                      <span>Open System</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Vehicle Inspection System */}
                <div 
                  onClick={() => setCurrentPageAndSave('vehicle-inspection')}
                  className={`group cursor-pointer ${theme === 'dark' ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'} p-8 rounded-2xl shadow-lg border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-green-500`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${theme === 'dark' ? 'bg-green-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-green-600 transition-colors`}>
                      Vehicle Inspection
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm leading-relaxed mb-5`}>
                      Comprehensive vehicle inspection checklist for shift handovers
                    </p>
                    <div className={`flex items-center justify-center text-sm font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'} group-hover:translate-x-2 transition-transform duration-300`}>
                      <span>Open System</span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Info */}
              <div className="text-center mt-12">
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select a system above to begin managing your operations
                </p>
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 space-y-6 sm:space-y-8">
            <div className="text-center mb-6 sm:mb-8">
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base px-4`}>Choose a section to manage your fuel support operations</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-sm sm:max-w-2xl mx-auto px-4">
              {/* Fuel Support Button */}
              <button
                onClick={() => setCurrentPageAndSave('fuel-support')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">Fuel Support</h3>
                  <p className="text-xs sm:text-sm opacity-90">View summaries and add new entries</p>
                </div>
              </button>
              
              {/* Your Entries Button */}
              <button
                onClick={() => setCurrentPageAndSave('entries')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">Your Entries</h3>
                  <p className="text-xs sm:text-sm opacity-90">View and manage all entries</p>
                </div>
              </button>
            </div>
          </div>
        );
      case 'fuel-support':
        return (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setCurrentPageAndSave('dashboard')}
                className={`flex items-center ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} font-medium mb-4`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <SummaryCards />
            <div className="mt-8">
              <CashbookForm />
            </div>
          </div>
        );
      case 'entries':
        return (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setCurrentPageAndSave('dashboard')}
                className={`flex items-center ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} font-medium mb-4`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
            <CashbookTable />
          </div>
        );
      case 'go-card-dashboard':
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 space-y-6 sm:space-y-8">
            <div className="text-center mb-6 sm:mb-8">
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base px-4`}>Choose a section to manage your Gocard operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-sm sm:max-w-2xl mx-auto px-4">
              {/* Gocard Form Button */}
              <button
                onClick={() => setCurrentPageAndSave('go-card-form')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">Gocard Form</h3>
                  <p className="text-xs sm:text-sm opacity-90">Add new Gocard entries</p>
                </div>
              </button>

              {/* Gocard Entries Button */}
              <button
                onClick={() => setCurrentPageAndSave('go-card-entries')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl lg:text-4xl mb-2 sm:mb-3 lg:mb-4">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">Gocard Entries</h3>
                  <p className="text-xs sm:text-sm opacity-90">View and manage all entries</p>
                </div>
              </button>
            </div>
          </div>
        );
      case 'go-card-form':
        return (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setCurrentPageAndSave('go-card-dashboard')}
                className={`flex items-center ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} font-medium mb-4`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Gocard Dashboard
              </button>
            </div>
            <GoCardForm />
          </div>
        );
      case 'go-card-entries':
        return (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setCurrentPageAndSave('go-card-dashboard')}
                className={`flex items-center ${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} font-medium mb-4`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Gocard Dashboard
              </button>
            </div>
            <GoCardTable />
          </div>
        );
      case 'standby':
        return (
          <StandbyDashboard />
        );
      case 'asset-register':
        return (
          <AssetRegisterDashboard />
        );
      case 'equipment-checklist':
        return (
          <EquipmentChecklistDashboard />
        );
      case 'vehicle-inspection':
        return (
          <VehicleInspectionDashboard />
        );
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className={`h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100'} flex overflow-hidden`}>
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-green-600 to-emerald-600">
          <img src="/RMS logo.png" alt="" className="h-10" onError={(e) => e.target.style.display = 'none'} />
        </div>
        <nav className="mt-8">
          <div className={`px-4 py-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Navigation</div>
          <button
            onClick={() => { setCurrentPageAndSave('welcome'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'welcome' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Welcome
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('dashboard'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'dashboard' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Fuel Support
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('go-card-dashboard'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'go-card-dashboard' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Gocard
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('standby'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'standby' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Standby
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('asset-register'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'asset-register' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Asset Register
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('equipment-checklist'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'equipment-checklist' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Equipment Checklist
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('vehicle-inspection'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'vehicle-inspection' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Vehicle Inspection
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('settings'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'settings' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            Settings
          </button>
          <button onClick={handleLogout} className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-red-400' : 'text-red-600 hover:bg-gray-100'}`}>Logout</button>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 h-full overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 xl:py-8 h-full">
          {/* Mobile Header */}
          <div className="block lg:hidden mb-4 sm:mb-6">
            {/* Top Row: Hamburger + Logo + Theme Toggle */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex flex-col items-center">
                <img src={theme === 'dark' ? "/RMS logo.png" : "/RMS logo2.png"} alt="" className="h-10 sm:h-12" onError={(e) => e.target.style.display = 'none'} />
              </div>

              <button
                onClick={toggleTheme}
                className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Page Title */}
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {currentPage === 'welcome' ? '' :
                 currentPage === 'dashboard' ? 'Fuel Support' :
                 currentPage === 'fuel-support' ? 'Fuel Support' :
                 currentPage === 'entries' ? 'Your Entries' :
                 currentPage === 'go-card-dashboard' ? 'Gocard' :
                 currentPage === 'go-card-form' ? 'Gocard Form' :
                 currentPage === 'go-card-entries' ? 'Gocard Entries' :
                 'Settings'}
              </h1>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex flex-col items-center flex-1">
              <div className="flex flex-col items-center justify-center">
                <img src={theme === 'dark' ? "/RMS logo.png" : "/RMS logo2.png"} alt="" className="h-12 mb-4" onError={(e) => e.target.style.display = 'none'} />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {currentPage === 'welcome' ? '' :
                   currentPage === 'dashboard' ? 'Fuel Support' :
                   currentPage === 'fuel-support' ? 'Fuel Support' :
                   currentPage === 'entries' ? 'Your Entries' :
                   currentPage === 'go-card-dashboard' ? 'Gocard' :
                   currentPage === 'go-card-form' ? 'Gocard Form' :
                   currentPage === 'go-card-entries' ? 'Gocard Entries' :
                   currentPage === 'standby' ? 'Standby' :
                   currentPage === 'asset-register' ? 'Asset Register' :
                   currentPage === 'equipment-checklist' ? 'Equipment Checklist' :
                   currentPage === 'vehicle-inspection' ? 'Vehicle Inspection' :
                   'Settings'}
                </h1>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-green-500`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;