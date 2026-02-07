export interface AppConfig {
  sheetId: string;
  googleSheetsApiKey?: string;
  tabName: string;
  columnMapping: {
    carteirinha: string;
    eol: string;
    nome: string;
  };
}

export interface Student {
  [key: string]: string;
}

export type SearchType = 'carteirinha' | 'eol' | 'nome';

export const DEFAULT_CONFIG: AppConfig = {
  sheetId: '1RFvtMadvDl5zCeHPaFPLG22-E2FjMoSSA6eNL-hFgmU',
  googleSheetsApiKey: 'AIzaSyAtqxG6eUaLdK3YAdbukSAdtlj-MVZw1hk',
  tabName: 'Página1',
  columnMapping: {
    carteirinha: 'CARTEIRINHA',
    eol: 'CÓDIGO EOL',
    nome: 'NOME DO ALUNO'
  }
};