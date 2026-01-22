
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
        // FIX: Use Number instead of parseInt
        return contracts.find(c => c.id === Number(selectedContractId));
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

            {/* Added structure for generating and displaying the receipt */}
            {selectedContract && (
                <div className="bg-white p-10 rounded-2xl shadow-xl space-y-10 animate-fadeIn">
                    <div className="flex justify-between border-b-4 border-slate-900 pb-6">
                        <div className="flex items-center space-x-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                <ArchitectIcon className="w-10 h-10" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">{systemSettings?.companyName || 'STUDIO BATTELLI'}</h2>
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{systemSettings?.professionalName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xl font-black uppercase text-slate-900 tracking-[0.2em]">Recibo de Quitação</h3>
                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-100 pb-2">Destinatário</h4>
                            <div>
                                <p className="text-lg font-black text-slate-800 uppercase">{selectedContract.clientName}</p>
                                <p className="text-sm font-bold text-slate-500 mt-1 uppercase">
                                    {selectedContract.clientAddress?.street}, {selectedContract.clientAddress?.number}<br />
                                    {selectedContract.clientAddress?.district}<br />
                                    {selectedContract.clientAddress?.city} - {selectedContract.clientAddress?.state}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-100 pb-2">Identificação do Projeto</h4>
                            <div>
                                <p className="text-lg font-black text-slate-800 uppercase">{selectedContract.projectName}</p>
                                <p className="text-sm font-bold text-slate-500 mt-1 uppercase">Serviço: {selectedContract.serviceType}</p>
                                <p className="text-sm font-bold text-blue-600 mt-3 uppercase tracking-tighter">Valor de Contrato: {formatCurrency(selectedContract.totalValue)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalhamento de Parcelas</h4>
                        <div className="overflow-hidden rounded-3xl border border-slate-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900 text-white">
                                    <tr>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Parcela</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Vencimento</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest text-center">Pagamento</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest">Valor</th>
                                        <th className="p-4 font-black uppercase text-[10px] tracking-widest text-right">Situação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {contractInstallments.map(inst => (
                                        <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-black text-slate-700">{inst.installment}</td>
                                            <td className="p-4 font-bold text-slate-400">{formatDate(inst.dueDate)}</td>
                                            <td className="p-4 font-black text-slate-800 text-center">{inst.paymentDate ? formatDate(inst.paymentDate) : '---'}</td>
                                            <td className="p-4 font-black text-blue-600">{formatCurrency(inst.value)}</td>
                                            <td className="p-4 text-right">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase ${inst.status.includes('Pago') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {inst.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-20 flex flex-col md:flex-row justify-between items-end gap-10 pt-16">
                        <div className="w-full md:w-72 space-y-2 text-center">
                            <div className="border-t-2 border-slate-900 pt-3">
                                <p className="text-[10px] font-black uppercase tracking-widest">Assinatura do Profissional</p>
                            </div>
                        </div>
                        <div className="w-full md:w-72 space-y-2 text-center">
                            <div className="border-t-2 border-slate-900 pt-3">
                                <p className="text-[10px] font-black uppercase tracking-widest">Assinatura do Cliente</p>
                            </div>
                        </div>
                    </div>

                    <div className="no-print pt-10 border-t border-slate-100 flex justify-center">
                        <button 
                            onClick={() => window.print()} 
                            className="flex items-center px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                        >
                            <PrinterIcon className="w-5 h-5 mr-3" /> Imprimir Documento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Fixed error by adding default export
export default Receipts;
