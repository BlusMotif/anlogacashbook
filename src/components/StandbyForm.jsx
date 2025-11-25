import React, { useState, useEffect } from 'react';
import { ref, push } from 'firebase/database';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';

const StandbyForm = ({ editingEntry = null, onCancelEdit = null }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    date: '',
    location: '',
    reason: '',
    watch: '',
    amount: ''
  });

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setFormData({
        date: editingEntry.date || '',
        location: editingEntry.location || '',
        reason: editingEntry.reason || '',
        watch: editingEntry.watch || '',
        amount: editingEntry.amount || ''
      });
    }
  }, [editingEntry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields are filled
    if (!formData.date || !formData.location || !formData.reason || !formData.watch || !formData.amount) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all fields before submitting.',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    // Validate amount is a number
    if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Amount',
        text: 'Please enter a valid amount greater than 0.',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    try {
      if (editingEntry) {
        // Update existing entry
        const { set } = await import('firebase/database');
        const entryRef = ref(db, `standby/${editingEntry.id}`);
        await set(entryRef, {
          ...formData,
          amount: parseFloat(formData.amount),
          timestamp: editingEntry.timestamp // Keep original timestamp
        });

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Standby entry updated successfully.',
          confirmButtonColor: '#16a34a'
        });

        // Reset form and exit edit mode
        setFormData({
          date: '',
          location: '',
          reason: '',
          watch: '',
          amount: ''
        });
        if (onCancelEdit) onCancelEdit();
      } else {
        // Add new entry
        const standbyRef = ref(db, 'standby');
        await push(standbyRef, {
          ...formData,
          amount: parseFloat(formData.amount),
          timestamp: Date.now()
        });

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Standby entry added successfully.',
          confirmButtonColor: '#16a34a'
        });

        // Reset form
        setFormData({
          date: '',
          location: '',
          reason: '',
          watch: '',
          amount: ''
        });
      }
    } catch (error) {
      console.error('Error adding standby entry:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add standby entry. Please try again.',
        confirmButtonColor: '#16a34a'
      });
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 bg-opacity-80 border-gray-700' : 'bg-white bg-opacity-80 border-white border-opacity-20'} backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border`}>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          {editingEntry ? 'Edit Standby Entry' : 'Add Standby Entry'}
        </h2>
        {editingEntry && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className={`text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
          >
            Cancel Edit
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Date */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>

          {/* Location */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Reason
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Enter reason or notes"
              rows="4"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical`}
            />
          </div>

          {/* Watch */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Watch
            </label>
            <select
              name="watch"
              value={formData.watch}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Select Watch</option>
              <option value="Alpha">Alpha</option>
              <option value="Bravo">Bravo</option>
              <option value="Charlie">Charlie</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Amount (GH₵)
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-2">
          {editingEntry && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className={`px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold shadow-md transition-all duration-200 ${
                theme === 'dark'
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {editingEntry ? 'Update Entry' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StandbyForm;
