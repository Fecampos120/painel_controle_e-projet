
import React, { useState, useMemo } from 'react';
import { PricingModel, PricingParticipant, PricingStage, PricingTask, Expense } from '../types';
import { INITIAL_PRICING_MODEL } from '../constants';
import { TrashIcon, PlusIcon, PrinterIcon, ChevronLeftIcon, ChevronRightIcon, MoneyBagIcon } from './Icons';

interface PricingProps {
    expenses: Expense[];
    pricingData?: PricingModel;
    onUpdatePricing: (data: PricingModel) => void;
}

const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Pricing: React.FC<PricingProps> = ({ expenses, pricingData, onUpdatePricing }) => {
    const model = pricingData || INITIAL_PRICING_MODEL;

    // Cálculo do Overhead Mensal (Soma das despesas fixas do mês atual)
    const monthlyOverhead = useMemo(() => {
        const today = new Date();
        return expenses
            .filter(e => e.category === 'Fixa' && new Date(e.dueDate).getMonth() === today.getMonth())
            .reduce((acc, curr) => acc + curr.amount, 0);
    }, [expenses]);

    // Cálculos Totais
    const totals = useMemo(() => {
        let totalHours = 0;
        let directCost = 0;

        const calculateTasks = (tasks: PricingTask[]) => {
            tasks.forEach(t => {
                totalHours += t.hours;
                const part = model.participants.find(p => p.id === t.participantId);
                directCost += t.hours * (part?.hourlyRate || 0);
            });
        };

        model.stages.forEach(stage => {
            calculateTasks(stage.tasks);
            stage.environments?.forEach(env => calculateTasks(env.tasks));
        });

        const indirectCosts = monthlyOverhead > 0 ? (directCost * 0.2) : 0; // Exemplo: 20% do custo direto como provisão se houver overhead
        const subtotal = directCost + indirectCosts;
        const profit = subtotal * (model.profitPercentage / 100);
        const taxes = (subtotal + profit) * (model.taxPercentage / 100);
        const finalValue = subtotal + profit + taxes;

        return { totalHours, directCost, indirectCosts, profit, taxes, finalValue };
    }, [model, monthlyOverhead]);

    // Handlers
    const updateModel = (updates: Partial<PricingModel>) => {
        onUpdatePricing({ ...model, ...updates });
    };

    const handleTaskChange = (stageId: number, envId: number | null, taskId: number, field: keyof PricingTask, value: any) => {
        const newStages = model.stages.map(s => {
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
        updateModel({ stages: newStages });
    };

    return (
        <div className="space-y-6">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Calculadora de Precificação</h1>
                <p className="mt-1 text-blue-100 italic text-sm">Cálculo baseado em HH (Homem-Hora) e Custos Reais.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* COLUNA ESQUERDA: CONFIGURAÇÕES E RESUMO */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Equipe */}
                    <div className="bg-white p-5 rounded-xl shadow border border-slate-200">
                        <div className="flex items-center text-blue-600 font-bold mb-4">
                            <MoneyBagIcon className="w-5 h-5 mr-2" /> Equipe e Valores HH
                        </div>
                        <div className="space-y-4">
                            {model.participants.map(p => (
                                <div key={p.id} className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-slate-400">
                                        {p.isPrincipal ? 'Arquiteto Principal (Valor/H)' : 'Participante'}
                                    </label>
                                    <div className="flex gap-2">
                                        {!p.isPrincipal && <input type="text" value={p.name} className="flex-1 text-sm border-slate-200 rounded" readOnly />}
                                        <div className="relative flex-1">
                                            <span className="absolute left-3 top-2 text-slate-400 text-sm">R$</span>
                                            <input 
                                                type="number" 
                                                value={p.hourlyRate} 
                                                onChange={(e) => {
                                                    const rate = parseFloat(e.target.value) || 0;
                                                    updateModel({ participants: model.participants.map(part => part.id === p.id ? {...part, hourlyRate: rate} : part) });
                                                }}
                                                className="w-full pl-9 text-sm font-bold border-slate-200 rounded" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button className="text-blue-600 text-xs font-bold flex items-center hover:underline">
                                <PlusIcon className="w-3 h-3 mr-1"/> Adicionar Colaborador
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
                                <p className="text-[9px] text-slate-400 italic">Puxado automaticamente do módulo de Despesas.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Impostos (%)</label>
                                    <input 
                                        type="number" 
                                        value={model.taxPercentage} 
                                        onChange={e => updateModel({ taxPercentage: parseFloat(e.target.value) || 0 })}
                                        className="w-full mt-1 text-sm border-slate-200 rounded" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Margem Lucro (%)</label>
                                    <input 
                                        type="number" 
                                        value={model.profitPercentage} 
                                        onChange={e => updateModel({ profitPercentage: parseFloat(e.target.value) || 0 })}
                                        className="w-full mt-1 text-sm border-slate-200 rounded" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Resumo da Proposta */}
                    <div className="bg-[#1e293b] text-white p-6 rounded-xl shadow-xl">
                        <div className="flex items-center text-blue-400 font-bold mb-6">
                            <MoneyBagIcon className="w-5 h-5 mr-2" /> Resumo da Proposta
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span className="text-slate-400 font-medium">Total Horas:</span>
                                <span className="font-bold">{totals.totalHours}h</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span className="text-slate-400 font-medium">Custo Direto Equipe:</span>
                                <span className="font-bold">{formatCurrency(totals.directCost)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span className="text-slate-400 font-medium">Custos Indiretos:</span>
                                <span className="font-bold">{formatCurrency(totals.indirectCosts)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span className="text-slate-400 font-medium">Impostos ({model.taxPercentage}%):</span>
                                <span className="font-bold">{formatCurrency(totals.taxes)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-700 pb-2">
                                <span className="text-slate-400 font-medium text-green-400">Lucro Desejado ({model.profitPercentage}%):</span>
                                <span className="font-bold text-green-400">{formatCurrency(totals.profit)}</span>
                            </div>
                            <div className="pt-6">
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">VALOR SUGERIDO DO PROJETO</label>
                                <p className="text-4xl font-black text-white">{formatCurrency(totals.finalValue)}</p>
                            </div>
                            <button className="w-full mt-6 flex items-center justify-center py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-all transform active:scale-95 shadow-lg">
                                <PrinterIcon className="w-5 h-5 mr-2" /> Gerar Proposta PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: ESTRATÉGIA DE HORAS */}
                <div className="lg:col-span-8 bg-white p-6 rounded-xl shadow border border-slate-200">
                    <div className="flex justify-between items-center mb-8 border-b pb-4">
                        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Estratégia de Horas por Etapa</h2>
                        <input 
                            type="text" 
                            placeholder="Nome do Projeto" 
                            value={model.projectName}
                            onChange={e => updateModel({ projectName: e.target.value })}
                            className="text-right border-none focus:ring-0 text-slate-400 font-medium placeholder-slate-200"
                        />
                    </div>

                    <div className="space-y-4">
                        {model.stages.map(stage => (
                            <div key={stage.id} className="border border-slate-100 rounded-lg overflow-hidden">
                                <div 
                                    className="bg-slate-50 p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => {
                                        const newStages = model.stages.map(s => s.id === stage.id ? {...s, isOpen: !s.isOpen} : s);
                                        updateModel({ stages: newStages });
                                    }}
                                >
                                    <div className="flex items-center font-bold text-slate-700 text-xs uppercase tracking-wider">
                                        <span className="mr-2 text-blue-600">{stage.number}.</span> {stage.name}
                                    </div>
                                    <div className="flex items-center text-[10px] font-bold text-slate-400">
                                        <span className="mr-4">
                                            {stage.tasks.reduce((a,b) => a+b.hours, 0) + (stage.environments?.reduce((a,e) => a + e.tasks.reduce((x,y) => x+y.hours, 0), 0) || 0)}h total
                                        </span>
                                        <ChevronRightIcon className={`w-4 h-4 transition-transform ${stage.isOpen ? 'rotate-90' : ''}`} />
                                    </div>
                                </div>

                                {stage.isOpen && (
                                    <div className="p-4 space-y-4 bg-white">
                                        {/* Tarefas Padrão da Etapa */}
                                        <div className="space-y-1">
                                            {stage.tasks.map(task => (
                                                <div key={task.id} className="grid grid-cols-12 gap-4 items-center group py-1 border-b border-slate-50 last:border-0">
                                                    <div className="col-span-8 text-xs text-slate-600">{task.description}</div>
                                                    <div className="col-span-2">
                                                        <input 
                                                            type="number" 
                                                            value={task.hours} 
                                                            onChange={e => handleTaskChange(stage.id, null, task.id, 'hours', parseFloat(e.target.value) || 0)}
                                                            className="w-full text-right text-xs border-none bg-transparent hover:bg-slate-50 focus:bg-white rounded transition-all font-bold" 
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <select 
                                                            value={task.participantId} 
                                                            onChange={e => handleTaskChange(stage.id, null, task.id, 'participantId', parseInt(e.target.value))}
                                                            className="w-full text-[10px] border-none bg-transparent focus:ring-0 text-slate-400 font-medium"
                                                        >
                                                            {model.participants.map(p => <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Ambientes (específico para Anteprojeto) */}
                                        {stage.environments && stage.environments.length > 0 && (
                                            <div className="space-y-4 mt-6">
                                                {stage.environments.map(env => (
                                                    <div key={env.id} className="p-4 bg-blue-50/30 rounded-lg border border-blue-100 relative">
                                                        <div className="text-[10px] font-black text-blue-600 uppercase mb-3 flex justify-between">
                                                            {env.name}
                                                            <button className="text-red-300 hover:text-red-500"><TrashIcon className="w-3 h-3"/></button>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {env.tasks.map(task => (
                                                                <div key={task.id} className="grid grid-cols-12 gap-4 items-center text-xs">
                                                                    <div className="col-span-8 text-slate-500 italic">{task.description}</div>
                                                                    <div className="col-span-2">
                                                                        <input 
                                                                            type="number" 
                                                                            value={task.hours} 
                                                                            onChange={e => handleTaskChange(stage.id, env.id, task.id, 'hours', parseFloat(e.target.value) || 0)}
                                                                            className="w-full text-right border-none bg-transparent font-bold" 
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2">
                                                                         <select 
                                                                            value={task.participantId} 
                                                                            onChange={e => handleTaskChange(stage.id, env.id, task.id, 'participantId', parseInt(e.target.value))}
                                                                            className="w-full text-[10px] border-none bg-transparent text-slate-400"
                                                                        >
                                                                            {model.participants.map(p => <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>)}
                                                                        </select>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                <button className="w-full border-2 border-dashed border-blue-100 rounded-lg py-3 text-blue-400 text-[10px] font-bold uppercase hover:bg-blue-50 transition-all">
                                                    + Adicionar Ambiente ao Anteprojeto
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
