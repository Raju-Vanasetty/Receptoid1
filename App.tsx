import React, { useState, useEffect, createContext, useContext } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UploadSection } from './components/UploadSection';
import { AllReceipts } from './components/AllReceipts';
import { BudgetView } from './components/BudgetView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { Receipt } from './types';
import { Menu, X } from 'lucide-react';

// --- Context Setup ---
interface ReceiptContextType {
  receipts: Receipt[];
  addReceipt: (receipt: Receipt) => void;
  deleteReceipt: (id: string) => void;
  deleteReceipts: (ids: string[]) => void;
  updateReceipt: (updated: Receipt) => void;
  monthlyBudget: number;
  setMonthlyBudget: (amount: number) => void;
  categoryBudgets: Record<string, number>;
  setCategoryBudgets: (budgets: Record<string, number>) => void;
  setActiveTab: (tab: 'dashboard' | 'upload' | 'receipts' | 'budget' | 'reports' | 'settings') => void;
}

const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

export const useReceipts = () => {
  const context = useContext(ReceiptContext);
  if (!context) throw new Error("useReceipts must be used within a ReceiptProvider");
  return context;
};

// --- Mock Data for Initial State ---
const MOCK_RECEIPTS: Receipt[] = [
  {
    id: '1',
    merchantName: 'Starbucks Coffee',
    date: new Date().toISOString().split('T')[0], // Today
    totalAmount: 12.45,
    category: 'Food & Dining',
    items: [
      { description: 'Latte Grande', amount: 5.45 },
      { description: 'Croissant', amount: 7.00 }
    ],
    status: 'processed',
    imageUrl: 'https://picsum.photos/300/500'
  },
  {
    id: '2',
    merchantName: 'Uber Technologies',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 24.50,
    category: 'Transportation',
    items: [{ description: 'Ride to Airport', amount: 24.50 }],
    status: 'processed',
    imageUrl: 'https://picsum.photos/300/501'
  },
  {
    id: '3',
    merchantName: 'Amazon Web Services',
    date: '2024-03-10',
    totalAmount: 145.00,
    category: 'Business',
    items: [{ description: 'Hosting Fees', amount: 145.00 }],
    status: 'processed',
    imageUrl: 'https://picsum.photos/300/502'
  },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'receipts' | 'budget' | 'reports' | 'settings'>('dashboard');
  const [receipts, setReceipts] = useState<Receipt[]>(MOCK_RECEIPTS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>({});

  // Persist Receipts
  useEffect(() => {
    const saved = localStorage.getItem('receiptoid_data');
    if (saved) {
      try {
        setReceipts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load local data", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('receiptoid_data', JSON.stringify(receipts));
  }, [receipts]);

  // Persist Budget
  useEffect(() => {
    const savedBudget = localStorage.getItem('receiptoid_budget');
    if (savedBudget) {
      setMonthlyBudget(parseFloat(savedBudget));
    } else {
      setMonthlyBudget(1000); // Default budget
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('receiptoid_budget', monthlyBudget.toString());
  }, [monthlyBudget]);

  // Persist Category Budgets
  useEffect(() => {
    const savedCatBudgets = localStorage.getItem('receiptoid_category_budgets');
    if (savedCatBudgets) {
      try {
        setCategoryBudgets(JSON.parse(savedCatBudgets));
      } catch (e) {
        console.error("Failed to load category budgets", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('receiptoid_category_budgets', JSON.stringify(categoryBudgets));
  }, [categoryBudgets]);

  const addReceipt = (receipt: Receipt) => {
    setReceipts(prev => [receipt, ...prev]);
    setActiveTab('receipts'); // Switch to list view after upload
  };

  const deleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
  };

  const deleteReceipts = (ids: string[]) => {
    setReceipts(prev => prev.filter(r => !ids.includes(r.id)));
  };

  const updateReceipt = (updated: Receipt) => {
    setReceipts(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  return (
    <ReceiptContext.Provider value={{ 
      receipts, 
      addReceipt, 
      deleteReceipt, 
      deleteReceipts, 
      updateReceipt, 
      monthlyBudget, 
      setMonthlyBudget,
      categoryBudgets,
      setCategoryBudgets,
      setActiveTab
    }}>
      <div className="flex h-screen overflow-hidden bg-gray-50 text-gray-900">
        
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>ReceiptOID</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>
          <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm z-30">
             <div className="flex items-center gap-2 font-bold text-lg text-indigo-600">
              <span className="text-gray-900">ReceiptOID</span>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md bg-gray-100 text-gray-700">
              <Menu className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'upload' && <UploadSection />}
              {activeTab === 'receipts' && <AllReceipts />}
              {activeTab === 'budget' && <BudgetView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'settings' && <SettingsView />}
            </div>
          </div>
        </main>
      </div>
    </ReceiptContext.Provider>
  );
};

export default App;