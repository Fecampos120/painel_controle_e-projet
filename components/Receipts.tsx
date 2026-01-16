
import React, { useState, useMemo } from 'react';
import { Contract, PaymentInstallment, SystemSettings } from '../types';
import { ArchitectIcon, PrinterIcon } from './Icons';

interface ReceiptsProps {
    contracts: Contract[];
    installments: PaymentInstallment[];
    systemSettings: SystemSettings;
}

const Receipts: React.FC<ReceiptsProps> = ({ contracts, installments, systemSettings }) => {
    const [selectedContractId, setSelectedContractId] = useState<string>('');

    const selectedContract = useMemo(() => {
        if (!selectedContractId) return null;
        return contracts.find(c => c.id === parseInt(selectedContractId));
    }, [selectedContractId, contracts]);

    const contractInstallments = useMemo(() => {
        if (!selectedContract) return [];
        return installments
            .filter(i => i.contractId === selectedContract.id)
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }, [selectedContract, installments]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (date: any) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));

    return (
        <div className="space-y-6">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 no-print">
                <h1 className="text-3xl font-bold">Documentos e Recibos</h1>
                <p className="mt-1 text-blue-100">Gere demonstrativos detalhados para seus clientes.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg no-print">
                <label className="block text-sm font-bold text-slate-700 mb-2">Selecione o Projeto para gerar o Recibo:</label>
                <select 
                    value={selectedContractId} 
                    onChange={e => setSelectedContractId(e.target.value)}
                    className="w-full max-w-md h-12 px-4 rounded-lg border-slate-300 focus:ring-blue-500"
                >
                    <option value="">Selecione um projeto concluído/ativo...</option>
                    {contracts.map(c => <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>)}
                </select>
            </div>

            {selectedContract && (
                <div className="printable-area bg-white p-12 shadow-2xl border border-slate-200 rounded-xl max-w-4xl mx-auto font-serif text-slate-900">
                    <header className="flex justify-between items-start border-b-4 border-slate-800 pb-8 mb-10">
                        <div className="flex items-center gap-4">
                            {systemSettings.logoUrl ? <img src={systemSettings.logoUrl} className="h-16 w-auto" alt="Logo" /> : <ArchitectIcon className="w-12 h-12 text-slate-800" />}
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">{systemSettings.companyName}</h1>
                                <p className="text-xs font-bold text-slate-500 tracking-widest mt-1">ARQUITETURA & DESIGN</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-slate-800 mb-1">DEMONSTRATIVO DE SERVIÇOS</h2>
                            <p className="text-sm text-slate-500">Ref: #{selectedContract.id}</p>
                            <p className="text-sm text-slate-500">Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </header>

                    <section className="grid grid-cols-2 gap-12 mb-10">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">CONTRATANTE</h3>
                            <p className="text-xl font-bold">{selectedContract.clientName}</p>
                            <p className="text-sm text-slate-600 mt-1">{selectedContract.clientAddress.street}, {selectedContract.clientAddress.number}</p>
                            <p className="text-sm text-slate-600">{selectedContract.clientAddress.city} - {selectedContract.clientAddress.state}</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">RESUMO DO PROJETO</h3>
                            <p className="font-bold text-slate-800">{selectedContract.projectName}</p>
                            <p className="text-sm text-slate-600 mt-2">Valor Total Fechado: <span className="font-bold">{formatCurrency(selectedContract.totalValue)}</span></p>
                            <p className="text-sm text-slate-600">Data de Início: {formatDate(selectedContract.date)}</p>
                        </div>
                    </section>

                    <section className="mb-10">
                        <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-2 mb-4">1. DESCRIÇÃO DOS SERVIÇOS CONTRATADOS</h3>
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="p-3 text-left">Item / Descrição</th>
                                    <th className="p-3 text-center">Tipo</th>
                                    <th className="p-3 text-right">Valor</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {selectedContract.services.map((s, i) => (
                                    <tr key={i}>
                                        <td className="p-3 font-bold">{s.serviceName}</td>
                                        <td className="p-3 text-center text-slate-500 uppercase text-[10px] font-bold">{s.calculationMethod}</td>
                                        <td className="p-3 text-right font-medium">{formatCurrency(parseFloat(s.value))}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-800 font-bold">
                                <tr>
                                    <td colSpan={2} className="p-3 text-right">TOTAL BRUTO:</td>
                                    <td className="p-3 text-right">{formatCurrency(selectedContract.totalValue + (selectedContract.discountValue || 0))}</td>
                                </tr>
                                {selectedContract.discountValue > 0 && (
                                    <tr className="text-red-600 italic">
                                        <td colSpan={2} className="p-3 text-right">DESCONTO APLICADO:</td>
                                        <td className="p-3 text-right">- {formatCurrency(selectedContract.discountValue)}</td>
                                    </tr>
                                )}
                            </tfoot>
                        </table>
                    </section>

                    <section className="mb-12">
                        <h3 className="text-sm font-black text-slate-800 uppercase border-b-2 border-slate-800 pb-2 mb-4">2. CRONOGRAMA DE PAGAMENTOS</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {contractInstallments.map((inst, i) => (
                                <div key={i} className="flex justify-between items-center p-3 border rounded bg-white">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 mr-4">#{i+1}</span>
                                        <span className="font-bold">{inst.installment === 'Entrada' ? 'SINAL / ENTRADA' : `PARCELA ${inst.installment}`}</span>
                                        <span className="ml-4 text-sm text-slate-500">Vencimento: {formatDate(inst.dueDate)}</span>
                                    </div>
                                    <span className="font-black text-lg">{formatCurrency(inst.value)}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer className="mt-20 pt-10 border-t border-slate-200 flex justify-between px-10">
                        <div className="text-center">
                            <div className="w-48 h-px bg-slate-400 mb-2 mx-auto"></div>
                            <p className="text-xs font-bold uppercase">{selectedContract.clientName}</p>
                            <p className="text-[10px] text-slate-400">CONTRATANTE</p>
                        </div>
                        <div className="text-center">
                            <div className="w-48 h-px bg-slate-400 mb-2 mx-auto"></div>
                            <p className="text-xs font-bold uppercase">{systemSettings.professionalName}</p>
                            <p className="text-[10px] text-slate-400">CONTRATADA (Responsável Técnico)</p>
                        </div>
                    </footer>

                    <div className="mt-20 no-print text-center">
                         <button 
                            onClick={() => window.print()}
                            className="px-12 py-4 bg-slate-900 text-white font-bold rounded-full shadow-2xl hover:scale-105 transition-transform"
                        >
                            <PrinterIcon className="w-6 h-6 inline mr-2" /> IMPRIMIR RECIBO DETALHADO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Receipts;
