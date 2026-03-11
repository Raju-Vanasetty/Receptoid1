import React from 'react';
import { LayoutDashboard, UploadCloud, Receipt as ReceiptIcon, Settings, PieChart, LogOut, Wallet } from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'upload' | 'receipts' | 'budget' | 'reports' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'upload' | 'receipts' | 'budget' | 'reports' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Receipt', icon: UploadCloud },
    { id: 'receipts', label: 'All Receipts', icon: ReceiptIcon },
    { id: 'budget', label: 'Manage Budget', icon: Wallet },
  ] as const;

  return (
    <div className="flex flex-col h-full justify-between pb-4">
      <div className="mt-6 px-4 space-y-2">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Navigation</p>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-200 ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}

        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-8 mb-2">Account</p>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-200 ${
            activeTab === 'reports'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <PieChart size={20} />
          <span>Reports</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors duration-200 ${
            activeTab === 'settings'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>

      <div className="px-4 mt-auto">
        <button className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};