import React from 'react';
import { PensionRecord } from '../types/pension';
import { ALLOWED_8_PROVINCES } from '../data/thaiProvinces';
import { Award, Building2, Users } from 'lucide-react';

interface ProvinceAnalyticsViewProps {
  records: PensionRecord[];
}

export const ProvinceAnalyticsView: React.FC<ProvinceAnalyticsViewProps> = ({ records }) => {
  const totalAllCases = records.reduce((s, r) => s + r.approvedCases, 0) || 1;

  // Build stats for each of the 8 provinces
  const provinceStats = ALLOWED_8_PROVINCES.map((prov) => {
    const provRecords = records.filter((r) => r.province === prov);
    const totalCases = provRecords.reduce((sum, r) => sum + r.approvedCases, 0);
    const pct = ((totalCases / totalAllCases) * 100).toFixed(1);
    return {
      province: prov,
      totalCases,
      recordCount: provRecords.length,
      percentage: totalCases > 0 ? Number(pct) : 0,
    };
  }).sort((a, b) => b.totalCases - a.totalCases);

  const maxCases = Math.max(...provinceStats.map((p) => p.totalCases), 1);

  return (
    <div className="space-y-6">
      {/* Top 8 Provinces Ranking Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              การจัดลำดับจำนวนรายอนุมัติบำนาญ (8 จังหวัดเป้าหมาย)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ราชบุรี, กาญจนบุรี, นครปฐม, เพชรบุรี, สมุทรสาคร, สมุทรสงคราม, สุพรรณบุรี, ประจวบคีรีขันธ์
            </p>
          </div>
          <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 self-start">
            <Users className="w-4 h-4" />
            รวม 8 จังหวัด: {totalAllCases.toLocaleString()} ราย
          </div>
        </div>

        {/* 8 Province Bars */}
        <div className="space-y-4">
          {provinceStats.map((p, index) => {
            const percentOfMax = (p.totalCases / maxCases) * 100;
            const hasData = p.totalCases > 0;

            return (
              <div
                key={p.province}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-indigo-300 transition"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        index === 0
                          ? 'bg-amber-400 text-slate-900 shadow-xs'
                          : index === 1
                          ? 'bg-slate-300 text-slate-900'
                          : index === 2
                          ? 'bg-amber-600/30 text-amber-900'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-sm sm:text-base">
                      {p.province}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({p.recordCount} รายการบันทึก)
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-indigo-900 text-sm sm:text-base">
                      {p.totalCases.toLocaleString()} ราย
                    </span>
                    <span className="text-slate-500 ml-1.5 text-xs">
                      ({p.percentage}%)
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentOfMax, hasData ? 3 : 0)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of the 8 provinces individual cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {provinceStats.map((p) => (
          <div
            key={p.province}
            className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">จังหวัด</span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2">
              <div className="text-base font-bold text-slate-900">{p.province}</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-indigo-900">
                  {p.totalCases.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">ราย</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                <span>บันทึก {p.recordCount} ครั้ง</span>
                <span className="font-semibold text-indigo-600">{p.percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
