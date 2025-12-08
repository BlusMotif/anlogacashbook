import React, { useState, useEffect } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { db } from '../firebase';
import Swal from 'sweetalert2';
import { useTheme } from '../ThemeContext';

const AssetRegisterForm = ({ editingEntry = null, onCancelEdit = null }) => {
  const { theme } = useTheme();
  const [totalEntries, setTotalEntries] = useState(0);
  const [formData, setFormData] = useState({
    sn: '',
    date: '',
    assetName: '',
    model: '',
    serialNumber: '',
    assetCode: '',
    amount: '',
    condition: ''
  });

  // Get total entries count for S/N generation
  useEffect(() => {
    const entriesRef = ref(db, 'assetRegister');
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTotalEntries(Object.keys(data).length);
      } else {
        setTotalEntries(0);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update form when editingEntry changes
  useEffect(() => {
    if (editingEntry) {
      setFormData({
        sn: editingEntry.sn || '',
        date: editingEntry.date || '',
        assetName: editingEntry.assetName || '',
        model: editingEntry.model || '',
        serialNumber: editingEntry.serialNumber || '',
        assetCode: editingEntry.assetCode || '',
        amount: editingEntry.amount || '',
        condition: editingEntry.condition || ''
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

    // Validate all fields are filled (except S/N for new entries)
    if (!formData.date || !formData.assetName || !formData.model || !formData.serialNumber || !formData.assetCode || !formData.condition) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Fields',
        text: 'Please fill in all required fields before submitting.',
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    try {
      if (editingEntry) {
        // Update existing entry
        const { set } = await import('firebase/database');
        const entryRef = ref(db, `assetRegister/${editingEntry.id}`);
        await set(entryRef, {
          ...formData,
          timestamp: editingEntry.timestamp // Keep original timestamp
        });

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Asset entry updated successfully.',
          confirmButtonColor: '#16a34a'
        });

        // Reset form and exit edit mode
        setFormData({
          sn: '',
          date: '',
          assetName: '',
          model: '',
          serialNumber: '',
          assetCode: '',
          condition: ''
        });
        if (onCancelEdit) onCancelEdit();
      } else {
        // Add new entry with auto-generated S/N
        const newSN = (totalEntries + 1).toString().padStart(3, '0');
        const assetRef = ref(db, 'assetRegister');
        await push(assetRef, {
          ...formData,
          sn: newSN,
          timestamp: Date.now()
        });

        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Asset entry added successfully.',
          confirmButtonColor: '#16a34a'
        });

        // Reset form
        setFormData({
          sn: '',
          date: '',
          assetName: '',
          model: '',
          serialNumber: '',
          assetCode: '',
          condition: ''
        });
      }
    } catch (error) {
      console.error('Error adding asset entry:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add asset entry. Please try again.',
        confirmButtonColor: '#16a34a'
      });
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'bg-gray-800 bg-opacity-80 border-gray-700' : 'bg-white bg-opacity-80 border-white border-opacity-20'} backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl border`}>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          {editingEntry ? 'Edit Asset Entry' : 'Add Asset Entry'}
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
          {/* S/N */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              S/N {editingEntry && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              name="sn"
              value={editingEntry ? formData.sn : (totalEntries + 1).toString().padStart(3, '0')}
              onChange={handleChange}
              placeholder="Auto-generated"
              readOnly={!editingEntry}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : editingEntry ? 'bg-white border-gray-300 text-gray-900 placeholder-gray-500' : 'bg-gray-100 border-gray-300 text-gray-600'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${!editingEntry ? 'cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Date */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Date <span className="text-red-500">*</span>
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
              } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>

          {/* Asset Name */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="assetName"
              value={formData.assetName}
              onChange={handleChange}
              placeholder="Enter asset name"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>

          {/* Model */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              placeholder="Enter model"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>

          {/* Serial Number */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Serial Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              placeholder="Enter serial number"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>

          {/* Asset Code */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Asset Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="assetCode"
              value={formData.assetCode}
              onChange={handleChange}
              placeholder="Enter asset code"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Amount (₵) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              step="0.01"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>

          {/* Condition */}
          <div>
            <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Condition <span className="text-red-500">*</span>
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Select condition</option>
              <option value="Good">Good</option>
              <option value="Faulty">Faulty</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm sm:text-base"
          >
            {editingEntry ? 'Update Asset' : 'Add Asset'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AssetRegisterForm;
