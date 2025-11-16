

import React, { useState, useMemo, useEffect } from 'react';
import StatCard from './StatCard';
import { PaymentInstallment, OtherPayment } from '../types';
import { DollarIcon, ChartBarIcon, MoneyBagIcon, ExclamationTriangleIcon, SendIcon } from './Icons';
import PaymentReminderModal from './PaymentReminderModal';


const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: Date) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC'}).format(d);
}

const getStatusChip = (status: PaymentInstallment['status']) => {
    switch (status) {
        case 'Pendente': return 'bg-amber-100 text-amber-800';
        case 'Pago em dia': return 'bg-green-100 text-green-800';
        case 'Pago com atraso': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-slate-100 text-slate-800';
    }
};

const Projections: React.FC<{ installments: PaymentInstallment[], otherPayments: OtherPayment[] }> = ({ installments, otherPayments }) => {
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(), // 0-11
        year: new Date().getFullYear(),
    });
    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);

    const handleOpenReminderModal = (installment: PaymentInstallment) => {
        setSelectedInstallment(installment);
        setIsReminderModalOpen(true);
    };

    const handleCloseReminderModal = () => {
        setSelectedInstallment(null);
        setIsReminderModalOpen(false);
    };

    const handleDateChange = (part: 'month' | 'year', value: string) => {
        setSelectedDate(prev => ({ ...prev, [part]: parseInt(value) }));
    };

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' })
    }));
    
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const monthlyData = useMemo(() => {
        const firstDay = new Date(selectedDate.year, selectedDate.month, 1);
        const lastDay = new Date(selectedDate.year, selectedDate.month + 1, 0);

        let previstoParaMes = 0;
        let recebidoNoMes = 0;
        let pendenteNoMes = 0;
        let atrasadoGeral = 0;
        const tableItems: ((PaymentInstallment & { itemType: 'installment' }) | (OtherPayment & { itemType: 'other' }))[] = [];

        installments.forEach(inst => {
            const dueDate = new Date(inst.dueDate);
            
            if (dueDate >= firstDay && dueDate <= lastDay) {
                tableItems.push({ ...inst, itemType: 'installment' });
                previstoParaMes += inst.value;
                if (inst.status === 'Pendente') {
                    pendenteNoMes += inst.value;
                }
            }

            if (inst.paymentDate) {
                const paymentDate = new Date(inst.paymentDate);
                if (paymentDate.getFullYear() === selectedDate.year && paymentDate.getMonth() === selectedDate.month) {
                    recebidoNoMes += inst.value;
                }
            }

            if (inst.status === 'Pendente' && dueDate < firstDay) {
                atrasadoGeral += inst.value;
            }
        });

        otherPayments.forEach(op => {
            const paymentDate = new Date(op.paymentDate);
            if (paymentDate.getFullYear() === selectedDate.year && paymentDate.getMonth() === selectedDate.month) {
                recebidoNoMes += op.value;
                previstoParaMes += op.value;
                tableItems.push({ ...op, itemType: 'other' });
            }
        });

        tableItems.sort((a, b) => {
            const dateA = a.itemType === 'installment' ? new Date(a.dueDate) : new Date(a.paymentDate);
            const dateB = b.itemType === 'installment' ? new Date(b.dueDate) : new Date(b.paymentDate);
            return dateA.getTime() - dateB.getTime();
        });

        return {
            previstoParaMes,
            recebidoNoMes,
            pendenteNoMes,
            atrasadoGeral,
            tableItems,
        };
    }, [installments, otherPayments, selectedDate]);
    
    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Projeções e Recebidos</h1>
                <p className="mt-1 text-blue-100">
                    Analise os recebimentos detalhados por período.
                </p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4">
                <div>
                    <label htmlFor="month-select" className="block text-sm font-medium text-slate-600">Mês</label>
                    <select id="month-select" value={selectedDate.month} onChange={e => handleDateChange('month', e.target.value)} className="mt-1 block w-48 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                        {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="year-select" className="block text-sm font-medium text-slate-600">Ano</label>
                    <select id="year-select" value={selectedDate.year} onChange={e => handleDateChange('year', e.target.value)} className="mt-1 block w-32 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Previsto para o Mês"
                    value={formatCurrency(monthlyData.previstoParaMes)}
                    icon={<DollarIcon className="w-6 h-6 text-blue-500" />}
                />
                <StatCard
                    title="Recebido no Mês"
                    value={formatCurrency(monthlyData.recebidoNoMes)}
                    icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />}
                />
                <StatCard
                    title="Pendente no Mês"
                    value={formatCurrency(monthlyData.pendenteNoMes)}
                    icon={<ChartBarIcon className="w-6 h-6 text-amber-500" />}
                />
                <StatCard
                    title="Atrasado (Geral)"
                    value={formatCurrency(monthlyData.atrasadoGeral)}
                    icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />}
                />
            </section>

            <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold text-slate-800">Detalhes das Parcelas do Mês</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-500">Cliente / Descrição</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Projeto</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Parcela</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Vencimento</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Data Pag.</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Valor</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Status</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {monthlyData.tableItems.map((item) => (
                                item.itemType === 'installment' ? (
                                    <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                                        <td className="p-3 text-slate-700">{item.clientName}</td>
                                        <td className="p-3 text-slate-700">{item.projectName}</td>
                                        <td className="p-3 text-slate-700">{item.installment}</td>
                                        <td className="p-3 text-slate-700">{formatDate(new Date(item.dueDate))}</td>
                                        <td className="p-3 text-slate-700">{item.paymentDate ? formatDate(new Date(item.paymentDate)) : '-'}</td>
                                        <td className="p-3 text-slate-700">{formatCurrency(item.value)}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            {item.status === 'Pendente' && (
                                                <button
                                                  onClick={() => handleOpenReminderModal(item)}
                                                  className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                                                  aria-label="Enviar Lembrete"
                                                  title="Enviar Lembrete"
                                                >
                                                  <SendIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={`other-${item.id}`} className="border-b border-slate-100 last:border-b-0 bg-sky-50/50">
                                        <td className="p-3 text-slate-700 font-medium italic">{item.description}</td>
                                        <td className="p-3 text-slate-500 italic">Pagamento Avulso</td>
                                        <td className="p-3 text-slate-700">-</td>
                                        <td className="p-3 text-slate-700">-</td>
                                        <td className="p-3 text-slate-700">{formatDate(new Date(item.paymentDate))}</td>
                                        <td className="p-3 text-slate-700">{formatCurrency(item.value)}</td>
                                        <td className="p-3">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-sky-100 text-sky-800">
                                                Recebido
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">-</td>
                                    </tr>
                                )
                            ))}
                            {monthlyData.tableItems.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center p-4 text-slate-500">Nenhum recebimento ou parcela com vencimento neste mês.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
            
            <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold text-slate-800">Histórico de Outros Recebimentos</h2>
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200">
                            <tr>
                                <th className="p-3 text-sm font-semibold text-slate-500">Data</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">Descrição</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 text-right">Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {otherPayments.length > 0 ? (
                                [...otherPayments]
                                    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                    .map((payment) => (
                                        <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                                            <td className="p-3 text-slate-700 whitespace-nowrap">{formatDate(new Date(payment.paymentDate))}</td>
                                            <td className="p-3 text-slate-700">{payment.description}</td>
                                            <td className="p-3 text-slate-700 text-right font-medium">{formatCurrency(payment.value)}</td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center p-4 text-slate-500">Nenhum outro recebimento registrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <PaymentReminderModal 
                isOpen={isReminderModalOpen}
                onClose={handleCloseReminderModal}
                installment={selectedInstallment}
            />
        </div>
    );
};

export default Projections;