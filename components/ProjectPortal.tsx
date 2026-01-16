
import React, { useState, useMemo, useRef } from 'react';
import { Contract, ProjectSchedule, ProjectChecklist, ProjectChecklistItem, PaymentInstallment, VisitLog, Meeting, ProjectUpdate, Note } from '../types';
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
    PencilIcon
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
    onBack 
}) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'visitas' | 'financeiro' | 'checklist' | 'mural'>('geral');
    const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);
    const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
    
    const [visitForm, setVisitForm] = useState({ date: new Date().toISOString().split('T')[0], notes: '' });
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

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        (Array.from(files) as File[]).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUpdateForm(prev => ({
                    ...prev,
                    photos: [...prev.photos, reader.result as string]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const submitVisit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddVisitLog({ ...visitForm, contractId: contract.id });
        setIsAddVisitOpen(false);
        setVisitForm({ date: new Date().toISOString().split('T')[0], notes: '' });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        onAddProjectUpdate({ ...updateForm, contractId: contract.id });
        setIsAddUpdateOpen(false);
        setUpdateForm({ date: new Date().toISOString().split('T')[0], description: '', nextSteps: '', photos: [] });
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
                    <div className="text-center md:text-right">
                         <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest ${contract.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            PROJETO {contract.status}
                         </span>
                    </div>
                </div>
                <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Progresso Geral do Escopo</span>
                        <span>{progressPercent}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </header>

            <div className="flex border-b border-slate-200 space-x-2 md:space-x-4 no-print overflow-x-auto">
                {[
                    { id: 'geral', label: 'Cronograma', icon: <TrendingUpIcon className="w-4 h-4" /> },
                    { id: 'mural', label: 'Mural & Fotos', icon: <CameraIcon className="w-4 h-4" /> },
                    { id: 'checklist', label: 'Andamento Técnico', icon: <CheckCircleIcon className="w-4 h-4" /> },
                    { id: 'visitas', label: 'Visitas', icon: <MapPinIcon className="w-4 h-4" /> },
                    { id: 'financeiro', label: 'Financeiro', icon: <DollarIcon className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center whitespace-nowrap px-4 pb-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="mr-2">{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'geral' && (
                <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 space-y-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase flex items-center">
                        <TrendingUpIcon className="w-6 h-6 mr-3 text-blue-500" /> Fluxo de Etapas
                    </h3>
                    <div className="space-y-4">
                        {schedule?.stages.map((stage, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${stage.completionDate ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {stage.completionDate ? <CheckCircleIcon className="w-6 h-6" /> : idx + 1}
                                </div>
                                <div className="flex-1 border-b border-slate-50 pb-2">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-slate-800 uppercase text-sm">{stage.name}</p>
                                        {stage.completionDate && <span className="text-[9px] font-black text-green-600 uppercase">Concluído em {formatDate(stage.completionDate)}</span>}
                                    </div>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold">Entrega prevista: {formatDate(stage.deadline)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'mural' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100">
                            <h3 className="text-lg font-black text-slate-800 uppercase mb-6 flex items-center">
                                <NotepadIcon className="w-5 h-5 mr-3 text-blue-500" /> Mural de Recados
                            </h3>
                            <div className="space-y-4">
                                {notes.length === 0 && <p className="text-xs text-slate-400 italic">Nenhum recado fixado.</p>}
                                {notes.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(note => (
                                    <div key={note.id} className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl relative group">
                                        <p className="text-[10px] font-black text-blue-400 uppercase mb-1">{formatDate(note.createdAt)}</p>
                                        <h4 className="font-bold text-slate-800 text-sm mb-1">{note.title}</h4>
                                        <p className="text-xs text-slate-600 leading-relaxed">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                             <h3 className="text-lg font-black text-slate-800 uppercase flex items-center">
                                <CameraIcon className="w-5 h-5 mr-3 text-purple-500" /> Fotos & Acompanhamento
                            </h3>
                            <button onClick={() => setIsAddUpdateOpen(true)} className="px-4 py-2 bg-slate-900 text-white font-black text-[10px] uppercase rounded-xl hover:bg-purple-600 transition-all">
                                + Novo Registro
                            </button>
                        </div>

                        <div className="space-y-6">
                            {updates.length === 0 && (
                                <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-slate-100 text-center opacity-40">
                                    <CameraIcon className="w-12 h-12 mx-auto mb-4" />
                                    <p className="font-bold uppercase text-xs">Ainda não há fotos desta obra.</p>
                                </div>
                            )}
                            {updates.sort((a,b) => b.date.localeCompare(a.date)).map(update => (
                                <div key={update.id} className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{formatDate(update.date)}</span>
                                        <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase">Update Obra</span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{update.description}</p>
                                    
                                    {update.photos && update.photos.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {update.photos.map((photo, pIdx) => (
                                                <div key={pIdx} className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group cursor-pointer">
                                                    <img src={photo} alt="Obra" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {update.nextSteps && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded-xl">
                                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Próximos Passos:</p>
                                            <p className="text-xs text-slate-600">{update.nextSteps}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'checklist' && (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <h3 className="text-2xl font-black text-slate-800 uppercase flex items-center">
                                <CheckCircleIcon className="w-8 h-8 mr-3 text-green-500" /> Andamento Técnico & Montagem
                            </h3>
                        </div>

                        <div className="space-y-12">
                            {Object.entries(groupedChecklist).length === 0 && (
                                <p className="text-center text-slate-400 italic">Nenhum item técnico configurado.</p>
                            )}
                            {(Object.entries(groupedChecklist) as [string, ProjectChecklistItem[]][]).sort().map(([stage, items]) => {
                                const stageTotal = items.length;
                                const stageDone = items.filter(it => it.completed).length;
                                const stageProgress = Math.round((stageDone / stageTotal) * 100);

                                return (
                                    <div key={stage} className="space-y-4">
                                        <div className="flex justify-between items-end border-b-2 border-slate-100 pb-2">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">{stage}</h4>
                                            <span className="text-[10px] font-black text-slate-400">{stageProgress}%</span>
                                        </div>
                                        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${stageProgress}%` }}></div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                            {items.map(item => (
                                                <div 
                                                    key={item.id} 
                                                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${item.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 shadow-sm'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 flex items-center justify-center rounded-md border-2 ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 text-transparent'}`}>
                                                            <CheckCircleIcon className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <span className={`text-sm font-bold transition-all ${item.completed ? 'text-slate-400 line-through italic' : 'text-slate-700'}`}>{item.text}</span>
                                                            {item.completed && item.completionDate && (
                                                                <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mt-0.5">Finalizado em: {item.completionDate}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Botões de Ação Contextuais */}
                                        <div className="flex flex-wrap gap-3 mt-4">
                                            {stage.includes('Medição') && (
                                                <button className="flex items-center px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                    <UploadIcon className="w-4 h-4 mr-2" /> Relatório de Medição
                                                </button>
                                            )}
                                            {stage.includes('Projeto') && (
                                                <>
                                                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg">
                                                        <EyeIcon className="w-4 h-4 mr-2" /> Abrir 3D
                                                    </button>
                                                    <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-green-700 shadow-sm">
                                                        <CheckCircleIcon className="w-4 h-4 mr-2" /> Aprovar Móveis
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
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
        </div>
    );
};

export default ProjectPortal;
