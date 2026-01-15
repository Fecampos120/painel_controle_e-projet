import React, { useState, useEffect, useRef } from 'react';
import { AppData, Client, Contract, Reminder, PaymentInstallment } from '../types';
import { PencilIcon, TrashIcon, XIcon, PlusIcon, ExclamationTriangleIcon, DownloadIcon, UploadIcon } from './Icons';

type TableKey = 'clients' | 'contracts' | 'reminders' | 'installments';

type Item = Client | Contract | Reminder | PaymentInstallment;

interface DatabaseProps {
    appData: AppData;
    setAppData: React.Dispatch<React.SetStateAction<AppData>>;
    onDeleteContract: (id: number) => void;
    onResetData: () => void;
}

const tableConfig: { [K in TableKey]: { title: string; columns: { key: keyof any; label: string }[] } } = {
    clients: {
        title: 'Clientes',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Nome' },
        ],
    },
    contracts: {
        title: 'Contratos',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'clientName', label: 'Cliente' },
            { key: 'projectName', label: 'Projeto' },
            { key: 'totalValue', label: 'Valor Total' },
            { key: 'status', label: 'Status' },
        ],
    },
    reminders: {
        title: 'Lembretes',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'clientName', label: 'Cliente' },
            { key: 'description', label: 'Descrição' },
            { key: 'date', label: 'Data' },
            { key: 'completed', label: 'Concluído' },
        ],
    },
    installments: {
        title: 'Parcelas',
        columns: [
            { key: 'id', label: 'ID' },
            { key: 'clientName', label: 'Cliente' },
            { key: 'installment', label: 'Parcela' },
            { key: 'dueDate', label: 'Vencimento' },
            { key: 'value', label: 'Valor' },
            { key: 'status', label: 'Status' },
        ],
    },
};

const Database: React.FC<DatabaseProps> = ({ appData, setAppData, onDeleteContract, onResetData }) => {
    const [activeTable, setActiveTable] = useState<TableKey>('clients');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [formData, setFormData] = useState<Partial<Item>>({});
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const importInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        setSelectedIds(new Set());
    }, [activeTable]);

    const openModal = (item: Item | null = null) => {
        setEditingItem(item);
        setFormData(item ? { ...item } : {});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: any = value;
        if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            processedValue = value === '' ? '' : parseFloat(value);
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    };

    const handleSave = () => {
        if (!activeTable) return;
        
        setAppData(prevData => {
            const currentItems = (prevData[activeTable] || []) as Item[];
            let newItems;
            if (editingItem) {
                newItems = currentItems.map(item => item.id === editingItem.id ? { ...item, ...formData } : item);
            } else {
                const newItem: Item = { ...formData, id: Date.now() } as Item;
                newItems = [...currentItems, newItem];
            }
            return { ...prevData, [activeTable]: newItems };
        });
        
        closeModal();
    };
    
    const handleDelete = (id: number) => {
        const isContract = activeTable === 'contracts';
        const isClient = activeTable === 'clients';
        
        let confirmationMessage = 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.';
        if (isContract) {
            confirmationMessage = 'Tem certeza que deseja excluir este contrato? Esta ação também excluirá parcelas, cronogramas e checklists associados.';
        } else if (isClient) {
            confirmationMessage = 'Tem certeza que deseja excluir este cliente? Todos os contratos, parcelas e lembretes associados a ele também serão excluídos.';
        }

        if (window.confirm(confirmationMessage)) {
            if (isContract) {
                onDeleteContract(id);
            } else if (isClient) {
                const clientToDelete = appData.clients.find(c => c.id === id);
                if (!clientToDelete) return;

                setAppData(prev => {
                    const contractIdsToDelete = prev.contracts
                        .filter(contract => contract.clientName === clientToDelete.name)
                        .map(contract => contract.id);

                    return {
                        ...prev,
                        clients: prev.clients.filter(c => c.id !== id),
                        contracts: prev.contracts.filter(c => c.clientName !== clientToDelete.name),
                        reminders: prev.reminders.filter(r => r.clientId !== id),
                        installments: prev.installments.filter(i => !contractIdsToDelete.includes(i.contractId)),
                        schedules: prev.schedules.filter(s => !contractIdsToDelete.includes(s.contractId)),
                        projectProgress: prev.projectProgress?.filter(p => !contractIdsToDelete.includes(p.contractId)),
                        checklists: prev.checklists ? prev.checklists.filter(c => !contractIdsToDelete.includes(c.contractId)) : [],
                    };
                });
            } else {
                setAppData(prevData => {
                    const currentItems = (prevData[activeTable] as Item[]) || [];
                    const newItems = currentItems.filter(item => item.id !== id);
                    return { ...prevData, [activeTable]: newItems };
                });
            }
        }
    };

    const handleDeleteSelected = () => {
        let confirmationMessage = `Tem certeza que deseja excluir os ${selectedIds.size} itens selecionados? Esta ação não pode ser desfeita.`;
        if (activeTable === 'contracts') {
            confirmationMessage = `Tem certeza que deseja excluir os ${selectedIds.size} contratos selecionados? Suas parcelas e cronogramas associados também serão excluídos.`;
        } else if (activeTable === 'clients') {
            confirmationMessage = `Tem certeza que deseja excluir os ${selectedIds.size} clientes selecionados? Todos os seus dados (contratos, parcelas, lembretes) também serão excluídos.`;
        }

        if (window.confirm(confirmationMessage)) {
            if (activeTable === 'contracts') {
                selectedIds.forEach(id => onDeleteContract(id));
            } else if (activeTable === 'clients') {
                const clientsToDelete = appData.clients.filter(c => selectedIds.has(c.id));
                const clientNamesToDelete = new Set(clientsToDelete.map(c => c.name));
                const clientIdsToDelete = new Set(clientsToDelete.map(c => c.id));
                
                setAppData(prev => {
                    const contractIdsToDelete = new Set(
                        prev.contracts
                            .filter(contract => clientNamesToDelete.has(contract.clientName))
                            .map(contract => contract.id)
                    );

                    return {
                        ...prev,
                        clients: prev.clients.filter(c => !clientIdsToDelete.has(c.id)),
                        contracts: prev.contracts.filter(c => !clientNamesToDelete.has(c.clientName)),
                        reminders: prev.reminders.filter(r => !clientIdsToDelete.has(r.clientId)),
                        installments: prev.installments.filter(i => !contractIdsToDelete.has(i.contractId)),
                        schedules: prev.schedules.filter(s => !contractIdsToDelete.has(s.contractId)),
                        projectProgress: prev.projectProgress?.filter(p => !contractIdsToDelete.has(p.contractId)),
                        // Fix: Correctly use .has() on a Set instead of .includes() which is for arrays
                        checklists: prev.checklists ? prev.checklists.filter(c => !contractIdsToDelete.has(c.contractId)) : [],
                    };
                });
            } else {
                setAppData(prevData => {
                    const currentItems = (prevData[activeTable] as Item[]) || [];
                    const newItems = currentItems.filter(item => !selectedIds.has(item.id));
                    return { ...prevData, [activeTable]: newItems };
                });
            }
            setSelectedIds(new Set());
        }
    };

    const allVisibleItems = (appData[activeTable] as Item[] || []);
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(allVisibleItems.map(item => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };
    
    const handleSelectItem = (id: number) => {
        setSelectedIds(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            return newSelection;
        });
    };

    const handleExportData = () => {
        try {
            const dataStr = JSON.stringify(appData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `eprojet_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao exportar dados", error);
            alert("Erro ao exportar backup.");
        }
    };

    const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target?.result as string);
                if (window.confirm("Isso substituirá TODOS os dados atuais. Deseja continuar?")) {
                    setAppData(importedData);
                    alert("Dados importados com sucesso!");
                }
            } catch (err) {
                console.error("Erro ao importar dados", err);
                alert("Arquivo inválido.");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-8">
            <header className="bg-slate-900 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">Banco de Dados</h1>
                        <p className="mt-1 text-slate-400">
                            Gestão técnica das tabelas do sistema. Use com cautela.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportData} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                            <DownloadIcon className="w-5 h-5 mr-2" /> Exportar Backup
                        </button>
                        <input type="file" ref={importInputRef} onChange={handleImportData} className="hidden" accept=".json" />
                        <button onClick={() => importInputRef.current?.click()} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors">
                            <UploadIcon className="w-5 h-5 mr-2" /> Importar Backup
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
                <aside className="lg:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {(Object.keys(tableConfig) as TableKey[]).map(key => (
                            <button
                                key={key}
                                onClick={() => setActiveTable(key)}
                                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTable === key ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {tableConfig[key].title}
                                <span className="ml-2 px-1.5 py-0.5 bg-black/10 rounded text-[10px]">
                                    {(appData[key] as any[])?.length || 0}
                                </span>
                            </button>
                        ))}
                    </nav>
                    
                    <div className="mt-8 pt-8 border-t border-slate-200">
                        <button onClick={onResetData} className="w-full flex items-center justify-center px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors">
                           <ExclamationTriangleIcon className="w-5 h-5 mr-2" /> Resetar Sistema
                        </button>
                    </div>
                </aside>

                <div className="flex-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <h2 className="font-bold text-slate-800">{tableConfig[activeTable].title}</h2>
                        <div className="flex gap-2">
                             {selectedIds.size > 0 && (
                                <button onClick={handleDeleteSelected} className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-bold hover:bg-red-200">
                                    <TrashIcon className="w-4 h-4 mr-1" /> Excluir {selectedIds.size}
                                </button>
                            )}
                            <button onClick={() => openModal()} className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-700">
                                <PlusIcon className="w-4 h-4 mr-1" /> Novo Item
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="p-3 w-10">
                                        <input type="checkbox" onChange={handleSelectAll} checked={selectedIds.size === allVisibleItems.length && allVisibleItems.length > 0} className="rounded" />
                                    </th>
                                    {tableConfig[activeTable].columns.map(col => (
                                        <th key={col.key as string} className="p-3 font-semibold text-slate-500">{col.label}</th>
                                    ))}
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allVisibleItems.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(item.id) ? 'bg-blue-50/50' : ''}`}>
                                        <td className="p-3">
                                            <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => handleSelectItem(item.id)} className="rounded" />
                                        </td>
                                        {tableConfig[activeTable].columns.map(col => {
                                            const val = (item as any)[col.key];
                                            let displayVal = val;
                                            if (val instanceof Date) displayVal = val.toLocaleDateString('pt-BR');
                                            if (typeof val === 'boolean') displayVal = val ? 'Sim' : 'Não';
                                            if (typeof val === 'number' && col.key === 'totalValue') displayVal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
                                            
                                            return <td key={col.key as string} className="p-3 text-slate-700">{displayVal}</td>;
                                        })}
                                        <td className="p-3 text-right space-x-1">
                                            <button onClick={() => openModal(item)} className="p-1.5 text-slate-400 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                                {allVisibleItems.length === 0 && (
                                    <tr>
                                        <td colSpan={tableConfig[activeTable].columns.length + 2} className="p-8 text-center text-slate-400 italic">
                                            Nenhum registro nesta tabela.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">{editingItem ? 'Editar' : 'Criar'} {tableConfig[activeTable].title}</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {tableConfig[activeTable].columns.filter(c => c.key !== 'id').map(col => (
                                <div key={col.key as string}>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{col.label}</label>
                                    <input
                                        name={col.key as string}
                                        type={col.key === 'totalValue' || col.key === 'value' ? 'number' : 'text'}
                                        value={(formData as any)[col.key] || ''}
                                        onChange={handleFormChange}
                                        className="w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end space-x-4 p-4 bg-slate-50 rounded-b-lg">
                            <button onClick={closeModal} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold shadow-lg hover:bg-blue-700">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Database;