
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ProjectStage, ProjectSchedule, Contract } from '../types';
import { PencilIcon, CalendarIcon, CheckCircleIcon, TrendingUpIcon, ChevronRightIcon } from './Icons';

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
    const date = typeof dateString === 'string' ? new Date(`${dateString}T00:00:00`) : dateString;
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
        const deadline = new Date(stage.deadline);
        deadline.setMinutes(deadline.getMinutes() + deadline.getTimezoneOffset());
        if (deadline < today) {
            return <span className="px-2 py-1 text-[10px] font-bold text-red-700 bg-red-100 rounded-full border border-red-200">ATRASADO</span>;
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
        let lastDate = new Date(projectStartDate);
        lastDate.setMinutes(lastDate.getMinutes() + lastDate.getTimezoneOffset());

        stages.forEach((stage, index) => {
            let currentStageStartDate: Date;
            if (index > 0) {
                const prevStage = calculatedStages[index - 1];
                const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
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
    
    // Garantir recalculo inicial caso falte data
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
            
            <p className="mt-6 text-xs text-slate-400 italic">
                * As datas são calculadas automaticamente considerando apenas dias úteis (seg-sex). Ao concluir uma etapa, a próxima se inicia no dia útil seguinte.
            </p>
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

    const activeProjects = useMemo(() => {
        const activeContracts = contracts.filter(c => c.status === 'Ativo');
        return schedules.filter(s => activeContracts.some(c => c.id === s.contractId)).map(schedule => {
            const contract = contracts.find(c => c.id === schedule.contractId)!;
            const completedStages = schedule.stages.filter(st => st.completionDate).length;
            const progress = schedule.stages.length > 0 ? Math.round((completedStages / schedule.stages.length) * 100) : 0;
            
            const start = schedule.startDate ? new Date(schedule.startDate) : new Date();
            const lastStage = schedule.stages[schedule.stages.length - 1];
            const end = lastStage?.deadline ? new Date(lastStage.deadline) : new Date();
            
            return {
                ...schedule,
                contract,
                progress,
                startDateObj: start,
                endDateObj: end
            };
        }).sort((a, b) => a.startDateObj.getTime() - b.startDateObj.getTime());
    }, [schedules, contracts]);

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
        <div className="space-y-8">
            <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white p-10 rounded-2xl shadow-xl -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <div className="flex items-center space-x-4 mb-2">
                    <TrendingUpIcon className="w-12 h-12 text-blue-200" />
                    <h1 className="text-4xl font-black tracking-tight uppercase">Linha do Tempo de Projetos</h1>
                </div>
                <p className="text-blue-100 text-lg font-medium opacity-90 max-w-2xl">
                    Acompanhe o progresso de cada fase e garanta que os prazos de entrega sejam cumpridos.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {activeProjects.map(project => (
                    <div 
                        key={project.id} 
                        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:border-blue-300 transition-all group cursor-pointer"
                        onClick={() => handleEdit(project)}
                    >
                        <div className="p-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest">{project.contract.serviceType}</span>
                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">ID: {project.contract.id}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{project.projectName}</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Cliente: {project.clientName}</p>
                                </div>
                                <div className="mt-6 md:mt-0 flex items-center space-x-8">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Início do Fluxo</p>
                                        <p className="font-black text-slate-700 bg-slate-50 px-3 py-1 rounded-lg">{formatDateForDisplay(project.startDate)}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Previsão Entrega</p>
                                        <p className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{formatDateForDisplay(project.stages[project.stages.length-1]?.deadline)}</p>
                                    </div>
                                    <div className="h-12 w-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner group-hover:shadow-blue-200">
                                        <PencilIcon className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>

                            {/* Barra de Progresso Visual */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-2xl font-black text-slate-800 italic">{project.progress}%</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progresso Total</span>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {project.stages.filter(s => s.completionDate).length} de {project.stages.length} Fases Concluídas
                                    </span>
                                </div>
                                
                                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner border border-slate-100">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out relative" 
                                        style={{ width: `${project.progress}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                                    </div>
                                </div>

                                {/* Visual de Fases Sequenciais */}
                                <div className="flex items-center gap-1 pt-4 overflow-x-auto pb-2 custom-scrollbar">
                                    {project.stages.map((stage, idx) => {
                                        const isCompleted = !!stage.completionDate;
                                        const isLast = idx === project.stages.length - 1;
                                        return (
                                            <React.Fragment key={idx}>
                                                <div className="flex flex-col items-center min-w-[100px] flex-1">
                                                    <div 
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${isCompleted ? 'bg-green-100 border-green-500 text-green-600 shadow-md shadow-green-100' : 'bg-slate-50 border-slate-200 text-slate-300'}`}
                                                        title={`${stage.name}: ${formatDateForDisplay(stage.deadline)}`}
                                                    >
                                                        {isCompleted ? <CheckCircleIcon className="w-6 h-6" /> : <span className="font-black text-xs">{idx + 1}</span>}
                                                    </div>
                                                    <p className={`mt-2 text-[9px] font-black uppercase text-center w-full truncate px-1 ${isCompleted ? 'text-green-700' : 'text-slate-400'}`}>{stage.name}</p>
                                                    <p className="text-[8px] font-bold text-slate-300 mt-0.5">{formatDateForDisplay(stage.deadline)}</p>
                                                </div>
                                                {!isLast && (
                                                    <div className={`h-0.5 flex-1 min-w-[20px] mb-8 ${isCompleted ? 'bg-green-500' : 'bg-slate-100'}`}></div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {activeProjects.length === 0 && (
                    <div className="bg-white p-24 rounded-3xl border-4 border-dashed border-slate-100 text-center shadow-inner">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                            <CalendarIcon className="w-12 h-12 text-slate-200" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-300 uppercase tracking-[0.2em]">Nenhum fluxo de projeto ativo</h2>
                        <p className="mt-3 text-slate-400 font-medium">Ative orçamentos para gerar cronogramas automaticamente aqui.</p>
                        <button className="mt-8 px-8 py-3 bg-blue-100 text-blue-600 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Iniciar Nova Proposta</button>
                    </div>
                )}
            </div>
            
            <style>{`
                @keyframes progress-bar-stripes {
                    from { background-position: 20px 0; }
                    to { background-position: 0 0; }
                }
            `}</style>
        </div>
    );
};

export default Progress;
