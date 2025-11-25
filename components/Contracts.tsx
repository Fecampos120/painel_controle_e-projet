
import React, { useState, useMemo } from 'react';
import { Contract, ProjectSchedule, Client, ProjectStage } from '../types';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, ArchitectIcon } from './Icons';

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


const Projects: React.FC<ProjectsProps> = ({ contracts, schedules, clients, onEditContract, onDeleteContract, onCreateProject }) => {
    const [activeTab, setActiveTab] = useState<'ativos' | 'arquivados'>('ativos');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 8;
    
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
        </div>
    );
};

export default Projects;
