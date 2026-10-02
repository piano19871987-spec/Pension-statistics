import React, { useState, useMemo } from 'react';
import { PensionRecord, MonthlySummaryItem, ThaiMonthFY2570, AllowedProvince } from '../types/pension';
import { calculateMonthlySummary } from '../services/googleSheets';
import { FISCAL_YEAR_MONTHS, ALLOWED_8_PROVINCES } from '../data/thaiProvinces';
import {
  TrendingUp,
  Users,
  Building2,
  CalendarCheck2,
  RefreshCw,
  CheckCircle,
  FileSpreadsheet,
  Download,
  CalendarDays,
  Percent,
  ArrowRightLeft,
  PieChart,
  TableProperties,
} from 'lucide-react';

interface MonthlySummaryViewProps {
  records: PensionRecord[];
  isSyncingSheet: boolean;
  spreadsheetId: string | null;
  onSyncSummaryToSheet: () => Promise<void>;
}

export const MonthlySummaryView: React.FC<MonthlySummaryViewProps> = ({
  records,
  isSyncingSheet,
  spreadsheetId,
  onSyncSummaryToSheet,
}) => {
  const [selectedQuarter, setSelectedQuarter] = useState<string>('ทั้งหมด');
  const [syncSuccessMsg, setSyncSuccessMsg] = useState(false);

  // Province comparison states
  const [comparisonMonth, setComparisonMonth] = useState<string>('all');
  const [comparisonViewMode, setComparisonViewMode] = useState<'ranking' | 'headToHead' | 'matrix'>('ranking');
  const [compareProvA, setCompareProvA] = useState<AllowedProvince>('ราชบุรี');
  const [compareProvB, setCompareProvB] = useState<AllowedProvince>('นครปฐม');

  const monthlySummaries: MonthlySummaryItem[] = calculateMonthlySummary(records);

  // Overall totals
  const totalRecordsAll = records.length;
  const totalApprovedCases = monthlySummaries.reduce((sum, m) => sum + m.totalApprovedCases, 0);
  const uniqueProvincesCount = new Set(records.map((r) => r.province)).size;

  // Month with highest cases
  const topMonth = monthlySummaries.reduce(
    (max, m) => (m.totalApprovedCases > max.totalApprovedCases ? m : max),
    monthlySummaries[0] || { fiscalMonth: '-', totalApprovedCases: 0 }
  );

  // Filtered summaries for table if quarter selected
  const displayedSummaries =
    selectedQuarter === 'ทั้งหมด'
      ? monthlySummaries
      : monthlySummaries.filter((m) => m.quarter === selectedQuarter);

  // Maximum month cases for relative bar widths
  const maxMonthCases = Math.max(...monthlySummaries.map((m) => m.totalApprovedCases), 1);

  // Province comparison calculations based on selected comparison month
  const { periodRecords, periodTotalCases, provinceStats, maxProvCases } = useMemo(() => {
    const filtered =
      comparisonMonth === 'all'
        ? records
        : records.filter((r) => r.fiscalMonth === comparisonMonth);

    const total = filtered.reduce((sum, r) => sum + r.approvedCases, 0);

    const stats = ALLOWED_8_PROVINCES.map((prov) => {
      const provRecords = filtered.filter((r) => r.province === prov);
      const cases = provRecords.reduce((sum, r) => sum + r.approvedCases, 0);
      const percentage = total > 0 ? Number(((cases / total) * 100).toFixed(1)) : 0;
      return {
        province: prov,
        cases,
        recordCount: provRecords.length,
        percentage,
      };
    }).sort((a, b) => b.cases - a.cases);

    const maxCases = Math.max(...stats.map((s) => s.cases), 1);

    return {
      periodRecords: filtered,
      periodTotalCases: total,
      provinceStats: stats,
      maxProvCases: maxCases,
    };
  }, [records, comparisonMonth]);

  // Head-to-Head data
  const dataA = provinceStats.find((p) => p.province === compareProvA) || {
    province: compareProvA,
    cases: 0,
    percentage: 0,
  };
  const dataB = provinceStats.find((p) => p.province === compareProvB) || {
    province: compareProvB,
    cases: 0,
    percentage: 0,
  };
  const diffCases = dataA.cases - dataB.cases;
  const diffPct = Number((dataA.percentage - dataB.percentage).toFixed(1));

  // 8 Provinces x 12 Months Matrix calculation
  const matrixData = useMemo(() => {
    const annualTotal = records.reduce((s, r) => s + r.approvedCases, 0) || 1;

    return ALLOWED_8_PROVINCES.map((prov) => {
      const provRecords = records.filter((r) => r.province === prov);
      const totalProvCases = provRecords.reduce((s, r) => s + r.approvedCases, 0);
      const provPctOfAnnual = Number(((totalProvCases / annualTotal) * 100).toFixed(1));

      const monthCounts = FISCAL_YEAR_MONTHS.map((m) => {
        const mRecords = provRecords.filter((r) => r.fiscalMonth === m.name);
        return mRecords.reduce((s, r) => s + r.approvedCases, 0);
      });

      return {
        province: prov,
        monthCounts,
        totalProvCases,
        provPctOfAnnual,
      };
    }).sort((a, b) => b.totalProvCases - a.totalProvCases);
  }, [records]);

  const handleSyncToSheet = async () => {
    try {
      await onSyncSummaryToSheet();
      setSyncSuccessMsg(true);
      setTimeout(() => setSyncSuccessMsg(false), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ลำดับ,เดือนงบประมาณ 2570,ไตรมาส,จำนวนรายการบันทึก,จำนวนอนุมัติรวม (ราย),สัดส่วนร้อยละ (%)',
    ];
    const rows = monthlySummaries.map(
      (m) =>
        `${m.monthOrder},"${m.fiscalMonth}","${m.quarter}",${m.recordCount},${m.totalApprovedCases},${m.percentageOfTotalCases}%`
    );
    const totalRow = `รวมทั้งปี,"ปีงบประมาณ 2570","-",${totalRecordsAll},${totalApprovedCases},100.0%`;

    const csvContent = '\uFEFF' + [headers, ...rows, totalRow].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `สรุปยอดอนุมัติบำนาญรายเดือน_ปีงบประมาณ_2570.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cases */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              จำนวนอนุมัติรวมทั้งปี
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-indigo-900 tracking-tight">
              {totalApprovedCases.toLocaleString('th-TH')}
            </span>
            <span className="text-xs font-semibold text-indigo-600">ราย</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            จากทั้งหมด {totalRecordsAll.toLocaleString()} รายการบันทึก
          </p>
        </div>

        {/* Active 8 Provinces */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              จังหวัดที่ส่งข้อมูลแล้ว
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-900 tracking-tight">
              {uniqueProvincesCount}
            </span>
            <span className="text-xs font-medium text-slate-500">/ 8 จังหวัด</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            ครอบคลุม {((uniqueProvincesCount / 8) * 100).toFixed(0)}% ของ 8 จังหวัดเป้าหมาย
          </p>
        </div>

        {/* Peak Month */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              เดือนที่อนุมัติสูงสุด
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate block">
              {topMonth.totalApprovedCases > 0 ? topMonth.fiscalMonth : '-'}
            </span>
            <p className="text-xs font-semibold text-amber-700 mt-0.5">
              {topMonth.totalApprovedCases > 0
                ? `${topMonth.totalApprovedCases.toLocaleString()} ราย (${topMonth.percentageOfTotalCases}%)`
                : 'ยังไม่มีข้อมูล'}
            </p>
          </div>
        </div>

        {/* Fiscal Year Coverage */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              รอบปีงบประมาณ
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-800 tracking-tight">
              ปี 2570
            </span>
            <span className="text-xs font-medium text-slate-500">12 เดือน</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            ต.ค. 2569 – ก.ย. 2570 (8 จังหวัด)
          </p>
        </div>
      </div>

      {/* NEW: Feature เปรียบเทียบยอดอนุมัติบำนาญระหว่างจังหวัด โดยแสดงเป็นเปอร์เซ็นต์ */}
      <div className="bg-white rounded-3xl p-6 border border-indigo-100 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-semibold mb-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-600" />
              ฟีเจอร์เปรียบเทียบระหว่างจังหวัด (แสดงเป็น %)
            </div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              เปรียบเทียบยอดอนุมัติบำนาญระหว่าง 8 จังหวัด
            </h3>
            <p className="text-xs text-slate-500">
              วิเคราะห์สัดส่วนร้อยละ (%) และเปรียบเทียบจำนวนรายที่อนุมัติจำแนกตามจังหวัด
            </p>
          </div>

          {/* Month Filter Selector for Comparison */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
              <span className="font-semibold text-slate-600">เลือกช่วงเวลา:</span>
              <select
                value={comparisonMonth}
                onChange={(e) => setComparisonMonth(e.target.value)}
                className="bg-transparent font-bold text-indigo-900 focus:outline-none cursor-pointer"
              >
                <option value="all">ทั้งปีงบประมาณ 2570 (ยอดสะสม)</option>
                {FISCAL_YEAR_MONTHS.map((m) => (
                  <option key={m.name} value={m.name}>
                    เดือน {m.name} ({m.quarter})
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-view switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setComparisonViewMode('ranking')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  comparisonViewMode === 'ranking'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                สัดส่วน % ทุกจังหวัด
              </button>
              <button
                onClick={() => setComparisonViewMode('headToHead')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  comparisonViewMode === 'headToHead'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                ประกบคู่ (A vs B)
              </button>
              <button
                onClick={() => setComparisonViewMode('matrix')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  comparisonViewMode === 'matrix'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                ตารางเปรียบเทียบ 12 เดือน
              </button>
            </div>
          </div>
        </div>

        {/* View Mode 1: Ranking & Percentages Breakdown */}
        {comparisonViewMode === 'ranking' && (
          <div className="pt-6 space-y-6">
            {/* Visual Multi-Segment Proportional Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>
                  แถบแสดงสัดส่วนเปอร์เซ็นต์สะสม{' '}
                  {comparisonMonth === 'all' ? '(ทั้งปี 2570)' : `(เดือน ${comparisonMonth})`}
                </span>
                <span className="text-indigo-700">
                  รวม {periodTotalCases.toLocaleString()} ราย (100.0%)
                </span>
              </div>
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {provinceStats.map((p, idx) => {
                  const colors = [
                    'bg-indigo-600',
                    'bg-blue-500',
                    'bg-cyan-500',
                    'bg-emerald-500',
                    'bg-amber-500',
                    'bg-orange-500',
                    'bg-purple-500',
                    'bg-pink-500',
                  ];
                  if (p.percentage <= 0) return null;
                  return (
                    <div
                      key={p.province}
                      style={{ width: `${p.percentage}%` }}
                      className={`${colors[idx % colors.length]} h-full transition-all duration-500 relative group`}
                      title={`${p.province}: ${p.cases} ราย (${p.percentage}%)`}
                    />
                  );
                })}
              </div>
              {/* Legend chips */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {provinceStats.map((p, idx) => {
                  const dotColors = [
                    'bg-indigo-600',
                    'bg-blue-500',
                    'bg-cyan-500',
                    'bg-emerald-500',
                    'bg-amber-500',
                    'bg-orange-500',
                    'bg-purple-500',
                    'bg-pink-500',
                  ];
                  return (
                    <span
                      key={p.province}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-slate-700 font-medium"
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${dotColors[idx % dotColors.length]}`} />
                      {p.province}: <strong className="text-slate-900">{p.percentage}%</strong>
                      <span className="text-slate-500 text-[10px]">({p.cases} ราย)</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 8 Provinces Detailed Percentage Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {provinceStats.map((p, idx) => {
                const percentOfLeader = (p.cases / maxProvCases) * 100;
                return (
                  <div
                    key={p.province}
                    className="p-4 bg-slate-50/80 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:bg-white transition"
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            idx === 0
                              ? 'bg-amber-400 text-slate-900 shadow-xs'
                              : idx === 1
                              ? 'bg-slate-300 text-slate-900'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-900'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {p.province}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-extrabold text-indigo-900">
                          {p.percentage}%
                        </span>
                        <span className="text-xs text-slate-500 ml-1.5">
                          ({p.cases.toLocaleString()} ราย)
                        </span>
                      </div>
                    </div>

                    {/* Relative Bar */}
                    <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentOfLeader, p.cases > 0 ? 3 : 0)}%` }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                      <span>บันทึก {p.recordCount} ครั้ง</span>
                      <span>
                        {idx === 0
                          ? 'สูงสุดในกลุ่ม 8 จังหวัด'
                          : `ตามหลังอันดับ 1 ${((provinceStats[0]?.percentage || 0) - p.percentage).toFixed(1)}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View Mode 2: Head-to-Head Comparison (A vs B) */}
        {comparisonViewMode === 'headToHead' && (
          <div className="pt-6 space-y-6">
            <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Province A */}
                <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800">
                      จังหวัดที่ 1 (A)
                    </span>
                    <select
                      value={compareProvA}
                      onChange={(e) => setCompareProvA(e.target.value as AllowedProvince)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {ALLOWED_8_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2">
                    <div className="text-2xl font-bold text-slate-900">{dataA.province}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-indigo-900">
                        {dataA.percentage}%
                      </span>
                      <span className="text-xs text-slate-500">ของยอดอนุมัติรวม</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      จำนวนที่อนุมัติ: {dataA.cases.toLocaleString()} ราย
                    </p>
                  </div>
                </div>

                {/* Province B */}
                <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800">
                      จังหวัดที่ 2 (B)
                    </span>
                    <select
                      value={compareProvB}
                      onChange={(e) => setCompareProvB(e.target.value as AllowedProvince)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {ALLOWED_8_PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2">
                    <div className="text-2xl font-bold text-slate-900">{dataB.province}</div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-blue-900">
                        {dataB.percentage}%
                      </span>
                      <span className="text-xs text-slate-500">ของยอดอนุมัติรวม</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      จำนวนที่อนุมัติ: {dataB.cases.toLocaleString()} ราย
                    </p>
                  </div>
                </div>
              </div>

              {/* Comparison Result Banner */}
              <div className="mt-5 p-4 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-medium text-slate-700">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span>
                    ผลการเปรียบเทียบระหว่าง <strong>{dataA.province}</strong> และ{' '}
                    <strong>{dataB.province}</strong>:
                  </span>
                </div>
                <div className="font-bold">
                  {diffCases > 0 ? (
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      {dataA.province} มีสัดส่วนมากกว่า {Math.abs(diffPct)}% (+{diffCases.toLocaleString()} ราย)
                    </span>
                  ) : diffCases < 0 ? (
                    <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                      {dataB.province} มีสัดส่วนมากกว่า {Math.abs(diffPct)}% (+{Math.abs(diffCases).toLocaleString()} ราย)
                    </span>
                  ) : (
                    <span className="text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                      ทั้งสองจังหวัดมีสัดส่วนและยอดอนุมัติเท่ากัน (สัดส่วน {dataA.percentage}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: 8 Provinces x 12 Months Matrix Table */}
        {comparisonViewMode === 'matrix' && (
          <div className="pt-6">
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-3 px-3.5 sticky left-0 bg-slate-100 z-10 w-28">จังหวัด</th>
                    {FISCAL_YEAR_MONTHS.map((m) => (
                      <th key={m.name} className="py-3 px-2 text-center whitespace-nowrap">
                        {m.name.split(' ')[0]}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right bg-indigo-50/70 text-indigo-950 font-bold whitespace-nowrap">
                      รวมทั้งปี (ราย)
                    </th>
                    <th className="py-3 px-3 text-right bg-indigo-100/70 text-indigo-900 font-bold whitespace-nowrap">
                      สัดส่วน (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matrixData.map((row, idx) => (
                    <tr key={row.province} className="hover:bg-indigo-50/20 transition">
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100">
                        <span className="text-slate-400 font-normal mr-1.5">{idx + 1}.</span>
                        {row.province}
                      </td>
                      {row.monthCounts.map((count, mIdx) => (
                        <td
                          key={mIdx}
                          className={`py-2.5 px-2 text-center whitespace-nowrap ${
                            count > 0 ? 'font-semibold text-slate-800' : 'text-slate-300'
                          }`}
                        >
                          {count > 0 ? count.toLocaleString() : '-'}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-extrabold text-indigo-950 bg-indigo-50/40 whitespace-nowrap">
                        {row.totalProvCases.toLocaleString()} ราย
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-indigo-700 bg-indigo-100/30 whitespace-nowrap">
                        {row.provPctOfAnnual}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="py-3 px-3.5 sticky left-0 bg-slate-900 z-10">
                      รวมทุกจังหวัด
                    </td>
                    {FISCAL_YEAR_MONTHS.map((m) => {
                      const monthTotal = records
                        .filter((r) => r.fiscalMonth === m.name)
                        .reduce((s, r) => s + r.approvedCases, 0);
                      return (
                        <td key={m.name} className="py-3 px-2 text-center text-amber-300 whitespace-nowrap">
                          {monthTotal > 0 ? monthTotal.toLocaleString() : '-'}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right text-amber-300 whitespace-nowrap">
                      {totalApprovedCases.toLocaleString()} ราย
                    </td>
                    <td className="py-3 px-3 text-right text-indigo-300 whitespace-nowrap">
                      100.0%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Visual Fiscal Year Monthly Progression Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
              แผนภูมิสถิติจำนวนรายที่อนุมัติบำนาญ 12 เดือน (ปีงบประมาณ 2570)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุปจำนวนรายอนุมัติเปรียบเทียบในแต่ละเดือนของ 8 จังหวัดเป้าหมาย
            </p>
          </div>

          <div className="flex items-center gap-2">
            {spreadsheetId && (
              <button
                onClick={handleSyncToSheet}
                disabled={isSyncingSheet}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                title="ซิงค์ตารางสรุปรายเดือนไปยังชีตที่ 2 บน Google Sheets"
              >
                {isSyncingSheet ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                อัปเดตสรุปยอดลง Google Sheet
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {syncSuccessMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              อัปเดตข้อมูลสรุปยอดรายเดือนไปยังแผ่นงาน <strong>'สรุปยอดรายเดือน_2570'</strong> บน Google Sheets เรียบร้อยแล้ว!
            </span>
          </div>
        )}

        {/* 12 Months Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {monthlySummaries.map((m) => {
            const hasData = m.totalApprovedCases > 0;
            const barWidthPercent = (m.totalApprovedCases / maxMonthCases) * 100;

            return (
              <div
                key={m.fiscalMonth}
                className={`p-3.5 rounded-xl border transition ${
                  hasData
                    ? 'bg-slate-50/80 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20'
                    : 'bg-slate-50/30 border-dashed border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                      {m.monthOrder}
                    </span>
                    <span>{m.fiscalMonth}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 bg-slate-200/70 text-slate-700 rounded-md font-medium">
                    {m.quarter}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-lg font-bold text-slate-900">
                    {m.totalApprovedCases > 0 ? `${m.totalApprovedCases.toLocaleString()} ราย` : '-'}
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold">
                    {m.percentageOfTotalCases > 0 ? `${m.percentageOfTotalCases}%` : ''}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(barWidthPercent, hasData ? 3 : 0)}%` }}
                  />
                </div>

                <div className="mt-1.5 flex justify-between items-center text-[10px] text-slate-500">
                  <span>บันทึก {m.recordCount} รายการ</span>
                  <span>สัดส่วนของทั้งปี: {m.percentageOfTotalCases}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Complete Monthly Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ตารางสรุปสถิติจำนวนรายที่อนุมัติรายเดือน (อัตโนมัติ)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              สรุปจำนวนรายการและจำนวนรายที่ได้รับอนุมัติในแต่ละเดือน (8 จังหวัด)
            </p>
          </div>

          {/* Quarter filter buttons */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
            {['ทั้งหมด', 'ไตรมาส 1', 'ไตรมาส 2', 'ไตรมาส 3', 'ไตรมาส 4'].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedQuarter === q
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                <th className="py-3 px-4 text-center w-12">ลำดับ</th>
                <th className="py-3 px-4">เดือนงบประมาณ 2570</th>
                <th className="py-3 px-4 text-center">ไตรมาส</th>
                <th className="py-3 px-4 text-right">จำนวนรายการบันทึก</th>
                <th className="py-3 px-4 text-right">จำนวนอนุมัติรวม (ราย)</th>
                <th className="py-3 px-4 text-right">สัดส่วนจำนวนราย (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSummaries.map((m) => {
                const hasData = m.totalApprovedCases > 0;
                return (
                  <tr
                    key={m.fiscalMonth}
                    className={`hover:bg-indigo-50/30 transition ${
                      !hasData ? 'text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-medium text-slate-500">
                      {m.monthOrder}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      {m.fiscalMonth}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                        {m.quarter}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {m.recordCount > 0 ? m.recordCount.toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {m.totalApprovedCases > 0 ? `${m.totalApprovedCases.toLocaleString()} ราย` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-indigo-700">
                      {m.percentageOfTotalCases > 0 ? `${m.percentageOfTotalCases}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Total Row */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs sm:text-sm">
                <td colSpan={3} className="py-3.5 px-4 text-center uppercase tracking-wide">
                  ยอดรวมทั้งปีงบประมาณ 2570
                </td>
                <td className="py-3.5 px-4 text-right">
                  {totalRecordsAll.toLocaleString()}
                </td>
                <td className="py-3.5 px-4 text-right text-amber-300">
                  {totalApprovedCases.toLocaleString()} ราย
                </td>
                <td className="py-3.5 px-4 text-right text-indigo-300">
                  100.0%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
