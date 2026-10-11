import React from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../data/categories';
import { TrendingUp, TrendingDown, Wallet, ReceiptText, Calendar } from 'lucide-react';

interface SummaryCardsProps {
  transactions: Transaction[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  transactions,
  selectedDate,
  onDateChange,
}) => {
  // Filter for selected date
  const dayTransactions = transactions.filter((t) => t.date === selectedDate);

  const dayIncome = dayTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const dayExpense = dayTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const dayNet = dayIncome - dayExpense;

  // Month calculation
  const currentMonth = selectedDate.substring(0, 7); // YYYY-MM
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
  const monthNet = monthIncome - monthExpense;

  return (
    <div id="financial-summary-section" className="space-y-4">
      {/* Date selector bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
          <Calendar className="h-4 w-4 text-amber-600" />
          <span>Periode Catatan:</span>
          <input
            id="summary-date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            Hari Ini:{' '}
            <strong className="text-slate-800 font-semibold">{dayTransactions.length} transaksi</strong>
          </span>
          <span className="h-3 w-px bg-slate-200" />
          <span>
            Bulan Ini ({currentMonth}):{' '}
            <strong className="text-emerald-700 font-semibold">{formatRupiah(monthNet)}</strong>
          </span>
        </div>
      </div>

      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <div
          id="summary-income-card"
          className="rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 tracking-wide uppercase">
              Pemasukan Hari Ini
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(dayIncome)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total bulan ini: <span className="font-medium text-slate-700">{formatRupiah(monthIncome)}</span>
            </p>
          </div>
        </div>

        {/* Expense Card */}
        <div
          id="summary-expense-card"
          className="rounded-2xl bg-white p-5 border border-rose-100 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 tracking-wide uppercase">
              Pengeluaran Hari Ini
            </span>
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatRupiah(dayExpense)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total bulan ini: <span className="font-medium text-slate-700">{formatRupiah(monthExpense)}</span>
            </p>
          </div>
        </div>

        {/* Net Profit Card */}
        <div
          id="summary-net-card"
          className={`rounded-2xl p-5 border shadow-xs relative overflow-hidden ${
            dayNet >= 0
              ? 'bg-amber-50/50 border-amber-200/80 text-amber-950'
              : 'bg-rose-50/40 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900 tracking-wide uppercase">
              Laba Bersih Hari Ini
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold tracking-tight ${dayNet >= 0 ? 'text-amber-900' : 'text-rose-600'}`}>
              {formatRupiah(dayNet)}
            </div>
            <p className="mt-1 text-xs text-amber-900/70">
              Laba bersih bulan ini:{' '}
              <strong className={monthNet >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                {formatRupiah(monthNet)}
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
