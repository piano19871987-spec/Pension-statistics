import { ThaiMonthFY2570, AllowedProvince, PensionRecord } from '../types/pension';

export const FISCAL_YEAR_MONTHS: {
  name: ThaiMonthFY2570;
  order: number;
  quarter: 'ไตรมาส 1' | 'ไตรมาส 2' | 'ไตรมาส 3' | 'ไตรมาส 4';
}[] = [
  { name: 'ตุลาคม 2569', order: 1, quarter: 'ไตรมาส 1' },
  { name: 'พฤศจิกายน 2569', order: 2, quarter: 'ไตรมาส 1' },
  { name: 'ธันวาคม 2569', order: 3, quarter: 'ไตรมาส 1' },
  { name: 'มกราคม 2570', order: 4, quarter: 'ไตรมาส 2' },
  { name: 'กุมภาพันธ์ 2570', order: 5, quarter: 'ไตรมาส 2' },
  { name: 'มีนาคม 2570', order: 6, quarter: 'ไตรมาส 2' },
  { name: 'เมษายน 2570', order: 7, quarter: 'ไตรมาส 3' },
  { name: 'พฤษภาคม 2570', order: 8, quarter: 'ไตรมาส 3' },
  { name: 'มิถุนายน 2570', order: 9, quarter: 'ไตรมาส 3' },
  { name: 'กรกฎาคม 2570', order: 10, quarter: 'ไตรมาส 4' },
  { name: 'สิงหาคม 2570', order: 11, quarter: 'ไตรมาส 4' },
  { name: 'กันยายน 2570', order: 12, quarter: 'ไตรมาส 4' },
];

export const ALLOWED_8_PROVINCES: AllowedProvince[] = [
  'ราชบุรี',
  'กาญจนบุรี',
  'นครปฐม',
  'เพชรบุรี',
  'สมุทรสาคร',
  'สมุทรสงคราม',
  'สุพรรณบุรี',
  'ประจวบคีรีขันธ์',
];

export const INITIAL_SAMPLE_RECORDS: PensionRecord[] = [
  {
    id: 'PEN-2570-001',
    recordedDate: '2026-10-14',
    fiscalMonth: 'ตุลาคม 2569',
    province: 'ราชบุรี',
    approvedCases: 48,
    notes: 'อนุมัติงวดที่ 1 ต้นปีงบประมาณ',
    recordedBy: 'น.ส. กัญจนา (งานบำนาญ)',
  },
  {
    id: 'PEN-2570-002',
    recordedDate: '2026-10-20',
    fiscalMonth: 'ตุลาคม 2569',
    province: 'นครปฐม',
    approvedCases: 62,
    notes: 'กลุ่มเกษียณอายุราชการ',
    recordedBy: 'นายสมเกียรติ',
  },
  {
    id: 'PEN-2570-003',
    recordedDate: '2026-10-28',
    fiscalMonth: 'ตุลาคม 2569',
    province: 'กาญจนบุรี',
    approvedCases: 35,
    notes: 'ชุดที่ 1',
    recordedBy: 'เจ้าหน้าที่งานสถิติ',
  },
  {
    id: 'PEN-2570-004',
    recordedDate: '2026-11-12',
    fiscalMonth: 'พฤศจิกายน 2569',
    province: 'สุพรรณบุรี',
    approvedCases: 41,
    notes: 'อนุมัติรอบเดือน พ.ย.',
    recordedBy: 'น.ส. กัญจนา',
  },
  {
    id: 'PEN-2570-005',
    recordedDate: '2026-11-25',
    fiscalMonth: 'พฤศจิกายน 2569',
    province: 'เพชรบุรี',
    approvedCases: 29,
    notes: 'อนุมัติรอบปกติ',
    recordedBy: 'นายสมเกียรติ',
  },
  {
    id: 'PEN-2570-006',
    recordedDate: '2026-12-15',
    fiscalMonth: 'ธันวาคม 2569',
    province: 'สมุทรสาคร',
    approvedCases: 38,
    notes: 'ส่งข้อมูลปิดงวดสิ้นปี',
    recordedBy: 'เจ้าหน้าที่งานสถิติ',
  },
  {
    id: 'PEN-2570-007',
    recordedDate: '2027-01-18',
    fiscalMonth: 'มกราคม 2570',
    province: 'สมุทรสงคราม',
    approvedCases: 19,
    notes: 'อนุมัติรอบไตรมาส 2',
    recordedBy: 'น.ส. กัญจนา',
  },
  {
    id: 'PEN-2570-008',
    recordedDate: '2027-01-25',
    fiscalMonth: 'มกราคม 2570',
    province: 'ประจวบคีรีขันธ์',
    approvedCases: 33,
    notes: 'อนุมัติรอบ ม.ค. 2570',
    recordedBy: 'นายสมเกียรติ',
  },
];
