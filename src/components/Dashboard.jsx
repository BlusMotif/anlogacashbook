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

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('welcome');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
      if (savedPage) {
        setCurrentPage(savedPage);
      }
    } catch (error) {
      // localStorage not available (private browsing, disabled, etc.)
      console.warn('localStorage not available for page persistence');
    }
  }, []);

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
    await signOut(auth);
    navigate('/');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'welcome':
        return (
          <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center px-4 py-8`}>
            <div className="w-full max-w-6xl mx-auto">
              {/* Welcome Message */}
              <div className="text-center mb-16">
                <p className={`text-lg ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto leading-relaxed`}>
                  Choose your preferred management system to efficiently track and manage your financial operations.
                </p>
              </div>

              {/* System Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 max-w-4xl mx-auto px-4 sm:px-6">
                {/* Fuel Support System */}
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
                      <svg className={`w-8 h-8 sm:w-10 sm:h-10 ${theme === 'dark' ? 'text-gray-300' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>
                      Fuel Support System
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed px-2`}>
                      Manage fuel-related financial transactions and track expenses with real-time balance calculations.
                    </p>
                    <button
                      onClick={() => setCurrentPageAndSave('dashboard')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-semibold text-base sm:text-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Access Fuel Support
                    </button>
                  </div>
                </div>

                {/* GOCARD System */}
                <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                  <div className="text-center">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
                      <svg className={`w-8 h-8 sm:w-10 sm:h-10 ${theme === 'dark' ? 'text-gray-300' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>
                      GOCARD System
                    </h3>
                    <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed px-2`}>
                      Track GOCARD transactions with detailed merchant and attendant information for comprehensive records.
                    </p>
                    <button
                      onClick={() => setCurrentPageAndSave('go-card-dashboard')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-lg font-semibold text-base sm:text-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Access GOCARD
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 space-y-6 sm:space-y-8">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>Welcome to Fuel Support Dashboard</h2>
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
              <h2 className={`text-2xl sm:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-2`}>Welcome to GOCARD Dashboard</h2>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-sm sm:text-base px-4`}>Choose a section to manage your GOCARD operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-sm sm:max-w-2xl mx-auto px-4">
              {/* GOCARD Form Button */}
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
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">GOCARD Form</h3>
                  <p className="text-xs sm:text-sm opacity-90">Add new GOCARD entries</p>
                </div>
              </button>

              {/* GOCARD Entries Button */}
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
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1 sm:mb-2">GOCARD Entries</h3>
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
                Back to GOCARD Dashboard
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
                Back to GOCARD Dashboard
              </button>
            </div>
            <GoCardTable />
          </div>
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
          <img src="/logo.png" alt="Anloga Ambulance Station" className="h-10" onError={(e) => e.target.style.display = 'none'} />
          <h1 className="text-white text-lg font-bold ml-2">Anloga Ambulance</h1>
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
            Fuel Support Dashboard
          </button>
          <button
            onClick={() => { setCurrentPageAndSave('go-card-dashboard'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} ${currentPage === 'go-card-dashboard' ? (theme === 'dark' ? 'bg-gray-700 text-green-400' : 'bg-green-100 text-green-700') : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}`}
          >
            GOCARD Dashboard
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
            {/* Top Row: Hamburger + Theme Toggle */}
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

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

            {/* Centered Logo and Title */}
            <div className="text-center mb-3 sm:mb-4">
              <img src="/logo.png" alt="Anloga Ambulance Station" className="h-10 sm:h-12 mx-auto mb-2 sm:mb-3" onError={(e) => e.target.style.display = 'none'} />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {currentPage === 'welcome' ? 'Welcome' :
                 currentPage === 'dashboard' ? 'Fuel Support Dashboard' :
                 currentPage === 'fuel-support' ? 'Fuel Support' :
                 currentPage === 'entries' ? 'Your Entries' :
                 currentPage === 'go-card-dashboard' ? 'GOCARD Dashboard' :
                 currentPage === 'go-card-form' ? 'GOCARD Form' :
                 currentPage === 'go-card-entries' ? 'GOCARD Entries' :
                 'Settings'}
              </h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} text-xs sm:text-sm lg:text-base mt-1`}>Timely Care Saves Lives</p>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-md ${theme === 'dark' ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-green-500`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center justify-center">
                <img src="/logo.png" alt="Anloga Ambulance Station" className="h-12 mr-4" onError={(e) => e.target.style.display = 'none'} />
                <span>
                  {currentPage === 'welcome' ? 'Welcome' :
                   currentPage === 'dashboard' ? 'Fuel Support Dashboard' :
                   currentPage === 'fuel-support' ? 'Fuel Support' :
                   currentPage === 'entries' ? 'Your Entries' :
                   currentPage === 'go-card-dashboard' ? 'GOCARD Dashboard' :
                   currentPage === 'go-card-form' ? 'GOCARD Form' :
                   currentPage === 'go-card-entries' ? 'GOCARD Entries' :
                   'Settings'}
                </span>
              </h1>
              <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mt-2`}>Timely Care Saves Lives</p>
            </div>
            <div className="flex items-center">
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