
import React from 'react';
import { Transaction } from '../types';

interface SummaryDashboardProps {
  transactions: Transaction[];
}

const COLORS = [
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#64748b', // Slate
];

const SummaryDashboard: React.FC<SummaryDashboardProps> = ({ transactions }) => {
  const totalCount = transactions.length;
  const incomeTransactions = transactions.filter(t => t.amount > 0);
  const expenseTransactions = transactions.filter(t => t.amount < 0);

  const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = Math.abs(expenseTransactions.reduce((acc, t) => acc + t.amount, 0));
  const netBalance = totalIncome - totalExpenses;

  // Group by category for expenses
  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach(t => {
    const cat = t.category || 'Uncategorized';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(t.amount);
  });

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const maxCategorySpend = sortedCategories.length > 0 ? sortedCategories[0][1] : 0;

  // Pie chart calculation
  let cumulativePercent = 0;
  const pieSlices = sortedCategories.map(([category, amount], index) => {
    const percent = (amount / totalExpenses) * 100;
    const slice = {
      category,
      amount,
      percent,
      color: COLORS[index % COLORS.length],
      offset: cumulativePercent
    };
    cumulativePercent += percent;
    return slice;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Records</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900">{totalCount}</p>
            <p className="text-sm text-slate-400">transactions</p>
          </div>
        </div>
        
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Income</p>
          <p className="text-3xl font-black text-emerald-600">
            ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-1">Total Spending</p>
          <p className="text-3xl font-black text-rose-600">
            ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border ${netBalance >= 0 ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-slate-900 border-slate-800 text-white'}`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80">Net Balance</p>
          <p className="text-3xl font-black">
            {netBalance < 0 ? '-' : ''}${Math.abs(netBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Spending List Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-1">
          <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            Category Ranking
          </h4>
          <div className="space-y-5">
            {sortedCategories.length > 0 ? sortedCategories.map(([category, amount], idx) => (
              <div key={category} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="font-semibold text-slate-700 capitalize">{category}</span>
                  </div>
                  <span className="font-bold text-slate-900">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-1000" 
                    style={{ 
                      width: `${(amount / maxCategorySpend) * 100}%`,
                      backgroundColor: COLORS[idx % COLORS.length]
                    }}
                  ></div>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 italic text-sm py-4 text-center">No spending data available</p>
            )}
          </div>
        </div>

        {/* Spending Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-1 flex flex-col items-center">
          <h4 className="text-lg font-bold text-slate-900 mb-6 w-full text-left flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
            Spending Distribution
          </h4>
          <div className="relative w-56 h-56 flex items-center justify-center my-auto">
            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
              {pieSlices.map((slice, i) => (
                <circle
                  key={i}
                  cx="18"
                  cy="18"
                  r="15.91549430918954"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth="3.5"
                  strokeDasharray={`${slice.percent} ${100 - slice.percent}`}
                  strokeDashoffset={-slice.offset}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Total Spent</span>
              <span className="text-xl font-black text-slate-900 leading-none">
                ${totalExpenses > 1000 ? (totalExpenses / 1000).toFixed(1) + 'k' : totalExpenses.toFixed(0)}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
             {pieSlices.slice(0, 5).map((slice, i) => (
               <div key={i} className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: slice.color }}></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase">{slice.category}</span>
               </div>
             ))}
             {pieSlices.length > 5 && <span className="text-[10px] font-bold text-slate-400">+{pieSlices.length - 5} MORE</span>}
          </div>
        </div>

        {/* Transaction Split / Donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:col-span-1 flex flex-col justify-center">
          <h4 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 10-4 4-2-2"/></svg>
            Cashflow Mix
          </h4>
          <div className="flex flex-col items-center justify-center h-full space-y-8">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <path
                  className="text-rose-500"
                  strokeDasharray={`${(expenseTransactions.length / totalCount) * 100}, 100`}
                  stroke="currentColor"
                  strokeWidth="4.5"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500"
                  strokeDasharray={`${(incomeTransactions.length / totalCount) * 100}, 100`}
                  strokeDashoffset={-(expenseTransactions.length / totalCount) * 100}
                  stroke="currentColor"
                  strokeWidth="4.5"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900">{totalCount}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter">Items</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 w-full">
              <div className="text-center">
                <div className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                <span className="text-sm font-bold text-slate-600">Income</span>
                <p className="text-lg font-black text-emerald-600">{incomeTransactions.length}</p>
              </div>
              <div className="text-center">
                <div className="inline-block w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
                <span className="text-sm font-bold text-slate-600">Spending</span>
                <p className="text-lg font-black text-rose-600">{expenseTransactions.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
