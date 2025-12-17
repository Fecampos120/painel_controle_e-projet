
import React, { useState } from 'react';
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
  ClipboardCheckIcon, 
  CreditCardIcon, 
  BrandLogo,
  TrashIcon
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
import ConstructionChecklist from './components/ConstructionChecklist';
import Expenses from './components/Expenses';
import Auth from './components/Auth';
import { useUserData } from './hooks/useUserData';
import { auth } from './firebase';

import { AppData, Contract, Expense, VisitLog } from './types';
import { 
  CLIENTS, 
  MOCK_CONTRACTS, 
  MOCK_REMINDERS, 
  INITIAL_INSTALLMENTS, 
  MOCK_PROJECT_SCHEDULES, 
  MOCK_PROJECT_PROGRESS, 
  MOCK_SERVICE_PRICES, 
  MOCK_HOURLY_RATES, 
  MOCK_MEASUREMENT_TIERS, 
  MOCK_EXTRA_TIERS, 
  DEFAULT_PROJECT_STAGES_TEMPLATE, 
  MOCK_OTHER_PAYMENTS, 
  MOCK_PARTNERS, 
  MOCK_EXPENSES, 
  MOCK_VISIT_LOGS, 
  MOCK_FIXED_EXPENSE_TEMPLATES, 
  DEFAULT_SYSTEM_SETTINGS 
} from './constants';

type View = 'dashboard' | 'contracts' | 'new-contract' | 'progress' | 'projections' | 'receipts' | 'reminders' | 'settings' | 'database' | 'checklist' | 'expenses';

const INITIAL_DATA: AppData = {
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
    fixedExpenseTemplates: MOCK_FIXED_EXPENSE_TEMPLATES,
    visitLogs: MOCK_VISIT_LOGS,
    systemSettings: DEFAULT_SYSTEM_SETTINGS,
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

export default function App() {
  const [user, setUser] = useState<any>(null);
  const { data: appData, saveData: setAppData, loadingData } = useUserData(user, INITIAL_DATA);
  const [view, setView] = useState<View>('dashboard');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  if (!user) {
    return <Auth onLoginSuccess={(u) => setUser(u)} />;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Sincronizando dados...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (auth) auth.signOut();
    setUser(null);
  };

  const handleAddContract = (newContract: Omit<Contract, 'id'>) => {
    const contractWithId: Contract = { ...newContract, id: Date.now() };
    setAppData({
        ...appData,
        contracts: [contractWithId, ...appData.contracts],
        clients: appData.clients.some(c => c.name === contractWithId.clientName) 
            ? appData.clients 
            : [{ id: Date.now() + 1, name: contractWithId.clientName }, ...appData.clients]
    });
    setView('contracts');
  };

  const handleUpdateContract = (updatedContract: Contract) => {
    setAppData({
        ...appData,
        contracts: appData.contracts.map(c => c.id === updatedContract.id ? updatedContract : c)
    });
    setEditingContract(null);
    setView('contracts');
  };

  const handleDeleteContract = (contractId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este projeto?")) {
        setAppData({
            ...appData,
            contracts: appData.contracts.filter(c => c.id !== contractId),
            installments: appData.installments.filter(i => i.contractId !== contractId),
            schedules: appData.schedules.filter(s => s.contractId !== contractId)
        });
    }
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
                    systemSettings={appData.systemSettings}
                    onEditContract={(c) => { setEditingContract(c); setView('new-contract'); }}
                    onDeleteContract={handleDeleteContract}
                    onCreateProject={() => { setEditingContract(null); setView('new-contract'); }}
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
      case 'expenses':
        return <Expenses
                expenses={appData.expenses || []}
                fixedExpenseTemplates={appData.fixedExpenseTemplates || []}
                onAddExpense={(e) => setAppData({...appData, expenses: [{...e, id: Date.now()}, ...(appData.expenses || [])]})}
                onUpdateExpense={(e) => setAppData({...appData, expenses: appData.expenses.map(exp => exp.id === e.id ? e : exp)})}
                onDeleteExpense={(id) => setAppData({...appData, expenses: appData.expenses.filter(exp => exp.id !== id)})}
                onAddFixedExpenseTemplate={(t) => setAppData({...appData, fixedExpenseTemplates: [...(appData.fixedExpenseTemplates || []), { ...t, id: Date.now() }]})}
                onDeleteFixedExpenseTemplate={(id) => setAppData({...appData, fixedExpenseTemplates: appData.fixedExpenseTemplates?.filter(t => t.id !== id)})}
            />;
      case 'projections':
        return <Projections 
                  installments={appData.installments} 
                  otherPayments={appData.otherPayments}
                  contracts={appData.contracts}
                  onRegisterInstallment={(id, date) => setAppData({...appData, installments: appData.installments.map(i => i.id === id ? {...i, status: date <= new Date(i.dueDate) ? 'Pago em dia' : 'Pago com atraso', paymentDate: date} : i)})}
                  onRegisterOther={(desc, date, val) => setAppData({...appData, otherPayments: [{id: Date.now(), description: desc, paymentDate: date, value: val}, ...appData.otherPayments]})}
                />;
      case 'checklist':
        return <ConstructionChecklist
                    contracts={appData.contracts}
                    checklists={appData.checklists}
                    onUpdateChecklist={(c) => setAppData({...appData, checklists: appData.checklists.some(cl => cl.contractId === c.contractId) ? appData.checklists.map(cl => cl.contractId === c.contractId ? c : cl) : [...appData.checklists, c]})}
                />;
      case 'reminders':
        return <Reminders reminders={appData.reminders} setReminders={(r) => setAppData({...appData, reminders: r})} clients={appData.clients} />;
      case 'settings':
        return <Settings appData={appData} setAppData={setAppData as any} />;
      case 'database':
        return <Database appData={appData} setAppData={setAppData as any} onDeleteContract={handleDeleteContract} onResetData={() => { if(confirm("Limpar tudo?")) { localStorage.clear(); location.reload(); } }} />;
      case 'receipts':
        return <Receipts contracts={appData.contracts} installments={appData.installments} systemSettings={appData.systemSettings} />;
      default:
        return <Dashboard {...appData} />;
    }
  }

  return (
    <div className="flex min-h-screen font-sans text-slate-800 bg-slate-50">
      <aside className="w-64 flex-shrink-0 bg-gray-900 text-white hidden md:block">
        <div className="h-full flex flex-col">
          <div className="flex items-center p-6 border-b border-gray-800">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg shrink-0">
                <BrandLogo className="w-7 h-7 text-white" />
            </div>
            <div className="ml-3 overflow-hidden">
                <h1 className="text-base font-bold text-white truncate">{appData.systemSettings?.appName}</h1>
                <p className="text-xs text-slate-400">{appData.systemSettings?.professionalName}</p>
            </div>
          </div>
          <nav className="mt-6 flex-1 overflow-y-auto">
            <p className="px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Principal</p>
            <ul className="space-y-1">
                <NavItem icon={<DashboardIcon className="w-5 h-5" />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                <NavItem icon={<FileTextIcon className="w-5 h-5" />} label="Projetos" isActive={view === 'contracts'} onClick={() => setView('contracts')} />
                <NavItem icon={<TrendingUpIcon className="w-5 h-5" />} label="Andamento" isActive={view === 'progress'} onClick={() => setView('progress')} />
                <NavItem icon={<ClipboardCheckIcon className="w-5 h-5" />} label="Checklist Obra" isActive={view === 'checklist'} onClick={() => setView('checklist')} />
            </ul>
            <p className="px-6 mt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Financeiro</p>
            <ul className="space-y-1">
                <NavItem icon={<CashIcon className="w-5 h-5" />} label="Recebíveis" isActive={view === 'projections'} onClick={() => setView('projections')} />
                <NavItem icon={<CreditCardIcon className="w-5 h-5" />} label="Despesas" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                <NavItem icon={<ReceiptIcon className="w-5 h-5" />} label="Recibos" isActive={view === 'receipts'} onClick={() => setView('receipts')} />
            </ul>
            <p className="px-6 mt-6 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Suporte</p>
            <ul className="space-y-1">
                <NavItem icon={<BellIcon className="w-5 h-5" />} label="Lembretes" isActive={view === 'reminders'} onClick={() => setView('reminders')} />
                <NavItem icon={<DatabaseIcon className="w-5 h-5" />} label="Banco de Dados" isActive={view === 'database'} onClick={() => setView('database')} />
                <NavItem icon={<CogIcon className="w-5 h-5" />} label="Configurações" isActive={view === 'settings'} onClick={() => setView('settings')} />
            </ul>
          </nav>
          
          <div className="p-4 bg-gray-950 border-t border-gray-800">
            <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.displayName || 'Usuário'}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-3 py-2 text-xs font-semibold bg-red-600/10 text-red-500 rounded-md hover:bg-red-600/20 transition-colors"
            >
                <TrashIcon className="w-4 h-4 mr-2" /> Sair da Conta
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        {renderView()}
      </main>
    </div>
  );
}
