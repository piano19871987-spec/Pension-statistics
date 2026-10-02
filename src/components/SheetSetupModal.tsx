import React, { useState } from 'react';
import { FileSpreadsheet, PlusCircle, Link2, Check, ExternalLink, X, Sparkles } from 'lucide-react';

interface SheetSetupModalProps {
  isOpen: boolean;
  currentSpreadsheetId: string | null;
  currentTitle: string;
  isCreating: boolean;
  onClose: () => void;
  onCreateNewSheet: (title: string) => Promise<void>;
  onConnectExistingSheet: (sheetIdOrUrl: string) => Promise<void>;
}

export const SheetSetupModal: React.FC<SheetSetupModalProps> = ({
  isOpen,
  currentSpreadsheetId,
  currentTitle,
  isCreating,
  onClose,
  onCreateNewSheet,
  onConnectExistingSheet,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'connect'>('create');
  const [newTitle, setNewTitle] = useState('สถิติอนุมัติยอดบำนาญ_ปีงบประมาณ_2570');
  const [existingInput, setExistingInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onCreateNewSheet(newTitle.trim() || 'สถิติอนุมัติยอดบำนาญ_ปีงบประมาณ_2570');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถสร้าง Google Sheet ได้');
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!existingInput.trim()) {
      setError('กรุณาระบุ Google Spreadsheet ID หรือ URL');
      return;
    }

    // Extract ID from full URL if provided
    let sheetId = existingInput.trim();
    const urlMatch = sheetId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch && urlMatch[1]) {
      sheetId = urlMatch[1];
    }

    try {
      await onConnectExistingSheet(sheetId);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถเชื่อมต่อ Google Sheet นี้ได้');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">ตั้งค่าเชื่อมต่อ Google Sheets</h3>
              <p className="text-xs text-slate-300">
                จัดเก็บข้อมูลการอนุมัติและระบบสรุปยอดรายเดือนแบบอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status if already connected */}
        {currentSpreadsheetId && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold">กำลังเชื่อมต่อ: </span>
                <span className="text-emerald-800">{currentTitle || currentSpreadsheetId}</span>
              </div>
            </div>
            <a
              href={`https://docs.google.com/spreadsheets/d/${currentSpreadsheetId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:text-emerald-950 font-medium inline-flex items-center gap-1"
            >
              เปิดดู <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Tab switch */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            สร้างชีตใหม่ (แนะนำ)
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'connect'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-4 h-4" />
            เชื่อมโยงชีตเดิมที่มีอยู่
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {activeTab === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 leading-relaxed">
                <div className="font-semibold flex items-center gap-1.5 text-indigo-800 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  ระบบจะสร้าง Google Sheet พร้อมโครงสร้างมาตรฐานอัตโนมัติ:
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-slate-700">
                  <li>แผ่นงานที่ 1: <strong>ข้อมูลการอนุมัติ</strong> (บันทึกรายเดือน, จังหวัด, จำนวนราย, ยอดเงิน)</li>
                  <li>แผ่นงานที่ 2: <strong>สรุปยอดรายเดือน_2570</strong> (คำนวณและสรุปยอดทั้ง 12 เดือนอัตโนมัติ)</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อไฟล์ Google Sheet ที่ต้องการสร้าง:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="เช่น สถิติอนุมัติยอดบำนาญ_ปีงบประมาณ_2570"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  disabled={isCreating}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isCreating}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังสร้าง Google Sheet...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      สร้าง Google Sheet ทันที
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Spreadsheet URL หรือ Spreadsheet ID:
                </label>
                <input
                  type="text"
                  value={existingInput}
                  onChange={(e) => setExistingInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit หรือ ID"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-mono text-xs"
                  disabled={isCreating}
                />
                <p className="mt-1.5 text-[11px] text-slate-500">
                  ต้องเป็น Google Sheet ที่บัญชีของคุณมีสิทธิ์เข้าถึงแก้ไขได้
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isCreating}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      กำลังตรวจสอบ...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      เชื่อมโยงชีต
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
