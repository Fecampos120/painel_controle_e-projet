
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
import Partners from './components/Partners';
import TechnicalVisits from './components/TechnicalVisits';
import ConstructionChecklist from './components/ConstructionChecklist';
import Agenda from './components/Agenda';
import Analytics from './components/Analytics';
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
    CheckCircleIcon,
    MapPinIcon,
    CalendarIcon,
    XIcon,
    ChartPieIcon
} from './components/Icons';

import { AppData, Contract, Budget, PaymentInstallment, ProjectSchedule, ProjectChecklist, ThemeSettings, VisitLog, Partner, Expense, FixedExpenseTemplate, Appointment } from './types';
import { 
  MOCK_FIXED_EXPENSE_TEMPLATES, 
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_PRICING_MODEL,
  INITIAL_SERVICE_PRICES,
  INITIAL_HOURLY_RATES,
  INITIAL_MEASUREMENT_TIERS,
} from './constants';

type View = 'dashboard' | 'agenda' | 'budgets' | 'contracts' | 'new-contract' | 'client-area' | 'pricing' | 'progress' | 'projections' | 'expenses' | 'notes' | 'settings' | 'project-portal' | 'receipts' | 'construction-checklist' | 'partners' | 'analytics';

const INITIAL_DATA: AppData = {
    clients: [],
    contracts: [],
    budgets: [],
    reminders: [],
    appointments: [],
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

const ICON_COMPONENTS: Record<string, React.ReactNode> = {
    DashboardIcon: <DashboardIcon />,
    CalendarIcon: <CalendarIcon />,
    WalletIcon: <WalletIcon />,
    FileTextIcon: <FileTextIcon />,
    CheckCircleIcon: <CheckCircleIcon />,
    NotepadIcon: <NotepadIcon />,
    UsersIcon: <UsersIcon />,
    MoneyBagIcon: <MoneyBagIcon />,
    TrendingUpIcon: <TrendingUpIcon />,
    ReceiptIcon: <ReceiptIcon />,
    CreditCardIcon: <CreditCardIcon />,
    CogIcon: <CogIcon />,
    ChartPieIcon: <ChartPieIcon />,
};

// Mapeamento de cores vibrantes para os menus
const MENU_ICON_COLORS: Record<string, string> = {
    dashboard: 'text-blue-400',
    agenda: 'text-purple-400',
    budgets: 'text-green-400',
    contracts: 'text-indigo-400',
    analytics: 'text-pink-400',
    'construction-checklist': 'text-amber-400',
    notes: 'text-sky-400',
    partners: 'text-orange-400',
    'client-area': 'text-emerald-400',
    pricing: 'text-yellow-400',
    progress: 'text-teal-400',
    projections: 'text-cyan-400',
    expenses: 'text-red-400',
    settings: 'text-slate-400',
};

const NavItem: React.FC<{ view: string, iconName: string, label: string, isActive: boolean, onClick: () => void }> = ({ view, iconName, label, isActive, onClick }) => {
    const icon = ICON_COMPONENTS[iconName] || <BrandLogo />;
    const iconColorClass = MENU_ICON_COLORS[view] || 'text-slate-400';

    return (
        <li 
          className={`flex items-center px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${isActive ? 'bg-[var(--primary-color)] shadow-lg shadow-blue-500/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`} 
          onClick={onClick}
        >
            <div className={`mr-3.5 transition-all ${isActive ? 'scale-110 text-white' : `${iconColorClass} opacity-80 group-hover:opacity-100`}`}>
              {React.cloneElement(icon as React.ReactElement, { 
                  className: 'w-5 h-5'
              })}
            </div>
            <span className={`text-[11px] font-black tracking-widest uppercase ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
              {label}
            </span>
        </li>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { data: appData, saveData: setAppData, loadingData } = useUserData(user, INITIAL_DATA);
    const [view, setView] = useState<View>('dashboard');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [budgetToConvert, setBudgetToConvert] = useState<Budget | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const theme = appData?.systemSettings?.theme;
        if (!theme) return;
        const root = document.documentElement;
        root.style.setProperty('--primary-color', theme.primaryColor || '#2563eb');
        root.style.setProperty('--sidebar-color', theme.sidebarColor || '#0f172a');
        root.style.setProperty('--bg-color', theme.backgroundColor || '#f1f5f9');
        root.style.setProperty('--font-main', theme.fontFamily || "'Inter', sans-serif");
        root.style.setProperty('--border-radius', theme.borderRadius || '12px');
        document.body.style.fontFamily = theme.fontFamily || "'Inter', sans-serif";
        document.body.style.backgroundColor = theme.backgroundColor || '#f1f5f9';
    }, [appData?.systemSettings?.theme]);

    if (!user) {
        return <Auth onLoginSuccess={setUser} />;
    }

    if (loadingData) {
        return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white font-bold uppercase tracking-widest animate-pulse">Sincronizando...</div>;
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

    const sortedMenuItems = [...(appData.systemSettings.menuOrder || DEFAULT_SYSTEM_SETTINGS.menuOrder)].sort((a, b) => a.sequence - b.sequence);

    const renderView = () => {
        const contracts = Array.isArray(appData.contracts) ? appData.contracts : [];
        const installments = Array.isArray(appData.installments) ? appData.installments : [];
        const schedules = Array.isArray(appData.schedules) ? appData.schedules : [];
        const otherPayments = Array.isArray(appData.otherPayments) ? appData.otherPayments : [];
        const expenses = Array.isArray(appData.expenses) ? appData.expenses : [];
        const budgets = Array.isArray(appData.budgets) ? appData.budgets : [];
        const partners = Array.isArray(appData.partners) ? appData.partners : [];
        const notes = Array.isArray(appData.notes) ? appData.notes : [];
        const visitLogs = Array.isArray(appData.visitLogs) ? appData.visitLogs : [];
        const appointments = Array.isArray(appData.appointments) ? appData.appointments : [];
        const settings = appData.systemSettings || DEFAULT_SYSTEM_SETTINGS;

        switch (view) {
            case 'dashboard':
                return <Dashboard appointments={appointments} installments={installments} contracts={contracts} schedules={schedules} projectProgress={[]} otherPayments={otherPayments} expenses={expenses} />;
            case 'agenda':
                return <Agenda appointments={appointments} contracts={contracts} onUpdateAppointments={(newAppointments) => setAppData(prev => ({...prev, appointments: newAppointments}))} />;
            case 'budgets':
                return <Budgets budgets={budgets} onAddBudget={() => { setBudgetToConvert(null); setEditingContract(null); setView('new-contract'); }} onDeleteBudget={(id) => setAppData(p => ({...p, budgets: p.budgets.filter(b => b.id !== id)}))} onApproveBudget={(b) => {setBudgetToConvert(b); setEditingContract(null); setView('new-contract')}} />;
            case 'contracts':
                return <Contracts contracts={contracts} schedules={schedules} clients={appData.clients || []} systemSettings={settings} onEditContract={(c) => {setEditingContract(c); setBudgetToConvert(null); setView('new-contract')}} onDeleteContract={(id) => setAppData(p => ({...p, contracts: p.contracts.filter(c => c.id !== id)}))} onCreateProject={() => { setBudgetToConvert(null); setEditingContract(null); setView('new-contract'); }} onViewPortal={(id) => {setSelectedProjectId(id); setView('project-portal')}} />;
            case 'analytics':
                return <Analytics appData={appData} />;
            case 'new-contract':
                return <NewContract appData={appData} editingContract={editingContract} budgetToConvert={budgetToConvert} onCancel={() => setView('contracts')} onAddBudgetOnly={(b) => { setAppData(p => ({...p, budgets: [...p.budgets, { ...b, id: Date.now() + Math.random(), createdAt: new Date(), lastContactDate: new Date(), status: 'Aberto' }]})); setView('budgets'); }} onAddContract={(c) => { const contractId = Date.now() + Math.random(); const schedule: ProjectSchedule = { id: Date.now() + Math.random(), contractId, clientName: c.clientName, projectName: c.projectName, startDate: new Date(c.date).toISOString().split('T')[0], stages: (settings.projectStagesTemplate || []).map(t => ({ id: Math.random(), name: t.name, durationWorkDays: t.durationWorkDays })) }; const initialChecklist: ProjectChecklist = { contractId, items: (settings.checklistTemplate || []).map(t => ({ id: Math.random(), text: t.text, stage: t.stage, completed: false })) }; const newInstallments: PaymentInstallment[] = []; if (c.downPayment > 0) { newInstallments.push({ id: Date.now() + Math.random(), contractId, clientName: c.clientName, projectName: c.projectName, installment: 'ENTRADA', dueDate: new Date(c.downPaymentDate), value: c.downPayment, status: 'Pendente' }); } if (c.installments > 0) { const baseDate = c.firstInstallmentDate ? new Date(c.firstInstallmentDate) : new Date(c.downPaymentDate); if (!c.firstInstallmentDate) baseDate.setMonth(baseDate.getMonth() + 1); for (let i = 1; i <= c.installments; i++) { const dueDate = new Date(baseDate); dueDate.setMonth(dueDate.getMonth() + (i - 1)); newInstallments.push({ id: Date.now() + Math.random(), contractId, clientName: c.clientName, projectName: c.projectName, installment: `${i}/${c.installments}`, dueDate: dueDate, value: c.installmentValue, status: 'Pendente' }); } } setAppData(p => ({ ...p, contracts: [...p.contracts, { ...c, id: contractId }] as Contract[], schedules: [...p.schedules, schedule], checklists: [...p.checklists, initialChecklist], installments: [...p.installments, ...newInstallments], budgets: budgetToConvert ? p.budgets.filter(b => b.id !== budgetToConvert.id) : p.budgets })); setBudgetToConvert(null); setEditingContract(null); setView('contracts'); }} onUpdateContract={(c) => { setAppData(p => ({...p, contracts: p.contracts.map(x => x.id === c.id ? c : x)})); setEditingContract(null); setView('contracts'); }} />;
            case 'client-area':
                const activeProjects = contracts.filter(c => c.status === 'Ativo');
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <header className="bg-slate-900 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                            <h1 className="text-2xl font-black uppercase tracking-tight">Área do Cliente</h1>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Portais individuais de acompanhamento técnico.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeProjects.map(project => (
                                <div key={project.id} onClick={() => { setSelectedProjectId(project.id); setView('project-portal'); }} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-[var(--primary-color)] cursor-pointer group transition-all">
                                    <ArchitectIcon className="w-10 h-10 text-[var(--primary-color)] mb-4" />
                                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">{project.projectName}</h3>
                                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">{project.clientName}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'project-portal':
                const portalContract = contracts.find(c => c.id === selectedProjectId);
                return portalContract ? (
                    <ProjectPortal contract={portalContract} schedule={schedules.find(s => s.contractId === selectedProjectId)} checklist={appData.checklists?.find(c => c.contractId === selectedProjectId) || { contractId: selectedProjectId!, items: [] }} installments={installments.filter(i => i.contractId === selectedProjectId)} notes={notes.filter(n => n.contractId === selectedProjectId)} updates={appData.projectUpdates?.filter(u => u.contractId === selectedProjectId) || []} visitLogs={visitLogs.filter(v => v.contractId === selectedProjectId)} onAddVisitLog={(v) => setAppData(p => ({...p, visitLogs: [...p.visitLogs, { ...v, id: Date.now() + Math.random(), createdAt: new Date() }]}))} onAddProjectUpdate={(u) => setAppData(p => ({...p, projectUpdates: [...p.projectUpdates, { ...u, id: Date.now() + Math.random() }]}))} onUpdateChecklist={handleUpdateChecklist} onBack={() => setView('client-area')} systemSettings={settings} />
                ) : null;
            case 'pricing':
                return <Pricing expenses={expenses} pricingData={appData.pricing} onUpdatePricing={(p) => setAppData(prev => ({...prev, pricing: p}))} />;
            case 'progress':
                return <Progress schedules={schedules} setSchedules={(s) => setAppData(prev => ({...prev, schedules: s}))} contracts={contracts} />;
            case 'projections':
                return <Projections installments={installments} otherPayments={otherPayments} contracts={contracts} onRegisterInstallment={(id, date, newValue) => setAppData(prev => ({ ...prev, installments: prev.installments.map(i => { if (i.id === id) { const dueDate = new Date(i.dueDate); const isLate = date > dueDate; return { ...i, status: isLate ? 'Pago com atraso' : 'Pago em dia', paymentDate: date, value: newValue !== undefined ? newValue : i.value }; } return i; }) }))} onRegisterOther={(desc, date, val) => setAppData(prev => ({...prev, otherPayments: [...prev.otherPayments, {id: Date.now() + Math.random(), description: desc, paymentDate: date, value: val}]}))} />;
            case 'expenses':
                return <Expenses expenses={expenses} fixedExpenseTemplates={appData.fixedExpenseTemplates || []} onAddBulkExpenses={(newExps) => setAppData(prev => { const enhancedExps = newExps.map(e => ({ ...e, id: Date.now() + Math.random() })); return { ...prev, expenses: [...prev.expenses, ...enhancedExps] }; })} onAddExpense={(e) => setAppData(prev => ({...prev, expenses: [...prev.expenses, {...e, id: Date.now() + Math.random()}]}))} onDeleteExpense={(id) => setAppData(p => ({...p, expenses: p.expenses.filter(e => e.id !== id)}))} onUpdateExpense={(e) => setAppData(prev => { const newExpenses = prev.expenses.map(exp => exp.id === e.id ? { ...exp, ...e } : exp); return { ...prev, expenses: newExpenses }; })} onAddFixedExpenseTemplate={(t) => setAppData(prev => ({...prev, fixedExpenseTemplates: [...prev.fixedExpenseTemplates, {...t, id: Date.now() + Math.random()}]}))} onDeleteFixedExpenseTemplate={(id) => setAppData(p => ({...p, fixedExpenseTemplates: p.fixedExpenseTemplates.filter(t => t.id !== id)}))} />;
            case 'notes':
                return <Notes notes={notes} visitLogs={visitLogs} contracts={contracts} onUpdateNote={(n) => setAppData(prev => ({...prev, notes: prev.notes.map(note => note.id === n.id ? n : note)}))} onDeleteNote={(id) => setAppData(prev => ({...prev, notes: prev.notes.filter(n => n.id !== id)}))} onAddNote={(n) => setAppData(prev => ({...prev, notes: [...prev.notes, {...n, id: Date.now() + Math.random(), createdAt: new Date()}]}))} onAddVisitLog={(v) => setAppData(prev => ({...prev, visitLogs: [...prev.visitLogs, { ...v, id: Date.now() + Math.random(), createdAt: new Date() }]}))} />;
            case 'partners':
                return <Partners partners={partners} clients={appData.clients || []} onAddPartner={(newPartner) => setAppData(prev => ({...prev, partners: [...prev.partners, { ...newPartner, id: Date.now() + Math.random() }]}))} onUpdatePartner={(updatedPartner) => setAppData(prev => ({...prev, partners: prev.partners.map(x => x.id === updatedPartner.id ? updatedPartner : x)}))} onDeletePartner={(id) => setAppData(prev => ({...prev, partners: prev.partners.filter(x => x.id !== id)}))} />;
            case 'settings':
                return <Settings appData={appData} setAppData={setAppData} />;
            case 'construction-checklist':
                return <ConstructionChecklist contracts={contracts} checklists={appData.checklists || []} onUpdateChecklist={handleUpdateChecklist} />;
            default:
                return <Dashboard appointments={appointments} installments={installments} contracts={contracts} schedules={schedules} projectProgress={[]} otherPayments={otherPayments} expenses={expenses} />;
        }
    };

    return (
        <div className="flex h-screen bg-[var(--bg-color)] overflow-hidden">
            <aside 
                className={`fixed inset-y-0 left-0 z-[60] w-72 bg-[var(--sidebar-color)] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full flex flex-col shadow-2xl">
                    <div className="p-8 border-b border-white/5 flex flex-col items-center relative">
                        <button 
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute top-4 right-4 lg:hidden p-2 text-white/40 hover:text-white"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>

                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--primary-color)] shadow-lg mb-4">
                            {appData?.systemSettings?.logoUrl ? <img src={appData.systemSettings.logoUrl} className="w-full h-full object-contain p-2" /> : <BrandLogo className="w-8 h-8 text-white" />}
                        </div>
                        <h1 className="text-xl font-black text-white tracking-[0.2em] uppercase">{appData?.systemSettings?.appName || 'E-PROJET'}</h1>
                    </div>
                    
                    <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 no-scrollbar">
                        {sortedMenuItems.filter(item => item.visible).map(item => (
                            <NavItem 
                                key={item.id} 
                                view={item.view}
                                iconName={item.iconName} 
                                label={item.label} 
                                isActive={view === item.view} 
                                onClick={() => { setView(item.view as View); setIsSidebarOpen(false); }} 
                            />
                        ))}
                    </nav>

                    <div className="p-6 border-t border-white/5">
                        <p className="text-[9px] font-semibold text-white/20 text-center uppercase tracking-widest">
                            &copy; Studio Battelli
                        </p>
                    </div>
                </div>
            </aside>

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[55] lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            <div className="flex-1 flex flex-col h-full min-w-0">
                <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-5 shrink-0 z-40">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:text-slate-900">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2">
                        <BrandLogo className="w-5 h-5 text-[var(--primary-color)]" />
                        <span className="font-bold text-sm tracking-[0.15em] text-slate-800 uppercase">{appData?.systemSettings?.appName || 'E-PROJET'}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                        {appData.systemSettings.logoUrl && <img src={appData.systemSettings.logoUrl} className="w-full h-full object-cover" />}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 no-print">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default App;
