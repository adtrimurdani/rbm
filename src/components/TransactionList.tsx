import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatRupiah } from '../data/categories';
import { Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, Clock, Tag } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteRequest: (tx: Transaction) => void;
  isLoading: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteRequest,
  isLoading,
}) => {
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchMethod = tx.paymentMethod.toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchMethod) return false;
    }
    return true;
  });

  return (
    <div id="transaction-list-card" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Riwayat Transaksi</h2>
          <p className="text-xs text-slate-500">
            {transactions.length} total baris tersimpan di Spreadsheet
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 text-xs font-semibold">
          <button
            id="filter-all-btn"
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua
          </button>
          <button
            id="filter-income-btn"
            type="button"
            onClick={() => setFilterType('income')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pemasukan
          </button>
          <button
            id="filter-expense-btn"
            type="button"
            onClick={() => setFilterType('expense')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterType === 'expense' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          id="search-transactions-input"
          type="text"
          placeholder="Cari transaksi berdasarkan nama siswa, modul/buku, atau kategori..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-slate-50/50"
        />
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent mb-2" />
          <p className="text-xs">Memuat data dari Google Sheets...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-xl mb-3">
            📚
          </div>
          <h4 className="text-sm font-semibold text-slate-800">Belum Ada Transaksi</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Tidak ditemukan transaksi yang cocok dengan pencarian Anda.'
              : 'Gunakan formulir di atas untuk mencatat pembayaran les atau pengeluaran operasional pertama Anda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                id={`tx-card-${tx.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/20 transition-all bg-white shadow-xs"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`mt-0.5 h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isIncome ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{tx.description}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          isIncome
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}
                      >
                        <Tag className="h-2.5 w-2.5" />
                        {tx.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                        {tx.paymentMethod}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {tx.date} • {tx.time || '-'}
                      </span>
                      {tx.rowIndex && (
                        <span className="text-[10px] text-slate-400">
                          (Baris #{tx.rowIndex})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <span
                    className={`text-base font-extrabold tracking-tight ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatRupiah(tx.amount)}
                  </span>

                  <button
                    id={`delete-tx-btn-${tx.id}`}
                    type="button"
                    title="Hapus baris transaksi ini dari Google Sheets"
                    onClick={() => onDeleteRequest(tx)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
