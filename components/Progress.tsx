
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CLIENTS } from '../constants';
import { ProjectStage, ProjectSchedule, Contract, ProjectStageTemplateItem } from '../types';
import { PencilIcon } from './Icons';

type View = 'list' | 'edit';

const addWorkDays = (startDate: Date, days: number): Date => {
    const newDate = new Date(startDate);
    let dayOfWeek = newDate.getDay();
    if (dayOfWeek === 6) { newDate.setDate(newDate.getDate() + 2); } 
    else if (dayOfWeek === 0) { newDate.setDate(newDate.getDate() + 1); }
    
    let addedDays = 0;
    while (addedDays < days) {
        newDate.setDate(newDate.getDate() + 1);
        dayOfWeek = newDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { addedDays++; }
    }
    return newDate;
};

const formatDate = (date: Date | string | undefined): string => {
    if(!date) return '--/--/----';
    const d = typeof date === 'string' ? new Date(date) : date;
    const adjustedDate = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
    return new Intl.DateTimeFormat('pt-BR').format(adjustedDate);
};

const getStatus = (stage: ProjectStage) => {
    if (stage.completionDate) {
        return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Concluído</span>;
    }
    if (stage.deadline) {
        const today = new Date(); today.setHours(0,0,0,0);
        const deadline = new Date(stage.deadline); deadline.setHours(0,0,0,0);
        if (deadline < today) {
            return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Atrasado</span>;
        }
    }
    return <span className="px-2 py-1 text-xs font-medium text-slate-800 bg-slate-100 rounded-full">Pendente</span>;
};

const ScheduleEditor: React.FC<{
    schedule: ProjectSchedule;
    onSave: (schedule: ProjectSchedule) => void;
    onCancel: () => void;
}> = ({ schedule: initialSchedule, onSave, onCancel }) => {
    const [schedule, setSchedule] = useState<ProjectSchedule>(initialSchedule);

    const calculateDeadlines = useCallback((stagesToUpdate: ProjectStage[], startDateString: string): ProjectStage[] => {
        if (!startDateString) return stagesToUpdate.map(s => ({ ...s, startDate: undefined, deadline: undefined }));

        const calculatedStages: ProjectStage[] = [];
        let projectStartDateObj = new Date(startDateString);

        let dayOfWeek = projectStartDateObj.getDay();
        while (dayOfWeek === 0 || dayOfWeek === 6) { 
            projectStartDateObj.setDate(projectStartDateObj.getDate() + 1);
            dayOfWeek = projectStartDateObj.getDay();
        }

        stagesToUpdate.forEach((stage, index) => {
            let currentStageStartDate: Date;
            if (index > 0) {
                const prevStage = calculatedStages[index - 1];
                const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
                currentStageStartDate = addWorkDays(prevStageEndDate, 1);
            } else {
                currentStageStartDate = new Date(projectStartDateObj);
            }
            
            const duration = Math.max(0, stage.durationWorkDays - 1);
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
        setSchedule(prev => ({...prev, stages: calculateDeadlines(prev.stages, prev.startDate)}));
    }, [schedule.startDate, calculateDeadlines]);

    const handleDurationChange = (stageId: number, newDurationStr: string) => {
        const newDuration = parseInt(newDurationStr, 10);
        const updatedStages = schedule.stages.map(s => 
            s.id === stageId ? { ...s, durationWorkDays: isNaN(newDuration) || newDuration < 0 ? 0 : newDuration } : s
        );
        setSchedule(prev => ({...prev, stages: calculateDeadlines(updatedStages, prev.startDate)}));
    };

    const handleToggleCompletion = (stageId: number) => {
        const today = new Date().toISOString().split('T')[0];
        const updatedStages = schedule.stages.map(s => 
            s.id === stageId ? { ...s, completionDate: s.completionDate ? undefined : today } : s
        );
        setSchedule(prev => ({...prev, stages: calculateDeadlines(updatedStages, prev.startDate)}));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-lg font-semibold text-slate-800">Cronograma do Projeto: {schedule.projectName}</h2>
                 <div className="flex items-center space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                    <button onClick={() => onSave(schedule)} className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Salvar</button>
                 </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead className="border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-sm font-semibold text-slate-500 w-2/5">Etapa</th>
                    <th className="p-3 text-sm font-semibold text-slate-500">Duração (dias)</th>
                    <th className="p-3 text-sm font-semibold text-slate-500">Início Previsto</th>
                    <th className="p-3 text-sm font-semibold text-slate-500">Prazo Final</th>
                    <th className="p-3 text-sm font-semibold text-slate-500 text-center">Concluído</th>
                    <th className="p-3 text-sm font-semibold text-slate-500">Data de Conclusão</th>
                    <th className="p-3 text-sm font-semibold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.stages.map((stage) => (
                    <tr key={stage.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50">
                      <td className="p-3 font-medium text-slate-800">{stage.name}</td>
                      <td className="p-3">
                         <input type="number" value={stage.durationWorkDays} onChange={(e) => handleDurationChange(stage.id, e.target.value)} className="block w-20 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2 text-center" min="0"/>
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">{formatDate(stage.startDate)}</td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">{formatDate(stage.deadline)}</td>
                      <td className="p-3 text-center">
                        <input type="checkbox" checked={!!stage.completionDate} onChange={() => handleToggleCompletion(stage.id)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"/>
                      </td>
                      <td className="p-3 text-slate-600 whitespace-nowrap">{stage.completionDate ? formatDate(stage.completionDate) : '--/--/----'}</td>
                      <td className="p-3">{getStatus(stage)}</td>
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
    projectStagesTemplate: ProjectStageTemplateItem[];
}

const Progress: React.FC<ProgressProps> = ({ schedules, setSchedules, contracts, projectStagesTemplate }) => {
    const [view, setView] = useState<View>('list');
    const [currentSchedule, setCurrentSchedule] = useState<ProjectSchedule | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newScheduleContractId, setNewScheduleContractId] = useState<string>('');
    const [newScheduleStartDate, setNewScheduleStartDate] = useState<string>('');

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => s.projectName.toLowerCase().includes(searchTerm.toLowerCase()) || s.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [schedules, searchTerm]);

    const handleEdit = (schedule: ProjectSchedule) => {
        setCurrentSchedule(JSON.parse(JSON.stringify(schedule))); // Deep copy to avoid direct mutation
        setView('edit');
    };

    const handleCreateNew = () => {
        if (!newScheduleContractId || !newScheduleStartDate) {
            alert("Por favor, selecione um cliente e uma data de início.");
            return;
        }
        const contract = contracts.find(c => c.id === parseInt(newScheduleContractId));
        if(!contract) return;

        const newSchedule: ProjectSchedule = {
            id: Date.now(),
            contractId: contract.id,
            clientName: contract.clientName,
            projectName: contract.projectName,
            startDate: newScheduleStartDate,
            stages: projectStagesTemplate.map((template, index) => ({ 
                id: index,
                name: template.name,
                durationWorkDays: template.durationWorkDays
            }))
        };
        setCurrentSchedule(newSchedule);
        setView('edit');
    };

    const handleSave = (scheduleToSave: ProjectSchedule) => {
        const exists = schedules.some(s => s.id === scheduleToSave.id);
        if (exists) {
            setSchedules(schedules.map(s => s.id === scheduleToSave.id ? scheduleToSave : s));
        } else {
            setSchedules([scheduleToSave, ...schedules]);
        }
        setView('list');
        setCurrentSchedule(null);
        setNewScheduleContractId('');
        setNewScheduleStartDate('');
    };

    const handleCancel = () => {
        setView('list');
        setCurrentSchedule(null);
    };

    if (view === 'edit' && currentSchedule) {
        return <ScheduleEditor schedule={currentSchedule} onSave={handleSave} onCancel={handleCancel} />;
    }

    return (
        <div className="space-y-8">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">Progresso dos Projetos</h1>
                <p className="mt-1 text-blue-100">Acompanhe e edite o cronograma de cada projeto.</p>
            </header>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                 <h2 className="text-lg font-semibold text-slate-800 mb-4">Criar Novo Cronograma</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="client" className="block text-sm font-medium text-slate-600">Cliente</label>
                        <select id="client" value={newScheduleContractId} onChange={(e) => setNewScheduleContractId(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                            <option value="">Selecione um cliente...</option>
                            {contracts.filter(c => c.status === 'Ativo' && !schedules.some(s => s.contractId === c.id)).map(c => (
                                <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-600">Data de Início do Projeto</label>
                        <input type="date" id="startDate" value={newScheduleStartDate} onChange={(e) => setNewScheduleStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3" />
                    </div>
                    <button onClick={handleCreateNew} className="justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-10">
                        + Criar Novo Progresso
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-800">Cronogramas Salvos</h2>
                    <input type="text" placeholder="Buscar por projeto ou cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-full max-w-sm rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3" />
                </div>
                <div className="space-y-3">
                    {filteredSchedules.map(schedule => (
                        <div key={schedule.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
                            <div>
                                <p className="font-semibold text-slate-800">{schedule.projectName}</p>
                                <p className="text-sm text-slate-500">{schedule.clientName}</p>
                            </div>
                            <button onClick={() => handleEdit(schedule)} className="flex items-center space-x-2 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100">
                                <PencilIcon className="w-4 h-4" />
                                <span>Editar</span>
                            </button>
                        </div>
                    ))}
                    {filteredSchedules.length === 0 && <p className="text-slate-500 text-center py-4">Nenhum cronograma encontrado.</p>}
                </div>
            </div>
        </div>
    );
};

export default Progress;