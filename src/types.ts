export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer Bank' | 'Lainnya';

export interface Transaction {
  id: string;
  createdAt: string; // ISO or formatted
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  rowIndex?: number; // Row index in Google Sheets for reference/deletion
}

export interface SpreadsheetInfo {
  id: string;
  title: string;
  url: string;
  sheetName: string;
}

export interface RbmCategory {
  id: string;
  name: string;
  type: TransactionType;
  iconName?: string;
}

export type SandwichCategory = RbmCategory;
