import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update, get } from 'firebase/database';
import { db, auth } from '../firebase';
import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';
import { onAuthStateChanged } from 'firebase/auth';

const CashbookTable = () => {
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

    const entriesRef = ref(db, 'cashbook/entries');
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userEntries = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        })).filter(entry => entry.createdBy === user.uid).sort((a, b) => new Date(a.date) - new Date(b.date));
        setEntries(userEntries);
      } else {
        setEntries([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    let filtered = entries;
    if (search) {
      filtered = filtered.filter(entry => entry.particulars.toLowerCase().includes(search.toLowerCase()));
    }
    if (dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(dateFrom));
    }
    setFilteredEntries(filtered);
  }, [entries, search, dateFrom]);

  // Scroll connection effect
  useEffect(() => {
    const handleTableWheel = (event, tableElement) => {
      if (!tableElement) return;

      const { scrollTop, scrollHeight, clientHeight } = tableElement;
      const deltaY = event.deltaY;

      // If scrolling up and already at top, scroll page instead
      if (deltaY < 0 && scrollTop <= 0) {
        event.preventDefault();
        event.stopPropagation();
        window.scrollBy(0, deltaY);
        return;
      }

      // If scrolling down and already at bottom, scroll page instead
      if (deltaY > 0 && scrollTop + clientHeight >= scrollHeight) {
        event.preventDefault();
        event.stopPropagation();
        window.scrollBy(0, deltaY);
        return;
      }
    };

    const handleTableTouch = (event, tableElement, direction) => {
      if (!tableElement) return;

      const { scrollTop, scrollHeight, clientHeight } = tableElement;

      // If trying to scroll up and already at top, scroll page instead
      if (direction === 'up' && scrollTop <= 0) {
        event.preventDefault();
        event.stopPropagation();
        window.scrollBy(0, -100);
        return;
      }

      // If trying to scroll down and already at bottom, scroll page instead
      if (direction === 'down' && scrollTop + clientHeight >= scrollHeight) {
        event.preventDefault();
        event.stopPropagation();
        window.scrollBy(0, 100);
        return;
      }
    };

    // Touch tracking variables
    let touchStartY = 0;
    let lastTouchY = 0;

    const handleTouchStart = (event) => {
      touchStartY = event.touches[0].clientY;
      lastTouchY = touchStartY;
    };

    const handleTouchMove = (event) => {
      const currentTouchY = event.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY;
      const direction = deltaY > 0 ? 'down' : 'up';

      // Check which table this touch is in
      const isInMobileTable = mobileTableRef.current && mobileTableRef.current.contains(event.target);
      const isInDesktopTable = desktopTableRef.current && desktopTableRef.current.contains(event.target);

      if (isInMobileTable) {
        handleTableTouch(event, mobileTableRef.current, direction);
      } else if (isInDesktopTable) {
        handleTableTouch(event, desktopTableRef.current, direction);
      }

      lastTouchY = currentTouchY;
    };

    // Add event listeners to table containers when they exist
    const addListeners = () => {
      if (mobileTableRef.current) {
        mobileTableRef.current.addEventListener('wheel', (e) => handleTableWheel(e, mobileTableRef.current), { passive: false });
        mobileTableRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
        mobileTableRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
      }

      if (desktopTableRef.current) {
        desktopTableRef.current.addEventListener('wheel', (e) => handleTableWheel(e, desktopTableRef.current), { passive: false });
        desktopTableRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
        desktopTableRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
      }
    };

    const removeListeners = () => {
      if (mobileTableRef.current) {
        mobileTableRef.current.removeEventListener('wheel', (e) => handleTableWheel(e, mobileTableRef.current));
        mobileTableRef.current.removeEventListener('touchstart', handleTouchStart);
        mobileTableRef.current.removeEventListener('touchmove', handleTouchMove);
      }

      if (desktopTableRef.current) {
        desktopTableRef.current.removeEventListener('wheel', (e) => handleTableWheel(e, desktopTableRef.current));
        desktopTableRef.current.removeEventListener('touchstart', handleTouchStart);
        desktopTableRef.current.removeEventListener('touchmove', handleTouchMove);
      }
    };

    // Add listeners after a short delay to ensure refs are set
    const timeoutId = setTimeout(addListeners, 100);

    return () => {
      clearTimeout(timeoutId);
      removeListeners();
    };
  }, []);

  const recalculateBalances = async () => {
    if (!user) return;

    const snapshot = await get(ref(db, 'cashbook/entries'));
    const data = snapshot.val();
    if (!data) return;

    const userEntries = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(entry => entry.createdBy === user.uid).sort((a, b) => a.timestamp - b.timestamp);

    let balance = 0;
    const updates = {};
    userEntries.forEach(entry => {
      balance += entry.receipt - entry.payment;
      updates[`cashbook/entries/${entry.id}/balance`] = balance;
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
        await remove(ref(db, `cashbook/entries/${id}`));
        await recalculateBalances();
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
      await update(ref(db, `cashbook/entries/${editingId}`), editData);
      await recalculateBalances();
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
      const worksheet = workbook.addWorksheet('Cashbook');

      // Set column widths
      worksheet.columns = [
        { key: 'date', header: 'Date', width: 12 },
        { key: 'particulars', header: 'Particulars', width: 30 },
        { key: 'receiptNo', header: 'Receipt No', width: 15 },
        { key: 'receipt', header: 'Receipt (₵)', width: 15 },
        { key: 'payment', header: 'Payment (₵)', width: 15 },
        { key: 'balance', header: 'Balance (₵)', width: 15 },
      ];

      // Style the header row - apply green background to all headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 12 };
      headerRow.alignment = { horizontal: 'center' };

      // Apply green background and white text to all headers
      for (let col = 1; col <= 6; col++) { // Columns A-F (all headers)
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
          particulars: entry.particulars,
          receiptNo: entry.receiptNo,
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
      link.download = 'cashbook.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful!',
        text: 'Your cashbook has been exported to Excel with bold headers.',
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
    <div className="bg-white bg-opacity-80 backdrop-blur-sm p-4 sm:p-6 rounded-2xl shadow-xl border border-white border-opacity-20">
      {/* Search and Filter Controls - Fixed Header */}
      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-4 sticky top-0 bg-white z-20 pb-4 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder="Search particulars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
        <div className="sm:w-auto w-full">
          <input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
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
        </div>
      </div>

      {/* Table Views - Conditionally Rendered */}
      {!isTableCollapsed && (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden">
            <div
              ref={mobileTableRef}
              className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-lg border border-gray-200 custom-scroll"
              style={{
                scrollbarWidth: 'auto',
                scrollbarColor: '#10B981 #f3f4f6',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                overscrollBehaviorY: 'contain',
                maxWidth: '100vw',
                width: '100%',
                maxHeight: '70vh',
                overflowY: 'auto'
              }}
            >
              <div style={{ minWidth: '750px', width: '750px', maxWidth: '750px' }}>
                <table className="w-full table-fixed border-collapse">
                <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-xs w-[12%] min-w-[80px]">Date</th>
                    <th className="px-2 py-2 text-left font-semibold text-xs w-[28%] min-w-[120px]">Particulars</th>
                    <th className="px-2 py-2 text-left font-semibold text-xs w-[15%] min-w-[100px]">Receipt No</th>
                    <th className="px-2 py-2 text-left font-semibold text-xs w-[12%] min-w-[80px]">Receipt (₵)</th>
                    <th className="px-2 py-2 text-left font-semibold text-xs w-[12%] min-w-[80px]">Payment (₵)</th>
                    <th className="px-2 py-2 text-left font-semibold text-xs w-[12%] min-w-[80px]">Balance (₵)</th>
                    <th className="px-2 py-2 text-center font-semibold text-xs w-[9%] min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-2 py-2 text-xs text-gray-900">
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
                      <td className="px-2 py-2 text-xs text-gray-900">
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.particulars || ''}
                            onChange={(e) => setEditData({ ...editData, particulars: e.target.value })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="break-words">{entry.particulars}</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900">
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.receiptNo || ''}
                            onChange={(e) => setEditData({ ...editData, receiptNo: e.target.value })}
                            className="w-full px-1 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          entry.receiptNo
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs text-gray-900 text-right">
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
                      <td className="px-2 py-2 text-xs text-gray-900 text-right">
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
                      <td className="px-2 py-2 text-xs text-right">
                        <span className="font-bold text-green-600">₵ {entry.balance.toFixed(2)}</span>
                      </td>
                      <td className="px-2 py-2 text-center">
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
                          <div className="flex flex-col gap-1 justify-center">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="bg-green-500 hover:bg-green-600 text-white px-1 py-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-1 py-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-red-500"
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
              </div>

              {filteredEntries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-sm font-medium">No entries found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-lg border border-gray-200 custom-scroll"
              ref={desktopTableRef}
              style={{
                scrollbarWidth: 'auto',
                scrollbarColor: '#10B981 #f3f4f6',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                overscrollBehaviorY: 'contain',
                maxHeight: '70vh',
                overflowY: 'auto'
              }}
            >
              <table className="w-full min-w-[900px] table-fixed border-collapse">
                <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[12%] min-w-[100px]">Date</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[25%] min-w-[150px]">Particulars</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[15%] min-w-[120px]">Receipt No</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[12%] min-w-[100px]">Receipt (₵)</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[12%] min-w-[100px]">Payment (₵)</th>
                    <th className="px-3 py-3 text-left font-semibold text-sm w-[12%] min-w-[100px]">Balance (₵)</th>
                    <th className="px-3 py-3 text-center font-semibold text-sm w-[12%] min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-3 py-3 text-sm text-gray-900">
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
                      <td className="px-3 py-3 text-sm text-gray-900">
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.particulars || ''}
                            onChange={(e) => setEditData({ ...editData, particulars: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          <span className="break-words">{entry.particulars}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900">
                        {editingId === entry.id ? (
                          <input
                            type="text"
                            value={editData.receiptNo || ''}
                            onChange={(e) => setEditData({ ...editData, receiptNo: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        ) : (
                          entry.receiptNo
                        )}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-900 text-right">
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
                      <td className="px-3 py-3 text-sm text-gray-900 text-right">
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
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-sm sm:text-base font-medium">No entries found</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          </div>

          {/* Table Info */}
          {filteredEntries.length > 0 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CashbookTable;