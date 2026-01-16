
import React, { useState, useEffect, useMemo } from 'react';
import { Contract, ProjectChecklist, ProjectChecklistItem } from '../types';
import { CHECKLIST_TEMPLATE } from '../constants';
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
            const savedChecklist = (checklists || []).find(c => c.contractId === parseInt(selectedContractId));
            if (savedChecklist) {
                setLocalItems(savedChecklist.items);
            } else {
                setLocalItems(CHECKLIST_TEMPLATE.map(t => ({
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
            text: 'Novo item técnico...',
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
        onUpdateChecklist({
            contractId: parseInt(selectedContractId),
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
                    className="block w-full max-w-xl h-12 px-4 rounded-xl border-slate-200 bg-slate-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
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
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <TrendingUpIcon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase">Status do Cronograma Técnico</p>
                                <p className="text-xl font-black text-slate-800">{calculateProgress()}% Finalizado</p>
                            </div>
                        </div>
                        <div className="flex-1 max-w-md ml-10">
                            <div className="w-full bg-slate-100 rounded-full h-3">
                                <div className="bg-blue-600 h-full rounded-full transition-all duration-700" style={{ width: `${calculateProgress()}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {(Object.entries(groupedItems) as [string, ProjectChecklistItem[]][]).sort().map(([stageName, items]) => (
                            <div key={stageName} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 group">
                                <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                                    <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">{stageName}</h3>
                                    <button 
                                        onClick={() => handleAddItem(stageName)}
                                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        + Add Item Técnico
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div 
                                            key={item.id} 
                                            className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                                                item.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 hover:border-blue-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <button 
                                                    onClick={() => handleToggleCheck(item.id)} 
                                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                                        item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 hover:border-blue-400'
                                                    }`}
                                                >
                                                    {item.completed && <CheckCircleIcon className="w-4 h-4" />}
                                                </button>
                                                
                                                <div className="flex-1">
                                                    {editingItem?.id === item.id ? (
                                                        <input 
                                                            autoFocus
                                                            className="w-full text-sm font-bold bg-white border border-blue-300 rounded px-2 py-1 outline-none"
                                                            value={item.text}
                                                            onBlur={() => setEditingItem(null)}
                                                            onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                                                            onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                                                        />
                                                    ) : (
                                                        <div>
                                                            <span 
                                                                onClick={() => handleToggleCheck(item.id)}
                                                                className={`text-sm font-bold cursor-pointer select-none transition-all ${item.completed ? 'text-slate-400 line-through italic' : 'text-slate-700'}`}
                                                            >
                                                                {item.text}
                                                            </span>
                                                            {item.completed && item.completionDate && (
                                                                <p className="text-[9px] font-black text-green-600 uppercase mt-0.5 tracking-widest">
                                                                    Concluído em: {item.completionDate}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingItem(item)} className="p-1.5 text-slate-300 hover:text-blue-600 transition-colors"><PencilIcon className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-600 transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
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
                                ? 'bg-blue-600 text-white hover:bg-blue-700 animate-bounce' 
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
