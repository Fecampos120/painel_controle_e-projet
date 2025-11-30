
import React, { useState, useMemo, useEffect } from 'react';
import StatCard from './StatCard';
import { PaymentInstallment, OtherPayment, Contract } from '../types';
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

const PaymentRegistration: React.FC<{
    installments: PaymentInstallment[];
    onRegisterInstallment: (installmentId: number, paymentDate: Date) => void;
    onRegisterOther: (description: string, paymentDate: Date, value: number) => void;
}> = ({ installments, onRegisterInstallment, onRegisterOther }) => {
    const [activeTab, setActiveTab] = useState<'installment' | 'other'>('installment');

    // States for installment form
    const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    
    // States for other payment form
    const [otherDesc, setOtherDesc] = useState('');
    const [otherDate, setOtherDate] = useState(new Date().toISOString().split('T')[0]);
    const [otherValue, setOtherValue] = useState('');

    const pendingInstallments = installments
        .filter(i => i.status === 'Pendente')
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const handleInstallmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedInstallmentId || !paymentDate) {
            alert("Por favor, selecione uma parcela e a data de pagamento.");
            return;
        }
        onRegisterInstallment(parseInt(selectedInstallmentId), new Date(`${paymentDate}T00:00:00`));
        setSelectedInstallmentId('');
    };

    const handleOtherSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valueNum = parseFloat(otherValue);
        if (!otherDesc || !otherDate || isNaN(valueNum) || valueNum <= 0) {
            alert("Por favor, preencha todos os campos com valores válidos.");
            return;
        }
        onRegisterOther(otherDesc, new Date(`${otherDate}T00:00:00`), valueNum);
        setOtherDesc('');
        setOtherValue('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('installment')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'installment'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Registrar Parcela
                    </button>
                    <button
                        onClick={() => setActiveTab('other')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'other'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Registrar Outros
                    </button>
                </nav>
            </div>
            
            {activeTab === 'installment' && (
                <form onSubmit={handleInstallmentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="installment-select" className="block text-sm font-medium text-slate-600">Parcela Pendente</label>
                        <select id="installment-select" value={selectedInstallmentId} onChange={e => setSelectedInstallmentId(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                            <option value="">Selecione uma parcela...</option>
                            {pendingInstallments.map(i => (
                                <option key={i.id} value={i.id}>
                                    {`${i.clientName} (${i.projectName}) - ${i.installment} de ${formatCurrency(i.value)} - Vence em ${formatDate(new Date(i.dueDate))}`}
                                </option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="payment-date" className="block text-sm font-medium text-slate-600">Data do Pagamento</label>
                        <input type="date" id="payment-date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                    <div className="md:col-span-3">
                        <button type="submit" className="w-full md:w-auto justify-center rounded-md border border-transparent bg-blue-600 py-2 px-8 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Registrar Pagamento de Parcela
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'other' && (
                <form onSubmit={handleOtherSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                     <div className="md:col-span-2">
                        <label htmlFor="other-desc" className="block text-sm font-medium text-slate-600">Descrição</label>
                        <input type="text" id="other-desc" value={otherDesc} onChange={e => setOtherDesc(e.target.value)} required placeholder="Ex: Consultoria extra" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="other-date" className="block text-sm font-medium text-slate-600">Data do Pagamento</label>
                        <input type="date" id="other-date" value={otherDate} onChange={e => setOtherDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="other-value" className="block text-sm font-medium text-slate-600">Valor (R$)</label>
                        <input type="number" id="other-value" value={otherValue} onChange={e => setOtherValue(e.target.value)} required placeholder="0.00" step="0.01" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                    <div className="md:col-span-4">
                        <button type="submit" className="w-full md:w-auto justify-center rounded-md border border-transparent bg-green-600 py-2 px-8 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                            Adicionar Recebimento
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

interface ProjectionsProps {
    installments: PaymentInstallment[];
    otherPayments: OtherPayment[];
    contracts: Contract[];
    onRegisterInstallment: (installmentId: number, paymentDate: Date) => void;
    onRegisterOther: (description: string, paymentDate: Date, value: number) => void;
}

const Projections: React.FC<ProjectionsProps> = ({ installments, otherPayments, contracts, onRegisterInstallment, onRegisterOther }) => {
    const [selectedDate, setSelectedDate] = useState({
        month: new Date().getMonth(), // 0-11
        year: new Date().getFullYear(),
    });
    const [selectedClient, setSelectedClient] = useState('');
    const [viewLatePayments, setViewLatePayments] = useState(false);
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

    const uniqueClients = useMemo(() => {
        const clients = new Set(contracts.map(c => c.clientName));
        return Array.from(clients).sort();
    }, [contracts]);

    const monthlyData = useMemo(() => {
        let card1 = 0; // Previsto Mes / Total Contrato
        let card2 = 0; // Recebido Mes / Total Recebido
        let card3 = 0; // Pendente Mes / Saldo Devedor
        let card4 = 0; // Atrasado Geral
        const tableItems: ((PaymentInstallment & { itemType: 'installment' }) | (OtherPayment & { itemType: 'other' }))[] = [];
        
        const today = new Date();
        today.setHours(0,0,0,0);

        // MODALIDADE 1: Visualizar APENAS Atrasados (Geral)
        if (viewLatePayments) {
             installments.forEach(inst => {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0,0,0,0);
                if (inst.status === 'Pendente' && dueDate < today) {
                    tableItems.push({ ...inst, itemType: 'installment' });
                    card1 += inst.value; // Total Atrasado
                    card3 += inst.value; // Total Atrasado
                    card4 += inst.value; // Total Atrasado
                }
            });
            // Card 2 (Recebido) fica zerado pois estamos vendo pendências
        }
        // MODALIDADE 2: Filtro por Cliente (Histórico Completo - Ignora Mês/Ano)
        else if (selectedClient) {
            installments.forEach(inst => {
                if (inst.clientName !== selectedClient) return;

                // Adiciona todas as parcelas à tabela
                tableItems.push({ ...inst, itemType: 'installment' });

                // Card 1: Valor Total do Contrato (Soma de todas as parcelas)
                card1 += inst.value;

                // Card 2: Total Recebido
                if (inst.status !== 'Pendente') {
                    card2 += inst.value;
                }

                // Card 3: Saldo a Receber (Pendente)
                if (inst.status === 'Pendente') {
                    card3 += inst.value;
                    
                    // Card 4: Total Atrasado
                    const dueDate = new Date(inst.dueDate);
                    dueDate.setHours(0,0,0,0);
                    if (dueDate < today) {
                        card4 += inst.value;
                    }
                }
            });

            // Outros pagamentos geralmente não tem vínculo direto por nome simples, 
            // mas se tivermos lógica futura, adicionamos aqui. Por enquanto, oculta "Outros" no filtro de cliente.

        } 
        // MODALIDADE 3: Filtro por Mês/Ano (Visão Geral do Escritório)
        else {
            const firstDay = new Date(selectedDate.year, selectedDate.month, 1);
            const lastDay = new Date(selectedDate.year, selectedDate.month + 1, 0);

            installments.forEach(inst => {
                const dueDate = new Date(inst.dueDate);
                
                // Lógica para Tabela e Card 1 (Previsto) e Card 3 (Pendente no Mês)
                if (dueDate >= firstDay && dueDate <= lastDay) {
                    tableItems.push({ ...inst, itemType: 'installment' });
                    card1 += inst.value; // Previsto para o Mês
                    if (inst.status === 'Pendente') {
                        card3 += inst.value; // Pendente no Mês
                    }
                }

                // Card 2: Recebido no Mês (Independente do vencimento, importa a data do pagamento)
                if (inst.paymentDate) {
                    const paymentDate = new Date(inst.paymentDate);
                    if (paymentDate.getFullYear() === selectedDate.year && paymentDate.getMonth() === selectedDate.month) {
                        card2 += inst.value;
                    }
                }

                // Card 4: Atrasado Geral (Acumulado histórico)
                if (inst.status === 'Pendente' && dueDate < today) {
                    card4 += inst.value;
                }
            });

            otherPayments.forEach(op => {
                const paymentDate = new Date(op.paymentDate);
                if (paymentDate.getFullYear() === selectedDate.year && paymentDate.getMonth() === selectedDate.month) {
                    card2 += op.value; // Soma no recebido
                    // Opcional: Somar no previsto também se considerar que entrou no caixa
                    // card1 += op.value; 
                    tableItems.push({ ...op, itemType: 'other' });
                }
            });
        }

        // Ordenação Cronológica
        tableItems.sort((a, b) => {
            const dateA = a.itemType === 'installment' ? new Date(a.dueDate) : new Date(a.paymentDate);
            const dateB = b.itemType === 'installment' ? new Date(b.dueDate) : new Date(b.paymentDate);
            return dateA.getTime() - dateB.getTime();
        });

        return {
            card1Value: card1,
            card2Value: card2,
            card3Value: card3,
            card4Value: card4,
            tableItems,
        };
    }, [installments, otherPayments, selectedDate, selectedClient, viewLatePayments]);
    
    // Determine card titles based on view mode
    const isLateView = viewLatePayments;
    
    const cardTitles = {
        card1: isLateView ? "Total em Atraso" : (selectedClient ? "Valor Total Contrato" : "Previsto para o Mês"),
        card2: isLateView ? "Total Recebido (N/A)" : (selectedClient ? "Total Recebido" : "Recebido no Mês"),
        card3: isLateView ? "Total Pendente" : (selectedClient ? "Saldo a Receber" : "Pendente no Mês"),
        card4: isLateView ? "Total Atrasado" : (selectedClient ? "Atrasado (Cliente)" : "Atrasado (Geral)"),
    }

    const getTableTitle = () => {
        if (isLateView) return "Todas as Parcelas em Atraso";
        if (selectedClient) return `Histórico Financeiro Completo: ${selectedClient}`;
        return "Detalhes das Parcelas do Mês";
    }

    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Projeções e Recebidos</h1>
                <p className="mt-1 text-blue-100">
                    Analise os recebimentos detalhados por período ou histórico por cliente.
                </p>
            </header>

            <section>
                <PaymentRegistration 
                    installments={installments} 
                    onRegisterInstallment={onRegisterInstallment}
                    onRegisterOther={onRegisterOther}
                />
            </section>

            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row items-end md:items-center gap-4">
                <div className="flex gap-4">
                    <div>
                        <label htmlFor="month-select" className="block text-sm font-medium text-slate-600">Mês</label>
                        <select 
                            id="month-select" 
                            value={selectedDate.month} 
                            onChange={e => handleDateChange('month', e.target.value)} 
                            disabled={!!selectedClient || viewLatePayments}
                            className="mt-1 block w-40 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year-select" className="block text-sm font-medium text-slate-600">Ano</label>
                        <select 
                            id="year-select" 
                            value={selectedDate.year} 
                            onChange={e => handleDateChange('year', e.target.value)} 
                            disabled={!!selectedClient || viewLatePayments}
                            className="mt-1 block w-28 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 disabled:bg-slate-100 disabled:text-slate-400"
                        >
                            {years.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex-1 w-full md:w-auto">
                    <label htmlFor="client-select" className="block text-sm font-medium text-slate-600">Filtrar por Cliente</label>
                    <div className="flex gap-2">
                        <select 
                            id="client-select" 
                            value={selectedClient} 
                            onChange={e => { setSelectedClient(e.target.value); setViewLatePayments(false); }} 
                            disabled={viewLatePayments}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 disabled:bg-slate-100"
                        >
                            <option value="">Visão Geral (Por Mês)</option>
                            <optgroup label="Clientes">
                                {uniqueClients.map(client => (
                                    <option key={client} value={client}>{client}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-transparent">.</label>
                    <button
                        onClick={() => {
                            if (viewLatePayments) {
                                setViewLatePayments(false);
                            } else {
                                setViewLatePayments(true);
                                setSelectedClient(''); // Clear client filter when entering late mode
                            }
                        }}
                        className={`mt-1 flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors h-10 ${
                            viewLatePayments 
                                ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                    >
                        {viewLatePayments ? 'Voltar para Visão Geral' : '⚠ Ver Atrasados'}
                    </button>
                </div>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title={cardTitles.card1}
                    value={formatCurrency(monthlyData.card1Value)}
                    icon={<DollarIcon className="w-6 h-6 text-blue-500" />}
                />
                <StatCard
                    title={cardTitles.card2}
                    value={formatCurrency(monthlyData.card2Value)}
                    icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />}
                />
                <StatCard
                    title={cardTitles.card3}
                    value={formatCurrency(monthlyData.card3Value)}
                    icon={<ChartBarIcon className="w-6 h-6 text-amber-500" />}
                />
                <StatCard
                    title={cardTitles.card4}
                    value={formatCurrency(monthlyData.card4Value)}
                    icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />}
                />
            </section>

            <section className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className={`text-lg font-semibold ${isLateView ? 'text-red-600' : 'text-slate-800'}`}>
                    {getTableTitle()}
                </h2>
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
                                    <td colSpan={8} className="text-center p-4 text-slate-500">Nenhum registro encontrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
            
            {/* Show other payments history only when in Overview Mode (not client filtered, not late view) */}
            {!selectedClient && !viewLatePayments && (
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
            )}

            <PaymentReminderModal 
                isOpen={isReminderModalOpen}
                onClose={handleCloseReminderModal}
                installment={selectedInstallment}
            />
        </div>
    );
};

export default Projections;
