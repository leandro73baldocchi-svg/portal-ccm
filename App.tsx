import React, { useState, useEffect } from 'react';
import { AppConfig, DEFAULT_CONFIG, SearchType, Student } from './types';
import StudentCard from './components/StudentCard';
import { fetchSheetData } from './services/sheetsService';

function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('nome');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSheetData(DEFAULT_CONFIG);
      setStudents(data);
    } catch (err: any) {
      setError('Erro ao carregar dados da planilha. Verifique a conexão.');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    if (!searchTerm.trim()) return;

    const lowerTerm = searchTerm.toLowerCase().trim();
    const results = students.filter(student => {
      let fieldKey = '';
      if (searchType === 'carteirinha') fieldKey = DEFAULT_CONFIG.columnMapping.carteirinha;
      if (searchType === 'eol') fieldKey = DEFAULT_CONFIG.columnMapping.eol;
      if (searchType === 'nome') fieldKey = DEFAULT_CONFIG.columnMapping.nome;

      const actualKey = Object.keys(student).find(k => k.toLowerCase() === fieldKey.toLowerCase());
      if (!actualKey) return false;

      const rawValue = student[actualKey]?.toString().toLowerCase() || '';
      return rawValue.includes(lowerTerm);
    });

    setSearchResults(results);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2 rounded-lg text-white font-bold">CEU</div>
             <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Portal Caminho do Mar</h1>
                <p className="text-xs text-gray-500 font-medium">Consulta Pública</p>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto p-4 w-full">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6 mt-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Consultar Munícipe</h2>
            <p className="text-gray-500">Busque por nome, EOL ou carteirinha.</p>
          </div>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-6">
             <div className="flex flex-wrap justify-center gap-4">
               {['carteirinha', 'eol', 'nome'].map((type) => (
                 <label key={type} className={`px-4 py-2 rounded-full cursor-pointer transition-all border text-sm font-medium ${searchType === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}>
                   <input type="radio" value={type} checked={searchType === type} onChange={(e) => setSearchType(e.target.value as SearchType)} className="sr-only" />
                   {type.charAt(0).toUpperCase() + type.slice(1)}
                 </label>
               ))}
             </div>

             <div className="relative">
               <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Digite sua busca..." className="w-full pl-6 pr-4 py-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-200 outline-none text-lg" />
             </div>

             <button type="submit" disabled={isLoading} className="w-full py-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-400">
               {isLoading ? 'Sincronizando...' : 'Pesquisar'}
             </button>
             {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          </form>
        </section>

        {hasSearched && (
          <div className="space-y-6">
            {searchResults.length > 0 ? searchResults.map((s, i) => <StudentCard key={i} student={s} />) : <div className="text-center py-10 text-gray-500">Nenhum registro encontrado.</div>}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;