import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const SummaryCards = () => {
  const [summary, setSummary] = useState({ totalReceipts: 0, totalPayments: 0, currentBalance: 0 });
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
      let totalReceipts = 0;
      let totalPayments = 0;
      let currentBalance = 0;
      if (data) {
        const userEntries = Object.values(data).filter(entry => entry.createdBy === user.uid);
        userEntries.forEach(entry => {
          totalReceipts += entry.receipt || 0;
          totalPayments += entry.payment || 0;
        });
        if (userEntries.length > 0) {
          const sortedEntries = userEntries.sort((a, b) => a.timestamp - b.timestamp);
          currentBalance = sortedEntries[sortedEntries.length - 1].balance;
        }
      }
      setSummary({ totalReceipts, totalPayments, currentBalance });
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-gradient-to-r from-green-400 to-green-600 p-6 rounded-2xl shadow-xl text-white">
        <h3 className="text-lg font-semibold mb-2">Total Receipts</h3>
        <p className="text-3xl font-bold">₵ {summary.totalReceipts.toFixed(2)}</p>
      </div>
      <div className="bg-gradient-to-r from-emerald-400 to-teal-600 p-6 rounded-2xl shadow-xl text-white">
        <h3 className="text-lg font-semibold mb-2">Total Payments</h3>
        <p className="text-3xl font-bold">₵ {summary.totalPayments.toFixed(2)}</p>
      </div>
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white">
        <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
        <p className="text-3xl font-bold">₵ {summary.currentBalance.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default SummaryCards;