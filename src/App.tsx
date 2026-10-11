/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Transaction } from './types';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken,
} from './services/firebase';
import {
  SheetMetadata,
  getOrCreateSpreadsheet,
  fetchTransactionsFromSheet,
  appendTransactionToSheet,
  deleteTransactionFromSheet,
} from './services/sheets';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { SpreadsheetBanner } from './components/SpreadsheetBanner';
import { ConfirmModal } from './components/ConfirmModal';
import { formatRupiah } from './data/categories';

const STORAGE_KEY_LOCAL_TX = 'rbm_local_offline_transactions';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sheetMeta, setSheetMeta] = useState<SheetMetadata | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Deletion modal state (Workspace mandatory guideline)
  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Notification / Alert
  const [appAlert, setAppAlert] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  // Load from local storage initially
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOCAL_TX);
      if (saved) {
        const parsed: Transaction[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTransactions(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse local transactions', e);
    }
  }, []);

  // Sync with Google Sheets
  const syncWithGoogleSheets = useCallback(async (token: string) => {
    setIsSyncing(true);
    setAppAlert(null);
    try {
      // 1. Get or create spreadsheet
      const meta = await getOrCreateSpreadsheet(token);
      setSheetMeta(meta);

      // 2. Fetch rows from spreadsheet
      const sheetRows = await fetchTransactionsFromSheet(meta.id, meta.firstSheetName, token);
      
      // If sheet has rows, use them
      if (sheetRows.length > 0) {
        setTransactions(sheetRows);
        localStorage.setItem(STORAGE_KEY_LOCAL_TX, JSON.stringify(sheetRows));
      } else {
        // Check if there are local transactions to upload to newly created sheet
        const saved = localStorage.getItem(STORAGE_KEY_LOCAL_TX);
        if (saved) {
          const localList: Transaction[] = JSON.parse(saved);
          if (localList.length > 0) {
            // Upload local transactions in sequence
            for (const tx of [...localList].reverse()) {
              await appendTransactionToSheet(meta.id, meta.firstSheetName, tx, token);
            }
            const refreshed = await fetchTransactionsFromSheet(meta.id, meta.firstSheetName, token);
            setTransactions(refreshed);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Error syncing with Google Sheets:', err);
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat sinkronisasi Google Sheets.';
      setAppAlert({ type: 'error', message: errMsg });
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (authedUser, token) => {
        setUser(authedUser);
        setAccessToken(token);
        await syncWithGoogleSheets(token);
      },
      () => {
        setUser(null);
        setSheetMeta(null);
      }
    );

    return () => unsubscribe();
  }, [syncWithGoogleSheets]);

  // Login handler
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setAppAlert(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        await syncWithGoogleSheets(result.accessToken);
      }
    } catch (err: unknown) {
      console.error('Google Sign In failed:', err);
      const errMsg = err instanceof Error ? err.message : 'Gagal masuk dengan akun Google.';
      setAppAlert({
        type: 'error',
        message: `${errMsg}. Pastikan pop-up browser diizinkan.`,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setSheetMeta(null);
      setAppAlert({
        type: 'info',
        message: 'Anda telah keluar dari akun Google. Data lokal tetap tersimpan di browser Anda.',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Save transaction handler
  const handleSaveTransaction = async (
    newTxData: Omit<Transaction, 'id' | 'createdAt' | 'rowIndex'>
  ): Promise<boolean> => {
    setIsSaving(true);
    setAppAlert(null);

    const now = new Date();
    const newTx: Transaction = {
      ...newTxData,
      id: `TX_${Date.now().toString(36).toUpperCase()}`,
      createdAt: now.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
    };

    try {
      const token = await getAccessToken();

      if (user && token && sheetMeta) {
        // Save directly to Google Sheets
        const appendedRow = await appendTransactionToSheet(
          sheetMeta.id,
          sheetMeta.firstSheetName,
          newTx,
          token
        );
        newTx.rowIndex = appendedRow;
      }

      // Update state
      const updatedList = [newTx, ...transactions];
      setTransactions(updatedList);
      localStorage.setItem(STORAGE_KEY_LOCAL_TX, JSON.stringify(updatedList));
      return true;
    } catch (err: unknown) {
      console.error('Failed to save transaction:', err);
      const errMsg = err instanceof Error ? err.message : 'Gagal menyimpan transaksi.';
      setAppAlert({
        type: 'error',
        message: `${errMsg} Catatan tetap disimpan sementara di perangkat Anda.`,
      });
      // Still save locally as fallback so user work isn't lost
      const updatedList = [newTx, ...transactions];
      setTransactions(updatedList);
      localStorage.setItem(STORAGE_KEY_LOCAL_TX, JSON.stringify(updatedList));
      return true;
    } finally {
      setIsSaving(false);
    }
  };

  // Delete transaction request (opens confirmation dialog per Workspace Integration rules)
  const handleDeleteRequest = (tx: Transaction) => {
    setPendingDeleteTx(tx);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!pendingDeleteTx) return;

    setIsDeleting(true);
    setAppAlert(null);

    try {
      const token = await getAccessToken();
      if (user && token && sheetMeta && pendingDeleteTx.rowIndex) {
        // Delete from Google Sheets
        await deleteTransactionFromSheet(
          sheetMeta.id,
          sheetMeta.firstSheetId,
          pendingDeleteTx.rowIndex,
          token
        );
      }

      // Update local state
      const updatedList = transactions.filter((t) => t.id !== pendingDeleteTx.id);
      setTransactions(updatedList);
      localStorage.setItem(STORAGE_KEY_LOCAL_TX, JSON.stringify(updatedList));

      // Refresh from sheet to resync row indexes if online
      if (user && token && sheetMeta) {
        const freshRows = await fetchTransactionsFromSheet(
          sheetMeta.id,
          sheetMeta.firstSheetName,
          token
        );
        setTransactions(freshRows);
        localStorage.setItem(STORAGE_KEY_LOCAL_TX, JSON.stringify(freshRows));
      }

      setIsDeleteModalOpen(false);
      setPendingDeleteTx(null);
    } catch (err: unknown) {
      console.error('Failed to delete transaction:', err);
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus baris transaksi.';
      setAppAlert({ type: 'error', message: errMsg });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="rbm-kas-accounting-app" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        user={user}
        sheetMeta={sheetMeta}
        isLoggingIn={isLoggingIn}
        isSyncing={isSyncing}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRefresh={() => {
          getAccessToken().then((tok) => {
            if (tok) syncWithGoogleSheets(tok);
            else handleLogin();
          });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Global Alert Notification */}
        {appAlert && (
          <div
            id="app-global-alert"
            className={`p-4 rounded-2xl text-xs sm:text-sm font-medium border flex items-center justify-between gap-3 ${
              appAlert.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-sky-50 border-sky-200 text-sky-800'
            }`}
          >
            <span>{appAlert.message}</span>
            <button
              type="button"
              onClick={() => setAppAlert(null)}
              className="text-xs font-bold underline cursor-pointer shrink-0"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Spreadsheet Status Banner */}
        <SpreadsheetBanner
          sheetMeta={sheetMeta}
          isConnected={Boolean(user && sheetMeta)}
          onConnect={handleLogin}
        />

        {/* Financial Summary KPIs */}
        <SummaryCards
          transactions={transactions}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Two-Column Responsive Layout: Form on left, History on right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Transaction Input Form */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Input Catatan Baru
              </h2>
              <span className="text-xs text-slate-500">
                Pemasukan & Pengeluaran
              </span>
            </div>
            <TransactionForm
              onSave={handleSaveTransaction}
              isSaving={isSaving}
              isConnectedToSheets={Boolean(user && sheetMeta)}
              onConnectSheets={handleLogin}
            />
          </div>

          {/* Right Column: Transaction History & Table */}
          <div className="lg:col-span-7 space-y-4">
            <TransactionList
              transactions={transactions}
              onDeleteRequest={handleDeleteRequest}
              isLoading={isSyncing}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>Aplikasi Pembukuan Kas Rumah Belajar Mumu • Terintegrasi Google Sheets</p>
          <p className="text-slate-400">Data tersimpan langsung di akun Google Drive pribadi Anda</p>
        </div>
      </footer>

      {/* Mandatory User Confirmation Modal for Destructive Delete Operation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Hapus Transaksi dari Google Sheets?"
        message={
          pendingDeleteTx
            ? `Apakah Anda yakin ingin menghapus data transaksi "${pendingDeleteTx.description}" sebesar ${formatRupiah(
                pendingDeleteTx.amount
              )} (tanggal ${pendingDeleteTx.date})? Tindakan ini akan menghapus baris terkait langsung dari spreadsheet Google Sheets Anda.`
            : ''
        }
        confirmLabel="Hapus dari Spreadsheet"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setPendingDeleteTx(null);
        }}
      />
    </div>
  );
}
