
import React, { useMemo } from 'react';
import { Budget } from '../types';
import { PlusIcon, TrashIcon, CheckCircleIcon, CalendarIcon, MoneyBagIcon } from './Icons';

interface BudgetsProps {
    budgets: Budget[];
    onAddBudget: () => void;
    onDeleteBudget: (id: number) => void;
    onApproveBudget: (budget: Budget) => void;
}

const Budgets: React.FC<BudgetsProps> = ({ budgets, onAddBudget, onDeleteBudget, onApproveBudget }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const getSemaphore = (lastContact: Date) => {
        const date = new Date(lastContact); const today = new Date();
        const diffTime = Math.abs(today.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) return { color: 'bg-green-500', label: 'Recente', days: diffDays };
        if (diffDays <= 15) return { color: 'bg-yellow-500', label: 'Atenção', days: diffDays };
        return { color: 'bg-red-500', label: 'Crítico', days: diffDays };
    };
    const openBudgets = useMemo(() => budgets.filter(b => b.status === 'Aberto').sort((a,b) => new Date(b.lastContactDate).getTime() - new Date(a.lastContactDate).getTime()), [budgets]);

    return (
        <div className="space-y-6">
            <header className="bg-slate-900 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Orçamentos e Propostas</h1>
                        <p className="mt-1 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Gerencie suas negociações em aberto e propostas de honorários.</p>
                    </div>
                    <button onClick={onAddBudget} className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-[10px] tracking-widest uppercase">
                        <PlusIcon className="w-4 h-4 mr-2" /> NOVO ORÇAMENTO
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-green-500 flex justify-between items-center">
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Em Aberto</p><p className="text-xl font-bold text-slate-800">{openBudgets.length}</p></div>
                    <MoneyBagIcon className="w-8 h-8 text-slate-100" />
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-blue-500 flex justify-between items-center">
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Valor Estimado</p><p className="text-xl font-bold text-slate-800">{formatCurrency(openBudgets.reduce((acc, b) => acc + b.totalValue, 0))}</p></div>
                    <MoneyBagIcon className="w-8 h-8 text-slate-100" />
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-orange-500 flex justify-between items-center">
                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aguardando Retorno</p><p className="text-xl font-bold text-slate-800">{openBudgets.filter(b => getSemaphore(b.lastContactDate).days > 7).length}</p></div>
                    <CalendarIcon className="w-8 h-8 text-slate-100" />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 uppercase">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 text-[10px] font-bold text-slate-400 tracking-widest">STATUS</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 tracking-widest">CLIENTE / PROJETO</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 tracking-widest">VALOR</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 tracking-widest">ÚLTIMO CONTATO</th>
                            <th className="p-4 text-[10px] font-bold text-slate-400 tracking-widest text-right">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {openBudgets.map(budget => {
                            const semaphore = getSemaphore(budget.lastContactDate);
                            return (
                                <tr key={budget.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-4"><div className="flex items-center"><div className={`w-2 h-2 rounded-full ${semaphore.color} mr-2 shadow-sm animate-pulse`}></div><span className="text-[9px] font-bold text-slate-600 tracking-widest">{semaphore.label}</span></div></td>
                                    <td className="p-4"><p className="text-sm font-bold text-slate-800">{budget.clientName}</p><p className="text-[10px] font-semibold text-slate-400 tracking-tight">{budget.projectName}</p></td>
                                    <td className="p-4 text-sm font-bold text-blue-600">{formatCurrency(budget.totalValue)}</td>
                                    <td className="p-4"><p className="text-xs font-semibold text-slate-600">{new Date(budget.lastContactDate).toLocaleDateString('pt-BR')}</p><p className="text-[9px] text-slate-400">Há {semaphore.days} dia(s)</p></td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => onApproveBudget(budget)} className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold text-[9px] tracking-widest" title="Aprovar e virar Projeto"><CheckCircleIcon className="w-3.5 h-3.5 mr-1" /> APROVAR</button>
                                            <button onClick={() => onDeleteBudget(budget.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><TrashIcon className="w-4.5 h-4.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {openBudgets.length === 0 && (<tr><td colSpan={5} className="p-12 text-center text-slate-300 text-[10px] font-bold italic tracking-widest">NENHUM ORÇAMENTO EM NEGOCIAÇÃO.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Budgets;
