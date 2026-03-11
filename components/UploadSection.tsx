import React, { useState, useRef, useEffect } from 'react';
import { useReceipts } from '../App';
import { analyzeReceiptImage, fileToBase64 } from '../services/geminiService';
import { Receipt, CATEGORIES, ReceiptItem } from '../types';
import { Upload, Camera, Loader2, CheckCircle, AlertCircle, FileText, UploadCloud, Plus, Trash2, X } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const UploadSection: React.FC = () => {
  const { addReceipt } = useReceipts();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Camera State
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Form State
  const [merchantName, setMerchantName] = useState('');
  const [date, setDate] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [items, setItems] = useState<ReceiptItem[]>([]);
  
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Attach stream to video element when modal opens
  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      setShowCamera(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errorMessage = "Unable to access camera. Please check permissions.";
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please allow access in your browser settings.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = "Camera is in use by another application.";
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
            processFile(file);
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Populate form when scan data arrives
  const populateForm = (data: Partial<Receipt>) => {
    setMerchantName(data.merchantName || '');
    setDate(data.date || new Date().toISOString().split('T')[0]);
    setTotalAmount(data.totalAmount?.toString() || '');
    setCategory(data.category || '');
    setItems(data.items || []);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    // 1. Validation: File Type
    if (!file.type.startsWith('image/')) {
      setError('Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    // 2. Validation: File Size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size too large. Please upload an image smaller than 10MB.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);
    setIsProcessing(true);

    // Reset Form
    setMerchantName('');
    setDate('');
    setTotalAmount('');
    setCategory('');
    setItems([]);

    try {
      const base64 = await fileToBase64(file);
      const result = await analyzeReceiptImage(base64);
      populateForm(result);
    } catch (err: any) {
      console.error(err);
      let msg = "Failed to process receipt.";
      
      // Detailed error messages based on API response
      if (err.message) {
        if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
          msg = "Service is busy or quota exceeded. Please try again in a moment.";
        } else if (err.message.includes("API_KEY")) {
          msg = "System configuration error: Invalid API Key.";
        } else if (err.message.includes("candidate")) {
           msg = "The image was unclear or contained no recognizable receipt text.";
        } else if (err.message.includes("parse")) {
           msg = "Could not understand the receipt data structure. Please fill in details manually.";
        } else {
           msg = err.message;
        }
      }
      
      setError(`${msg} You can still enter details manually.`);
    } finally {
      setIsProcessing(false);
      // Reset the file input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', amount: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantName || !totalAmount) {
      setError("Merchant Name and Total Amount are required.");
      return;
    }

    const newReceipt: Receipt = {
      id: Date.now().toString(),
      merchantName,
      date: date || new Date().toISOString().split('T')[0],
      totalAmount: parseFloat(totalAmount),
      category: (category as any) || 'Others',
      items: items.filter(i => i.description.trim() !== ''), // Filter empty items
      status: 'processed',
      imageUrl: previewUrl || undefined
    };

    addReceipt(newReceipt);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12 relative">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-[60vh] object-cover bg-gray-900"
            />
            
            <button 
              onClick={stopCamera}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
              title="Close Camera"
            >
              <X size={24} />
            </button>

            <div className="absolute bottom-0 inset-x-0 p-6 flex flex-col items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent gap-2">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition bg-white/20"
                title="Take Photo"
              >
                <div className="w-12 h-12 bg-white rounded-full" />
              </button>
              <p className="text-white text-sm font-medium drop-shadow-md">Tap to capture</p>
            </div>
          </div>
          <p className="text-gray-300 mt-4 text-sm">Position the receipt within the frame</p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Receipt</h1>
        <p className="text-gray-500">Scan or upload your receipt to automatically extract details.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Left Col: Upload Area - Sticky on Desktop */}
        <div className="space-y-6 xl:sticky xl:top-6">
          <div 
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'
            } ${previewUrl ? 'bg-gray-50' : 'bg-white'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {previewUrl ? (
              <div className="relative">
                <img 
                  src={previewUrl} 
                  alt="Receipt Preview" 
                  className="max-h-[600px] mx-auto rounded-lg shadow-lg border border-gray-200 object-contain bg-white" 
                />
                <button 
                  onClick={() => {
                    setPreviewUrl(null);
                    setItems([]);
                    setError(null);
                  }}
                  className="absolute top-4 right-4 bg-white p-2 rounded-full text-gray-600 hover:text-red-600 shadow-md border border-gray-100 transition-colors"
                  title="Remove Image"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2">
                  <UploadCloud size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Drop receipt here</h3>
                  <p className="text-sm text-gray-500 mt-2">Supports JPG, PNG, WEBP (Max 10MB)</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full max-w-xs">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition font-semibold shadow-sm flex items-center justify-center gap-2"
                  >
                    <Upload size={20} />
                    Upload File
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 cursor-pointer px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <Camera size={20} />
                    Scan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Progress / Status */}
          {isProcessing && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4 animate-pulse">
              <Loader2 className="animate-spin text-indigo-600" size={24} />
              <div>
                <p className="font-bold text-indigo-900">Analyzing Receipt...</p>
                <p className="text-sm text-indigo-700">Extracting merchant, date, total, and items.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-4 relative pr-10">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={24} />
              <div className="space-y-1">
                <p className="text-sm text-red-900 font-bold">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Extracted Data Form */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <FileText size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Receipt Details</h2>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Merchant Name</label>
              <input 
                type="text" 
                className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-gray-400 font-medium"
                placeholder="e.g. Walmart Supercenter"
                value={merchantName}
                onChange={e => setMerchantName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                <input 
                  type="date" 
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Total Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 font-bold">₹</span>
                  </div>
                  <input 
                    type="number" 
                    step="0.01"
                    className="w-full h-11 pl-8 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium placeholder:text-gray-400"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <div className="relative">
                <select 
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium appearance-none cursor-pointer"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a Category</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

             {/* Items Editor */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide">Items Detected</label>
                <button 
                  type="button" 
                  onClick={addItem}
                  className="text-xs flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-2 py-1 rounded transition"
                >
                  <Plus size={14} /> Add Item
                </button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left w-2/3">Item Description</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">
                          No items detected. Add manually or scan receipt.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                          <td className="p-2">
                            <input 
                              type="text" 
                              className="w-full px-2 py-1.5 rounded border border-transparent hover:border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 bg-transparent focus:bg-white outline-none transition text-gray-900"
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              placeholder="Item name"
                            />
                          </td>
                          <td className="p-2">
                            <input 
                              type="number" 
                              step="0.01"
                              className="w-full px-2 py-1.5 rounded border border-transparent hover:border-gray-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 bg-transparent focus:bg-white outline-none transition text-right font-medium text-gray-900"
                              value={item.amount}
                              onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value))}
                              placeholder="0.00"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button 
                              type="button" 
                              onClick={() => removeItem(idx)}
                              className="text-gray-300 hover:text-red-500 transition p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {items.length > 0 && (
                <div className="mt-2 text-right text-xs text-gray-500">
                  Sum of items: <span className="font-semibold text-gray-700">₹{items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold shadow-md transition-all transform active:scale-[0.99] bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg"
              >
                <CheckCircle size={20} />
                Save Receipt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};