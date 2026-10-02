import { getAccessToken } from './auth';
import { PensionRecord, MonthlySummaryItem, ThaiMonthFY2570, AllowedProvince } from '../types/pension';
import { FISCAL_YEAR_MONTHS, ALLOWED_8_PROVINCES } from '../data/thaiProvinces';

const SHEET_NAME_RECORDS = 'ข้อมูลการอนุมัติ';
const SHEET_NAME_SUMMARY = 'สรุปยอดรายเดือน_2570';

export interface SpreadsheetDetails {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  recordsSheetId?: number;
  summarySheetId?: number;
}

export const calculateMonthlySummary = (records: PensionRecord[]): MonthlySummaryItem[] => {
  const totalCasesAll = records.reduce((sum, r) => sum + (Number(r.approvedCases) || 0), 0);

  return FISCAL_YEAR_MONTHS.map((m) => {
    const monthRecords = records.filter((r) => r.fiscalMonth === m.name);
    const monthCases = monthRecords.reduce((sum, r) => sum + (Number(r.approvedCases) || 0), 0);
    const pctCases = totalCasesAll > 0 ? (monthCases / totalCasesAll) * 100 : 0;

    return {
      monthOrder: m.order,
      fiscalMonth: m.name,
      quarter: m.quarter,
      recordCount: monthRecords.length,
      totalApprovedCases: monthCases,
      percentageOfTotalCases: Number(pctCases.toFixed(1)),
    };
  });
};

/**
 * Creates a brand new Google Spreadsheet configured specifically for FY2570 Pension Records
 */
export const createPensionSpreadsheet = async (
  title: string = 'สถิติการอนุมัติบำนาญ_ปีงบประมาณ_2570'
): Promise<SpreadsheetDetails> => {
  const token = await getAccessToken();
  if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง (Please sign in to Google)');

  const payload = {
    properties: {
      title,
      locale: 'th_TH',
      timeZone: 'Asia/Bangkok',
    },
    sheets: [
      {
        properties: {
          title: SHEET_NAME_RECORDS,
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 8,
          },
        },
      },
      {
        properties: {
          title: SHEET_NAME_SUMMARY,
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 7,
          },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to create spreadsheet:', errText);
    throw new Error(`ไม่สามารถสร้าง Google Sheet ได้: ${response.statusText}`);
  }

  const sheetData = await response.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl;
  const recordsSheetId = sheetData.sheets?.[0]?.properties?.sheetId || 0;
  const summarySheetId = sheetData.sheets?.[1]?.properties?.sheetId || 1;

  // Initialize Header Rows in both sheets
  await initializeSpreadsheetHeaders(spreadsheetId, recordsSheetId, summarySheetId, token);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
    recordsSheetId,
    summarySheetId,
  };
};

/**
 * Sets initial headers and styling on the new spreadsheet
 */
const initializeSpreadsheetHeaders = async (
  spreadsheetId: string,
  recordsSheetId: number,
  summarySheetId: number,
  token: string
) => {
  // 1. Write Records Header (Simplified: Code, Date, Month, Province, Approved Cases, Notes, Recorder)
  const recordsHeader = [
    [
      'รหัสรายการ',
      'วันที่บันทึก',
      'เดือนที่อนุมัติ (ปีงบ 2570)',
      'จังหวัด (8 จังหวัด)',
      'จำนวนที่อนุมัติ',
      'หมายเหตุ',
      'ผู้บันทึก',
    ],
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      SHEET_NAME_RECORDS
    )}!A1:G1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: recordsHeader }),
    }
  );

  // 2. Write Summary Header & Initial Monthly Template
  const summaryHeader = [
    [
      'ลำดับ',
      'เดือนงบประมาณ 2570',
      'ไตรมาส',
      'จำนวนรายการบันทึก',
      'จำนวนอนุมัติรวม (ราย)',
      'สัดส่วนจำนวนราย (%)',
    ],
  ];

  const emptyMonthlyRows = FISCAL_YEAR_MONTHS.map((m) => [
    m.order,
    m.name,
    m.quarter,
    0,
    0,
    '0.0%',
  ]);

  const summaryData = [...summaryHeader, ...emptyMonthlyRows];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      SHEET_NAME_SUMMARY
    )}!A1:F13?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: summaryData }),
    }
  );

  // 3. Apply styling
  try {
    const formatPayload = {
      requests: [
        // Format Records Header (Navy Blue)
        {
          repeatCell: {
            range: {
              sheetId: recordsSheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 7,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.12, green: 0.25, blue: 0.45 },
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  fontSize: 11,
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
        // Format Summary Header (Emerald Green)
        {
          repeatCell: {
            range: {
              sheetId: summarySheetId,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: 6,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.1, green: 0.35, blue: 0.25 },
                textFormat: {
                  bold: true,
                  foregroundColor: { red: 1, green: 1, blue: 1 },
                  fontSize: 11,
                },
                horizontalAlignment: 'CENTER',
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
          },
        },
      ],
    };

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formatPayload),
    });
  } catch (err) {
    console.warn('Formatting batch update optional step failed, continuing:', err);
  }
};

/**
 * Fetches all pension records from the designated sheet
 */
export const fetchPensionRecords = async (spreadsheetId: string): Promise<PensionRecord[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง (Please sign in to Google)');

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      SHEET_NAME_RECORDS
    )}!A2:G1000`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Fetch records failed:', errorText);
    throw new Error(`ไม่สามารถอ่านข้อมูลจาก Google Sheet ได้: ${response.statusText}`);
  }

  const data = await response.json();
  const rows: any[][] = data.values || [];

  return rows
    .map((row, index) => {
      if (!row || row.length === 0 || !row[0]) return null;
      const approvedCases = parseInt(row[4] || '0', 10) || 0;
      const province = (row[3] || 'ราชบุรี') as AllowedProvince;

      const record: PensionRecord = {
        id: String(row[0]),
        rowIndex: index + 2, // Row 1 is header, 1-indexed in Sheets
        recordedDate: row[1] || new Date().toISOString().split('T')[0],
        fiscalMonth: (row[2] || 'ตุลาคม 2569') as ThaiMonthFY2570,
        province,
        approvedCases,
        notes: row[5] || '',
        recordedBy: row[6] || '',
      };
      return record;
    })
    .filter((r): r is PensionRecord => r !== null);
};

/**
 * Appends a new pension record to Google Sheets
 */
export const appendPensionRecord = async (
  spreadsheetId: string,
  record: PensionRecord
): Promise<number> => {
  const token = await getAccessToken();
  if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง (Please sign in to Google)');

  const rowValues = [
    [
      record.id,
      record.recordedDate,
      record.fiscalMonth,
      record.province,
      record.approvedCases,
      record.notes || '',
      record.recordedBy || '',
    ],
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      SHEET_NAME_RECORDS
    )}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rowValues }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Append record failed:', errorText);
    throw new Error(`ไม่สามารถเพิ่มข้อมูลลง Google Sheet ได้: ${response.statusText}`);
  }

  const result = await response.json();
  const updatedRange = result.updates?.updatedRange || '';
  const match = updatedRange.match(/!A(\d+):/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Updates an existing pension record row in Google Sheets
 */
export const updatePensionRecordInSheet = async (
  spreadsheetId: string,
  rowIndex: number,
  record: PensionRecord
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง (Please sign in to Google)');

  const rowValues = [
    [
      record.id,
      record.recordedDate,
      record.fiscalMonth,
      record.province,
      record.approvedCases,
      record.notes || '',
      record.recordedBy || '',
    ],
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      SHEET_NAME_RECORDS
    )}!A${rowIndex}:G${rowIndex}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rowValues }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Update record failed:', errorText);
    throw new Error(`ไม่สามารถแก้ไขข้อมูลใน Google Sheet ได้: ${response.statusText}`);
  }
};

/**
 * Deletes a row from the records sheet
 */
export const deletePensionRecordFromSheet = async (
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง (Please sign in to Google)');

  const payload = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-indexed in batchUpdate
            endIndex: rowIndex,
          },
        },
      },
    ],
  };

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Delete row failed:', errorText);
    throw new Error(`ไม่สามารถลบแถวออกจาก Google Sheet ได้: ${response.statusText}`);
  }
};

/**
 * Automatically calculates and writes the fresh Monthly Summary into Tab 2 ('สรุปยอดรายเดือน_2570')
 */
export const syncMonthlySummaryToSheet = async (
  spreadsheetId: string,
  records: PensionRecord[]
): Promise<void> => {
  const token = await getAccessToken();
  if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง (Please sign in to Google)');

  const summaryList = calculateMonthlySummary(records);
  const totalRecordsAll = records.length;
  const totalCasesAll = summaryList.reduce((acc, curr) => acc + curr.totalApprovedCases, 0);

  const monthlyRows = summaryList.map((m) => [
    m.monthOrder,
    m.fiscalMonth,
    m.quarter,
    m.recordCount,
    m.totalApprovedCases,
    `${m.percentageOfTotalCases}%`,
  ]);

  // Append Total Row at row 14
  const totalRow = [
    'รวมทั้งปี',
    'ปีงบประมาณ 2570 ทั้งหมด',
    '-',
    totalRecordsAll,
    totalCasesAll,
    '100.0%',
  ];

  const fullData = [...monthlyRows, totalRow];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      SHEET_NAME_SUMMARY
    )}!A2:F14?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: fullData }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Sync monthly summary failed:', errorText);
    throw new Error(`ไม่สามารถอัปเดตแผ่นงานสรุปรายเดือนได้: ${response.statusText}`);
  }
};

/**
 * Verifies or retrieves sheet metadata
 */
export const getSpreadsheetMetadata = async (
  spreadsheetId: string
): Promise<{ title: string; recordsSheetId: number; summarySheetId: number }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('ไม่พบสิทธิ์การเข้าถึง (Please sign in to Google)');

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error('ไม่สามารถเข้าถึง Google Sheet นี้ได้ ตรวจสอบสิทธิ์การเข้าถึงหรือ Spreadsheet ID');
  }

  const data = await response.json();
  const sheets = data.sheets || [];

  const recordsSheet = sheets.find(
    (s: any) => s.properties?.title === SHEET_NAME_RECORDS || s.properties?.title?.includes('ข้อมูล')
  );
  const summarySheet = sheets.find(
    (s: any) => s.properties?.title === SHEET_NAME_SUMMARY || s.properties?.title?.includes('สรุป')
  );

  return {
    title: data.properties?.title || 'สถิติอนุมัติยอดบำนาญ',
    recordsSheetId: recordsSheet?.properties?.sheetId ?? 0,
    summarySheetId: summarySheet?.properties?.sheetId ?? 1,
  };
};
