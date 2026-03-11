import React, { useMemo, useState, useEffect } from 'react';
import { useReceipts } from '../App';
import { getBudgetAdvice } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { IndianRupee, FileText, TrendingUp, ShoppingBag, Edit2, AlertTriangle, Sparkles, Check, ArrowRight, Loader2, X, Clock } from 'lucide-react';
import { format, subDays, isSameMonth, isSameYear, parseISO } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { receipts, monthlyBudget, setMonthlyBudget, setActiveTab } = useReceipts();
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(monthlyBudget.toString());
  
  // AI Advice State
  const [advice, setAdvice] = useState<string[]>([]);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // --- Calculate Stats ---
  const stats = useMemo(() => {
    const totalAmount = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
    const count = receipts.length;
    const avg = count > 0 ? totalAmount / count : 0;
    
    // Top category
    const catCounts: Record<string, number> = {};
    receipts.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + r.totalAmount });
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

    // Current Month calculations for budget
    const now = new Date();
    const currentMonthReceipts = receipts.filter(r => {
      const d = parseISO(r.date);
      return isSameMonth(d, now) && isSameYear(d, now);
    });
    const currentMonthTotal = currentMonthReceipts.reduce((sum, r) => sum + r.totalAmount, 0);

    // Breakdown for AI
    const currentMonthBreakdown: Record<string, number> = {};
    currentMonthReceipts.forEach(r => {
        currentMonthBreakdown[r.category] = (currentMonthBreakdown[r.category] || 0) + r.totalAmount;
    });

    return {
      totalAmount,
      totalReceipts: count,
      averageAmount: avg,
      topCategory: topCat ? topCat[0] : 'None',
      currentMonthTotal,
      currentMonthBreakdown
    };
  }, [receipts]);

  // Recent Receipts
  const recentReceipts = useMemo(() => {
    return [...receipts]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [receipts]);

  // Sync temp budget when context changes
  useEffect(() => {
    setTempBudget(monthlyBudget.toString());
  }, [monthlyBudget]);

  const handleSaveBudget = () => {
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudget(val);
      setIsEditingBudget(false);
      setAdvice([]); // Reset advice when budget changes
    }
  };

  const fetchAiAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const tips = await getBudgetAdvice(stats.currentMonthTotal, monthlyBudget, stats.currentMonthBreakdown);
      setAdvice(tips);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdvice(false);
    }
  };

  // --- Chart Data: Weekly Spending ---
  const weeklyData = useMemo(() => {
    // Generate last 7 days keys
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        date: format(d, 'MMM dd'),
        fullDate: format(d, 'yyyy-MM-dd'),
        amount: 0
      };
    });

    receipts.forEach(r => {
      const rDate = r.date; // YYYY-MM-DD
      const day = days.find(d => d.fullDate === rDate);
      if (day) {
        day.amount += r.totalAmount;
      }
    });
    return days;
  }, [receipts]);

  // --- Chart Data: Category Breakdown ---
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    receipts.forEach(r => {
      data[r.category] = (data[r.category] || 0) + r.totalAmount;
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [receipts]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const budgetProgress = monthlyBudget > 0 ? (stats.currentMonthTotal / monthlyBudget) * 100 : 0;
  const isOverBudget = stats.currentMonthTotal > monthlyBudget && monthlyBudget > 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back! Here's your expense overview.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Expenses" 
          value={`₹${stats.totalAmount.toFixed(2)}`} 
          icon={IndianRupee} 
          color="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Total Receipts" 
          value={stats.totalReceipts} 
          icon={FileText} 
          color="bg-purple-100 text-purple-600" 
        />
        <StatCard 
          title="Average Expense" 
          value={`₹${stats.averageAmount.toFixed(2)}`} 
          icon={TrendingUp} 
          color="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Top Category" 
          value={stats.topCategory} 
          icon={ShoppingBag} 
          color="bg-orange-100 text-orange-600" 
        />
      </div>

      {/* Monthly Budget Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-visible">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                Monthly Budget 
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {format(new Date(), 'MMMM yyyy')}
                </span>
              </h3>
              <p className="text-sm text-gray-500">Track your spending against your monthly limit.</p>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isEditingBudget ? (
                <div className="flex items-center gap-2 animate-fade-in bg-white shadow-xl p-2 rounded-xl border border-indigo-100 absolute sm:static right-4 top-16 sm:top-auto sm:right-auto z-20">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold z-10">₹</span>
                    <input 
                      type="number" 
                      value={tempBudget}
                      onChange={(e) => setTempBudget(e.target.value)}
                      className="w-40 pl-8 pr-3 py-2 bg-white border-2 border-indigo-500 rounded-lg focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-gray-900 text-lg shadow-sm"
                      placeholder="0.00"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveBudget();
                        if (e.key === 'Escape') setIsEditingBudget(false);
                      }}
                    />
                  </div>
                  <button 
                    onClick={handleSaveBudget}
                    className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm hover:shadow-md active:scale-95"
                    title="Save Budget"
                  >
                    <Check size={20} strokeWidth={3} />
                  </button>
                  <button 
                    onClick={() => setIsEditingBudget(false)}
                    className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition active:scale-95"
                    title="Cancel"
                  >
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditingBudget(true)}
                  className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 ${
                    monthlyBudget === 0 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                      : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <Edit2 size={16} />
                  {monthlyBudget === 0 ? "Set Monthly Budget" : "Edit Budget"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-end gap-2">
              <div className="text-3xl font-bold text-gray-900 flex items-baseline gap-1">
                ₹{stats.currentMonthTotal.toFixed(2)}
                <span className="text-lg text-gray-400 font-medium ml-1">
                  /
                </span>
                <span 
                  onClick={() => setIsEditingBudget(true)}
                  className="text-lg text-gray-500 font-medium cursor-pointer hover:text-indigo-600 hover:bg-indigo-50 px-2 rounded-lg transition-colors border-b-2 border-dashed border-gray-300 hover:border-indigo-300" 
                  title="Click to edit budget"
                >
                   ₹{monthlyBudget.toFixed(2)}
                </span>
              </div>
              <div className={`font-bold text-lg ${isOverBudget ? 'text-red-600' : 'text-gray-600'}`}>
                {budgetProgress.toFixed(1)}% Used
              </div>
            </div>

            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isOverBudget ? 'bg-red-500' : budgetProgress > 80 ? 'bg-amber-400' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              />
            </div>

            {isOverBudget && (
              <div className="mt-6 bg-red-50 border border-red-100 rounded-xl p-5 flex flex-col sm:flex-row items-start gap-4 animate-fade-in">
                <div className="p-2 bg-red-100 rounded-lg text-red-600 shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="font-bold text-red-800 text-lg">Budget Exceeded</h4>
                    <p className="text-red-700 text-sm">
                      You've spent <span className="font-bold">₹{(stats.currentMonthTotal - monthlyBudget).toFixed(2)}</span> over your budget this month.
                    </p>
                  </div>
                  
                  {advice.length === 0 && !loadingAdvice ? (
                    <button 
                      onClick={fetchAiAdvice}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-bold shadow-sm hover:bg-red-50 transition"
                    >
                      <Sparkles size={16} className="text-yellow-500" />
                      Get AI Cost-Saving Tips
                    </button>
                  ) : loadingAdvice ? (
                     <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
                        <Loader2 className="animate-spin" size={16} />
                        Analyzing your spending habits...
                     </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm w-full">
                       <h5 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                         <Sparkles size={16} className="text-yellow-500" /> AI Recommendations
                       </h5>
                       <ul className="space-y-2">
                         {advice.map((tip, idx) => (
                           <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                             <ArrowRight size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                             {tip}
                           </li>
                         ))}
                       </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Spending Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === weeklyData.length - 1 ? '#4f46e5' : '#c7d2fe'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Category Breakdown</h3>
          <div className="h-72 flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></span>
                <span className="truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Receipts Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="text-indigo-500" size={20}/> Recent Transactions
            </h3>
            <button 
                onClick={() => setActiveTab('receipts')}
                className="text-indigo-600 text-sm font-semibold hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
                View All <ArrowRight size={16} />
            </button>
        </div>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                    <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Merchant</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {recentReceipts.length > 0 ? (
                        recentReceipts.map((receipt) => (
                            <tr key={receipt.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 uppercase
                                      ${receipt.category === 'Food & Dining' ? 'bg-orange-100 text-orange-600' : 
                                        receipt.category === 'Transportation' ? 'bg-blue-100 text-blue-600' : 
                                        receipt.category === 'Business' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                      {receipt.merchantName.charAt(0)}
                                    </div>
                                    {receipt.merchantName}
                                </td>
                                <td className="px-4 py-3 text-gray-500">{receipt.date}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                        {receipt.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-gray-900">
                                    ₹{receipt.totalAmount.toFixed(2)}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                No recent receipts found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
    </div>
  );
};

const StatCard: React.FC<{title: string; value: string | number; icon: React.ElementType; color: string}> = ({title, value, icon: Icon, color}) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
  </div>
);