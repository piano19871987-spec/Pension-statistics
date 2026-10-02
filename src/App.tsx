import React, { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken,
} from './services/auth';
import {
  createPensionSpreadsheet,
  fetchPensionRecords,
  appendPensionRecord,
  updatePensionRecordInSheet,
  deletePensionRecordFromSheet,
  syncMonthlySummaryToSheet,
  getSpreadsheetMetadata,
} from './services/googleSheets';
import { PensionRecord } from './types/pension';
import { INITIAL_SAMPLE_RECORDS } from './data/thaiProvinces';
import { Header } from './components/Header';
import { MonthlySummaryView } from './components/MonthlySummaryView';
import { RecordsTableView } from './components/RecordsTableView';
import { ProvinceAnalyticsView } from './components/ProvinceAnalyticsView';
import { RecordFormModal } from './components/RecordFormModal';
import { SheetSetupModal } from './components/SheetSetupModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import {
  BarChart3,
  ListFilter,
  MapPin,
  Plus,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY_SHEET_ID = 'pension_sheet_id_fy2570';
const STORAGE_KEY_SHEET_TITLE = 'pension_sheet_title_fy2570';

export default function App() {
  // Authentication & Tokens
  const [user, setUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Google Sheets state
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_SHEET_ID);
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_SHEET_TITLE) || 'สถิติอนุมัติยอดบำนาญ_ปีงบประมาณ_2570';
  });
  const [recordsSheetId, setRecordsSheetId] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // App Data & Navigation
  const [records, setRecords] = useState<PensionRecord[]>(() => {
    // Start with realistic initial records so user immediately sees functional previews
    return INITIAL_SAMPLE_RECORDS;
  });
  const [activeTab, setActiveTab] = useState<'summary' | 'table' | 'provinces'>('summary');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PensionRecord | null>(null);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSavingRecord, setIsSavingRecord] = useState(false);

  // Notification / Alert banner
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Destructive Confirmation Modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    record: PensionRecord | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    record: null,
    isLoading: false,
  });

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Auth Initialization on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setHasToken(Boolean(token));
      },
      () => {
        setUser(null);
        setHasToken(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Sign In Handler
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setHasToken(true);
        showNotification('success', `ยินดีต้อนรับ ${result.user.displayName || result.user.email}`);

        // If spreadsheet ID is already configured in storage, load data
        if (spreadsheetId) {
          await loadRecordsFromSheet(spreadsheetId);
        } else {
          setIsSheetModalOpen(true);
        }
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      showNotification('error', `เข้าสู่ระบบไม่สำเร็จ: ${err?.message || 'โปรดลองอีกครั้ง'}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setHasToken(false);
    showNotification('info', 'ออกจากระบบเรียบร้อยแล้ว');
  };

  // Load Records from Google Sheet
  const loadRecordsFromSheet = useCallback(
    async (sheetIdToLoad: string) => {
      setIsSyncing(true);
      try {
        const metadata = await getSpreadsheetMetadata(sheetIdToLoad);
        setSpreadsheetTitle(metadata.title);
        setRecordsSheetId(metadata.recordsSheetId);
        localStorage.setItem(STORAGE_KEY_SHEET_TITLE, metadata.title);

        const fetched = await fetchPensionRecords(sheetIdToLoad);
        if (fetched.length > 0) {
          setRecords(fetched);
          showNotification('success', `โหลดข้อมูลจาก Google Sheets สำเร็จ (${fetched.length} รายการ)`);
        } else {
          // If sheet is empty, optionally upload local initial records to seed it
          if (records.length > 0) {
            for (const r of records) {
              await appendPensionRecord(sheetIdToLoad, r);
            }
            await syncMonthlySummaryToSheet(sheetIdToLoad, records);
            showNotification(
              'success',
              `เชื่อมต่อ Google Sheets ใหม่ และบันทึกข้อมูลตั้งต้น ${records.length} รายการเรียบร้อย`
            );
          }
        }
        setLastSynced(new Date());
      } catch (err: any) {
        console.error('Error loading records from sheet:', err);
        showNotification('error', `ไม่สามารถโหลดข้อมูลจาก Google Sheets: ${err?.message || 'ข้อผิดพลาด'}`);
      } finally {
        setIsSyncing(false);
      }
    },
    [records]
  );

  // Automatically load when token is ready and spreadsheetId exists
  useEffect(() => {
    if (hasToken && spreadsheetId && !lastSynced) {
      loadRecordsFromSheet(spreadsheetId);
    }
  }, [hasToken, spreadsheetId, lastSynced, loadRecordsFromSheet]);

  // Create brand new Google Sheet
  const handleCreateNewSheet = async (title: string) => {
    setIsCreatingSheet(true);
    try {
      const details = await createPensionSpreadsheet(title);
      setSpreadsheetId(details.spreadsheetId);
      setSpreadsheetTitle(details.title);
      setRecordsSheetId(details.recordsSheetId ?? 0);
      localStorage.setItem(STORAGE_KEY_SHEET_ID, details.spreadsheetId);
      localStorage.setItem(STORAGE_KEY_SHEET_TITLE, details.title);

      // Seed current records into the newly created sheet
      if (records.length > 0) {
        for (const r of records) {
          await appendPensionRecord(details.spreadsheetId, r);
        }
        await syncMonthlySummaryToSheet(details.spreadsheetId, records);
      }
      setLastSynced(new Date());
      showNotification('success', `สร้าง Google Sheet "${details.title}" ใน Google Drive ของคุณเรียบร้อยแล้ว!`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Connect to existing Google Sheet
  const handleConnectExistingSheet = async (sheetId: string) => {
    setIsCreatingSheet(true);
    try {
      const metadata = await getSpreadsheetMetadata(sheetId);
      setSpreadsheetId(sheetId);
      setSpreadsheetTitle(metadata.title);
      setRecordsSheetId(metadata.recordsSheetId);
      localStorage.setItem(STORAGE_KEY_SHEET_ID, sheetId);
      localStorage.setItem(STORAGE_KEY_SHEET_TITLE, metadata.title);

      await loadRecordsFromSheet(sheetId);
      showNotification('success', `เชื่อมโยงกับ Google Sheet "${metadata.title}" เรียบร้อยแล้ว`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  // Save new record or update existing
  const handleSaveRecord = async (
    recordData: Omit<PensionRecord, 'id'> & { id?: string }
  ) => {
    setIsSavingRecord(true);
    try {
      if (recordData.id && editingRecord) {
        // Edit existing record
        const updatedRecord: PensionRecord = {
          ...editingRecord,
          ...recordData,
          id: recordData.id,
        };

        const updatedList = records.map((r) =>
          r.id === updatedRecord.id ? updatedRecord : r
        );
        setRecords(updatedList);

        // If connected to Google Sheets, update row
        if (hasToken && spreadsheetId && editingRecord.rowIndex) {
          await updatePensionRecordInSheet(spreadsheetId, editingRecord.rowIndex, updatedRecord);
          await syncMonthlySummaryToSheet(spreadsheetId, updatedList);
          setLastSynced(new Date());
        }

        showNotification('success', `แก้ไขข้อมูลอนุมัติของ ${updatedRecord.province} สำเร็จ`);
      } else {
        // Add new record
        const newId = `PEN-2570-${String(records.length + 1).padStart(3, '0')}`;
        const newRecord: PensionRecord = {
          ...recordData,
          id: newId,
          rowIndex: records.length + 2,
        };

        const updatedList = [newRecord, ...records];
        setRecords(updatedList);

        // If connected to Google Sheets, append row & sync summary
        if (hasToken && spreadsheetId) {
          const appendedRowIndex = await appendPensionRecord(spreadsheetId, newRecord);
          if (appendedRowIndex > 0) {
            newRecord.rowIndex = appendedRowIndex;
          }
          await syncMonthlySummaryToSheet(spreadsheetId, updatedList);
          setLastSynced(new Date());
        }

        showNotification(
          'success',
          `บันทึกข้อมูลอนุมัติ ${newRecord.province} (${newRecord.approvedCases} ราย) สำเร็จ`
        );
      }
      setIsFormOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      console.error('Save failed:', err);
      showNotification('error', `เกิดข้อผิดพลาดในการบันทึก: ${err?.message || 'โปรดลองอีกครั้ง'}`);
      throw err;
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Delete Record Confirmation Prompt (User Confirmation for Destructive Operations - MANDATORY)
  const promptDeleteRecord = (record: PensionRecord) => {
    setDeleteConfirmation({
      isOpen: true,
      record,
      isLoading: false,
    });
  };

  // Execute deletion after confirmation
  const handleConfirmDelete = async () => {
    const targetRecord = deleteConfirmation.record;
    if (!targetRecord) return;

    setDeleteConfirmation((prev) => ({ ...prev, isLoading: true }));
    try {
      const updatedList = records.filter((r) => r.id !== targetRecord.id);
      setRecords(updatedList);

      if (hasToken && spreadsheetId && targetRecord.rowIndex) {
        await deletePensionRecordFromSheet(
          spreadsheetId,
          recordsSheetId,
          targetRecord.rowIndex
        );
        await syncMonthlySummaryToSheet(spreadsheetId, updatedList);
        setLastSynced(new Date());
      }

      showNotification('info', `ลบรายการอนุมัติ ${targetRecord.province} เรียบร้อยแล้ว`);
      setDeleteConfirmation({ isOpen: false, record: null, isLoading: false });
    } catch (err: any) {
      console.error('Delete failed:', err);
      showNotification('error', `ไม่สามารถลบข้อมูลจาก Google Sheets ได้: ${err?.message || 'ข้อผิดพลาด'}`);
      setDeleteConfirmation((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Sync Monthly Summary Tab directly to Google Sheet
  const handleSyncSummaryToSheet = async () => {
    if (!spreadsheetId) {
      setIsSheetModalOpen(true);
      return;
    }
    setIsSyncing(true);
    try {
      await syncMonthlySummaryToSheet(spreadsheetId, records);
      setLastSynced(new Date());
      showNotification('success', 'อัปเดตแผ่นงานสรุปรายเดือนบน Google Sheets เรียบร้อยแล้ว');
    } catch (err: any) {
      showNotification('error', `อัปเดตสรุปยอดไม่สำเร็จ: ${err?.message || 'ข้อผิดพลาด'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Sarabun',sans-serif]">
      {/* App Header */}
      <Header
        user={user}
        hasToken={hasToken}
        spreadsheetId={spreadsheetId}
        spreadsheetTitle={spreadsheetTitle}
        isSyncing={isSyncing}
        lastSynced={lastSynced}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        onRefresh={() => spreadsheetId && loadRecordsFromSheet(spreadsheetId)}
        onOpenSheetConfig={() => setIsSheetModalOpen(true)}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-sm font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : notification.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Welcome & Google Sheets Connect Notice Banner if not connected */}
        {(!user || !hasToken || !spreadsheetId) && (
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
            <div className="max-w-2xl relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                ระบบเชื่อมโยง Google Sheets & สรุปยอดอัตโนมัติ
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                ระบบสถิติอนุมัติสั่งจ่ายบำเหน็จบำนาญฯ ปีงบประมาณ 2570
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                สำนักงานคลังเขต 7 • บันทึกสถิติการอนุมัติสั่งจ่ายบำเหน็จบำนาญจำแนกตามเดือน ใน 8 จังหวัดเป้าหมาย
                พร้อมระบบสรุปยอดรายเดือนแบบอัตโนมัติ เชื่อมโยงเข้า Google Sheets ใน Google Drive ของคุณโดยตรง
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {!user || !hasToken ? (
                  <button
                    onClick={handleSignIn}
                    disabled={isSigningIn}
                    className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50"
                  >
                    <svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="w-4 h-4"
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
                    {isSigningIn ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google เพื่อซิงค์กับ Google Sheet'}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsSheetModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    เชื่อมต่อหรือสร้าง Google Sheet ใหม่
                  </button>
                )}

                <button
                  onClick={() => {
                    setEditingRecord(null);
                    setIsFormOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-700/80 hover:bg-indigo-600 text-white font-medium text-xs sm:text-sm rounded-xl border border-indigo-400/30 transition"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มรายการอนุมัติ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              สรุปยอดรายเดือนแบบอัตโนมัติ
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              รายการอนุมัติทั้งหมด ({records.length})
            </button>

            <button
              onClick={() => setActiveTab('provinces')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-2 ${
                activeTab === 'provinces'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" />
              สถิติจำแนก 8 จังหวัด
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsFormOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              บันทึกรายการอนุมัติใหม่
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'summary' && (
          <MonthlySummaryView
            records={records}
            isSyncingSheet={isSyncing}
            spreadsheetId={spreadsheetId}
            onSyncSummaryToSheet={handleSyncSummaryToSheet}
          />
        )}

        {activeTab === 'table' && (
          <RecordsTableView
            records={records}
            onAddNew={() => {
              setEditingRecord(null);
              setIsFormOpen(true);
            }}
            onEdit={(record) => {
              setEditingRecord(record);
              setIsFormOpen(true);
            }}
            onDelete={promptDeleteRecord}
            onLoadSampleData={() => {
              setRecords(INITIAL_SAMPLE_RECORDS);
              showNotification('success', 'โหลดข้อมูลตัวอย่าง 8 จังหวัดเรียบร้อย');
            }}
          />
        )}

        {activeTab === 'provinces' && <ProvinceAnalyticsView records={records} />}
      </main>

      {/* Record Form Modal (Add/Edit) */}
      <RecordFormModal
        isOpen={isFormOpen}
        initialData={editingRecord}
        defaultRecorderName={user?.displayName || 'เจ้าหน้าที่งานสถิติ'}
        isSaving={isSavingRecord}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
      />

      {/* Google Sheets Setup Modal */}
      <SheetSetupModal
        isOpen={isSheetModalOpen}
        currentSpreadsheetId={spreadsheetId}
        currentTitle={spreadsheetTitle}
        isCreating={isCreatingSheet}
        onClose={() => setIsSheetModalOpen(false)}
        onCreateNewSheet={handleCreateNewSheet}
        onConnectExistingSheet={handleConnectExistingSheet}
      />

      {/* Destructive Deletion Confirmation Modal (Workspace Guidelines) */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="ยืนยันการลบรายการอนุมัติบำนาญ"
        message="คุณต้องการลบข้อมูลรายการนี้ใช่หรือไม่? การดำเนินการนี้จะลบแถวข้อมูลออกจากตารางและอัปเดต Google Sheet ด้วย"
        confirmLabel="ยืนยันการลบ"
        cancelLabel="ยกเลิก"
        isDestructive={true}
        isLoading={deleteConfirmation.isLoading}
        details={
          deleteConfirmation.record
            ? [
                { label: 'รหัสรายการ', value: deleteConfirmation.record.id },
                { label: 'เดือนที่อนุมัติ', value: deleteConfirmation.record.fiscalMonth },
                { label: 'จังหวัด', value: deleteConfirmation.record.province },
                {
                  label: 'จำนวนรายที่อนุมัติ',
                  value: `${deleteConfirmation.record.approvedCases.toLocaleString()} ราย`,
                },
              ]
            : []
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, record: null, isLoading: false })}
      />
    </div>
  );
}
