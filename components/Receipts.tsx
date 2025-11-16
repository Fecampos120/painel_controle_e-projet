
import React, { useState, useMemo } from 'react';
import { Contract } from '../types';

interface ReceiptsProps {
    contracts: Contract[];
}

const Receipts: React.FC<ReceiptsProps> = ({ contracts }) => {
    const [selectedContractId, setSelectedContractId] = useState<string>('');

    const selectedContract = useMemo(() => {
        if (!selectedContractId) return null;
        return contracts.find(c => c.id === parseInt(selectedContractId));
    }, [selectedContractId, contracts]);

    const handlePrint = () => {
        window.print();
    };
    
    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (date: Date) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));

    return (
        <>
            <style>{`
                @media print {
                    /* Esconde a barra lateral e qualquer outro elemento marcado com .no-print */
                    body > #root > div > aside, .no-print {
                        display: none;
                    }

                    /* Reseta o container principal para garantir que o recibo possa preencher a página */
                    body > #root > div > main {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        background: none !important;
                        backdrop-filter: none !important;
                    }

                    /* Estiliza o recibo para impressão */
                    .printable-area {
                        box-shadow: none;
                        border: none;
                        margin: 0 auto;
                        padding: 2cm;
                        color: black;
                        font-size: 12pt;
                    }
                }
            `}</style>
            <div className="space-y-8">
                <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 no-print">
                    <h1 className="text-3xl font-bold">Recibos</h1>
                    <p className="mt-1 text-blue-100">
                        Gere e visualize recibos para seus contratos.
                    </p>
                </header>
                
                <div className="bg-white p-6 rounded-xl shadow-lg no-print">
                    <label htmlFor="contract-select" className="block text-sm font-medium text-slate-700">Selecione um Contrato</label>
                    <select
                        id="contract-select"
                        value={selectedContractId}
                        onChange={(e) => setSelectedContractId(e.target.value)}
                        className="mt-1 block w-full max-w-md rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                    >
                        <option value="">Selecione...</option>
                        {contracts.map(contract => (
                            <option key={contract.id} value={contract.id}>
                                {contract.projectName} - {contract.clientName}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedContract && (
                    <div>
                        <div className="printable-area bg-white p-10 rounded-xl shadow-lg border border-slate-200 max-w-4xl mx-auto font-serif">
                            <header className="text-center border-b pb-6 border-slate-200">
                                <h1 className="text-3xl font-bold text-slate-900 tracking-wider">RECIBO DE PAGAMENTO</h1>
                            </header>

                            <main className="mt-8 space-y-8">
                                <section>
                                    <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Dados do Cliente</h2>
                                    <p className="text-slate-700"><strong>Nome:</strong> {selectedContract.clientName}</p>
                                    <p className="text-slate-700"><strong>Endereço:</strong> {`${selectedContract.clientAddress.street}, ${selectedContract.clientAddress.number} - ${selectedContract.clientAddress.district}, ${selectedContract.clientAddress.city} - ${selectedContract.clientAddress.state}`}</p>
                                </section>

                                <section>
                                    <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Detalhes do Serviço</h2>
                                    <p className="text-slate-700"><strong>Projeto:</strong> {selectedContract.projectName}</p>
                                    <p className="text-slate-700"><strong>Tipo de Serviço:</strong> {selectedContract.serviceType}</p>
                                    <p className="text-slate-700"><strong>Endereço da Obra:</strong> {`${selectedContract.projectAddress.street}, ${selectedContract.projectAddress.number} - ${selectedContract.projectAddress.district}, ${selectedContract.projectAddress.city} - ${selectedContract.projectAddress.state}`}</p>
                                </section>
                                
                                <section>
                                    <h2 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-4">Valores e Pagamento</h2>
                                    <div className="bg-slate-50 p-4 rounded-md border">
                                        <table className="w-full">
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="py-2 text-slate-600">Valor Total Acordado:</td>
                                                    <td className="py-2 text-right font-bold text-slate-800">{formatCurrency(selectedContract.totalValue)}</td>
                                                </tr>
                                                <tr className="border-b">
                                                    <td className="py-2 text-slate-600">Valor de Entrada:</td>
                                                    <td className="py-2 text-right font-bold text-slate-800">{formatCurrency(selectedContract.downPayment)}</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-2 text-slate-600">Parcelamento Restante:</td>
                                                    <td className="py-2 text-right font-bold text-slate-800">{selectedContract.installments}x de {formatCurrency(selectedContract.installmentValue)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                                 <p className="text-slate-700 leading-relaxed text-center pt-6">
                                    Declaramos para os devidos fins que recebemos de <strong className="font-bold">{selectedContract.clientName}</strong>,
                                    os valores descritos acima, referentes ao contrato do projeto <strong className="font-bold">"{selectedContract.projectName}"</strong>.
                                </p>
                            </main>

                            <footer className="mt-16 pt-8 text-center space-y-4">
                                <div className="inline-block my-8">
                                    <div className="border-t border-slate-400 w-80 pt-2">
                                        <p className="text-sm font-semibold text-slate-800">Erica Battelli Agudo Fileto</p>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500">
                                    <p>STUDIO BATTELLO</p>
                                    <p>RESPONSÁVEL TÉCNICA: Erica Battelli Agudo Fileto</p>
                                    <p>CPF/PIX: 369.551.008-07</p>
                                </div>
                                <p className="text-sm text-slate-600 mt-4">
                                    Data de Emissão: {new Date().toLocaleDateString('pt-BR')}
                                </p>
                            </footer>

                        </div>
                        <div className="text-center mt-6 no-print">
                            <button 
                                onClick={handlePrint}
                                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Imprimir Recibo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Receipts;