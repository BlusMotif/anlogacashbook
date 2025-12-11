import React, { useState, useEffect } from 'react';
import { ref, push, set } from 'firebase/database';
import { db, auth } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';

const CHECKLIST_ITEMS = [
  'PATIENT MONITOR',
  'FETAL MONITOR',
  'NEBULIZER',
  'SYRINGE PUMP',
  'INFUSION PUMP VOLUMETRIC',
  'KED',
  'PORTABLE VENTILATOR SET + O2',
  'OXYGEN CYLINDER',
  'SUCTION MACHINE PORTABLE',
  'SUCTION MACHINE MAIN',
  'BAG VALVE MASK ADULT',
  'BAG VALVE MASK PEDIATRIC',
  'BAG VALVE MASK NEONATAL',
  'ADULT MASK',
  'PEDIATRIC MASK',
  'NEONATAL MASK',
  'NASAL CANNULA ADULT',
  'NASAL CANNULA PEDIATRIC',
  'NRM ADULT',
  'NRM PEDIATRIC',
  'NEBULIZER SET',
  'BLOOD PRESSURE APPARATUS',
  'STETHOSCOPE',
  'GLUCOMETER',
  'THERMOMETER',
  'LARYNGOSCOPE SET',
  'MAGILL FORCEPS',
  'OXYGEN HUMIDIFIER',
  'OROPHARYNGEAL AIRWAY SET',
  'NASOPHARYNGEAL AIRWAY SET',
  'C-COLLAR SET',
  'BURN SHEET',
  'FIRE EXTINGUISHER',
  'SPIDER STRAP',
  'TRAUMA DRESSINGS',
  'ABDOMINAL PAD',
  'ROLLER BANDAGE',
  'ELASTIC BANDAGE',
  'COTTON ROLL',
  'GAUZE',
  'FLASHLIGHT',
  'SCISSORS',
  'PENLIGHT',
  'HAND SANITIZER',
  'GLOVES',
  'FACE SHIELD',
  'SURGICAL MASKS',
  'PPE SETS',
  'FLOOR CLEANLINESS',
  'SHELVES CLEANLINESS'
];

const EquipmentChecklistForm = ({ editingEntry = null, onCancelEdit = null }) => {
  const { theme } = useTheme();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [handingOverCrew, setHandingOverCrew] = useState('');
  const [takingOverCrew, setTakingOverCrew] = useState('');
  const [loading, setLoading] = useState(false);

  const initialChecklistState = CHECKLIST_ITEMS.reduce((acc, item) => {
    acc[item] = '';
    return acc;
  }, {});

  const [checklistData, setChecklistData] = useState(initialChecklistState);

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date || new Date().toISOString().split('T')[0]);
      setHandingOverCrew(editingEntry.handingOverCrew || '');
      setTakingOverCrew(editingEntry.takingOverCrew || '');
      setChecklistData(editingEntry.checklistData || initialChecklistState);
    } else {
      // Reset form when not editing
      setDate(new Date().toISOString().split('T')[0]);
      setHandingOverCrew('');
      setTakingOverCrew('');
      setChecklistData(initialChecklistState);
    }
  }, [editingEntry]);

  const handleChecklistChange = (item, value) => {
    setChecklistData(prev => ({
      ...prev,
      [item]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!handingOverCrew || !takingOverCrew) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in crew initials',
        icon: 'error',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    // Check if ALL items have been selected
    const emptyItems = CHECKLIST_ITEMS.filter(item => !checklistData[item] || checklistData[item] === '');
    if (emptyItems.length > 0) {
      Swal.fire({
        title: 'Incomplete Checklist!',
        html: `<p>Please select a status for all equipment items.</p>
               <p class="text-sm text-red-600 mt-2">${emptyItems.length} item(s) not selected:</p>
               <div class="text-left text-sm mt-2 max-h-40 overflow-y-auto">
                 ${emptyItems.slice(0, 5).map(item => `<p>• ${item}</p>`).join('')}
                 ${emptyItems.length > 5 ? `<p class="font-semibold">...and ${emptyItems.length - 5} more</p>` : ''}
               </div>`,
        icon: 'warning',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        Swal.fire({
          title: 'Error!',
          text: 'You must be logged in',
          icon: 'error',
          confirmButtonColor: '#16a34a'
        });
        setLoading(false);
        return;
      }

      const entryData = {
        date,
        checklistData,
        handingOverCrew,
        takingOverCrew,
        userId: user.uid,
        timestamp: Date.now()
      };

      const entriesRef = editingEntry
        ? ref(db, `equipmentChecklist/${editingEntry.id}`)
        : ref(db, 'equipmentChecklist');
      
      if (editingEntry) {
        await set(entriesRef, entryData);
      } else {
        await push(entriesRef, entryData);
      }
      
      Swal.fire({
        title: 'Success!',
        text: `Shift inspection checklist ${editingEntry ? 'updated' : 'submitted'} successfully`,
        icon: 'success',
        confirmButtonColor: '#16a34a'
      });

      // Reset form
      if (!editingEntry) {
        setDate(new Date().toISOString().split('T')[0]);
        setHandingOverCrew('');
        setTakingOverCrew('');
        setChecklistData(initialChecklistState);
      } else if (onCancelEdit) {
        onCancelEdit();
      }
    } catch (error) {
      console.error('Error saving checklist:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to save checklist. Please try again.',
        icon: 'error',
        confirmButtonColor: '#16a34a'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4 sm:p-6`}>
      <h2 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-800'} text-center`}>
        MEDICAL EQUIPMENT CHECKLIST
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Date and Crew Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-300' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Handing Over Crew *
            </label>
            <input
              type="text"
              value={handingOverCrew}
              onChange={(e) => setHandingOverCrew(e.target.value)}
              placeholder="Enter initials"
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-300' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Taking Over Crew *
            </label>
            <input
              type="text"
              value={takingOverCrew}
              onChange={(e) => setTakingOverCrew(e.target.value)}
              placeholder="Enter initials"
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-300' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />
          </div>
        </div>

        {/* Checklist Items */}
        <div className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Equipment List
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHECKLIST_ITEMS.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <label className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} flex-1`}>
                  {item} <span className="text-red-500">*</span>
                </label>
                <select
                  value={checklistData[item]}
                  onChange={(e) => handleChecklistChange(item, e.target.value)}
                  required
                  className={`px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-600 border-gray-500 text-gray-200' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${!checklistData[item] ? 'border-red-300' : ''}`}
                >
                  <option value="">Select *</option>
                  <option value="P">P (Perfect Condition)</option>
                  <option value="F">F (Faulty)</option>
                  <option value="N/A">N/A (Not Available)</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center gap-4 pt-4">
          {editingEntry && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-8 rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white py-3 px-8 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (editingEntry ? 'Updating...' : 'Submitting...') : (editingEntry ? 'Update Checklist' : 'Submit Checklist')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquipmentChecklistForm;
