import React from 'react';
import { User } from 'firebase/auth';
import { SheetMetadata } from '../services/sheets';
import { ExternalLink, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  sheetMeta: SheetMetadata | null;
  isLoggingIn: boolean;
  isSyncing: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  sheetMeta,
  isLoggingIn,
  isSyncing,
  onLogin,
  onLogout,
  onRefresh,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-100/70 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs overflow-hidden shrink-0">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQaUU4BhCdvkqH8dY8xN4d6V9inGbHITxP-2GtBjCaK4Q&s"
              alt="Logo Rumah Belajar Mumu"
              className="h-full w-full object-contain p-0.5"
              onError={(e) => {
                // Graceful fallback to text if image fails to load
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Kas Rumah Belajar Mumu</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/60">
                Google Sheets
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Pembukuan Kas Tempat Les Bahasa Inggris</p>
          </div>
        </div>

        {/* Action Controls & Auth */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {sheetMeta?.url && (
                <a
                  id="open-sheet-link"
                  href={sheetMeta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Buka Google Sheets di tab baru"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Buka Spreadsheet</span>
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              )}

              <button
                id="refresh-data-btn"
                type="button"
                onClick={onRefresh}
                disabled={isSyncing}
                title="Sinkronisasi data terbaru dari Spreadsheet"
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin text-amber-600' : ''}`} />
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full border border-amber-200 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                    {user.displayName || 'Pemilik Usaha'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{user.email}</div>
                </div>

                <button
                  id="logout-btn"
                  onClick={onLogout}
                  title="Keluar / Ganti Akun"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              id="google-signin-btn"
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-medium text-sm shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
