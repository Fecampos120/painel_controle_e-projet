
import React, { useState, useEffect } from 'react';
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
import ConstructionChecklist from './components/ConstructionChecklist';
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
    ArchitectIcon,
    CheckCircleIcon
} from './components/Icons';

import { AppData, Contract, Budget, PaymentInstallment, ProjectSchedule, ProjectChecklist, ThemeSettings } from './types';
import { 
  MOCK_FIXED_EXPENSE_TEMPLATES, 
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_PRICING_MODEL,
  INITIAL_SERVICE_PRICES,
  INITIAL_HOURLY_RATES,
  INITIAL_MEASUREMENT_TIERS,
} from './constants';

type View = 'dashboard' | 'budgets' | 'contracts' | 'new-contract' | 'client-area' | 'pricing' | 'progress' | 'projections' | 'expenses' | 'notes' | 'settings' | 'project-portal' | 'receipts' | 'tech-visits' | 'construction-checklist';

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
      className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${isActive ? 'bg-[var(--primary-color)] shadow-md text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`} 
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

    // EFEITO DE TEMA: Aplica as cores e fontes customizadas no ROOT do sistema
    useEffect(() => {
        if (!appData.systemSettings.theme) return;
        const root = document.documentElement;
        const theme = appData.systemSettings.theme;
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--sidebar-color', theme.sidebarColor);
        root.style.setProperty('--bg-color', theme.backgroundColor);
        root.style.setProperty('--font-main', theme.fontFamily);
        root.style.setProperty('--border-radius', theme.borderRadius);
        
        // Atualiza a fonte global no body
        document.body.style.fontFamily = theme.fontFamily;
        document.body.style.backgroundColor = theme.backgroundColor;
    }, [appData.systemSettings.theme]);

    if (!user) {
        return <Auth onLoginSuccess={setUser} />;
    }

    if (loadingData) {
        return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white font-bold">Carregando Estúdio...</div>;
    }

    const handleUpdateChecklist = (newChecklist: ProjectChecklist) => {
        setAppData(prev => {
            const checklists = [...(prev.checklists || [])];
            const index = checklists.findIndex(c => c.contractId === newChecklist.contractId);
            if (index > -1) checklists[index] = newChecklist;
            else checklists.push(newChecklist);
            return { ...prev, checklists };
        });
    };

    const renderView = () => {
        switch (view) {
            case 'dashboard':
                return <Dashboard installments={appData.installments} contracts={appData.contracts} schedules={appData.schedules} projectProgress={[]} otherPayments={appData.otherPayments} expenses={appData.expenses || []} />;
            case 'budgets':
                return <Budgets budgets={appData.budgets} onAddBudget={() => {setBudgetToConvert(null); setEditingContract(null); setView('new-contract')}} onDeleteBudget={(id) => setAppData(prev => ({...prev, budgets: prev.budgets.filter(b => b.id !== id)}))} onApproveBudget={(b) => {setBudgetToConvert(b); setEditingContract(null); setView('new-contract')}} />;
            case 'contracts':
                return <Contracts contracts={appData.contracts} schedules={appData.schedules} clients={appData.clients} systemSettings={appData.systemSettings} onEditContract={(c) => {setEditingContract(c); setBudgetToConvert(null); setView('new-contract')}} onDeleteContract={(id) => setAppData(prev => ({...prev, contracts: prev.contracts.filter(c => c.id !== id)}))} onCreateProject={() => {setEditingContract(null); setBudgetToConvert(null); setView('new-contract')}} onViewPortal={(id) => {setSelectedProjectId(id); setView('project-portal')}} />;
            case 'new-contract':
                return <NewContract 
                            appData={appData}
                            editingContract={editingContract}
                            budgetToConvert={budgetToConvert}
                            onCancel={() => setView(budgetToConvert ? 'budgets' : 'contracts')}
                            onAddBudgetOnly={(b) => {setAppData(prev => ({...prev, budgets: [...(prev.budgets || []), { ...b, id: Date.now(), createdAt: new Date(), lastContactDate: new Date(), status: 'Aberto' }]})); setView('budgets');}}
                            onAddContract={(c) => {
                                const contractId = Date.now();
                                // USA OS MODELOS CUSTOMIZADOS DE FASES
                                const schedule: ProjectSchedule = { 
                                    id: Date.now() + 500, 
                                    contractId, 
                                    clientName: c.clientName, 
                                    projectName: c.projectName, 
                                    startDate: new Date(c.date).toISOString().split('T')[0], 
                                    stages: appData.systemSettings.projectStagesTemplate.map(t => ({ 
                                        id: Math.random() * 100000, 
                                        name: t.name, 
                                        durationWorkDays: t.durationWorkDays 
                                    })) 
                                };
                                
                                // USA OS MODELOS CUSTOMIZADOS DE CHECKLIST
                                const initialChecklist: ProjectChecklist = {
                                    contractId,
                                    items: appData.systemSettings.checklistTemplate.map(t => ({
                                        id: Math.random() * 100000,
                                        text: t.text,
                                        stage: t.stage,
                                        completed: false
                                    }))
                                };

                                const newInstallments: PaymentInstallment[] = [];
                                if (c.downPayment > 0) {
                                    newInstallments.push({ id: Date.now() + 1000, contractId, clientName: c.clientName, projectName: c.projectName, installment: 'Entrada', dueDate: new Date(c.downPaymentDate), value: c.downPayment, status: 'Pendente' });
                                }
                                if (c.installments > 0) {
                                    const baseDate = c.firstInstallmentDate ? new Date(c.firstInstallmentDate) : new Date(c.downPaymentDate);
                                    if (!c.firstInstallmentDate) baseDate.setMonth(baseDate.getMonth() + 1);
                                    for (let i = 1; i <= c.installments; i++) {
                                        const dueDate = new Date(baseDate);
                                        dueDate.setMonth(dueDate.getMonth() + (i - 1));
                                        newInstallments.push({ id: Date.now() + 2000 + i, contractId, clientName: c.clientName, projectName: c.projectName, installment: `${i}/${c.installments}`, dueDate: dueDate, value: c.installmentValue, status: 'Pendente' });
                                    }
                                }
                                setAppData(prev => ({
                                    ...prev, 
                                    contracts: [...prev.contracts, { ...c, id: contractId }] as Contract[], 
                                    schedules: [...prev.schedules, schedule],
                                    installments: [...prev.installments, ...newInstallments],
                                    checklists: [...(prev.checklists || []), initialChecklist],
                                    budgets: budgetToConvert ? prev.budgets.filter(b => b.id !== budgetToConvert.id) : prev.budgets
                                }));
                                setView('contracts');
                            }}
                            onUpdateContract={(c) => {
                                setAppData(prev => ({...prev, contracts: prev.contracts.map(contract => contract.id === c.id ? c : contract)}));
                                setView('contracts');
                            }}
                        />;
            case 'client-area':
                const activeProjects = appData.contracts.filter(c => c.status === 'Ativo');
                return (
                    <div className="space-y-8">
                        <header className="bg-[var(--primary-color)] text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                            <h1 className="text-3xl font-bold uppercase tracking-tight">Área do Cliente</h1>
                            <p className="text-blue-100 opacity-90">Portais individuais de acompanhamento por projeto.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeProjects.map(project => (
                                <div key={project.id} onClick={() => { setSelectedProjectId(project.id); setView('project-portal'); }} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-[var(--primary-color)] cursor-pointer group transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[var(--primary-color)] group-hover:bg-[var(--primary-color)] group-hover:text-white transition-all">
                                            <ArchitectIcon className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-[var(--primary-color)] transition-colors">{project.projectName}</h3>
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
                        checklist={appData.checklists.find(c => c.contractId === selectedProjectId) || { contractId: selectedProjectId!, items: [] }}
                        installments={appData.installments.filter(i => i.contractId === selectedProjectId)}
                        notes={appData.notes.filter(n => n.contractId === selectedProjectId)}
                        updates={appData.projectUpdates.filter(u => u.contractId === selectedProjectId)}
                        visitLogs={appData.visitLogs.filter(v => v.contractId === selectedProjectId)}
                        onAddVisitLog={(v) => setAppData(prev => ({...prev, visitLogs: [...prev.visitLogs, { ...v, id: Date.now() }]}))}
                        onAddProjectUpdate={(u) => setAppData(prev => ({...prev, projectUpdates: [...prev.projectUpdates, { ...u, id: Date.now() }]}))}
                        onUpdateChecklist={handleUpdateChecklist}
                        onBack={() => setView('client-area')}
                    />
                ) : null;
            case 'pricing':
                return <Pricing expenses={appData.expenses} pricingData={appData.pricing} onUpdatePricing={(p) => setAppData(prev => ({...prev, pricing: p}))} />;
            case 'progress':
                return <Progress schedules={appData.schedules} setSchedules={(s) => setAppData(prev => ({...prev, schedules: s}))} contracts={appData.contracts} />;
            case 'projections':
                return <Projections installments={appData.installments} otherPayments={appData.otherPayments} contracts={appData.contracts} onRegisterInstallment={(id, date) => setAppData(prev => ({...prev, installments: prev.installments.map(i => i.id === id ? {...i, status: 'Pago em dia', paymentDate: date} : i)}))} onRegisterOther={(desc, date, val) => setAppData(prev => ({...prev, otherPayments: [...prev.otherPayments, {id: Date.now(), description: desc, paymentDate: date, value: val}]}))} />;
            case 'expenses':
                return <Expenses 
                    expenses={appData.expenses} 
                    fixedExpenseTemplates={appData.fixedExpenseTemplates} 
                    onAddExpense={(e) => setAppData(prev => ({...prev, expenses: [...prev.expenses, {...e, id: Date.now() + Math.random()}]}))} 
                    onDeleteExpense={(id) => setAppData(prev => ({...prev, expenses: prev.expenses.filter(e => e.id !== id)}))} 
                    onUpdateExpense={(e) => setAppData(prev => ({...prev, expenses: prev.expenses.map(exp => exp.id === e.id ? e : exp)}))} 
                    onAddFixedExpenseTemplate={(t) => setAppData(prev => ({...prev, fixedExpenseTemplates: [...prev.fixedExpenseTemplates, {...t, id: Date.now() + Math.random()}]}))} 
                    onDeleteFixedExpenseTemplate={(id) => setAppData(prev => ({...prev, fixedExpenseTemplates: prev.fixedExpenseTemplates.filter(t => t.id !== id)}))} 
                />;
            case 'notes':
                return <Notes notes={appData.notes} onUpdateNote={(n) => setAppData(prev => ({...prev, notes: prev.notes.map(note => note.id === n.id ? n : note)}))} onDeleteNote={(id) => setAppData(prev => ({...prev, notes: prev.notes.filter(n => n.id !== id)}))} onAddNote={(n) => setAppData(prev => ({...prev, notes: [...prev.notes, {...n, id: Date.now(), createdAt: new Date()}]}))} contracts={appData.contracts} />;
            case 'settings':
                return <Settings appData={appData} setAppData={setAppData} />;
            case 'construction-checklist':
                return <ConstructionChecklist contracts={appData.contracts} checklists={appData.checklists} onUpdateChecklist={handleUpdateChecklist} />;
            default:
                return <Dashboard installments={appData.installments} contracts={appData.contracts} schedules={appData.schedules} projectProgress={[]} otherPayments={appData.otherPayments} expenses={appData.expenses || []} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-color)]">
            <aside className="w-64 bg-[var(--sidebar-color)] flex-shrink-0 flex flex-col no-print shadow-2xl z-40">
                <div className="p-8 border-b border-white/5 flex flex-col items-center">
                    <div className="w-12 h-12 bg-[var(--primary-color)] rounded-xl flex items-center justify-center shadow-lg mb-4">
                        <BrandLogo className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">{appData.systemSettings.appName}</h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <NavItem icon={<DashboardIcon />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                    <NavItem icon={<WalletIcon />} label="Orçamentos" isActive={view === 'budgets'} onClick={() => setView('budgets')} />
                    <NavItem icon={<FileTextIcon />} label="Projetos" isActive={view === 'contracts'} onClick={() => setView('contracts')} />
                    <NavItem icon={<CheckCircleIcon />} label="Checklist Obra" isActive={view === 'construction-checklist'} onClick={() => setView('construction-checklist')} />
                    <NavItem icon={<UsersIcon />} label="Área Cliente" isActive={view === 'client-area' || view === 'project-portal'} onClick={() => setView('client-area')} />
                    <NavItem icon={<MoneyBagIcon />} label="Precificação" isActive={view === 'pricing'} onClick={() => setView('pricing')} />
                    <NavItem icon={<TrendingUpIcon />} label="Andamento" isActive={view === 'progress'} onClick={() => setView('progress')} />
                    <NavItem icon={<ReceiptIcon />} label="Financeiro" isActive={view === 'projections'} onClick={() => setView('projections')} />
                    <NavItem icon={<CreditCardIcon />} label="Despesas" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                    <NavItem icon={<NotepadIcon />} label="Notas" isActive={view === 'notes'} onClick={() => setView('notes')} />
                    <NavItem icon={<CogIcon />} label="Ajustes" isActive={view === 'settings'} onClick={() => setView('settings')} />
                </nav>
                <div className="p-4 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Software de Gestão v3.0</p>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-[var(--bg-color)]">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
