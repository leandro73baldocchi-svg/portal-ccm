import { AppConfig, Student } from '../types';

export const fetchSheetData = async (config: AppConfig): Promise<Student[]> => {
  const apiKey = config.googleSheetsApiKey;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/${encodeURIComponent(config.tabName)}?key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Falha ao acessar planilha');
  
  const data = await response.json();
  const rows: string[][] = data.values || [];
  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(row => {
    const student: Student = {};
    headers.forEach((h, i) => student[h] = row[i] || '');
    return student;
  });
};