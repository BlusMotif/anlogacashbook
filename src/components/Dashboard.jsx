import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import SummaryCards from './SummaryCards';
import CashbookForm from './CashbookForm';
import CashbookTable from './CashbookTable';
import Settings from './Settings';

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div>
            <SummaryCards />
            <div className="mt-8">
              <CashbookForm />
            </div>
          </div>
        );
      case 'entries':
        return <CashbookTable />;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        <div className="flex items-center justify-center h-16 bg-gradient-to-r from-green-600 to-emerald-600">
          <img src="/logo.png" alt="Anloga Ambulance Station" className="h-10" onError={(e) => e.target.style.display = 'none'} />
          <h1 className="text-white text-lg font-bold ml-2">Anloga Ambulance</h1>
        </div>
        <nav className="mt-8">
          <div className="px-4 py-2 text-gray-600 font-medium">Navigation</div>
          <button
            onClick={() => { setCurrentPage('dashboard'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${currentPage === 'dashboard' ? 'bg-green-100 text-green-700' : 'text-gray-700'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setCurrentPage('entries'); setSidebarOpen(false); }}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${currentPage === 'entries' ? 'bg-green-100 text-green-700' : 'text-gray-700'}`}
          >
            Your Entries
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
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 h-full">
          {/* Mobile Header */}
          <div className="block lg:hidden mb-6">
            <div className="flex items-center justify-between mb-4">
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
            <div className="text-center mb-4">
              <img src="/logo.png" alt="Anloga Ambulance Station" className="h-12 mx-auto mb-3" onError={(e) => e.target.style.display = 'none'} />
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {currentPage === 'dashboard' ? 'Anloga Ambulance Cashbook System' :
                 currentPage === 'entries' ? 'Your Entries' :
                 'Settings'}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">Timely Care Saves Lives</p>
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
                  {currentPage === 'dashboard' ? 'Anloga Ambulance Cashbook System' :
                   currentPage === 'entries' ? 'Your Entries' :
                   'Settings'}
                </span>
              </h1>
              <p className="text-gray-600 mt-2">Timely Care Saves Lives</p>
            </div>
            <div></div> {/* Spacer */}
          </div>

          {/* Content */}
          <div className="space-y-6 sm:space-y-8">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;