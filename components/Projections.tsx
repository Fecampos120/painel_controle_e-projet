
import React, { useState, useMemo, useEffect } from 'react';
import StatCard from './StatCard';
import { PaymentInstallment, OtherPayment, Contract } from '../types';
import { DollarIcon, ChartBarIcon, MoneyBagIcon, ExclamationTriangleIcon, SendIcon, CheckCircleIcon, XIcon, PlusIcon } from './Icons';
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
    contracts: Contract[];
    onRegisterInstallment: (installmentId: number, paymentDate: Date, newValue?: number) => void;
    onRegisterOther: (description: string, paymentDate: Date, value: number) => void;
}> = ({ installments, contracts, onRegisterInstallment, onRegisterOther }) => {
    const [activeTab, setActiveTab] = useState<'installment' | 'other'>('installment');
    
    // States for Other Payments
    const [otherDesc, setOtherDesc] = useState('');
    const [otherDate, setOtherDate] = useState(new Date().toISOString().split('T')[0]);
    const [otherValue, setOtherValue] = useState('');

    // States for New Popup Flow
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedClientForPayment, setSelectedClientForPayment] = useState('');
    const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);
    const [paidValue, setPaidValue] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    const uniqueClients = useMemo(() => {
        const clients = new Set(installments.filter(i => i.status === 'Pendente').map(i => i.clientName));
        return Array.from(clients).sort();
    }, [installments]);

    const clientInstallments = useMemo(() => {
        if (!selectedClientForPayment) return [];
        return installments.filter(i => i.clientName === selectedClientForPayment && i.status === 'Pendente');
    }, [selectedClientForPayment, installments]);

    useEffect(() => {
        if (selectedInstallmentId) {
            const inst = clientInstallments.find(i => i.id === selectedInstallmentId);
            if (inst) setPaidValue(inst.value.toString());
        }
    }, [selectedInstallmentId, clientInstallments]);

    const handleInstallmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedInstallmentId || !paymentDate) {
            alert("POR FAVOR, SELECIONE UMA PARCELA E A DATA.");
            return;
        }
        const finalValue = parseFloat(paidValue);
        onRegisterInstallment(selectedInstallmentId, new Date(`${paymentDate}T12:00:00`), isNaN(finalValue) ? undefined : finalValue);
        setIsPopupOpen(false);
        setSelectedClientForPayment('');
        setSelectedInstallmentId(null);
    };

    const handleOtherSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valueNum = parseFloat(otherValue);
        if (!otherDesc || !otherDate || isNaN(valueNum) || valueNum <= 0) {
            alert("PREENCHA TODOS OS CAMPOS COM VALORES VÁLIDOS.");
            return;
        }
        onRegisterOther(otherDesc, new Date(`${otherDate}T00:00:00`), valueNum);
        setOtherDesc('');
        setOtherValue('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg uppercase">
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('installment')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-black text-xs tracking-widest transition-all ${
                            activeTab === 'installment'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Registrar Parcela
                    </button>
                    <button
                        onClick={() => setActiveTab('other')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-black text-xs tracking-widest transition-all ${
                            activeTab === 'other'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        Registrar Outros
                    </button>
                </nav>
            </div>
            
            {activeTab === 'installment' && (
                <div className="flex items-center justify-center py-4">
                    <button 
                        onClick={() => setIsPopupOpen(true)}
                        className="flex items-center justify-center px-10 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-xs tracking-widest"
                    >
                        <CheckCircleIcon className="w-5 h-5 mr-3" />
                        ABRIR SELETOR DE PAGAMENTO
                    </button>
                </div>
            )}

            {activeTab === 'other' && (
                <form onSubmit={handleOtherSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end animate-fadeIn">
                     <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descrição do Recebimento</label>
                        <input type="text" value={otherDesc} onChange={e => setOtherDesc(e.target.value.toUpperCase())} required className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                    </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data</label>
                        <input type="date" value={otherDate} onChange={e => setOtherDate(e.target.value)} required className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold" />
                    </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor (R$)</label>
                        <input type="number" value={otherValue} onChange={e => setOtherValue(e.target.value)} required step="0.01" className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-blue-600" />
                    </div>
                    <div className="md:col-span-4">
                        <button type="submit" className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl uppercase text-[10px] tracking-widest hover:brightness-110">
                            ADICIONAR RECEBIMENTO AVULSO
                        </button>
                    </div>
                </form>
            )}

            {/* POPUP DE REGISTRO DE PARCELA */}
            {isPopupOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 bg-blue-600 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Registrar Pagamento</h3>
                                <p className="text-blue-200 text-[10px] font-black mt-2 uppercase tracking-[0.2em]">Selecione o cliente e a parcela</p>
                            </div>
                            <button onClick={() => setIsPopupOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <XIcon className="w-8 h-8 text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleInstallmentSubmit} className="p-8 space-y-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">1. BUSCAR CLIENTE</label>
                                <select 
                                    value={selectedClientForPayment} 
                                    onChange={e => { setSelectedClientForPayment(e.target.value); setSelectedInstallmentId(null); }}
                                    className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-800 outline-none focus:border-blue-500"
                                >
                                    <option value="">SELECIONE O CLIENTE...</option>
                                    {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {selectedClientForPayment && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">2. ESCOLHER PARCELA PENDENTE</label>
                                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                            {clientInstallments.map(inst => (
                                                <label 
                                                    key={inst.id} 
                                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedInstallmentId === inst.id ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <input 
                                                            type="radio" 
                                                            name="inst_radio"
                                                            checked={selectedInstallmentId === inst.id}
                                                            onChange={() => setSelectedInstallmentId(inst.id)}
                                                            className="w-5 h-5 text-blue-600"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800">{inst.installment.toUpperCase()} - {inst.projectName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">VENCIMENTO: {formatDate(new Date(inst.dueDate))}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-black text-blue-600">{formatCurrency(inst.value)}</span>
                                                </label>
                                            ))}
                                            {clientInstallments.length === 0 && <p className="text-center py-4 text-xs font-bold text-slate-400 italic uppercase">Nenhuma parcela pendente encontrada.</p>}
                                        </div>
                                    </div>

                                    {selectedInstallmentId && (
                                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-50 animate-slideUp">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">VALOR RECEBIDO (R$)</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={paidValue}
                                                    onChange={e => setPaidValue(e.target.value)}
                                                    className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-green-600 focus:border-green-500 outline-none text-xl"
                                                />
                                                <p className="text-[8px] font-bold text-slate-300 mt-1 italic uppercase">* SE O CLIENTE PAGOU DIFERENTE, AJUSTE ACIMA.</p>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">DATA DO PAGAMENTO</label>
                                                <input 
                                                    type="date"
                                                    value={paymentDate}
                                                    onChange={e => setPaymentDate(e.target.value)}
                                                    className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700 focus:border-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-6">
                                <button 
                                    type="submit" 
                                    disabled={!selectedInstallmentId}
                                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all flex items-center justify-center ${selectedInstallmentId ? 'bg-blue-600 text-white hover:scale-[1.02]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                                >
                                    <CheckCircleIcon className="w-5 h-5 mr-2" /> EFETIVAR REGISTRO NO FINANCEIRO
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

interface ProjectionsProps {
    installments: PaymentInstallment[];
    otherPayments: OtherPayment[];
    contracts: Contract[];
    onRegisterInstallment: (installmentId: number, paymentDate: Date, newValue?: number) => void;
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
        <div className="space-y-8 uppercase">
            <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-black uppercase tracking-tight">Projeções e Recebidos</h1>
                <p className="mt-1 text-blue-100 italic text-sm">Analise os recebimentos detalhados por período ou histórico por cliente.</p>
            </header>

            <section>
                <PaymentRegistration 
                    installments={installments} 
                    contracts={contracts}
                    onRegisterInstallment={onRegisterInstallment}
                    onRegisterOther={onRegisterOther}
                />
            </section>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-end md:items-center gap-4">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mês</label>
                        <select 
                            value={selectedDate.month} 
                            onChange={e => handleDateChange('month', e.target.value)} 
                            disabled={!!selectedClient || viewLatePayments}
                            className="w-36 h-10 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs disabled:opacity-50"
                        >
                            {months.map(month => <option key={month.value} value={month.value}>{month.label.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ano</label>
                        <select 
                            value={selectedDate.year} 
                            onChange={e => handleDateChange('year', e.target.value)} 
                            disabled={!!selectedClient || viewLatePayments}
                            className="w-24 h-10 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs disabled:opacity-50"
                        >
                            {years.map(year => <option key={year} value={year}>{year}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex-1 w-full md:w-auto">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Filtrar por Cliente</label>
                    <select 
                        value={selectedClient} 
                        onChange={e => { setSelectedClient(e.target.value); setViewLatePayments(false); }} 
                        disabled={viewLatePayments}
                        className="w-full h-10 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-xs disabled:opacity-50"
                    >
                        <option value="">Visão Geral (Por Mês)</option>
                        {uniqueClients.map(client => (
                            <option key={client} value={client}>{client}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <button
                        onClick={() => {
                            if (viewLatePayments) {
                                setViewLatePayments(false);
                            } else {
                                setViewLatePayments(true);
                                setSelectedClient('');
                            }
                        }}
                        className={`px-6 h-10 border-2 rounded-xl text-[10px] font-black tracking-widest transition-all ${
                            viewLatePayments 
                                ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-500/20' 
                                : 'bg-white text-slate-400 border-slate-100 hover:border-red-200 hover:text-red-500'
                        }`}
                    >
                        {viewLatePayments ? 'VOLTAR PARA VISÃO GERAL' : '⚠ VER ATRASADOS'}
                    </button>
                </div>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={cardTitles.card1} value={formatCurrency(monthlyData.card1Value)} icon={<DollarIcon className="w-6 h-6 text-blue-500" />} />
                <StatCard title={cardTitles.card2} value={formatCurrency(monthlyData.card2Value)} icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title={cardTitles.card3} value={formatCurrency(monthlyData.card3Value)} icon={<ChartBarIcon className="w-6 h-6 text-amber-500" />} />
                <StatCard title={cardTitles.card4} value={formatCurrency(monthlyData.card4Value)} icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />} />
            </section>

            <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className={`text-sm font-black uppercase tracking-widest ${isLateView ? 'text-red-600' : 'text-slate-800'}`}>
                    {getTableTitle()}
                </h2>
                <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-50">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CLIENTE / DESCRIÇÃO</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PROJETO</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PARCELA</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">VENCIMENTO</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">DATA PAG.</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">VALOR</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">AÇÕES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {monthlyData.tableItems.map((item) => (
                                item.itemType === 'installment' ? (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-xs font-black text-slate-800">{item.clientName}</td>
                                        <td className="p-4 text-xs font-bold text-slate-500">{item.projectName}</td>
                                        <td className="p-4 text-xs font-bold text-slate-700">{item.installment.toUpperCase()}</td>
                                        <td className="p-4 text-xs font-bold text-slate-600">{formatDate(new Date(item.dueDate))}</td>
                                        <td className="p-4 text-xs font-black text-slate-800">{item.paymentDate ? formatDate(new Date(item.paymentDate)) : '-'}</td>
                                        <td className="p-4 text-xs font-black text-blue-600">{formatCurrency(item.value)}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter ${getStatusChip(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {item.status === 'Pendente' && (
                                                <button
                                                  onClick={() => handleOpenReminderModal(item)}
                                                  className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                  title="Enviar WhatsApp"
                                                >
                                                  <SendIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={`other-${item.id}`} className="bg-sky-50/20 hover:bg-sky-50 transition-colors">
                                        <td className="p-4 text-xs font-black text-sky-800 italic">{item.description}</td>
                                        <td colSpan={3} className="p-4 text-[10px] font-bold text-sky-400 uppercase tracking-widest">Pagamento Avulso Extra</td>
                                        <td className="p-4 text-xs font-black text-slate-800">{formatDate(new Date(item.paymentDate))}</td>
                                        <td className="p-4 text-xs font-black text-sky-600">{formatCurrency(item.value)}</td>
                                        <td className="p-4">
                                            <span className="px-3 py-1 text-[9px] font-black rounded-full bg-sky-100 text-sky-700 uppercase tracking-tighter">Recebido</span>
                                        </td>
                                        <td className="p-4 text-center">-</td>
                                    </tr>
                                )
                            ))}
                            {monthlyData.tableItems.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center p-12 text-[10px] font-black text-slate-300 uppercase italic">Nenhum registro encontrado para este período.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
            
            {!selectedClient && !viewLatePayments && (
                <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Resumo de Receitas Avulsas</h2>
                    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-50">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">DATA</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">DESCRIÇÃO</th>
                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">VALOR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {otherPayments.length > 0 ? (
                                    [...otherPayments]
                                        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                                        .map((payment) => (
                                            <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 text-xs font-bold text-slate-600">{formatDate(new Date(payment.paymentDate))}</td>
                                                <td className="p-4 text-xs font-black text-slate-800">{payment.description}</td>
                                                <td className="p-4 text-xs font-black text-sky-600 text-right">{formatCurrency(payment.value)}</td>
                                            </tr>
                                        ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="text-center p-10 text-[10px] font-black text-slate-300 uppercase italic">Sem lançamentos avulsos registrados.</td>
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
