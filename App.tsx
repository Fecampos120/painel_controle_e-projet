
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Contracts from './components/Contracts';
import NewContract from './components/NewContract';
import Progress from './components/Progress';
import Projections from './components/Projections';
import Receipts from './components/Receipts';
import Settings from './components/Settings';
import Database from './components/Database';
import ProjectPortal from './components/ProjectPortal';
import Expenses from './components/Expenses';
import Notes from './components/Notes';
import Pricing from './components/Pricing';
import Budgets from './components/Budgets';
import Auth from './components/Auth';
import TechnicalVisits from './components/TechnicalVisits';
import { useUserData } from './hooks/useUserData';

import { 
    DashboardIcon, 
    FileTextIcon, 
    MoneyBagIcon, 
    TrendingUpIcon, 
    NotepadIcon,
    CogIcon,
    CreditCardIcon,
    ReceiptIcon,
    WalletIcon,
    BrandLogo,
    UsersIcon,
    HistoryIcon
} from './components/Icons';

import { AppData, Contract, Budget, PaymentInstallment, ProjectSchedule, ProjectStage, Meeting, ProjectUpdate, VisitLog } from './types';
import { 
  MOCK_FIXED_EXPENSE_TEMPLATES, 
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_PRICING_MODEL,
  INITIAL_SERVICE_PRICES,
  INITIAL_HOURLY_RATES,
  INITIAL_MEASUREMENT_TIERS,
  INITIAL_PROJECT_STAGES_TEMPLATE
} from './constants';

type View = 'dashboard' | 'budgets' | 'contracts' | 'new-contract' | 'client-area' | 'pricing' | 'progress' | 'projections' | 'expenses' | 'notes' | 'settings' | 'project-portal' | 'receipts' | 'tech-visits';

const INITIAL_DATA: AppData = {
    clients: [],
    contracts: [],
    budgets: [],
    reminders: [],
    installments: [],
    schedules: [],
    servicePrices: INITIAL_SERVICE_PRICES,
    hourlyRates: INITIAL_HOURLY_RATES,
    measurementTiers: INITIAL_MEASUREMENT_TIERS,
    extraTiers: [],
    projectProgress: [],
    projectStagesTemplate: INITIAL_PROJECT_STAGES_TEMPLATE,
    otherPayments: [],
    partners: [],
    checklists: [],
    expenses: [],
    fixedExpenseTemplates: MOCK_FIXED_EXPENSE_TEMPLATES,
    visitLogs: [],
    notes: [],
    systemSettings: DEFAULT_SYSTEM_SETTINGS,
    pricing: INITIAL_PRICING_MODEL,
    meetings: [],
    projectUpdates: [],
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <li 
      className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${isActive ? 'bg-blue-600 shadow-md text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`} 
      onClick={onClick}
    >
        <div className={`mr-3 transition-transform ${isActive ? 'scale-100 opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
        </div>
        <span className="text-sm font-medium tracking-tight">
          {label}
        </span>
    </li>
);

const App: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { data: appData, saveData: setAppData, loadingData } = useUserData(user, INITIAL_DATA);
    const [view, setView] = useState<View>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [budgetToConvert, setBudgetToConvert] = useState<Budget | null>(null);

    if (!user) {
        return <Auth onLoginSuccess={setUser} />;
    }

    if (loadingData) {
        return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white font-bold">Carregando Estúdio...</div>;
    }

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard installments={appData.installments} contracts={appData.contracts} schedules={appData.schedules} projectProgress={appData.projectProgress || []} otherPayments={appData.otherPayments} expenses={appData.expenses || []} />;
            case 'budgets':
                return <Budgets budgets={appData.budgets} onAddBudget={() => {setBudgetToConvert(null); setEditingContract(null); setView('new-contract')}} onDeleteBudget={(id) => setAppData({...appData, budgets: appData.budgets.filter(b => b.id !== id)})} onApproveBudget={(b) => {setBudgetToConvert(b); setEditingContract(null); setView('new-contract')}} />;
            case 'contracts':
                return <Contracts contracts={appData.contracts} schedules={appData.schedules} clients={appData.clients} systemSettings={appData.systemSettings} onEditContract={(c) => {setEditingContract(c); setBudgetToConvert(null); setView('new-contract')}} onDeleteContract={(id) => setAppData({...appData, contracts: appData.contracts.filter(c => c.id !== id)})} onCreateProject={() => {setEditingContract(null); setBudgetToConvert(null); setView('new-contract')}} onViewPortal={(id) => {setSelectedProjectId(id); setView('project-portal')}} />;
            case 'new-contract':
                return <NewContract 
                            appData={appData}
                            editingContract={editingContract}
                            budgetToConvert={budgetToConvert}
                            onCancel={() => setView(budgetToConvert ? 'budgets' : 'contracts')}
                            onAddBudgetOnly={(b) => {setAppData({...appData, budgets: [...(appData.budgets || []), { ...b, id: Date.now(), createdAt: new Date(), lastContactDate: new Date(), status: 'Aberto' }]}); setView('budgets');}}
                            onAddContract={(c) => {
                                const id = Date.now();
                                const schedule: ProjectSchedule = { id: Date.now() + 500, contractId: id, clientName: c.clientName, projectName: c.projectName, startDate: new Date(c.date).toISOString().split('T')[0], stages: appData.projectStagesTemplate.map(t => ({ id: Date.now() + t.id, name: t.name, durationWorkDays: t.durationWorkDays })) };
                                setAppData({...appData, contracts: [...appData.contracts, { ...c, id }] as Contract[], schedules: [...appData.schedules, schedule]});
                                setView('contracts');
                            }}
                            onUpdateContract={(c) => {
                                setAppData({...appData, contracts: appData.contracts.map(contract => contract.id === c.id ? c : contract)});
                                setView('contracts');
                            }}
                        />;
            case 'client-area':
                const activeProjects = appData.contracts.filter(c => c.status === 'Ativo');
                return (
                    <div className="space-y-8">
                        <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                            <h1 className="text-3xl font-bold uppercase tracking-tight">Área do Cliente</h1>
                            <p className="text-blue-100 opacity-90">Portais individuais de acompanhamento por projeto.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeProjects.map(project => (
                                <div key={project.id} onClick={() => { setSelectedProjectId(project.id); setView('project-portal'); }} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-blue-500 cursor-pointer group transition-all">
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{project.projectName}</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{project.clientName}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'project-portal':
                const portalContract = appData.contracts.find(c => c.id === selectedProjectId);
                return portalContract ? (
                    <ProjectPortal 
                        contract={portalContract}
                        schedule={appData.schedules.find(s => s.contractId === selectedProjectId)}
                        checklist={appData.checklists.find(c => c.contractId === selectedProjectId) || { contractId: selectedProjectId!, completedItemIds: [] }}
                        installments={appData.installments.filter(i => i.contractId === selectedProjectId)}
                        meetings={appData.meetings.filter(m => m.contractId === selectedProjectId)}
                        updates={appData.projectUpdates.filter(u => u.contractId === selectedProjectId)}
                        visitLogs={appData.visitLogs.filter(v => v.contractId === selectedProjectId)}
                        onAddVisitLog={(v) => setAppData({...appData, visitLogs: [...appData.visitLogs, { ...v, id: Date.now() }]})}
                        onBack={() => setView('contracts')}
                    />
                ) : null;
            case 'pricing':
                return <Pricing expenses={appData.expenses} pricingData={appData.pricing} onUpdatePricing={(p) => setAppData({...appData, pricing: p})} />;
            case 'progress':
                return <Progress schedules={appData.schedules} setSchedules={(s) => setAppData({...appData, schedules: s})} contracts={appData.contracts} />;
            case 'projections':
                return <Projections installments={appData.installments} otherPayments={appData.otherPayments} contracts={appData.contracts} onRegisterInstallment={(id, date) => setAppData({...appData, installments: appData.installments.map(i => i.id === id ? {...i, status: 'Pago em dia', paymentDate: date} : i)})} onRegisterOther={(desc, date, val) => setAppData({...appData, otherPayments: [...appData.otherPayments, {id: Date.now(), description: desc, paymentDate: date, value: val}]})} />;
            case 'expenses':
                return <Expenses expenses={appData.expenses} fixedExpenseTemplates={appData.fixedExpenseTemplates} onAddExpense={(e) => setAppData({...appData, expenses: [...appData.expenses, {...e, id: Date.now()}]})} onDeleteExpense={(id) => setAppData({...appData, expenses: appData.expenses.filter(e => e.id !== id)})} onUpdateExpense={(e) => setAppData({...appData, expenses: appData.expenses.map(exp => exp.id === e.id ? e : exp)})} onAddFixedExpenseTemplate={(t) => setAppData({...appData, fixedExpenseTemplates: [...appData.fixedExpenseTemplates, {...t, id: Date.now()}]})} onDeleteFixedExpenseTemplate={(id) => setAppData({...appData, fixedExpenseTemplates: appData.fixedExpenseTemplates.filter(t => t.id !== id)})} />;
            case 'notes':
                return <Notes notes={appData.notes} onUpdateNote={(n) => setAppData({...appData, notes: appData.notes.map(note => note.id === n.id ? n : note)})} onDeleteNote={(id) => setAppData({...appData, notes: appData.notes.filter(n => n.id !== id)})} onAddNote={(n) => setAppData({...appData, notes: [...appData.notes, {...n, id: Date.now(), createdAt: new Date()}]})} contracts={appData.contracts} />;
            case 'settings':
                return <Settings appData={appData} setAppData={setAppData} />;
            default:
                return <Dashboard installments={appData.installments} contracts={appData.contracts} schedules={appData.schedules} projectProgress={appData.projectProgress || []} otherPayments={appData.otherPayments} expenses={appData.expenses || []} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f1f5f9]">
            {/* Sidebar Replicada da Imagem */}
            <aside className="w-64 bg-[#0f172a] flex-shrink-0 flex flex-col no-print shadow-2xl z-40">
                <div className="p-8 border-b border-slate-800/50 flex flex-col items-center">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <BrandLogo className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">{appData.systemSettings.appName}</h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <NavItem icon={<DashboardIcon />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                    <NavItem icon={<WalletIcon />} label="Orçamentos" isActive={view === 'budgets'} onClick={() => setView('budgets')} />
                    <NavItem icon={<FileTextIcon />} label="Projetos" isActive={view === 'contracts'} onClick={() => setView('contracts')} />
                    <NavItem icon={<UsersIcon />} label="Área Cliente" isActive={view === 'client-area' || view === 'project-portal'} onClick={() => setView('client-area')} />
                    <NavItem icon={<MoneyBagIcon />} label="Precificação" isActive={view === 'pricing'} onClick={() => setView('pricing')} />
                    <NavItem icon={<TrendingUpIcon />} label="Andamento" isActive={view === 'progress'} onClick={() => setView('progress')} />
                    <NavItem icon={<ReceiptIcon />} label="Financeiro" isActive={view === 'projections'} onClick={() => setView('projections')} />
                    <NavItem icon={<CreditCardIcon />} label="Despesas" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                    <NavItem icon={<NotepadIcon />} label="Notas" isActive={view === 'notes'} onClick={() => setView('notes')} />
                    <NavItem icon={<CogIcon />} label="Ajustes" isActive={view === 'settings'} onClick={() => setView('settings')} />
                </nav>
                <div className="p-4 border-t border-slate-800/50">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Studio Battelli v2.5</p>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-10 bg-[#f1f5f9]">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
