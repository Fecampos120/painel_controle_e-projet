
import React, { useState, useMemo, useEffect } from 'react';
import { PricingModel, PricingParticipant, PricingStage, PricingTask, Expense } from '../types';
import { INITIAL_PRICING_MODEL } from '../constants';
import { TrashIcon, PlusIcon, MoneyBagIcon, CheckCircleIcon, HistoryIcon, CreditCardIcon, TrendingUpIcon } from './Icons';

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
    const [monthlyWorkHours, setMonthlyWorkHours] = useState(160); // Horas produtivas padrão

    useEffect(() => {
        if (pricingData && !hasChanges) {
            setDraftModel(pricingData);
        }
    }, [pricingData, hasChanges]);

    // 1. SOMA REAL DAS DESPESAS FIXAS DO MÊS ATUAL
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

    // 2. CÁLCULO DO CUSTO DA HORA OPERACIONAL (BURDEN RATE)
    const operationalHourCost = useMemo(() => {
        if (monthlyWorkHours <= 0) return 0;
        return totalFixedExpenses / monthlyWorkHours;
    }, [totalFixedExpenses, monthlyWorkHours]);

    // 3. TOTAIS DO PROJETO LEVANDO EM CONTA OS GASTOS
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

        // O custo fixo alocado é: Horas do projeto * Custo operacional por hora
        const allocatedFixedCost = totalHours * operationalHourCost;
        const totalDirectCost = professionalCost + allocatedFixedCost;
        
        const profit = totalDirectCost * (draftModel.profitPercentage / 100);
        const subtotalWithProfit = totalDirectCost + profit;
        const taxes = subtotalWithProfit * (draftModel.taxPercentage / 100);
        const finalValue = subtotalWithProfit + taxes;

        return { 
            totalHours, 
            professionalCost, 
            allocatedFixedCost, 
            totalDirectCost, 
            profit, 
            taxes, 
            finalValue 
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

    return (
        <div className="space-y-6 pb-32 animate-fadeIn">
            <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-black uppercase tracking-tight">Precificação Inteligente</h1>
                <p className="mt-1 text-blue-100 italic text-sm">Seu lucro calculado com base nos seus gastos reais do escritório.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* COLUNA ESQUERDA: CUSTOS E MARGEM */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* CARD DE GASTOS REAIS (Vem do módulo de despesas) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center text-red-600 font-black text-xs uppercase tracking-widest mb-4">
                            <CreditCardIcon className="w-5 h-5 mr-2" /> Gastos Fixos do Mês
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total de Contas Fixas</p>
                                    <p className="text-2xl font-black text-slate-800">{formatCurrency(totalFixedExpenses)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Custo/Hora Escritório</p>
                                    <p className="text-lg font-black text-blue-600">{formatCurrency(operationalHourCost)}</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100">
                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Suas Horas Produtivas/Mês</label>
                                <input 
                                    type="number" 
                                    value={monthlyWorkHours} 
                                    onChange={e => setMonthlyWorkHours(parseInt(e.target.value) || 1)}
                                    className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl font-bold text-slate-700"
                                />
                                <p className="text-[9px] text-slate-400 mt-2 italic">* O sistema divide seus gastos fixos por essas horas para calcular o valor de cada hora de projeto.</p>
                            </div>
                        </div>
                    </div>

                    {/* EQUIPE */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center text-blue-600 font-black text-xs uppercase tracking-widest mb-4">
                            <PlusIcon className="w-5 h-5 mr-2" /> Valor da Hora (Pro-labore)
                        </div>
                        <div className="space-y-3">
                            {draftModel.participants.map(p => (
                                <div key={p.id} className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={p.name} 
                                        readOnly={p.isPrincipal}
                                        className={`flex-1 text-sm border-slate-200 rounded-lg h-10 px-3 ${p.isPrincipal ? 'bg-slate-50 font-bold' : ''}`} 
                                    />
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">R$</span>
                                        <input 
                                            type="number" 
                                            value={p.hourlyRate} 
                                            onChange={(e) => updateDraft({ participants: draftModel.participants.map(part => part.id === p.id ? {...part, hourlyRate: parseFloat(e.target.value) || 0} : part) })}
                                            className="w-24 text-right pr-3 text-sm font-black border-slate-200 rounded-lg h-10 bg-blue-50/30" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MARGENS */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center text-green-600 font-black text-xs uppercase tracking-widest mb-4">
                            <TrendingUpIcon className="w-5 h-5 mr-2" /> Impostos e Lucro
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Impostos (%)</label>
                                <input type="number" value={draftModel.taxPercentage} onChange={e => updateDraft({ taxPercentage: parseFloat(e.target.value) || 0 })} className="w-full h-10 px-3 bg-slate-50 border-slate-200 rounded-lg font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Lucro Real (%)</label>
                                <input type="number" value={draftModel.profitPercentage} onChange={e => updateDraft({ profitPercentage: parseFloat(e.target.value) || 0 })} className="w-full h-10 px-3 bg-slate-50 border-slate-200 rounded-lg font-bold text-green-600" />
                            </div>
                        </div>
                    </div>

                    {/* RESULTADO FINAL */}
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl space-y-4">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Mão de Obra:</span>
                            <span>{formatCurrency(totals.professionalCost)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Gasto Escritório:</span>
                            <span className="text-red-400">{formatCurrency(totals.allocatedFixedCost)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span>Impostos:</span>
                            <span>{formatCurrency(totals.taxes)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black text-green-400 uppercase tracking-widest pt-2 border-t border-slate-800">
                            <span>Lucro Real:</span>
                            <span>{formatCurrency(totals.profit)}</span>
                        </div>
                        <div className="pt-4">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Valor Sugerido do Projeto</p>
                            <p className="text-4xl font-black text-white">{formatCurrency(totals.finalValue)}</p>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: ESTRUTURA DE HORAS */}
                <div className="lg:col-span-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b">
                        <h2 className="text-xl font-black text-slate-800 uppercase">Estimativa de Esforço</h2>
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Total de Horas:</span>
                             <span className="bg-blue-600 text-white px-3 py-1 rounded-lg font-black text-lg">{totals.totalHours}h</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {draftModel.stages.map(stage => (
                            <div key={stage.id} className="border border-slate-100 rounded-2xl overflow-hidden group">
                                <div className="bg-slate-50 p-4 flex justify-between items-center group-hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center">
                                        <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 font-black text-xs mr-3 shadow-sm">{stage.number}</span>
                                        <span className="font-black text-slate-700 text-xs uppercase tracking-tight">{stage.name}</span>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-full border">
                                        {stage.tasks.reduce((a,b) => a+b.hours, 0)}h
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {stage.tasks.map(task => (
                                        <div key={task.id} className="grid grid-cols-12 gap-4 items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                            <div className="col-span-7">
                                                <input 
                                                    className="w-full text-sm font-medium border-none focus:ring-0 p-0 text-slate-600 bg-transparent"
                                                    value={task.description}
                                                    onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, description: e.target.value } : t) } : s) })}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <div className="relative">
                                                    <input 
                                                        type="number"
                                                        className="w-full text-right text-sm border-slate-200 rounded-lg h-9 px-2 font-black text-blue-600"
                                                        value={task.hours}
                                                        onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, hours: parseFloat(e.target.value) || 0 } : t) } : s) })}
                                                    />
                                                    <span className="absolute -top-3 left-0 text-[8px] font-bold text-slate-400 uppercase">Horas</span>
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <select 
                                                    className="w-full text-[10px] border-slate-100 rounded-lg h-9 font-black uppercase text-slate-500 bg-slate-50"
                                                    value={task.participantId}
                                                    onChange={e => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, participantId: parseInt(e.target.value) } : t) } : s) })}
                                                >
                                                    {draftModel.participants.map(p => <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>)}
                                                </select>
                                            </div>
                                            <button onClick={() => updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: s.tasks.filter(t => t.id !== task.id) } : s) })} className="col-span-1 text-slate-300 hover:text-red-500 transition-colors">
                                                <TrashIcon className="w-5 h-5 ml-auto" />
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={() => {
                                            const newTask: PricingTask = { id: Date.now(), description: 'Nova Tarefa', hours: 1, participantId: draftModel.participants[0].id };
                                            updateDraft({ stages: draftModel.stages.map(s => s.id === stage.id ? { ...s, tasks: [...s.tasks, newTask] } : s) });
                                        }}
                                        className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2 hover:text-blue-700 flex items-center"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-1" /> Add Tarefa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* BARRA DE SALVAMENTO FLUTUANTE */}
            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 z-50 animate-slideUp">
                    <div className="bg-slate-900 text-white rounded-3xl shadow-2xl p-5 border border-slate-700 flex items-center justify-between gap-4 backdrop-blur-md bg-slate-900/95 ring-8 ring-slate-900/10">
                        <div className="flex items-center space-x-4">
                             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <HistoryIcon className="w-6 h-6 text-white" />
                             </div>
                             <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-100">Cálculo de Lucro Atualizado</p>
                                <p className="text-[10px] text-slate-400">Suas despesas fixas foram aplicadas ao valor final.</p>
                             </div>
                        </div>
                        <button 
                            onClick={handleSave} 
                            className="px-12 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-900/20 transition-all active:scale-95"
                        >
                            SALVAR TUDO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pricing;
