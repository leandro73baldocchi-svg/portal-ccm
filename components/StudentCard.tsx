import React, { useState } from 'react';
import { Student } from '../types';
import { generateStudentSummary } from '../services/geminiService';

const StudentCard: React.FC<{ student: Student }> = ({ student }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAi = async () => {
    setLoading(true);
    setSummary(await generateStudentSummary(student));
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-slide-up p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(student).map(([k, v]) => (
          <div key={k}>
            <span className="text-xs font-bold text-gray-400 uppercase">{k}</span>
            <span className="block text-gray-800 font-medium">{v}</span>
          </div>
        ))}
      </div>
      <button onClick={handleAi} disabled={loading} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
        {loading ? 'Analisando...' : 'Análise com IA'}
      </button>
      {summary && <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm italic">{summary}</div>}
    </div>
  );
};

export default StudentCard;