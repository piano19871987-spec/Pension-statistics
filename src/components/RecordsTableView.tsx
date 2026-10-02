import React, { useState, useMemo } from 'react';
import { PensionRecord } from '../types/pension';
import { FISCAL_YEAR_MONTHS, ALLOWED_8_PROVINCES } from '../data/thaiProvinces';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Download,
  Calendar,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';

interface RecordsTableViewProps {
  records: PensionRecord[];
  onAddNew: () => void;
  onEdit: (record: PensionRecord) => void;
  onDelete: (record: PensionRecord) => void;
  onLoadSampleData: () => void;
}

export const RecordsTableView: React.FC<RecordsTableViewProps> = ({
  records,
  onAddNew,
  onEdit,
  onDelete,
  onLoadSampleData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ทั้งหมด');
  const [selectedProvince, setSelectedProvince] = useState<string>('ทั้งหมด');

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Month
      if (selectedMonth !== 'ทั้งหมด' && r.fiscalMonth !== selectedMonth) return false;
      // Province (among the 8 provinces)
      if (selectedProvince !== 'ทั้งหมด' && r.province !== selectedProvince) return false;
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchProv = r.province?.toLowerCase().includes(query);
        const matchNotes = r.notes?.toLowerCase().includes(query);
        const matchRecorder = r.recordedBy?.toLowerCase().includes(query);
        const matchId = r.id?.toLowerCase().includes(query);
        if (!matchProv && !matchNotes && !matchRecorder && !matchId) return false;
      }
      return true;
    });
  }, [records, searchTerm, selectedMonth, selectedProvince]);

  const handleExportCSV = () => {
    const headers = [
      'รหัสรายการ,วันที่บันทึก,เดือนที่อนุมัติ,จังหวัด,จำนวนรายที่อนุมัติ (ราย),หมายเหตุ,ผู้บันทึก',
    ];
    const rows = filteredRecords.map(
      (r) =>
        `"${r.id}","${r.recordedDate}","${r.fiscalMonth}","${r.province}",${r.approvedCases},"${r.notes || ''}","${r.recordedBy || ''}"`
    );
    const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `รายการอนุมัติบำนาญ_8จังหวัด_ปีงบประมาณ_2570.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalFilteredCases = filteredRecords.reduce((sum, r) => sum + r.approvedCases, 0);

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Record Button */}
          <button
            onClick={onAddNew}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            บันทึกรายการอนุมัติใหม่
          </button>

          {/* Load Sample Data Button if empty or testing */}
          {records.length === 0 && (
            <button
              onClick={onLoadSampleData}
              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              โหลดข้อมูลตัวอย่างเริ่มต้น (8 จังหวัด)
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            ส่งออก CSV
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหา จังหวัด, หมายเหตุ, ผู้บันทึก..."
            className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800"
          />
        </div>
      </div>

      {/* Filter Chips Bar (Month & 8 Provinces) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Month Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            เดือนที่อนุมัติ (2570)
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
          >
            <option value="ทั้งหมด">ทั้งหมด (ทุกเดือน)</option>
            {FISCAL_YEAR_MONTHS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.quarter})
              </option>
            ))}
          </select>
        </div>

        {/* Province Filter (8 Provinces Only) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            จังหวัด (เฉพาะ 8 จังหวัดเป้าหมาย)
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
          >
            <option value="ทั้งหมด">ทั้งหมด (8 จังหวัด)</option>
            {ALLOWED_8_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary of current filtered data */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-600">
        <div>
          แสดง <strong>{filteredRecords.length}</strong> รายการ (จากทั้งหมด {records.length} รายการ)
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-lg">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          รวมจำนวนรายอนุมัติ:{' '}
          <span className="text-indigo-700">{totalFilteredCases.toLocaleString()} ราย</span>
        </div>
      </div>

      {/* Table Component */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">เดือนที่อนุมัติ</th>
                <th className="py-3 px-4">จังหวัด</th>
                <th className="py-3 px-4 text-right">จำนวนรายที่อนุมัติ (ราย)</th>
                <th className="py-3 px-4">วันที่บันทึก / ผู้บันทึก</th>
                <th className="py-3 px-4">หมายเหตุ</th>
                <th className="py-3 px-4 text-center w-24">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    className="hover:bg-indigo-50/20 transition group text-slate-800"
                  >
                    <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {r.fiscalMonth}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 text-sm">{r.province}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-900 text-base whitespace-nowrap">
                      {r.approvedCases.toLocaleString()} <span className="text-xs font-normal text-slate-500">ราย</span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{r.recordedDate}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[140px]">
                        {r.recordedBy}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {r.notes ? (
                        <span className="text-slate-700">{r.notes}</span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => onEdit(r)}
                          title="แก้ไขรายการนี้"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(r)}
                          title="ลบรายการนี้"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-3">
                      <p className="text-sm font-medium text-slate-700">
                        ไม่พบข้อมูลรายการอนุมัติบำนาญตามเงื่อนไขที่เลือก
                      </p>
                      <p className="text-xs text-slate-500">
                        คุณสามารถเพิ่มรายการใหม่สำหรับ 8 จังหวัดเป้าหมาย หรือปรับเปลี่ยนตัวกรอง
                      </p>
                      <div className="pt-2 flex justify-center gap-2">
                        <button
                          onClick={onAddNew}
                          className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
                        >
                          + บันทึกรายการใหม่
                        </button>
                        {records.length === 0 && (
                          <button
                            onClick={onLoadSampleData}
                            className="px-3.5 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition"
                          >
                            โหลดข้อมูลตัวอย่าง 8 จังหวัด
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
