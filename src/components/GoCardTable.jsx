import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update, get } from 'firebase/database';
import { db, auth } from '../firebase';
import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';
import { onAuthStateChanged } from 'firebase/auth';
import { useTheme } from '../ThemeContext';

// Add custom CSS for hiding scrollbars
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const GoCardTable = () => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [user, setUser] = useState(null);
  const [isTableCollapsed, setIsTableCollapsed] = useState(false);

  // Refs for table containers
  const mobileTableRef = React.useRef(null);
  const desktopTableRef = React.useRef(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    console.log('Loading go-card entries for user:', user.uid);

    const entriesRef = ref(db, 'go-card/entries');
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      try {
        console.log('Database snapshot received:', snapshot.exists());
        const data = snapshot.val();
        console.log('Raw data from database:', data);

        if (data) {
          const userEntries = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          })).filter(entry => entry.createdBy === user.uid).sort((a, b) => new Date(a.date) - new Date(b.date));

          console.log('Filtered user entries:', userEntries.length);
          setEntries(userEntries);
        } else {
          console.log('No data found in database');
          setEntries([]);
        }
      } catch (error) {
        console.error('Error processing database data:', error);
        setEntries([]);
      }
    }, (error) => {
      console.error('Database read error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      setEntries([]);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = entries;
    if (search) {
      filtered = filtered.filter(entry => entry.merchant.toLowerCase().includes(search.toLowerCase()) || entry.attendant.toLowerCase().includes(search.toLowerCase()));
    }
    if (dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(dateFrom));
    }
    setFilteredEntries(filtered);
  }, [entries, search, dateFrom]);

  // Simplified scroll handling - removed complex touch/wheel logic
  useEffect(() => {
    // Simple scroll behavior - let browser handle natural scrolling
    const handleTableScroll = (event, tableElement) => {
      if (!tableElement) return;

      const { scrollTop, scrollHeight, clientHeight } = tableElement;
      const deltaY = event.deltaY;

      // Only prevent default if we're at boundaries and trying to scroll beyond
      if ((deltaY < 0 && scrollTop <= 0) || (deltaY > 0 && scrollTop + clientHeight >= scrollHeight)) {
        // Let parent handle the scroll naturally
        return;
      }
    };

    const addListeners = () => {
      if (mobileTableRef.current) {
        mobileTableRef.current.addEventListener('wheel', (e) => handleTableScroll(e, mobileTableRef.current), { passive: true });
      }

      if (desktopTableRef.current) {
        desktopTableRef.current.addEventListener('wheel', (e) => handleTableScroll(e, desktopTableRef.current), { passive: true });
      }
    };

    const removeListeners = () => {
      if (mobileTableRef.current) {
        mobileTableRef.current.removeEventListener('wheel', (e) => handleTableScroll(e, mobileTableRef.current));
      }

      if (desktopTableRef.current) {
        desktopTableRef.current.removeEventListener('wheel', (e) => handleTableScroll(e, desktopTableRef.current));
      }
    };

    const timeoutId = setTimeout(addListeners, 100);

    return () => {
      clearTimeout(timeoutId);
      removeListeners();
    };
  }, []);

  const recalculateBalances = async () => {
    if (!user) return;

    const snapshot = await get(ref(db, 'go-card/entries'));
    const data = snapshot.val();
    if (!data) return;

    // Sort by date instead of timestamp for balance calculation
    const userEntries = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(entry => entry.createdBy === user.uid).sort((a, b) => new Date(a.date) - new Date(b.date));

    let balance = 0;
    const updates = {};
    userEntries.forEach(entry => {
      balance += entry.receipt - entry.payment;
      updates[`go-card/entries/${entry.id}/balance`] = balance;
    });
    await update(ref(db), updates);
  };

  const handleDelete = async (id) => {
    if (!user) return;

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await remove(ref(db, `go-card/entries/${id}`));
        await recalculateBalances();
        // Trigger balance refresh in forms
        localStorage.setItem('go_card_balance_refresh', Date.now().toString());
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'The entry has been deleted.',
          confirmButtonColor: '#10B981'
        });
      } catch (error) {
        console.error('Error deleting entry:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error Deleting Entry',
          text: 'Failed to delete the entry. Please try again.',
          confirmButtonColor: '#10B981'
        });
      }
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setEditData({ ...entry });
  };

  const handleSaveEdit = async () => {
    if (!user) return;

    try {
      await update(ref(db, `go-card/entries/${editingId}`), editData);
      await recalculateBalances();
      // Trigger balance refresh in forms
      localStorage.setItem('go_card_balance_refresh', Date.now().toString());
      setEditingId(null);
      setEditData({});
      Swal.fire({
        icon: 'success',
        title: 'Entry Updated!',
        text: 'The entry has been successfully updated.',
        confirmButtonColor: '#10B981'
      });
    } catch (error) {
      console.error('Error updating entry:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Updating Entry',
        text: 'Failed to update the entry. Please try again.',
        confirmButtonColor: '#10B981'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDeleteAll = async () => {
    if (!user) return;

    // Get the user's delete password from localStorage
    const deletePasswordKey = `delete_password_${user.uid}`;
    const storedDeletePassword = localStorage.getItem(deletePasswordKey);

    if (!storedDeletePassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Delete Password Not Set',
        text: 'Please set a delete password in Settings first.',
        confirmButtonColor: '#10B981'
      });
      return;
    }

    // Password prompt
    const { value: password } = await Swal.fire({
      title: 'Enter Delete Password',
      input: 'password',
      inputLabel: 'Password required to delete all entries',
      inputPlaceholder: 'Enter your delete password...',
      inputAttributes: {
        maxlength: 20,
        autocapitalize: 'off',
        autocorrect: 'off'
      },
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Delete All',
      inputValidator: (value) => {
        if (!value) {
          return 'Password is required!';
        }
        if (value !== storedDeletePassword) {
          return 'Incorrect password!';
        }
      }
    });

    if (password === storedDeletePassword) {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Delete ALL Entries?',
        text: 'This will permanently delete ALL your GOCARD entries. This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC2626',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, Delete Everything!',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        try {
          // Get all user entries
          const snapshot = await get(ref(db, 'go-card/entries'));
          const data = snapshot.val();
          
          if (data) {
            const userEntries = Object.keys(data).filter(key => data[key].createdBy === user.uid);
            
            if (userEntries.length === 0) {
              Swal.fire({
                icon: 'info',
                title: 'No Entries Found',
                text: 'There are no entries to delete.',
                confirmButtonColor: '#10B981'
              });
              return;
            }

            // Delete all entries
            const deletePromises = userEntries.map(entryId => 
              remove(ref(db, `go-card/entries/${entryId}`))
            );
            
            await Promise.all(deletePromises);

            // Trigger balance refresh in forms
            localStorage.setItem('go_card_balance_refresh', Date.now().toString());
            
            Swal.fire({
              icon: 'success',
              title: 'All Entries Deleted!',
              text: `Successfully deleted ${userEntries.length} entries.`,
              confirmButtonColor: '#10B981'
            });
          } else {
            Swal.fire({
              icon: 'info',
              title: 'No Entries Found',
              text: 'There are no entries to delete.',
              confirmButtonColor: '#10B981'
            });
          }
        } catch (error) {
          console.error('Error deleting all entries:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error Deleting Entries',
            text: 'Failed to delete all entries. Please try again.',
            confirmButtonColor: '#10B981'
          });
        }
      }
    }
  };

  const handleExport = async () => {
    if (filteredEntries.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data to Export',
        text: 'There are no entries to export. Please add some entries first.',
        confirmButtonColor: '#10B981'
      });
      return;
    }

    try {
      // Create a new workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('GoCard');

      // Set column widths
      worksheet.columns = [
        { key: 'date', header: 'Date', width: 12 },
        { key: 'time', header: 'Time', width: 10 },
        { key: 'merchant', header: 'Merchant', width: 25 },
        { key: 'attendant', header: 'Attendant', width: 20 },
        { key: 'receipt', header: 'Receipt (₵)', width: 15 },
        { key: 'payment', header: 'Payment (₵)', width: 15 },
        { key: 'balance', header: 'Balance (₵)', width: 15 },
      ];

      // Style the header row - apply purple background to all headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.alignment = { horizontal: 'center' };

      // Apply purple background and white text to all headers
      for (let col = 1; col <= 7; col++) { // Columns A-G (all headers)
        const headerCell = headerRow.getCell(col);
        headerCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF10B981' } // Green background
        };
        headerCell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }; // White text
      }

      // Add data rows
      filteredEntries.forEach(entry => {
        const row = worksheet.addRow({
          date: entry.date,
          time: entry.time,
          merchant: entry.merchant,
          attendant: entry.attendant,
          receipt: entry.receipt,
          payment: entry.payment,
          balance: entry.balance
        });

        // Style numeric columns (right alignment)
        row.getCell('receipt').alignment = { horizontal: 'right' };
        row.getCell('payment').alignment = { horizontal: 'right' };
        row.getCell('balance').alignment = { horizontal: 'right' };
        row.getCell('balance').font = { bold: true }; // Make balance column bold
      });

      // Generate buffer and create blob for download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'go-card.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful!',
        text: 'Your GOCARD entries have been exported to Excel with bold headers.',
        confirmButtonColor: '#10B981'
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting your data. Please try again.',
        confirmButtonColor: '#10B981'
      });
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 bg-opacity-80 border-gray-700' : 'bg-white bg-opacity-80 border-white border-opacity-20'} backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border`}>
      {/* Inject custom CSS for hiding scrollbars */}
      <style dangerouslySetInnerHTML={{ __html: scrollbarHideStyle }} />
      
      {/* Search and Filter Controls - Fixed Header */}
      <div className={`mb-6 space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sticky top-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} z-20 pb-4 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} border-b`}>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search merchant or attendant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full px-4 py-3 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base`}
          />
        </div>
        <div className="sm:w-auto w-full">
          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={`w-full px-4 py-3 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base`}
          />
        </div>
        <div className="flex gap-2 sm:w-auto w-full">
          <button
            onClick={() => setIsTableCollapsed(!isTableCollapsed)}
            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isTableCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isTableCollapsed ? 'Show Table' : 'Hide Table'}
          </button>
          <button
            onClick={handleExport}
            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Export to Excel
          </button>
          <button
            onClick={handleDeleteAll}
            className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete All
          </button>
        </div>
      </div>

      {/* Table Views - Conditionally Rendered */}
      {!isTableCollapsed && (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <div
              ref={mobileTableRef}
              className={`overflow-x-auto overflow-y-auto max-h-[60vh] rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} custom-scroll`}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#10B981 #f3f4f6',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                maxWidth: '100vw',
                width: '100%',
                maxHeight: '60vh',
                overflowY: 'auto',
                touchAction: 'pan-x pan-y'
              }}
            >
              <div style={{ minWidth: '800px' }}>
                <table className="w-full table-fixed border-collapse">
                <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-1 py-1 text-left font-semibold text-xs w-[12%] min-w-[80px]">Date</th>
                    <th className="px-1 py-1 text-left font-semibold text-xs w-[10%] min-w-[70px]">Time</th>
                    <th className="px-1 py-1 text-left font-semibold text-xs w-[25%] min-w-[120px]">Merchant</th>
                    <th className="px-1 py-1 text-left font-semibold text-xs w-[20%] min-w-[100px]">Attendant</th>
                    <th className="px-1 py-1 text-left font-semibold text-xs w-[11%] min-w-[70px]">Receipt (₵)</th>
                    <th className="px-1 py-1 text-left font-semibold text-xs w-[11%] min-w-[70px]">Payment (₵)</th>
                    <th className="px-1 py-1 text-left font-semibold text-xs w-[11%] min-w-[70px]">Balance (₵)</th>
                    <th className="px-1 py-1 text-center font-semibold text-xs w-[10%] min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className={`${theme === 'dark' ? 'hover:bg-black' : 'hover:bg-white'} transition duration-150`}>
                      <td className={`px-1 py-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="date"
                            value={editData.date || ''}
                            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className={`px-1 py-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="time"
                            value={editData.time || ''}
                            onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                            className={`w-full px-1 py-1 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500`}
                          />
                        ) : (
                          entry.time
                        )}
                      </td>
                      <td className={`px-1 py-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.merchant || ''}
                            onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
                            className={`w-full px-1 py-1 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500`}
                          />
                        ) : (
                          <span className="break-words">{entry.merchant}</span>
                        )}
                      </td>
                      <td className={`px-1 py-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.attendant || ''}
                            onChange={(e) => setEditData({ ...editData, attendant: e.target.value })}
                            className={`w-full px-1 py-1 border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'} rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500`}
                          />
                        ) : (
                          entry.attendant
                        )}
                      </td>
                      <td className={`px-1 py-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} text-right`}>
                        {editingId === entry.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editData.receipt || ''}
                            onChange={(e) => setEditData({ ...editData, receipt: parseFloat(e.target.value) || 0 })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="font-medium text-green-600">₵ {entry.receipt.toFixed(2)}</span>
                        )}
                      </td>
                      <td className={`px-1 py-1 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} text-right`}>
                        {editingId === entry.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editData.payment || ''}
                            onChange={(e) => setEditData({ ...editData, payment: parseFloat(e.target.value) || 0 })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="font-medium text-red-600">₵ {entry.payment.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-1 py-1 text-xs text-right">
                        <span className="font-bold text-green-600">₵ {entry.balance.toFixed(2)}</span>
                      </td>
                      <td className="px-1 py-1 text-center">
                        {editingId === entry.id ? (
                          <div className="flex flex-col gap-1 justify-center">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-500 hover:bg-green-600 text-white px-1 py-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-1 py-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-row gap-1 items-center justify-center min-h-[40px]">
                            <button
                              onClick={() => handleEdit(entry)}
                              className={`${theme === 'dark' ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} p-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500`}
                              title="Edit entry"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className={`${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'} p-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-red-500`}
                              title="Delete entry"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {filteredEntries.length === 0 && (
                <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-4xl mb-4">
                    <svg className={`w-16 h-16 mx-auto ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">No entries found</p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className={`overflow-x-auto overflow-y-auto max-h-[60vh] rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} custom-scroll`}
              ref={desktopTableRef}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#10B981 #f3f4f6',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                maxHeight: '60vh',
                overflowY: 'auto',
                touchAction: 'pan-y'
              }}
            >
              <table className="w-full min-w-[900px] table-fixed border-collapse">
                <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[12%] min-w-[100px]">Date</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[10%] min-w-[80px]">Time</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[25%] min-w-[150px]">Merchant</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[20%] min-w-[120px]">Attendant</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[11%] min-w-[100px]">Receipt (₵)</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[11%] min-w-[100px]">Payment (₵)</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[11%] min-w-[100px]">Balance (₵)</th>
                    <th className="px-3 py-3 text-center font-semibold text-sm w-[10%] min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className={`${theme === 'dark' ? 'hover:bg-black' : 'hover:bg-white'} transition duration-150`}>
                      <td className={`px-3 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="date"
                            value={editData.date || ''}
                            onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="font-medium">{new Date(entry.date).toLocaleDateString()}</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="time"
                            value={editData.time || ''}
                            onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          entry.time
                        )}
                      </td>
                      <td className={`px-3 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.merchant || ''}
                            onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="break-words">{entry.merchant}</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.attendant || ''}
                            onChange={(e) => setEditData({ ...editData, attendant: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          entry.attendant
                        )}
                      </td>
                      <td className={`px-3 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} text-right`}>
                        {editingId === entry.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editData.receipt || ''}
                            onChange={(e) => setEditData({ ...editData, receipt: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="font-medium text-green-600">₵ {entry.receipt.toFixed(2)}</span>
                        )}
                      </td>
                      <td className={`px-3 py-3 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'} text-right`}>
                        {editingId === entry.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editData.payment || ''}
                            onChange={(e) => setEditData({ ...editData, payment: parseFloat(e.target.value) || 0 })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="font-medium text-red-600">₵ {entry.payment.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-right">
                        <span className="font-bold text-green-600">₵ {entry.balance.toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {editingId === entry.id ? (
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-red-500"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEntries.length === 0 && (
                <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  <div className="text-4xl mb-4">
                    <svg className={`w-16 h-16 mx-auto ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base font-medium">No entries found</p>
                  <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Table Info */}
          {filteredEntries.length > 0 && (
            <div className={`mt-4 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GoCardTable;