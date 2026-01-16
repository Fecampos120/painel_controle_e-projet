
import React, { useState, useMemo } from 'react';
import { Contract, ProjectSchedule, ProjectChecklist, PaymentInstallment, VisitLog, Meeting, ProjectUpdate } from '../types';
import { 
    ChevronLeftIcon, 
    CheckCircleIcon, 
    DollarIcon, 
    MapPinIcon, 
    PrinterIcon, 
    ArchitectIcon,
    TrendingUpIcon,
    VideoCameraIcon,
    HistoryIcon,
    PlusIcon,
    XIcon,
    UsersIcon
} from './Icons';

interface ProjectPortalProps {
    contract: Contract;
    schedule?: ProjectSchedule;
    checklist: ProjectChecklist;
    installments: PaymentInstallment[];
    meetings: Meeting[];
    updates: ProjectUpdate[];
    visitLogs: VisitLog[];
    onAddVisitLog: (log: Omit<VisitLog, 'id' | 'createdAt'>) => void;
    onBack: () => void;
}

const ProjectPortal: React.FC<ProjectPortalProps> = ({ 
    contract, 
    schedule, 
    installments, 
    visitLogs,
    onAddVisitLog,
    onBack 
}) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'visitas' | 'financeiro'>('geral');
    const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
    const [visitForm, setVisitForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: any) => date ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date)) : '-';

    const projectVisits = visitLogs.filter(v => v.contractId === contract.id);
    const visitsTotal = contract.techVisits?.quantity || 0;
    const visitsDone = projectVisits.length;

    const progressPercent = useMemo(() => {
        if (!schedule || schedule.stages.length === 0) return 0;
        const completed = schedule.stages.filter(s => s.completionDate).length;
        return Math.round((completed / schedule.stages.length) * 100);
    }, [schedule]);

    const submitVisit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddVisitLog({ ...visitForm, contractId: contract.id });
        setIsAddVisitOpen(false);
        setVisitForm({ date: new Date().toISOString().split('T')[0], notes: '' });
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex items-center justify-between no-print">
                <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 font-bold uppercase text-xs tracking-widest">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" /> VOLTAR PARA LISTA
                </button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-white border rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-xs shadow-sm flex items-center">
                    <PrinterIcon className="w-4 h-4 mr-2" /> PDF / COMPARTILHAR
                </button>
            </div>

            <header className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                            <ArchitectIcon className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{contract.projectName}</h1>
                            <p className="text-slate-500 font-bold mt-2 uppercase text-xs tracking-widest flex items-center">
                                <UsersIcon className="w-4 h-4 mr-2" /> CLIENTE: {contract.clientName}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Progresso do Projeto</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </header>

            <div className="flex border-b border-slate-200 space-x-4 no-print">
                {[
                    { id: 'geral', label: 'Visão Geral', icon: <TrendingUpIcon className="w-4 h-4" /> },
                    { id: 'visitas', label: 'Visitas Técnicas', icon: <MapPinIcon className="w-4 h-4" /> },
                    { id: 'financeiro', label: 'Financeiro', icon: <DollarIcon className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center px-4 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="mr-2">{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'geral' && (
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase flex items-center">
                        <TrendingUpIcon className="w-6 h-6 mr-3 text-blue-500" /> Cronograma
                    </h3>
                    <div className="space-y-4">
                        {schedule?.stages.map((stage, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${stage.completionDate ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {stage.completionDate ? <CheckCircleIcon className="w-6 h-6" /> : idx + 1}
                                </div>
                                <div className="flex-1 border-b border-slate-50 pb-2">
                                    <p className="font-bold text-slate-800 uppercase text-sm">{stage.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Entrega: {formatDate(stage.deadline)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'visitas' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Contratadas</p>
                            <p className="text-4xl font-black text-slate-900">{visitsTotal}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Realizadas</p>
                            <p className="text-4xl font-black text-green-600">{visitsDone}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Saldo</p>
                            <p className="text-4xl font-black text-blue-600">{Math.max(0, visitsTotal - visitsDone)}</p>
                        </div>
                    </div>

                    <div className="flex justify-end no-print">
                        <button onClick={() => setIsAddVisitOpen(true)} className="flex items-center px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">
                            <MapPinIcon className="w-5 h-5 mr-3" /> Registrar Nova Visita
                        </button>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <h3 className="text-xl font-black text-slate-800 uppercase mb-8">Histórico de Visitas Técnicas</h3>
                        <div className="space-y-4">
                            {projectVisits.length === 0 && <p className="text-slate-400 text-center py-10 font-bold uppercase text-xs">Nenhuma visita realizada ainda.</p>}
                            {projectVisits.sort((a,b) => b.date.localeCompare(a.date)).map((v, i) => (
                                <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100"><MapPinIcon className="w-6 h-6" /></div>
                                    <div>
                                        <p className="font-black text-sm text-slate-800 uppercase">{formatDate(v.date)}</p>
                                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{v.notes}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'financeiro' && (
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                    <h3 className="text-xl font-black text-slate-800 uppercase mb-8">Cronograma Financeiro</h3>
                    <div className="space-y-4">
                        {installments.map((inst, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-4">
                                <div>
                                    <p className="font-bold text-slate-800 uppercase text-sm">{inst.installment}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">Vencimento: {formatDate(inst.dueDate)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-slate-900">{formatCurrency(inst.value)}</p>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${inst.status.includes('Pago') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{inst.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isAddVisitOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Dar Baixa em Visita</h3>
                            <button onClick={() => setIsAddVisitOpen(false)}><XIcon className="w-8 h-8 text-slate-400" /></button>
                        </div>
                        <form onSubmit={submitVisit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Data</label>
                                <input type="date" required value={visitForm.date} onChange={e => setVisitForm({...visitForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Notas da Obra</label>
                                <textarea rows={4} required value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200" placeholder="Relate o andamento verificado..." />
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-blue-700 transition-all">Registrar Visita</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectPortal;
