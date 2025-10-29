import React, { useState, useEffect } from 'react';
import { ref, push, onValue, update, get } from 'firebase/database';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Swal from 'sweetalert2';

const CashbookForm = () => {
  const [date, setDate] = useState('');
  const [particulars, setParticulars] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [receipt, setReceipt] = useState('');
  const [payment, setPayment] = useState('');
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const entriesRef = ref(db, 'cashbook/entries');
    const unsubscribe = onValue(entriesRef, (snapshot) => {
      const data = snapshot.val();
      let lastBalance = 0;
      if (data) {
        const userEntries = Object.values(data).filter(entry => entry.createdBy === user.uid).sort((a, b) => a.timestamp - b.timestamp);
        if (userEntries.length > 0) {
          lastBalance = userEntries[userEntries.length - 1].balance;
        }
      }
      const newBalance = lastBalance + (parseFloat(receipt) || 0) - (parseFloat(payment) || 0);
      setBalance(newBalance);
    });

    return () => unsubscribe();
  }, [receipt, payment, user]);

  const recalculateBalances = async () => {
    if (!user) return;

    const snapshot = await get(ref(db, 'cashbook/entries'));
    const data = snapshot.val();
    if (!data) return;

    const userEntries = Object.keys(data).map(key => ({ id: key, ...data[key] })).filter(entry => entry.createdBy === user.uid).sort((a, b) => a.timestamp - b.timestamp);

    let balance = 0;
    const updates = {};
    userEntries.forEach(entry => {
      balance += entry.receipt - entry.payment;
      updates[`cashbook/entries/${entry.id}/balance`] = balance;
    });
    await update(ref(db), updates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const entry = {
      date,
      particulars,
      receiptNo,
      receipt: parseFloat(receipt) || 0,
      payment: parseFloat(payment) || 0,
      balance,
      createdBy: user.uid,
      timestamp: Date.now(),
    };

    try {
      await push(ref(db, 'cashbook/entries'), entry);
      await recalculateBalances();
      // Reset form
      setDate('');
      setParticulars('');
      setReceiptNo('');
      setReceipt('');
      setPayment('');
      Swal.fire({
        icon: 'success',
        title: 'Entry Added!',
        text: 'Your cashbook entry has been successfully added.',
        confirmButtonColor: '#10B981'
      });
    } catch (error) {
      console.error('Error adding entry:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error Adding Entry',
        text: 'Failed to add the entry. Please try again.',
        confirmButtonColor: '#10B981'
      });
    }
  };

  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white border-opacity-20">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Entry</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Receipt No</label>
            <input
              type="text"
              value={receiptNo}
              onChange={(e) => setReceiptNo(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="RCPT-001"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Particulars</label>
          <input
            type="text"
            value={particulars}
            onChange={(e) => setParticulars(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter particulars"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Receipt (₵)</label>
            <input
              type="number"
              step="0.01"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Payment (₵)</label>
            <input
              type="number"
              step="0.01"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Balance (₵)</label>
            <input
              type="text"
              value={`₵ ${balance.toFixed(2)}`}
              readOnly
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition duration-300 shadow-lg">
          Add Entry
        </button>
      </form>
    </div>
  );
};

export default CashbookForm;