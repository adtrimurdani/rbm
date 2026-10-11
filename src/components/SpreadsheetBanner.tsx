import React from 'react';
import { SheetMetadata } from '../services/sheets';
import { FileSpreadsheet, ExternalLink, ShieldCheck, Database } from 'lucide-react';

interface SpreadsheetBannerProps {
  sheetMeta: SheetMetadata | null;
  isConnected: boolean;
  onConnect: () => void;
}

export const SpreadsheetBanner: React.FC<SpreadsheetBannerProps> = ({
  sheetMeta,
  isConnected,
  onConnect,
}) => {
  if (!isConnected || !sheetMeta) {
    return (
      <div
        id="sheet-not-connected-banner"
        className="rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/70 p-5 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Penyimpanan Otomatis ke Google Spreadsheet
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 max-w-xl">
                Aplikasi ini dirancang khusus untuk menyimpan setiap transaksi pembukuan les Rumah Belajar Mumu langsung ke Google Sheets akun Anda secara aman dan real-time.
              </p>
            </div>
          </div>
          <button
            id="banner-connect-google-btn"
            type="button"
            onClick={onConnect}
            className="whitespace-nowrap px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            Sambungkan Google Sheets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="sheet-connected-banner"
      className="rounded-3xl bg-white border border-emerald-100 p-5 sm:p-6 shadow-xs relative overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">{sheetMeta.title}</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                <ShieldCheck className="h-3 w-3" />
                Google Drive Anda
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <Database className="h-3 w-3 text-slate-400" />
                Sheet: &quot;{sheetMeta.firstSheetName}&quot;
              </span>
              <span>•</span>
              <span>Kolom A-I terstruktur otomatis</span>
            </p>
          </div>
        </div>

        <a
          id="banner-open-sheets-btn"
          href={sheetMeta.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <span>Buka di Google Sheets</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
