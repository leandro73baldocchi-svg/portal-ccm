import React, { useState, useEffect, useMemo } from 'react';
import { AppConfig, DEFAULT_CONFIG, SearchType, Student, SpaceUsage, ActivityData } from './types';
import StudentCard from './components/StudentCard';
import { fetchSheetData } from './services/sheetsService';

function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [spaces, setSpaces] = useState<SpaceUsage[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('nome');
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<'busca' | 'atividades' | 'espacos'>('busca');

  // Filtros de Espaço
  const [spaceSearchTerm, setSpaceSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('Todos');
  const [selectedSpace, setSelectedSpace] = useState<string>('Todos');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Busca Alunos
      const studentData = await fetchSheetData(DEFAULT_CONFIG);
      setStudents(studentData);

      // Busca Espaços
      try {
        const spacesData = await fetchSheetData({
          ...DEFAULT_CONFIG,
          tabName: DEFAULT_CONFIG.tabSpacesName
        });
        setSpaces(spacesData);
      } catch (e) {
        console.warn("Aba de espaços não localizada.");
        setSpaces([]);
      }

      // Busca Atividades
      try {
        const activitiesData = await fetchSheetData({
          ...DEFAULT_CONFIG,
          tabName: DEFAULT_CONFIG.tabActivitiesName
        });
        setActivities(activitiesData);
      } catch (e) {
        console.warn("Aba de atividades não localizada.");
        setActivities([]);
      }

    } catch (err: any) {
      console.error(err);
      setError('Sincronização pendente. Verifique a conexão com a planilha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

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

  const getSpaceDetails = (space: SpaceUsage) => {
    const keys = Object.keys(space);
    const findKey = (terms: string[], exclude?: string) => 
      keys.find(k => k !== exclude && terms.some(t => k.toLowerCase().includes(t.toLowerCase())));

    // Prioridade de busca para evitar confusão entre colunas
    const nomeKey = findKey(['local', 'espaço', 'espaco']) || keys[0];
    const atividadeKey = findKey(['atividade', 'evento', 'uso'], nomeKey);
    const responsavelKey = findKey(['responsável', 'professor', 'instrutor', 'responsavel'], nomeKey);
    const diaKey = findKey(['dia', 'semana'], nomeKey);
    const inicioKey = findKey(['início', 'inicio', 'começo', 'das'], nomeKey);
    const terminoKey = findKey(['término', 'termino', 'fim', 'até', 'ate'], nomeKey);
    const faixaEtariaKey = findKey(['faixa', 'etária', 'etaria', 'idade', 'público', 'publico'], nomeKey);

    const capturedKeys = [nomeKey, atividadeKey, responsavelKey, diaKey, inicioKey, terminoKey, faixaEtariaKey];

    return {
      nome: space[nomeKey] || 'Espaço',
      atividade: (atividadeKey && space[atividadeKey]) || 'Nenhuma atividade',
      responsavel: (responsavelKey && space[responsavelKey]) || '-',
      dia: (diaKey && space[diaKey]) || '-',
      inicio: (inicioKey && space[inicioKey]) || '-',
      termino: (terminoKey && space[terminoKey]) || '-',
      faixaEtaria: (faixaEtariaKey && space[faixaEtariaKey]) || 'Livre',
      outros: Object.entries(space).filter(([k]) => !capturedKeys.includes(k))
    };
  };

  const getActivityDetails = (act: ActivityData) => {
    const keys = Object.keys(act);
    const findKey = (terms: string[], exclude?: string | string[]) => {
      const excludeList = Array.isArray(exclude) ? exclude : (exclude ? [exclude] : []);
      return keys.find(k => !excludeList.includes(k) && terms.some(t => k.toLowerCase().includes(t.toLowerCase())));
    };

    /**
     * CORREÇÃO: Buscamos primeiro o Nome da Atividade.
     * Se o usuário tem "ATIVIDADE" e "PÚBLICO", e buscamos "público" primeiro em uma coluna 
     * que se chama "Público da Atividade", podemos causar a inversão.
     */
    
    // 1. Localiza o nome da atividade (coluna principal)
    const nomeKey = findKey(['atividade', 'nome', 'curso', 'modalidade']);
    
    // 2. Localiza o público alvo, EXCLUINDO a coluna já identificada como nome
    const publicoKey = findKey(['público', 'publico', 'faixa', 'etária', 'etaria', 'idade'], nomeKey);
    
    // 3. Localiza dias e horários, excluindo os já encontrados
    const diasKey = findKey(['dia', 'semana', 'dias'], [nomeKey || '', publicoKey || '']);
    const horarioKey = findKey(['horário', 'horario', 'hora', 'tempo'], [nomeKey || '', publicoKey || '', diasKey || '']);

    // Fallbacks
    const finalNomeKey = nomeKey || keys[0];
    const finalPublicoKey = publicoKey;

    return {
      nome: act[finalNomeKey] || '-',
      dias: (diasKey && act[diasKey]) || '-',
      horario: (horarioKey && act[horarioKey]) || '-',
      publico: (finalPublicoKey && act[finalPublicoKey]) || 'Livre'
    };
  };

  const filteredSpaces = useMemo(() => {
    return spaces.filter(space => {
      const details = getSpaceDetails(space);
      const search = spaceSearchTerm.toLowerCase();
      
      const matchesText = 
        details.atividade.toLowerCase().includes(search) || 
        details.responsavel.toLowerCase().includes(search) || 
        details.nome.toLowerCase().includes(search);
      
      const matchesDay = selectedDay === 'Todos' || details.dia.toLowerCase().includes(selectedDay.toLowerCase());
      const matchesSpace = selectedSpace === 'Todos' || details.nome === selectedSpace;

      return matchesText && matchesDay && matchesSpace;
    });
  }, [spaces, spaceSearchTerm, selectedDay, selectedSpace]);

  const uniqueSpaces = useMemo(() => {
    const s = new Set(spaces.map(sp => getSpaceDetails(sp).nome));
    return ['Todos', ...Array.from(s)];
  }, [spaces]);

  const daysOfWeek = ['Todos', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 w-10 h-10 flex items-center justify-center rounded-xl text-white font-bold shadow-blue-200 shadow-lg">CEU</div>
             <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Caminho do Mar</h1>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-blue-600">Portal do Munícipe</p>
             </div>
          </div>
          
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'busca', label: 'Consultar' },
              { id: 'atividades', label: 'Atividades' },
              { id: 'espacos', label: 'Espaços' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button onClick={loadData} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7l3.181 3.182m0-4.991v4.99m0 0h-4.992m4.993 0-3.181-3.182a8.25 8.25 0 0 0-13.803 3.7l-3.181-3.182" />
            </svg>
          </button>
        </div>
        
        <div className="md:hidden flex border-t border-gray-100 overflow-x-auto no-scrollbar">
           {[
              { id: 'busca', label: 'Consultar' },
              { id: 'atividades', label: 'Atividades' },
              { id: 'espacos', label: 'Espaços' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-[100px] py-3 text-xs font-bold uppercase tracking-widest ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
              >
                {tab.label}
              </button>
            ))}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto p-4 w-full space-y-6">
        {activeTab === 'busca' && (
          <>
            <section className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 p-6 md:p-10 mt-4 overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-32 h-32">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                 </svg>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 mb-2">Consulta de Cadastro</h2>
                <p className="text-gray-500 max-w-md mx-auto">Consulte sua matrícula ou dados de frequência utilizando os campos abaixo.</p>
              </div>

              <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-6">
                 <div className="flex flex-wrap justify-center gap-2">
                   {['nome', 'eol', 'carteirinha'].map((type) => (
                     <label key={type} className={`px-5 py-2.5 rounded-2xl cursor-pointer transition-all border-2 text-sm font-bold ${searchType === type ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'}`}>
                       <input type="radio" value={type} checked={searchType === type} onChange={(e) => setSearchType(e.target.value as SearchType)} className="sr-only" />
                       {type.toUpperCase()}
                     </label>
                   ))}
                 </div>

                 <div className="relative group">
                   <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      placeholder={`Digite o ${searchType}...`} 
                      className="w-full pl-6 pr-4 py-5 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none text-xl transition-all font-medium placeholder:text-gray-300 shadow-inner bg-slate-50/50" 
                    />
                 </div>

                 <button type="submit" disabled={isLoading} className="w-full py-5 rounded-2xl text-white text-lg font-black bg-blue-600 hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none">
                   {isLoading ? 'SINCRONIZANDO...' : 'BUSCAR INFORMAÇÕES'}
                 </button>
                 
                 {error && (
                   <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-center text-sm font-bold border border-red-100">
                     {error}
                   </div>
                 )}
              </form>
            </section>

            {hasSearched && (
              <div className="space-y-4 pb-12">
                <div className="flex items-center justify-between px-2">
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Resultados ({searchResults.length})</h3>
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((s, i) => <StudentCard key={i} student={s} />)
                ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="text-4xl mb-4">🔍</div>
                    <h4 className="text-gray-900 font-bold text-lg">Nenhum registro encontrado</h4>
                    <p className="text-gray-400 text-sm">Verifique se digitou os dados corretamente.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'atividades' && (
          <section className="animate-fade-in space-y-6">
             <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                   <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                   Tabela de Atividades
                </h2>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="py-4 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Atividade</th>
                        <th className="py-4 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Dias</th>
                        <th className="py-4 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Horário</th>
                        <th className="py-4 px-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Público</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {activities.length > 0 ? (
                        activities.map((act, idx) => {
                          const details = getActivityDetails(act);
                          return (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                              <td className="py-4 px-2 font-bold text-gray-800">{details.nome}</td>
                              <td className="py-4 px-2 text-sm text-gray-600">{details.dias}</td>
                              <td className="py-4 px-2 text-sm font-medium text-blue-600">{details.horario}</td>
                              <td className="py-4 px-2">
                                <span className="bg-gray-100 text-[10px] font-bold px-2 py-1 rounded-full text-gray-500 uppercase whitespace-nowrap">
                                  {details.publico}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-10 text-center text-gray-400 italic">
                            {isLoading ? 'Carregando atividades...' : 'Nenhuma atividade cadastrada na aba "Atividades".'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                   <div className="bg-blue-600 p-2 rounded-lg text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                   </div>
                   <div>
                      <p className="text-sm font-bold text-blue-900">Inscrições e Vagas</p>
                      <p className="text-xs text-blue-700">Procure a gestão do CEU com documentos originais para verificar a disponibilidade de vagas nestas atividades.</p>
                   </div>
                </div>
             </div>
          </section>
        )}

        {activeTab === 'espacos' && (
          <section className="animate-fade-in space-y-6">
            <div className="bg-white rounded-3xl p-4 md:p-8 border border-gray-100 shadow-sm">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                  <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                  Central de Consultas
                </h2>
                <p className="text-sm text-gray-500">Filtre as atividades por local, professor, dia ou nome.</p>
              </div>

              {/* Filtros Superiores */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Busca por Texto (Atividade ou Responsável) */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Atividade ou Responsável</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ex: Futsal, Prof. Carlos..." 
                        value={spaceSearchTerm}
                        onChange={(e) => setSpaceSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all shadow-sm"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </div>
                  </div>

                  {/* Filtro por Espaço */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Selecione o Local</label>
                    <select 
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all shadow-sm appearance-none bg-white"
                    >
                      {uniqueSpaces.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Filtro por Dia da Semana (Scroll Horizontal no Mobile) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Dia da Semana</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border-2 ${selectedDay === day ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contador de Resultados */}
              <div className="mt-8 mb-4 flex items-center justify-between border-b border-gray-50 pb-2 px-2">
                 <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                   {filteredSpaces.length === 0 ? 'Nenhum resultado' : `${filteredSpaces.length} Atividades encontradas`}
                 </span>
                 {(selectedDay !== 'Todos' || selectedSpace !== 'Todos' || spaceSearchTerm) && (
                   <button 
                    onClick={() => { setSelectedDay('Todos'); setSelectedSpace('Todos'); setSpaceSearchTerm(''); }}
                    className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                   >
                     Limpar Filtros
                   </button>
                 )}
              </div>

              {/* Grid de Resultados */}
              {filteredSpaces.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-gray-200">
                  <div className="text-5xl mb-4 grayscale opacity-50">🗓️</div>
                  <h3 className="text-gray-900 font-bold text-lg">Nenhuma atividade coincide</h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">Tente ajustar seus filtros para encontrar o que procura.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                   {filteredSpaces.map((space, idx) => {
                     const details = getSpaceDetails(space);
                     return (
                       <div key={idx} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden flex flex-col group">
                          <div className="p-6 flex-1">
                             <div className="flex justify-between items-start mb-4">
                                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg uppercase tracking-wider border border-blue-100">
                                  {details.nome}
                                </span>
                                <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-lg uppercase border border-slate-200">
                                   {details.faixaEtaria}
                                </span>
                             </div>
                             
                             <h3 className="text-lg font-black text-gray-900 mb-1 group-hover:text-blue-600 transition-colors leading-tight">
                                {details.atividade}
                             </h3>
                             <p className="text-xs text-gray-500 font-bold mb-4 flex items-center gap-1.5">
                               <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                               Resp: {details.responsavel}
                             </p>

                             <div className="grid grid-cols-2 gap-2 mt-4">
                                {details.outros.slice(0, 2).map(([k, v]) => (
                                  <div key={k} className="p-2.5 bg-slate-50/80 rounded-2xl border border-gray-50">
                                    <span className="block text-[8px] font-black text-gray-400 uppercase leading-none mb-1">{k}</span>
                                    <span className="text-xs text-gray-700 font-bold truncate block">{v}</span>
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className="bg-slate-50/50 border-t border-gray-50 px-6 py-4 flex items-center justify-between">
                             <div className="flex items-center gap-2 text-gray-600">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-blue-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                  </svg>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tight text-gray-800">{details.dia}</span>
                             </div>
                             <div className="flex items-center gap-2 text-gray-900 font-bold">
                                <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-blue-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  </svg>
                                </div>
                                <span className="text-xs font-black tracking-tight">{details.inicio} — {details.termino}</span>
                             </div>
                          </div>
                       </div>
                     );
                   })}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
         <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
               <h4 className="text-white font-bold text-lg">CEU Caminho do Mar</h4>
               <p className="text-sm leading-relaxed">Promovendo educação, cultura e esporte para a comunidade da região.</p>
               <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-white font-bold text-sm uppercase tracking-widest">Informações</h4>
               <ul className="text-sm space-y-3">
                  <li className="flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                     </svg>
                     (11) 5625-5070
                  </li>
                  <li className="flex items-start gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mt-0.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                     </svg>
                     Av. Eng. Armando de Arruda Pereira, 5241 - Jabaquara, SP
                  </li>
                  <li className="flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                     </svg>
                     Seg a Sex: 07:00 às 22:00
                  </li>
               </ul>
            </div>

            <div className="space-y-4">
               <h4 className="text-white font-bold text-sm uppercase tracking-widest">Portal Público</h4>
               <p className="text-xs">Este sistema é uma ferramenta de consulta para munícipes e não substitui o atendimento presencial para efetivação de matrículas.</p>
               <div className="pt-4">
                  <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-1 rounded">Versão 1.9.2-QUERYFIX</span>
               </div>
            </div>
         </div>
         <div className="max-w-5xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-600">
            <p>© 2024 CEU Caminho do Mar - Secretaria Municipal de Educação de São Paulo</p>
         </div>
      </footer>
    </div>
  );
}

export default App;