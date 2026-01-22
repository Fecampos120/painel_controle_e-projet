
import React, { useState, useEffect, useMemo } from 'react';
import { Contract, ProjectChecklist, ProjectChecklistItem } from '../types';
import { INITIAL_CHECKLIST_TEMPLATE } from '../constants';
import { CheckCircleIcon, ArchitectIcon, PlusIcon, TrashIcon, PencilIcon, TrendingUpIcon } from './Icons';

interface ConstructionChecklistProps {
    contracts: Contract[];
    checklists: ProjectChecklist[];
    onUpdateChecklist: (checklist: ProjectChecklist) => void;
}

const ConstructionChecklist: React.FC<ConstructionChecklistProps> = ({ contracts, checklists = [], onUpdateChecklist }) => {
    const [selectedContractId, setSelectedContractId] = useState<string>('');
    const [localItems, setLocalItems] = useState<ProjectChecklistItem[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [editingItem, setEditingItem] = useState<ProjectChecklistItem | null>(null);

    const activeContracts = contracts.filter(c => c.status === 'Ativo');

    useEffect(() => {
        if (selectedContractId) {
            // FIX: Use Number instead of parseInt to match float IDs
            const savedChecklist = (checklists || []).find(c => c.contractId === Number(selectedContractId));
            if (savedChecklist) {
                setLocalItems(savedChecklist.items);
            } else {
                setLocalItems(INITIAL_CHECKLIST_TEMPLATE.map(t => ({
                    id: Math.random() + t.id,
                    text: t.text,
                    stage: t.stage,
                    completed: false
                })));
            }
            setHasUnsavedChanges(false);
        } else {
            setLocalItems([]);
            setHasUnsavedChanges(false);
        }
    }, [selectedContractId, checklists]);

    const handleToggleCheck = (itemId: number) => {
        setLocalItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const isNowCompleted = !item.completed;
            return { 
                ...item, 
                completed: isNowCompleted,
                completionDate: isNowCompleted ? new Date().toLocaleDateString('pt-BR') : undefined
            };
        }));
        setHasUnsavedChanges(true);
    };

    const handleAddItem = (stageName: string) => {
        const newItem: ProjectChecklistItem = {
            id: Date.now(),
            text: '',
            stage: stageName,
            completed: false
        };
        setLocalItems(prev => [...prev, newItem]);
        setHasUnsavedChanges(true);
        setEditingItem(newItem);
    };

    const handleUpdateItemText = (id: number, newText: string) => {
        setLocalItems(prev => prev.map(i => i.id === id ? { ...i, text: newText } : i));
        setHasUnsavedChanges(true);
    };

    const handleDeleteItem = (id: number) => {
        if (window.confirm('Remover este item do checklist?')) {
            setLocalItems(prev => prev.filter(i => i.id !== id));
            setHasUnsavedChanges(true);
        }
    };

    const handleSave = () => {
        if (!selectedContractId) return;
        // FIX: Use Number instead of parseInt to preserve full ID precision
        onUpdateChecklist({
            contractId: Number(selectedContractId),
            items: localItems
        });
        setHasUnsavedChanges(false);
        alert('Fluxo salvo com sucesso!');
    };

    const groupedItems = useMemo(() => {
        const groups: { [key: string]: ProjectChecklistItem[] } = {};
        if (localItems.length === 0) return groups;
        localItems.forEach(item => {
            if (!groups[item.stage]) groups[item.stage] = [];
            groups[item.stage].push(item);
        });
        return groups;
    }, [localItems]);

    const calculateProgress = () => {
        if (localItems.length === 0) return 0;
        const done = localItems.filter(s => s.completed).length;
        return Math.round((done / localItems.length) * 100);
    };

    return (
        <div className="space-y-8 relative pb-24 animate-fadeIn">
            <header className="bg-slate-900 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-black uppercase tracking-tight">Andamento Técnico de Obra</h1>
                <p className="mt-1 text-slate-400 italic text-sm">Controle direto Arquiteta x Cliente. Marque os itens concluídos para registrar a data.</p>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Selecione o Projeto Ativo</label>
                <select
                    value={selectedContractId}
                    onChange={(e) => setSelectedContractId(e.target.value)}
                    className="block w-full max-w-xl h-12 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold focus:border-[var(--primary-color)] focus:ring-4 focus:ring-[var(--primary-color)]/10 outline-none transition-all"
                >
                    <option value="">Escolha um projeto para conferir...</option>
                    {activeContracts.map(contract => (
                        <option key={contract.id} value={contract.id}>{contract.clientName} - {contract.projectName}</option>
                    ))}
                </select>
            </div>

            {selectedContractId ? (
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[var(--primary-color)]">
                                <TrendingUpIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Status do Cronograma Técnico</p>
                                <p className="text-xl font-black text-slate-800">{calculateProgress()}% Finalizado</p>
                            </div>
                        </div>
                        <div className="flex-1 max-w-md ml-10">
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-[var(--primary-color)] h-full rounded-full transition-all duration-700" style={{ width: `${calculateProgress()}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {(Object.entries(groupedItems) as [string, ProjectChecklistItem[]][]).sort().map(([stageName, items]) => (
                            <div key={stageName} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 group">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                                    <h3 className="text-xs font-black text-[var(--primary-color)] uppercase tracking-[0.2em]">{stageName}</h3>
                                    <button 
                                        onClick={() => handleAddItem(stageName)}
                                        className="px-4 py-1.5 bg-[var(--primary-color)] text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-md"
                                    >
                                        + Add Item Técnico
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <div 
                                            key={item.id} 
                                            className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-4 ${
                                                item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-[var(--primary-color)]/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <button 
                                                    onClick={() => handleToggleCheck(item.id)} 
                                                    className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                        item.completed ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'border-slate-200 hover:border-[var(--primary-color)] bg-white'
                                                    }`}
                                                >
                                                    {item.completed && <CheckCircleIcon className="w-5 h-5" />}
                                                </button>
                                                
                                                <div className="flex-1">
                                                    {editingItem?.id === item.id ? (
                                                        <div className="relative">
                                                            <input 
                                                                autoFocus
                                                                className="w-full text-sm font-bold bg-white border-2 border-[var(--primary-color)] ring-4 ring-[var(--primary-color)]/10 rounded-xl px-4 py-2 outline-none shadow-inner"
                                                                value={item.text}
                                                                placeholder="Digite a ação técnica aqui..."
                                                                onBlur={() => setEditingItem(null)}
                                                                onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                                                            />
                                                            <div className="absolute right-3 top-2 text-[8px] font-black text-[var(--primary-color)] uppercase pointer-events-none opacity-50">Escrevendo...</div>
                                                        </div>
                                                    ) : (
                                                        <div 
                                                            className="cursor-pointer group/text p-1.5 -m-1.5 rounded-lg hover:bg-slate-50 transition-colors"
                                                            onClick={() => !item.completed && setEditingItem(item)}
                                                        >
                                                            <span 
                                                                className={`text-sm font-bold transition-all ${item.completed ? 'text-slate-400 line-through italic' : 'text-slate-700 group-hover/text:text-[var(--primary-color)]'}`}
                                                            >
                                                                {item.text || <em className="text-slate-300 font-normal">Clique aqui para escrever a tarefa...</em>}
                                                            </span>
                                                            {item.completed && item.completionDate && (
                                                                <p className="text-[9px] font-black text-green-600 uppercase mt-1 tracking-widest flex items-center">
                                                                    <CheckCircleIcon className="w-3 h-3 mr-1" /> Concluído em: {item.completionDate}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => setEditingItem(item)} 
                                                    className="p-2 bg-slate-50 text-slate-400 hover:text-[var(--primary-color)] hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-[var(--primary-color)]/20"
                                                    title="Editar Texto"
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteItem(item.id)} 
                                                    className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-200"
                                                    title="Excluir Item"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-6">
                         <button 
                            onClick={handleSave}
                            disabled={!hasUnsavedChanges}
                            className={`w-full py-4 rounded-3xl shadow-2xl font-black uppercase text-xs tracking-widest transition-all ${
                                hasUnsavedChanges 
                                ? 'bg-[var(--primary-color)] text-white hover:scale-105 active:scale-95 shadow-blue-500/20' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                        >
                            Salvar Alterações de Obra
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 opacity-50">
                    <ArchitectIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">Nenhum projeto em foco</h2>
                    <p className="text-sm font-bold text-slate-400">Selecione uma obra acima para marcar o andamento técnico.</p>
                </div>
            )}
        </div>
    );
};

export default ConstructionChecklist;
