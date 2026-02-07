import React, { useState } from 'react';
import { Student } from '../types';
import { generateStudentSummary } from '../services/geminiService';

const StudentCard: React.FC<{ student: Student }> = ({ student }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAi = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await generateStudentSummary(student);
      setSummary(result);
    } catch (err) {
      setSummary("Erro ao processar análise.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up hover:shadow-md transition-shadow">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-50">
           <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl">
             {student['NOME DO ALUNO']?.[0] || 'M'}
           </div>
           <div>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {student['NOME DO ALUNO'] || 'Munícipe'}
              </h3>
              <p className="text-xs text-gray-400 font-medium">Cadastro Ativo no Sistema</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {Object.entries(student).map(([k, v]) => (
            v && (
              <div key={k} className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">{k}</span>
                <span className="text-gray-700 font-semibold">{v}</span>
              </div>
            )
          ))}
        </div>
        
        <div className="pt-6 border-t border-gray-50">
          <button 
            onClick={handleAi} 
            disabled={loading} 
            className={`w-full flex items-center justify-center gap-2 text-sm font-bold px-6 py-4 rounded-2xl transition-all ${
              loading 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando perfil...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM19.327 1.5a.75.75 0 0 1 .721.544l.306 1.07a1.875 1.875 0 0 0 1.306 1.306l1.07.306a.75.75 0 0 1 0 1.442l-1.07.306a1.875 1.875 0 0 0-1.306 1.306l-.306 1.07a.75.75 0 0 1-1.442 0l-.306-1.07a1.875 1.875 0 0 0-1.306-1.306l-1.07-.306a.75.75 0 0 1 0-1.442l1.07-.306a1.875 1.875 0 0 0 1.306-1.306l.306-1.07a.75.75 0 0 1 .721-.544Z" clipRule="evenodd" />
                </svg>
                Análise com Inteligência Artificial
              </>
            )}
          </button>
          
          {summary && (
            <div className="mt-4 p-5 bg-slate-50 rounded-2xl text-sm text-gray-700 border border-slate-100 animate-fade-in leading-relaxed">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">IA Oficial</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Resumo do Munícipe</span>
              </div>
              <p className="italic text-gray-600 leading-relaxed font-medium">"{summary}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCard;