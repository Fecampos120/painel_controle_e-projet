
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, FixedExpenseTemplate } from '../types';
import StatCard from './StatCard';
import { CreditCardIcon, TrendingDownIcon, TrashIcon, CheckCircleIcon, PlusIcon, XIcon, CogIcon } from './Icons';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Expenses: React.FC<any> = ({ 
    expenses = [], 
    fixedExpenseTemplates = [], 
    onAddExpense, 
    onAddBulkExpenses,
    onDeleteExpense, 
    onUpdateExpense,
    onAddFixedExpenseTemplate,
    onDeleteFixedExpenseTemplate
}) => {
    const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });
    const [isFixedManagerOpen, setIsFixedManagerOpen] = useState(false);
    const [fixedTemplateForm, setFixedTemplateForm] = useState({ description: '', amount: '', day: '5' });
    const [formData, setFormData] = useState({
        description: '',
        category: 'Variável' as any,
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Pendente' as any,
    });

    const filteredExpenses = useMemo(() => {
        return expenses.filter((e: any) => {
            const d = new Date(e.dueDate + 'T12:00:00');
            return d.getMonth() === selectedDate.month && d.getFullYear() === selectedDate.year;
        }).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [expenses, selectedDate]);

    useEffect(() => {
        const missing = fixedExpenseTemplates.filter((t: any) => 
            !filteredExpenses.some((e: any) => e.description === t.description && e.category === 'Fixa')
        );
        if (missing.length > 0) {
            const m = String(selectedDate.month + 1).padStart(2, '0');
            const y = String(selectedDate.year);
            const newExps = missing.map((t: any) => ({
                description: t.description, category: 'Fixa' as const, amount: t.amount,
                dueDate: `${y}-${m}-${String(t.day).padStart(2, '0')}`, status: 'Pendente' as const
            }));
            onAddBulkExpenses(newExps);
        }
    }, [selectedDate, fixedExpenseTemplates, filteredExpenses, onAddBulkExpenses]);

    const stats = useMemo(() => {
        let total = 0, paid = 0;
        filteredExpenses.forEach((exp: any) => {
            total += exp.amount;
            if (exp.status === 'Pago') paid += exp.amount;
        });
        return { total, paid };
    }, [filteredExpenses]);

    const togglePaid = (exp: Expense) => {
        const newStatus = exp.status === 'Pago' ? 'Pendente' : 'Pago';
        onUpdateExpense({ ...exp, status: newStatus, paidDate: newStatus === 'Pago' ? new Date().toISOString().split('T')[0] : undefined });
    };

    const handleAddFixedTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!fixedTemplateForm.description || !fixedTemplateForm.amount) return;
        onAddFixedExpenseTemplate({
            description: fixedTemplateForm.description.toUpperCase(),
            amount: parseFloat(fixedTemplateForm.amount),
            day: parseInt(fixedTemplateForm.day)
        });
        setFixedTemplateForm({ description: '', amount: '', day: '5' });
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-24 uppercase font-bold">
            <header className="bg-red-600 text-white p-8 rounded-xl shadow-lg -mx-4 md:-mx-8 lg:-mx-10 -mt-4 md:-mt-8 lg:-mt-10 mb-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">FLUXO DE DESPESAS</h1>
                        <p className="mt-1 text-red-100 italic text-sm">CUSTOS FIXOS SÃO REPLICADOS AUTOMATICAMENTE.</p>
                    </div>
                    <button onClick={() => setIsFixedManagerOpen(true)} className="px-6 py-3 bg-white/20 hover:bg-white/30 rounded-xl flex items-center uppercase text-xs tracking-widest transition-all">
                        <CogIcon className="w-5 h-5 mr-2" /> GERENCIAR FIXOS
                    </button>
                </div>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
                <div className="flex gap-4">
                    <select value={selectedDate.month} onChange={e => setSelectedDate({...selectedDate, month: parseInt(e.target.value)})} className="rounded-lg h-11 px-4 bg-slate-50 font-black">
                        {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}</option>)}
                    </select>
                    <select value={selectedDate.year} onChange={e => setSelectedDate({...selectedDate, year: parseInt(e.target.value)})} className="rounded-lg h-11 px-4 bg-slate-50 font-black">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="text-[10px] text-red-600 font-black tracking-widest">● ÁREA DE CUSTOS OPERACIONAIS</div>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="PREVISÃO MÊS" value={formatCurrency(stats.total)} icon={<CreditCardIcon className="w-6 h-6 text-red-600" />} />
                <StatCard title="TOTAL PAGO" value={formatCurrency(stats.paid)} icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title="SALDO DEVEDOR" value={formatCurrency(stats.total - stats.paid)} icon={<TrendingDownIcon className="w-6 h-6 text-orange-500" />} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="text-[10px] text-slate-400 font-black uppercase mb-4">NOVA DESPESA VARIÁVEL</h2>
                        <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value.toUpperCase()})} placeholder="O QUE VOCÊ COMPROU?" className="w-full h-11 px-4 bg-slate-50 rounded-lg outline-none font-bold" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="VALOR R$" className="w-full h-11 px-4 bg-slate-50 rounded-lg font-black" />
                            <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full h-11 px-4 bg-slate-50 rounded-lg text-xs" />
                        </div>
                        <button onClick={() => onAddExpense({...formData, amount: parseFloat(formData.amount), description: formData.description.toUpperCase()})} className="w-full py-4 bg-red-600 text-white rounded-xl uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg">LANÇAR DESPESA</button>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b text-[10px] text-slate-400">
                                <tr>
                                    <th className="p-5">DATA</th>
                                    <th className="p-5">DESCRIÇÃO</th>
                                    <th className="p-5 text-right">VALOR</th>
                                    <th className="p-5 text-center">BAIXA</th>
                                    <th className="p-5 text-right">AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredExpenses.map((exp: any) => (
                                    <tr key={exp.id} className={exp.status === 'Pago' ? 'bg-green-50/10 opacity-70' : ''}>
                                        <td className="p-5 font-black text-slate-400">{new Date(exp.dueDate + 'T12:00:00').getDate()}</td>
                                        <td className="p-5">
                                            <p className={`text-sm ${exp.status === 'Pago' ? 'line-through' : ''}`}>{exp.description}</p>
                                            <span className="text-[8px] text-red-400">{exp.category}</span>
                                        </td>
                                        <td className="p-5 text-right font-black">{formatCurrency(exp.amount)}</td>
                                        <td className="p-5 text-center">
                                            <input type="checkbox" checked={exp.status === 'Pago'} onChange={() => togglePaid(exp)} className="w-6 h-6 rounded-lg text-green-600 cursor-pointer" />
                                        </td>
                                        <td className="p-5 text-right">
                                            <button onClick={() => onDeleteExpense(exp.id)} className="text-slate-300 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5 ml-auto" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isFixedManagerOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center border-b border-white/10">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Custos Fixos Mensais</h3>
                                <p className="text-red-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em]">Modelos que repetem todo mês</p>
                            </div>
                            <button onClick={() => setIsFixedManagerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none">
                                <XIcon className="w-8 h-8 text-slate-400" />
                            </button>
                        </div>

                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                            <form onSubmit={handleAddFixedTemplate} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Novo Modelo Fixo</h4>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-6">
                                        <input 
                                            value={fixedTemplateForm.description} 
                                            onChange={e => setFixedTemplateForm({...fixedTemplateForm, description: e.target.value.toUpperCase()})} 
                                            placeholder="DESCRIÇÃO (EX: ALUGUEL)" 
                                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none" 
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <input 
                                            type="number" 
                                            value={fixedTemplateForm.amount} 
                                            onChange={e => setFixedTemplateForm({...fixedTemplateForm, amount: e.target.value})} 
                                            placeholder="VALOR R$" 
                                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-black text-red-600 outline-none" 
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <select 
                                            value={fixedTemplateForm.day} 
                                            onChange={e => setFixedTemplateForm({...fixedTemplateForm, day: e.target.value})} 
                                            className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                                        >
                                            {Array.from({length: 31}, (_, i) => <option key={i+1} value={i+1}>DIA {i+1}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-3 bg-red-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-red-700 transition-all shadow-lg">
                                    + ADICIONAR MODELO FIXO
                                </button>
                            </form>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelos Ativos</h4>
                                {fixedExpenseTemplates.map((t: any) => (
                                    <div key={t.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm group">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 uppercase">{t.description}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">TODO DIA {t.day} • {formatCurrency(t.amount)}</p>
                                        </div>
                                        <button onClick={() => onDeleteFixedExpenseTemplate(t.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                                {fixedExpenseTemplates.length === 0 && (
                                    <div className="py-10 text-center opacity-30 italic text-slate-400 text-sm">Nenhum custo fixo cadastrado.</div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
                            <button onClick={() => setIsFixedManagerOpen(false)} className="px-10 py-3 bg-slate-900 text-white font-black text-xs tracking-widest uppercase rounded-xl">FECHAR GERENCIADOR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
