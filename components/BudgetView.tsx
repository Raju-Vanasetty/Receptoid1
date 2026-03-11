import React, { useState, useMemo } from 'react';
import { useReceipts } from '../App';
import { CATEGORIES } from '../types';
import { 
  ArrowLeft, 
  IndianRupee, 
  Utensils, 
  Car, 
  Zap, 
  ShoppingBag, 
  MoreHorizontal, 
  Briefcase,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { isSameMonth, isSameYear, parseISO } from 'date-fns';

const CategoryIconMap: Record<string, React.ElementType> = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Business': Briefcase,
  'Utilities': Zap,
  'Shopping': ShoppingBag,
  'Others': MoreHorizontal
};

// Helper for currency formatting to avoid TS issues with toLocaleString
const currencyFormatter = new Intl.NumberFormat('en-IN', { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
});

export const BudgetView: React.FC = () => {
  const { 
    receipts, 
    monthlyBudget, 
    setMonthlyBudget, 
    categoryBudgets, 
    setCategoryBudgets,
    setActiveTab 
  } = useReceipts();

  // Local state for editing form
  const [totalBudget, setTotalBudget] = useState<string>(monthlyBudget.toString());
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    CATEGORIES.forEach(cat => {
      initial[cat] = (categoryBudgets[cat] || 0).toString();
    });
    return initial;
  });

  const [isSaving, setIsSaving] = useState(false);

  // Calculate spent per category for current month
  const categoryStats = useMemo(() => {
    const now = new Date();
    const currentMonthReceipts = receipts.filter(r => {
      const d = parseISO(r.date);
      return isSameMonth(d, now) && isSameYear(d, now);
    });
    
    const stats: Record<string, number> = {};
    CATEGORIES.forEach(cat => stats[cat] = 0);
    
    currentMonthReceipts.forEach(r => {
        if (stats[r.category] !== undefined) {
            stats[r.category] += r.totalAmount;
        } else {
             // Fallback for weird data
             stats['Others'] += r.totalAmount;
        }
    });
    return stats;
  }, [receipts]);

  const handleCategoryChange = (cat: string, value: string) => {
    setCatBudgets(prev => ({ ...prev, [cat]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    
    // Parse Total
    const parsedTotal = parseFloat(totalBudget);
    if (!isNaN(parsedTotal)) {
      setMonthlyBudget(parsedTotal);
    }

    // Parse Categories
    const newCatBudgets: Record<string, number> = {};
    Object.entries(catBudgets).forEach(([cat, val]) => {
      const parsed = parseFloat(val as string);
      newCatBudgets[cat] = isNaN(parsed) ? 0 : parsed;
    });
    setCategoryBudgets(newCatBudgets);

    // Simulate small delay for feedback
    setTimeout(() => {
        setIsSaving(false);
        // Optional: show toast or success message here
    }, 500);
  };

  // Calculations for Variance Report
  const currentTotalBudget = parseFloat(totalBudget) || 0;
  // Fix: Explicitly type reduce arguments and cast Object.values to number[] to ensure type safety
  const currentTotalSpent = (Object.values(categoryStats) as number[]).reduce((a, b) => a + b, 0);
  const totalVariance = currentTotalBudget - currentTotalSpent;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
        {/* Navigation Header */}
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors font-medium mb-2"
        >
            <ArrowLeft size={20} />
            Back to Dashboard
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Manage Budget</h1>
                <p className="text-gray-500">Set and track your monthly spending goals</p>
            </div>
        </div>

        {/* 1. Total Budget Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Total Monthly Budget</h2>
            <p className="text-sm text-gray-500 mb-6">Set an overall spending limit for the month.</p>
            
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600">
                    <IndianRupee size={24} />
                </div>
                <input 
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value)}
                    placeholder="e.g. 50000"
                    className="flex-1 h-12 px-4 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-lg font-medium"
                />
            </div>
        </div>

        {/* 2. Category Budgets Inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Category Allocations</h2>
            <p className="text-sm text-gray-500 mb-8">Allocate parts of your total budget to specific categories.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {CATEGORIES.map((cat) => {
                    const Icon = CategoryIconMap[cat] || MoreHorizontal;
                    const spent = categoryStats[cat];
                    const budget = parseFloat(catBudgets[cat] || '0');
                    const remaining = Math.max(0, budget - spent);
                    
                    return (
                        <div key={cat} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-gray-700">
                                        <Icon size={18} />
                                    </div>
                                    <span className="font-bold text-gray-900 truncate">{cat}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-gray-400 font-medium">₹</span>
                                    <input 
                                        type="number"
                                        value={catBudgets[cat]}
                                        onChange={(e) => handleCategoryChange(cat, e.target.value)}
                                        className="w-28 px-3 py-1.5 rounded-lg bg-white border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none transition text-right font-medium"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            
                            {/* Simple Progress Bar for Edit View */}
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        spent > budget && budget > 0 ? 'bg-red-500' : 'bg-indigo-500'
                                    }`}
                                    style={{ width: `${Math.min((budget > 0 ? (spent/budget) * 100 : 0), 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 font-medium">
                                <span>Spent: ₹{spent.toFixed(2)}</span>
                                <span className={remaining === 0 && budget > 0 ? 'text-red-500' : ''}>
                                    Left: ₹{remaining.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* 3. Variance Analysis Card (NEW) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Budget Variance Report</h2>
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-sm text-indigo-600 font-semibold mb-1 uppercase tracking-wide">Total Budget</div>
                    <div className="text-2xl font-bold text-indigo-900">₹{currencyFormatter.format(currentTotalBudget)}</div>
                </div>
                <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-500 font-semibold mb-1 uppercase tracking-wide">Actual Spending</div>
                    <div className="text-2xl font-bold text-gray-900">₹{currencyFormatter.format(currentTotalSpent)}</div>
                </div>
                <div className={`p-5 rounded-xl border ${totalVariance >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                    <div className={`text-sm font-semibold mb-1 uppercase tracking-wide ${totalVariance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {totalVariance >= 0 ? 'Surplus' : 'Deficit'}
                    </div>
                    <div className={`text-2xl font-bold ${totalVariance >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                        {totalVariance < 0 ? '-' : '+'}₹{currencyFormatter.format(Math.abs(totalVariance))}
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-gray-500 font-bold uppercase tracking-wider text-xs">Category</th>
                            <th className="px-4 py-3 text-right text-gray-500 font-bold uppercase tracking-wider text-xs">Budget</th>
                            <th className="px-4 py-3 text-right text-gray-500 font-bold uppercase tracking-wider text-xs">Actual</th>
                            <th className="px-4 py-3 text-right text-gray-500 font-bold uppercase tracking-wider text-xs">Variance</th>
                            <th className="px-4 py-3 text-center text-gray-500 font-bold uppercase tracking-wider text-xs">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {CATEGORIES.map(cat => {
                            const budgetVal = parseFloat(catBudgets[cat] || '0');
                            const actualVal = categoryStats[cat];
                            const variance = budgetVal - actualVal;
                            const percent = budgetVal > 0 ? (actualVal / budgetVal) * 100 : 0;
                            const isOver = variance < 0 && budgetVal > 0;
                            const isZeroBudget = budgetVal === 0;
                            
                            return (
                                <tr key={cat} className="hover:bg-gray-50/80 transition">
                                    <td className="px-4 py-4 font-semibold text-gray-900 flex items-center gap-2">
                                        {/* Icon */}
                                        {React.createElement(CategoryIconMap[cat] || MoreHorizontal, { 
                                            size: 16, 
                                            className: "text-gray-400" 
                                        })}
                                        {cat}
                                    </td>
                                    <td className="px-4 py-4 text-right text-gray-600">
                                        ₹{currencyFormatter.format(budgetVal)}
                                    </td>
                                    <td className="px-4 py-4 text-right text-gray-900 font-medium">
                                        ₹{currencyFormatter.format(actualVal)}
                                    </td>
                                    <td className={`px-4 py-4 text-right font-bold ${
                                        isOver ? 'text-red-600' : isZeroBudget && actualVal > 0 ? 'text-red-600' : 'text-emerald-600'
                                    }`}>
                                        {(variance < 0 || (isZeroBudget && actualVal > 0)) ? '-' : '+'}
                                        ₹{currencyFormatter.format(Math.abs(isZeroBudget ? -actualVal : variance))}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                            (isOver || (isZeroBudget && actualVal > 0))
                                            ? 'bg-red-50 text-red-700 border-red-100' 
                                            : percent > 85 
                                                ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                                : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        }`}>
                                            {(isOver || (isZeroBudget && actualVal > 0)) ? (
                                                <>
                                                    <AlertCircle size={12} /> Over Limit
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={12} /> On Track
                                                </>
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Floating/Fixed Save Action */}
        <div className="flex justify-end pt-4 sticky bottom-4 z-20">
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 ring-4 ring-white"
            >
                {isSaving ? 'Saving Changes...' : 'Save All Changes'}
            </button>
        </div>
    </div>
  );
};