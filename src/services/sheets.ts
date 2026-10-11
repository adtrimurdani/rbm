import { Transaction, SpreadsheetInfo } from '../types';

const SPREADSHEET_NAME = 'Kas Rumah Belajar Mumu - Pembukuan Harian';
const STORAGE_KEY_SPREADSHEET_ID = 'rbm_active_spreadsheet_id';

export interface SheetMetadata {
  id: string;
  title: string;
  url: string;
  firstSheetName: string;
  firstSheetId: number;
}

/**
 * Find existing Rumah Belajar Mumu bookkeeping spreadsheet or create a new one.
 */
export async function getOrCreateSpreadsheet(accessToken: string): Promise<SheetMetadata> {
  const savedId = localStorage.getItem(STORAGE_KEY_SPREADSHEET_ID) || localStorage.getItem('sandwich_active_spreadsheet_id');
  
  if (savedId) {
    try {
      const meta = await getSpreadsheetMetadata(savedId, accessToken);
      return meta;
    } catch (err) {
      console.warn('Saved spreadsheet ID invalid or inaccessible, will search Drive...', err);
      localStorage.removeItem(STORAGE_KEY_SPREADSHEET_ID);
    }
  }

  // Search in Google Drive (matches current name or previous names)
  try {
    const query = encodeURIComponent(`(name='${SPREADSHEET_NAME}' or name='Kas Rumah Belajar Mumu' or name='My Sandwich Kas - Pembukuan Harian' or name='Pembukuan Roti Sandwich - Harian') and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`);
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (driveRes.ok) {
      const driveData = await driveRes.json();
      if (driveData.files && driveData.files.length > 0) {
        const file = driveData.files[0];
        const meta = await getSpreadsheetMetadata(file.id, accessToken);
        localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, meta.id);
        return meta;
      }
    }
  } catch (err) {
    console.warn('Could not list drive files, attempting direct creation', err);
  }

  // Create new spreadsheet
  return await createNewSpreadsheet(accessToken);
}

/**
 * Fetch spreadsheet metadata and find the first tab's name & ID
 */
export async function getSpreadsheetMetadata(spreadsheetId: string, accessToken: string): Promise<SheetMetadata> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal membuka spreadsheet: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const sheets = data.sheets || [];
  const firstSheet = sheets[0]?.properties || { title: 'Transaksi', sheetId: 0 };

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || SPREADSHEET_NAME,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    firstSheetName: firstSheet.title,
    firstSheetId: firstSheet.sheetId,
  };
}

/**
 * Create a new spreadsheet with proper columns formatted for Rumah Belajar Mumu bookkeeping
 */
export async function createNewSpreadsheet(accessToken: string, customTitle?: string): Promise<SheetMetadata> {
  const title = customTitle || SPREADSHEET_NAME;

  const payload = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Transaksi',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'ID' } },
                  { userEnteredValue: { stringValue: 'Waktu Input' } },
                  { userEnteredValue: { stringValue: 'Tanggal' } },
                  { userEnteredValue: { stringValue: 'Jam' } },
                  { userEnteredValue: { stringValue: 'Tipe' } },
                  { userEnteredValue: { stringValue: 'Kategori' } },
                  { userEnteredValue: { stringValue: 'Keterangan' } },
                  { userEnteredValue: { stringValue: 'Metode Pembayaran' } },
                  { userEnteredValue: { stringValue: 'Nominal (Rp)' } },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membuat spreadsheet baru: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const firstSheet = data.sheets?.[0]?.properties || { title: 'Transaksi', sheetId: 0 };

  const meta: SheetMetadata = {
    id: data.spreadsheetId,
    title: data.properties?.title || title,
    url: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    firstSheetName: firstSheet.title,
    firstSheetId: firstSheet.sheetId,
  };

  localStorage.setItem(STORAGE_KEY_SPREADSHEET_ID, meta.id);

  // Apply visual styling to the header row (warm amber / sandwich theme)
  try {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${meta.id}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: meta.firstSheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 9,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.98, green: 0.93, blue: 0.84 }, // Warm honey bread tone
                  textFormat: {
                    bold: true,
                    foregroundColor: { red: 0.3, green: 0.18, blue: 0.05 },
                  },
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: meta.firstSheetId,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 9,
              },
            },
          },
        ],
      }),
    });
  } catch (styleErr) {
    console.warn('Optional header styling skipped:', styleErr);
  }

  return meta;
}

/**
 * Fetch transactions from the active spreadsheet
 */
export async function fetchTransactionsFromSheet(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<Transaction[]> {
  const range = `${encodeURIComponent(sheetName)}!A2:I`;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal mengambil data dari Google Sheets: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  const transactions: Transaction[] = [];

  rows.forEach((row, index) => {
    if (!row || row.length === 0 || !row[0]) return;
    
    // row format: [id, createdAt, date, time, typeStr, category, description, paymentMethod, amountStr]
    const id = row[0] || `tx-${index}`;
    const createdAt = row[1] || '';
    const date = row[2] || '';
    const time = row[3] || '';
    const typeStr = (row[4] || '').toLowerCase();
    const type = typeStr.includes('masuk') || typeStr === 'income' ? 'income' : 'expense';
    const category = row[5] || 'Lain-lain';
    const description = row[6] || '';
    const paymentMethod = (row[7] as any) || 'Tunai';
    
    // Parse numeric amount
    const rawAmount = row[8] || '0';
    const cleanAmount = String(rawAmount).replace(/[^0-9.-]/g, '');
    const amount = parseFloat(cleanAmount) || 0;

    transactions.push({
      id,
      createdAt,
      date,
      time,
      type,
      category,
      description,
      paymentMethod,
      amount,
      rowIndex: index + 2, // 1-indexed row in sheet (header is row 1, first data is row 2)
    });
  });

  // Sort descending by date and time
  return transactions.reverse();
}

/**
 * Append transaction row to Google Sheets
 */
export async function appendTransactionToSheet(
  spreadsheetId: string,
  sheetName: string,
  tx: Transaction,
  accessToken: string
): Promise<number> {
  const range = `${encodeURIComponent(sheetName)}!A:I`;
  const typeLabel = tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran';

  const body = {
    values: [
      [
        tx.id,
        tx.createdAt,
        tx.date,
        tx.time,
        typeLabel,
        tx.category,
        tx.description,
        tx.paymentMethod,
        tx.amount,
      ],
    ],
  };

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal menyimpan baris transaksi ke Google Sheets: ${res.status} ${errorText}`);
  }

  const result = await res.json();
  // Extract appended row index if available
  const updatedRange = result.updates?.updatedRange || '';
  const match = updatedRange.match(/!A(\d+):/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Delete a transaction row from Google Sheets by row index
 */
export async function deleteTransactionFromSheet(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  accessToken: string
): Promise<void> {
  if (rowIndex < 2) {
    throw new Error('Tidak dapat menghapus baris header spreadsheet.');
  }

  const payload = {
    requests: [
      {
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-indexed inclusive
            endIndex: rowIndex, // 0-indexed exclusive
          },
        },
      },
    ],
  };

  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gagal menghapus baris di Google Sheets: ${res.status} ${errorText}`);
  }
}
