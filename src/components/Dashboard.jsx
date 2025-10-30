import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import SummaryCards from './SummaryCards';
import CashbookForm from './CashbookForm';
import CashbookTable from './CashbookTable';
import GoCardForm from './GoCardForm';
import GoCardTable from './GoCardTable';
import Settings from './Settings';

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('welcome');

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'welcome':
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-6xl mx-auto">
              {/* Welcome Message */}
              <div className="text-center mb-16">
                <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  Choose your preferred management system to efficiently track and manage your financial operations.
                </p>
              </div>

              {/* System Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
                {/* Fuel Support System */}
                <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      Fuel Support System
                    </h3>
                    <p className="text-gray-600 text-base mb-8 leading-relaxed">
                      Manage fuel-related financial transactions and track expenses with real-time balance calculations.
                    </p>
                    <button
                      onClick={() => setCurrentPage('dashboard')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Access Fuel Support
                    </button>
                  </div>
                </div>

                {/* Go Card System */}
                <div className="bg-white p-10 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">
                      Go Card System
                    </h3>
                    <p className="text-gray-600 text-base mb-8 leading-relaxed">
                      Track Go Card transactions with detailed merchant and attendant information for comprehensive records.
                    </p>
                    <button
                      onClick={() => setCurrentPage('go-card-dashboard')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-8 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      Access Go Card
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
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome to Fuel Support Dashboard</h2>
              <p className="text-gray-600 text-sm sm:text-base px-4">Choose a section to manage your fuel support operations</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-sm sm:max-w-2xl">
              {/* Fuel Support Button */}
              <button
                onClick={() => setCurrentPage('fuel-support')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Fuel Support</h3>
                  <p className="text-xs sm:text-sm opacity-90">View summaries and add new entries</p>
                </div>
              </button>
              
              {/* Your Entries Button */}
              <button
                onClick={() => setCurrentPage('entries')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Your Entries</h3>
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
                onClick={() => setCurrentPage('dashboard')}
                className="flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
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
                onClick={() => setCurrentPage('dashboard')}
                className="flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
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
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Welcome to Go Card Dashboard</h2>
              <p className="text-gray-600 text-sm sm:text-base px-4">Choose a section to manage your Go Card operations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-sm sm:max-w-2xl">
              {/* Go Card Form Button */}
              <button
                onClick={() => setCurrentPage('go-card-form')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Go Card Form</h3>
                  <p className="text-xs sm:text-sm opacity-90">Add new Go Card entries</p>
                </div>
              </button>

              {/* Go Card Entries Button */}
              <button
                onClick={() => setCurrentPage('go-card-entries')}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2">Go Card Entries</h3>
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
                onClick={() => setCurrentPage('go-card-dashboard')}
                className="flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Go Card Dashboard
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
                onClick={() => setCurrentPage('go-card-dashboard')}
                className="flex items-center text-green-600 hover:text-green-700 font-medium mb-4"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Go Card Dashboard
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
    <div className="h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-green-600 to-emerald-600">
          <img src="/logo.png" alt="Anloga Ambulance Station" className="h-10" onError={(e) => e.target.style.display = 'none'} />
          <h1 className="text-white text-lg font-bold ml-2">Anloga Ambulance</h1>
        </div>
        <nav className="mt-8">
          <div className="px-4 py-2 text-gray-600 font-medium">Navigation</div>
          <button
            onClick={() => { setCurrentPage('welcome'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${currentPage === 'welcome' ? 'bg-green-100 text-green-700' : 'text-gray-700'}`}
          >
            Welcome
          </button>
          <button
            onClick={() => { setCurrentPage('dashboard'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${currentPage === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-700'}`}
          >
            Fuel Support Dashboard
          </button>
          <button
            onClick={() => { setCurrentPage('go-card-dashboard'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${currentPage === 'go-card-dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-700'}`}
          >
            Go Card Dashboard
          </button>
          <button
            onClick={() => { setCurrentPage('settings'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${currentPage === 'settings' ? 'bg-green-100 text-green-700' : 'text-gray-700'}`}
          >
            Settings
          </button>
          <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100">Logout</button>
        </nav>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 h-full overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-6 xl:py-8 h-full">
          {/* Mobile Header */}
          <div className="block lg:hidden mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="6" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="12" cy="18" r="2"/>
                </svg>
              </button>
            </div>

            {/* Mobile Layout: Logo above title */}
            <div className="text-center mb-3 sm:mb-4">
              <img src="/logo.png" alt="Anloga Ambulance Station" className="h-10 sm:h-12 mx-auto mb-2 sm:mb-3" onError={(e) => e.target.style.display = 'none'} />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {currentPage === 'welcome' ? 'Welcome' :
                 currentPage === 'dashboard' ? 'Fuel Support Dashboard' :
                 currentPage === 'fuel-support' ? 'Fuel Support' :
                 currentPage === 'entries' ? 'Your Entries' :
                 currentPage === 'go-card-dashboard' ? 'Go Card Dashboard' :
                 currentPage === 'go-card-form' ? 'Go Card Form' :
                 currentPage === 'go-card-entries' ? 'Go Card Entries' :
                 'Settings'}
              </h1>
              <p className="text-gray-600 text-xs sm:text-sm lg:text-base mt-1">Timely Care Saves Lives</p>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="6" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="12" cy="18" r="2"/>
              </svg>
            </button>
            <div className="text-center flex-1">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center justify-center">
                <img src="/logo.png" alt="Anloga Ambulance Station" className="h-12 mr-4" onError={(e) => e.target.style.display = 'none'} />
                <span>
                  {currentPage === 'welcome' ? 'Welcome' :
                   currentPage === 'dashboard' ? 'Fuel Support Dashboard' :
                   currentPage === 'fuel-support' ? 'Fuel Support' :
                   currentPage === 'entries' ? 'Your Entries' :
                   currentPage === 'go-card-dashboard' ? 'Go Card Dashboard' :
                   currentPage === 'go-card-form' ? 'Go Card Form' :
                   currentPage === 'go-card-entries' ? 'Go Card Entries' :
                   'Settings'}
                </span>
              </h1>
              <p className="text-gray-600 mt-2">Timely Care Saves Lives</p>
            </div>
            <div></div> {/* Spacer */}
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