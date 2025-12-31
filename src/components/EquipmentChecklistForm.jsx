import React, { useState, useEffect } from 'react';
import { ref, push, set } from 'firebase/database';
import { db, auth } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';

// Function to sanitize Firebase keys by replacing invalid characters
const sanitizeKey = (key) => {
  return key.replace(/[.#$/\[\]]/g, '_').replace(/[()]/g, '').trim();
};

// Generate date options for M1-N31
const generateDateOptions = () => {
  const options = [];
  for (let i = 1; i <= 31; i++) {
    options.push(`M${i}`);
    options.push(`N${i}`);
  }
  return options;
};

const DATE_OPTIONS = generateDateOptions();

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
  'TRIAGE TAG (CARDS/TAPE ROLLS)',
  'REGULATOR AND HUMIDIFIER',
  'AED W / ADULT & INFANT SET',
  'LONG AND SHORT SPLINTS - ALL AGES',
  'AIR SPLINTS',
  'TRACTION SPLINT - SET',
  'INTUBATION SET',
  'BAG VALVE MASK - ALL SIZES',
  'PLASTIC ARMS SLINGS - ALL SIZES',
  'PROTECTIVE HELMET / EYE WEAR',
  'HIGH VISIBILITY CLOTHING',
  'MOUTH VALVE MASK - ALL SIZES',
  'PENLIGHT',
  'BP APPARATUS - SET',
  'GLUCOMETER - SET',
  'PULSE OXIMETER',
  'THERMOMETER - NON CONTACT',
  'NEONATE THERMOMETER',
  'CLINICAL THERMOMETER',
  'FORCEPS',
  'OROPHARYNGEAL AIRWAYS',
  'NASOPHARYNGEAL AIRWAYS',
  'POLE STRETCHER - FOLDABLE',
  'SIMPLE FACE MASK',
  'NASAL CANNULAE',
  'NONREBREATHER MASK',
  'BLANKET',
  'HEAD IMMOBILIZER',
  'SPINE BOARD + FASTENERS - ADULT',
  'SPINE BOARD + FASTENERS - PED',
  'PATIENT TROLLEY WITH PILLOW',
  'SCOOP STRETCHER',
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

const initialChecklistState = CHECKLIST_ITEMS.reduce((acc, item) => {
  acc[sanitizeKey(item)] = '';
  return acc;
}, {});

// Function to normalize checklist data for backward compatibility
const normalizeChecklistData = (data) => {
  if (!data) return initialChecklistState;
  
  const normalized = { ...initialChecklistState };
  
  CHECKLIST_ITEMS.forEach(item => {
    const sanitizedKey = sanitizeKey(item);
    // Try sanitized key first (new format), then original key (old format)
    normalized[sanitizedKey] = data[sanitizedKey] || data[item] || '';
  });
  
  return normalized;
};

const EquipmentChecklistForm = ({ editingEntry = null, onCancelEdit = null }) => {
  const { theme } = useTheme();
  const [date, setDate] = useState('M1');
  const [handingOverCrew, setHandingOverCrew] = useState('');
  const [takingOverCrew, setTakingOverCrew] = useState('');
  const [loading, setLoading] = useState(false);

  const [checklistData, setChecklistData] = useState(initialChecklistState);

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setDate(editingEntry.date || 'M1');
      setHandingOverCrew(editingEntry.handingOverCrew || '');
      setTakingOverCrew(editingEntry.takingOverCrew || '');
      setChecklistData(normalizeChecklistData(editingEntry.checklistData));
    } else {
      // Reset form when not editing
      setDate('M1');
      setHandingOverCrew('');
      setTakingOverCrew('');
      setChecklistData(initialChecklistState);
    }
  }, [editingEntry]);

  const handleChecklistChange = (item, value) => {
    setChecklistData(prev => ({
      ...prev,
      [sanitizeKey(item)]: value
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
    const emptyItems = CHECKLIST_ITEMS.filter(item => !checklistData[sanitizeKey(item)] || checklistData[sanitizeKey(item)] === '');
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
        setDate('M1');
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
            <select
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-gray-300' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">Select Date *</option>
              {DATE_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              INITIALS - HANDING OVER CREW *
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
              INITIALS - TAKING OVER CREW *
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
                  value={checklistData[sanitizeKey(item)] || ''}
                  onChange={(e) => handleChecklistChange(item, e.target.value)}
                  required
                  className={`px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm ${
                    theme === 'dark' 
                      ? 'bg-gray-600 border-gray-500 text-gray-200' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } ${!checklistData[sanitizeKey(item)] ? 'border-red-300' : ''}`}
                >
                  <option value="">Select *</option>
                  <option value="P">P (Perfect Condition)</option>
                  <option value="F">F (Faulty)</option>
                  <option value="N/A">N/A (Not Available)</option>
                  <option value="O">O (Under Observation)</option>
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
