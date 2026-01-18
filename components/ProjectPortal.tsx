
import React, { useState, useMemo, useRef } from 'react';
import { Contract, ProjectSchedule, ProjectChecklist, ProjectChecklistItem, PaymentInstallment, VisitLog, Meeting, ProjectUpdate, Note, SystemSettings } from '../types';
import { ChevronLeftIcon, CheckCircleIcon, DollarIcon, MapPinIcon, PrinterIcon, ArchitectIcon, TrendingUpIcon, VideoCameraIcon, HistoryIcon, PlusIcon, XIcon, UsersIcon, NotepadIcon, CameraIcon, UploadIcon, EyeIcon, PencilIcon, SendIcon, ReceiptIcon } from './Icons';

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

const ProjectPortal: React.FC<ProjectPortalProps> = ({ contract, schedule, checklist, installments, notes, updates, visitLogs, onAddVisitLog, onAddProjectUpdate, onUpdateChecklist, onBack, systemSettings }) => {
    const [activeTab, setActiveTab] = useState<'geral' | 'mural' | 'checklist' | 'visitas' | 'financeiro'>('geral');
    const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    
    const [updateForm, setUpdateForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', nextSteps: '', photos: [] as string[] });
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

    const financialSummary = useMemo(() => {
        const totalPaid = installments.filter(i => i.status.includes('Pago')).reduce((acc, i) => acc + i.value, 0);
        const totalPending = installments.filter(i => !i.status.includes('Pago')).reduce((acc, i) => acc + i.value, 0);
        return { totalPaid, totalPending };
    }, [installments]);

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        // Fix: Explicitly type 'file' as 'File' to resolve 'unknown' assignment error in readAsDataURL
        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onloadend = () => setUpdateForm(prev => ({ ...prev, photos: [...prev.photos, reader.result as string] }));
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
        const msg = `*RELATÓRIO: ${contract.projectName.toUpperCase()}*\n\nProgresso: ${progressPercent}%\nStatus: Em andamento técnico.\nVisitas: ${visitsDone}/${visitsTotal}`;
        window.open(`https://wa.me/${contract.clientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20 uppercase">
            <div className="flex items-center justify-between no-print">
                <button onClick={onBack} className="text-slate-500 font-black text-[10px] tracking-widest transition-colors flex items-center">
                    <ChevronLeftIcon className="w-4 h-4 mr-1" /> VOLTAR
                </button>
                <div className="flex gap-2">
                    <button onClick={() => setIsReceiptModalOpen(true)} className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg flex items-center"><ReceiptIcon className="w-4 h-4 mr-2" /> EXTRATO COMPACTO</button>
                    <button onClick={generateWhatsAppReport} className="px-4 py-2 bg-green-600 text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg flex items-center"><SendIcon className="w-4 h-4 mr-2" /> WHATSAPP</button>
                </div>
            </div>

            <header className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-[var(--primary-color)] rounded-2xl flex items-center justify-center text-white shadow-xl"><ArchitectIcon className="w-8 h-8" /></div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">{contract.projectName}</h1>
                            <p className="text-slate-400 font-bold text-[9px] tracking-widest mt-1">CLIENTE: {contract.clientName}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <span className="bg-green-500 text-white px-4 py-1.5 rounded-full font-black text-[9px] tracking-widest shadow-sm">PROJETO ATIVO</span>
                    </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                    <div className="h-full bg-[var(--primary-color)] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </header>

            <div className="flex border-b border-slate-200 space-x-6 overflow-x-auto no-print">
                {['geral', 'mural', 'checklist', 'visitas', 'financeiro'].map((t) => (
                    <button key={t} onClick={() => setActiveTab(t as any)} className={`pb-4 text-[10px] font-black tracking-widest transition-all relative ${activeTab === t ? 'text-[var(--primary-color)]' : 'text-slate-400'}`}>
                        {t.toUpperCase()}
                        {activeTab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--primary-color)] rounded-full"></div>}
                    </button>
                ))}
            </div>

            {activeTab === 'geral' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
                                <TrendingUpIcon className="w-5 h-5 mr-3 text-[var(--primary-color)]" /> CRONOGRAMA DE ETAPAS
                            </h3>
                            <div className="space-y-6">
                                {schedule?.stages.map((stage, idx) => (
                                    <div key={stage.id} className="flex items-center gap-6">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${stage.completionDate ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            {stage.completionDate ? <CheckCircleIcon className="w-5 h-5" /> : idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className={`text-sm font-bold ${stage.completionDate ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{stage.name}</p>
                                                <span className="text-[9px] font-black text-slate-400">{formatDate(stage.deadline)}</span>
                                            </div>
                                            <div className="w-full h-1 bg-slate-50 rounded-full mt-2">
                                                <div className={`h-full rounded-full ${stage.completionDate ? 'bg-green-500' : 'bg-slate-200'}`} style={{ width: stage.completionDate ? '100%' : '0%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center text-blue-400">
                                <MapPinIcon className="w-5 h-5 mr-3" /> LOCALIZAÇÃO DO PROJETO
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ENDEREÇO DA OBRA</p>
                                    <p className="text-lg font-bold">{contract.projectAddress.street}, {contract.projectAddress.number}</p>
                                    <p className="text-sm text-slate-400">{contract.projectAddress.district} &bull; {contract.projectAddress.city} - {contract.projectAddress.state}</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2">TIPO DE SERVIÇO</p>
                                    <p className="text-xl font-black">{contract.serviceType}</p>
                                    <div className="mt-4 flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-slate-500 uppercase">Duração</p>
                                            <p className="font-bold">{contract.durationMonths} Meses</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[8px] font-black text-slate-500 uppercase">Contrato</p>
                                            <p className="font-bold">#{contract.id.toString().slice(-4)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4"><MapPinIcon className="w-8 h-8" /></div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">SALDO DE VISITAS</h3>
                            <p className="text-4xl font-black text-slate-800 my-2">{visitsDone} / {visitsTotal}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">VISITAS REALIZADAS NO LOCAL</p>
                            <div className="mt-6 pt-6 border-t border-slate-50">
                                <p className="text-[9px] font-black text-slate-300 uppercase italic">Baixa realizada pelo arquiteto</p>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center"><DollarIcon className="w-4 h-4 mr-2 text-green-500" /> RESUMO FINANCEIRO</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">PAGO</span>
                                    <span className="text-lg font-black text-green-600">{formatCurrency(financialSummary.totalPaid)}</span>
                                </div>
                                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">PENDENTE</span>
                                    <span className="text-lg font-black text-blue-600">{formatCurrency(financialSummary.totalPending)}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}

            {activeTab === 'mural' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">MURAL DE ATUALIZAÇÕES</h2>
                        <button onClick={() => setIsAddUpdateOpen(true)} className="px-6 py-2 bg-[var(--primary-color)] text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg flex items-center"><PlusIcon className="w-4 h-4 mr-2" /> NOVA ATUALIZAÇÃO</button>
                    </div>

                    {isAddUpdateOpen && (
                        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-[var(--primary-color)] animate-slideUp">
                            <form onSubmit={submitUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">DATA</label>
                                        <input type="date" value={updateForm.date} onChange={e => setUpdateForm({ ...updateForm, date: e.target.value })} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">FOTOS (OPCIONAL)</label>
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl flex items-center justify-center gap-2 text-slate-400 font-bold"><CameraIcon className="w-5 h-5" /> {updateForm.photos.length} FOTOS</button>
                                        <input type="file" ref={fileInputRef} multiple onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">O QUE FOI FEITO?</label>
                                    <textarea rows={3} value={updateForm.description} onChange={e => setUpdateForm({ ...updateForm, description: e.target.value.toUpperCase() })} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold" placeholder="EX: FINALIZADA PINTURA DO LIVING..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase">PRÓXIMOS PASSOS</label>
                                    <input value={updateForm.nextSteps} onChange={e => setUpdateForm({ ...updateForm, nextSteps: e.target.value.toUpperCase() })} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold" placeholder="EX: INSTALAÇÃO DOS RODAPÉS..." />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsAddUpdateOpen(false)} className="px-6 py-2 font-black text-[10px] text-slate-400">CANCELAR</button>
                                    <button type="submit" className="px-10 py-3 bg-[var(--primary-color)] text-white font-black rounded-xl text-[10px] tracking-widest shadow-lg">PUBLICAR</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="space-y-10 relative pl-10 md:pl-16">
                        <div className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                        {updates.length === 0 && (
                            <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center opacity-40">
                                 <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                 <p className="font-black uppercase text-xs tracking-widest">Nenhuma atualização publicada</p>
                            </div>
                        )}
                        {updates.map(update => (
                            <div key={update.id} className="relative group">
                                <div className="absolute -left-[30px] md:-left-[42px] top-4 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 bg-[var(--primary-color)]"></div>
                                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                    <p className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest mb-2">{formatDate(update.date)}</p>
                                    <h3 className="text-lg font-black text-slate-800 mb-4">{update.description}</h3>
                                    
                                    {update.photos && update.photos.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                                            {update.photos.map((photo, pIdx) => (
                                                <div key={pIdx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                                                    <img src={photo} className="w-full h-full object-cover" alt="Obra" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {update.nextSteps && (
                                        <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-blue-500">
                                            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">PRÓXIMOS PASSOS</p>
                                            <p className="text-sm font-bold text-slate-700">{update.nextSteps}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'checklist' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">CHECKLIST DE ANDAMENTO</h2>
                        <div className="space-y-6">
                            {checklist.items.map(item => (
                                <div key={item.id} className={`flex items-center gap-6 p-5 rounded-2xl border-2 transition-all ${item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 text-slate-200'}`}>
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-bold uppercase ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.text}</p>
                                        <p className="text-[9px] font-black text-slate-400 mt-1">{item.stage.toUpperCase()}</p>
                                    </div>
                                    {item.completed && item.completionDate && (
                                        <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full">{item.completionDate}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'visitas' && (
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">REGISTRO DE VISITAS</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">ATA DE OBRA E CONFERÊNCIA TÉCNICA</p>
                            </div>
                            <div className="text-right">
                                <p className="text-4xl font-black text-[var(--primary-color)]">{visitsDone}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase">DE {visitsTotal} VISITAS</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {projectVisits.map(log => (
                                <div key={log.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[var(--primary-color)] shadow-sm"><MapPinIcon className="w-6 h-6" /></div>
                                            <p className="text-sm font-black text-slate-800">{formatDate(log.date)}</p>
                                        </div>
                                        <HistoryIcon className="w-5 h-5 text-slate-200" />
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed italic">"{log.notes}"</p>
                                </div>
                            ))}
                            {projectVisits.length === 0 && (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-slate-400 font-bold italic">Nenhuma visita técnica registrada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'financeiro' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">TOTAL PAGO</p>
                            <p className="text-3xl font-black text-green-600">{formatCurrency(financialSummary.totalPaid)}</p>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">A PAGAR</p>
                            <p className="text-3xl font-black text-blue-600">{formatCurrency(financialSummary.totalPending)}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase">PARCELA</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase">VENCIMENTO</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase">VALOR</th>
                                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-right">STATUS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {installments.map(inst => (
                                    <tr key={inst.id}>
                                        <td className="p-6 text-sm font-black text-slate-700">{inst.installment}</td>
                                        <td className="p-6 text-sm font-bold text-slate-500">{formatDate(inst.dueDate)}</td>
                                        <td className="p-6 text-sm font-black text-slate-800">{formatCurrency(inst.value)}</td>
                                        <td className="p-6 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${inst.status.includes('Pago') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {inst.status.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isReceiptModalOpen && (
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <style>{`
                        @media print {
                            body * { visibility: hidden; }
                            .print-content, .print-content * { visibility: visible; }
                            .print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 1cm; background: white; font-size: 10pt; }
                            .no-print { display: none !important; }
                        }
                    `}</style>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto print-content">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center no-print">
                            <h2 className="font-black text-sm tracking-widest">EXTRATO CONSOLIDADO</h2>
                            <div className="flex gap-2">
                                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 rounded-lg text-[9px] font-black"><PrinterIcon className="w-4 h-4 inline mr-1"/> IMPRIMIR</button>
                                <button onClick={() => setIsReceiptModalOpen(false)} className="p-2 text-slate-400"><XIcon className="w-6 h-6"/></button>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="flex justify-between border-b-2 border-slate-900 pb-4">
                                <div>
                                    <h3 className="text-lg font-black">{systemSettings?.companyName}</h3>
                                    <p className="text-[9px] text-slate-500">{systemSettings?.professionalName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-sm uppercase">{contract.projectName}</p>
                                    <p className="text-[9px] text-slate-500 italic">DATA: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>

                            <section>
                                <h4 className="text-[10px] font-black bg-slate-100 p-1 mb-2">DADOS DO CLIENTE</h4>
                                <p className="font-bold text-sm">{contract.clientName}</p>
                                <p className="text-[9px] text-slate-500">{contract.clientEmail} | {contract.clientPhone}</p>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black bg-slate-100 p-1 mb-2">RESUMO FINANCEIRO</h4>
                                <table className="w-full text-[11px]">
                                    <tbody>
                                        <tr className="border-b font-bold">
                                            <td className="py-2">VALOR TOTAL DO CONTRATO:</td>
                                            <td className="py-2 text-right">{formatCurrency(contract.totalValue)}</td>
                                        </tr>
                                        <tr className="border-b text-green-600 font-black">
                                            <td className="py-2">TOTAL PAGO ATÉ O MOMENTO:</td>
                                            <td className="py-2 text-right">{formatCurrency(financialSummary.totalPaid)}</td>
                                        </tr>
                                        <tr className="border-b text-blue-600 font-black">
                                            <td className="py-2">SALDO REMANESCENTE:</td>
                                            <td className="py-2 text-right">{formatCurrency(financialSummary.totalPending)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black bg-slate-100 p-1 mb-2">STATUS DE EXECUÇÃO</h4>
                                <div className="flex justify-between items-center text-[11px] font-bold">
                                    <span>PROGRESSO TÉCNICO:</span>
                                    <span>{progressPercent}% CONCLUÍDO</span>
                                </div>
                            </section>

                            <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between text-[9px] font-black">
                                <div className="w-40 border-t border-slate-400 pt-1 text-center">ASSINATURA CLIENTE</div>
                                <div className="w-40 border-t border-slate-400 pt-1 text-center">ARQUITETO(A)</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectPortal;
