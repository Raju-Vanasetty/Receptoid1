import React, { useMemo } from 'react';
import { useReceipts } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { format, subMonths, isSameMonth, parseISO } from 'date-fns';
import { Download } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { receipts } = useReceipts();

  // --- Monthly Spending Trend (Last 6 Months) ---
  const monthlyData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      
      const total = receipts
        .filter(r => isSameMonth(parseISO(r.date), date))
        .reduce((sum, r) => sum + r.totalAmount, 0);

      data.push({
        name: monthKey,
        amount: total
      });
    }
    return data;
  }, [receipts]);

  // --- Category Analysis ---
  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    receipts.forEach(r => {
      data[r.category] = (data[r.category] || 0) + r.totalAmount;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [receipts]);

  const totalSpentAllTime = receipts.reduce((sum, r) => sum + r.totalAmount, 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500">Deep dive into your spending habits over time.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm font-medium">
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-indigo-100 font-medium mb-1">Total Lifetime Spend</p>
          <h3 className="text-3xl font-bold">₹{totalSpentAllTime.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          <p className="text-xs text-indigo-200 mt-4 opacity-80">Across {receipts.length} transactions</p>
        </div>
         <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium mb-1">Highest Spender</p>
          <h3 className="text-xl font-bold text-gray-900 truncate">
            {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
          </h3>
          <p className="text-2xl font-bold text-indigo-600 mt-2">
             ₹{categoryData.length > 0 ? categoryData[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium mb-1">Monthly Average</p>
           <h3 className="text-3xl font-bold text-gray-900">
             ₹{(monthlyData.reduce((acc, curr) => acc + curr.amount, 0) / (monthlyData.filter(d => d.amount > 0).length || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
           </h3>
           <p className="text-xs text-gray-400 mt-2">Based on last 6 months</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">6-Month Spending Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Spent']}
                />
                <Line type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Spending by Category</h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 12}} width={100} />
                <Tooltip 
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                   cursor={{fill: '#f9fafb'}}
                   formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Total']}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};