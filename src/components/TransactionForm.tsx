import React, { useState } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  formatRupiah,
} from '../data/categories';
import { PlusCircle, MinusCircle, Check, Send, CreditCard, Banknote, QrCode } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'rowIndex'>) => Promise<boolean>;
  isSaving: boolean;
  isConnectedToSheets: boolean;
  onConnectSheets: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  isSaving,
  isConnectedToSheets,
  onConnectSheets,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);

  const [type, setType] = useState<TransactionType>('income');
  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string>(currentTime);
  const [category, setCategory] = useState<string>(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Switch type and reset category to first item in list
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  };

  // Quick add nominal
  const handleQuickAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + addVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Harap masukkan nominal transaksi yang valid (lebih dari 0).');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Harap isi keterangan transaksi (misal: nama siswa/program les atau keperluan operasional).');
      return;
    }

    const success = await onSave({
      date,
      time,
      type,
      category,
      description: description.trim(),
      amount: numericAmount,
      paymentMethod,
    });

    if (success) {
      setSuccessToast(
        `${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${formatRupiah(numericAmount)} berhasil dicatat ke Spreadsheet!`
      );
      // Reset form fields
      setDescription('');
      setAmount('');
      setTime(new Date().toTimeString().slice(0, 5));
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div id="transaction-form-card" className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-100 shadow-sm relative">
      {/* Top Banner if not connected to Google Sheets */}
      {!isConnectedToSheets && (
        <div
          id="sheets-connection-prompt"
          className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Hubungkan dengan Google Sheets</h4>
              <p className="text-xs text-amber-800/80">
                Masuk dengan akun Google agar setiap transaksi otomatis tersimpan di Spreadsheet Anda.
              </p>
            </div>
          </div>
          <button
            id="prompt-connect-btn"
            type="button"
            onClick={onConnectSheets}
            className="whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Hubungkan Sekarang
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successToast && (
        <div
          id="form-success-toast"
          className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2"
        >
          <div className="rounded-full bg-emerald-100 p-1 text-emerald-700">
            <Check className="h-4 w-4" />
          </div>
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div
          id="form-error-toast"
          className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium"
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type Toggle: Income vs Expense */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Jenis Transaksi
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-100/80">
            <button
              id="type-income-tab"
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PlusCircle className="h-4 w-4 text-emerald-600" />
              <span>Pemasukan</span>
            </button>
            <button
              id="type-expense-tab"
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-white text-rose-700 shadow-sm border border-rose-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MinusCircle className="h-4 w-4 text-rose-600" />
              <span>Pengeluaran</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Nominal (Rupiah) <span className="text-rose-500">*</span>
          </label>
          <div className="relative rounded-2xl shadow-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500 font-bold text-base">
              Rp
            </div>
            <input
              id="transaction-amount-input"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 pl-12 pr-4 py-3.5 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Quick amount adder buttons */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {[25000, 50000, 100000, 250000, 500000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickAddAmount(val)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                +{val >= 1000 ? `${val / 1000}rb` : val}
              </button>
            ))}
            {amount && (
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
            {amount && !isNaN(parseFloat(amount)) && (
              <span className="ml-auto text-xs font-semibold text-slate-500">
                Terbaca: {formatRupiah(parseFloat(amount))}
              </span>
            )}
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Keterangan Transaksi <span className="text-rose-500">*</span>
          </label>
          <input
            id="transaction-desc-input"
            type="text"
            placeholder={
              type === 'income'
                ? 'Contoh: Pembayaran les privat Bahasa Inggris Level 1 - Ahmad'
                : 'Contoh: Beli kertas HVS, modul English for Kids & tinta printer'
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Category & Payment Method Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Kategori
            </label>
            <select
              id="transaction-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              {currentCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === pm
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {pm === 'Tunai' && <Banknote className="h-3.5 w-3.5" />}
                  {pm === 'QRIS' && <QrCode className="h-3.5 w-3.5" />}
                  {pm === 'Transfer Bank' && <CreditCard className="h-3.5 w-3.5" />}
                  <span>{pm}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Tanggal
            </label>
            <input
              id="transaction-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Waktu / Jam
            </label>
            <input
              id="transaction-time-input"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="block w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          id="submit-transaction-btn"
          type="submit"
          disabled={isSaving}
          className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-bold text-white text-base shadow-md transition-all cursor-pointer disabled:opacity-60 ${
            type === 'income'
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/20'
              : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-600/20'
          }`}
        >
          {isSaving ? (
            <>
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Menyimpan ke Google Sheets...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Simpan Catatan ke Spreadsheet</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
