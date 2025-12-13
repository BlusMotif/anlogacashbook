import React, { useState, useEffect } from 'react';
import { ref, onValue, remove } from 'firebase/database';
import { db, auth } from '../firebase';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useTheme } from '../ThemeContext';

const CHECKLIST_ITEMS = [
  'PATIENT MONITOR',
  'FETAL MONITOR',
  'NEBULIZER',
  'SYRINGE PUMP',
  'INFUSION PUMP VOLUMETRIC',
  'KED',
  'PORTABLE VENTILATOR SET + O2',
  'O2 CYLINDERS (2.10L, 1 PORTABLE)',
  'MANUAL ASPIRATOR / SUCTION',
  'PORTABLE SUCTION UNIT',
  'TRIAGE TAG (CARDS / TAPE ROLLS)',
  'REGULATOR & HUMIDIFIER',
  'AED W / ADULT & INFANT SET',
  'LONG & SHORT SPLINTS - ALL AGES',
  'AIR SPLINTS',
  'TRACTION SPLINT - SET',
  'INTUBATION SET',
  'BAG VALVE MASK - ALL SIZES',
  'PLASTIC ARMS SLINGS - ALL SIZES',
  'PROTECTIVE HELMET / EYE WEAR',
  'HIGH VISIBILITY CLOTHING',
  'MOUTH VALVE MASK - ALL SIZES',
  'PENLIGHT',
  'BP APARATUS - SET',
  'GLUCOMETER',
  'PULSE AUXIMETER',
  'THERMOMETER - NON CONTACT',
  'NEONATE THERMOMETER',
  'CLINICAL THERMOMETER',
  'FORCEPTS',
  'OROPHARYNGEAL AIRWAYS',
  'NASOPHARYNGEAL AIRWAYS',
  'POLE STRETCHRE - FOLDABLE',
  'SIMPLE FACE MASK',
  'NASAL CANNULAE',
  'NONREBREATHER MASK',
  'BLANKET',
  'HEAD IMMOBILIZER',
  'SPINE BOARD + FASTENERS - ADULT',
  'SPINE BOARD + FASTENERS - PED',
  'PATIENT TROLLEY WITH PILLOW',
  'SCOOPER STRECTURE',
  'STAIR / CARRY CHAIR',
  'CERVICAL COLLARS',
  'PLASTERS - VARIOUS SIZES',
  'GAUZE BANDAGE - VARIOUS SIZES',
  'TRIANGULAR BANDAGES',
  'EXAM GLOVES - SMALL',
  'EXAM GLOVES - MEDIUM',
  'EXAM GLOVES - LARGE',
  'PARAMEDIC EMERGENCY BAG - SET',
  'FLOOR CLEANLINESS',
  'SHELVES CLEANLINESS'
];

const EquipmentChecklistTable = ({ onEdit }) => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const entriesPerPage = 10;

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const entriesRef = ref(db, 'equipmentChecklist');
      const unsubscribe = onValue(entriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const entriesArray = Object.entries(data).map(([id, entry]) => ({
            id,
            ...entry
          }));
          // Sort by timestamp (newest first)
          entriesArray.sort((a, b) => b.timestamp - a.timestamp);
          setEntries(entriesArray);
        } else {
          setEntries([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  // Filter entries based on search term and year
  useEffect(() => {
    let filtered = entries;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.handingOverCrew?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.takingOverCrew?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.date?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(entry => {
        const entryYear = new Date(entry.date).getFullYear().toString();
        return entryYear === selectedYear;
      });
    }

    setFilteredEntries(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedYear, entries]);

  // Get unique years from entries
  const getYears = () => {
    const years = [...new Set(entries.map(entry => new Date(entry.date).getFullYear()))];
    return years.sort((a, b) => b - a);
  };

  // Pagination
  const indexOfLastEntry = currentPage * entriesPerPage;
  const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
  const currentEntries = filteredEntries.slice(indexOfFirstEntry, indexOfLastEntry);
  const totalPages = Math.ceil(filteredEntries.length / entriesPerPage);

  const handleDelete = async (id, date) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the checklist for "${date}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const entryRef = ref(db, `equipmentChecklist/${id}`);
        await remove(entryRef);
        Swal.fire({
          title: 'Deleted!',
          text: 'Checklist has been deleted.',
          icon: 'success',
          confirmButtonColor: '#16a34a'
        });
      } catch (error) {
        console.error('Error deleting entry:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete checklist.',
          icon: 'error',
          confirmButtonColor: '#16a34a'
        });
      }
    }
  };

  const handleViewDetails = (entry) => {
    const formattedDate = new Date(entry.date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Count statuses
    const checklistData = entry.checklistData || {};
    const statusCounts = {
      P: 0,
      F: 0,
      'N/A': 0
    };

    Object.values(checklistData).forEach(value => {
      if (value === 'P') statusCounts.P++;
      else if (value === 'F') statusCounts.F++;
      else if (value === 'N/A') statusCounts['N/A']++;
    });

    const itemsHtml = CHECKLIST_ITEMS.map(item => {
      const status = checklistData[item] || 'Not Checked';
      let statusColor = '#6b7280';
      let statusText = 'Not Checked';
      
      if (status === 'P') {
        statusColor = '#16a34a';
        statusText = 'Perfect';
      } else if (status === 'F') {
        statusColor = '#dc2626';
        statusText = 'Faulty';
      } else if (status === 'N/A') {
        statusColor = '#6b7280';
        statusText = 'N/A';
      }
      
      return `<div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-weight: 500;">${item}</span>
        <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>
      </div>`;
    }).join('');

    Swal.fire({
      title: '<span style="font-size: 1.25rem;">Medical Equipment Checklist Details</span>',
      html: `
        <div style="text-align: left; font-size: 0.85em;">
          <p style="margin-bottom: 10px; font-size: 0.9em;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin-bottom: 10px; font-size: 0.9em;"><strong>INITIALS - HANDING OVER CREW:</strong> ${entry.handingOverCrew}</p>
          <p style="margin-bottom: 10px; font-size: 0.9em;"><strong>INITIALS - TAKING OVER CREW:</strong> ${entry.takingOverCrew}</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <h4 style="margin-bottom: 10px; font-weight: bold; font-size: 0.95em;">Summary</h4>
            <p style="margin: 5px 0; font-size: 0.85em;"><span style="color: #16a34a; font-weight: bold;">Perfect:</span> ${statusCounts.P}</p>
            <p style="margin: 5px 0; font-size: 0.85em;"><span style="color: #dc2626; font-weight: bold;">Faulty:</span> ${statusCounts.F}</p>
            <p style="margin: 5px 0; font-size: 0.85em;"><span style="color: #6b7280; font-weight: bold;">N/A:</span> ${statusCounts['N/A']}</p>
          </div>
          
          <h4 style="margin-top: 20px; margin-bottom: 10px; font-weight: bold; font-size: 0.95em;">Equipment Items:</h4>
          <div style="max-height: 400px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 0.8em;">
            ${itemsHtml}
          </div>
        </div>
      `,
      confirmButtonColor: '#16a34a',
      width: '600px'
    });
  };

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Equipment Checklist');

      // Create header row with Date first, equipment items, then crew columns last
      const headers = ['Date', ...CHECKLIST_ITEMS, 'INITIALS - HANDING OVER CREW', 'INITIALS - TAKING OVER CREW'];
      worksheet.addRow(headers);

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { name: 'Calibri Light', color: { argb: 'FFFFFFFF' }, size: 12 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF16a34a' }
      };
      headerRow.alignment = { 
        vertical: 'bottom', 
        horizontal: 'center',
        textRotation: 90,
        wrapText: false
      };
      headerRow.height = 200; // Increased height to ensure all text shows

      // Set column widths - very slim spacing
      worksheet.getColumn(1).width = 6; // Date - slim
      // Equipment columns - very slim since text is vertical
      for (let i = 2; i <= CHECKLIST_ITEMS.length + 1; i++) {
        worksheet.getColumn(i).width = 4;
      }
      worksheet.getColumn(CHECKLIST_ITEMS.length + 2).width = 6; // Handing Over Crew - slim
      worksheet.getColumn(CHECKLIST_ITEMS.length + 3).width = 6; // Taking Over Crew - slim

      // Add data rows
      filteredEntries.forEach(entry => {
        const formattedDate = new Date(entry.date).toLocaleDateString('en-GB');
        const checklistData = entry.checklistData || {};
        
        const rowData = [
          formattedDate,
          ...CHECKLIST_ITEMS.map(item => checklistData[item] || ''),
          entry.handingOverCrew || '',
          entry.takingOverCrew || ''
        ];

        const dataRow = worksheet.addRow(rowData);

        // Color code the status cells (equipment items are now columns 2 to 51)
        CHECKLIST_ITEMS.forEach((item, index) => {
          const cellIndex = index + 2; // Starting after Date
          const cell = dataRow.getCell(cellIndex);
          const value = checklistData[item];
          
          if (value === 'P') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFD1FAE5' } // Light green
            };
          } else if (value === 'F') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFECACA' } // Light red
            };
          } else if (value === 'N/A') {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3F4F6' } // Light gray
            };
          }
        });
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

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Medical_Equipment_Checklist_${new Date().toISOString().split('T')[0]}.xlsx`);

      Swal.fire({
        title: 'Success!',
        text: 'Medical equipment checklist exported successfully',
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

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 sm:p-6`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Medical Equipment Checklists
        </h2>
        <button
          onClick={exportToExcel}
          disabled={filteredEntries.length === 0}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export to Excel
        </button>
      </div>

      {/* Summary Card */}
      <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-green-50'} rounded-lg p-4 mb-6`}>
        <div className="text-center">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Checklists</p>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{filteredEntries.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <input
            type="text"
            placeholder="Search by date, crew initials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-gray-300 placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
        <div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-gray-300' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Years</option>
            {getYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Date</th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>INITIALS - HANDING OVER CREW</th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>INITIALS - TAKING OVER CREW</th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
              <th className={`px-3 sm:px-6 py-3 text-left text-xs font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {currentEntries.length > 0 ? (
              currentEntries.map((entry) => {
                const checklistData = entry.checklistData || {};
                const checkedCount = Object.values(checklistData).filter(v => v !== '').length;
                const faultyCount = Object.values(checklistData).filter(v => v === 'F').length;
                
                return (
                  <tr key={entry.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                      {new Date(entry.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                      {entry.handingOverCrew}
                    </td>
                    <td className={`px-3 sm:px-6 py-4 whitespace-nowrap text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                      {entry.takingOverCrew}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-gray-500">
                          {checkedCount}/{CHECKLIST_ITEMS.length} checked
                        </span>
                        {faultyCount > 0 && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            {faultyCount} Faulty
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
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
                <td colSpan="5" className={`px-6 py-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  No checklists found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg ${
              currentPage === 1
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Previous
          </button>
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg ${
              currentPage === totalPages
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default EquipmentChecklistTable;
