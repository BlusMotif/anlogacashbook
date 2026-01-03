import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db, handleFirebaseError } from '../firebase';
import { useTheme } from '../ThemeContext';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

// Vehicle inspection items
const INSPECTION_ITEMS = [
  'KEYS',
  'TYRE 12345',
  'WHEEL CAP',
  'RIMS 1234',
  'DOOR GLASS (QUARTER)',
  'DOOR LEAVERS / LOCKS',
  'WIND SCREEN',
  'WIND SCREEN SPRAY',
  'WIPERS',
  'SIDE MIRRORS',
  'ENGINE (CLEANLINESS)',
  'ENGINE OIL',
  'WATER LEVEL',
  'FUEL LEVEL F, 1/2, 3/4, E',
  'OTHER FLUIDS / LUBRICANT',
  'EMERGENCY HAMMER / SEAT BELT CUTTER',
  'INTERIOR (CLEANLINESS)',
  'SEAT BELTS',
  'SEATS',
  'FLOOR MAT',
  'SIREN',
  'BEACON LIGHT',
  'FOG LIGHT',
  'BRAKES HAND / FOOT',
  'PARKING / BRAKE LIGHT',
  'INDICATORS',
  'WARNING TRIANGLE',
  'UV TORCH WITH CHARGEABLE BATTRIES',
  'FLASH LIGHT',
  'WORKING LIGHT',
  'WHEEL SPANNER / HYDRAULIC JEK',
  'NIGHT DRIVING GOGGLE',
  'FIRE EXTINGUISHERS (2)',
  'PORTABLE TYRE INFLATOR',
  'BODY FOR DENTS / SCRATCHES',
  'MOUNTED GOTA RADIO',
  'INTERCOM TELEPHONE',
  'AIR CONDITIONING (DRIVER / PATIENT COMPARTMENT)',
  'TFT COLOUR DISPLAY',
  'ELECTRIC LAMP – PORTABLE',
  'ALLEN KEY - SET',
  'LOG BOOK',
  'DRIVERS MANUAL'
];

// Date formatting function
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Function to parse date string and return sortable value
const parseDateForSorting = (dateStr) => {
  if (!dateStr) return 0;
  
  const match = dateStr.match(/^([MN])(\d+)$/);
  if (!match) return 0;
  
  const type = match[1]; // 'M' or 'N'
  const number = parseInt(match[2], 10);
  
  // M comes before N for the same number
  // So M1 = 1.0, N1 = 1.5, M2 = 2.0, N2 = 2.5, etc.
  return number + (type === 'M' ? 0 : 0.5);
};

// Sanitize keys for Firebase compatibility
const sanitizeKey = (str) => str.replace(/[.#$/\[\]]/g, '_');
const itemKeyMap = INSPECTION_ITEMS.reduce((acc, item) => {
  acc[item] = sanitizeKey(item);
  return acc;
}, {});

const VehicleInspectionTable = ({ onEdit }) => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [sortBy, setSortBy] = useState('recent-entry');

  useEffect(() => {
    const inspectionRef = ref(db, 'ambulanceInspection');
    const unsubscribe = onValue(inspectionRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const entriesArray = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setEntries(entriesArray);
        } else {
          setEntries([]);
        }
      } catch (error) {
        console.error('Error processing vehicle inspection data:', error);
        setEntries([]);
        const { errorTitle, errorMessage } = handleFirebaseError(error, 'load vehicle inspection data');
        Swal.fire({
          icon: 'error',
          title: errorTitle,
          text: errorMessage,
          confirmButtonColor: '#16a34a'
        });
      }
    }, (error) => {
      console.error('Database read error:', error);
      setEntries([]);
      const { errorTitle, errorMessage } = handleFirebaseError(error, 'load vehicle inspection data');
      Swal.fire({
        icon: 'error',
        title: errorTitle,
        text: errorMessage,
        confirmButtonColor: '#16a34a'
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = entries;

    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.handingOverCrew?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.takingOverCrew?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.watchCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.date?.includes(searchTerm)
      );
    }

    if (selectedYear !== 'all') {
      filtered = filtered.filter((entry) => {
        // Skip year filtering for M1/N1 format dates
        if (entry.date && entry.date.match(/^([MN])(\d+)$/)) {
          return true;
        }
        const entryYear = new Date(entry.date).getFullYear().toString();
        return entryYear === selectedYear;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent-entry':
          // Sort by timestamp (most recent first)
          return (b.timestamp || 0) - (a.timestamp || 0);
        case 'oldest-entry':
          // Sort by timestamp (oldest first)
          return (a.timestamp || 0) - (b.timestamp || 0);
        case 'recent-edit':
          // If both have updatedAt, sort by that; otherwise, prefer entries with updatedAt
          if (a.updatedAt && b.updatedAt) {
            return b.updatedAt - a.updatedAt;
          } else if (a.updatedAt) {
            return -1; // a comes first (has been edited)
          } else if (b.updatedAt) {
            return 1; // b comes first (has been edited)
          } else {
            // Neither has been edited, sort by creation timestamp
            return (b.timestamp || 0) - (a.timestamp || 0);
          }
        default:
          return (b.timestamp || 0) - (a.timestamp || 0);
      }
    });

    setFilteredEntries(filtered);
  }, [searchTerm, selectedYear, entries, sortBy]);

  const handleDelete = async (id, date) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete inspection sheet for ${date}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#dc2626',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await remove(ref(db, `ambulanceInspection/${id}`));
        Swal.fire({
          title: 'Deleted!',
          text: 'Vehicle inspection sheet has been deleted.',
          icon: 'success',
          confirmButtonColor: '#16a34a'
        });
      } catch (error) {
        console.error('Error deleting inspection:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete inspection sheet',
          icon: 'error',
          confirmButtonColor: '#16a34a'
        });
      }
    }
  };

  const handleViewDetails = (entry) => {
    const checklistData = entry.checklistData || {};
    
    const statusCounts = { OK: 0, NF: 0, A: 0, D: 0 };
    Object.values(checklistData).forEach(value => {
      if (value === 'OK') statusCounts.OK++;
      else if (value === 'NF') statusCounts.NF++;
      else if (value === 'A') statusCounts.A++;
      else if (value === 'D') statusCounts.D++;
    });

    const itemsHtml = INSPECTION_ITEMS.map(item => {
      const status = checklistData[itemKeyMap[item]] || 'Not Set';
      let statusColor = 'text-gray-600';
      if (status === 'OK') statusColor = 'text-green-600';
      else if (status === 'NF') statusColor = 'text-orange-600';
      else if (status === 'A') statusColor = 'text-red-600';
      else if (status === 'D') statusColor = 'text-yellow-600';
      
      return `<div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-weight: 500;">${item}</span>
        <span class="${statusColor}" style="font-weight: bold;">${status}</span>
      </div>`;
    }).join('');

    Swal.fire({
      title: '<span style="font-size: 1.25rem;">Vehicle Inspection Sheet Details</span>',
      html: `
        <div style="text-align: left; font-size: 0.85em;">
          <p style="margin-bottom: 10px; font-size: 0.9em;"><strong>Date:</strong> ${entry.date}</p>
          <p style="margin-bottom: 10px; font-size: 0.9em;"><strong>Watch Code:</strong> ${entry.watchCode || 'N/A'}</p>
          <p style="margin-bottom: 10px; font-size: 0.9em;"><strong>INITIALS - HANDING OVER CREW:</strong> ${entry.handingOverCrew || 'N/A'}</p>
          <p style="margin-bottom: 10px; font-size: 0.9em;"><strong>INITIALS - TAKING OVER CREW:</strong> ${entry.takingOverCrew || 'N/A'}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <h4 style="margin-bottom: 10px; font-weight: bold; font-size: 0.95em;">Summary</h4>
            <p style="margin: 5px 0; font-size: 0.85em;"><span style="color: #16a34a; font-weight: bold;">OK (Clean & Operational):</span> ${statusCounts.OK}</p>
            <p style="margin: 5px 0; font-size: 0.85em;"><span style="color: #ea580c; font-weight: bold;">NF (Present but Faulty):</span> ${statusCounts.NF}</p>
            <p style="margin: 5px 0; font-size: 0.85em;"><span style="color: #dc2626; font-weight: bold;">A (Absent):</span> ${statusCounts.A}</p>
            <p style="margin: 5px 0; font-size: 0.85em;"><span style="color: #ca8a04; font-weight: bold;">D (Dirty):</span> ${statusCounts.D}</p>
          </div>
          
          <h4 style="margin-top: 20px; margin-bottom: 10px; font-weight: bold; font-size: 0.95em;">Inspection Items:</h4>
          <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.8em;">
            ${itemsHtml}
          </div>
        </div>
      `,
      width: '600px',
      confirmButtonColor: '#16a34a'
    });
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Vehicle Inspection');

      // Add main heading - merge cells A1 to I1 for full display
      worksheet.mergeCells('A1:I1');
      const mainHeadingCell = worksheet.getCell('A1');
      mainHeadingCell.value = 'WATCH AMBULANCE INSPECTION SHEET';
      mainHeadingCell.font = { name: 'Calibri', size: 12, bold: false, color: { argb: 'FF000000' } };
      mainHeadingCell.alignment = { horizontal: 'center', vertical: 'center' };

      // Add MONTH and YEAR inline with main heading (10cm apart)
      const monthCell = worksheet.getCell('J1');
      monthCell.value = 'MONTH';
      monthCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FF000000' } };
      monthCell.alignment = { horizontal: 'center', vertical: 'center' };

      const yearCell = worksheet.getCell('S1');
      yearCell.value = 'YEAR';
      yearCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FF000000' } };
      yearCell.alignment = { horizontal: 'center', vertical: 'center' };

      // Add VEHICLE REGISTRATION NO under main heading
      const vehicleRegCell = worksheet.getCell('A2');
      vehicleRegCell.value = 'VEHICLE REGISTRATION NO:';
      vehicleRegCell.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FF000000' } };
      vehicleRegCell.alignment = { horizontal: 'left', vertical: 'center' };

      // Add STATION and sub heading inline with 10cm spacing
      const stationCell = worksheet.getCell('A3');
      stationCell.value = 'STATION';
      stationCell.font = { name: 'Calibri', size: 9, bold: false, color: { argb: 'FF000000' } };
      stationCell.alignment = { horizontal: 'center', vertical: 'center' };

      const subHeadingCell = worksheet.getCell('J3');
      subHeadingCell.value = 'TO BE APPLIED AT THE BEGINNING OF EVERY SHIFT';
      subHeadingCell.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FF000000' } };
      subHeadingCell.alignment = { horizontal: 'left', vertical: 'center' };

      // Add empty row for spacing
      worksheet.addRow([]);
      worksheet.addRow([]);

      // Create header row with Date, Watch Code first, inspection items, then crew columns last
      const headers = ['DATE', 'WATCH CODE', ...INSPECTION_ITEMS, 'INITIALS - HANDING OVER CREW', 'INITIALS - TAKING OVER CREW'];
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(6);
      headerRow.font = { name: 'Calibri', color: { argb: 'FF000000' }, size: 11, bold: false };
      headerRow.alignment = { 
        vertical: 'bottom', 
        horizontal: 'center',
        textRotation: 90,
        wrapText: false
      };
      headerRow.height = 200; // Increased height to ensure all text shows

      // Set column widths - very slim spacing
      worksheet.getColumn(1).width = 6; // Date - slim
      worksheet.getColumn(2).width = 5; // Watch Code - slim
      // Inspection columns - very slim since text is vertical
      for (let i = 3; i <= INSPECTION_ITEMS.length + 2; i++) {
        worksheet.getColumn(i).width = 4;
      }
      worksheet.getColumn(INSPECTION_ITEMS.length + 3).width = 6; // INITIALS - HANDING OVER CREW - slim
      worksheet.getColumn(INSPECTION_ITEMS.length + 4).width = 6; // INITIALS - TAKING OVER CREW - slim

      // Add data rows
      filteredEntries.forEach(entry => {
        const checklistData = entry.checklistData || {};
        
        const rowData = [
          entry.date, // Use raw date value (M1, N1, etc.) instead of converting to Date
          entry.watchCode || '',
          ...INSPECTION_ITEMS.map(item => checklistData[itemKeyMap[item]] || ''),
          entry.handingOverCrew || '',
          entry.takingOverCrew || ''
        ];

        const dataRow = worksheet.addRow(rowData);

        // Remove date formatting since we're using raw text values
        // dataRow.getCell(1).numFmt = 'dd/mm/yyyy';
      });

      // Add borders to all cells
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      // Save the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Vehicle_Inspection_Sheet_${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire({
        title: 'Success!',
        text: 'Vehicle inspection sheets exported successfully',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to export to Excel',
        icon: 'error',
        confirmButtonColor: '#16a34a'
      });
    }
  };

  const years = ['all', ...new Set(entries
    .filter(entry => !entry.date || !entry.date.match(/^([MN])(\d+)$/)) // Filter out M1/N1 format dates
    .map((entry) => new Date(entry.date).getFullYear().toString())
  )];

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md mt-6`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          WATCH AMBULANCE INSPECTION SHEET
        </h2>
        <button
          onClick={exportToExcel}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
        >
          Export to Excel
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by date, KM, watch code, crew..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
            theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
        <div className="flex flex-col">
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Filter by Year:
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year === 'all' ? 'All Years' : year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Sort By:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
              theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="recent-entry">Most Recent Entries</option>
            <option value="oldest-entry">Oldest Entries First</option>
            <option value="recent-edit">Recently Edited</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
            <tr>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                DATE
              </th>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                WATCH CODE
              </th>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                INITIALS - HANDING OVER CREW
              </th>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                INITIALS - TAKING OVER CREW
              </th>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Status
              </th>
              <th className={`px-4 py-3 text-left text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className={theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}>
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => {
                const checklistData = entry.checklistData || {};
                const totalItems = INSPECTION_ITEMS.length;
                const checkedItems = Object.values(checklistData).filter(val => val !== '').length;
                const faultyItems = Object.values(checklistData).filter(val => val === 'NF' || val === 'A').length;

                return (
                  <tr key={entry.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span>{entry.date}</span>
                        {entry.updatedAt && (
                          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                            theme === 'dark' 
                              ? 'bg-blue-900 text-blue-200' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            Edited
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{entry.watchCode || 'N/A'}</td>
                    <td className="px-4 py-3">{entry.handingOverCrew || 'N/A'}</td>
                    <td className="px-4 py-3">{entry.takingOverCrew || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm whitespace-nowrap">{checkedItems}/{totalItems} checked</span>
                        {faultyItems > 0 && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded whitespace-nowrap">
                            {faultyItems} issues
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(entry)}
                            className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetails(entry)}
                          className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-green-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id, entry.date)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium transition duration-150 focus:outline-none focus:ring-1 focus:ring-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                  No inspection sheets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VehicleInspectionTable;
