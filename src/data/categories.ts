export interface PresetItem {
  name: string;
  category: string;
  defaultAmount?: number;
  type: 'income' | 'expense';
}

export const INCOME_CATEGORIES = [
  'Pembayaran les',
  'Pembayaran buku',
  'Pembayaran registrasi',
];

export const EXPENSE_CATEGORIES = [
  'Kertas, sticker, tinta printer',
  'ATK',
  'Bagi hasil teacher',
  'Transportasi',
  'Pengeluaran lain-lain',
];

export const RBM_QUICK_PRESETS: PresetItem[] = [
  // Pemasukan
  { name: 'Pembayaran Les Privat Bulanan', category: 'Pembayaran les', defaultAmount: 350000, type: 'income' },
  { name: 'Pembayaran Les Reguler Kelas', category: 'Pembayaran les', defaultAmount: 250000, type: 'income' },
  { name: 'Modul / Buku Belajar Siswa', category: 'Pembayaran buku', defaultAmount: 75000, type: 'income' },
  { name: 'Biaya Pendaftaran / Registrasi Siswa Baru', category: 'Pembayaran registrasi', defaultAmount: 100000, type: 'income' },
  
  // Pengeluaran
  { name: 'Kertas HVS, Sticker Label & Tinta Printer', category: 'Kertas, sticker, tinta printer', defaultAmount: 150000, type: 'expense' },
  { name: 'Spidol Whiteboard, Penghapus & ATK Kelas', category: 'ATK', defaultAmount: 45000, type: 'expense' },
  { name: 'Bagi Hasil / Honor Teacher', category: 'Bagi hasil teacher', defaultAmount: 200000, type: 'expense' },
  { name: 'Biaya Transportasi Guru / Operasional', category: 'Transportasi', defaultAmount: 30000, type: 'expense' },
  { name: 'Konsumsi Kelas & Pengeluaran Lain-lain', category: 'Pengeluaran lain-lain', defaultAmount: 50000, type: 'expense' },
];

// Compatibility alias
export const SANDWICH_QUICK_PRESETS = RBM_QUICK_PRESETS;

export const PAYMENT_METHODS = ['Tunai', 'QRIS', 'Transfer Bank', 'Lainnya'] as const;

export const formatRupiah = (val: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};
