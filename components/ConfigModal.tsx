import React, { useState, useEffect } from 'react';
import { AppConfig, DEFAULT_CONFIG } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AppConfig) => void;
  currentConfig: AppConfig;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave, currentConfig }) => {
  const [formData, setFormData] = useState<AppConfig>(currentConfig);

  // Reset form when modal opens with current config
  useEffect(() => {
    if (isOpen) {
      setFormData(currentConfig);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('col_')) {
      const key = name.replace('col_', '');
      setFormData(prev => ({
        ...prev,
        columnMapping: {
          ...prev.columnMapping,
          [key]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleUseDemo = () => {
    setFormData(prev => ({
      ...prev,
      sheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', // Public demo sheet from Google
      googleSheetsApiKey: '', 
      tabName: 'Class Data',
      columnMapping: {
        carteirinha: 'Student Name', // Mapping demo columns to our types for the example
        eol: 'Major', 
        nome: 'Student Name'
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="bg-slate-800 p-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Configurações
          </h2>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Conexão Google Sheets</h3>
            <p className="text-xs text-gray-500 mb-2">Configure o ID da planilha e a chave de acesso.</p>

            <div>
              <label className="block text-sm font-medium text-gray-700">Google Sheets API Key <span className="text-gray-400 font-normal">(Opcional se pública)</span></label>
              <input
                type="text"
                name="googleSheetsApiKey"
                value={formData.googleSheetsApiKey || ''}
                onChange={handleChange}
                placeholder="AIzaSy..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
              
              {/* Help Box for API Key */}
              <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-100 text-xs text-green-900">
                 <p className="font-semibold mb-1 flex items-center gap-1">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                    </svg>
                   Como conseguir a chave?
                 </p>
                 <ol className="list-decimal pl-4 space-y-1">
                   <li>Acesse o <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline font-bold text-green-700 hover:text-green-900">Google Cloud Console</a>.</li>
                   <li>Crie uma credencial do tipo <strong>Chave de API</strong>.</li>
                   <li>No menu <strong>Biblioteca</strong>, ative a "Google Sheets API".</li>
                   <li>Copie a chave (começa com <code>AIza...</code>) e cole acima.</li>
                 </ol>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">ID da Planilha (Spreadsheet ID)</label>
              <input
                type="text"
                name="sheetId"
                value={formData.sheetId}
                onChange={handleChange}
                placeholder="Ex: 1BxiMVs0X..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
              {/* Help Box for Sheet ID */}
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-800">
                <p className="font-semibold mb-1 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.402 5.457a1.002 1.002 0 0 1 1.768 0l.375.474a.438.438 0 0 0 .193.136l.57.172c.683.206.877 1.085.353 1.572l-.427.397a.439.439 0 0 0-.13.314l.004.598c.005.713-.807 1.127-1.396.726l-.497-.338a.438.438 0 0 0-.416-.03l-.54.218c-.663.268-1.332-.345-1.123-1.026l.169-.553a.439.439 0 0 0-.063-.393l-.36-.456c-.426-.54-.08-1.353.606-1.42l.59-.057a.439.439 0 0 0 .34-.234l.284-.543Zm1.223 3.998a.75.75 0 1 0-1.5 0v3a.75.75 0 1 0 1.5 0v-3Zm-1.157 5.174a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z" clipRule="evenodd" />
                  </svg>
                  Onde encontrar o ID?
                </p>
                <p className="mb-1">Abra sua planilha e olhe para o link no navegador:</p>
                <div className="font-mono bg-white p-1.5 rounded border border-blue-200 break-all leading-tight text-gray-500">
                  docs.google.com/spreadsheets/d/<span className="font-bold text-blue-600 bg-blue-100 px-1 rounded mx-0.5">SEU_ID_AQUI</span>/edit
                </div>
                <p className="mt-1">Copie apenas o código longo entre as barras.</p>
              </div>
            </div>
            
             <div>
              <label className="block text-sm font-medium text-gray-700">Nome da Aba (Tab Name)</label>
              <input
                type="text"
                name="tabName"
                value={formData.tabName}
                onChange={handleChange}
                placeholder="Ex: Página1"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-1">Mapeamento de Colunas</h3>
            <p className="text-xs text-gray-500">Digite o nome exato do cabeçalho na sua planilha.</p>
            
            <div className="grid grid-cols-1 gap-3">
               <div>
                <label className="block text-xs font-medium text-gray-600">Carteirinha</label>
                <input
                  type="text"
                  name="col_carteirinha"
                  value={formData.columnMapping.carteirinha}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
               <div>
                <label className="block text-xs font-medium text-gray-600">Código EOL</label>
                <input
                  type="text"
                  name="col_eol"
                  value={formData.columnMapping.eol}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
               <div>
                <label className="block text-xs font-medium text-gray-600">Nome do Aluno</label>
                <input
                  type="text"
                  name="col_nome"
                  value={formData.columnMapping.nome}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <button 
            onClick={handleUseDemo}
            className="text-sm text-blue-600 hover:underline"
          >
            Preencher Demo (USA)
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm"
            >
              Salvar Configuração
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;