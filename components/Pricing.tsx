
import React, { useState, useMemo, useEffect } from 'react';
import { PricingModel, PricingParticipant, PricingStage, PricingTask, Expense } from '../types';
import { INITIAL_PRICING_MODEL } from '../constants';
import { TrashIcon, PlusIcon, ChevronRightIcon, MoneyBagIcon, CheckCircleIcon, XIcon, HistoryIcon } from './Icons';

interface PricingProps {
    expenses: Expense[];
    pricingData?: PricingModel;
    onUpdatePricing: (data: PricingModel) => void;
}

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Pricing: React.FC<PricingProps> = ({ expenses, pricingData, onUpdatePricing }) => {
    const [draftModel, setDraftModel] = useState<PricingModel>(pricingData || INITIAL_PRICING_MODEL);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (pricingData && !hasChanges) {
            setDraftModel(pricingData);
        }
    }, [pricingData, hasChanges]);

    const monthlyOverhead = useMemo(() => {
        const today = new Date();
        return expenses
            .filter(e => e.category === 'Fixa' && new Date(e.dueDate).getMonth() === today.getMonth())
            .reduce((acc, curr) => acc + curr.amount, 0);
    }, [expenses]);

    const totals = useMemo(() => {
        let totalHours = 0;
        let directCost = 0;

        const calculateTasks = (tasks: PricingTask[]) => {
            tasks.forEach(t => {
                totalHours += t.hours;
                const part = draftModel.participants.find(p => p.id === t.participantId);
                directCost += t.hours * (part?.hourlyRate || 0);
            });
        };

        draftModel.stages.forEach(stage => {
            calculateTasks(stage.tasks);
            stage.environments?.forEach(env => calculateTasks(env.tasks));
        });

        const subtotal = directCost + (monthlyOverhead > 0 ? (directCost * 0.2) : 0);
        const profit = subtotal * (draftModel.profitPercentage / 100);
        const taxes = (subtotal + profit) * (draftModel.taxPercentage / 100);
        const finalValue = subtotal + profit + taxes;

        return { totalHours, directCost, profit, taxes, finalValue };
    }, [draftModel, monthlyOverhead]);

    const updateDraft = (updates: Partial<PricingModel>) => {
        setDraftModel(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdatePricing(draftModel);
        setHasChanges(false);
        alert('Alterações de precificação salvas!');
    };

    const handleUndo = () => {
        if (window.confirm('Descartar alterações?')) {
            setDraftModel(pricingData || INITIAL_PRICING_MODEL);
            setHasChanges(false);
        }
    };

    const handleRemoveParticipant = (id: number) => {
        const part = draftModel.participants.find(p => p.id === id);
        if (!part || part.isPrincipal) return;

        if (window.confirm(`Excluir colaborador "${part.name}"? As tarefas dele serão movidas para o Arquiteto Principal.`)) {
            const principal = draftModel.participants.find(p => p.isPrincipal) || draftModel.participants[0];
            
            // 1. Remove o participante
            const newParticipants = draftModel.participants.filter(p => p.id !== id);
            
            // 2. Reatribui tarefas
            const newStages = draftModel.stages.map(stage => ({
                ...stage,
                tasks: stage.tasks.map(t => t.participantId === id ? { ...t, participantId: principal.id } : t)
            }));

            setDraftModel(prev => ({
                ...prev,
                participants: newParticipants,
                stages: newStages
            }));
            setHasChanges(true);
        }
    };

    return (
        <div className="space-y-6 pb-32">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Calculadora de Precificação</h1>
                <p className="mt-1 text-blue-100 italic text-sm">Gerencie sua margem e custos de equipe.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-5 rounded-xl shadow border border-slate-200">
                        <div className="flex items-center text-blue-600 font-bold mb-4">
                            <MoneyBagIcon className="w-5 h-5 mr-2" /> Equipe e Valores HH
                        </div>
                        <div className="space-y-4">
                            {draftModel.participants.map(p => (
                                <div key={p.id} className="space-y-1">
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={p.name} 
                                            readOnly={p.isPrincipal}
                                            onChange={(e) => updateDraft({ participants: draftModel.participants.map(part => part.id === p.id ? {...part, name: e.target.value} : part) })}
                                            className={`flex-1 text-sm border-slate-200 rounded h-10 px-2 ${p.isPrincipal ? 'bg-slate-50 font-bold' : ''}`} 
                                        />
                                        <input 
                                            type="number" 
                                            value={p.hourlyRate} 
                                            onChange={(e) => updateDraft({ participants: draftModel.participants.map(part => part.id === p.id ? {...part, hourlyRate: parseFloat(e.target.value) || 0} : part) })}
                                            className="w-20 text-sm font-bold border-slate-200 rounded h-10 text-center" 
                                        />
                                        {!p.isPrincipal && (
                                            <button 
                                                type="button"
                                                onClick={() => handleRemoveParticipant(p.id)} 
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => updateDraft({ participants: [...draftModel.participants, { id: Date.now(), name: 'Novo Colaborador', hourlyRate: 50, isPrincipal: false }] })}
                                className="text-blue-600 text-[10px] font-black flex items-center bg-blue-50 px-3 py-3 rounded-xl w-full justify-center hover:bg-blue-100 border border-blue-200 uppercase tracking-widest"
                            >
                                <PlusIcon className="w-4 h-4 mr-2"/> ADICIONAR COLABORADOR
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#1e293b] text-white p-6 rounded-2xl shadow-2xl ring-4 ring-blue-500/20">
                        <div className="flex items-center text-blue-400 font-bold mb-6 uppercase text-xs tracking-widest">
                            <MoneyBagIcon className="w-5 h-5 mr-2" /> Resumo da Proposta
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span>Total Horas:</span>
                                <span className="font-bold">{totals.totalHours}h</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-2 text-green-400">
                                <span className="font-bold">Lucro ({draftModel.profitPercentage}%):</span>
                                <span className="font-bold">{formatCurrency(totals.profit)}</span>
                            </div>
                            <div className="pt-6">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">VALOR SUGERIDO</label>
                                <p className="text-4xl font-black text-white">{formatCurrency(totals.finalValue)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 uppercase mb-8 border-b pb-4">Estratégia de Horas</h2>
                    <div className="space-y-4">
                        {draftModel.stages.map(stage => (
                            <div key={stage.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-4 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className="mr-3 text-blue-600 font-black">{stage.number}.</span>
                                        <span className="font-black text-slate-700 text-xs uppercase">{stage.name}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-1 rounded border">
                                        {stage.tasks.reduce((a,b) => a+b.hours, 0)}h total
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    {stage.tasks.map(task => (
                                        <div key={task.id} className="grid grid-cols-12 gap-4 items-center border-b border-slate-50 pb-2">
                                            <input 
                                                className="col-span-7 text-xs border-none focus:ring-0 p-0 h-8"
                                                value={task.description}
                                                onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, description: e.target.value } : t) } : s) })}
                                            />
                                            <input 
                                                type="number"
                                                className="col-span-2 text-right text-xs border rounded h-8 px-2 font-bold"
                                                value={task.hours}
                                                onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, hours: parseFloat(e.target.value) || 0 } : t) } : s) })}
                                            />
                                            <select 
                                                className="col-span-2 text-[9px] border-none font-black uppercase text-slate-500"
                                                value={task.participantId}
                                                onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, participantId: parseInt(e.target.value) } : t) } : s) })}
                                            >
                                                {draftModel.participants.map(p => <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>)}
                                            </select>
                                            <button onClick={() => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.filter(t => t.id !== task.id) } : s) })} className="col-span-1 text-red-300 hover:text-red-500">
                                                <TrashIcon className="w-4 h-4 ml-auto" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-50 animate-slideUp">
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex items-center justify-between gap-4 backdrop-blur-sm bg-slate-900/95 ring-8 ring-slate-900/10">
                        <div className="flex items-center space-x-3">
                             <HistoryIcon className="w-5 h-5 text-blue-400" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-100">Alterações Pendentes</p>
                                <p className="text-[10px] text-slate-400">Sua precificação mudou. Lembre de salvar.</p>
                             </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button onClick={handleUndo} className="px-6 py-2.5 bg-slate-800 text-slate-300 font-black text-[10px] uppercase rounded-xl hover:bg-slate-700 transition-all">DESFAZER</button>
                            <button onClick={handleSave} className="px-10 py-2.5 bg-green-600 text-white font-black text-[10px] uppercase rounded-xl hover:bg-green-700 shadow-xl shadow-green-900/20 transition-all">SALVAR PRECIFICAÇÃO</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pricing;
