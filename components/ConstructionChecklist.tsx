import React, { useState, useEffect, useMemo } from 'react';
import { Contract, ProjectChecklist, ChecklistItemTemplate, SystemSettings } from '../types';
import { CHECKLIST_TEMPLATE } from '../constants';
import { CheckCircleIcon, PrinterIcon, ArchitectIcon, XIcon } from './Icons';

interface ConstructionChecklistProps {
    contracts: Contract[];
    checklists: ProjectChecklist[];
    systemSettings?: SystemSettings;
    onUpdateChecklist: (checklist: ProjectChecklist) => void;
}

interface ChecklistPrintModalProps {
    contract: Contract;
    completedItemIds: number[];
    groupedItems: { [key: string]: ChecklistItemTemplate[] };
    systemSettings?: SystemSettings;
    onClose: () => void;
}

const ChecklistPrintModal: React.FC<ChecklistPrintModalProps> = ({ contract, completedItemIds, groupedItems, systemSettings, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const calculateProgress = () => {
        const total = CHECKLIST_TEMPLATE.length;
        if(total === 0) return 0;
        return Math.round((completedItemIds.length / total) * 100);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 print:p-0 print:bg-white">
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    .checklist-report-modal, .checklist-report-modal * { display: block !important; }
                    .checklist-report-modal { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        height: auto; 
                        background: white;
                        box-shadow: none;
                        overflow: visible !important;
                    }
                    .no-print { display: none !important; }
                    @page { margin: 1.5cm; }
                }
            `}</style>
            
            <div className="checklist-report-modal bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto font-serif">
                <div className="p-4 border-b flex justify-between items-center no-print sticky top-0 bg-white z-10">
                    <h3 className="font-bold text-lg font-sans text-slate-800">Relatório de Checklist</h3>
                    <div className="flex space-x-2">
                        <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-sans text-sm font-medium">
                            <PrinterIcon className="w-4 h-4 mr-2"/> Imprimir
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="p-10 text-slate-900">
                    {/* Header Padrão */}
                    <header className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold uppercase tracking-widest">Relatório de Acompanhamento</h1>
                            <p className="text-slate-600 text-sm mt-1">Checklist de Obra e Etapas</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center justify-end space-x-2 font-bold text-xl">
                                {systemSettings?.logoUrl ? (
                                    <img src={systemSettings.logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                                ) : (
                                    <ArchitectIcon className="w-8 h-8" />
                                )}
                                <span>{systemSettings?.companyName || "STUDIO BATTELLI"}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Arquitetura & Interiores</p>
                            <p className="text-xs text-slate-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                    </header>

                    <main className="space-y-8">
                        {/* Project Info */}
                        <section className="bg-slate-50 p-6 rounded border border-slate-200 print:border-slate-300">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Cliente</p>
                                    <p className="font-bold text-lg">{contract.clientName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Projeto</p>
                                    <p className="font-bold text-lg">{contract.projectName}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Local</p>
                                    <p className="text-sm">{contract.projectAddress.street}, {contract.projectAddress.number} - {contract.projectAddress.city}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase">Progresso Geral</p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="w-full bg-slate-300 rounded-full h-2 max-w-[100px] print:border print:border-slate-400">
                                            <div className="bg-slate-800 h-2 rounded-full print:bg-slate-800" style={{width: `${calculateProgress()}%`}}></div>
                                        </div>
                                        <span className="text-sm font-bold">{calculateProgress()}%</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Checklist Items */}
                        <section className="space-y-6">
                            {(Object.entries(groupedItems) as [string, ChecklistItemTemplate[]][]).map(([stageName, items]) => {
                                // Check if stage is fully complete for header styling
                                const isStageComplete = items.every(i => completedItemIds.includes(i.id));
                                
                                return (
                                    <div key={stageName} className="break-inside-avoid">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase border-b-2 border-slate-800 pb-1 mb-3 flex justify-between items-center">
                                            <span>{stageName}</span>
                                            {isStageComplete && <span className="text-xs bg-slate-800 text-white px-2 py-0.5 rounded">CONCLUÍDO</span>}
                                        </h3>
                                        <ul className="space-y-1">
                                            {items.map(item => {
                                                const isChecked = completedItemIds.includes(item.id);
                                                return (
                                                    <li key={item.id} className="flex items-start space-x-3 text-sm py-1">
                                                        <span className={`flex items-center justify-center w-5 h-5 border rounded-sm flex-shrink-0 ${isChecked ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-400 bg-white'}`}>
                                                            {isChecked && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                                                        </span>
                                                        <span className={isChecked ? 'text-slate-500 line-through' : 'text-slate-800'}>
                                                            {item.text}
                                                        </span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                );
                            })}
                        </section>
                    </main>

                    <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
                        <p>Documento para controle interno e acompanhamento de etapas.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

const ConstructionChecklist: React.FC<ConstructionChecklistProps> = ({ contracts, checklists = [], systemSettings, onUpdateChecklist }) => {
    const [selectedContractId, setSelectedContractId] = useState<string>('');
    const [localCompletedIds, setLocalCompletedIds] = useState<number[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    const activeContracts = contracts.filter(c => c.status === 'Ativo');
    const selectedContract = contracts.find(c => c.id.toString() === selectedContractId);

    // Carregar dados salvos quando o contrato muda
    useEffect(() => {
        if (selectedContractId) {
            const savedChecklist = (checklists || []).find(c => c.contractId === parseInt(selectedContractId));
            setLocalCompletedIds(savedChecklist ? savedChecklist.completedItemIds : []);
            setHasUnsavedChanges(false);
        } else {
            setLocalCompletedIds([]);
            setHasUnsavedChanges(false);
        }
    }, [selectedContractId, checklists]);

    const handleToggleItem = (itemId: number) => {
        if (!selectedContractId) return;

        setLocalCompletedIds(prev => {
            const isCompleted = prev.includes(itemId);
            if (isCompleted) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
        setHasUnsavedChanges(true);
    };

    const handleSave = () => {
        if (!selectedContractId) return;

        onUpdateChecklist({
            contractId: parseInt(selectedContractId),
            completedItemIds: localCompletedIds
        });
        
        setHasUnsavedChanges(false);
        alert('Checklist salvo com sucesso!');
    };

    // Group items by stage
    const groupedItems = useMemo(() => {
        const groups: { [key: string]: ChecklistItemTemplate[] } = {};
        CHECKLIST_TEMPLATE.forEach(item => {
            if (!groups[item.stage]) {
                groups[item.stage] = [];
            }
            groups[item.stage].push(item);
        });
        return groups;
    }, []);
    
    const calculateProgress = () => {
        if(CHECKLIST_TEMPLATE.length === 0) return 0;
        return Math.round((localCompletedIds.length / CHECKLIST_TEMPLATE.length) * 100);
    }

    return (
        <div className="space-y-8 relative pb-20">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Checklist de Obra</h1>
                <p className="mt-1 text-blue-100">
                    Acompanhe as etapas e tarefas essenciais de cada projeto.
                </p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="w-full md:w-auto flex-1">
                    <label htmlFor="contract-select" className="block text-sm font-medium text-slate-700 mb-2">Selecione o Projeto/Cliente</label>
                    <select
                        id="contract-select"
                        value={selectedContractId}
                        onChange={(e) => setSelectedContractId(e.target.value)}
                        className="block w-full max-w-md rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                    >
                        <option value="">Selecione...</option>
                        {activeContracts.map(contract => (
                            <option key={contract.id} value={contract.id}>
                                {contract.clientName} - {contract.projectName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <button 
                        onClick={() => setIsPrintModalOpen(true)} 
                        disabled={!selectedContractId}
                        className="flex items-center justify-center px-4 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PrinterIcon className="w-5 h-5 mr-2" />
                        Imprimir Relatório
                    </button>
                </div>
            </div>

            {selectedContractId && (
                <div className="space-y-6">
                     <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-700">Progresso Total</span>
                        <div className="flex items-center space-x-3 flex-1 max-w-xs ml-4">
                             <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-500" style={{width: `${calculateProgress()}%`}}></div>
                            </div>
                            <span className="text-sm font-bold text-slate-700">{calculateProgress()}%</span>
                        </div>
                    </div>

                    {Object.entries(groupedItems).map(([stageName, items]) => (
                        <div key={stageName} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                            <h3 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-3 mb-4 sticky top-0 bg-white z-10">
                                {stageName}
                            </h3>
                            <div className="space-y-3">
                                {(items as ChecklistItemTemplate[]).map(item => {
                                    const isChecked = localCompletedIds.includes(item.id);
                                    return (
                                        <label key={item.id} className="flex items-start space-x-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors group">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleToggleItem(item.id)}
                                                className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0 cursor-pointer"
                                            />
                                            <span className={`text-sm transition-all duration-200 ${isChecked ? 'line-through text-slate-400' : 'text-slate-700 group-hover:text-blue-700'}`}>
                                                {item.text}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Floating Save Button Bar */}
                    <div className="fixed bottom-6 right-6 z-30 print:hidden">
                         <button 
                            onClick={handleSave}
                            className={`flex items-center justify-center px-8 py-4 rounded-full shadow-xl text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 ${hasUnsavedChanges ? 'bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-300' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            <CheckCircleIcon className="w-6 h-6 mr-2" />
                            {hasUnsavedChanges ? 'Salvar Alterações' : 'Salvo'}
                        </button>
                    </div>
                </div>
            )}
            
            {!selectedContractId && (
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-lg border border-dashed border-slate-300">
                    <p>Selecione um cliente acima para visualizar e gerenciar o checklist de obra.</p>
                </div>
            )}

            {isPrintModalOpen && selectedContract && (
                <ChecklistPrintModal 
                    contract={selectedContract}
                    completedItemIds={localCompletedIds}
                    groupedItems={groupedItems}
                    systemSettings={systemSettings}
                    onClose={() => setIsPrintModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ConstructionChecklist;