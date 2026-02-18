
import React from 'react';
import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions }) => {
  if (transactions.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-xs border-b border-slate-200">
          <tr>
            <th className="px-6 py-4">Date</th>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {transactions.map((t, idx) => (
            <tr key={idx} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 font-medium whitespace-nowrap">{t.date}</td>
              <td className="px-6 py-4">{t.description}</td>
              <td className={`px-6 py-4 font-semibold ${t.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {t.amount < 0 ? `- $${Math.abs(t.amount).toFixed(2)}` : `+ $${t.amount.toFixed(2)}`}
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {t.category}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">{t.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
