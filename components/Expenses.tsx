
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, FixedExpenseTemplate } from '../types';
import StatCard from './StatCard';
import { CreditCardIcon, TrendingDownIcon, TrashIcon, CheckCircleIcon, PlusIcon, XIcon, PencilIcon } from './Icons';

interface ExpensesProps {
    expenses: Expense[];
    fixedExpenseTemplates: FixedExpenseTemplate[];
    onAddExpense: (expense: Omit<Expense, 'id'>) => void;
    onDeleteExpense: (id: number) => void;
    onUpdateExpense: (expense: Expense) => void;
    onAddFixedExpenseTemplate: (template: Omit<FixedExpenseTemplate, 'id'>) => void;
    onDeleteFixedExpenseTemplate: (id: number) => void;
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

    const [formData, setFormData] = useState({
        description: '',
        category: 'Variável' as Expense['category'],
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Pendente' as Expense['status'],
    });

    // Fixed Expense Management Modal State
    const [isFixedManagerOpen, setIsFixedManagerOpen] = useState(false);
    const [fixedTemplateData, setFixedTemplateData] = useState({
        description: '',
        amount: '',
        day: '5'
    });

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' })
    }));

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    // Auto-generate fixed expenses for the selected month
    useEffect(() => {
        if (!fixedExpenseTemplates || fixedExpenseTemplates.length === 0) return;

        let addedCount = 0;
        fixedExpenseTemplates.forEach(template => {
            // Construct expected due date for the current view month
            // Ensure day is valid for month (e.g. Feb 30 -> Feb 28/29)
            const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
            const safeDay = Math.min(template.day, daysInMonth);
            
            const dueDate = new Date(selectedDate.year, selectedDate.month, safeDay);
            const dueDateStr = dueDate.toISOString().split('T')[0];

            // Check if this fixed expense already exists for this month/year
            // Matching logic: Description + Category 'Fixa' + Month + Year + Approx Amount
            const exists = expenses.some(e => 
                e.description === template.description && 
                e.category === 'Fixa' &&
                Math.abs(e.amount - template.amount) < 0.01 && 
                new Date(e.dueDate).getMonth() === selectedDate.month &&
                new Date(e.dueDate).getFullYear() === selectedDate.year
            );

            if (!exists) {
                onAddExpense({
                    description: template.description,
                    category: 'Fixa',
                    amount: template.amount,
                    dueDate: dueDateStr,
                    status: 'Pendente',
                    recurrence: true,
                    recurrenceId: template.id
                });
                addedCount++;
            }
        });
        
        if (addedCount > 0) {
            console.log(`Auto-generated ${addedCount} fixed expenses for ${selectedDate.month + 1}/${selectedDate.year}`);
        }
    }, [selectedDate, fixedExpenseTemplates, expenses, onAddExpense]);


    const filteredExpenses = useMemo(() => {
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.dueDate);
            return expenseDate.getMonth() === selectedDate.month && expenseDate.getFullYear() === selectedDate.year;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [expenses, selectedDate]);

    const fixedExpenses = useMemo(() => filteredExpenses.filter(e => e.category === 'Fixa'), [filteredExpenses]);
    const variableExpenses = useMemo(() => filteredExpenses.filter(e => e.category !== 'Fixa'), [filteredExpenses]);

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

    const handleAddTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(fixedTemplateData.amount);
        const day = parseInt(fixedTemplateData.day);
        
        if (!fixedTemplateData.description || isNaN(amount) || amount <= 0 || isNaN(day) || day < 1 || day > 31) {
            alert('Preencha os campos corretamente.');
            return;
        }

        onAddFixedExpenseTemplate({
            description: fixedTemplateData.description,
            amount,
            day
        });

        setFixedTemplateData({ description: '', amount: '', day: '5' });
    };

    const renderExpenseTable = (list: Expense[], emptyText: string) => (
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
                    {list.map(expense => (
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
                    {list.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center p-6 text-slate-500 italic">
                                {emptyText}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="space-y-8">
            <header className="bg-red-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Despesas do Escritório</h1>
                <p className="mt-1 text-red-100">
                    Controle de custos fixos e variáveis.
                </p>
            </header>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-4">
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
                
                <button
                    onClick={() => setIsFixedManagerOpen(true)}
                    className="flex items-center justify-center px-4 py-2 border border-orange-500 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md shadow-sm text-sm font-medium transition-colors"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Gerenciar Despesas Fixas
                </button>
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
                                    placeholder="Ex: Uber, Café..."
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

                {/* Lists - Split by Fixed and Variable */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Fixed Expenses Section */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-orange-200">
                        <h2 className="text-lg font-bold text-orange-700 mb-4 flex items-center">
                            <TrendingDownIcon className="w-5 h-5 mr-2" />
                            Custos Fixos (Recorrentes)
                        </h2>
                        {renderExpenseTable(fixedExpenses, "Nenhum custo fixo para este mês.")}
                    </div>

                    {/* Variable Expenses Section */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <CreditCardIcon className="w-5 h-5 mr-2" />
                            Despesas Variáveis
                        </h2>
                        {renderExpenseTable(variableExpenses, "Nenhuma despesa variável lançada neste mês.")}
                    </div>
                </div>
            </div>

            {/* Fixed Expenses Manager Modal */}
            {isFixedManagerOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-slate-800">Gerenciar Despesas Fixas Automáticas</h3>
                            <button onClick={() => setIsFixedManagerOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-sm text-orange-800">
                                <p><strong>Como funciona:</strong> As despesas cadastradas aqui serão lançadas automaticamente em todos os meses que você acessar no painel de despesas, caso ainda não tenham sido lançadas.</p>
                            </div>

                            {/* Add Template Form */}
                            <form onSubmit={handleAddTemplate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Descrição</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={fixedTemplateData.description}
                                        onChange={e => setFixedTemplateData({...fixedTemplateData, description: e.target.value})}
                                        placeholder="Ex: Internet, Aluguel" 
                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Valor (R$)</label>
                                    <input 
                                        type="number" 
                                        required 
                                        step="0.01" 
                                        value={fixedTemplateData.amount}
                                        onChange={e => setFixedTemplateData({...fixedTemplateData, amount: e.target.value})}
                                        placeholder="0.00" 
                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Dia Venc.</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            required 
                                            min="1" 
                                            max="31" 
                                            value={fixedTemplateData.day}
                                            onChange={e => setFixedTemplateData({...fixedTemplateData, day: e.target.value})}
                                            className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3"
                                        />
                                        <button type="submit" className="px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* List Templates */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-slate-700 text-sm border-b pb-2">Despesas Fixas Cadastradas</h4>
                                {fixedExpenseTemplates.length === 0 && <p className="text-slate-500 text-sm italic py-2">Nenhuma despesa fixa configurada.</p>}
                                {fixedExpenseTemplates.map(template => (
                                    <div key={template.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md hover:shadow-sm transition-shadow">
                                        <div>
                                            <p className="font-medium text-slate-800">{template.description}</p>
                                            <p className="text-xs text-slate-500">Todo dia {template.day} • {formatCurrency(template.amount)}</p>
                                        </div>
                                        <button onClick={() => onDeleteFixedExpenseTemplate(template.id)} className="text-slate-400 hover:text-red-600 p-1">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end rounded-b-lg">
                            <button onClick={() => setIsFixedManagerOpen(false)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 font-medium">Concluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
