import React, { useState } from 'react';
import { ref, push } from 'firebase/database';
import { db, auth } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';

// Ambulance inspection items
const INSPECTION_ITEMS = [
  'TYRE',
  'WHEEL CAP',
  'DOOR GLASS (QUARTER)',
  'DOOR LEVERS-LOCKS',
  'WIND SCREEN GLASS',
  'WIND SCREEN SPRAY',
  'WIPERS',
  'SIDE MIRRORS',
  'ENGINE CLEANLINESS',
  'ENGINE OIL',
  'WATER LEVEL',
  'FUEL LEVEL',
  'OTHER FLUIDS-LUBRICATION',
  'EMERGENCY HAMMER - SEATBELT CUTTER',
  'OXYGEN CYLINDER',
  'SEAT BELTS',
  'SEATS',
  'FLOOR MAT',
  'SIREN',
  'BEACON LIGHT',
  'FOG LIGHT',
  'PARKING-REAR M LIGHT',
  'INDICATORS',
  'WARNING TRIANGLE',
  'DOOR-LIGHT',
  'FLASHLIGHT',
  'WORKABLE BATTERIES',
  'NIGHT DRIVING GOGGLES',
  'FIRE EXTINGUISHER',
  'PORTABLE FIRST AID KIT',
  'MOUNTED COPRA RADIO',
  'INTERCOM-TELEPHONE',
  'PATIENT COMPARTMENT INTERIOR CLEANLINESS',
  'ELECTRICAL DISPLAY',
  'LOG BOOK',
  "DRIVER'S MANUAL",
  'ALLEN KEY SET',
  'KEYS',
  'TFT COLOUR DISPLAY'
];

const VehicleInspectionForm = () => {
  const { theme } = useTheme();
  const [date, setDate] = useState('');
  const [watchCode, setWatchCode] = useState('');
  const [handingOverCrew, setHandingOverCrew] = useState('');
  const [takingOverCrew, setTakingOverCrew] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize checklist data with all items set to empty
  const initialChecklistState = INSPECTION_ITEMS.reduce((acc, item) => {
    acc[item] = '';
    return acc;
  }, {});

  const [checklistData, setChecklistData] = useState(initialChecklistState);

  const handleChecklistChange = (item, value) => {
    setChecklistData(prev => ({
      ...prev,
      [item]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that all items have been selected
    const emptyItems = INSPECTION_ITEMS.filter(item => !checklistData[item] || checklistData[item] === '');
    
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

      const inspectionRef = ref(db, 'ambulanceInspection');
      await push(inspectionRef, {
        date,
        watchCode,
        checklistData,
        handingOverCrew,
        takingOverCrew,
        userId: user.uid,
        timestamp: Date.now()
      });

      Swal.fire({
        title: 'Success!',
        text: 'Vehicle inspection sheet submitted successfully',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });

      // Reset form
      setDate('');
      setWatchCode('');
      setHandingOverCrew('');
      setTakingOverCrew('');
      setChecklistData(initialChecklistState);
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
            <input
              type="text"
              value={watchCode}
              onChange={(e) => setWatchCode(e.target.value)}
              placeholder="Enter watch code"
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
              Handing Over Crew <span className="text-red-500">*</span>
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
              Taking Over Crew <span className="text-red-500">*</span>
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
            Ambulance Inspection Items
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INSPECTION_ITEMS.map((item, index) => (
              <div key={index}>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {item} <span className="text-red-500">*</span>
                </label>
                <select
                  value={checklistData[item] || ''}
                  onChange={(e) => handleChecklistChange(item, e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${!checklistData[item] ? 'border-red-300' : ''}`}
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
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Inspection Sheet'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VehicleInspectionForm;
