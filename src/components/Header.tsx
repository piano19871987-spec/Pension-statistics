import React from 'react';
import { User } from 'firebase/auth';
import { FileSpreadsheet, ExternalLink, RefreshCw, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  hasToken: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string;
  isSyncing: boolean;
  lastSynced: Date | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onRefresh: () => void;
  onOpenSheetConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  hasToken,
  spreadsheetId,
  spreadsheetTitle,
  isSyncing,
  lastSynced,
  onSignIn,
  onSignOut,
  onRefresh,
  onOpenSheetConfig,
}) => {
  const sheetUrl = spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    : null;

  return (
    <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border-b border-indigo-900/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & System Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-950/40 border border-white/20 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                  ปีงบประมาณ 2570 (FY 2027)
                </span>
                <span className="text-xs text-slate-300 font-medium">สำนักงานคลังเขต 7</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                ระบบสถิติอนุมัติสั่งจ่ายบำเหน็จบำนาญฯ
              </h1>
            </div>
          </div>

          {/* Right Action Bar: Google Sheet Status & Google Auth */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Google Sheets Connection Pill */}
            {user && hasToken && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs shadow-inner">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline">Google Sheet:</span>
                </div>
                {spreadsheetId ? (
                  <>
                    <button
                      onClick={onOpenSheetConfig}
                      title="คลิกเพื่อดูหรือเปลี่ยน Google Sheet"
                      className="text-slate-200 hover:text-white underline underline-offset-2 max-w-[150px] truncate"
                    >
                      {spreadsheetTitle || 'สถิติอนุมัติยอดบำนาญ'}
                    </button>
                    {sheetUrl && (
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-slate-700 rounded transition"
                        title="เปิดในแท็บ Google Sheets ใหม่"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={onRefresh}
                      disabled={isSyncing}
                      className="text-slate-300 hover:text-white p-1 hover:bg-slate-700 rounded transition disabled:opacity-50"
                      title="ซิงค์ข้อมูลกับ Google Sheet"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`}
                      />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onOpenSheetConfig}
                    className="text-amber-300 hover:text-amber-200 font-semibold underline underline-offset-2"
                  >
                    เชื่อมต่อ Google Sheet
                  </button>
                )}
              </div>
            )}

            {/* Auth Section */}
            {user && hasToken ? (
              <div className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/60 rounded-xl pl-2 pr-3 py-1 text-xs">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-indigo-400"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden md:block text-left">
                  <div className="text-slate-200 font-medium truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                </div>
                <button
                  onClick={onSignOut}
                  title="ออกจากระบบ"
                  className="text-slate-400 hover:text-rose-400 p-1 transition ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Official Google Sign In Button */
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs rounded-xl shadow border border-slate-300 transition active:scale-95"
              >
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="w-4 h-4 shrink-0"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Sub-bar if last synced */}
        {spreadsheetId && lastSynced && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              เชื่อมโยงข้อมูลกับ Google Sheets สำเร็จ
            </span>
            <span>อัปเดตล่าสุด: {lastSynced.toLocaleTimeString('th-TH')} น.</span>
          </div>
        )}
      </div>
    </header>
  );
};
