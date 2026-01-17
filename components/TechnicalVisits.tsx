
import React, { useState, useMemo } from 'react';
import { Contract, VisitLog } from '../types';
import { MapPinIcon, PlusIcon, CheckCircleIcon, XIcon, HistoryIcon, ChevronRightIcon, ArchitectIcon } from './Icons';

interface TechnicalVisitsProps {
    contracts: Contract[];
    visitLogs: VisitLog[];
    onAddVisitLog: (log: Omit<VisitLog, 'id' | 'createdAt'>) => void;
}

const TechnicalVisits: React.FC<TechnicalVisitsProps> = ({ contracts, visitLogs, onAddVisitLog }) => {
    // Apenas contratos ativos com visitas habilitadas
    const eligibleContracts = useMemo(() => 
        contracts.filter(c => c.status === 'Ativo' && c.techVisits?.enabled)
    , [contracts]);
    
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [visitForm, setVisitForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });

    const getStats = (contract: Contract) => {
        const logs = visitLogs.filter(l => l.contractId === contract.id);
        const total = contract.techVisits?.quantity || 0;
        const done = logs.length;
        const remaining = Math.max(0, total - done);
        const progress = total > 0 ? (done / total) * 100 : 0;
        return { total, done, remaining, progress, logs };
    };

    const handleAddVisit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedContract) return;

        onAddVisitLog({
            contractId: selectedContract.id,
            date: visitForm.date,
            notes: visitForm.notes
        });

        setVisitForm({ date: new Date().toISOString().split('T')[0], notes: '' });
        setSelectedContract(null);
        alert('Baixa de visita registrada com sucesso!');
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-32">
            <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Baixa em Visitas Técnicas</h1>
                    <p className="mt-1 text-blue-100 italic text-sm">Controle o saldo de visitas contratadas e registre as atas de obra.</p>
                </div>
                <MapPinIcon className="w-12 h-12 text-white/20" />
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eligibleContracts.map(contract => {
                    const stats = getStats(contract);
                    return (
                        <div key={contract.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-300 transition-all group flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-[9px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Saldo: {stats.remaining}</span>
                                    <HistoryIcon className="w-5 h-5 text-slate-200 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight line-clamp-1">{contract.projectName}</h3>
                                <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest mb-6">{contract.clientName}</p>
                                
                                <div className="space-y-2 mb-8">
                                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                                        <span>Consumo de Visitas</span>
                                        <span>{stats.done} / {stats.total}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${stats.remaining <= 1 ? 'bg-orange-500' : 'bg-blue-600'}`} 
                                            style={{ width: `${stats.progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedContract(contract)}
                                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" /> Dar Baixa em Visita
                            </button>
                        </div>
                    );
                })}

                {eligibleContracts.length === 0 && (
                    <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-center opacity-50">
                        <ArchitectIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhum contrato com pacote de visitas</h2>
                        <p className="text-sm font-bold text-slate-400">Ative o controle de visitas na criação do contrato.</p>
                    </div>
                )}
            </div>

            <div className="mt-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-8 flex items-center">
                    <HistoryIcon className="w-5 h-5 mr-3 text-blue-500" /> Últimos Registros de Obra
                </h3>
                <div className="space-y-4">
                    {visitLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(log => {
                        const project = contracts.find(c => c.id === log.contractId);
                        return (
                            <div key={log.id} className="flex items-center gap-6 p-4 hover:bg-slate-50 rounded-2xl transition-colors border-b border-slate-50 last:border-0">
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                    <MapPinIcon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-black text-slate-800 text-sm uppercase">{project?.projectName || 'Projeto Removido'}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{project?.clientName}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">{new Date(log.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 mt-2 line-clamp-1 italic">"{log.notes}"</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* MODAL DE BAIXA */}
            {selectedContract && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                            <div>
                                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Registro de Visita</span>
                                <h3 className="text-2xl font-black uppercase tracking-tight mt-1">{selectedContract.projectName}</h3>
                            </div>
                            <button onClick={() => setSelectedContract(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XIcon className="w-8 h-8 text-white" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAddVisit} className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data da Visita</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={visitForm.date} 
                                    onChange={e => setVisitForm({...visitForm, date: e.target.value})} 
                                    className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:border-blue-500 transition-all" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ata de Obra / Resumo da Visita</label>
                                <textarea 
                                    required 
                                    rows={4} 
                                    value={visitForm.notes} 
                                    onChange={e => setVisitForm({...visitForm, notes: e.target.value})} 
                                    placeholder="O que foi verificado no local? Exemplos: conferência de pontos elétricos, nivelamento de piso..."
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                            
                            <div className="pt-4">
                                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" /> Confirmar e Dar Baixa no Saldo
                                </button>
                                <p className="text-center text-[9px] font-bold text-slate-400 uppercase mt-4">
                                    Esta ação é permanente e descontará 1 visita do pacote contratado.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicalVisits;
