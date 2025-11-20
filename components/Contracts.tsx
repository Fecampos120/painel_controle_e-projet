







import React, { useState, useMemo } from 'react';
import { Contract, ProjectSchedule, Client, ProjectStage } from '../types';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, PrinterIcon, ArchitectIcon } from './Icons';

// This is the new main component for this file, implementing the "Projetos" view.
interface DisplayProject {
    id: number;
    projectName: string;
    clientName: string;
    clientLogoUrl?: string;
    progress: number;
    startDate: Date;
    endDate: Date;
    status: 'Em Andamento' | 'Atrasado' | 'Concluído' | 'Cancelado' | 'No Prazo';
    isArchived: boolean;
    originalContract: Contract;
}

interface ProjectsProps {
    contracts: Contract[];
    schedules: ProjectSchedule[];
    clients: Client[];
    onEditContract: (contract: Contract) => void;
    onDeleteContract: (id: number) => void;
    onCreateProject: () => void;
}

const StatusChip: React.FC<{ status: DisplayProject['status'] }> = ({ status }) => {
    const styles = {
        'Em Andamento': 'bg-yellow-100 text-yellow-800',
        'Atrasado': 'bg-red-100 text-red-800',
        'Concluído': 'bg-green-100 text-green-800',
        'Cancelado': 'bg-slate-100 text-slate-800',
        'No Prazo': 'bg-blue-100 text-blue-800',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || styles['Cancelado']}`}>
            {status}
        </span>
    );
};

// Report Component to handle Printing
const ProjectReportModal: React.FC<{ contract: Contract, schedule?: ProjectSchedule, onClose: () => void }> = ({ contract, schedule, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    const formatDate = (dateStr?: string | Date) => {
        if(!dateStr) return '-';
        const d = typeof dateStr === 'string' ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
        return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(d);
    };

    const completedStages = schedule?.stages.filter(s => s.completionDate).length || 0;
    const totalStages = schedule?.stages.length || 0;
    const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    return (
        <>
            <style>{`
                @media print {
                    body > #root > div > aside, .no-print, .modal-overlay {
                        display: none !important;
                    }
                    body > #root > div > main {
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: visible !important;
                        background: white !important;
                        height: auto !important;
                    }
                    .printable-report {
                        position: relative !important;
                        width: 100% !important;
                        left: 0 !important;
                        top: 0 !important;
                        transform: none !important;
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        z-index: 9999 !important;
                        display: block !important;
                    }
                    .page-break {
                        page-break-after: always;
                    }
                    @page {
                        margin: 1.5cm;
                    }
                }
            `}</style>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 modal-overlay" onClick={onClose}>
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                     <div className="p-6 border-b border-slate-200 flex justify-between items-center no-print sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-slate-800">Visualização do Relatório</h2>
                        <div className="flex space-x-3">
                            <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors">Fechar</button>
                            <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
                                <PrinterIcon className="w-4 h-4 mr-2" /> Imprimir
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-10 printable-report font-serif">
                        {/* Header */}
                        <header className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">Relatório de Projeto</h1>
                                <p className="text-slate-600 text-sm mt-1">Acompanhamento e Status</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end space-x-2 text-slate-800 font-bold text-xl">
                                    <ArchitectIcon className="w-8 h-8" />
                                    <span>STUDIO BATTELLO</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Arquitetura & Interiores</p>
                                <p className="text-xs text-slate-500">Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                        </header>

                        {/* Overview Cards */}
                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 print:bg-transparent print:border-slate-300">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dados do Cliente</h3>
                                <p className="text-lg font-bold text-slate-800">{contract.clientName}</p>
                                <p className="text-sm text-slate-600 mt-1">{contract.clientAddress.city} - {contract.clientAddress.state}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 print:bg-transparent print:border-slate-300">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Dados do Projeto</h3>
                                <p className="text-lg font-bold text-slate-800">{contract.projectName}</p>
                                <p className="text-sm text-slate-600 mt-1"><span className="font-semibold">Tipo:</span> {contract.serviceType}</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    <span className="font-semibold">Progresso:</span> {progress}%
                                </p>
                            </div>
                        </div>
                        
                        {/* Financial Summary */}
                        <div className="mb-8">
                             <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">Resumo Financeiro</h3>
                             <table className="w-full text-sm mb-2">
                                 <tbody>
                                     <tr className="border-b border-slate-100">
                                         <td className="py-2 text-slate-600">Valor Total do Contrato</td>
                                         <td className="py-2 text-right font-bold text-slate-800">{formatCurrency(contract.totalValue)}</td>
                                     </tr>
                                      <tr className="border-b border-slate-100">
                                         <td className="py-2 text-slate-600">Entrada</td>
                                         <td className="py-2 text-right text-slate-800">{formatCurrency(contract.downPayment)} ({formatDate(contract.downPaymentDate)})</td>
                                     </tr>
                                      <tr>
                                         <td className="py-2 text-slate-600">Parcelamento</td>
                                         <td className="py-2 text-right text-slate-800">{contract.installments}x de {formatCurrency(contract.installmentValue)}</td>
                                     </tr>
                                 </tbody>
                             </table>
                        </div>

                        {/* Schedule Table */}
                        {schedule && (
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 uppercase border-b border-slate-300 pb-2 mb-4">Cronograma de Etapas</h3>
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-100 text-slate-700 print:bg-slate-100">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-semibold">Etapa</th>
                                            <th className="py-2 px-3 text-center font-semibold">Início</th>
                                            <th className="py-2 px-3 text-center font-semibold">Prazo</th>
                                            <th className="py-2 px-3 text-center font-semibold">Conclusão</th>
                                            <th className="py-2 px-3 text-center font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 border border-slate-200">
                                        {schedule.stages.map((stage) => {
                                            const isCompleted = !!stage.completionDate;
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const deadline = stage.deadline ? new Date(stage.deadline + 'T00:00:00') : null;
                                            const isLate = !isCompleted && deadline && deadline < today;
                                            
                                            return (
                                                <tr key={stage.id} className={isCompleted ? 'bg-green-50/30 print:bg-transparent' : ''}>
                                                    <td className="py-2 px-3 font-medium text-slate-800">{stage.name}</td>
                                                    <td className="py-2 px-3 text-center text-slate-600">{formatDate(stage.startDate)}</td>
                                                    <td className="py-2 px-3 text-center text-slate-600">{formatDate(stage.deadline)}</td>
                                                    <td className="py-2 px-3 text-center text-slate-600">{formatDate(stage.completionDate)}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded border ${
                                                            isCompleted ? 'text-green-700 border-green-200 bg-green-50' : 
                                                            isLate ? 'text-red-700 border-red-200 bg-red-50' : 
                                                            'text-slate-500 border-slate-200 bg-slate-50'
                                                        }`}>
                                                            {isCompleted ? 'CONCLUÍDO' : isLate ? 'ATRASADO' : 'PENDENTE'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
                            <p>Este documento foi gerado automaticamente pelo sistema E-Projet.</p>
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
};


const Projects: React.FC<ProjectsProps> = ({ contracts, schedules, clients, onEditContract, onDeleteContract, onCreateProject }) => {
    const [activeTab, setActiveTab] = useState<'ativos' | 'arquivados'>('ativos');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 8;
    
    // State for Report Modal
    const [printingContractId, setPrintingContractId] = useState<number | null>(null);

    const displayProjects = useMemo((): DisplayProject[] => {
        return contracts.map(contract => {
            const schedule = schedules.find(s => s.contractId === contract.id);
            const client = clients.find(c => c.name === contract.clientName);

            let progress = 0;
            let endDate: Date = new Date(contract.date);
            let status: DisplayProject['status'] = 'No Prazo';
            const isArchived = contract.status === 'Concluído' || contract.status === 'Cancelado';

            if (schedule) {
                const totalStages = schedule.stages.length;
                const completedStages = schedule.stages.filter(s => s.completionDate).length;
                progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
                
                if (schedule.stages.length > 0) {
                     const lastStage = schedule.stages[schedule.stages.length - 1];
                     if(lastStage.deadline) {
                        endDate = new Date(`${lastStage.deadline}T00:00:00`);
                     }
                }

                if (contract.status === 'Ativo') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isDelayed = schedule.stages.some(stage => !stage.completionDate && stage.deadline && new Date(`${stage.deadline}T00:00:00`) < today);
                    if (isDelayed) {
                        status = 'Atrasado';
                    } else {
                        status = 'Em Andamento';
                    }
                }
            }

            if (isArchived) {
                status = contract.status as 'Concluído' | 'Cancelado';
                if (status === 'Concluído') progress = 100;
            }
            
            return {
                id: contract.id,
                projectName: contract.projectName,
                clientName: contract.clientName,
                clientLogoUrl: client?.logoUrl,
                progress,
                startDate: new Date(contract.date),
                endDate,
                status,
                isArchived,
                originalContract: contract,
            };
        }).sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
    }, [contracts, schedules, clients]);

    const filteredProjects = useMemo(() => {
        return displayProjects
            .filter(p => (activeTab === 'ativos' ? !p.isArchived : p.isArchived))
            .filter(p => 
                p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.clientName.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [displayProjects, activeTab, searchTerm]);
    
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    const paginatedProjects = filteredProjects.slice((currentPage - 1) * projectsPerPage, currentPage * projectsPerPage);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    const getPrintingData = () => {
        if(!printingContractId) return null;
        const contract = contracts.find(c => c.id === printingContractId);
        const schedule = schedules.find(s => s.contractId === printingContractId);
        if(!contract) return null;
        return { contract, schedule };
    }
    const printingData = getPrintingData();
    
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Projetos</h1>
                <button 
                    onClick={onCreateProject}
                    className="flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                   <PlusIcon className="w-5 h-5 mr-2" />
                   <span>CRIAR PROJETO</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
                <div>
                    <div className="border-b border-slate-200">
                        <nav className="-mb-px flex space-x-6">
                            <button
                                onClick={() => { setActiveTab('ativos'); setCurrentPage(1); }}
                                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'ativos'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Ativos
                            </button>
                            <button
                                onClick={() => { setActiveTab('arquivados'); setCurrentPage(1); }}
                                className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm transition-colors ${
                                    activeTab === 'arquivados'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                Arquivados
                            </button>
                        </nav>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <p className="text-sm text-slate-600 font-medium w-full sm:w-auto text-center sm:text-left">
                        {filteredProjects.length} Resultados encontrados
                    </p>
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            <input
                                type="text"
                                placeholder="Pesquisar projeto"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 w-64 bg-white rounded-lg border border-slate-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1024px]">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="p-3 text-sm font-semibold text-slate-500">PROJETO</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">CLIENTE</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">PROGRESSO</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">ASSINATURA</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">VENC. ENTRADA</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">DATA DE ENTREGA</th>
                                <th className="p-3 text-sm font-semibold text-slate-500">STATUS</th>
                                <th className="p-3 text-sm font-semibold text-slate-500 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProjects.map(project => (
                                <tr key={project.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-800">{project.projectName}</td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-3">
                                            {project.clientLogoUrl ? 
                                                <img src={project.clientLogoUrl} alt={project.clientName} className="w-7 h-7 rounded-full object-contain bg-white"/> :
                                                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">{project.clientName.charAt(0)}</div>
                                            }
                                            <span className="text-sm text-slate-700 font-medium">{project.clientName}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                <div className="bg-blue-600 h-1.5 rounded-full" style={{width: `${project.progress}%`}}></div>
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 w-10 text-right">{project.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-slate-600">{project.originalContract.date ? new Date(project.originalContract.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td>
                                    <td className="p-3 text-sm text-slate-600">{project.originalContract.downPaymentDate ? new Date(project.originalContract.downPaymentDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}</td>
                                    <td className="p-3 text-sm text-slate-600">{project.endDate.toLocaleDateString('pt-BR')}</td>
                                    <td className="p-3"><StatusChip status={project.status} /></td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end space-x-1">
                                            <button onClick={() => setPrintingContractId(project.id)} className="p-2 text-slate-500 hover:text-blue-600" aria-label="Imprimir Relatório" title="Imprimir Relatório"><PrinterIcon className="w-5 h-5" /></button>
                                            <button onClick={() => onEditContract(project.originalContract)} className="p-2 text-slate-500 hover:text-blue-600" aria-label="Editar"><PencilIcon className="w-5 h-5" /></button>
                                            <button onClick={() => onDeleteContract(project.id)} className="p-2 text-slate-500 hover:text-red-600" aria-label="Excluir"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {paginatedProjects.length === 0 && (
                        <div className="text-center py-10 text-slate-500">Nenhum projeto encontrado.</div>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 pt-4">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-full disabled:opacity-50 text-slate-600 hover:bg-slate-100">
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                    currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-full disabled:opacity-50 text-slate-600 hover:bg-slate-100">
                            <ChevronRightIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>

             {printingData && (
                <ProjectReportModal 
                    contract={printingData.contract} 
                    schedule={printingData.schedule} 
                    onClose={() => setPrintingContractId(null)} 
                />
            )}
        </div>
    );
};

export default Projects;