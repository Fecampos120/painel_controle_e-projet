
// Fix: Import `useEffect` from react to resolve 'Cannot find name' error.
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProjectStage, ProjectSchedule, Contract, GanttProject, GanttStage } from '../types';
import { GANTT_STAGES_CONFIG } from '../constants';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';


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

// Formats a date string (YYYY-MM-DD) to DD/MM/YYYY for display.
const formatDateForDisplay = (dateString: string | undefined | Date): string => {
    if (!dateString) return '--/--/----';
    const date = typeof dateString === 'string' ? new Date(`${dateString}T00:00:00`) : dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};


// Determines the status chip for a given stage.
const getStatus = (stage: ProjectStage) => {
    if (stage.completionDate) {
        return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Concluído</span>;
    }
    if (stage.deadline) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(stage.deadline);
        // Adjust for timezone when comparing dates from inputs
        deadline.setMinutes(deadline.getMinutes() + deadline.getTimezoneOffset());
        if (deadline < today) {
            return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Atrasado</span>;
        }
    }
    return <span className="px-2 py-1 text-xs font-medium text-slate-800 bg-slate-100 rounded-full">Pendente</span>;
};


// The main component for editing a single project schedule.
const ScheduleEditor: React.FC<{
    schedule: ProjectSchedule;
    onSave: (schedule: ProjectSchedule) => void;
    onCancel: () => void;
}> = ({ schedule: initialSchedule, onSave, onCancel }) => {
    const [schedule, setSchedule] = useState<ProjectSchedule>(initialSchedule);

    // Core function to recalculate all stage dates based on dependencies.
    const runRecalculation = useCallback((stages: ProjectStage[], projectStartDate: string): ProjectStage[] => {
        if (!projectStartDate) return stages;

        const calculatedStages: ProjectStage[] = [];
        let lastDate = new Date(projectStartDate);
        // Adjust for timezone offset from date input
        lastDate.setMinutes(lastDate.getMinutes() + lastDate.getTimezoneOffset());

        stages.forEach((stage, index) => {
            let currentStageStartDate: Date;

            if (index > 0) {
                const prevStage = calculatedStages[index - 1];
                const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
                 // Adjust for timezone offset
                prevStageEndDate.setMinutes(prevStageEndDate.getMinutes() + prevStageEndDate.getTimezoneOffset());
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
    
     // Recalculate everything when the main project start date changes.
    const handleProjectStartDateChange = (newStartDate: string) => {
        setSchedule(prev => {
            const recalculatedStages = runRecalculation(prev.stages, newStartDate);
            return { ...prev, startDate: newStartDate, stages: recalculatedStages };
        });
    };

    // Generic handler for changes to any field within a stage.
    const handleStageChange = (stageId: number, field: keyof ProjectStage, value: any) => {
        const updatedStages = schedule.stages.map(s =>
            s.id === stageId ? { ...s, [field]: value } : s
        );
        const finalStages = runRecalculation(updatedStages, schedule.startDate);
        setSchedule(prev => ({ ...prev, stages: finalStages }));
    };
    
    // Specific handler for the completion checkbox.
    const handleToggleCompletion = (stageId: number, isChecked: boolean) => {
        const completionDate = isChecked ? new Date().toISOString().split('T')[0] : undefined;
        handleStageChange(stageId, 'completionDate', completionDate);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                 <h2 className="text-xl font-semibold text-slate-800 mb-4 sm:mb-0">Cronograma do Projeto: <span className="font-bold text-blue-600">{schedule.projectName}</span></h2>
                 <div className="flex items-center space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">Cancelar</button>
                    <button onClick={() => onSave(schedule)} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">Salvar</button>
                 </div>
            </div>
             <div className="mb-6 max-w-xs">
                <label htmlFor="project-start-date" className="block text-sm font-medium text-slate-700">Data de Início Geral do Projeto</label>
                <input
                    type="date"
                    id="project-start-date"
                    value={schedule.startDate || ''}
                    onChange={(e) => handleProjectStartDateChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left table-fixed min-w-[1200px]">
                <thead className="border-b-2 border-slate-200">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[25%]">Etapa</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[100px] text-center">Duração (dias)</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[160px]">Início Previsto</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[160px]">Prazo Final</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[100px] text-center">Concluído</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[160px]">Data de Conclusão</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-[120px]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.stages.map((stage) => (
                    <tr key={stage.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="p-3 font-medium text-slate-800 align-middle">{stage.name}</td>
                      <td className="p-3 align-middle">
                         <input 
                            type="number" 
                            value={stage.durationWorkDays} 
                            onChange={(e) => handleStageChange(stage.id, 'durationWorkDays', e.target.value === '' ? 0 : parseInt(e.target.value, 10))} 
                            className="block w-20 mx-auto rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2 text-center" 
                            min="0"
                         />
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap align-middle">
                        <input
                            type="date"
                            value={stage.startDate || ''}
                            onChange={(e) => handleStageChange(stage.id, 'startDate', e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2"
                        />
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap align-middle font-medium">
                        {formatDateForDisplay(stage.deadline)}
                      </td>
                      <td className="p-3 text-center align-middle">
                        <input 
                            type="checkbox" 
                            checked={!!stage.completionDate} 
                            onChange={(e) => handleToggleCompletion(stage.id, e.target.checked)} 
                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap align-middle">
                         <input
                            type="date"
                            value={stage.completionDate || ''}
                            onChange={(e) => handleStageChange(stage.id, 'completionDate', e.target.value)}
                            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2"
                        />
                      </td>
                      <td className="p-3 align-middle">{getStatus(stage)}</td>
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

interface PlannerTask {
    clientName: string;
    stageName: string;
    status: 'completed' | 'late' | 'on_time';
}

const Progress: React.FC<ProgressProps> = ({ schedules, setSchedules, contracts }) => {
    type Mode = 'gantt' | 'edit' | 'planner';
    type DeadlineFilter = 'all' | 'expiring' | 'late';
    
    const [mode, setMode] = useState<Mode>('gantt');
    const [currentSchedule, setCurrentSchedule] = useState<ProjectSchedule | null>(null);
    const [filterStage, setFilterStage] = useState<string>('all');
    const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>('all');
    
    const [plannerDate, setPlannerDate] = useState(new Date());
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);


    const ganttProjects = useMemo((): GanttProject[] => {
        const stageMapping: { [key: string]: string[] } = {
            'Briefing': ['Reunião de Briefing', 'Medição'],
            'Layout': ['Apresentação do Layout Planta Baixa', 'Revisão 01 (Planta Baixa)', 'Revisão 02 (Planta Baixa)', 'Revisão 03 (Planta Baixa)'],
            '3D': ['Apresentação de 3D', 'Revisão 01 (3D)', 'Revisão 02 (3D)', 'Revisão 03 (3D)'],
            'Executivo': ['Executivo'],
            'Entrega': ['Entrega'],
        };
        
        const activeContracts = contracts.filter(c => c.status === 'Ativo');
        const activeSchedules = schedules.filter(s => activeContracts.some(c => c.id === s.contractId));
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return activeSchedules.map(schedule => {
            let daysRemaining: number | undefined;

            const ganttStages = GANTT_STAGES_CONFIG.map(ganttStageConfig => {
                const detailedStageNames = stageMapping[ganttStageConfig.name] || [];
                const relevantStages = schedule.stages.filter(s => detailedStageNames.includes(s.name) && s.startDate && s.deadline);
                
                if (relevantStages.length === 0) {
                    return { name: ganttStageConfig.name, startDate: new Date(), endDate: new Date(), status: 'pending', progress: 0 } as GanttStage;
                }

                const completedCount = relevantStages.filter(s => s.completionDate).length;
                const progress = (completedCount / relevantStages.length) * 100;

                let status: GanttStage['status'] = 'pending';
                if (progress === 100) {
                    status = 'completed';
                } else if (progress > 0 || (new Date(`${relevantStages[0].startDate}T00:00:00`) <= today)) {
                    status = 'in_progress';
                }

                if (status === 'in_progress' && daysRemaining === undefined) {
                    const currentDetailedStage = relevantStages.find(s => !s.completionDate);
                    if (currentDetailedStage?.deadline) {
                        const deadline = new Date(`${currentDetailedStage.deadline}T00:00:00`);
                        daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    }
                }
                
                const firstStage = relevantStages[0];
                const lastStage = relevantStages[relevantStages.length - 1];

                return {
                    name: ganttStageConfig.name,
                    startDate: new Date(`${firstStage.startDate}T00:00:00`),
                    endDate: new Date(`${lastStage.deadline}T00:00:00`),
                    status,
                    progress,
                };
            });
            
            return {
                contractId: schedule.contractId,
                clientName: schedule.clientName,
                projectName: schedule.projectName,
                schedule,
                stages: ganttStages,
                daysRemaining,
            };
        });
    }, [schedules, contracts]);
    
    const filteredProjects = useMemo(() => {
        return ganttProjects.filter(project => {
            // Stage filter
            const stageMatch = filterStage === 'all' || project.stages.some(s => s.name === filterStage && s.status === 'in_progress');
            if (!stageMatch) return false;

            // Deadline filter
            if (deadlineFilter === 'all') return true;
            if (deadlineFilter === 'expiring') {
                return project.daysRemaining !== undefined && project.daysRemaining >= 0 && project.daysRemaining <= 7;
            }
            if (deadlineFilter === 'late') {
                return project.daysRemaining !== undefined && project.daysRemaining < 0;
            }
            return true;
        });
    }, [ganttProjects, filterStage, deadlineFilter]);

    const handleEdit = (schedule: ProjectSchedule) => {
        setCurrentSchedule(JSON.parse(JSON.stringify(schedule))); // Deep copy for safe editing
        setMode('edit');
    };

    const handleSave = (scheduleToSave: ProjectSchedule) => {
        const newSchedules = schedules.map(s => s.id === scheduleToSave.id ? scheduleToSave : s);
        setSchedules(newSchedules);
        setMode('gantt');
        setCurrentSchedule(null);
    };

    const handleCancel = () => {
        setMode('gantt');
        setCurrentSchedule(null);
    };

    // Planner specific logic
    const handleMonthChange = (offset: number) => {
        setPlannerDate(current => {
            const newDate = new Date(current);
            newDate.setDate(1); // Avoid month-end issues
            newDate.setMonth(newDate.getMonth() + offset);
            return newDate;
        });
        setSelectedWeekIndex(0);
    };

    const weeksInMonth = useMemo(() => {
        const date = plannerDate;
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const grid: Date[] = [];
        const startDate = new Date(firstDayOfMonth);
        startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

        for (let i = 0; i < 42; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            grid.push(day);
        }

        const finalWeeks: Date[][] = [];
        for (let i = 0; i < grid.length; i += 7) {
            finalWeeks.push(grid.slice(i, i + 7));
        }
        
        const relevantWeeks = finalWeeks.filter(week => week.some(day => day.getMonth() === month));
        return relevantWeeks;
    }, [plannerDate]);
    
    useEffect(() => {
        const currentMonthWeeks = weeksInMonth;
        if(selectedWeekIndex >= currentMonthWeeks.length) {
            setSelectedWeekIndex(Math.max(0, currentMonthWeeks.length - 1));
        }
    }, [weeksInMonth, selectedWeekIndex]);


    const getTasksForDay = useCallback((day: Date): PlannerTask[] => {
        const tasks: PlannerTask[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dayWithNoTime = new Date(day);
        dayWithNoTime.setHours(0, 0, 0, 0);

        for (const schedule of schedules) {
            for (const stage of schedule.stages) {
                if (stage.startDate && stage.deadline) {
                    const startDate = new Date(`${stage.startDate}T00:00:00`);
                    const deadline = new Date(`${stage.deadline}T00:00:00`);

                    if (dayWithNoTime >= startDate && dayWithNoTime <= deadline) {
                        let status: PlannerTask['status'];
                        if (stage.completionDate) {
                            status = 'completed';
                        } else if (deadline < today) {
                            status = 'late';
                        } else {
                            status = 'on_time';
                        }
                        tasks.push({
                            clientName: schedule.clientName,
                            stageName: stage.name,
                            status: status,
                        });
                    }
                }
            }
        }
        return tasks;
    }, [schedules]);

    const getTaskColor = (status: PlannerTask['status']) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-l-4 border-green-500';
            case 'late': return 'bg-red-100 text-red-800 border-l-4 border-red-500';
            case 'on_time': return 'bg-blue-100 text-blue-800 border-l-4 border-blue-500';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    if (mode === 'edit' && currentSchedule) {
        return <ScheduleEditor schedule={currentSchedule} onSave={handleSave} onCancel={handleCancel} />;
    }

    const getDaysRemainingInfo = (days: number | undefined) => {
        if (days === undefined) return null;
        if (days < 0) {
            return <span className="text-red-600 font-bold text-[10px]">{Math.abs(days)} dia(s) atrasado</span>;
        }
        if (days <= 7) {
            return <span className="text-orange-500 font-semibold text-[10px]">{days} dia(s) restante(s)</span>;
        }
        return <span className="text-slate-400 text-[10px]">{days} dia(s) restante(s)</span>;
    };
    
    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Progresso dos Projetos</h1>
                <p className="mt-1 text-blue-100">Acompanhe e edite o cronograma de cada projeto.</p>
            </header>
            
            <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                <nav className="flex space-x-1">
                    <button 
                        onClick={() => setMode('gantt')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 w-full ${mode === 'gantt' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        Visão Geral (Tabela)
                    </button>
                    <button 
                        onClick={() => setMode('planner')}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 w-full ${mode === 'planner' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        Planner Semanal
                    </button>
                </nav>
            </div>


            {mode === 'gantt' && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800 mb-2 sm:mb-0">Visão Geral dos Cronogramas</h2>
                        <div className="flex items-center">
                            <label htmlFor="stage-filter" className="block text-sm font-medium text-slate-600 mr-2 whitespace-nowrap">Filtrar por etapa:</label>
                            <select
                                id="stage-filter"
                                value={filterStage}
                                onChange={(e) => setFilterStage(e.target.value)}
                                className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3 bg-white"
                            >
                                <option value="all">Mostrar Tudo</option>
                                {GANTT_STAGES_CONFIG.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                     <div className="flex items-center space-x-4 mb-6 border-t border-slate-200 pt-4">
                        <span className="text-sm font-medium text-slate-600">Filtrar por prazo:</span>
                        <div className="flex items-center space-x-4">
                            {(['all', 'expiring', 'late'] as DeadlineFilter[]).map(filter => (
                                <label key={filter} className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deadlineFilter"
                                        value={filter}
                                        checked={deadlineFilter === filter}
                                        onChange={(e) => setDeadlineFilter(e.target.value as DeadlineFilter)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-slate-700">
                                        {filter === 'all' && 'Todos'}
                                        {filter === 'expiring' && 'Próximos do Vencimento'}
                                        {filter === 'late' && 'Atrasados'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="min-w-[1000px]">
                             {/* Replaced Matrix Header */}
                             <div className="grid grid-cols-12 gap-4 bg-slate-50 p-3 rounded-t-lg border-b border-slate-200">
                                 <div className="col-span-2 text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">Projeto</div>
                                 {GANTT_STAGES_CONFIG.map(stage => (
                                     <div key={stage.name} className="col-span-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{stage.name}</div>
                                 ))}
                            </div>

                            {/* Replaced Matrix Body */}
                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-b-lg">
                                {filteredProjects.map(project => (
                                    <div key={project.contractId} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-slate-50 transition-colors bg-white">
                                        <div className="col-span-2">
                                            <p 
                                                className="font-bold text-slate-800 text-sm cursor-pointer hover:text-blue-600 truncate"
                                                onClick={() => handleEdit(project.schedule)}
                                            >{project.clientName}</p>
                                            <div className="mt-1">
                                                 {getDaysRemainingInfo(project.daysRemaining)}
                                            </div>
                                        </div>
                                        
                                        {project.stages.map((stage, idx) => {
                                            const today = new Date();
                                            today.setHours(0,0,0,0);
                                            const stageEndDate = new Date(stage.endDate);
                                            // Fix timezone issues if simple string conversion from JSON
                                            stageEndDate.setMinutes(stageEndDate.getMinutes() + stageEndDate.getTimezoneOffset());
                                            stageEndDate.setHours(0,0,0,0);
                                            
                                            const diffTime = stageEndDate.getTime() - today.getTime();
                                            const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                            
                                            const isLate = stage.status !== 'completed' && daysRemaining < 0;
                                            const isNearDue = stage.status !== 'completed' && daysRemaining >= 0 && daysRemaining <= 2;
                                            
                                            let statusBadge;
                                            let progressColor = 'bg-slate-300';
                                            let footerInfo;
                                            
                                            if (stage.status === 'completed') {
                                                statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wide border border-green-200">Concluído</span>;
                                                progressColor = 'bg-green-500';
                                                footerInfo = <span className="text-[10px] text-slate-400 font-medium">{formatDateForDisplay(stage.endDate)}</span>;
                                            } else if (stage.status === 'in_progress') {
                                                 if (isLate) {
                                                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-800 uppercase tracking-wide border border-red-200">Atrasado</span>;
                                                     progressColor = 'bg-red-500';
                                                     footerInfo = <span className="text-[10px] font-bold text-red-600">{Math.abs(daysRemaining)} dia(s) de atraso</span>;
                                                 } else if (isNearDue) {
                                                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-yellow-100 text-yellow-800 uppercase tracking-wide border border-yellow-200">Próx. Vencimento</span>;
                                                     progressColor = 'bg-yellow-500';
                                                     footerInfo = <span className="text-[10px] font-bold text-yellow-600">{daysRemaining === 0 ? 'Vence Hoje' : `Vence em ${daysRemaining} dia(s)`}</span>;
                                                 } else {
                                                     statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wide border border-blue-200">Em Andamento</span>;
                                                     progressColor = 'bg-blue-500';
                                                     footerInfo = <span className="text-[10px] text-slate-500 font-medium">Até {formatDateForDisplay(stage.endDate)}</span>;
                                                 }
                                            } else {
                                                // Pending
                                                statusBadge = <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 uppercase tracking-wide border border-slate-200">Pendente</span>;
                                                progressColor = 'bg-slate-300';
                                                if(daysRemaining < 0) {
                                                      footerInfo = <span className="text-[10px] font-medium text-red-400">{formatDateForDisplay(stage.endDate)}</span>;
                                                } else {
                                                     footerInfo = <span className="text-[10px] font-medium text-slate-400">{formatDateForDisplay(stage.endDate)}</span>;
                                                }
                                            }

                                            return (
                                                <div key={idx} className="col-span-2 flex flex-col items-center justify-start space-y-2 px-2 py-3 h-full border-l border-slate-100 last:border-r-0">
                                                     {statusBadge}
                                                     
                                                     <div className="w-full max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                         <div className={`h-full rounded-full ${progressColor}`} style={{width: `${stage.status === 'completed' ? 100 : stage.progress}%`}}></div>
                                                     </div>
                                                     
                                                     <div className="text-center leading-tight mt-1 min-h-[15px]">
                                                         {footerInfo}
                                                     </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                         {filteredProjects.length === 0 && (
                            <div className="text-center text-slate-500 py-10 mt-2">
                                <p>Nenhum projeto encontrado com os filtros selecionados.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {mode === 'planner' && (
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-slate-800">
                            {plannerDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                        </h2>
                        <div className="flex items-center space-x-1">
                            <button onClick={() => handleMonthChange(-1)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors" aria-label="Mês anterior"><ChevronLeftIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleMonthChange(1)} className="p-2 text-slate-500 rounded-full hover:bg-slate-100 transition-colors" aria-label="Próximo mês"><ChevronRightIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 mb-4">
                        {weeksInMonth.map((week, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedWeekIndex(index)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedWeekIndex === index ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Semana {index + 1} ({formatDateForDisplay(week[0])} - {formatDateForDisplay(week[6])})
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-7">
                        {weeksInMonth.length > 0 && weeksInMonth[selectedWeekIndex].map((day, index) => {
                            const isCurrentMonth = day.getMonth() === plannerDate.getMonth();
                            return (
                                <div key={index} className={`text-center font-semibold text-slate-600 pb-2 ${isCurrentMonth ? '' : 'opacity-50'}`}>
                                    <p className="text-xs uppercase">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day.getDay()]}</p>
                                    <p className="text-2xl mt-1">{day.getDate()}</p>
                                </div>
                            );
                        })}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {weeksInMonth.length > 0 && weeksInMonth[selectedWeekIndex].map((day, index) => {
                            const tasks = getTasksForDay(day);
                            const isCurrentMonth = day.getMonth() === plannerDate.getMonth();
                            return (
                                <div key={index} className={`min-h-[200px] rounded p-1 space-y-1.5 ${isCurrentMonth ? 'bg-slate-50' : 'bg-slate-50/50'}`}>
                                    {tasks.map((task, taskIndex) => (
                                        <div key={taskIndex} className={`p-2 rounded text-xs ${getTaskColor(task.status)}`}>
                                            <p>
                                                <span className="font-bold">{task.clientName}:</span> {task.stageName}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Progress;
