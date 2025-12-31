import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, set } from 'firebase/database';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';
import ExcelJS from 'exceljs';

const AssetRegisterTable = ({ onEdit }) => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    const entriesRef = ref(db, 'assetRegister');
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entriesArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Sort by date descending
        entriesArray.sort((a, b) => new Date(b.date) - new Date(a.date));
        setEntries(entriesArray);
      } else {
        setEntries([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const truncateText = (text, wordLimit = 5) => {
    if (!text) return '';
    const words = text.split(' ');
    if (words.length > wordLimit) {
      return words.slice(0, wordLimit).join(' ') + '...';
    }
    return text;
  };

  const handleViewDetails = (entry) => {
    Swal.fire({
      title: entry.assetName,
      html: `
        <div class="text-left space-y-2">
          <p><strong>S/N:</strong> ${entry.sn}</p>
          <p><strong>Date:</strong> ${formatDate(entry.date)}</p>
          <p><strong>Model:</strong> ${entry.model}</p>
          <p><strong>Serial Number:</strong> ${entry.serialNumber}</p>
          <p><strong>Asset Code:</strong> ${entry.assetCode}</p>
          <p><strong>Amount:</strong> ₵${parseFloat(entry.amount || 0).toFixed(2)}</p>
          <p><strong>Condition:</strong> ${entry.condition}</p>
        </div>
      `,
      confirmButtonColor: '#16a34a',
      width: '600px'
    });
  };

  const handleDelete = async (id, assetName) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${assetName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await remove(ref(db, `assetRegister/${id}`));
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Asset entry has been deleted.',
          confirmButtonColor: '#16a34a'
        });
      } catch (error) {
        console.error('Error deleting entry:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete entry. Please try again.',
          confirmButtonColor: '#2563eb'
        });
      }
    }
  };

  const handleExport = async () => {
    if (filteredEntries.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data to Export',
        text: 'There are no entries to export.',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Asset Register');

      worksheet.columns = [
        { key: 'sn', header: 'S/N', width: 10 },
        { key: 'date', header: 'Date', width: 12 },
        { key: 'assetName', header: 'Asset Name', width: 25 },
        { key: 'model', header: 'Model', width: 20 },
        { key: 'serialNumber', header: 'Serial Number', width: 20 },
        { key: 'assetCode', header: 'Asset Code', width: 15 },
        { key: 'amount', header: 'Amount (₵)', width: 15 },
        { key: 'condition', header: 'Condition', width: 15 }
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF000000' } };
      headerRow.alignment = { horizontal: 'center' };

      filteredEntries.forEach(entry => {
        const excelDate = entry.timestamp ? new Date(entry.timestamp) : new Date(entry.date);
        worksheet.addRow([
          entry.sn,
          excelDate,
          entry.assetName,
          entry.model,
          entry.serialNumber,
          entry.assetCode,
          parseFloat(entry.amount || 0).toFixed(2),
          entry.condition
        ]);
      });

      // Format the date column as a proper date
      worksheet.getColumn(2).numFmt = 'dd/mm/yyyy';

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Asset_Register_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful!',
        text: `Asset register exported successfully.`,
        confirmButtonColor: '#2563eb'
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'There was an error exporting your data.',
        confirmButtonColor: '#2563eb'
      });
    }
  };

  // Get unique years
  const years = ['all', ...new Set(entries.map(entry => new Date(entry.date).getFullYear()))].sort((a, b) => {
    if (a === 'all') return -1;
    if (b === 'all') return 1;
    return b - a;
  });

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.sn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.assetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.assetCode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === 'all' || new Date(entry.date).getFullYear().toString() === selectedYear;
    
    return matchesSearch && matchesYear;
  });

  // Calculate total assets and total amount
  const totalAssets = filteredEntries.length;
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + parseFloat(entry.amount || 0), 0);

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 bg-opacity-80 border-gray-700' : 'bg-white bg-opacity-80 border-white border-opacity-20'} backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
        <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Asset Register
        </h2>
        <button
          onClick={handleExport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm sm:text-base"
        >
          Export to Excel
        </button>
      </div>

      {/* Summary Card */}
      <div className={`${theme === 'dark' ? 'bg-gray-700 bg-opacity-50' : 'bg-blue-50 bg-opacity-50'} backdrop-blur-sm rounded-xl p-4 mb-4 sm:mb-6 border ${theme === 'dark' ? 'border-gray-600' : 'border-blue-100'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Assets</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              {totalAssets}
            </p>
          </div>
          <div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
            <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              ₵{totalAmount.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4 sm:mb-6">
        <input
          type="text"
          placeholder="Search by S/N, name, model, serial, or asset code..."
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
        <table className={`min-w-full divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
          <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                S/N
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Date
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Asset Name
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Model
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Serial Number
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Asset Code
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Amount (₵)
              </th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                Condition
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
                    {entry.sn}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    {formatDate(entry.date)}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    <button
                      onClick={() => handleViewDetails(entry)}
                      className="text-left hover:text-blue-600 hover:underline cursor-pointer font-medium"
                      title="Click to view full details"
                    >
                      {truncateText(entry.assetName, 4)}
                    </button>
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    {entry.model}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    {entry.serialNumber}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    {entry.assetCode}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    ₵{parseFloat(entry.amount || 0).toFixed(2)}
                  </td>
                  <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      entry.condition === 'Good' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.condition}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                      <button
                        onClick={() => onEdit(entry)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id, entry.assetName)}
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
                <td colSpan="8" className={`px-6 py-8 text-center text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetRegisterTable;
