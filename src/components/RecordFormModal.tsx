import React, { useState, useEffect } from 'react';
import { PensionRecord, ThaiMonthFY2570, AllowedProvince } from '../types/pension';
import { FISCAL_YEAR_MONTHS, ALLOWED_8_PROVINCES } from '../data/thaiProvinces';
import { X, Save, MapPin, Calendar, FileText, UserCircle, Users } from 'lucide-react';

interface RecordFormModalProps {
  isOpen: boolean;
  initialData?: PensionRecord | null;
  defaultRecorderName?: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (record: Omit<PensionRecord, 'id'> & { id?: string }) => Promise<void>;
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  isOpen,
  initialData,
  defaultRecorderName = '',
  isSaving,
  onClose,
  onSave,
}) => {
  const [fiscalMonth, setFiscalMonth] = useState<ThaiMonthFY2570>('ตุลาคม 2569');
  const [province, setProvince] = useState<AllowedProvince>('ราชบุรี');
  const [approvedCases, setApprovedCases] = useState<number | ''>(10);
  const [recordedDate, setRecordedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [recordedBy, setRecordedBy] = useState<string>(defaultRecorderName);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFiscalMonth(initialData.fiscalMonth);
      setProvince(
        ALLOWED_8_PROVINCES.includes(initialData.province as AllowedProvince)
          ? (initialData.province as AllowedProvince)
          : 'ราชบุรี'
      );
      setApprovedCases(initialData.approvedCases);
      setRecordedDate(initialData.recordedDate || new Date().toISOString().split('T')[0]);
      setRecordedBy(initialData.recordedBy || defaultRecorderName);
      setNotes(initialData.notes || '');
    } else {
      setFiscalMonth('ตุลาคม 2569');
      setProvince('ราชบุรี');
      setApprovedCases(15);
      setRecordedDate(new Date().toISOString().split('T')[0]);
      setRecordedBy(defaultRecorderName || 'เจ้าหน้าที่งานสถิติ');
      setNotes('');
    }
    setErrorMessage(null);
  }, [initialData, isOpen, defaultRecorderName]);

  const casesNum = typeof approvedCases === 'number' ? approvedCases : 0;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!casesNum || casesNum <= 0) {
      setErrorMessage('กรุณาระบุจำนวนรายที่อนุมัติมากกว่า 0 ราย');
      return;
    }

    try {
      await onSave({
        id: initialData?.id,
        rowIndex: initialData?.rowIndex,
        recordedDate,
        fiscalMonth,
        province,
        approvedCases: casesNum,
        notes: notes.trim(),
        recordedBy: recordedBy.trim() || 'เจ้าหน้าที่งานสถิติ',
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialData ? 'แก้ไขข้อมูลการอนุมัติสั่งจ่ายบำเหน็จบำนาญ' : 'บันทึกสถิติการอนุมัติสั่งจ่ายบำเหน็จบำนาญ'}
              </h3>
              <p className="text-xs text-slate-300">
                สำนักงานคลังเขต 7 • ปีงบประมาณ 2570 (8 จังหวัด)
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

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            {/* เดือนที่อนุมัติ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                เดือนที่อนุมัติ (ปีงบประมาณ 2570) <span className="text-rose-500">*</span>
              </label>
              <select
                value={fiscalMonth}
                onChange={(e) => setFiscalMonth(e.target.value as ThaiMonthFY2570)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium text-slate-800"
              >
                {FISCAL_YEAR_MONTHS.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name} ({m.quarter})
                  </option>
                ))}
              </select>
            </div>

            {/* จังหวัด (8 จังหวัดเท่านั้น) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                จังหวัดที่อนุมัติ (เลือกได้ 8 จังหวัด) <span className="text-rose-500">*</span>
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value as AllowedProvince)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-semibold text-slate-900"
              >
                {ALLOWED_8_PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* จำนวนรายที่อนุมัติ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                จำนวนรายที่อนุมัติ (ราย) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={approvedCases}
                onChange={(e) =>
                  setApprovedCases(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                }
                placeholder="ระบุจำนวนราย เช่น 25"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-bold text-slate-900"
              />
            </div>

            {/* วันที่บันทึกข้อมูล */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                วันที่ทำรายการ / วันที่อนุมัติ
              </label>
              <input
                type="date"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* ผู้บันทึก */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <UserCircle className="w-3.5 h-3.5 text-indigo-600" />
                ผู้บันทึกข้อมูล
              </label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="ชื่อ-สกุล หรือ งานการเงิน"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* หมายเหตุ */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น อนุมัติงวดที่ 1"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังบันทึกข้อมูล...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {initialData ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลลง Google Sheet'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
