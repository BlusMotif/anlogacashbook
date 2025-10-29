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
    console.log('Export button clicked');
    console.log('filteredEntries:', filteredEntries);
    console.log('filteredEntries length:', filteredEntries.length);

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

      console.log('Workbook created, attempting to write file...');

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

      console.log('Export completed successfully');
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
    <div className="bg-white bg-opacity-80 backdrop-blur-sm p-3 sm:p-2 rounded-2xl shadow-xl border border-white border-opacity-20 min-h-[calc(100vh-12rem)]">
      <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search particulars..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 flex-1 min-w-0"
        />
        <input
          type="date"
          placeholder="From date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full sm:w-auto"
        />
        <button
          onClick={handleExport}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium w-full sm:w-auto"
        >
          Export to Excel
        </button>
      </div>
      <div className="overflow-x-auto max-w-full h-80 sm:h-96" style={{ scrollbarWidth: 'thin', scrollbarColor: '#9CA3AF #E5E7EB' }}>
        <table className="w-full min-w-[800px] table-auto border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <th className="px-2 py-1 text-left font-semibold text-sm min-w-[100px]">Date</th>
              <th className="px-2 py-1 text-left font-semibold text-sm min-w-[150px]">Particulars</th>
              <th className="px-2 py-1 text-left font-semibold text-sm min-w-[100px]">Receipt No</th>
              <th className="px-2 py-1 text-left font-semibold text-sm min-w-[100px]">Receipt (₵)</th>
              <th className="px-2 py-1 text-left font-semibold text-sm min-w-[100px]">Payment (₵)</th>
              <th className="px-2 py-1 text-left font-semibold text-sm min-w-[100px]">Balance (₵)</th>
              <th className="px-2 py-1 text-center font-semibold text-sm min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map(entry => (
              <tr key={entry.id} className="border-b border-gray-200 hover:bg-gray-50 transition duration-200">
                <td className="px-2 py-1 whitespace-nowrap text-sm min-w-[100px]">
                  {editingId === entry.id ? (
                    <input
                      type="date"
                      value={editData.date || ''}
                      onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  ) : (
                    new Date(entry.date).toISOString().split('T')[0]
                  )}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm min-w-[150px]">
                  {editingId === entry.id ? (
                    <input
                      type="text"
                      value={editData.particulars || ''}
                      onChange={(e) => setEditData({ ...editData, particulars: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  ) : (
                    entry.particulars
                  )}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm min-w-[100px]">
                  {editingId === entry.id ? (
                    <input
                      type="text"
                      value={editData.receiptNo || ''}
                      onChange={(e) => setEditData({ ...editData, receiptNo: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  ) : (
                    entry.receiptNo
                  )}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm min-w-[100px]">
                  {editingId === entry.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.receipt || ''}
                      onChange={(e) => setEditData({ ...editData, receipt: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  ) : (
                    `₵ ${entry.receipt.toFixed(2)}`
                  )}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm min-w-[100px]">
                  {editingId === entry.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editData.payment || ''}
                      onChange={(e) => setEditData({ ...editData, payment: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  ) : (
                    `₵ ${entry.payment.toFixed(2)}`
                  )}
                </td>
                <td className="px-2 py-1 font-semibold whitespace-nowrap text-sm min-w-[100px]">
                  ₵ {entry.balance.toFixed(2)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-sm min-w-[120px]">
                  {editingId === entry.id ? (
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4 justify-center">
                      <button
                        onClick={handleSaveEdit}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4 justify-center">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
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
          <div className="text-center py-1 text-gray-500">
            <p className="text-sm">No entries match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashbookTable;