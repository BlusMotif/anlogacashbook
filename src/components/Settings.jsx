import React, { useState, useEffect } from 'react';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { ref, get, set, push } from 'firebase/database';
import Swal from 'sweetalert2';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../ThemeContext';

const Settings = () => {
  const { theme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [confirmDeletePassword, setConfirmDeletePassword] = useState('');
  const [showCurrentPasswordEmail, setShowCurrentPasswordEmail] = useState(false);
  const [showCurrentPasswordUpdate, setShowCurrentPasswordUpdate] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPasswordDelete, setShowCurrentPasswordDelete] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [showConfirmDeletePassword, setShowConfirmDeletePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [backupEmail, setBackupEmail] = useState('');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [restoreFile, setRestoreFile] = useState(null);
  const [availableBackups, setAvailableBackups] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load saved backup settings
        const savedEmail = localStorage.getItem(`backup_email_${currentUser.uid}`);
        const savedAutoBackup = localStorage.getItem(`auto_backup_${currentUser.uid}`);
        const savedFrequency = localStorage.getItem(`backup_frequency_${currentUser.uid}`);
        
        if (savedEmail) setBackupEmail(savedEmail);
        if (savedAutoBackup) setAutoBackupEnabled(savedAutoBackup === 'true');
        if (savedFrequency) setBackupFrequency(savedFrequency);
        
        // Load available backups from localStorage
        loadAvailableBackups(currentUser.uid);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && autoBackupEnabled) {
      const interval = getBackupInterval();
      const backupInterval = setInterval(() => {
        performAutoBackup();
      }, interval);

      return () => clearInterval(backupInterval);
    }
  }, [user, autoBackupEnabled, backupFrequency]);

  const getBackupInterval = () => {
    switch (backupFrequency) {
      case 'hourly': return 3600000; // 1 hour
      case 'daily': return 86400000; // 24 hours
      case 'weekly': return 604800000; // 7 days
      default: return 86400000;
    }
  };

  const loadAvailableBackups = (userId) => {
    const backupsKey = `backups_list_${userId}`;
    const backupsJson = localStorage.getItem(backupsKey);
    if (backupsJson) {
      setAvailableBackups(JSON.parse(backupsJson));
    }
  };

  const saveBackupToStorage = async (backupData, timestamp) => {
    if (!user) return;
    
    const backupsKey = `backups_list_${user.uid}`;
    const backupKey = `backup_${user.uid}_${timestamp}`;
    
    // Save backup data
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    // Update backups list
    const currentBackups = availableBackups;
    const newBackup = {
      id: backupKey,
      timestamp: timestamp,
      date: new Date(timestamp).toLocaleString(),
      size: JSON.stringify(backupData).length
    };
    
    const updatedBackups = [newBackup, ...currentBackups].slice(0, 10); // Keep only last 10 backups
    localStorage.setItem(backupsKey, JSON.stringify(updatedBackups));
    setAvailableBackups(updatedBackups);
    
    return newBackup;
  };

  const performAutoBackup = async () => {
    if (!user || !backupEmail) return;

    try {
      // Fetch all data from Firebase
      const cashbookRef = ref(db, 'cashbook');
      const gocardRef = ref(db, 'gocard');
      const standbyRef = ref(db, 'standby');
      const assetRegisterRef = ref(db, 'assetRegister');
      const ambulanceInspectionRef = ref(db, 'ambulanceInspection');
      const equipmentChecklistRef = ref(db, 'equipmentChecklist');

      const [cashbookSnapshot, gocardSnapshot, standbySnapshot, assetRegisterSnapshot, ambulanceInspectionSnapshot, equipmentChecklistSnapshot] = await Promise.all([
        get(cashbookRef),
        get(gocardRef),
        get(standbyRef),
        get(assetRegisterRef),
        get(ambulanceInspectionRef),
        get(equipmentChecklistRef)
      ]);

      const timestamp = Date.now();
      const backupData = {
        metadata: {
          backupDate: new Date(timestamp).toISOString(),
          userEmail: user.email,
          userId: user.uid,
          version: '1.0',
          autoBackup: true
        },
        cashbook: cashbookSnapshot.val() || {},
        gocard: gocardSnapshot.val() || {},
        standby: standbySnapshot.val() || {},
        assetRegister: assetRegisterSnapshot.val() || {},
        ambulanceInspection: ambulanceInspectionSnapshot.val() || {},
        equipmentChecklist: equipmentChecklistSnapshot.val() || {}
      };

      // Save to local storage
      await saveBackupToStorage(backupData, timestamp);

      // Send email notification (simulated - would need backend service)
      console.log(`Auto backup created and would be sent to ${backupEmail}`);
      
    } catch (err) {
      console.error('Auto backup failed:', err);
    }
  };

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!newEmail || !currentPassword) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, newEmail);

      Swal.fire({
        icon: 'success',
        title: 'Email Updated!',
        text: 'Your email address has been successfully updated.',
        confirmButtonColor: '#10B981'
      });
      setNewEmail('');
      setCurrentPassword('');
    } catch (err) {
      console.error('Error updating email:', err);
      setError(err.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword || !currentPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      Swal.fire({
        icon: 'success',
        title: 'Password Updated!',
        text: 'Your password has been successfully updated.',
        confirmButtonColor: '#10B981'
      });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDeletePassword = async (e) => {
    e.preventDefault();
    if (!deletePassword || !confirmDeletePassword || !currentPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (deletePassword !== confirmDeletePassword) {
      setError('Delete passwords do not match');
      return;
    }

    if (deletePassword.length < 4) {
      setError('Delete password must be at least 4 characters long');
      return;
    }

    // Show confirmation alert before setting delete password
    const confirmResult = await Swal.fire({
      title: 'Set Delete Password?',
      text: 'This password will be required when deleting all entries from your cashbook. Make sure to remember it!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Set Password',
      cancelButtonText: 'Cancel'
    });

    if (!confirmResult.isConfirmed) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Store the delete password in localStorage with user-specific key
      const deletePasswordKey = `delete_password_${user.uid}`;
      localStorage.setItem(deletePasswordKey, deletePassword);

      // Success alert with additional information
      await Swal.fire({
        icon: 'success',
        title: 'Delete Password Set!',
        text: 'Your delete password has been successfully set. You will need this password to delete all entries.',
        confirmButtonColor: '#10B981',
        footer: '<small className="text-gray-500">Keep this password safe and remember it!</small>'
      });

      setDeletePassword('');
      setConfirmDeletePassword('');
      setCurrentPassword('');
    } catch (err) {
      console.error('Error setting delete password:', err);

      // Show specific error alerts based on error type
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        await Swal.fire({
          icon: 'error',
          title: 'Authentication Failed',
          text: 'The current password you entered is incorrect. Please try again.',
          confirmButtonColor: '#DC2626'
        });
      } else if (err.code === 'auth/too-many-requests') {
        await Swal.fire({
          icon: 'error',
          title: 'Too Many Attempts',
          text: 'Too many failed attempts. Please try again later.',
          confirmButtonColor: '#DC2626'
        });
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Error Setting Password',
          text: err.message || 'Failed to set delete password. Please try again.',
          confirmButtonColor: '#DC2626'
        });
      }

      setError(err.message || 'Failed to set delete password');
    } finally {
      setLoading(false);
    }
  };

  const handleBackupData = async () => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      setLoading(true);

      // Show loading alert
      Swal.fire({
        title: 'Creating Backup...',
        text: 'Please wait while we backup your data',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Fetch all data from Firebase
      const cashbookRef = ref(db, 'cashbook');
      const gocardRef = ref(db, 'gocard');
      const standbyRef = ref(db, 'standby');
      const assetRegisterRef = ref(db, 'assetRegister');
      const ambulanceInspectionRef = ref(db, 'ambulanceInspection');
      const equipmentChecklistRef = ref(db, 'equipmentChecklist');

      const [cashbookSnapshot, gocardSnapshot, standbySnapshot, assetRegisterSnapshot, ambulanceInspectionSnapshot, equipmentChecklistSnapshot] = await Promise.all([
        get(cashbookRef),
        get(gocardRef),
        get(standbyRef),
        get(assetRegisterRef),
        get(ambulanceInspectionRef),
        get(equipmentChecklistRef)
      ]);

      const timestamp = Date.now();
      // Prepare backup data
      const backupData = {
        metadata: {
          backupDate: new Date(timestamp).toISOString(),
          userEmail: user.email,
          userId: user.uid,
          version: '1.0'
        },
        cashbook: cashbookSnapshot.val() || {},
        gocard: gocardSnapshot.val() || {},
        standby: standbySnapshot.val() || {},
        assetRegister: assetRegisterSnapshot.val() || {},
        ambulanceInspection: ambulanceInspectionSnapshot.val() || {},
        equipmentChecklist: equipmentChecklistSnapshot.val() || {}
      };

      // Save to local storage
      await saveBackupToStorage(backupData, timestamp);

      // Create downloadable backup file
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Records_Management_System_Backup_${new Date(timestamp).toISOString().split('T')[0]}_${new Date(timestamp).toTimeString().split(' ')[0].replace(/:/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Backup Created & Downloaded!',
        html: `
          <p>Your data has been successfully backed up and downloaded.</p>
          <p class="text-sm text-gray-600 mt-2">Backup saved: ${new Date(timestamp).toLocaleString()}</p>
          <p class="text-sm text-gray-500 mt-2">Backup stored locally and downloaded as JSON file.</p>
        `,
        confirmButtonColor: '#10B981'
      });

    } catch (err) {
      console.error('Error creating backup:', err);
      Swal.fire({
        icon: 'error',
        title: 'Backup Failed',
        text: err.message || 'Failed to create backup. Please try again.',
        confirmButtonColor: '#DC2626'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBackupSettings = () => {
    if (!user) return;

    if (autoBackupEnabled && !backupEmail) {
      Swal.fire({
        icon: 'warning',
        title: 'Email Required',
        text: 'Please enter an email address for backup notifications.',
        confirmButtonColor: '#10B981'
      });
      return;
    }

    // Save settings to localStorage
    localStorage.setItem(`backup_email_${user.uid}`, backupEmail);
    localStorage.setItem(`auto_backup_${user.uid}`, autoBackupEnabled.toString());
    localStorage.setItem(`backup_frequency_${user.uid}`, backupFrequency);

    Swal.fire({
      icon: 'success',
      title: 'Settings Saved!',
      text: autoBackupEnabled 
        ? `Auto backup enabled. Backups will be created ${backupFrequency} and notifications sent to ${backupEmail}`
        : 'Auto backup disabled.',
      confirmButtonColor: '#10B981'
    });
  };

  const handleRestoreBackup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target.result);

          // Validate backup structure
          if (!backupData.metadata || !backupData.metadata.version) {
            throw new Error('Invalid backup file format');
          }

          // Show confirmation with backup details
          const result = await Swal.fire({
            title: 'Restore Backup?',
            html: `
              <div class="text-left">
                <p><strong>Backup Date:</strong> ${new Date(backupData.metadata.backupDate).toLocaleString()}</p>
                <p><strong>User:</strong> ${backupData.metadata.userEmail}</p>
                <p class="text-red-600 mt-4"><strong>Warning:</strong> This will replace all current data!</p>
              </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#DC2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Restore',
            cancelButtonText: 'Cancel'
          });

          if (!result.isConfirmed) {
            setLoading(false);
            return;
          }

          Swal.fire({
            title: 'Restoring Backup...',
            text: 'Please wait while we restore your data',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          // Restore data to Firebase
          const promises = [];
          if (backupData.cashbook) {
            promises.push(set(ref(db, 'cashbook'), backupData.cashbook));
          }
          if (backupData.gocard) {
            promises.push(set(ref(db, 'gocard'), backupData.gocard));
          }
          if (backupData.standby) {
            promises.push(set(ref(db, 'standby'), backupData.standby));
          }
          if (backupData.assetRegister) {
            promises.push(set(ref(db, 'assetRegister'), backupData.assetRegister));
          }
          if (backupData.ambulanceInspection) {
            promises.push(set(ref(db, 'ambulanceInspection'), backupData.ambulanceInspection));
          }
          if (backupData.equipmentChecklist) {
            promises.push(set(ref(db, 'equipmentChecklist'), backupData.equipmentChecklist));
          }

          await Promise.all(promises);

          Swal.fire({
            icon: 'success',
            title: 'Restore Complete!',
            text: 'Your data has been successfully restored from the backup.',
            confirmButtonColor: '#10B981'
          });

        } catch (err) {
          console.error('Error parsing backup file:', err);
          Swal.fire({
            icon: 'error',
            title: 'Restore Failed',
            text: err.message || 'Invalid backup file or restore failed.',
            confirmButtonColor: '#DC2626'
          });
        } finally {
          setLoading(false);
          e.target.value = ''; // Reset file input
        }
      };

      reader.readAsText(file);

    } catch (err) {
      console.error('Error reading backup file:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to read backup file.',
        confirmButtonColor: '#DC2626'
      });
      setLoading(false);
    }
  };

  const handleRestoreFromStorage = async (backupId) => {
    try {
      const backupJson = localStorage.getItem(backupId);
      if (!backupJson) {
        throw new Error('Backup not found');
      }

      const backupData = JSON.parse(backupJson);

      // Show confirmation
      const result = await Swal.fire({
        title: 'Restore Backup?',
        html: `
          <div class="text-left">
            <p><strong>Backup Date:</strong> ${new Date(backupData.metadata.backupDate).toLocaleString()}</p>
            <p class="text-red-600 mt-4"><strong>Warning:</strong> This will replace all current data!</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, Restore',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;

      setLoading(true);

      Swal.fire({
        title: 'Restoring Backup...',
        text: 'Please wait while we restore your data',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Restore data to Firebase
      const promises = [];
      if (backupData.cashbook) {
        promises.push(set(ref(db, 'cashbook'), backupData.cashbook));
      }
      if (backupData.gocard) {
        promises.push(set(ref(db, 'gocard'), backupData.gocard));
      }
      if (backupData.standby) {
        promises.push(set(ref(db, 'standby'), backupData.standby));
      }
      if (backupData.assetRegister) {
        promises.push(set(ref(db, 'assetRegister'), backupData.assetRegister));
      }
      if (backupData.ambulanceInspection) {
        promises.push(set(ref(db, 'ambulanceInspection'), backupData.ambulanceInspection));
      }
      if (backupData.equipmentChecklist) {
        promises.push(set(ref(db, 'equipmentChecklist'), backupData.equipmentChecklist));
      }

      await Promise.all(promises);

      Swal.fire({
        icon: 'success',
        title: 'Restore Complete!',
        text: 'Your data has been successfully restored.',
        confirmButtonColor: '#10B981'
      });

    } catch (err) {
      console.error('Error restoring backup:', err);
      Swal.fire({
        icon: 'error',
        title: 'Restore Failed',
        text: err.message || 'Failed to restore backup.',
        confirmButtonColor: '#DC2626'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Account Settings</h2>

      {error && (
        <div className={`mb-4 p-3 ${theme === 'dark' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-100 border-red-400 text-red-700'} border rounded`}>
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Update Email Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Update Email Address</h3>
          <form onSubmit={handleUpdateEmail}>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPasswordEmail ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Enter your login password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPasswordEmail(!showCurrentPasswordEmail)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showCurrentPasswordEmail ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className={`w-full px-4 py-3 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="Enter your new email"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Update Password Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Update Password</h3>
          <form onSubmit={handleUpdatePassword}>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPasswordUpdate ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Enter your login password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPasswordUpdate(!showCurrentPasswordUpdate)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showCurrentPasswordUpdate ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showNewPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Account Information */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-xl`}>
          <h3 className={`text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Account Information</h3>
          <div className="space-y-2">
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-medium">Current Email:</span> {user?.email || 'Loading...'}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-medium">Account Created:</span> {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
            </p>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-medium">Last Sign In:</span> {user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Set Delete Password Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Set Delete Password</h3>
          <div className={`mb-4 p-3 ${theme === 'dark' ? 'bg-blue-900 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'} border rounded-lg`}>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium">Important Security Feature</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'} mt-1`}>
                  This password will be required when using the "Delete All" function in your Cashbook and Gocard tables. Choose a password you can remember but that is secure.
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSetDeletePassword}>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPasswordDelete ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Enter your login password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPasswordDelete(!showCurrentPasswordDelete)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showCurrentPasswordDelete ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>Delete Password</label>
              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Enter your delete password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showDeletePassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className={`block ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} font-medium mb-2`}>Confirm Delete Password</label>
              <div className="relative">
                <input
                  type={showConfirmDeletePassword ? "text" : "password"}
                  value={confirmDeletePassword}
                  onChange={(e) => setConfirmDeletePassword(e.target.value)}
                  className={`w-full px-4 py-3 pr-12 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="Confirm your delete password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmDeletePassword(!showConfirmDeletePassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {showConfirmDeletePassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting...' : 'Set Delete Password'}
            </button>
          </form>
        </div>

        {/* Backup Data Section */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-6 rounded-xl`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Backup & Restore</h3>
          
          {/* Auto Backup Settings */}
          <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-gray-500' : 'border-gray-200'}`}>
            <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>Auto Backup Settings</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className={`text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Enable Auto Backup</label>
                <button
                  type="button"
                  onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoBackupEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {autoBackupEnabled && (
                <>
                  <div>
                    <label className={`block text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Backup Email</label>
                    <input
                      type="email"
                      value={backupEmail}
                      onChange={(e) => setBackupEmail(e.target.value)}
                      className={`w-full px-3 py-2 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                      placeholder="email@example.com"
                    />
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Backup notifications will be sent to this email</p>
                  </div>

                  <div>
                    <label className={`block text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>Backup Frequency</label>
                    <select
                      value={backupFrequency}
                      onChange={(e) => setBackupFrequency(e.target.value)}
                      className={`w-full px-3 py-2 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>

                  <button
                    onClick={handleSaveBackupSettings}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition duration-200"
                  >
                    Save Auto Backup Settings
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Manual Backup */}
          <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-gray-500' : 'border-gray-200'}`}>
            <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>Quick Backup</h4>
            <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
              Create an instant backup of all your data with current date and time.
            </p>
            <button
              onClick={handleBackupData}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition duration-200 shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Backup...' : 'Backup Now'}
            </button>
          </div>

          {/* Detailed Info */}
          <div className={`mb-6 p-3 ${theme === 'dark' ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-800'} border rounded-lg`}>
            <div className="flex items-start">
              <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium">What's Backed Up?</p>
                <p className={`text-xs ${theme === 'dark' ? 'text-green-300' : 'text-green-700'} mt-1`}>
                  All data including Fuel Support, Gocard, Standby, Asset Register, Ambulance Inspection, and Equipment Checklist entries.
                </p>
              </div>
            </div>
          </div>

          {/* Restore Section */}
          <div className={`p-4 ${theme === 'dark' ? 'bg-gray-600' : 'bg-white'} rounded-lg border ${theme === 'dark' ? 'border-gray-500' : 'border-gray-200'}`}>
            <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'} mb-3`}>Restore From Backup</h4>
            
            {/* Recent Backups */}
            {availableBackups.length > 0 && (
              <div className="mb-4">
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Recent Backups (stored locally):</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableBackups.map((backup) => (
                    <div key={backup.id} className={`flex items-center justify-between p-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded`}>
                      <div>
                        <p className={`text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{backup.date}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Size: {(backup.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button
                        onClick={() => handleRestoreFromStorage(backup.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition duration-200"
                        disabled={loading}
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Backup File */}
            <div>
              <label className={`block text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} mb-2`}>
                Upload Backup File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreBackup}
                disabled={loading}
                className={`w-full px-3 py-2 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold ${theme === 'dark' ? 'file:bg-green-600 file:text-white' : 'file:bg-green-50 file:text-green-700'} hover:file:bg-green-100 disabled:opacity-50`}
              />
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Select a backup JSON file to restore your data
              </p>
            </div>

            <div className={`mt-3 p-2 ${theme === 'dark' ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200'} border rounded`}>
              <p className={`text-xs ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}`}>
                ⚠️ Warning: Restoring will replace all current data with the backup data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;