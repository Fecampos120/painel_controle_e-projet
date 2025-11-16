

import React, { useState, useMemo } from 'react';
import { Contract, Attachment } from '../types';
import { PencilIcon, TrashIcon, PaperClipIcon, XIcon, DownloadIcon } from './Icons';

interface AttachmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Contract | null;
}

const AttachmentsModal: React.FC<AttachmentsModalProps> = ({ isOpen, onClose, contract }) => {
    if (!isOpen || !contract) return null;

    const attachmentCategories = [
        { title: 'Contrato Assinado', files: contract.attachments?.signedContract || [] },
        { title: 'Arquivos da Obra', files: contract.attachments?.workFiles || [] },
        { title: 'Fotos do Local', files: contract.attachments?.sitePhotos || [] },
    ].filter(cat => cat.files.length > 0);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">Anexos - {contract.projectName}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {attachmentCategories.length > 0 ? (
                        attachmentCategories.map(category => (
                            <div key={category.title}>
                                <h4 className="text-base font-semibold text-slate-700 mb-2">{category.title}</h4>
                                <ul className="space-y-2">
                                    {category.files.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-md">
                                            <span className="text-sm text-slate-800 truncate" title={file.name}>{file.name}</span>
                                            <a
                                                href={file.content}
                                                download={file.name}
                                                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                <DownloadIcon className="w-4 h-4 mr-1" />
                                                Baixar
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-4">Nenhum anexo encontrado para este contrato.</p>
                    )}
                </div>
                 <div className="flex justify-end p-4 bg-slate-50 rounded-b-lg">
                    <button type="button" onClick={onClose} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Fechar</button>
                </div>
            </div>
        </div>
    );
};


interface ContractsProps {
    contracts: Contract[];
    onEditContract: (contract: Contract) => void;
    onDeleteContract: (id: number) => void;
}

const Contracts: React.FC<ContractsProps> = ({ contracts, onEditContract, onDeleteContract }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

    const filteredContracts = useMemo(() => {
        if (!searchTerm) return contracts;
        return contracts.filter(
            contract =>
                contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                contract.projectName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, contracts]);
    
    const handleViewAttachments = (contract: Contract) => {
        setSelectedContract(contract);
        setIsAttachmentsModalOpen(true);
    };

    const getStatusChip = (status: Contract['status']) => {
        switch (status) {
            case 'Ativo':
                return 'bg-blue-100 text-blue-800';
            case 'Concluído':
                return 'bg-green-100 text-green-800';
            case 'Cancelado':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-slate-100 text-slate-800';
        }
    };

  return (
    <div className="space-y-8">
        <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
            <h1 className="text-3xl font-bold">Contratos</h1>
            <p className="mt-1 text-blue-100">
                Busque, visualize e gerencie todos os seus contratos.
            </p>
        </header>

        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Todos os Contratos</h2>
                 <div className="w-full max-w-sm">
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou projeto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                    />
                </div>
            </div>
            
            <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="border-b border-slate-200">
                    <tr>
                        <th className="p-3 text-sm font-semibold text-slate-500">Cliente</th>
                        <th className="p-3 text-sm font-semibold text-slate-500">Projeto</th>
                        <th className="p-3 text-sm font-semibold text-slate-500">Data</th>
                        <th className="p-3 text-sm font-semibold text-slate-500">Valor Total</th>
                        <th className="p-3 text-sm font-semibold text-slate-500">Anexos</th>
                        <th className="p-3 text-sm font-semibold text-slate-500">Status</th>
                        <th className="p-3 text-sm font-semibold text-slate-500 text-right">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredContracts.map((contract: Contract) => {
                        const totalFiles = (contract.attachments?.signedContract?.length || 0) +
                                           (contract.attachments?.workFiles?.length || 0) +
                                           (contract.attachments?.sitePhotos?.length || 0);
                        return (
                        <tr key={contract.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-800">{contract.clientName}</td>
                            <td className="p-3 text-slate-600">{contract.projectName}</td>
                            <td className="p-3 text-slate-600">{new Date(contract.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                            <td className="p-3 text-slate-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.totalValue)}</td>
                            <td className="p-3">
                                {totalFiles > 0 ? (
                                    <button onClick={() => handleViewAttachments(contract)} className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                                        <PaperClipIcon className="w-4 h-4 mr-1" />
                                        ({totalFiles})
                                    </button>
                                ) : (
                                    <span className="text-slate-400 text-sm">-</span>
                                )}
                            </td>
                            <td className="p-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(contract.status)}`}>
                                    {contract.status}
                                </span>
                            </td>
                            <td className="p-3 text-right">
                                <button onClick={() => onEditContract(contract)} className="p-2 text-slate-500 hover:text-blue-600" aria-label="Editar">
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Tem certeza que deseja excluir este contrato? Esta ação também excluirá parcelas e cronogramas associados.')) {
                                            onDeleteContract(contract.id);
                                        }
                                    }}
                                    className="p-2 text-slate-500 hover:text-red-600"
                                    aria-label="Deletar"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </td>
                        </tr>
                        );
                    })}
                    </tbody>
                </table>
                 {filteredContracts.length === 0 && (
                    <div className="text-center py-6 text-slate-500">
                        Nenhum contrato encontrado.
                    </div>
                )}
            </div>
        </div>
        <AttachmentsModal
            isOpen={isAttachmentsModalOpen}
            onClose={() => setIsAttachmentsModalOpen(false)}
            contract={selectedContract}
        />
    </div>
  );
};

export default Contracts;