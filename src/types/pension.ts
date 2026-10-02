export type ThaiMonthFY2570 =
  | 'ตุลาคม 2569'
  | 'พฤศจิกายน 2569'
  | 'ธันวาคม 2569'
  | 'มกราคม 2570'
  | 'กุมภาพันธ์ 2570'
  | 'มีนาคม 2570'
  | 'เมษายน 2570'
  | 'พฤษภาคม 2570'
  | 'มิถุนายน 2570'
  | 'กรกฎาคม 2570'
  | 'สิงหาคม 2570'
  | 'กันยายน 2570';

export type AllowedProvince =
  | 'ราชบุรี'
  | 'กาญจนบุรี'
  | 'นครปฐม'
  | 'เพชรบุรี'
  | 'สมุทรสาคร'
  | 'สมุทรสงคราม'
  | 'สุพรรณบุรี'
  | 'ประจวบคีรีขันธ์';

export interface PensionRecord {
  id: string;
  rowIndex?: number; // Row index in Google Sheets
  recordedDate: string; // e.g. "2026-10-15"
  fiscalMonth: ThaiMonthFY2570;
  province: AllowedProvince | string;
  approvedCases: number; // จำนวนรายที่อนุมัติ
  notes?: string;
  recordedBy: string;
}

export interface MonthlySummaryItem {
  monthOrder: number;
  fiscalMonth: ThaiMonthFY2570;
  quarter: 'ไตรมาส 1' | 'ไตรมาส 2' | 'ไตรมาส 3' | 'ไตรมาส 4';
  recordCount: number;
  totalApprovedCases: number;
  percentageOfTotalCases: number;
}

export interface ProvinceSummaryItem {
  province: string;
  recordCount: number;
  totalApprovedCases: number;
  percentageOfTotalCases: number;
}
