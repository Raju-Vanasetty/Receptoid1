export interface ReceiptItem {
  description: string;
  amount: number;
}

export interface Receipt {
  id: string;
  merchantName: string;
  date: string; // ISO String YYYY-MM-DD
  totalAmount: number;
  category: 'Food & Dining' | 'Transportation' | 'Business' | 'Utilities' | 'Shopping' | 'Others';
  items: ReceiptItem[];
  status: 'processing' | 'processed' | 'failed';
  imageUrl?: string;
}

export const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Business',
  'Utilities',
  'Shopping',
  'Others'
] as const;

export type Category = typeof CATEGORIES[number];

export interface DashboardStats {
  totalAmount: number;
  totalReceipts: number;
  averageAmount: number;
  topCategory: string;
}