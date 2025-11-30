
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import StatCard from './StatCard';
import { CreditCardIcon, TrendingDownIcon, TrashIcon, CheckCircleIcon } from './Icons';

interface ExpensesProps {
    expenses: Expense[];
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onDeleteExpense: (id: number) => void;
    onUpdateExpense: (expense: Expense) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const Expenses: React.FC<ExpensesProps> = ({ expenses, onAddExpense, onDeleteExpense, onUpdateExpense }) => {
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
    });

    const [formData, setFormData] = useState({
        description: '',
        category: 'Variável' as Expense['category'],
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Pendente' as Expense['status'],
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' })
    }));

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.dueDate);
            return expenseDate.getMonth() === selectedDate.month && expenseDate.getFullYear() === selectedDate.year;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [expenses, selectedDate]);

    const stats = useMemo(() => {
        let total = 0;
        let fixed = 0;
        let variable = 0;
        let paid = 0;
        let pending = 0;

        filteredExpenses.forEach(exp => {
            total += exp.amount;
            if (exp.category === 'Fixa') fixed += exp.amount;
            else variable += exp.amount;

            if (exp.status === 'Pago') paid += exp.amount;
            else pending += exp.amount;
        });

        return { total, fixed, variable, paid, pending };
    }, [filteredExpenses]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (!formData.description || isNaN(amount) || amount <= 0) {
            alert('Preencha os campos corretamente.');
            return;
        }

        onAddExpense({
            description: formData.description,
            category: formData.category,
            amount: amount,
            dueDate: formData.dueDate,
            status: formData.status,
            paidDate: formData.status === 'Pago' ? formData.dueDate : undefined
        });

        setFormData({
            description: '',
            category: 'Variável',
            amount: '',
            dueDate: new Date().toISOString().split('T')[0],
            status: 'Pendente',
        });
    };

    const handleToggleStatus = (expense: Expense) => {
        const newStatus = expense.status === 'Pendente' ? 'Pago' : 'Pendente';
        onUpdateExpense({
            ...expense,
            status: newStatus,
            paidDate: newStatus === 'Pago' ? new Date().toISOString().split('T')[0] : undefined
        });
    };

    return (
        <div className="space-y-8">
            <header className="bg-red-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Despesas do Escritório</h1>
                <p className="mt-1 text-red-100">
                    Controle de custos fixos e variáveis.
                </p>
            </header>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-4">
                <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-slate-600">Mês</label>
                    <select
                        id="month-select"
                        value={selectedDate.month}
                        onChange={e => setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                        className="mt-1 block w-48 rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 px-3"
                    >
                        {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="year-select" className="block text-sm font-medium text-slate-600">Ano</label>
                    <select
                        id="year-select"
                        value={selectedDate.year}
                        onChange={e => setSelectedDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                        className="mt-1 block w-32 rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 px-3"
                    >
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Despesas (Mês)"
                    value={formatCurrency(stats.total)}
                    icon={<CreditCardIcon className="w-6 h-6 text-red-500" />}
                />
                <StatCard
                    title="Custos Fixos"
                    value={formatCurrency(stats.fixed)}
                    icon={<TrendingDownIcon className="w-6 h-6 text-orange-500" />}
                />
                <StatCard
                    title="Custos Variáveis"
                    value={formatCurrency(stats.variable)}
                    icon={<TrendingDownIcon className="w-6 h-6 text-yellow-500" />}
                />
                <StatCard
                    title="Pago no Mês"
                    value={formatCurrency(stats.paid)}
                    icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />}
                />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg sticky top-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Adicionar Despesa</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Aluguel, Internet..."
                                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 px-3"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Categoria</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 px-3 bg-white"
                                    >
                                        <option value="Fixa">Fixa</option>
                                        <option value="Variável">Variável</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Valor (R$)</label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 px-3"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Vencimento</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dueDate}
                                        onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">Status Inicial</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm h-10 px-3 bg-white"
                                    >
                                        <option value="Pendente">Pendente</option>
                                        <option value="Pago">Pago</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors shadow-sm"
                            >
                                Adicionar
                            </button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Lançamentos do Mês</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="p-3 text-sm font-semibold text-slate-600">Dia</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600">Descrição</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600">Cat.</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600 text-right">Valor</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600 text-center">Status</th>
                                        <th className="p-3 text-sm font-semibold text-slate-600 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredExpenses.map(expense => (
                                        <tr key={expense.id} className="hover:bg-slate-50">
                                            <td className="p-3 text-slate-700">{new Date(expense.dueDate).getUTCDate()}</td>
                                            <td className="p-3 text-slate-800 font-medium">{expense.description}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs rounded-full ${expense.category === 'Fixa' ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right text-slate-800 font-bold">{formatCurrency(expense.amount)}</td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleToggleStatus(expense)}
                                                    className={`px-2 py-1 text-xs font-bold rounded-full border transition-colors ${expense.status === 'Pago' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}
                                                >
                                                    {expense.status}
                                                </button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => onDeleteExpense(expense.id)}
                                                    className="text-slate-400 hover:text-red-600"
                                                    title="Excluir"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredExpenses.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center p-8 text-slate-500 italic">
                                                Nenhuma despesa lançada neste mês.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
