import React from 'react';
import { useReceipts } from '../App';
import { Trash2, Moon, Bell, Shield, Database, Smartphone } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { deleteReceipts, receipts } = useReceipts();

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL receipt data? This action cannot be undone.")) {
      const allIds = receipts.map(r => r.id);
      deleteReceipts(allIds);
      alert("All data cleared.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your preferences and data.</p>
      </div>

      <div className="space-y-6">
        {/* App Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800">App Preferences</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Moon size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Dark Mode</p>
                  <p className="text-sm text-gray-500">Adjust the appearance of the app</p>
                </div>
              </div>
              <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"/>
              </div>
            </div>
             <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Compact View</p>
                  <p className="text-sm text-gray-500">Show more items on the screen</p>
                </div>
              </div>
               <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition"/>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-bold text-gray-800">Data & Storage</h3>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <Database size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Clear All Data</p>
                  <p className="text-sm text-gray-500">Permanently remove all receipts and settings</p>
                </div>
              </div>
              <button 
                onClick={handleClearAll}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium text-sm transition"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
            <p className="text-sm text-gray-500">ReceiptOID v1.0.0 (Free Edition)</p>
            <p className="text-xs text-gray-400 mt-1">Powered by Google Gemini 2.5 Flash</p>
        </div>
      </div>
    </div>
  );
};