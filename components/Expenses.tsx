
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, FixedExpenseTemplate } from '../types';
import StatCard from './StatCard';
import { CreditCardIcon, TrendingDownIcon, TrashIcon, CheckCircleIcon, PlusIcon, XIcon, PencilIcon, HistoryIcon } from './Icons';

interface ExpensesProps {
    expenses: Expense[];
    fixedExpenseTemplates: FixedExpenseTemplate[];
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onDeleteExpense: (id: number) => void;
    onUpdateExpense: (expense: Expense) => void;
    onAddFixedExpenseTemplate: (template: Omit<FixedExpenseTemplate, 'id'>) => void;
    onDeleteFixedExpenseTemplate: (id: number) => void;
    // Adicionamos um handler em massa para salvar as mudanças do mês
    onBulkUpdateExpenses?: (expenses: Expense[]) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Expenses: React.FC<ExpensesProps> = ({ 
    expenses, 
    fixedExpenseTemplates = [], 
    onAddExpense, 
    onDeleteExpense, 
    onUpdateExpense,
    onAddFixedExpenseTemplate,
    onDeleteFixedExpenseTemplate
}) => {
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });

    const [draftExpenses, setDraftExpenses] = useState<Expense[]>(expenses);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (!hasChanges) setDraftExpenses(expenses);
    }, [expenses, hasChanges]);

    const [formData, setFormData] = useState({
        description: '',
        category: 'Variável' as Expense['category'],
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Pendente' as Expense['status'],
    });

    const [isFixedManagerOpen, setIsFixedManagerOpen] = useState(false);
    const [fixedTemplateData, setFixedTemplateData] = useState({ description: '', amount: '', day: '5' });

    const filteredExpenses = useMemo(() => {
        return draftExpenses.filter(expense => {
            const expenseDate = new Date(expense.dueDate);
            return expenseDate.getMonth() === selectedDate.month && expenseDate.getFullYear() === selectedDate.year;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [draftExpenses, selectedDate]);

    const stats = useMemo(() => {
        let total = 0, fixed = 0, variable = 0, paid = 0;
        filteredExpenses.forEach(exp => {
            total += exp.amount;
            if (exp.category === 'Fixa') fixed += exp.amount; else variable += exp.amount;
            if (exp.status === 'Pago') paid += exp.amount;
        });
        return { total, fixed, variable, paid };
    }, [filteredExpenses]);

    const handleSave = () => {
        // Como o app usa LocalStorage direto via props, vamos atualizar as despesas alteradas
        // No mundo real, aqui seria um setAppData completo
        draftExpenses.forEach(de => {
            const original = expenses.find(e => e.id === de.id);
            if (original && JSON.stringify(original) !== JSON.stringify(de)) {
                onUpdateExpense(de);
            }
        });
        setHasChanges(false);
        alert('Alterações salvas!');
    };

    const handleUndo = () => {
        if (window.confirm('Descartar alterações e voltar ao estado salvo?')) {
            setDraftExpenses(expenses);
            setHasChanges(false);
        }
    };

    const handleClearMonth = () => {
        if (window.confirm('Deseja excluir TODAS as despesas visualizadas neste mês?')) {
            const idsToRemove = filteredExpenses.map(e => e.id);
            setDraftExpenses(prev => prev.filter(e => !idsToRemove.includes(e.id)));
            setHasChanges(true);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (!formData.description || isNaN(amount) || amount <= 0) return;

        const newExp: Expense = {
            id: Date.now(),
            description: formData.description,
            category: formData.category,
            amount: amount,
            dueDate: formData.dueDate,
            status: formData.status,
            paidDate: formData.status === 'Pago' ? formData.dueDate : undefined
        };

        setDraftExpenses(prev => [...prev, newExp]);
        setHasChanges(true);
        setFormData({ ...formData, description: '', amount: '' });
    };

    const handleToggleStatus = (expenseId: number) => {
        setDraftExpenses(prev => prev.map(e => {
            if (e.id !== expenseId) return e;
            const newStatus = e.status === 'Pendente' ? 'Pago' : 'Pendente';
            return { ...e, status: newStatus, paidDate: newStatus === 'Pago' ? new Date().toISOString().split('T')[0] : undefined };
        }));
        setHasChanges(true);
    };

    return (
        <div className="space-y-8 pb-32">
            <header className="bg-red-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Financeiro: Despesas</h1>
                        <p className="mt-1 text-red-100">Gestão de custos do escritório.</p>
                    </div>
                    <button onClick={handleClearMonth} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-black uppercase flex items-center transition-all">
                        <TrashIcon className="w-4 h-4 mr-2" /> Limpar Mês
                    </button>
                </div>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-4">
                    <select value={selectedDate.month} onChange={e => setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }))} className="rounded-md border-slate-300 h-10 px-3">
                        {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>)}
                    </select>
                    <select value={selectedDate.year} onChange={e => setSelectedDate(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="rounded-md border-slate-300 h-10 px-3">
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <button onClick={() => setIsFixedManagerOpen(true)} className="px-4 py-2 border border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md font-bold text-xs uppercase tracking-widest transition-colors">
                    + Configurar Fixas
                </button>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total do Mês" value={formatCurrency(stats.total)} icon={<CreditCardIcon className="w-6 h-6 text-red-500" />} />
                <StatCard title="Custos Fixos" value={formatCurrency(stats.fixed)} icon={<TrendingDownIcon className="w-6 h-6 text-orange-500" />} />
                <StatCard title="Pago no Mês" value={formatCurrency(stats.paid)} icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title="A Pagar" value={formatCurrency(stats.total - stats.paid)} icon={<XIcon className="w-6 h-6 text-slate-400" />} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Nova Despesa</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descrição..." className="w-full rounded-md border-slate-300 h-10 px-3" />
                            <div className="grid grid-cols-2 gap-4">
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as any })} className="rounded-md border-slate-300 h-10 px-2 bg-white">
                                    <option value="Fixa">Fixa</option>
                                    <option value="Variável">Variável</option>
                                </select>
                                <input type="number" required step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" className="rounded-md border-slate-300 h-10 px-3 font-bold" />
                            </div>
                            <input type="date" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full rounded-md border-slate-300 h-10 px-3" />
                            <button type="submit" className="w-full py-3 bg-red-600 text-white font-black uppercase text-xs tracking-widest rounded-lg shadow-lg hover:bg-red-700 transition-all">Lançar Despesa</button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                <tr>
                                    <th className="p-4">Dia</th>
                                    <th className="p-4">Descrição</th>
                                    <th className="p-4 text-right">Valor</th>
                                    <th className="p-4 text-center">Status</th>
                                    <th className="p-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-slate-400 font-bold">{new Date(exp.dueDate).getUTCDate()}</td>
                                        <td className="p-4 font-bold text-slate-700">{exp.description} <span className="ml-2 text-[9px] text-slate-300 font-black uppercase">{exp.category}</span></td>
                                        <td className="p-4 text-right font-black text-slate-800">{formatCurrency(exp.amount)}</td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleToggleStatus(exp.id)} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest transition-all ${exp.status === 'Pago' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {exp.status}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => { setDraftExpenses(prev => prev.filter(e => e.id !== exp.id)); setHasChanges(true); }} className="text-slate-300 hover:text-red-500">
                                                <TrashIcon className="w-5 h-5 ml-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredExpenses.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-400 italic">Sem lançamentos para este mês.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {hasChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50 no-print animate-slideUp">
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border border-slate-700 flex items-center justify-between gap-4 backdrop-blur-sm bg-slate-900/95 ring-8 ring-black/5">
                        <div className="flex items-center space-x-3">
                             <HistoryIcon className="w-5 h-5 text-blue-400" />
                             <div>
                                <p className="text-xs font-black uppercase tracking-widest">Mudanças no Financeiro</p>
                                <p className="text-[10px] text-slate-400 mt-1">Lembre de salvar para consolidar no caixa.</p>
                             </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleUndo} className="px-5 py-2.5 bg-slate-800 text-slate-300 font-black text-[10px] uppercase rounded-xl hover:bg-slate-700 transition-all">DESFAZER</button>
                            <button onClick={handleSave} className="px-8 py-2.5 bg-green-600 text-white font-black text-[10px] uppercase rounded-xl hover:bg-green-700 shadow-xl shadow-green-900/20 transition-all">SALVAR MODIFICAÇÕES</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
