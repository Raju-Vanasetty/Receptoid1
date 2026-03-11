import React, { useState } from 'react';
import { useReceipts } from '../App';
import { Search, Filter, Trash2, ArrowUpDown, CheckSquare, Square, X, Calendar, IndianRupee, Tag, Image as ImageIcon, Receipt as ReceiptIcon } from 'lucide-react';
import { CATEGORIES, Receipt } from '../types';

export const AllReceipts: React.FC = () => {
  const { receipts, deleteReceipt, deleteReceipts } = useReceipts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // State for detail modal
  const [viewReceipt, setViewReceipt] = useState<Receipt | null>(null);

  // Filter Logic
  const filteredReceipts = receipts.filter(r => {
    const matchesSearch = r.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.items.some(i => i.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  // Bulk Selection Logic
  const handleSelectAll = () => {
    if (selectedIds.length === filteredReceipts.length && filteredReceipts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReceipts.map(r => r.id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const executeBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} receipt(s)?`)) {
      deleteReceipts(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleDeleteSingle = (id: string) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      deleteReceipt(id);
      if (viewReceipt?.id === id) setViewReceipt(null);
    }
  };

  const isAllSelected = filteredReceipts.length > 0 && selectedIds.length === filteredReceipts.length;

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* Detail Modal */}
      {viewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewReceipt(null)}>
          <div 
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setViewReceipt(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-900 rounded-full shadow-sm transition-colors"
            >
              <X size={24} />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center p-4 md:p-8 border-b md:border-b-0 md:border-r border-gray-200">
              {viewReceipt.imageUrl ? (
                <img 
                  src={viewReceipt.imageUrl} 
                  alt="Receipt Preview" 
                  className="max-w-full max-h-[40vh] md:max-h-[70vh] object-contain rounded-lg shadow-md bg-white" 
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <ImageIcon size={64} className="mb-2 opacity-50" />
                  <p>No image available</p>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden">
              <div className="p-6 md:p-8 overflow-y-auto flex-1">
                <div className="flex items-center gap-3 mb-6">
                   <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shrink-0 uppercase
                      ${viewReceipt.category === 'Food & Dining' ? 'bg-orange-100 text-orange-600' : 
                        viewReceipt.category === 'Transportation' ? 'bg-blue-100 text-blue-600' : 
                        viewReceipt.category === 'Business' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                      {viewReceipt.merchantName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{viewReceipt.merchantName}</h2>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 mt-1">
                        {viewReceipt.category}
                      </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <Calendar size={16} /> Date
                    </div>
                    <div className="font-semibold text-gray-900">{viewReceipt.date}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                      <IndianRupee size={16} /> Total
                    </div>
                    <div className="font-bold text-xl text-indigo-600">₹{viewReceipt.totalAmount.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ReceiptIcon size={16} /> Itemized List
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">Item</th>
                          <th className="px-4 py-3 text-right font-semibold text-gray-600">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {viewReceipt.items.length > 0 ? (
                          viewReceipt.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-gray-800">{item.description}</td>
                              <td className="px-4 py-3 text-right text-gray-900 font-medium">₹{item.amount.toFixed(2)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={2} className="px-4 py-6 text-center text-gray-400 italic">No individual items listed</td>
                          </tr>
                        )}
                      </tbody>
                      {viewReceipt.items.length > 0 && (
                         <tfoot className="bg-gray-50 border-t border-gray-200">
                           <tr>
                             <td className="px-4 py-3 text-right font-bold text-gray-600">Total</td>
                             <td className="px-4 py-3 text-right font-bold text-gray-900">₹{viewReceipt.totalAmount.toFixed(2)}</td>
                           </tr>
                         </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                 <button 
                  onClick={() => handleDeleteSingle(viewReceipt.id)}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                 >
                   <Trash2 size={18} /> Delete Receipt
                 </button>
                 <button 
                  onClick={() => setViewReceipt(null)}
                  className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm transition font-medium"
                 >
                   Done
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Receipts</h1>
          <p className="text-gray-500">Manage, search, and organize your financial records.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Left Side: Select All & Search */}
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          {/* Select All Checkbox */}
          <button 
            onClick={handleSelectAll} 
            className="flex items-center justify-center text-gray-400 hover:text-indigo-600 transition p-2 rounded-lg hover:bg-gray-50"
            title="Select All"
          >
            {isAllSelected ? <CheckSquare className="text-indigo-600" size={20} /> : <Square size={20} />}
          </button>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search merchants or items..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Right Side: Filters, Sort, and Bulk Actions */}
        <div className="flex w-full md:w-auto gap-3 items-center">
          
          {selectedIds.length > 0 ? (
            <button 
              onClick={executeBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm transition animate-fade-in"
            >
              <Trash2 size={16} />
              Delete ({selectedIds.length})
            </button>
          ) : (
            <>
              <div className="relative flex-1 md:flex-none">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  className="w-full md:w-48 pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-gray-700 cursor-pointer appearance-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                <ArrowUpDown size={16} />
                {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Receipts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReceipts.map(receipt => {
          const isSelected = selectedIds.includes(receipt.id);
          return (
            <div 
              key={receipt.id} 
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group overflow-hidden flex flex-col relative cursor-pointer
                ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10' : 'border-gray-100'}`}
              onClick={() => setViewReceipt(receipt)}
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSelection(receipt.id); }}
                      className="text-gray-400 hover:text-indigo-600 transition z-10"
                    >
                      {isSelected ? <CheckSquare className="text-indigo-600" size={20} /> : <Square size={20} />}
                    </button>
                    
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                      ${receipt.category === 'Food & Dining' ? 'bg-orange-100 text-orange-600' : 
                        receipt.category === 'Transportation' ? 'bg-blue-100 text-blue-600' : 
                        receipt.category === 'Business' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                      {receipt.merchantName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{receipt.merchantName}</h3>
                      <p className="text-xs text-gray-500">{receipt.date}</p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                    {receipt.category}
                  </span>
                </div>
                
                <div className="pl-8 space-y-2 mb-4">
                  <div className="text-3xl font-bold text-gray-900">₹{receipt.totalAmount.toFixed(2)}</div>
                  <div className="text-xs text-gray-400">
                    {receipt.items.length} items detected
                  </div>
                </div>
                
                {/* Mini Item Preview */}
                <div className="ml-8 space-y-1 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  {receipt.items.slice(0, 2).map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate w-3/4">{item.description}</span>
                      <span>₹{item.amount}</span>
                    </div>
                  ))}
                  {receipt.items.length > 2 && <div className="text-xs text-gray-400 pt-1">+{receipt.items.length - 2} more...</div>}
                  {receipt.items.length === 0 && <div className="text-xs text-gray-400 italic">No items details</div>}
                </div>
              </div>

              <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-between items-center group-hover:bg-indigo-50/30 transition-colors">
                <span className="text-sm font-medium text-indigo-600">
                  View Full Details
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteReceipt(receipt.id); }}
                  className="text-gray-400 hover:text-red-600 transition p-2 rounded-full hover:bg-red-50"
                  title="Delete Receipt"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReceipts.length === 0 && (
        <div className="text-center py-20">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No receipts found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};