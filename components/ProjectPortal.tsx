
import React, { useState, useMemo, useRef } from 'react';
import { Contract, ProjectSchedule, ProjectChecklist, PaymentInstallment, SystemSettings, ProjectStage, Meeting, ProjectUpdate } from '../types';
import { 
    ChevronLeftIcon, 
    CheckCircleIcon, 
    CalendarIcon, 
    DollarIcon, 
    MapPinIcon, 
    PrinterIcon, 
    ArchitectIcon,
    PencilIcon,
    TrendingUpIcon,
    FileTextIcon,
    SparklesIcon,
    VideoCameraIcon,
    HistoryIcon,
    CameraIcon,
    PlusIcon,
    XIcon,
    // Fix: Added missing UsersIcon import
    UsersIcon
} from './Icons';

const PRODUCTION_CHECKLIST_TEMPLATE = [
    { id: 1, stage: 'Briefing', text: 'Reunião de alinhamento de expectativas' },
    { id: 2, stage: 'Briefing', text: 'Coleta de referências do cliente (Moodboard)' },
    { id: 3, stage: 'Briefing', text: 'Preenchimento do programa de necessidades' },
    { id: 4, stage: 'Medição', text: 'Levantamento métrico completo' },
    { id: 5, stage: 'Medição', text: 'Registro fotográfico de todos os ângulos' },
    { id: 6, stage: 'Medição', text: 'Verificação de pontos hidráulicos e elétricos existentes' },
    { id: 7, stage: 'Layout', text: 'Definição de fluxos e circulações' },
    { id: 8, stage: 'Layout', text: 'Zonemanento funcional dos ambientes' },
    { id: 9, stage: 'Layout', text: 'Aprovação do layout preliminar com cliente' },
    { id: 10, stage: '3D', text: 'Modelagem detalhada de mobiliário' },
    { id: 11, stage: '3D', text: 'Aplicação de materiais e texturas reais' },
    { id: 12, stage: 'Renderização', text: 'Configuração de iluminação natural/artificial' },
    { id: 13, stage: 'Renderização', text: 'Renderização em alta resolução (4K)' },
    { id: 14, stage: 'Projeto Executivo', text: 'Planta de demolição e construção' },
    { id: 15, stage: 'Projeto Executivo', text: 'Planta de pontos elétricos e iluminação' },
    { id: 16, stage: 'Projeto Executivo', text: 'Planta de forro e gesso' },
    { id: 17, stage: 'Projeto Executivo', text: 'Detalhamento de marcenaria e marmoraria' },
    { id: 18, stage: 'Entrega', text: 'Emissão de RRT/ART' },
    { id: 19, stage: 'Entrega', text: 'Entrega do Caderno de Projeto (PDF)' },
    { id: 20, stage: 'Entrega', text: 'Envio de lista de compras/fornecedores' },
];

interface ProjectPortalProps {
    contract: Contract;
    schedule?: ProjectSchedule;
    checklist: ProjectChecklist;
    installments: PaymentInstallment[];
    systemSettings: SystemSettings;
    meetings: Meeting[];
    updates: ProjectUpdate[];
    onUpdateSchedule: (schedule: ProjectSchedule) => void;
    onUpdateChecklist: (checklist: ProjectChecklist) => void;
    onAddMeeting: (meeting: Omit<Meeting, 'id'>) => void;
    onAddUpdate: (update: Omit<ProjectUpdate, 'id'>) => void;
    onBack: () => void;
}

const ProjectPortal: React.FC<ProjectPortalProps> = ({ 
    contract, 
    schedule, 
    checklist, 
    installments, 
    systemSettings,
    meetings,
    updates,
    onUpdateSchedule,
    onUpdateChecklist,
    onAddMeeting,
    onAddUpdate,
    onBack 
}) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'diario' | 'reunioes' | 'producao' | 'financeiro'>('geral');
    const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
    const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
    
    // Form States
    const [meetingForm, setMeetingForm] = useState({ title: '', date: new Date().toISOString().split('T')[0], participants: '', summary: '', decisions: '' });
    const [updateForm, setUpdateForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', nextSteps: '', photos: [] as string[] });

    const formatDate = (date: any) => date ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date)) : '-';
    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const progressPercent = useMemo(() => {
        if (!schedule || schedule.stages.length === 0) return 0;
        const completed = schedule.stages.filter(s => s.completionDate).length;
        return Math.round((completed / schedule.stages.length) * 100);
    }, [schedule]);

    const handleToggleCheckItem = (id: number) => {
        const newIds = checklist.completedItemIds.includes(id)
            ? checklist.completedItemIds.filter(item => item !== id)
            : [...checklist.completedItemIds, id];
        onUpdateChecklist({ ...checklist, completedItemIds: newIds });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUpdateForm(prev => ({ ...prev, photos: [...prev.photos, reader.result as string] }));
            };
            reader.readAsDataURL(file);
        }
    };

    const submitMeeting = (e: React.FormEvent) => {
        e.preventDefault();
        onAddMeeting({ ...meetingForm, contractId: contract.id });
        setIsAddMeetingOpen(false);
        setMeetingForm({ title: '', date: new Date().toISOString().split('T')[0], participants: '', summary: '', decisions: '' });
    };

    const submitUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        onAddUpdate({ ...updateForm, contractId: contract.id });
        setIsAddUpdateOpen(false);
        setUpdateForm({ date: new Date().toISOString().split('T')[0], description: '', nextSteps: '', photos: [] });
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            <div className="flex items-center justify-between no-print">
                <button onClick={onBack} className="flex items-center text-slate-500 hover:text-blue-600 font-bold transition-colors uppercase text-xs tracking-widest">
                    <ChevronLeftIcon className="w-5 h-5 mr-2" /> VOLTAR PARA LISTA
                </button>
                <div className="flex space-x-3">
                    <button onClick={() => window.print()} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-bold text-xs shadow-sm flex items-center">
                        <PrinterIcon className="w-4 h-4 mr-2" /> PDF / COMPARTILHAR
                    </button>
                </div>
            </div>

            <header className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-200 text-white">
                            <ArchitectIcon className="w-12 h-12" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{contract.serviceType}</span>
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">PROJETO ATIVO</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{contract.projectName}</h1>
                            <p className="text-slate-500 font-bold mt-2 uppercase text-xs tracking-widest flex items-center">
                                <UsersIcon className="w-4 h-4 mr-2" /> CLIENTE: {contract.clientName}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                        <div className="text-center border-r border-slate-200 pr-8">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Início</p>
                            <p className="font-black text-slate-800">{formatDate(contract.date)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Entrega Final</p>
                            <p className="font-black text-blue-600">{schedule ? formatDate(schedule.stages[schedule.stages.length-1]?.deadline) : '-'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-black text-slate-800 uppercase tracking-widest italic">EVOLUÇÃO DO PROJETO: {progressPercent}%</span>
                        <span className="text-xs font-bold text-slate-400">JORNADA DE PRODUÇÃO</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                        <div className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </header>

            <div className="flex border-b border-slate-200 space-x-1 overflow-x-auto no-print scrollbar-hide">
                {[
                    { id: 'geral', label: 'Visão Geral', icon: <TrendingUpIcon className="w-4 h-4" /> },
                    { id: 'diario', label: 'Diário / Progresso', icon: <HistoryIcon className="w-4 h-4" /> },
                    { id: 'reunioes', label: 'Reuniões / Atas', icon: <VideoCameraIcon className="w-4 h-4" /> },
                    { id: 'producao', label: 'Checklist Técnico', icon: <CheckCircleIcon className="w-4 h-4" /> },
                    { id: 'financeiro', label: 'Financeiro', icon: <DollarIcon className="w-4 h-4" /> }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center px-6 pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <span className="mr-2">{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* GERAL */}
            {activeTab === 'geral' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center">
                                <TrendingUpIcon className="w-6 h-6 mr-3 text-blue-500" /> Cronograma de Entregas
                            </h3>
                            <div className="space-y-6">
                                {schedule?.stages.map((stage, idx) => {
                                    const isCompleted = !!stage.completionDate;
                                    const isCurrent = !isCompleted && schedule.stages.slice(0, idx).every(s => s.completionDate);
                                    return (
                                        <div key={idx} className={`flex items-center gap-6 group transition-all ${isCompleted ? 'opacity-50' : 'opacity-100'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0 transition-all border-2 ${isCompleted ? 'bg-green-50 border-green-500 text-green-600' : isCurrent ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-110' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>
                                                {isCompleted ? <CheckCircleIcon className="w-8 h-8" /> : idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className={`font-black uppercase text-sm ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>{stage.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {isCompleted ? `Entregue em ${formatDate(stage.completionDate)}` : `Prazo: ${formatDate(stage.deadline)}`}
                                                    </p>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-600 animate-pulse' : 'bg-slate-200'}`} style={{ width: isCompleted ? '100%' : isCurrent ? '30%' : '0%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center">
                                <MapPinIcon className="w-6 h-6 mr-3 text-red-500" /> Local do Projeto
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Endereço da Obra</p>
                                    <p className="font-bold text-slate-700 text-base leading-relaxed">
                                        {contract.projectAddress.street}, {contract.projectAddress.number}<br/>
                                        {contract.projectAddress.district} - {contract.projectAddress.city}/{contract.projectAddress.state}<br/>
                                        CEP: {contract.projectAddress.cep}
                                    </p>
                                </div>
                                <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200">Ver Local no Maps</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DIÁRIO / PROGRESSO */}
            {activeTab === 'diario' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center no-print">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Diário de Bordo do Projeto</h2>
                        <button onClick={() => setIsAddUpdateOpen(true)} className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
                            <PlusIcon className="w-4 h-4 mr-2" /> Registrar Progresso
                        </button>
                    </div>

                    <div className="space-y-12 relative before:absolute before:inset-0 before:left-8 before:w-0.5 before:bg-slate-100 before:h-full">
                        {updates.length === 0 && (
                            <div className="bg-white p-20 rounded-3xl border-4 border-dashed border-slate-100 text-center relative z-10">
                                <HistoryIcon className="w-16 h-16 mx-auto text-slate-200 mb-6" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhuma atualização registrada ainda.</p>
                            </div>
                        )}
                        {updates.sort((a,b) => b.date.localeCompare(a.date)).map((update) => (
                            <div key={update.id} className="relative pl-20 group">
                                <div className="absolute left-6 top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-md z-10"></div>
                                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:border-blue-300 transition-all">
                                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <CalendarIcon className="w-4 h-4 text-blue-500" />
                                            <span className="font-black text-sm text-slate-800 uppercase tracking-widest">{formatDate(update.date)}</span>
                                        </div>
                                    </div>
                                    <div className="p-8">
                                        <p className="text-slate-600 font-medium text-lg leading-relaxed">{update.description}</p>
                                        <div className="mt-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">Próximos Passos</p>
                                            <p className="text-blue-900 font-bold text-sm italic">"{update.nextSteps}"</p>
                                        </div>
                                        {update.photos && update.photos.length > 0 && (
                                            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {update.photos.map((photo, i) => (
                                                    <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-lg border-2 border-white">
                                                        <img src={photo} alt="Progresso" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* REUNIÕES / ATAS */}
            {activeTab === 'reunioes' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center no-print">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestão de Reuniões e Decisões</h2>
                        <button onClick={() => setIsAddMeetingOpen(true)} className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                            <PlusIcon className="w-4 h-4 mr-2" /> Agendar / Registrar Ata
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {meetings.length === 0 && (
                             <div className="col-span-full bg-white p-20 rounded-3xl border-4 border-dashed border-slate-100 text-center">
                                <VideoCameraIcon className="w-16 h-16 mx-auto text-slate-200 mb-6" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhuma reunião registrada.</p>
                            </div>
                        )}
                        {meetings.sort((a,b) => b.date.localeCompare(a.date)).map((meeting) => (
                            <div key={meeting.id} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col hover:border-indigo-300 transition-all group">
                                <div className="p-6 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
                                    <span className="font-black text-xs text-indigo-700 uppercase tracking-widest">{formatDate(meeting.date)}</span>
                                    <div className="px-3 py-1 bg-white text-indigo-600 text-[10px] font-black rounded-full uppercase border border-indigo-100 shadow-sm">ATA DE REUNIÃO</div>
                                </div>
                                <div className="p-8 flex-1 space-y-6">
                                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">{meeting.title}</h3>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Participantes</p>
                                        <p className="text-slate-600 font-bold text-sm">{meeting.participants}</p>
                                    </div>
                                    <div className="border-t border-slate-100 pt-6">
                                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-3">Principais Decisões</p>
                                        <div className="bg-indigo-50/30 p-4 rounded-xl text-slate-700 font-medium text-sm leading-relaxed border border-indigo-50">
                                            {meeting.decisions}
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Resumo da Conversa (Ata)</p>
                                        <p className="text-slate-500 text-xs italic leading-relaxed">{meeting.summary}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                    <button className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center justify-center w-full">
                                        <PrinterIcon className="w-3 h-3 mr-2" /> Baixar Ata Completa PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PRODUÇÃO / CHECKLIST */}
            {activeTab === 'producao' && (
                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-10 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Controle de Processos</h2>
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Transparência técnica e segurança para o cliente.</p>
                        </div>
                        <div className="flex items-center bg-blue-600 px-6 py-3 rounded-2xl text-white shadow-xl shadow-blue-900/40">
                            <SparklesIcon className="w-5 h-5 mr-3" />
                            <span className="font-black text-sm uppercase tracking-widest">{Math.round((checklist.completedItemIds.length / PRODUCTION_CHECKLIST_TEMPLATE.length) * 100)}% COMPLETO</span>
                        </div>
                    </div>
                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {Array.from(new Set(PRODUCTION_CHECKLIST_TEMPLATE.map(i => i.stage))).map(stageName => (
                            <div key={stageName} className="space-y-6">
                                <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] border-b-2 border-blue-50 pb-3">{stageName}</h4>
                                <div className="space-y-4">
                                    {PRODUCTION_CHECKLIST_TEMPLATE.filter(i => i.stage === stageName).map(item => {
                                        const isChecked = checklist.completedItemIds.includes(item.id);
                                        return (
                                            <div 
                                                key={item.id} 
                                                onClick={() => handleToggleCheckItem(item.id)}
                                                className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${isChecked ? 'bg-green-50 border-green-200 opacity-60' : 'bg-slate-50 border-slate-100 hover:border-blue-400'}`}
                                            >
                                                <div className={`mt-0.5 w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center border-2 ${isChecked ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'border-slate-300 bg-white'}`}>
                                                    {isChecked && <CheckCircleIcon className="w-4 h-4" />}
                                                </div>
                                                <span className={`text-xs font-bold leading-relaxed tracking-tight ${isChecked ? 'text-green-800 line-through' : 'text-slate-700'}`}>{item.text}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FINANCEIRO */}
            {activeTab === 'financeiro' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center">
                                <DollarIcon className="w-6 h-6 mr-3 text-green-500" /> Fluxo de Pagamentos
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-slate-100">
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            <th className="pb-6">Parcela / Referência</th>
                                            <th className="pb-6">Vencimento</th>
                                            <th className="pb-6 text-right">Valor Bruto</th>
                                            <th className="pb-6 text-center">Situação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {installments.map((inst, i) => (
                                            <tr key={i} className="group">
                                                <td className="py-6 text-sm font-bold text-slate-800 uppercase tracking-tight">{inst.installment === 'Entrada' ? 'Sinal / Entrada' : `Parcela ${inst.installment}`}</td>
                                                <td className="py-6 text-sm text-slate-500 font-medium">{formatDate(inst.dueDate)}</td>
                                                <td className="py-6 text-sm font-black text-slate-900 text-right">{formatCurrency(inst.value)}</td>
                                                <td className="py-6 text-center">
                                                    <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${inst.status.includes('Pago') ? 'bg-green-100 text-green-700 shadow-sm shadow-green-50' : 'bg-amber-100 text-amber-700 shadow-sm shadow-amber-50'}`}>
                                                        {inst.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-[80px] opacity-20"></div>
                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-500 mb-10">Consolidado Financeiro</h3>
                            <div className="space-y-10 relative z-10">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Investimento Total</p>
                                    <p className="text-4xl font-black tracking-tighter">{formatCurrency(contract.totalValue)}</p>
                                </div>
                                <div className="pt-10 border-t border-white/10 space-y-6">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest">Total Liquidado:</span>
                                        <span className="font-black text-green-400">{formatCurrency(installments.filter(i => i.status.includes('Pago')).reduce((acc, curr) => acc + curr.value, 0))}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-500 uppercase tracking-widest">Saldo a Pagar:</span>
                                        <span className="font-black text-amber-400">{formatCurrency(installments.filter(i => i.status === 'Pendente').reduce((acc, curr) => acc + curr.value, 0))}</span>
                                    </div>
                                </div>
                                <div className="mt-10 bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <p className="text-[9px] font-bold text-slate-400 italic">Transparência Studio Battelli: Todos os valores seguem o contrato assinado em {formatDate(contract.date)}.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {isAddMeetingOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Nova Reunião / Ata</h3>
                            <button onClick={() => setIsAddMeetingOpen(false)} className="text-slate-400 hover:text-white transition-colors"><XIcon className="w-8 h-8" /></button>
                        </div>
                        <form onSubmit={submitMeeting} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assunto Principal</label>
                                    <input type="text" required value={meetingForm.title} onChange={e => setMeetingForm({...meetingForm, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200 focus:ring-indigo-600 font-bold" placeholder="Ex: Aprovação de Materiais" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data</label>
                                    <input type="date" required value={meetingForm.date} onChange={e => setMeetingForm({...meetingForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Participantes</label>
                                    <input type="text" required value={meetingForm.participants} onChange={e => setMeetingForm({...meetingForm, participants: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200" placeholder="Nomes..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ata / Resumo da Conversa</label>
                                    <textarea rows={3} required value={meetingForm.summary} onChange={e => setMeetingForm({...meetingForm, summary: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm" placeholder="O que foi conversado..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Decisões Finais (O que ficou acordado?)</label>
                                    <textarea rows={3} required value={meetingForm.decisions} onChange={e => setMeetingForm({...meetingForm, decisions: e.target.value})} className="w-full px-4 py-3 rounded-xl border-indigo-200 bg-indigo-50/50 text-sm font-bold" placeholder="Listar as aprovações e decisões importantes..." />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">Registrar Reunião</button>
                        </form>
                    </div>
                </div>
            )}

            {isAddUpdateOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tight">Registrar Evolução Diária</h3>
                            <button onClick={() => setIsAddUpdateOpen(false)} className="text-blue-200 hover:text-white transition-colors"><XIcon className="w-8 h-8" /></button>
                        </div>
                        <form onSubmit={submitUpdate} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Data da Atividade</label>
                                <input type="date" required value={updateForm.date} onChange={e => setUpdateForm({...updateForm, date: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">O que foi feito hoje?</label>
                                <textarea rows={4} required value={updateForm.description} onChange={e => setUpdateForm({...updateForm, description: e.target.value})} className="w-full px-4 py-3 rounded-xl border-slate-200 text-sm font-medium" placeholder="Ex: Finalizada modelagem 3D da cozinha, iniciada iluminação..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">O que será feito amanhã?</label>
                                <input type="text" required value={updateForm.nextSteps} onChange={e => setUpdateForm({...updateForm, nextSteps: e.target.value})} className="w-full px-4 py-3 rounded-xl border-blue-200 bg-blue-50/50 font-bold" placeholder="Próxima etapa imediata..." />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Anexar Fotos do Progresso</label>
                                <div className="flex flex-wrap gap-4">
                                    {updateForm.photos.map((p, i) => (
                                        <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-slate-100"><img src={p} className="w-full h-full object-cover" /></div>
                                    ))}
                                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-all">
                                        <PlusIcon className="w-6 h-6 text-slate-400" />
                                        <input type="file" hidden onChange={handlePhotoUpload} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 transition-all">Publicar Atualização</button>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.23, 1, 0.32, 1); }
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ProjectPortal;
