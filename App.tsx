
import React, { useState, useEffect } from 'react';
import { 
  DashboardIcon, 
  BellIcon, 
  FileTextIcon, 
  PlusIcon, 
  TrendingUpIcon, 
  CogIcon, 
  ReceiptIcon, 
  CashIcon, 
  DatabaseIcon, 
  UsersIcon, 
  ClipboardCheckIcon, 
  CreditCardIcon, 
  MapPinIcon,
  BrandLogo 
} from './components/Icons';
import Dashboard from './components/Dashboard';
import Reminders from './components/Reminders';
import Contracts from './components/Contracts';
import NewContract from './components/NewContract';
import Progress from './components/Progress';
import Settings from './components/Settings';
import Receipts from './components/Receipts';
import Projections from './components/Projections';
import Database from './components/Database';
import Partners from './components/Partners';
import ConstructionChecklist from './components/ConstructionChecklist';
import Expenses from './components/Expenses';
import TechnicalVisits from './components/TechnicalVisits';

import { AppData, PaymentInstallment, Contract, OtherPayment, Partner, ProjectStageTemplateItem, ProjectSchedule, ProjectStage, ProjectProgress, StageProgress, ProjectChecklist, Expense, VisitLog } from './types';
import { CLIENTS, MOCK_CONTRACTS, MOCK_REMINDERS, INITIAL_INSTALLMENTS, MOCK_PROJECT_SCHEDULES, MOCK_PROJECT_PROGRESS, MOCK_SERVICE_PRICES, MOCK_HOURLY_RATES, MOCK_MEASUREMENT_TIERS, MOCK_EXTRA_TIERS, DEFAULT_PROJECT_STAGES_TEMPLATE, MOCK_OTHER_PAYMENTS, MOCK_PARTNERS, GANTT_STAGES_CONFIG, MOCK_EXPENSES, MOCK_VISIT_LOGS } from './constants';

type View = 'dashboard' | 'contracts' | 'new-contract' | 'progress' | 'projections' | 'receipts' | 'reminders' | 'settings' | 'database' | 'partners' | 'checklist' | 'expenses' | 'tech-visits';

const getInitialData = (): AppData => {
    const saved = localStorage.getItem('E_PROJET_DATA_LOCAL');
    const defaultData = {
        clients: CLIENTS,
        contracts: MOCK_CONTRACTS,
        reminders: MOCK_REMINDERS,
        installments: INITIAL_INSTALLMENTS,
        schedules: MOCK_PROJECT_SCHEDULES,
        projectProgress: MOCK_PROJECT_PROGRESS,
        servicePrices: MOCK_SERVICE_PRICES,
        hourlyRates: MOCK_HOURLY_RATES,
        measurementTiers: MOCK_MEASUREMENT_TIERS,
        extraTiers: MOCK_EXTRA_TIERS,
        projectStagesTemplate: DEFAULT_PROJECT_STAGES_TEMPLATE,
        otherPayments: MOCK_OTHER_PAYMENTS,
        partners: MOCK_PARTNERS,
        checklists: [],
        expenses: MOCK_EXPENSES,
        visitLogs: MOCK_VISIT_LOGS,
    };

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Ensure expenses array exists if loading from older data
            if(!parsed.expenses) parsed.expenses = [];
            return { ...defaultData, ...parsed };
        } catch (e) {
            console.error("Failed to parse local storage", e);
            return defaultData;
        }
    }
    return defaultData;
};

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li className="px-3">
    <button
      onClick={onClick}
      className={`flex items-center w-full px-3 py-2.5 text-left text-sm rounded-md transition-colors duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white font-semibold shadow-inner' 
          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  </li>
);

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

const createScheduleStages = (template: ProjectStageTemplateItem[], startDateString: string): ProjectStage[] => {
    const stages: ProjectStage[] = [];
    if (!startDateString) return stages;
    let projectStartDateObj = new Date(startDateString);
    let dayOfWeek = projectStartDateObj.getDay();
    while (dayOfWeek === 0 || dayOfWeek === 6) { 
        projectStartDateObj.setDate(projectStartDateObj.getDate() + 1);
        dayOfWeek = projectStartDateObj.getDay();
    }
    template.forEach((stageTemplate, index) => {
        let currentStageStartDate: Date;
        if (index > 0) {
            const prevStage = stages[index - 1];
            const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
            currentStageStartDate = addWorkDays(prevStageEndDate, 1);
        } else {
            currentStageStartDate = new Date(projectStartDateObj);
        }
        const duration = Math.max(0, stageTemplate.durationWorkDays > 0 ? stageTemplate.durationWorkDays - 1 : 0);
        const deadline = addWorkDays(new Date(currentStageStartDate), duration);
        stages.push({
            id: stageTemplate.id,
            name: stageTemplate.name,
            durationWorkDays: stageTemplate.durationWorkDays,
            startDate: currentStageStartDate.toISOString().split('T')[0],
            deadline: deadline.toISOString().split('T')[0],
        });
    });
    return stages;
};

const generateProjectProgressFromSchedule = (schedule: ProjectSchedule): ProjectProgress => {
    const stageMapping: { [key: string]: string[] } = {
        'Briefing': ['Reunião de Briefing', 'Medição'],
        'Layout': ['Apresentação do Layout Planta Baixa', 'Revisão 01 (Planta Baixa)', 'Revisão 02 (Planta Baixa)', 'Revisão 03 (Planta Baixa)'],
        '3D': ['Apresentação de 3D', 'Revisão 01 (3D)', 'Revisão 02 (3D)', 'Revisão 03 (3D)'],
        'Executivo': ['Executivo'],
        'Entrega': ['Entrega'],
    };
    const progressStages: StageProgress[] = GANTT_STAGES_CONFIG.map(ganttStage => {
        const detailedStageNames = stageMapping[ganttStage.name] || [];
        const relevantDetailedStages = schedule.stages.filter(s => detailedStageNames.includes(s.name));
        if (relevantDetailedStages.length === 0) {
            return { name: ganttStage.name, status: 'pending' };
        }
        const completedCount = relevantDetailedStages.filter(s => s.completionDate).length;
        let status: 'completed' | 'in_progress' | 'pending';
        if (completedCount === relevantDetailedStages.length) {
            status = 'completed';
        } else if (completedCount > 0) {
            status = 'in_progress';
        } else {
            const firstStageOfGroup = relevantDetailedStages[0];
            const today = new Date();
            today.setHours(0,0,0,0);
            const stageStartDate = firstStageOfGroup.startDate ? new Date(firstStageOfGroup.startDate) : null;
            if(stageStartDate && stageStartDate <= today){
                status = 'in_progress';
            } else {
                status = 'pending';
            }
        }
        return { name: ganttStage.name, status };
    });
    return {
        contractId: schedule.contractId,
        projectName: schedule.projectName,
        clientName: schedule.clientName,
        stages: progressStages,
    };
};

const recalculateScheduleStages = (stages: ProjectStage[], projectStartDate: string): ProjectStage[] => {
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
};

const generateDependentData = (contract: Contract, projectStagesTemplate: ProjectStageTemplateItem[]) => {
    const newInstallments: PaymentInstallment[] = [];
    if (contract.downPayment > 0) {
        newInstallments.push({
            id: Date.now(),
            contractId: contract.id,
            clientName: contract.clientName,
            projectName: contract.projectName,
            installment: 'Entrada',
            dueDate: contract.downPaymentDate,
            value: contract.downPayment,
            status: 'Pendente',
        });
    }
    if (contract.installments > 0 && contract.firstInstallmentDate) {
        const firstDate = new Date(contract.firstInstallmentDate);
        for (let i = 0; i < contract.installments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            newInstallments.push({
                id: Date.now() + i + 1,
                contractId: contract.id,
                clientName: contract.clientName,
                projectName: contract.projectName,
                installment: `${i + 1}/${contract.installments}`,
                dueDate: dueDate,
                value: contract.installmentValue,
                status: 'Pendente',
            });
        }
    }
    const newSchedule: ProjectSchedule = {
        id: Date.now(),
        contractId: contract.id,
        clientName: contract.clientName,
        projectName: contract.projectName,
        startDate: new Date(contract.date).toISOString().split('T')[0],
        stages: createScheduleStages(projectStagesTemplate, new Date(contract.date).toISOString()),
    };
    const newProgress = generateProjectProgressFromSchedule(newSchedule);
    return { newInstallments, newSchedule, newProgress };
};

export default function App() {
  const [appData, setAppData] = useState<AppData>(getInitialData());
  const [view, setView] = useState<View>('dashboard');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Persistence effect
  useEffect(() => {
      localStorage.setItem('E_PROJET_DATA_LOCAL', JSON.stringify(appData));
  }, [appData]);

  const handleAddContract = (newContract: Omit<Contract, 'id'>) => {
    const contractWithId: Contract = { ...newContract, id: Date.now() };
    const { newInstallments, newSchedule, newProgress } = generateDependentData(contractWithId, appData.projectStagesTemplate);
    setAppData({
        ...appData,
        contracts: [contractWithId, ...appData.contracts],
        installments: [...newInstallments, ...appData.installments],
        schedules: [newSchedule, ...appData.schedules],
        projectProgress: [newProgress, ...(appData.projectProgress || [])],
        clients: appData.clients.some(c => c.name === contractWithId.clientName) 
            ? appData.clients 
            : [{ id: Date.now() + 1, name: contractWithId.clientName }, ...appData.clients]
    });
    setView('contracts');
  };
  
  const handleUpdateContract = (updatedContract: Contract) => {
    const newInstallments: PaymentInstallment[] = [];
    if (updatedContract.downPayment > 0) {
        const existingDownPayment = appData.installments.find(i => i.contractId === updatedContract.id && i.installment === 'Entrada');
        const isPaid = existingDownPayment?.status.includes('Pago');
        newInstallments.push({
            id: Date.now(),
            contractId: updatedContract.id,
            clientName: updatedContract.clientName,
            projectName: updatedContract.projectName,
            installment: 'Entrada',
            dueDate: updatedContract.downPaymentDate,
            value: updatedContract.downPayment,
            status: isPaid ? existingDownPayment.status : 'Pendente',
            paymentDate: isPaid ? existingDownPayment.paymentDate : undefined,
        });
    }
    if (updatedContract.installments > 0 && updatedContract.firstInstallmentDate) {
        const firstDate = new Date(updatedContract.firstInstallmentDate);
        for (let i = 0; i < updatedContract.installments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            newInstallments.push({
                id: Date.now() + i + 1,
                contractId: updatedContract.id,
                clientName: updatedContract.clientName,
                projectName: updatedContract.projectName,
                installment: `${i + 1}/${updatedContract.installments}`,
                dueDate: dueDate,
                value: updatedContract.installmentValue,
                status: 'Pendente',
            });
        }
    }
    const existingSchedule = appData.schedules.find(s => s.contractId === updatedContract.id);
    const baseStages = existingSchedule ? existingSchedule.stages : createScheduleStages(appData.projectStagesTemplate, new Date(updatedContract.date).toISOString());
    const updatedStages = recalculateScheduleStages(baseStages, new Date(updatedContract.date).toISOString().split('T')[0]);
    const newSchedule: ProjectSchedule = {
        id: existingSchedule ? existingSchedule.id : Date.now(),
        contractId: updatedContract.id,
        clientName: updatedContract.clientName,
        projectName: updatedContract.projectName,
        startDate: new Date(updatedContract.date).toISOString().split('T')[0],
        stages: updatedStages,
    };
    const newProgress = generateProjectProgressFromSchedule(newSchedule);
    
    setAppData({
        ...appData,
        contracts: appData.contracts.map(c => c.id === updatedContract.id ? updatedContract : c),
        installments: [
            ...appData.installments.filter(i => i.contractId !== updatedContract.id),
            ...newInstallments
        ],
        schedules: [
            ...appData.schedules.filter(s => s.contractId !== updatedContract.id),
            newSchedule
        ],
        projectProgress: [
            ...(appData.projectProgress || []).filter(p => p.contractId !== updatedContract.id),
            newProgress
        ],
    });
    setEditingContract(null);
    setView('contracts');
  };

  const handleDeleteContract = (contractId: number) => {
    setAppData({
        ...appData,
        contracts: appData.contracts.filter(c => c.id !== contractId),
        installments: appData.installments.filter(i => i.contractId !== contractId),
        schedules: appData.schedules.filter(s => s.contractId !== contractId),
        projectProgress: appData.projectProgress?.filter(p => p.contractId !== contractId),
        checklists: appData.checklists ? appData.checklists.filter(c => c.contractId !== contractId) : [],
        visitLogs: appData.visitLogs ? appData.visitLogs.filter(v => v.contractId !== contractId) : [],
    });
  };
  
  const handleAddPartner = (newPartner: Omit<Partner, 'id'>) => {
    setAppData({
        ...appData,
        partners: [{ ...newPartner, id: Date.now() }, ...appData.partners]
    });
  };

  const handleUpdatePartner = (updatedPartner: Partner) => {
    setAppData({
        ...appData,
        partners: appData.partners.map(p => p.id === updatedPartner.id ? updatedPartner : p)
    });
  };

  const handleDeletePartner = (partnerId: number) => {
    setAppData({
        ...appData,
        partners: appData.partners.filter(p => p.id !== partnerId)
    });
  };

  const handleUpdateChecklist = (updatedChecklist: ProjectChecklist) => {
    const currentChecklists = appData.checklists || [];
    const existingIndex = currentChecklists.findIndex(c => c.contractId === updatedChecklist.contractId);
    let newChecklists;
    if (existingIndex >= 0) {
        newChecklists = [...currentChecklists];
        newChecklists[existingIndex] = updatedChecklist;
    } else {
        newChecklists = [...currentChecklists, updatedChecklist];
    }
    setAppData({ ...appData, checklists: newChecklists });
  };

  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
      setAppData({
          ...appData,
          expenses: [{ ...newExpense, id: Date.now() }, ...(appData.expenses || [])]
      });
  };

  const handleUpdateExpense = (updatedExpense: Expense) => {
      setAppData({
          ...appData,
          expenses: (appData.expenses || []).map(e => e.id === updatedExpense.id ? updatedExpense : e)
      });
  };

  const handleDeleteExpense = (id: number) => {
      setAppData({
          ...appData,
          expenses: (appData.expenses || []).filter(e => e.id !== id)
      });
  };

  const handleAddVisitLog = (newLog: Omit<VisitLog, 'id' | 'createdAt'>) => {
      setAppData({
          ...appData,
          visitLogs: [{ ...newLog, id: Date.now(), createdAt: new Date().toISOString() }, ...(appData.visitLogs || [])]
      });
  };

  const handleResetData = () => {
    if (window.confirm('Você tem certeza que deseja limpar TODOS os dados? Esta ação é irreversível e irá restaurar o aplicativo para o estado inicial.')) {
        // Clear local storage and reload
        localStorage.removeItem('E_PROJET_DATA_LOCAL');
        window.location.reload();
    }
  };

  const handleStartEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setView('new-contract');
  };
  
  const handleCreateProject = () => {
      setEditingContract(null);
      setView('new-contract');
  }

  const handleAddOtherPayment = (newPayment: Omit<OtherPayment, 'id'>) => {
    const paymentWithId: OtherPayment = { ...newPayment, id: Date.now() };
    setAppData({
        ...appData,
        otherPayments: [paymentWithId, ...appData.otherPayments]
    });
  };
  
  const handleRegisterPayment = (installmentId: number, paymentDate: Date) => {
    setAppData({
        ...appData,
        installments: appData.installments.map(inst => {
            if (inst.id === installmentId) {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0,0,0,0);
                paymentDate.setHours(0,0,0,0);
                const status = paymentDate <= dueDate ? 'Pago em dia' : 'Pago com atraso';
                return { ...inst, status, paymentDate: paymentDate };
            }
            return inst;
        })
    });
  };
  

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard 
                  installments={appData.installments}
                  contracts={appData.contracts}
                  schedules={appData.schedules}
                  projectProgress={appData.projectProgress || []}
                  otherPayments={appData.otherPayments}
                  expenses={appData.expenses || []}
                />;
      case 'contracts':
        return <Contracts 
                    contracts={appData.contracts}
                    schedules={appData.schedules}
                    clients={appData.clients}
                    onEditContract={handleStartEditContract}
                    onDeleteContract={handleDeleteContract}
                    onCreateProject={handleCreateProject}
                />;
      case 'new-contract':
        return <NewContract 
                    appData={appData} 
                    onAddContract={handleAddContract}
                    onUpdateContract={handleUpdateContract}
                    editingContract={editingContract}
                    onCancel={() => { setEditingContract(null); setView('contracts'); }}
                />;
      case 'progress':
        return <Progress 
                  schedules={appData.schedules}
                  setSchedules={(newSchedules) => setAppData({...appData, schedules: newSchedules})}
                  contracts={appData.contracts}
                />;
      case 'projections':
        return <Projections 
                  installments={appData.installments} 
                  otherPayments={appData.otherPayments}
                  contracts={appData.contracts}
                  onRegisterInstallment={handleRegisterPayment}
                  onRegisterOther={handleAddOtherPayment}
                />;
      case 'receipts':
        return <Receipts contracts={appData.contracts} installments={appData.installments} />;
      case 'reminders':
        return <Reminders 
                  reminders={appData.reminders}
                  setReminders={(newReminders) => setAppData({...appData, reminders: newReminders})}
                  clients={appData.clients}
                />;
       case 'partners':
        return <Partners 
                  partners={appData.partners}
                  clients={appData.clients}
                  onAddPartner={handleAddPartner}
                  onUpdatePartner={handleUpdatePartner}
                  onDeletePartner={handleDeletePartner}
                />;
        case 'checklist':
          return <ConstructionChecklist
                    contracts={appData.contracts}
                    checklists={appData.checklists}
                    onUpdateChecklist={handleUpdateChecklist}
                />;
        case 'expenses':
            return <Expenses
                expenses={appData.expenses || []}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
            />;
        case 'tech-visits':
            return <TechnicalVisits
                contracts={appData.contracts}
                visitLogs={appData.visitLogs || []}
                onAddVisitLog={handleAddVisitLog}
            />;
       case 'database':
        return <Database
                  appData={appData}
                  setAppData={setAppData as React.Dispatch<React.SetStateAction<AppData>>}
                  onDeleteContract={handleDeleteContract}
                  onResetData={handleResetData}
                />;
      case 'settings':
        return <Settings 
                    appData={appData}
                    setAppData={setAppData as React.Dispatch<React.SetStateAction<AppData>>}
                />;
      default:
        return <Dashboard 
                  installments={appData.installments}
                  contracts={appData.contracts}
                  schedules={appData.schedules}
                  projectProgress={appData.projectProgress || []}
                  otherPayments={appData.otherPayments}
                  expenses={appData.expenses || []}
               />;
    }
  }

  return (
    <div className="flex min-h-screen font-sans text-slate-800">
      <aside className="w-64 flex-shrink-0 bg-gray-900 text-white">
        <div className="h-full flex flex-col">
          <div className="flex items-center p-6 border-b border-gray-800">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg overflow-hidden">
                <BrandLogo className="w-full h-full text-white" />
            </div>
            <div className="ml-3 overflow-hidden">
                <h1 className="text-base font-bold text-white truncate">E-Projet</h1>
                <p className="text-xs text-slate-400 truncate">Painel de Controle</p>
            </div>
          </div>
          <nav className="mt-6 flex-1 overflow-y-auto custom-scrollbar">
            <p className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            <ul className="mt-3 space-y-1">
                <NavItem icon={<DashboardIcon className="w-5 h-5" />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                <NavItem icon={<FileTextIcon className="w-5 h-5" />} label="Projetos" isActive={view === 'contracts'} onClick={() => setView('contracts')} />
                <NavItem icon={<PlusIcon className="w-5 h-5" />} label="Novo Contrato" isActive={view === 'new-contract'} onClick={() => { setEditingContract(null); setView('new-contract'); }} />
                <NavItem icon={<TrendingUpIcon className="w-5 h-5" />} label="Progresso" isActive={view === 'progress'} onClick={() => setView('progress')} />
                <NavItem icon={<ClipboardCheckIcon className="w-5 h-5" />} label="Checklist Obra" isActive={view === 'checklist'} onClick={() => setView('checklist')} />
                <NavItem icon={<MapPinIcon className="w-5 h-5" />} label="Visitas Técnicas" isActive={view === 'tech-visits'} onClick={() => setView('tech-visits')} />
                <NavItem icon={<CashIcon className="w-5 h-5" />} label="Projeções e Recebidos" isActive={view === 'projections'} onClick={() => setView('projections')} />
                <NavItem icon={<ReceiptIcon className="w-5 h-5" />} label="Recibos" isActive={view === 'receipts'} onClick={() => setView('receipts')} />
                <NavItem icon={<BellIcon className="w-5 h-5" />} label="Lembretes" isActive={view === 'reminders'} onClick={() => setView('reminders')} />
                <NavItem icon={<CreditCardIcon className="w-5 h-5" />} label="Despesas" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                <NavItem icon={<UsersIcon className="w-5 h-5" />} label="Parceiros" isActive={view === 'partners'} onClick={() => setView('partners')} />
            </ul>
            <p className="px-6 mt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Configurações</p>
             <ul className="mt-3 space-y-1 pb-4">
                <NavItem icon={<DatabaseIcon className="w-5 h-5" />} label="Banco de Dados" isActive={view === 'database'} onClick={() => setView('database')} />
                <NavItem icon={<CogIcon className="w-5 h-5" />} label="Configurações" isActive={view === 'settings'} onClick={() => setView('settings')} />
            </ul>
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-auto bg-slate-100/80 backdrop-blur-sm">
        {renderView()}
      </main>
    </div>
  );
}
