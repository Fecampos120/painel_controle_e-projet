import React, { useState, useMemo, useEffect } from 'react';
import { 
  DashboardIcon, 
  BellIcon, 
  FileTextIcon, 
  PlusIcon, 
  TrendingUpIcon, 
  CogIcon,
  WalletIcon,
  ReceiptIcon,
  CashIcon,
  DatabaseIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ClipboardCheckIcon,
} from './components/Icons';
import Dashboard from './components/Dashboard';
import Reminders from './components/Reminders';
import Contracts from './components/Contracts';
import NewContract from './components/NewContract';
import Progress from './components/Progress';
import Settings from './components/Settings';
import Receipts from './components/Receipts';
import Projections from './components/Projections';
import LatePayments from './components/LatePayments';
import MonthlyRevenueChart from './components/MonthlyRevenueChart';
import Database from './components/Database';
import Partners from './components/Partners';
import ConstructionChecklist from './components/ConstructionChecklist';
import { AppData, PaymentInstallment, Contract, OtherPayment, Client, Partner, ProjectStageTemplateItem, ProjectSchedule, ProjectStage, ProjectProgress, StageProgress, ProjectChecklist } from './types';
import { CLIENTS, MOCK_CONTRACTS, MOCK_REMINDERS, INITIAL_INSTALLMENTS, MOCK_PROJECT_SCHEDULES, MOCK_PROJECT_PROGRESS, MOCK_SERVICE_PRICES, MOCK_HOURLY_RATES, MOCK_MEASUREMENT_TIERS, MOCK_EXTRA_TIERS, DEFAULT_PROJECT_STAGES_TEMPLATE, MOCK_OTHER_PAYMENTS, MOCK_PARTNERS, GANTT_STAGES_CONFIG } from './constants';


type View = 'dashboard' | 'contracts' | 'new-contract' | 'progress' | 'projections' | 'receipts' | 'reminders' | 'settings' | 'database' | 'late-payments' | 'partners' | 'checklist';

const APP_DATA_STORAGE_KEY = 'architect_app_data';

const getInitialData = (): AppData => ({
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
});

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

// Helper to calculate business days
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

// Helper to generate project schedule stages
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

// Helper to generate project progress from a schedule
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

// Recalculates all stage dates based on dependencies, preserving completion status.
const recalculateScheduleStages = (stages: ProjectStage[], projectStartDate: string): ProjectStage[] => {
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
};


// Main function to generate all dependent data for a new contract
const generateDependentData = (contract: Contract, projectStagesTemplate: ProjectStageTemplateItem[]) => {
    // 1. Generate Installments
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
            status: 'Pendente', // Alterado para Pendente conforme solicitação
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

    // 2. Generate Schedule
    const newSchedule: ProjectSchedule = {
        id: Date.now(),
        contractId: contract.id,
        clientName: contract.clientName,
        projectName: contract.projectName,
        startDate: new Date(contract.date).toISOString().split('T')[0],
        stages: createScheduleStages(projectStagesTemplate, new Date(contract.date).toISOString()),
    };

    // 3. Generate Progress
    const newProgress = generateProjectProgressFromSchedule(newSchedule);

    return { newInstallments, newSchedule, newProgress };
};


export default function App() {
  const [appData, setAppData] = useState<AppData>(() => {
    try {
        const dataJson = localStorage.getItem(APP_DATA_STORAGE_KEY);
        return dataJson ? JSON.parse(dataJson) : getInitialData();
    } catch (error) {
        console.error("Error reading app data from localStorage", error);
        return getInitialData();
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData));
    } catch (error) {
        console.error("Error saving app data to localStorage", error);
    }
  }, [appData]);

  const [view, setView] = useState<View>('contracts');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const handleAddContract = (newContract: Omit<Contract, 'id'>) => {
    const contractWithId: Contract = {
        ...newContract,
        id: Date.now(),
    };

    const { newInstallments, newSchedule, newProgress } = generateDependentData(contractWithId, appData.projectStagesTemplate);

    setAppData(prev => ({
        ...prev,
        contracts: [contractWithId, ...prev.contracts],
        installments: [...newInstallments, ...prev.installments],
        schedules: [newSchedule, ...prev.schedules],
        projectProgress: [newProgress, ...(prev.projectProgress || [])],
        clients: prev.clients.some(c => c.name === contractWithId.clientName) 
            ? prev.clients 
            : [{ id: Date.now() + 1, name: contractWithId.clientName }, ...prev.clients]
    }));
    setView('contracts');
  };
  
  const handleUpdateContract = (updatedContract: Contract) => {
    // Regenerate installments based on new contract data.
    const newInstallments: PaymentInstallment[] = [];
    if (updatedContract.downPayment > 0) {
        // Check if there was an existing down payment installment that was paid
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
            status: isPaid ? existingDownPayment.status : 'Pendente', // Keep status if paid, otherwise pending
            paymentDate: isPaid ? existingDownPayment.paymentDate : undefined,
        });
    }

    if (updatedContract.installments > 0 && updatedContract.firstInstallmentDate) {
        const firstDate = new Date(updatedContract.firstInstallmentDate);
        // Preserve status of existing installments if possible (simplified logic: regenerate pending ones mostly)
        // For simplicity in this update logic, we regenerate but could check previous IDs if needed. 
        // Here we will reset installments to match new contract terms.
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

    // Find the existing schedule to preserve its stage data (like completion status).
    const existingSchedule = appData.schedules.find(s => s.contractId === updatedContract.id);
    
    // If a schedule exists, use its stages as the base. Otherwise, create from template.
    // This ensures we don't lose progress.
    const baseStages = existingSchedule 
        ? existingSchedule.stages 
        : createScheduleStages(appData.projectStagesTemplate, new Date(updatedContract.date).toISOString());
    
    // Recalculate dates based on the contract's start date, preserving completion data.
    const updatedStages = recalculateScheduleStages(baseStages, new Date(updatedContract.date).toISOString().split('T')[0]);

    const newSchedule: ProjectSchedule = {
        id: existingSchedule ? existingSchedule.id : Date.now(), // Preserve ID if it exists
        contractId: updatedContract.id,
        clientName: updatedContract.clientName,
        projectName: updatedContract.projectName,
        startDate: new Date(updatedContract.date).toISOString().split('T')[0],
        stages: updatedStages,
    };

    // Regenerate the high-level progress view from the updated, detailed schedule.
    const newProgress = generateProjectProgressFromSchedule(newSchedule);
    
    setAppData(prev => ({
        ...prev,
        contracts: prev.contracts.map(c => c.id === updatedContract.id ? updatedContract : c),
        installments: [
            ...prev.installments.filter(i => i.contractId !== updatedContract.id),
            ...newInstallments
        ],
        schedules: [
            ...prev.schedules.filter(s => s.contractId !== updatedContract.id),
            newSchedule
        ],
        projectProgress: [
            ...(prev.projectProgress || []).filter(p => p.contractId !== updatedContract.id),
            newProgress
        ],
    }));
    setEditingContract(null);
    setView('contracts');
  };

  const handleDeleteContract = (contractId: number) => {
    setAppData(prev => ({
        ...prev,
        contracts: prev.contracts.filter(c => c.id !== contractId),
        installments: prev.installments.filter(i => i.contractId !== contractId),
        schedules: prev.schedules.filter(s => s.contractId !== contractId),
        projectProgress: prev.projectProgress?.filter(p => p.contractId !== contractId),
    }));
  };
  
  const handleAddPartner = (newPartner: Omit<Partner, 'id'>) => {
    setAppData(prev => ({
        ...prev,
        partners: [{ ...newPartner, id: Date.now() }, ...prev.partners]
    }));
  };

  const handleUpdatePartner = (updatedPartner: Partner) => {
    setAppData(prev => ({
        ...prev,
        partners: prev.partners.map(p => p.id === updatedPartner.id ? updatedPartner : p)
    }));
  };

  const handleDeletePartner = (partnerId: number) => {
    setAppData(prev => ({
        ...prev,
        partners: prev.partners.filter(p => p.id !== partnerId)
    }));
  };

  const handleUpdateChecklist = (updatedChecklist: ProjectChecklist) => {
    setAppData(prev => {
        const existingIndex = prev.checklists.findIndex(c => c.contractId === updatedChecklist.contractId);
        if (existingIndex >= 0) {
            const newChecklists = [...prev.checklists];
            newChecklists[existingIndex] = updatedChecklist;
            return { ...prev, checklists: newChecklists };
        } else {
            return { ...prev, checklists: [...prev.checklists, updatedChecklist] };
        }
    });
  };


  const handleResetData = () => {
    if (window.confirm('Você tem certeza que deseja limpar TODOS os dados? Esta ação é irreversível e irá restaurar o aplicativo para o estado inicial.')) {
        setAppData(getInitialData());
        alert('Banco de dados limpo com sucesso!');
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
    const paymentWithId: OtherPayment = {
        ...newPayment,
        id: Date.now(),
    };
    setAppData(prev => ({
        ...prev,
        otherPayments: [paymentWithId, ...prev.otherPayments]
    }));
  };


  const monthlyRevenue = useMemo(() => {
    const monthlyData = Array(12).fill(0).map((_, i) => ({
      name: new Date(0, i).toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
      value: 0,
    }));
    
    const currentYear = new Date().getFullYear();

    appData.installments.forEach((installment: PaymentInstallment) => {
        if (installment.status !== 'Pendente' && installment.paymentDate) {
            const paymentDate = new Date(installment.paymentDate);
            if (paymentDate.getFullYear() === currentYear) {
                const monthIndex = paymentDate.getMonth();
                monthlyData[monthIndex].value += installment.value;
            }
        }
    });

    appData.otherPayments.forEach((payment: OtherPayment) => {
        const paymentDate = new Date(payment.paymentDate);
        if (paymentDate.getFullYear() === currentYear) {
            const monthIndex = paymentDate.getMonth();
            monthlyData[monthIndex].value += payment.value;
        }
    });

    return monthlyData;
  }, [appData.installments, appData.otherPayments]);

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard 
                  installments={appData.installments}
                  setInstallments={(newInstallments) => setAppData(prev => ({...prev, installments: newInstallments}))}
                  contracts={appData.contracts}
                  schedules={appData.schedules}
                  projectProgress={appData.projectProgress || []}
                  otherPayments={appData.otherPayments}
                  onAddOtherPayment={handleAddOtherPayment}
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
                  setSchedules={(newSchedules) => setAppData(prev => ({...prev, schedules: newSchedules}))}
                  contracts={appData.contracts}
                />;
      case 'projections':
        return <Projections installments={appData.installments} otherPayments={appData.otherPayments} />;
      case 'late-payments':
        return <LatePayments installments={appData.installments} />;
      case 'receipts':
        return <Receipts contracts={appData.contracts} installments={appData.installments} />;
      case 'reminders':
        return <Reminders 
                  reminders={appData.reminders}
                  setReminders={(newReminders) => setAppData(prev => ({...prev, reminders: newReminders}))}
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
                  setInstallments={(newInstallments) => setAppData(prev => ({...prev, installments: newInstallments}))}
                  contracts={appData.contracts}
                  schedules={appData.schedules}
                  projectProgress={appData.projectProgress || []}
                  otherPayments={appData.otherPayments}
                  onAddOtherPayment={handleAddOtherPayment}
               />;
    }
  }

  return (
    <div className="flex min-h-screen font-sans text-slate-800">
      <aside className="w-64 flex-shrink-0 bg-gray-900 text-white">
        <div className="h-full flex flex-col">
          <div className="flex items-center p-6 border-b border-gray-800">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <WalletIcon className="w-6 h-6 text-white" />
            </div>
            <div className="ml-3">
                <h1 className="text-base font-bold text-white">E-Projet</h1>
                <p className="text-xs text-slate-400">Bem-vindo(a)!</p>
            </div>
          </div>
          <nav className="mt-6 flex-1">
            <p className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            <ul className="mt-3 space-y-1">
                <NavItem
                  icon={<DashboardIcon className="w-5 h-5" />}
                  label="Dashboard"
                  isActive={view === 'dashboard'}
                  onClick={() => setView('dashboard')}
                />
                <NavItem
                  icon={<FileTextIcon className="w-5 h-5" />}
                  label="Projetos"
                  isActive={view === 'contracts'}
                  onClick={() => setView('contracts')}
                />
                <NavItem
                  icon={<PlusIcon className="w-5 h-5" />}
                  label="Novo Contrato"
                  isActive={view === 'new-contract'}
                  onClick={() => {
                    setEditingContract(null);
                    setView('new-contract');
                  }}
                />
                <NavItem
                  icon={<TrendingUpIcon className="w-5 h-5" />}
                  label="Progresso"
                  isActive={view === 'progress'}
                  onClick={() => setView('progress')}
                />
                <NavItem
                  icon={<ClipboardCheckIcon className="w-5 h-5" />}
                  label="Checklist Obra"
                  isActive={view === 'checklist'}
                  onClick={() => setView('checklist')}
                />
                <NavItem
                  icon={<CashIcon className="w-5 h-5" />}
                  label="Projeções e Recebidos"
                  isActive={view === 'projections'}
                  onClick={() => setView('projections')}
                />
                 <NavItem
                  icon={<ExclamationTriangleIcon className="w-5 h-5" />}
                  label="Parcelas Atrasadas"
                  isActive={view === 'late-payments'}
                  onClick={() => setView('late-payments')}
                />
                 <NavItem
                  icon={<ReceiptIcon className="w-5 h-5" />}
                  label="Recibos"
                  isActive={view === 'receipts'}
                  onClick={() => setView('receipts')}
                />
                <NavItem
                  icon={<BellIcon className="w-5 h-5" />}
                  label="Lembretes"
                  isActive={view === 'reminders'}
                  onClick={() => setView('reminders')}
                />
                 <NavItem
                  icon={<UsersIcon className="w-5 h-5" />}
                  label="Parceiros"
                  isActive={view === 'partners'}
                  onClick={() => setView('partners')}
                />
            </ul>
            <p className="px-6 mt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Configurações</p>
             <ul className="mt-3 space-y-1">
                <NavItem
                  icon={<DatabaseIcon className="w-5 h-5" />}
                  label="Banco de Dados"
                  isActive={view === 'database'}
                  onClick={() => setView('database')}
                />
                <NavItem
                  icon={<CogIcon className="w-5 h-5" />}
                  label="Configurações"
                  isActive={view === 'settings'}
                  onClick={() => setView('settings')}
                />
            </ul>
          </nav>

          <div className="p-4 mt-auto border-t border-gray-800">
              <MonthlyRevenueChart data={monthlyRevenue} />
          </div>

        </div>
      </aside>

      <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-auto bg-slate-100/80 backdrop-blur-sm">
        {renderView()}
      </main>
    </div>
  );
}