import { useState, useEffect } from 'react';

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install button
      setShowInstallPrompt(true);
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Check if app is already installed
  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    
    if (standalone) {
      console.log('App is running in standalone mode (already installed)');
      setShowInstallPrompt(false);
    } else {
      console.log('App is running in browser mode');
      // In preview mode (not dev), show prompt even without beforeinstallprompt event
      if (!import.meta.env.DEV) {
        setShowInstallPrompt(true);
      }
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      alert('Install is not available in this context. Please:\n\n1. Use Chrome or Edge browser\n2. Access via HTTPS or localhost\n3. The app must not already be installed');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User ${outcome} the install prompt`);

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    // Only hide temporarily, will show again on next page load
    setShowInstallPrompt(false);
    console.log('Install prompt dismissed by user');
  };

  if (isStandalone || !showInstallPrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-lg bg-white dark:bg-gray-800 shadow-2xl rounded-lg p-4 border-2 border-blue-500 dark:border-blue-400 z-50 animate-slide-down">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-lg p-2">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            Install RMS - Records Management System
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            {deferredPrompt 
              ? "Install RMS for quick access and offline use. Works like a native app!" 
              : "Install prompt will appear when all PWA criteria are met. The app works great in your browser too!"}
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs font-medium py-2 px-3"
            >
              Not now
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InstallPWA;
