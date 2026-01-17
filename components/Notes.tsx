
import React, { useState, useMemo } from 'react';
import { Note, Contract, VisitLog } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, NotepadIcon, MapPinIcon, XIcon, HistoryIcon, ArchitectIcon } from './Icons';

interface NotesProps {
    notes: Note[];
    visitLogs: VisitLog[];
    onUpdateNote: (note: Note) => void;
    onDeleteNote: (id: number) => void;
    onAddNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
    onAddVisitLog: (log: Omit<VisitLog, 'id' | 'createdAt'>) => void;
    contracts: Contract[];
}

const Notes: React.FC<NotesProps> = ({ notes, visitLogs, onUpdateNote, onDeleteNote, onAddNote, onAddVisitLog, contracts }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [formData, setFormData] = useState({ title: '', content: '', alertDate: '', contractId: '' });
    const [visitFormData, setVisitFormData] = useState({ date: new Date().toISOString().split('T')[0], notes: '', contractId: '' });
    const [selectedFilterContract, setSelectedFilterContract] = useState<string>('');

    // Active contracts for dropdown
    const activeContracts = contracts.filter(c => c.status === 'Ativo');

    const handleEdit = (note: Note) => {
        setEditingNote(note);
        setFormData({ 
            title: note.title, 
            content: note.content, 
            alertDate: note.alertDate || '',
            contractId: note.contractId ? note.contractId.toString() : ''
        });
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm('Tem certeza que deseja excluir esta nota?')) {
            onDeleteNote(id);
        }
    };

    const handleToggleComplete = (note: Note) => {
        onUpdateNote({ ...note, completed: !note.completed });
    };

    const handleSubmitNote = (e: React.FormEvent) => {
        e.preventDefault();
        const noteData = {
            title: formData.title.toUpperCase(),
            content: formData.content.toUpperCase(),
            alertDate: formData.alertDate,
            contractId: formData.contractId ? parseInt(formData.contractId) : undefined
        };

        if (editingNote) {
            onUpdateNote({ ...editingNote, ...noteData });
        } else {
            onAddNote({ ...noteData, completed: false });
        }
        setIsFormOpen(false);
        setEditingNote(null);
        setFormData({ title: '', content: '', alertDate: '', contractId: '' });
    };

    const handleSubmitVisit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitFormData.contractId) {
            alert('Selecione um projeto para a visita.');
            return;
        }
        onAddVisitLog({
            contractId: parseInt(visitFormData.contractId),
            date: visitFormData.date,
            notes: visitFormData.notes.toUpperCase()
        });
        setIsVisitModalOpen(false);
        setVisitFormData({ date: new Date().toISOString().split('T')[0], notes: '', contractId: '' });
        alert('Visita registrada com sucesso!');
    };

    // Filtered timeline (Notes + VisitLogs)
    const combinedTimeline = useMemo(() => {
        if (!selectedFilterContract) return [];
        const contractId = parseInt(selectedFilterContract);
        
        const filteredNotes = notes.filter(n => n.contractId === contractId).map(n => ({
            ...n,
            type: 'note' as const,
            sortDate: n.createdAt || new Date(0)
        }));

        const filteredVisits = visitLogs.filter(v => v.contractId === contractId).map(v => ({
            ...v,
            type: 'visit' as const,
            sortDate: new Date(v.date + 'T12:00:00')
        }));

        return [...filteredNotes, ...filteredVisits].sort((a, b) => 
            new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime()
        );
    }, [notes, visitLogs, selectedFilterContract]);

    const handleOpenNewNote = () => {
        setEditingNote(null); 
        setFormData({ 
            title: '', 
            content: '', 
            alertDate: '',
            contractId: selectedFilterContract
        }); 
        setIsFormOpen(true);
    };

    const handleOpenNewVisit = () => {
        setVisitFormData({
            date: new Date().toISOString().split('T')[0],
            notes: '',
            contractId: selectedFilterContract
        });
        setIsVisitModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-32 animate-fadeIn">
            <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex justify-between items-center transition-colors duration-500">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Notas & Visitas Técnicas</h1>
                    <p className="mt-1 text-blue-100 italic text-sm">Registre o dia a dia do seu estúdio e o histórico detalhado de cada obra.</p>
                </div>
                <NotepadIcon className="w-12 h-12 text-white/20" />
            </header>

            {/* Filter & Actions Bar */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-6">
                <div className="w-full lg:w-auto flex-1">
                    <label htmlFor="contract-filter" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Filtrar Histórico do Projeto</label>
                    <div className="flex items-center space-x-3">
                        <select
                            id="contract-filter"
                            value={selectedFilterContract}
                            onChange={(e) => setSelectedFilterContract(e.target.value)}
                            className="block w-full max-w-xl h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="">TODAS AS NOTAS (GERAL)</option>
                            {activeContracts.map(c => (
                                <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>
                            ))}
                        </select>
                        {selectedFilterContract && (
                            <button onClick={() => setSelectedFilterContract('')} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors">Limpar</button>
                        )}
                    </div>
                </div>

                <div className="flex gap-3 w-full lg:w-auto">
                    <button onClick={handleOpenNewVisit} className="flex-1 lg:flex-none px-6 h-12 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center">
                        <MapPinIcon className="w-4 h-4 mr-2 text-blue-400" /> Registrar Visita
                    </button>
                    <button onClick={handleOpenNewNote} className="flex-1 lg:flex-none px-6 h-12 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center">
                        <PlusIcon className="w-4 h-4 mr-2" /> Nova Nota
                    </button>
                </div>
            </div>

            {/* Note Form (Inline) */}
            {isFormOpen && (
                <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-blue-500 animate-slideUp">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">{editingNote ? 'Editar Nota' : 'Nova Nota de Texto'}</h2>
                        <button onClick={() => setIsFormOpen(false)}><XIcon className="w-6 h-6 text-slate-300" /></button>
                    </div>
                    <form onSubmit={handleSubmitNote} className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projeto Vinculado</label>
                                <select
                                    value={formData.contractId}
                                    onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                                    className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold outline-none"
                                >
                                    <option value="">GERAL (SEM VÍNCULO)</option>
                                    {activeContracts.map(c => (
                                        <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data de Alerta (Opcional)</label>
                                <input type="date" value={formData.alertDate} onChange={e => setFormData({ ...formData, alertDate: e.target.value })} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold outline-none" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Título / Assunto</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full h-11 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-black outline-none focus:border-blue-500" placeholder="Ex: FEEDBACK DE CORES, COMPRA DE REVESTIMENTO..." />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteúdo da Nota</label>
                            <textarea rows={4} required value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full p-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-medium outline-none focus:border-blue-500" placeholder="Escreva aqui os detalhes..." />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 font-black text-[10px] uppercase text-slate-400">Cancelar</button>
                            <button type="submit" className="px-10 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg">Salvar Nota</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Combined Timeline View (When Filtered) */}
            {selectedFilterContract ? (
                <div className="space-y-8 relative pl-10 md:pl-16">
                    <div className="absolute left-5 md:left-8 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                    {combinedTimeline.length === 0 && (
                        <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center opacity-40">
                             <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                             <p className="font-black uppercase text-xs tracking-widest">Nenhum registro para este projeto</p>
                        </div>
                    )}
                    {combinedTimeline.map((item: any) => (
                        <div key={item.id} className="relative group">
                            {/* Timeline Dot */}
                            <div className={`absolute -left-[30px] md:-left-[42px] top-4 w-5 h-5 rounded-full border-4 border-white shadow-md z-10 transition-transform group-hover:scale-125 ${item.type === 'visit' ? 'bg-slate-900' : 'bg-blue-600'}`}></div>
                            
                            <div className={`bg-white p-6 rounded-3xl border-2 transition-all group-hover:shadow-xl ${item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'border-slate-100'}`}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-slate-50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'visit' ? 'bg-slate-900 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                            {item.type === 'visit' ? <MapPinIcon className="w-6 h-6" /> : <NotepadIcon className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                {item.type === 'visit' ? 'Visita de Obra' : 'Nota de Histórico'}
                                            </span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                                                {new Date(item.sortDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {item.type === 'note' && (
                                            <button onClick={() => handleToggleComplete(item)} className={`${item.completed ? 'text-green-500' : 'text-slate-200 hover:text-green-500'} transition-colors`}>
                                                <CheckCircleIcon className="w-6 h-6" />
                                            </button>
                                        )}
                                        {item.type === 'note' && (
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-300 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>
                                        )}
                                        <button onClick={() => item.type === 'note' ? handleDelete(item.id) : null} className="p-2 text-slate-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <h3 className={`text-lg font-black uppercase tracking-tight ${item.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                    {item.type === 'visit' ? 'ATA DE VISITA TÉCNICA' : item.title}
                                </h3>
                                <p className={`mt-2 text-sm leading-relaxed ${item.completed ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                                    {item.type === 'visit' ? item.notes : item.content}
                                </p>

                                {item.alertDate && !item.completed && (
                                    <div className="mt-4 flex items-center text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-3 py-1.5 rounded-lg w-fit">
                                        <HistoryIcon className="w-3 h-3 mr-2" /> Alerta para: {new Date(item.alertDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* General View (No project filtered) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-6">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 shadow-[0_0_8px_#3b82f6]"></span> Notas Pendentes
                        </h2>
                        <div className="space-y-4">
                            {notes.filter(n => !n.completed).length === 0 && <p className="text-slate-300 italic text-sm">Nenhuma nota geral pendente.</p>}
                            {notes.filter(n => !n.completed).sort((a,b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(note => (
                                <div key={note.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 group hover:border-blue-200 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">
                                            {contracts.find(c => c.id === note.contractId)?.clientName || 'NOTA GERAL'}
                                        </span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(note)} className="p-1.5 text-slate-300 hover:text-blue-500"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(note.id)} className="p-1.5 text-slate-300 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2">{note.title}</h3>
                                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">{note.content}</p>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(note.createdAt || 0).toLocaleDateString('pt-BR')}</span>
                                        <button onClick={() => handleToggleComplete(note)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6 opacity-60">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                             Concluídas recentemente
                        </h2>
                        <div className="space-y-4">
                            {notes.filter(n => n.completed).slice(0, 5).map(note => (
                                <div key={note.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-xs font-black text-slate-500 uppercase line-through">{note.title}</h4>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{new Date(note.createdAt || 0).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <button onClick={() => handleToggleComplete(note)} className="text-green-500">
                                        <CheckCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* MODAL DE VISITA TÉCNICA */}
            {isVisitModalOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                    <MapPinIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Registrar Visita</h3>
                                    <p className="text-blue-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em]">Baixa no saldo de visitas do projeto</p>
                                </div>
                            </div>
                            <button onClick={() => setIsVisitModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none">
                                <XIcon className="w-8 h-8 text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitVisit} className="p-10 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Projeto / Obra *</label>
                                <select 
                                    required
                                    value={visitFormData.contractId}
                                    onChange={e => setVisitFormData({...visitFormData, contractId: e.target.value})}
                                    className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500"
                                >
                                    <option value="">SELECIONE O PROJETO ATIVO...</option>
                                    {activeContracts.map(c => <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data da Visita</label>
                                <input type="date" required value={visitFormData.date} onChange={e => setVisitFormData({...visitFormData, date: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ata / Resumo da Visita</label>
                                <textarea required rows={4} value={visitFormData.notes} onChange={e => setVisitFormData({...visitFormData, notes: e.target.value})} placeholder="DESCREVA O QUE FOI VERIFICADO NO LOCAL..." className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500" />
                            </div>

                            <div className="pt-4 flex flex-col gap-4">
                                <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                                    Confirmar Registro e Dar Baixa
                                </button>
                                <p className="text-center text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                                    AO REGISTRAR, O SISTEMA DESCONTARÁ UMA VISITA DO PACOTE CONTRATADO PELO CLIENTE.
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Notes;
