
import React, { useState, useMemo, useEffect } from 'react';
import { PricingModel, PricingParticipant, PricingStage, PricingTask, Expense } from '../types';
import { INITIAL_PRICING_MODEL } from '../constants';
import { TrashIcon, PlusIcon, MoneyBagIcon, CheckCircleIcon, HistoryIcon, CreditCardIcon, TrendingUpIcon, PencilIcon, XIcon, UsersIcon } from './Icons';

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
    const [monthlyWorkHours, setMonthlyWorkHours] = useState(160);

    useEffect(() => {
        if (pricingData && !hasChanges) {
            setDraftModel(pricingData);
        }
    }, [pricingData, hasChanges]);

    const totalFixedExpenses = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        return expenses
            .filter(e => {
                const d = new Date(e.dueDate + 'T12:00:00');
                return e.category === 'Fixa' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((acc, curr) => acc + curr.amount, 0);
    }, [expenses]);

    const operationalHourCost = useMemo(() => {
        if (monthlyWorkHours <= 0) return 0;
        return totalFixedExpenses / monthlyWorkHours;
    }, [totalFixedExpenses, monthlyWorkHours]);

    const totals = useMemo(() => {
        let totalHours = 0;
        let professionalCost = 0;

        const calculateTasks = (tasks: PricingTask[]) => {
            tasks.forEach(t => {
                totalHours += t.hours;
                const part = draftModel.participants.find(p => p.id === t.participantId);
                professionalCost += t.hours * (part?.hourlyRate || 0);
            });
        };

        draftModel.stages.forEach(stage => {
            calculateTasks(stage.tasks);
            stage.environments?.forEach(env => calculateTasks(env.tasks));
        });

        const allocatedFixedCost = totalHours * operationalHourCost;
        const totalDirectCost = professionalCost + allocatedFixedCost;
        const profit = totalDirectCost * (draftModel.profitPercentage / 100);
        const subtotalWithProfit = totalDirectCost + profit;
        const taxes = subtotalWithProfit * (draftModel.taxPercentage / 100);
        const finalValue = subtotalWithProfit + taxes;

        return { 
            totalHours, professionalCost, allocatedFixedCost, totalDirectCost, profit, taxes, finalValue 
        };
    }, [draftModel, operationalHourCost]);

    const updateDraft = (updates: Partial<PricingModel>) => {
        setDraftModel(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const handleSave = () => {
        onUpdatePricing(draftModel);
        setHasChanges(false);
        alert('Estratégia de precificação salva com sucesso!');
    };

    const addStage = () => {
        const newStage: PricingStage = {
            id: Date.now(),
            number: draftModel.stages.length + 1,
            name: 'NOVA FASE DE PROJETO',
            tasks: [{ id: Date.now() + 1, description: 'Nova Tarefa', hours: 1, participantId: draftModel.participants[0].id }],
            isOpen: true
        };
        updateDraft({ stages: [...draftModel.stages, newStage] });
    };

    const removeStage = (id: number) => {
        if (window.confirm('Excluir esta fase e todas as suas tarefas?')) {
            updateDraft({ stages: draftModel.stages.filter(s => s.id !== id) });
        }
    };

    const addParticipant = () => {
        const newParticipant: PricingParticipant = {
            id: Date.now(),
            name: 'Novo Colaborador',
            hourlyRate: 80,
            isPrincipal: false
        };
        updateDraft({ participants: [...draftModel.participants, newParticipant] });
    };

    const removeParticipant = (id: number) => {
        const part = draftModel.participants.find(p => p.id === id);
        if (part?.isPrincipal) {
            alert('Não é possível remover o Arquiteto Principal.');
            return;
        }
        if (window.confirm('Remover este colaborador? Tarefas vinculadas a ele ficarão órfãs de custo.')) {
            updateDraft({ participants: draftModel.participants.filter(p => p.id !== id) });
        }
    };

    return (
        <div className="space-y-6 pb-32 animate-fadeIn">
            <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Cálculo de Honorários</h1>
                    <p className="mt-1 text-blue-100 italic text-sm">Baseado na sequência de processos da sua metodologia.</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={addStage} className="px-6 py-3 bg-white text-blue-600 font-black rounded-xl shadow-lg hover:scale-105 transition-all uppercase text-[10px] tracking-widest">
                        + Criar Nova Fase
                    </button>
                    <button onClick={handleSave} className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:scale-105 transition-all uppercase text-[10px] tracking-widest">
                        Salvar Modelo
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* COLUNA ESQUERDA: CUSTOS E MARGEM */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center text-red-600 font-black text-xs uppercase tracking-widest mb-4">
                            <CreditCardIcon className="w-5 h-5 mr-2" /> Gastos Fixos Escritório
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Soma do Mês</p>
                                    <p className="text-2xl font-black text-slate-800">{formatCurrency(totalFixedExpenses)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Custo/Hora</p>
                                    <p className="text-lg font-black text-blue-600">{formatCurrency(operationalHourCost)}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Suas Horas Produtivas/Mês</label>
                                <input 
                                    type="number" 
                                    value={monthlyWorkHours} 
                                    onChange={e => setMonthlyWorkHours(parseInt(e.target.value) || 1)}
                                    className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl font-black text-slate-700 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center text-blue-600 font-black text-xs uppercase tracking-widest">
                                <UsersIcon className="w-5 h-5 mr-2" /> Equipe do Projeto
                            </div>
                            <button 
                                onClick={addParticipant}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
                            >
                                + Add Colaborador
                            </button>
                        </div>
                        <div className="space-y-4">
                            {draftModel.participants.map(p => (
                                <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 relative group/part">
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={p.name} 
                                            onChange={(e) => updateDraft({ participants: draftModel.participants.map(part => part.id === p.id ? {...part, name: e.target.value} : part) })}
                                            className="flex-1 text-xs border-2 border-transparent focus:border-blue-200 rounded-lg h-10 px-3 font-bold bg-white shadow-sm outline-none" 
                                        />
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">R$</span>
                                            <input 
                                                type="number" 
                                                value={p.hourlyRate} 
                                                onChange={(e) => updateDraft({ participants: draftModel.participants.map(part => part.id === p.id ? {...part, hourlyRate: parseFloat(e.target.value) || 0} : part) })}
                                                className="w-20 text-right pr-3 text-sm font-black border-2 border-transparent focus:border-blue-200 rounded-lg h-10 bg-white shadow-sm outline-none" 
                                            />
                                        </div>
                                    </div>
                                    {!p.isPrincipal && (
                                        <button 
                                            onClick={() => removeParticipant(p.id)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover/part:opacity-100 transition-opacity shadow-sm border border-red-200"
                                        >
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    )}
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{p.isPrincipal ? 'Principal' : 'Colaborador'}</span>
                                        <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Valor Hora</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl space-y-4">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Mão de Obra Total:</span>
                            <span>{formatCurrency(totals.professionalCost)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Estrutura (Fixos):</span>
                            <span className="text-red-400">{formatCurrency(totals.allocatedFixedCost)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-green-400 uppercase tracking-widest pt-2 border-t border-slate-800">
                            <span>Seu Lucro Líquido:</span>
                            <span>{formatCurrency(totals.profit)}</span>
                        </div>
                        <div className="pt-4">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Total da Proposta</p>
                            <p className="text-4xl font-black text-white">{formatCurrency(totals.finalValue)}</p>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: ESTRUTURA DE TAREFAS */}
                <div className="lg:col-span-8 space-y-8">
                    {draftModel.stages.map((stage, sIdx) => (
                        <div key={stage.id} className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden group">
                            <div className="bg-slate-50 p-6 flex justify-between items-center border-b border-slate-100">
                                <div className="flex items-center gap-4 flex-1">
                                    <span className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg">{sIdx + 1}</span>
                                    <div className="flex-1 max-w-lg relative group/title">
                                        <input 
                                            value={stage.name}
                                            onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, name: e.target.value.toUpperCase() } : s) })}
                                            className="w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 font-black text-slate-700 uppercase tracking-tight text-lg outline-none"
                                        />
                                        <PencilIcon className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-[10px] font-black text-slate-400 uppercase bg-white px-4 py-2 rounded-xl border border-slate-200">
                                        SUBTOTAL: {stage.tasks.reduce((a,b) => a+b.hours, 0)}H
                                    </div>
                                    <button onClick={() => removeStage(stage.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                {stage.tasks.map(task => (
                                    <div key={task.id} className="grid grid-cols-12 gap-4 items-center group/task">
                                        <div className="col-span-6">
                                            <input 
                                                className="w-full text-sm font-bold border-2 border-transparent focus:border-blue-100 rounded-xl px-3 py-2 text-slate-600 bg-slate-50 transition-all outline-none"
                                                value={task.description}
                                                onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, description: e.target.value } : t) } : s) })}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    className="w-full text-right text-sm border-2 border-slate-100 rounded-xl h-10 px-3 font-black text-blue-600 focus:border-blue-500 outline-none"
                                                    value={task.hours}
                                                    onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, hours: parseFloat(e.target.value) || 0 } : t) } : s) })}
                                                />
                                                <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Horas</span>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="relative">
                                                <select 
                                                    className="w-full text-[9px] border-2 border-slate-100 rounded-xl h-10 font-black uppercase text-slate-500 bg-slate-50 outline-none appearance-none px-3"
                                                    value={task.participantId}
                                                    onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, participantId: parseInt(e.target.value) } : t) } : s) })}
                                                >
                                                    {draftModel.participants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <span className="absolute -top-2 left-2 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Responsável</span>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <button onClick={() => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.filter(t => t.id !== task.id) } : s) })} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover/task:opacity-100 transition-all">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                <button 
                                    onClick={() => {
                                        const newTask: PricingTask = { id: Date.now(), description: 'Nova Atividade...', hours: 1, participantId: draftModel.participants[0].id };
                                        updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: [...s.tasks, newTask] } : s) });
                                    }}
                                    className="w-full py-3 border-2 border-dashed border-slate-100 rounded-2xl text-[10px] font-black text-blue-400 uppercase tracking-widest hover:bg-blue-50 hover:border-blue-200 transition-all flex items-center justify-center mt-4"
                                >
                                    <PlusIcon className="w-4 h-4 mr-2" /> Adicionar tarefa nesta fase
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={addStage} className="w-full py-10 border-4 border-dashed border-slate-200 rounded-[3rem] text-slate-300 hover:text-blue-400 hover:border-blue-100 transition-all flex flex-col items-center justify-center gap-4 group">
                        <PlusIcon className="w-12 h-12 group-hover:scale-110 transition-transform" />
                        <span className="font-black uppercase tracking-[0.3em] text-sm">Criar Nova Seção de Projeto</span>
                    </button>
                </div>
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-50 animate-slideUp">
                    <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-5 border border-slate-700 flex items-center justify-between gap-4 backdrop-blur-md bg-slate-900/95">
                        <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                                <HistoryIcon className="w-7 h-7 text-white" />
                             </div>
                             <div>
                                <p className="text-xs font-black uppercase tracking-widest">Alterações Pendentes</p>
                                <p className="text-[10px] text-slate-400">Você modificou a estrutura de precificação ou a equipe.</p>
                             </div>
                        </div>
                        <div className="flex gap-3">
                             <button onClick={() => { setDraftModel(pricingData || INITIAL_PRICING_MODEL); setHasChanges(false); }} className="px-6 py-3 text-[10px] font-black uppercase text-slate-400 hover:text-white transition-colors">Descartar</button>
                             <button onClick={handleSave} className="px-10 py-3 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg">Salvar Configuração</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pricing;
