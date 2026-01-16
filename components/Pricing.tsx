
import React, { useState, useMemo, useEffect } from 'react';
import { PricingModel, PricingParticipant, PricingStage, PricingTask, Expense } from '../types';
import { INITIAL_PRICING_MODEL } from '../constants';
import { TrashIcon, PlusIcon, PrinterIcon, ChevronLeftIcon, ChevronRightIcon, MoneyBagIcon, CheckCircleIcon, XIcon, HistoryIcon, ExclamationTriangleIcon } from './Icons';

interface PricingProps {
    expenses: Expense[];
    pricingData?: PricingModel;
    onUpdatePricing: (data: PricingModel) => void;
}

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Pricing: React.FC<PricingProps> = ({ expenses, pricingData, onUpdatePricing }) => {
    // ESTADO DE RASCUNHO LOCAL
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

        const indirectCosts = monthlyOverhead > 0 ? (directCost * 0.2) : 0;
        const subtotal = directCost + indirectCosts;
        const profit = subtotal * (draftModel.profitPercentage / 100);
        const taxes = (subtotal + profit) * (draftModel.taxPercentage / 100);
        const finalValue = subtotal + profit + taxes;

        return { totalHours, directCost, indirectCosts, profit, taxes, finalValue };
    }, [draftModel, monthlyOverhead]);

    // HANDLERS
    const updateDraft = (updates: Partial<PricingModel>) => {
        setDraftModel(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdatePricing(draftModel);
        setHasChanges(false);
        alert('Configurações de precificação salvas!');
    };

    const handleUndo = () => {
        if (window.confirm('Descartar alterações e voltar ao original?')) {
            setDraftModel(pricingData || INITIAL_PRICING_MODEL);
            setHasChanges(false);
        }
    };

    const handleDeleteAll = () => {
        if (window.confirm('ATENÇÃO: Deseja resetar toda a precificação para o modelo inicial?')) {
            setDraftModel(INITIAL_PRICING_MODEL);
            setHasChanges(true);
        }
    };

    const handleAddParticipant = () => {
        const newParticipant: PricingParticipant = {
            id: Date.now() + Math.random(),
            name: 'Novo Colaborador',
            hourlyRate: 50,
            isPrincipal: false
        };
        updateDraft({ participants: [...draftModel.participants, newParticipant] });
    };

    const handleRemoveParticipant = (id: number) => {
        const part = draftModel.participants.find(p => p.id === id);
        if (!part || part.isPrincipal) return;

        if (window.confirm(`Excluir colaborador "${part.name}"? As tarefas serão movidas para o Arquiteto Principal.`)) {
            const principal = draftModel.participants.find(p => p.isPrincipal) || draftModel.participants[0];
            const newParticipants = draftModel.participants.filter(p => p.id !== id);
            
            const newStages = draftModel.stages.map(stage => ({
                ...stage,
                tasks: stage.tasks.map(t => t.participantId === id ? { ...t, participantId: principal.id } : t),
                environments: stage.environments?.map(env => ({
                    ...env,
                    tasks: env.tasks.map(t => t.participantId === id ? { ...t, participantId: principal.id } : t)
                }))
            }));

            setDraftModel(prev => ({
                ...prev,
                participants: newParticipants,
                stages: newStages
            }));
            setHasChanges(true);
        }
    };

    const handleAddStage = () => {
        const nextNumber = draftModel.stages.length + 1;
        const newStage: PricingStage = {
            id: Date.now(),
            number: nextNumber,
            name: `NOVA ETAPA ${nextNumber}`,
            tasks: [{ id: Date.now() + 1, description: 'Nova Tarefa', hours: 0, participantId: draftModel.participants[0].id }],
            isOpen: true
        };
        updateDraft({ stages: [...draftModel.stages, newStage] });
    };

    const handleRemoveStage = (id: number) => {
        if (window.confirm('Excluir esta etapa inteira?')) {
            updateDraft({ stages: draftModel.stages.filter(s => s.id !== id) });
        }
    };

    const handleAddTask = (stageId: number) => {
        const newStages = draftModel.stages.map(s => {
            if (s.id !== stageId) return s;
            return { 
                ...s, 
                tasks: [...s.tasks, { id: Date.now(), description: 'Nova Tarefa', hours: 0, participantId: draftModel.participants[0].id }] 
            };
        });
        updateDraft({ stages: newStages });
    };

    const handleRemoveTask = (stageId: number, taskId: number) => {
        const newStages = draftModel.stages.map(s => {
            if (s.id !== stageId) return s;
            return { ...s, tasks: s.tasks.filter(t => t.id !== taskId) };
        });
        updateDraft({ stages: newStages });
    };

    const handleTaskChange = (stageId: number, envId: number | null, taskId: number, field: keyof PricingTask, value: any) => {
        const newStages = draftModel.stages.map(s => {
            if (s.id !== stageId) return s;
            if (envId) {
                return {
                    ...s,
                    environments: s.environments?.map(e => e.id === envId ? {
                        ...e,
                        tasks: e.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
                    } : e)
                };
            }
            return {
                ...s,
                tasks: s.tasks.map(t => t.id === taskId ? { ...t, [field]: value } : t)
            };
        });
        updateDraft({ stages: newStages });
    };

    return (
        <div className="space-y-6 pb-32">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Calculadora de Precificação</h1>
                        <p className="mt-1 text-blue-100 italic text-sm">Controle total de tempo e lucratividade.</p>
                    </div>
                    <button onClick={handleDeleteAll} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-100 text-xs font-bold flex items-center transition-colors">
                        <TrashIcon className="w-4 h-4 mr-2" /> RECOMECAR PROJETO
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    {/* Equipe */}
                    <div className="bg-white p-5 rounded-xl shadow border border-slate-200">
                        <div className="flex items-center text-blue-600 font-bold mb-4">
                            <MoneyBagIcon className="w-5 h-5 mr-2" /> Equipe e Valores HH
                        </div>
                        <div className="space-y-4">
                            {draftModel.participants.map(p => (
                                <div key={p.id} className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400 flex justify-between">
                                        <span>{p.isPrincipal ? 'Arquiteto Principal' : 'Colaborador'}</span>
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={p.name} 
                                            readOnly={p.isPrincipal}
                                            onChange={(e) => {
                                                updateDraft({ participants: draftModel.participants.map(part => part.id === p.id ? {...part, name: e.target.value} : part) });
                                            }}
                                            placeholder="Nome..."
                                            className={`flex-1 text-sm border-slate-200 rounded h-10 px-2 ${p.isPrincipal ? 'bg-slate-50 font-bold' : ''}`} 
                                        />
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-2.5 text-slate-400 text-[10px]">R$</span>
                                            <input 
                                                type="number" 
                                                value={p.hourlyRate} 
                                                onChange={(e) => {
                                                    const rate = parseFloat(e.target.value) || 0;
                                                    updateDraft({ participants: draftModel.participants.map(part => part.id === p.id ? {...part, hourlyRate: rate} : part) });
                                                }}
                                                className="w-full pl-6 text-sm font-bold border-slate-200 rounded h-10" 
                                            />
                                        </div>
                                        {!p.isPrincipal && (
                                            <button 
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveParticipant(p.id); }} 
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={handleAddParticipant}
                                className="text-blue-600 text-[10px] font-black flex items-center bg-blue-50 px-3 py-3 rounded-xl w-full justify-center transition-all hover:bg-blue-100 border border-blue-200 uppercase tracking-widest"
                            >
                                <PlusIcon className="w-4 h-4 mr-2"/> ADICIONAR COLABORADOR
                            </button>
                        </div>
                    </div>

                    {/* Escritório e Margens */}
                    <div className="bg-white p-5 rounded-xl shadow border border-slate-200">
                        <div className="text-slate-800 font-bold mb-4">Escritório e Margens</div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">OVERHEAD MENSAL (CUSTOS INDIRETOS)</label>
                                <p className="text-xl font-bold text-slate-800">{formatCurrency(monthlyOverhead)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Impostos (%)</label>
                                    <input 
                                        type="number" 
                                        value={draftModel.taxPercentage} 
                                        onChange={e => updateDraft({ taxPercentage: parseFloat(e.target.value) || 0 })}
                                        className="w-full mt-1 text-sm border-slate-200 rounded h-10 px-2" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Margem Lucro (%)</label>
                                    <input 
                                        type="number" 
                                        value={draftModel.profitPercentage} 
                                        onChange={e => updateDraft({ profitPercentage: parseFloat(e.target.value) || 0 })}
                                        className="w-full mt-1 text-sm border-slate-200 rounded h-10 px-2" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumo Final */}
                    <div className="bg-[#1e293b] text-white p-6 rounded-2xl shadow-2xl ring-4 ring-blue-500/20">
                        <div className="flex items-center text-blue-400 font-bold mb-6 uppercase text-xs tracking-widest">
                            <MoneyBagIcon className="w-5 h-5 mr-2" /> Resumo da Proposta
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span className="text-slate-400 font-medium">Total Horas:</span>
                                <span className="font-bold">{totals.totalHours}h</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-2 text-green-400">
                                <span className="font-bold">Lucro ({draftModel.profitPercentage}%):</span>
                                <span className="font-bold">{formatCurrency(totals.profit)}</span>
                            </div>
                            <div className="pt-6">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">VALOR SUGERIDO DO PROJETO</label>
                                <p className="text-4xl font-black text-white">{formatCurrency(totals.finalValue)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow border border-slate-200">
                    <div className="flex justify-between items-center mb-8 border-b pb-4">
                        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Estratégia de Horas por Etapa</h2>
                        <input 
                            type="text" 
                            placeholder="Nome do Projeto" 
                            value={draftModel.projectName}
                            onChange={e => updateDraft({ projectName: e.target.value })}
                            className="text-right border-none focus:ring-0 text-slate-400 font-bold placeholder-slate-200"
                        />
                    </div>

                    <div className="space-y-4">
                        {draftModel.stages.map(stage => (
                            <div key={stage.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-4 flex justify-between items-center group">
                                    <div className="flex items-center flex-1 cursor-pointer" onClick={() => {
                                        updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? {...s, isOpen: !s.isOpen} : s) });
                                    }}>
                                        <ChevronRightIcon className={`w-5 h-5 mr-2 text-slate-400 transition-transform ${stage.isOpen ? 'rotate-90' : ''}`} />
                                        <span className="mr-3 text-blue-600 font-black text-sm">{stage.number}.</span>
                                        <input 
                                            type="text" 
                                            value={stage.name} 
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => {
                                                updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? {...s, name: e.target.value} : s) });
                                            }}
                                            className="bg-transparent border-none focus:ring-0 font-black text-slate-700 text-xs uppercase tracking-widest w-full px-0"
                                        />
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-[10px] font-black text-slate-400 uppercase bg-white px-2 py-1 rounded border">
                                            {stage.tasks.reduce((a,b) => a+b.hours, 0)}h total
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveStage(stage.id)} 
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {stage.isOpen && (
                                    <div className="p-4 space-y-4 bg-white border-t border-slate-50">
                                        <div className="space-y-1">
                                            {stage.tasks.map(task => (
                                                <div key={task.id} className="grid grid-cols-12 gap-4 items-center group py-2 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors -mx-4 px-4">
                                                    <div className="col-span-7">
                                                        <input 
                                                            type="text"
                                                            value={task.description}
                                                            onChange={e => handleTaskChange(stage.id, null, task.id, 'description', e.target.value)}
                                                            className="w-full text-xs text-slate-600 bg-transparent border-none focus:ring-0 px-0 h-8"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 flex items-center">
                                                        <input 
                                                            type="number" 
                                                            value={task.hours} 
                                                            onChange={e => handleTaskChange(stage.id, null, task.id, 'hours', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-right text-xs border border-slate-200 bg-white hover:bg-slate-50 focus:border-blue-500 rounded-lg transition-all font-bold h-8 px-2" 
                                                        />
                                                        <span className="ml-1 text-[10px] text-slate-400 font-bold uppercase">h</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <select 
                                                            value={task.participantId} 
                                                            onChange={e => handleTaskChange(stage.id, null, task.id, 'participantId', parseInt(e.target.value))}
                                                            className="w-full text-[9px] border-none bg-transparent focus:ring-0 text-slate-500 font-black px-0 h-8 uppercase tracking-tighter"
                                                        >
                                                            {draftModel.participants.map(p => <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 text-right">
                                                        <button 
                                                            onClick={() => handleRemoveTask(stage.id, task.id)} 
                                                            className="p-1.5 text-slate-200 hover:text-red-400 hover:bg-white rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <TrashIcon className="w-4 h-4 ml-auto" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => handleAddTask(stage.id)}
                                                className="text-[10px] font-black text-blue-500 uppercase flex items-center pt-4 hover:text-blue-700 transition-colors"
                                            >
                                                <PlusIcon className="w-4 h-4 mr-1.5" /> Adicionar Nova Tarefa
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        <button 
                            onClick={handleAddStage}
                            className="w-full mt-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-8 flex items-center justify-center text-slate-400 font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500 transition-all shadow-inner"
                        >
                            <PlusIcon className="w-7 h-7 mr-4" /> ADICIONAR NOVA ETAPA
                        </button>
                    </div>
                </div>
            </div>

            {/* BARRA FLUTUANTE DE SALVAMENTO */}
            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-50 no-print animate-slideUp">
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 ring-8 ring-slate-900/10 backdrop-blur-sm bg-slate-900/95">
                        <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <HistoryIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-100 leading-none">Alterações Pendentes</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">Sua precificação mudou. Lembre de salvar.</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                            <button 
                                onClick={handleUndo}
                                className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase rounded-xl transition-all flex items-center justify-center"
                            >
                                <XIcon className="w-4 h-4 mr-2" /> DESFAZER
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 sm:flex-none px-10 py-3 bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase rounded-xl transition-all shadow-xl flex items-center justify-center"
                            >
                                <CheckCircleIcon className="w-4 h-4 mr-2" /> SALVAR PRECIFICAÇÃO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pricing;
