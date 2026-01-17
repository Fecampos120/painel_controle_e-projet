
import React, { useState, useMemo, useRef } from 'react';
import { Contract, ProjectSchedule, ProjectChecklist, ProjectChecklistItem, PaymentInstallment, VisitLog, Meeting, ProjectUpdate, Note, SystemSettings } from '../types';
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
    UsersIcon,
    NotepadIcon,
    CameraIcon,
    UploadIcon,
    EyeIcon,
    PencilIcon,
    SendIcon,
    ReceiptIcon
} from './Icons';

interface ProjectPortalProps {
    contract: Contract;
    schedule?: ProjectSchedule;
    checklist: ProjectChecklist;
    installments: PaymentInstallment[];
    notes: Note[];
    updates: ProjectUpdate[];
    visitLogs: VisitLog[];
    onAddVisitLog: (log: Omit<VisitLog, 'id' | 'createdAt'>) => void;
    onAddProjectUpdate: (update: Omit<ProjectUpdate, 'id'>) => void;
    onUpdateChecklist: (checklist: ProjectChecklist) => void;
    onBack: () => void;
    systemSettings?: SystemSettings;
}

const ProjectPortal: React.FC<ProjectPortalProps> = ({ 
    contract, 
    schedule, 
    checklist,
    installments, 
    notes,
    updates,
    visitLogs,
    onAddVisitLog,
    onAddProjectUpdate,
    onUpdateChecklist,
    onBack,
    systemSettings
}) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'mural' | 'checklist' | 'visitas' | 'financeiro'>('geral');
    const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    
    const [updateForm, setUpdateForm] = useState({ 
        date: new Date().toISOString().split('T')[0], 
        description: '', 
        nextSteps: '', 
        photos: [] as string[] 
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // Totais financeiros para o recibo
    const financialSummary = useMemo(() => {
        const totalPaid = installments.filter(i => i.status.includes('Pago')).reduce((acc, i) => acc + i.value, 0);
        const totalPending = installments.filter(i => !i.status.includes('Pago')).reduce((acc, i) => acc + i.value, 0);
        return { totalPaid, totalPending };
    }, [installments]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        (Array.from(files) as File[]).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUpdateForm(prev => ({ ...prev, photos: [...prev.photos, reader.result as string] }));
            };
            reader.readAsDataURL(file);
        });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        onAddProjectUpdate({ ...updateForm, contractId: contract.id });
        setIsAddUpdateOpen(false);
        setUpdateForm({ date: new Date().toISOString().split('T')[0], description: '', nextSteps: '', photos: [] });
    };

    const generateWhatsAppReport = () => {
        const lastUpdate = updates.sort((a,b) => b.date.localeCompare(a.date))[0];
        const nextStage = schedule?.stages.find(s => !s.completionDate);
        
        const message = `*RELATÓRIO DE EVOLUÇÃO - ${contract.projectName.toUpperCase()}* 🏠\n\n` +
            `Olá, *${contract.clientName}*! Segue o resumo do andamento do seu projeto:\n\n` +
            `📊 *Progresso Geral:* ${progressPercent}%\n` +
            `✅ *Status Atual:* ${lastUpdate ? lastUpdate.description : 'Em andamento conforme cronograma.'}\n` +
            `🚀 *Próximos Passos:* ${lastUpdate?.nextSteps || nextStage?.name || 'Continuidade das etapas técnicas.'}\n\n` +
            `📍 *Visitas de Obra:* ${visitsDone}/${visitsTotal} realizadas.\n\n` +
            `Qualquer dúvida, estou à disposição!`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${contract.clientPhone?.replace(/\D/g, '')}?text=${encoded}`, '_blank');
    };

    const groupedChecklist = useMemo(() => {
        const groups: { [key: string]: ProjectChecklistItem[] } = {};
        if (checklist.items) {
            checklist.items.forEach(item => {
                if (!groups[item.stage]) groups[item.stage] = [];
                groups[item.stage].push(item);
            });
        }
        return groups;
    }, [checklist.items]);

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex items-center justify-between no-print">
                <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 font-bold uppercase text-xs tracking-widest transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" /> VOLTAR PARA LISTA
                </button>
                <div className="flex gap-3">
                    <button onClick={() => setIsReceiptModalOpen(true)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all flex items-center">
                        <ReceiptIcon className="w-4 h-4 mr-2" /> Gerar Extrato/Recibo
                    </button>
                    <button onClick={generateWhatsAppReport} className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all flex items-center">
                        <SendIcon className="w-4 h-4 mr-2" /> Notificar no WhatsApp
                    </button>
                </div>
            </div>

            <header className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 transform rotate-3">
                            <ArchitectIcon className="w-12 h-12" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{contract.projectName}</h1>
                            <p className="text-slate-400 font-black mt-3 uppercase text-[10px] tracking-[0.3em] flex items-center">
                                <UsersIcon className="w-4 h-4 mr-2 text-blue-500" /> PROPRIETÁRIO: {contract.clientName}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-3">
                         <span className={`px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm ${contract.status === 'Ativo' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {contract.status === 'Ativo' ? '● PROJETO EM EXECUÇÃO' : `PROJETO ${contract.status.toUpperCase()}`}
                         </span>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Iniciado em: {formatDate(contract.date)}</p>
                    </div>
                </div>
                
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cronograma de Entrega</span>
                            <span className="text-2xl font-black text-blue-600 italic">{progressPercent} %</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-1000 relative" style={{ width: `${progressPercent}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
                         <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase">Próxima Entrega</p>
                            <p className="text-sm font-black text-slate-700 uppercase mt-1">{schedule?.stages.find(s => !s.completionDate)?.name || 'Finalizado'}</p>
                         </div>
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                            <HistoryIcon className="w-5 h-5" />
                         </div>
                    </div>
                </div>
            </header>

            <div className="flex border-b border-slate-200 space-x-2 md:space-x-8 no-print overflow-x-auto custom-scrollbar">
                {[
                    { id: 'geral', label: 'Linha do Tempo', icon: <TrendingUpIcon className="w-4 h-4" /> },
                    { id: 'mural', label: 'Diário & Fotos', icon: <CameraIcon className="w-4 h-4" /> },
                    { id: 'checklist', label: 'Ações Técnicas', icon: <CheckCircleIcon className="w-4 h-4" /> },
                    { id: 'visitas', label: 'Atas de Obra', icon: <MapPinIcon className="w-4 h-4" /> },
                    { id: 'financeiro', label: 'Pagamentos', icon: <DollarIcon className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center whitespace-nowrap px-2 pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="mr-2">{tab.icon}</span> {tab.label}
                        {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full"></div>}
                    </button>
                ))}
            </div>

            <main className="animate-fadeIn">
                {activeTab === 'geral' && (
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-lg border border-slate-100">
                        <div className="space-y-8 relative">
                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-100"></div>
                            {schedule?.stages.map((stage, idx) => {
                                const isDone = !!stage.completionDate;
                                return (
                                    <div key={idx} className="relative pl-12 group">
                                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl flex items-center justify-center z-10 transition-all border-4 border-white shadow-md ${isDone ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                            {isDone ? <CheckCircleIcon className="w-6 h-6" /> : <span className="font-black text-xs">{idx + 1}</span>}
                                        </div>
                                        <div className={`p-6 rounded-3xl border-2 transition-all ${isDone ? 'bg-green-50/30 border-green-100' : 'bg-white border-slate-50 hover:border-blue-100'}`}>
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <h4 className={`text-lg font-black uppercase tracking-tight ${isDone ? 'text-green-800' : 'text-slate-800'}`}>{stage.name}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Previsão: {formatDate(stage.deadline)}</p>
                                                </div>
                                                {isDone && (
                                                    <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                                                        <CheckCircleIcon className="w-3 h-3 text-green-600" />
                                                        <span className="text-[9px] font-black text-green-700 uppercase">Concluído em {formatDate(stage.completionDate)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'mural' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-black text-slate-800 uppercase flex items-center tracking-tight">
                                    <CameraIcon className="w-6 h-6 mr-3 text-purple-500" /> Álbum de Acompanhamento
                                </h3>
                                <button onClick={() => setIsAddUpdateOpen(true)} className="px-6 py-3 bg-slate-900 text-white font-black text-[10px] uppercase rounded-xl tracking-widest hover:scale-105 transition-all shadow-xl">
                                    + Registrar Evolução
                                </button>
                            </div>

                            <div className="space-y-8">
                                {updates.length === 0 && (
                                    <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-slate-100 text-center opacity-30">
                                        <CameraIcon className="w-16 h-16 mx-auto mb-4" />
                                        <p className="font-black uppercase text-xs tracking-widest">Nenhum registro visual ainda</p>
                                    </div>
                                )}
                                {updates.sort((a,b) => b.date.localeCompare(a.date)).map(update => (
                                    <div key={update.id} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6 group">
                                        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-black text-xs">
                                                    {new Date(update.date).getDate()}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 uppercase">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(update.date))}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Relatório Técnico</p>
                                                </div>
                                            </div>
                                            <button className="text-slate-200 group-hover:text-green-500 transition-colors" onClick={generateWhatsAppReport} title="Notificar Cliente">
                                                <SendIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <p className="text-slate-700 font-medium leading-relaxed italic border-l-4 border-purple-100 pl-4">"{update.description}"</p>
                                        
                                        {update.photos && update.photos.length > 0 && (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {update.photos.map((photo, pIdx) => (
                                                    <div key={pIdx} className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 group/img relative">
                                                        <img src={photo} alt="Obra" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                            <EyeIcon className="w-8 h-8 text-white" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {update.nextSteps && (
                                            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start gap-4">
                                                <TrendingUpIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Próximos Passos Garantidos:</p>
                                                    <p className="text-sm text-slate-600 font-bold">{update.nextSteps}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-1 space-y-8">
                             <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
                                <h3 className="text-lg font-black uppercase mb-6 flex items-center tracking-tight">
                                    <NotepadIcon className="w-6 h-6 mr-3 text-blue-400" /> Notas do Estúdio
                                </h3>
                                <div className="space-y-6">
                                    {notes.length === 0 && <p className="text-xs text-slate-500 italic">Nenhum aviso importante no mural.</p>}
                                    {notes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                                        <div key={note.id} className="p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">{formatDate(note.createdAt)}</p>
                                                {!note.completed && <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></div>}
                                            </div>
                                            <h4 className="font-black text-sm uppercase tracking-tight mb-2">{note.title}</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'checklist' && (
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                        <div className="space-y-12">
                            {Object.entries(groupedChecklist).length === 0 && (
                                <p className="text-center text-slate-400 italic">Lista técnica em preparação.</p>
                            )}
                            {(Object.entries(groupedChecklist) as [string, ProjectChecklistItem[]][]).sort().map(([stage, items]) => {
                                const stageDone = items.filter(it => it.completed).length;
                                const stageProgress = Math.round((stageDone / items.length) * 100);

                                return (
                                    <div key={stage} className="space-y-6">
                                        <div className="flex justify-between items-end border-b-2 border-slate-50 pb-3">
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{stage}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Conformidade Técnica: {stageProgress}%</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center">
                                                <CheckCircleIcon className={`w-6 h-6 ${stageProgress === 100 ? 'text-green-500' : 'text-slate-100'}`} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {items.map(item => (
                                                <div key={item.id} className={`p-5 rounded-3xl border-2 transition-all flex items-center gap-4 ${item.completed ? 'bg-slate-50 border-slate-50 opacity-60' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-xl border-2 ${item.completed ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'border-slate-100 text-transparent'}`}>
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <span className={`text-sm font-bold uppercase tracking-tight ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</span>
                                                        {item.completed && item.completionDate && (
                                                            <p className="text-[9px] font-black text-green-600 uppercase mt-1 tracking-widest">Validado: {item.completionDate}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'visitas' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contratadas</p>
                                <p className="text-5xl font-black text-slate-900">{visitsTotal}</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Executadas</p>
                                <p className="text-5xl font-black text-green-600">{visitsDone}</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Saldo Atual</p>
                                <p className="text-5xl font-black text-blue-600">{Math.max(0, visitsTotal - visitsDone)}</p>
                            </div>
                        </div>

                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-10 flex items-center">
                                <MapPinIcon className="w-7 h-7 mr-3 text-blue-600" /> Atas de Visita Técnica
                            </h3>
                            <div className="space-y-6">
                                {projectVisits.length === 0 && <p className="text-slate-400 text-center py-20 font-black uppercase text-xs tracking-widest opacity-30">Nenhuma ata registrada</p>}
                                {projectVisits.sort((a,b) => b.date.localeCompare(a.date)).map((v, i) => (
                                    <div key={i} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row gap-8 hover:bg-blue-50/30 transition-colors">
                                        <div className="md:w-32 flex-shrink-0 text-center md:text-left">
                                            <p className="text-2xl font-black text-slate-800">{new Date(v.date).getDate()}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">{new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(v.date))}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">{v.notes}</p>
                                            <div className="mt-4 flex gap-2">
                                                <span className="text-[9px] font-black bg-white px-2 py-1 rounded border border-slate-200 uppercase tracking-widest text-slate-400">Verificado em Obra</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'financeiro' && (
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
                        <h3 className="text-xl font-black text-slate-800 uppercase mb-10 flex items-center tracking-tight">
                            <DollarIcon className="w-7 h-7 mr-3 text-green-600" /> Fluxo de Pagamentos
                        </h3>
                        <div className="space-y-4">
                            {installments.map((inst, i) => {
                                const isPaid = inst.status.includes('Pago');
                                return (
                                    <div key={i} className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-3xl border-2 transition-all ${isPaid ? 'bg-green-50/20 border-green-50 opacity-80' : 'bg-white border-slate-50 shadow-sm'}`}>
                                        <div className="flex items-center gap-6 mb-4 md:mb-0">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isPaid ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                {isPaid ? <CheckCircleIcon className="w-7 h-7" /> : i + 1}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase text-sm tracking-tight">{inst.installment === 'Entrada' ? 'SINAL / ADIANTAMENTO' : `PARCELA ${inst.installment}`}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vencimento: {formatDate(inst.dueDate)}</p>
                                            </div>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="text-xl font-black text-slate-900">{formatCurrency(inst.value)}</p>
                                            <span className={`inline-block mt-2 px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest ${isPaid ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-amber-100 text-amber-700'}`}>
                                                {inst.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL DE RECIBO / EXTRATO CONSOLIDADO (PARA IMPRESSÃO PDF) */}
            {isReceiptModalOpen && (
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .print-receipt-content, .print-receipt-content * { visibility: visible; }
                            .print-receipt-content { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 1.5cm; background: white; }
                            .no-print { display: none !important; }
                        }
                    `}</style>
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-slideUp print-receipt-content">
                        <div className="p-10 border-b-4 border-slate-900 flex justify-between items-start">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                                    <ArchitectIcon className="w-10 h-10" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Extrato do Projeto</h2>
                                    <p className="text-slate-400 text-[10px] font-black mt-2 uppercase tracking-[0.3em]">Resumo Consolidado de Contrato</p>
                                </div>
                            </div>
                            <div className="flex gap-4 no-print">
                                <button onClick={() => window.print()} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center">
                                    <PrinterIcon className="w-4 h-4 mr-2" /> Imprimir / PDF
                                </button>
                                <button onClick={() => setIsReceiptModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <XIcon className="w-8 h-8 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-12 space-y-10 font-serif">
                            <section className="grid grid-cols-2 gap-12 border-b border-slate-100 pb-10">
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contratante</h4>
                                    <p className="text-xl font-bold uppercase">{contract.clientName}</p>
                                    <p className="text-sm text-slate-500 mt-1">{contract.clientEmail}</p>
                                    <p className="text-sm text-slate-500">{contract.clientPhone}</p>
                                </div>
                                <div className="text-right">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Projeto Referência</h4>
                                    <p className="text-xl font-bold uppercase">{contract.projectName}</p>
                                    <p className="text-sm text-slate-500 mt-1">Data Início: {formatDate(contract.date)}</p>
                                    <p className="text-sm text-slate-500">Documento Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                                </div>
                            </section>

                            <section>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b-2 border-slate-800 pb-2">1. Escopo Técnico & Serviços</h4>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-left">
                                        <tr>
                                            <th className="p-3 uppercase text-[10px] font-black text-slate-400">Serviço</th>
                                            <th className="p-3 uppercase text-[10px] font-black text-slate-400 text-center">Tipo</th>
                                            <th className="p-3 uppercase text-[10px] font-black text-slate-400 text-right">Valor Contratado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {contract.services.map((s, idx) => (
                                            <tr key={idx}>
                                                <td className="p-3 font-bold uppercase text-slate-700">{s.serviceName}</td>
                                                <td className="p-3 text-center text-slate-500 uppercase text-[9px] font-bold">{s.calculationMethod}</td>
                                                <td className="p-3 text-right font-black text-slate-900">{formatCurrency(parseFloat(s.value))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 font-black">
                                        <tr>
                                            <td colSpan={2} className="p-3 text-right text-[10px] uppercase">Total Bruto de Contrato:</td>
                                            <td className="p-3 text-right text-lg">{formatCurrency(contract.totalValue + (contract.discountValue || 0))}</td>
                                        </tr>
                                        {contract.discountValue > 0 && (
                                            <tr className="text-green-600 italic">
                                                <td colSpan={2} className="p-3 text-right text-[10px] uppercase">Bonificações / Descontos:</td>
                                                <td className="p-3 text-right">- {formatCurrency(contract.discountValue)}</td>
                                            </tr>
                                        )}
                                        <tr className="bg-slate-900 text-white">
                                            <td colSpan={2} className="p-4 text-right text-[10px] uppercase tracking-widest font-black">Valor Final Líquido:</td>
                                            <td className="p-4 text-right text-2xl font-black">{formatCurrency(contract.totalValue)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </section>

                            <section>
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 border-b-2 border-slate-800 pb-2">2. Situação de Recebimentos</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {installments.map((inst, idx) => (
                                        <div key={idx} className="p-4 border rounded-xl flex justify-between items-center bg-slate-50/50">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-slate-400">{inst.installment === 'Entrada' ? 'SINAL' : `PARCELA ${inst.installment}`}</p>
                                                <p className="font-bold text-slate-800">{formatCurrency(inst.value)}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${inst.status.includes('Pago') ? 'bg-green-600 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                                                    {inst.status}
                                                </span>
                                                <p className="text-[9px] text-slate-400 mt-1 uppercase">Venc: {formatDate(inst.dueDate)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="bg-slate-50 p-8 rounded-3xl grid grid-cols-3 gap-8 text-center border-2 border-dashed border-slate-200">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Já Pago</p>
                                    <p className="text-xl font-black text-green-600">{formatCurrency(financialSummary.totalPaid)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Remanescente</p>
                                    <p className="text-xl font-black text-blue-600">{formatCurrency(financialSummary.totalPending)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Execução da Obra</p>
                                    <p className="text-xl font-black text-slate-900">{progressPercent}%</p>
                                </div>
                            </div>

                            <footer className="mt-20 pt-10 border-t border-slate-200 flex justify-between px-10">
                                <div className="text-center">
                                    <div className="w-48 h-px bg-slate-300 mb-2 mx-auto"></div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contratante</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-48 h-px bg-slate-300 mb-2 mx-auto"></div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Responsável Técnico</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{systemSettings?.companyName || 'ARQUITETO'}</p>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REGISTRAR ATUALIZAÇÃO (Existente) */}
            {isAddUpdateOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Novo Registro de Diário</h3>
                                <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">O que mudou no projeto hoje?</p>
                            </div>
                            <button onClick={() => setIsAddUpdateOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none">
                                <XIcon className="w-10 h-10 text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={submitUpdate} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Registro</label>
                                    <input type="date" required value={updateForm.date} onChange={e => setUpdateForm({...updateForm, date: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fotos (Múltiplas)</label>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-12 px-4 bg-purple-50 border-2 border-purple-100 border-dashed text-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center hover:bg-purple-100 transition-all">
                                        <CameraIcon className="w-5 h-5 mr-2" /> {updateForm.photos.length > 0 ? `${updateForm.photos.length} Fotos Selecionadas` : 'Subir Fotos Obra'}
                                    </button>
                                    <input type="file" ref={fileInputRef} multiple onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O que foi realizado?</label>
                                <textarea required rows={3} value={updateForm.description} onChange={e => setUpdateForm({...updateForm, description: e.target.value})} placeholder="Resumo das atividades técnicas or decisões tomadas..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Próximos Passos (Planejamento)</label>
                                <input type="text" value={updateForm.nextSteps} onChange={e => setUpdateForm({...updateForm, nextSteps: e.target.value})} placeholder="O que o cliente deve esperar a seguir?" className="w-full h-12 px-4 bg-blue-50/30 border-2 border-blue-50 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsAddUpdateOpen(false)} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all">
                                    Salvar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectPortal;
