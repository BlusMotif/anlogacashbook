import React, { useState, useEffect } from 'react';
import { ref, push, set } from 'firebase/database';
import { db, auth } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';

// Vehicle inspection items
const INSPECTION_ITEMS = [
  'KEYS',
  'TYRE 12345',
  'WHEEL CAP',
  'RIMS 1234',
  'DOOR GLASS (QUARTER)',
  'DOOR LEVERS / LOCKS',
  'WIND SCREEN',
  'WIND SCREEN SPRAY',
  'WIPERS',
  'SIDE MIRRORS',
  'ENGINE (CLEANLINESS)',
  'ENGINE OIL',
  'WATER LEVEL',
  'FUEL LEVEL F, 1/2, 3/4 E',
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
  'INTERCOM / TELEPHONE',
  'AIR CONDITIONING (DRIVER / PATIENT COMPARTMENT)',
  'TFT COLOR DISPLAY',
  'ELECTRIC LAMP – PORTABLE',
  'ALLEN KEY - SET',
  'LOG BOOK',
  'DRIVERS MANUAL'
];

// Sanitize keys for Firebase compatibility
const sanitizeKey = (str) => str.replace(/[.#$/\[\]]/g, '_');
const itemKeyMap = INSPECTION_ITEMS.reduce((acc, item) => {
  acc[item] = sanitizeKey(item);
  return acc;
}, {});

const VehicleInspectionForm = ({ editingEntry = null, onCancelEdit = null }) => {
  const { theme } = useTheme();
  const [date, setDate] = useState('');
  const [watchCode, setWatchCode] = useState('');
  const [handingOverCrew, setHandingOverCrew] = useState('');
  const [takingOverCrew, setTakingOverCrew] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize checklist data with all items set to empty
  const initialChecklistState = INSPECTION_ITEMS.reduce((acc, item) => {
    acc[itemKeyMap[item]] = '';
    return acc;
  }, {});

  const [checklistData, setChecklistData] = useState(initialChecklistState);

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date || '');
      setWatchCode(editingEntry.watchCode || '');
      setHandingOverCrew(editingEntry.handingOverCrew || '');
      setTakingOverCrew(editingEntry.takingOverCrew || '');
      setChecklistData(editingEntry.checklistData || initialChecklistState);
    } else {
      // Reset form when not editing
      setDate('');
      setWatchCode('');
      setHandingOverCrew('');
      setTakingOverCrew('');
      setChecklistData(initialChecklistState);
    }
  }, [editingEntry]);

  const handleChecklistChange = (item, value) => {
    setChecklistData(prev => ({
      ...prev,
      [itemKeyMap[item]]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that all items have been selected
    const emptyItems = INSPECTION_ITEMS.filter(item => !checklistData[itemKeyMap[item]] || checklistData[itemKeyMap[item]] === '');
    
    if (emptyItems.length > 0) {
      const itemsList = emptyItems.slice(0, 5).join(', ');
      const remaining = emptyItems.length > 5 ? ` and ${emptyItems.length - 5} more` : '';
      
      Swal.fire({
        title: 'Incomplete Checklist',
        html: `Please select status for all inspection items.<br><br>Missing items: ${itemsList}${remaining}<br><br>Total missing: ${emptyItems.length} item(s)`,
        icon: 'warning',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const inspectionRef = editingEntry
        ? ref(db, `ambulanceInspection/${editingEntry.id}`)
        : ref(db, 'ambulanceInspection');
      
      const inspectionData = {
        date,
        watchCode,
        checklistData,
        handingOverCrew,
        takingOverCrew,
        userId: user.uid,
        timestamp: Date.now()
      };

      if (editingEntry) {
        await set(inspectionRef, inspectionData);
      } else {
        await push(inspectionRef, inspectionData);
      }

      Swal.fire({
        title: 'Success!',
        text: `Vehicle inspection sheet ${editingEntry ? 'updated' : 'submitted'} successfully`,
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });

      // Reset form
      if (!editingEntry) {
        setDate('');
        setWatchCode('');
        setHandingOverCrew('');
        setTakingOverCrew('');
        setChecklistData(initialChecklistState);
      } else if (onCancelEdit) {
        onCancelEdit();
      }
    } catch (error) {
      console.error('Error submitting vehicle inspection:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to submit vehicle inspection sheet',
        icon: 'error',
        confirmButtonColor: '#16a34a'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-md`}>
      <h2 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
        VEHICLE INSPECTION SHEET
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date, Watch Code, and Crew Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Watch Code <span className="text-red-500">*</span>
            </label>
            <select
              value={watchCode}
              onChange={(e) => setWatchCode(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            >
              <option value="">Select watch code</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              INITIALS - HANDING OVER CREW <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={handingOverCrew}
              onChange={(e) => setHandingOverCrew(e.target.value)}
              placeholder="Initials"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              INITIALS - TAKING OVER CREW <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={takingOverCrew}
              onChange={(e) => setTakingOverCrew(e.target.value)}
              placeholder="Initials"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              required
            />
          </div>
        </div>

        {/* Inspection Checklist */}
        <div>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Vehicle Inspection Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INSPECTION_ITEMS.map((item, index) => (
              <div key={index}>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item} <span className="text-red-500">*</span>
                </label>
                <select
                  value={checklistData[itemKeyMap[item]] || ''}
                  onChange={(e) => handleChecklistChange(item, e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${!checklistData[itemKeyMap[item]] ? 'border-red-300' : ''}`}
                  required
                >
                  <option value="">Select *</option>
                  <option value="OK">OK (Clean & Operational)</option>
                  <option value="NF">NF (Present but Faulty)</option>
                  <option value="A">A (Absent)</option>
                  <option value="D">D (Dirty)</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          {editingEntry && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (editingEntry ? 'Updating...' : 'Submitting...') : (editingEntry ? 'Update Inspection Sheet' : 'Submit Inspection Sheet')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleInspectionForm;
