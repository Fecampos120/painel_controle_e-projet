
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProjectStage, ProjectSchedule, Contract } from '../types';
import { PencilIcon, CalendarIcon, CheckCircleIcon, TrendingUpIcon, ChevronRightIcon, ExclamationTriangleIcon, HistoryIcon } from './Icons';

// Helper function to add working days to a date, skipping weekends.
const addWorkDays = (startDate: Date, days: number): Date => {
    const newDate = new Date(startDate.valueOf());
    let addedDays = 0;
    while (addedDays < days) {
        newDate.setDate(newDate.getDate() + 1);
        const dayOfWeek = newDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
            addedDays++;
        }
    }
    return newDate;
};

const formatDateForDisplay = (dateString: string | undefined | Date): string => {
    if (!dateString) return '--/--/----';
    const date = typeof dateString === 'string' ? new Date(`${dateString}T12:00:00`) : dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

const getEditorStatus = (stage: ProjectStage) => {
    if (stage.completionDate) {
        return <span className="px-2 py-1 text-[10px] font-bold text-green-700 bg-green-100 rounded-full border border-green-200">CONCLUÍDO</span>;
    }
    if (stage.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(stage.deadline + 'T23:59:59');
        if (deadline < today) {
            return <span className="px-2 py-1 text-[10px] font-bold text-red-700 bg-red-100 rounded-full border border-red-200">ATRASADO</span>;
        }
        
        // Alerta de proximidade (3 dias)
        const diff = deadline.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (daysRemaining <= 3) {
            return <span className="px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full border border-amber-200">VENCE EM {daysRemaining}D</span>;
        }
    }
    return <span className="px-2 py-1 text-[10px] font-bold text-slate-600 bg-slate-100 rounded-full border border-slate-200">PENDENTE</span>;
};

const ScheduleEditor: React.FC<{
    schedule: ProjectSchedule;
    onSave: (schedule: ProjectSchedule) => void;
    onCancel: () => void;
}> = ({ schedule: initialSchedule, onSave, onCancel }) => {
    const [schedule, setSchedule] = useState<ProjectSchedule>(initialSchedule);

    const runRecalculation = useCallback((stages: ProjectStage[], projectStartDate: string): ProjectStage[] => {
        if (!projectStartDate) return stages;
        const calculatedStages: ProjectStage[] = [];
        let lastDate = new Date(projectStartDate + 'T12:00:00');

        stages.forEach((stage, index) => {
            let currentStageStartDate: Date;
            if (index > 0) {
                const prevStage = calculatedStages[index - 1];
                const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate + 'T12:00:00') : new Date(prevStage.deadline! + 'T12:00:00');
                currentStageStartDate = addWorkDays(prevStageEndDate, 1);
            } else {
                currentStageStartDate = new Date(lastDate);
            }
            const duration = Math.max(0, stage.durationWorkDays > 0 ? stage.durationWorkDays - 1 : 0);
            const deadline = addWorkDays(new Date(currentStageStartDate), duration);
            calculatedStages.push({
                ...stage,
                startDate: currentStageStartDate.toISOString().split('T')[0],
                deadline: deadline.toISOString().split('T')[0],
            });
        });
        return calculatedStages;
    }, []);
    
    useEffect(() => {
        if (schedule.startDate && schedule.stages.some(s => !s.startDate)) {
            setSchedule(prev => ({
                ...prev,
                stages: runRecalculation(prev.stages, prev.startDate)
            }));
        }
    }, [schedule.startDate, schedule.stages, runRecalculation]);

    const handleProjectStartDateChange = (newStartDate: string) => {
        setSchedule(prev => {
            const recalculatedStages = runRecalculation(prev.stages, newStartDate);
            return { ...prev, startDate: newStartDate, stages: recalculatedStages };
        });
    };

    const handleStageChange = (stageId: number, field: keyof ProjectStage, value: any) => {
        const updatedStages = schedule.stages.map(s =>
            s.id === stageId ? { ...s, [field]: value } : s
        );
        const finalStages = runRecalculation(updatedStages, schedule.startDate);
        setSchedule(prev => ({ ...prev, stages: finalStages }));
    };
    
    const handleToggleCompletion = (stageId: number, isChecked: boolean) => {
        const completionDate = isChecked ? new Date().toISOString().split('T')[0] : undefined;
        const updatedStages = schedule.stages.map(s => 
            s.id === stageId ? { ...s, completionDate: completionDate } : s
        );
        const finalStages = runRecalculation(updatedStages, schedule.startDate);
        setSchedule(prev => ({ ...prev, stages: finalStages }));
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-6 border-b border-slate-100">
                 <div>
                    <h2 className="text-2xl font-black text-slate-800">Cronograma do Projeto</h2>
                    <p className="text-blue-600 font-bold uppercase text-xs tracking-widest mt-1">{schedule.projectName} &bull; {schedule.clientName}</p>
                 </div>
                 <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button onClick={onCancel} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase tracking-tight">Cancelar</button>
                    <button onClick={() => onSave(schedule)} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 transition-all font-black uppercase text-sm">Salvar Cronograma</button>
                 </div>
            </div>

             <div className="mb-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center gap-6">
                <div>
                    <label htmlFor="project-start-date" className="block text-[10px] font-black text-blue-400 uppercase mb-2">Data Inicial (Reunião de Briefing)</label>
                    <input
                        type="date"
                        id="project-start-date"
                        value={schedule.startDate || ''}
                        onChange={(e) => handleProjectStartDateChange(e.target.value)}
                        className="block w-full rounded-lg border-blue-200 shadow-sm focus:ring-blue-500 h-11 px-4 font-bold text-blue-900 bg-white"
                    />
                </div>
                <div className="flex-1 md:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Previsão Final de Entrega</p>
                    <p className="text-2xl font-black text-slate-800">{formatDateForDisplay(schedule.stages[schedule.stages.length - 1]?.deadline)}</p>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left table-fixed min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[30%]">Fase do Projeto</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[100px] text-center">Dias Úteis</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[160px]">Data Início</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[160px]">Data Fim</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[80px] text-center">OK</th>
                    <th className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-[120px]">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedule.stages.map((stage) => (
                    <tr key={stage.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-4 font-bold text-slate-800 group-hover:text-blue-700">{stage.name}</td>
                      <td className="p-4 text-center">
                         <input 
                            type="number" 
                            value={stage.durationWorkDays} 
                            onChange={(e) => handleStageChange(stage.id, 'durationWorkDays', e.target.value === '' ? 0 : parseInt(e.target.value, 10))} 
                            className="block w-16 mx-auto rounded-lg border-slate-300 shadow-sm focus:ring-blue-500 text-center font-bold text-slate-700 h-9 bg-white" 
                            min="0"
                         />
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{formatDateForDisplay(stage.startDate)}</td>
                      <td className="p-4 text-blue-600 font-black">{formatDateForDisplay(stage.deadline)}</td>
                      <td className="p-4 text-center">
                        <input 
                            type="checkbox" 
                            checked={!!stage.completionDate} 
                            onChange={(e) => handleToggleCompletion(stage.id, e.target.checked)} 
                            className="h-6 w-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">{getEditorStatus(stage)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        </div>
    )
}

interface ProgressProps {
    schedules: ProjectSchedule[];
    setSchedules: (schedules: ProjectSchedule[]) => void;
    contracts: Contract[];
}

const Progress: React.FC<ProgressProps> = ({ schedules, setSchedules, contracts }) => {
    const [mode, setMode] = useState<'list' | 'edit'>('list');
    const [currentSchedule, setCurrentSchedule] = useState<ProjectSchedule | null>(null);
    const [filterStatus, setFilterStatus] = useState<'todos' | 'atrasados' | 'vencendo'>('todos');
    const [searchTerm, setSearchTerm] = useState('');

    const processedProjects = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeContracts = contracts.filter(c => c.status === 'Ativo');
        
        // Filtra cronogramas de contratos ativos
        let list = schedules.filter(s => activeContracts.some(c => c.id === s.contractId)).map(schedule => {
            const contract = contracts.find(c => c.id === schedule.contractId)!;
            const completedStages = schedule.stages.filter(st => st.completionDate).length;
            const progress = schedule.stages.length > 0 ? Math.round((completedStages / schedule.stages.length) * 100) : 0;
            
            const start = schedule.startDate ? new Date(schedule.startDate + 'T12:00:00') : new Date();
            const lastStage = schedule.stages[schedule.stages.length - 1];
            const end = lastStage?.deadline ? new Date(lastStage.deadline + 'T12:00:00') : new Date();

            const currentStage = schedule.stages.find(s => !s.completionDate);
            let isLate = false;
            let isNear = false;
            let daysUntilNext = 0;

            if (currentStage?.deadline) {
                const deadlineDate = new Date(currentStage.deadline + 'T23:59:59');
                const diff = deadlineDate.getTime() - today.getTime();
                daysUntilNext = Math.ceil(diff / (1000 * 60 * 60 * 24));
                
                if (deadlineDate < today) isLate = true;
                else if (daysUntilNext <= 3) isNear = true;
            }
            
            return {
                ...schedule,
                contract,
                progress,
                startDateObj: start,
                endDateObj: end,
                isLate,
                isNear,
                daysUntilNext,
                currentStageName: currentStage?.name || 'Projeto Finalizado'
            };
        });

        // BUSCA POR CLIENTE
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(p => p.clientName.toLowerCase().includes(term) || p.projectName.toLowerCase().includes(term));
        }

        // ORDEM DE CONTRATO (Cronológica por ID ou Data de Início)
        list.sort((a, b) => a.contract.id - b.contract.id);

        if (filterStatus === 'atrasados') return list.filter(p => p.isLate);
        if (filterStatus === 'vencendo') return list.filter(p => p.isNear);
        return list;
    }, [schedules, contracts, filterStatus, searchTerm]);

    const handleEdit = (schedule: ProjectSchedule) => {
        setCurrentSchedule(JSON.parse(JSON.stringify(schedule)));
        setMode('edit');
    };

    const handleSave = (scheduleToSave: ProjectSchedule) => {
        const newSchedules = schedules.map(s => s.id === scheduleToSave.id ? scheduleToSave : s);
        setSchedules(newSchedules);
        setMode('list');
        setCurrentSchedule(null);
    };

    if (mode === 'edit' && currentSchedule) {
        return <ScheduleEditor schedule={currentSchedule} onSave={handleSave} onCancel={() => setMode('list')} />;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <header className="bg-slate-900 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center space-x-4 mb-2">
                            <TrendingUpIcon className="w-10 h-10 text-blue-400" />
                            <h1 className="text-3xl font-black tracking-tight uppercase">Gestão de Cronogramas</h1>
                        </div>
                        <p className="text-slate-400 text-sm font-medium opacity-90 max-w-2xl">
                            Controle total sobre prazos técnicos e entregas de projetos ativos.
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                        <div className="relative w-full sm:w-64">
                            <input 
                                type="text"
                                placeholder="BUSCAR CLIENTE..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black text-white placeholder-white/40 focus:bg-white/20 transition-all outline-none"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="bg-white/5 p-1.5 rounded-2xl flex gap-2 backdrop-blur-md border border-white/5">
                            <button 
                                onClick={() => setFilterStatus('todos')}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'todos' ? 'bg-white text-slate-900 shadow-lg' : 'text-white hover:bg-white/5'}`}
                            >
                                Todos
                            </button>
                            <button 
                                onClick={() => setFilterStatus('atrasados')}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'atrasados' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-white hover:bg-white/5'}`}
                            >
                                Atrasados
                            </button>
                            <button 
                                onClick={() => setFilterStatus('vencendo')}
                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'vencendo' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-white hover:bg-white/5'}`}
                            >
                                A vencer em breve
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {processedProjects.map(project => (
                    <div 
                        key={project.id} 
                        className={`bg-white rounded-3xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all group cursor-pointer ${project.isLate ? 'border-red-200 bg-red-50/5' : project.isNear ? 'border-amber-200 bg-amber-50/5' : 'border-slate-100'}`}
                        onClick={() => handleEdit(project)}
                    >
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${project.isLate ? 'bg-red-500 text-white' : project.isNear ? 'bg-amber-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                                            {project.isLate ? '● CRÍTICO: ETAPA EM ATRASO' : project.isNear ? '● ATENÇÃO: VENCIMENTO PRÓXIMO' : '● NO PRAZO'}
                                        </span>
                                        <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-widest">ID {project.contract.id.toString().split('.')[0]}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{project.projectName}</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">CLIENTE: {project.clientName}</p>
                                </div>
                                
                                <div className="mt-6 md:mt-0 flex items-center space-x-10">
                                    {project.isLate ? (
                                        <div className="flex items-center gap-2 text-red-600 font-black animate-pulse">
                                            <ExclamationTriangleIcon className="w-5 h-5" />
                                            <span className="text-xs uppercase tracking-tighter">Atraso Crítico</span>
                                        </div>
                                    ) : project.isNear && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-amber-600 uppercase">Alertar Cliente</span>
                                            <span className="text-sm font-black text-slate-700">{project.daysUntilNext === 0 ? 'Vence Hoje!' : `Faltam ${project.daysUntilNext} dias`}</span>
                                        </div>
                                    )}
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fase Atual</p>
                                        <p className="font-black text-slate-700 uppercase max-w-[150px] truncate">{project.currentStageName}</p>
                                    </div>
                                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-inner ${project.isLate ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white'}`}>
                                        <PencilIcon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center space-x-2">
                                        <span className={`text-2xl font-black italic ${project.isLate ? 'text-red-600' : 'text-slate-800'}`}>{project.progress}%</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso Total</span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {project.stages.filter(s => s.completionDate).length} DE {project.stages.length} FASES CONCLUÍDAS
                                    </span>
                                </div>
                                
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-100">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ease-out relative ${project.isLate ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600'}`} 
                                        style={{ width: `${project.progress}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 pt-6 overflow-x-auto pb-4 custom-scrollbar no-uppercase">
                                    {project.stages.map((stage, idx) => {
                                        const isDone = !!stage.completionDate;
                                        const stageToday = new Date();
                                        stageToday.setHours(0,0,0,0);
                                        const stageDeadline = stage.deadline ? new Date(stage.deadline + 'T23:59:59') : null;
                                        const isOverdue = !isDone && stageDeadline && stageDeadline < stageToday;
                                        
                                        // Vencimento próximo nesta etapa específica
                                        let isSpecificNear = false;
                                        if (!isDone && stageDeadline) {
                                            const diff = stageDeadline.getTime() - stageToday.getTime();
                                            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                                            if (days >= 0 && days <= 3) isSpecificNear = true;
                                        }

                                        return (
                                            <React.Fragment key={idx}>
                                                <div className="flex flex-col items-center min-w-[110px] flex-1">
                                                    <div 
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${isDone ? 'bg-green-100 border-green-500 text-green-600 shadow-sm' : isOverdue ? 'bg-red-50 border-red-500 text-red-500 animate-pulse' : isSpecificNear ? 'bg-amber-50 border-amber-500 text-amber-500' : 'bg-slate-50 border-slate-200 text-slate-300'}`}
                                                        title={`${stage.name}: ${formatDateForDisplay(stage.deadline)}`}
                                                    >
                                                        {isDone ? <CheckCircleIcon className="w-5 h-5" /> : <span className="font-black text-xs">{idx + 1}</span>}
                                                    </div>
                                                    <p className={`mt-2 text-[9px] font-black uppercase text-center w-full truncate px-1 ${isDone ? 'text-green-700' : isOverdue ? 'text-red-700' : isSpecificNear ? 'text-amber-700' : 'text-slate-400'}`}>{stage.name}</p>
                                                    <p className="text-[8px] font-bold text-slate-300 mt-0.5">{formatDateForDisplay(stage.deadline)}</p>
                                                </div>
                                                {idx !== project.stages.length - 1 && (
                                                    <div className={`h-0.5 flex-1 min-w-[20px] mb-8 ${isDone ? 'bg-green-500' : 'bg-slate-100'}`}></div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {processedProjects.length === 0 && (
                    <div className="bg-white p-24 rounded-[3rem] border-4 border-dashed border-slate-100 text-center opacity-40">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                            <TrendingUpIcon className="w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Nenhum projeto encontrado</h2>
                        <p className="mt-3 text-slate-400 font-bold uppercase text-sm">Ajuste os filtros ou crie um novo contrato técnico.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Progress;
