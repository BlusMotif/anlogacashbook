import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';
import ExcelJS from 'exceljs';

const StandbyTable = ({ onEdit }) => {
  const { theme } = useTheme();

  // Format date to DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    const standbyRef = ref(db, 'standby');
    const unsubscribe = onValue(standbyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entriesArray = Object.entries(data).map(([id, entry]) => ({
          id,
          ...entry
        }));
        // Sort by timestamp, newest first
        entriesArray.sort((a, b) => b.timestamp - a.timestamp);
        setEntries(entriesArray);
      } else {
        setEntries([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Get unique years from entries
  const years = ['all', ...Array.from(new Set(entries.map(entry => new Date(entry.date).getFullYear()))).sort((a, b) => b - a)];

  // Filter entries based on search term and selected year
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.watch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.date?.includes(searchTerm);
    
    const matchesYear = selectedYear === 'all' || new Date(entry.date).getFullYear().toString() === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  const handleDelete = async (id, date, location) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete entry for ${date} at ${location}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await remove(ref(db, `standby/${id}`));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Entry has been deleted.',
          confirmButtonColor: '#16a34a'
        });
      } catch (error) {
        console.error('Error deleting entry:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete entry.',
          confirmButtonColor: '#16a34a'
        });
      }
    }
  };

  const handleViewReason = (entry) => {
    Swal.fire({
      title: 'Reason/Notes',
      html: `
        <div style="text-align: left; margin-top: 20px;">
          <p style="margin-bottom: 10px;"><strong>Date:</strong> ${formatDate(entry.date)}</p>
          <p style="margin-bottom: 10px;"><strong>Location:</strong> ${entry.location}</p>
          <p style="margin-bottom: 10px;"><strong>Watch:</strong> ${entry.watch}</p>
          <hr style="margin: 15px 0; border: none; border-top: 1px solid #ddd;">
          <p style="margin-bottom: 10px;"><strong>Reason/Notes:</strong></p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word;">
            ${entry.reason || 'No reason provided'}
          </div>
        </div>
      `,
      width: '600px',
      confirmButtonColor: '#16a34a',
      confirmButtonText: 'Close'
    });
  };

  const truncateReason = (reason) => {
    if (!reason) return '';
    const words = reason.split(' ');
    if (words.length <= 10) return reason;
    return words.slice(0, 10).join(' ') + '...';
  };

  const handleExport = async () => {
    if (filteredEntries.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No entries to export.',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Standby Entries');

    // Add title
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'Standby Entries';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Add headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['Date', 'Location', 'Reason', 'Watch', 'Amount (GH₵)', 'Entry Date/Time']);
    headerRow.font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF000000' } };
    headerRow.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add data
    filteredEntries.forEach(entry => {
      const excelDate = entry.timestamp ? new Date(entry.timestamp) : new Date(entry.date);
      worksheet.addRow([
        excelDate,
        entry.location,
        entry.reason,
        entry.watch,
        parseFloat(entry.amount).toFixed(2),
        new Date(entry.timestamp).toLocaleString()
      ]);
    });

    // Format the date column as a proper date
    worksheet.getColumn(1).numFmt = 'dd/mm/yyyy';

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, cell => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 12 ? 12 : maxLength + 2;
    });

    // Add borders
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      }
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `standby_entries_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Exported!',
      text: 'Standby entries exported successfully.',
      confirmButtonColor: '#16a34a'
    });
  };

  // Calculate total amount
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 bg-opacity-80 border-gray-700' : 'bg-white bg-opacity-80 border-white border-opacity-20'} backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Standby Entries
        </h2>
        <button
          onClick={handleExport}
          className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm sm:text-base"
        >
          Export to Excel
        </button>
      </div>

      {/* Summary Card */}
      <div className={`${theme === 'dark' ? 'bg-gray-700 bg-opacity-50' : 'bg-green-50 bg-opacity-50'} backdrop-blur-sm rounded-xl p-4 mb-4 sm:mb-6 border ${theme === 'dark' ? 'border-gray-600' : 'border-green-100'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Entries</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {filteredEntries.length}
            </p>
          </div>
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              GH₵ {totalAmount.toFixed(2)}
            </p>
          </div>
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Page</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {currentPage} / {totalPages || 1}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search by location, reason, watch, or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 px-3 sm:px-4 py-2 border ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
        />
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className={`px-3 sm:px-4 py-2 border ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300 text-gray-900'
          } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
        >
          {years.map(year => (
            <option key={year} value={year}>
              {year === 'all' ? 'All Years' : year}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl">
        <table className="min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}">
          <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Date
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Location
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Reason
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Watch
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Amount
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <tr key={entry.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    {formatDate(entry.date)}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    {entry.location}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    <button
                      onClick={() => handleViewReason(entry)}
                      className="text-left hover:text-green-600 hover:underline cursor-pointer"
                      title="Click to view full reason"
                    >
                      {truncateReason(entry.reason)}
                    </button>
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      entry.watch === 'Alpha' ? 'bg-blue-100 text-blue-800' :
                      entry.watch === 'Bravo' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {entry.watch}
                    </span>
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    GH₵ {parseFloat(entry.amount).toFixed(2)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                      <button
                        onClick={() => onEdit(entry)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-sm font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id, entry.date, entry.location)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className={`px-6 py-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandbyTable;
