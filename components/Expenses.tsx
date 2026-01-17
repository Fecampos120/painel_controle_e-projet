
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, FixedExpenseTemplate } from '../types';
import StatCard from './StatCard';
import { CreditCardIcon, TrendingDownIcon, TrashIcon, CheckCircleIcon, PlusIcon, XIcon, CogIcon, ExclamationTriangleIcon } from './Icons';

interface ExpensesProps {
    expenses: Expense[];
    fixedExpenseTemplates: FixedExpenseTemplate[];
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onAddBulkExpenses: (expenses: Omit<Expense, 'id'>[]) => void;
    onDeleteExpense: (id: number) => void;
    onUpdateExpense: (expense: Expense) => void;
    onAddFixedExpenseTemplate: (template: Omit<FixedExpenseTemplate, 'id'>) => void;
    onDeleteFixedExpenseTemplate: (id: number) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Expenses: React.FC<ExpensesProps> = ({ 
    expenses = [], 
    fixedExpenseTemplates = [], 
    onAddExpense, 
    onAddBulkExpenses,
    onDeleteExpense, 
    onUpdateExpense,
    onAddFixedExpenseTemplate,
    onDeleteFixedExpenseTemplate
}) => {
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });

    const [isFixedManagerOpen, setIsFixedManagerOpen] = useState(false);
    const [fixedTemplateForm, setFixedTemplateForm] = useState({ description: '', amount: '', day: '5' });
    const [formData, setFormData] = useState({
        description: '',
        category: 'Variável' as Expense['category'],
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Pendente' as Expense['status'],
    });

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.dueDate + 'T12:00:00');
            return expenseDate.getMonth() === selectedDate.month && expenseDate.getFullYear() === selectedDate.year;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [expenses, selectedDate]);

    // EFEITO DE AUTO-LANÇAMENTO EM LOTE (BULK)
    useEffect(() => {
        const missing = fixedExpenseTemplates.filter(template => 
            !filteredExpenses.some(e => e.description === template.description && e.category === 'Fixa')
        );

        if (missing.length > 0) {
            const monthStr = String(selectedDate.month + 1).padStart(2, '0');
            const yearStr = String(selectedDate.year);
            
            const newExps = missing.map(template => ({
                description: template.description,
                category: 'Fixa' as const,
                amount: template.amount,
                dueDate: `${yearStr}-${monthStr}-${String(template.day).padStart(2, '0')}`,
                status: 'Pendente' as const
            }));
            
            onAddBulkExpenses(newExps);
        }
    }, [selectedDate, fixedExpenseTemplates, filteredExpenses, onAddBulkExpenses]);

    const stats = useMemo(() => {
        let total = 0, fixed = 0, variable = 0, paid = 0;
        filteredExpenses.forEach(exp => {
            total += exp.amount;
            if (exp.category === 'Fixa') fixed += exp.amount; else variable += exp.amount;
            if (exp.status === 'Pago') paid += exp.amount;
        });
        return { total, fixed, variable, paid };
    }, [filteredExpenses]);

    const handleAddVariable = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (!formData.description || isNaN(amount) || amount <= 0) return;

        onAddExpense({
            description: formData.description.toUpperCase(),
            category: formData.category,
            amount: amount,
            dueDate: formData.dueDate,
            status: formData.status,
            paidDate: formData.status === 'Pago' ? formData.dueDate : undefined
        });
        setFormData({ ...formData, description: '', amount: '' });
    };

    const handleAddFixedTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        const amt = parseFloat(fixedTemplateForm.amount);
        if (!fixedTemplateForm.description || isNaN(amt)) return;
        onAddFixedExpenseTemplate({
            description: fixedTemplateForm.description.toUpperCase(),
            amount: amt,
            day: parseInt(fixedTemplateForm.day)
        });
        setFixedTemplateForm({ description: '', amount: '', day: '5' });
    };

    const togglePaid = (exp: Expense) => {
        const newStatus = exp.status === 'Pago' ? 'Pendente' : 'Pago';
        onUpdateExpense({
            ...exp,
            status: newStatus,
            paidDate: newStatus === 'Pago' ? new Date().toISOString().split('T')[0] : undefined
        });
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            <header className="bg-red-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight">Fluxo de Despesas</h1>
                        <p className="mt-1 text-red-100 italic text-sm">Custos fixos são replicados automaticamente para todos os meses.</p>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setIsFixedManagerOpen(true)} 
                        className="px-6 py-3 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center shadow-lg"
                    >
                        <CogIcon className="w-5 h-5 mr-2" /> Gerenciar Modelos Fixos
                    </button>
                </div>
            </header>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mês de Referência</label>
                        <div className="flex gap-2">
                            <select value={selectedDate.month} onChange={e => setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }))} className="rounded-lg border-slate-200 h-11 px-4 font-bold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-red-500">
                                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' }).toUpperCase()}</option>)}
                            </select>
                            <select value={selectedDate.year} onChange={e => setSelectedDate(prev => ({ ...prev, year: parseInt(e.target.value) }))} className="rounded-lg border-slate-200 h-11 px-4 font-bold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-red-500">
                                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center text-slate-400 gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Auto-lançamento Inteligente Ativo</span>
                </div>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Previsão Total" value={formatCurrency(stats.total)} icon={<CreditCardIcon className="w-6 h-6 text-red-600" />} />
                <StatCard title="Total Fixo" value={formatCurrency(stats.fixed)} icon={<TrendingDownIcon className="w-6 h-6 text-orange-500" />} />
                <StatCard title="Total Pago" value={formatCurrency(stats.paid)} icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title="Saldo Devedor" value={formatCurrency(stats.total - stats.paid)} icon={<XIcon className="w-6 h-6 text-slate-300" />} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Nova Despesa Variável</h2>
                        <form onSubmit={handleAddVariable} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">O que você comprou?</label>
                                <input type="text" required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Papelaria, Software..." className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 font-bold" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Valor (R$)</label>
                                    <input type="number" required step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="0,00" className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm font-black outline-none focus:ring-2 focus:ring-red-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Vencimento</label>
                                    <input type="date" required value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-red-500" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl hover:bg-slate-800 transition-all">Lançar Variável</button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                <tr>
                                    <th className="p-5">Dia</th>
                                    <th className="p-5">Descrição</th>
                                    <th className="p-5 text-right">Valor</th>
                                    <th className="p-5 text-center">Dar Baixa</th>
                                    <th className="p-5 text-right">Excluir</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id} className={`hover:bg-slate-50/50 transition-colors group ${exp.status === 'Pago' ? 'bg-green-50/20' : ''}`}>
                                        <td className="p-5 text-slate-400 font-bold text-sm">{new Date(exp.dueDate + 'T12:00:00').getDate()}</td>
                                        <td className="p-5">
                                            <p className={`font-bold text-slate-800 text-sm uppercase ${exp.status === 'Pago' ? 'line-through text-slate-400' : ''}`}>{exp.description}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${exp.category === 'Fixa' ? 'text-orange-500' : 'text-blue-500'}`}>{exp.category}</span>
                                        </td>
                                        <td className="p-5 text-right font-black text-slate-900">{formatCurrency(exp.amount)}</td>
                                        <td className="p-5">
                                            <div className="flex flex-col items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={exp.status === 'Pago'} 
                                                    onChange={() => togglePaid(exp)}
                                                    className="w-6 h-6 rounded-lg border-2 border-slate-200 text-green-600 focus:ring-green-500 cursor-pointer transition-all hover:scale-110"
                                                />
                                                <span className={`mt-1 text-[8px] font-black uppercase tracking-widest ${exp.status === 'Pago' ? 'text-green-600' : 'text-red-400'}`}>
                                                    {exp.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <button onClick={() => window.confirm('EXCLUIR ESTE LANÇAMENTO?') && onDeleteExpense(exp.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                <TrashIcon className="w-5 h-5 ml-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center opacity-30">
                                                <CreditCardIcon className="w-12 h-12 mb-4" />
                                                <p className="text-sm font-black uppercase tracking-widest">Nenhuma despesa para este mês</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isFixedManagerOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight">Modelos Fixos</h3>
                                <p className="text-slate-400 text-xs font-bold mt-1">Lançados automaticamente em todos os meses.</p>
                            </div>
                            <button onClick={() => setIsFixedManagerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XIcon className="w-8 h-8 text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                                    <PlusIcon className="w-4 h-4 mr-2 text-blue-500" /> Novo Modelo
                                </h4>
                                <form onSubmit={handleAddFixedTemplate} className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição</label>
                                        <input type="text" required value={fixedTemplateForm.description} onChange={e => setFixedTemplateForm({...fixedTemplateForm, description: e.target.value})} placeholder="Aluguel, Adobe..." className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Valor R$</label>
                                            <input type="number" required step="0.01" value={fixedTemplateForm.amount} onChange={e => setFixedTemplateForm({...fixedTemplateForm, amount: e.target.value})} placeholder="0.00" className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl font-bold outline-none" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase">Dia Venc.</label>
                                            <input type="number" min="1" max="31" value={fixedTemplateForm.day} onChange={e => setFixedTemplateForm({...fixedTemplateForm, day: e.target.value})} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl text-center font-bold" />
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-lg">Salvar Modelo</button>
                                </form>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-h-[400px] overflow-y-auto">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Ativos ({fixedExpenseTemplates.length})</h4>
                                <div className="space-y-3">
                                    {fixedExpenseTemplates.map(t => (
                                        <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm uppercase">{t.description}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Dia {t.day} • {formatCurrency(t.amount)}</p>
                                            </div>
                                            <button onClick={() => onDeleteFixedExpenseTemplate(t.id)} className="text-red-300 hover:text-red-600">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
