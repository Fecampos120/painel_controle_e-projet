
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
    MapPinIcon
} from './components/Icons';

import { AppData, Contract, Budget, PaymentInstallment, ProjectSchedule, ProjectChecklist, ThemeSettings, VisitLog, Partner } from './types';
import { 
  MOCK_FIXED_EXPENSE_TEMPLATES, 
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_PRICING_MODEL,
  INITIAL_SERVICE_PRICES,
  INITIAL_HOURLY_RATES,
  INITIAL_MEASUREMENT_TIERS,
} from './constants';

type View = 'dashboard' | 'budgets' | 'contracts' | 'new-contract' | 'client-area' | 'pricing' | 'progress' | 'projections' | 'expenses' | 'notes' | 'settings' | 'project-portal' | 'receipts' | 'construction-checklist' | 'partners';

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

    // EFEITO DE TEMA SEGURO
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
        return <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white font-black uppercase tracking-widest animate-pulse">Integridade de Dados...</div>;
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
        const contracts = Array.isArray(appData.contracts) ? appData.contracts : [];
        const installments = Array.isArray(appData.installments) ? appData.installments : [];
        const schedules = Array.isArray(appData.schedules) ? appData.schedules : [];
        const otherPayments = Array.isArray(appData.otherPayments) ? appData.otherPayments : [];
        const expenses = Array.isArray(appData.expenses) ? appData.expenses : [];
        const budgets = Array.isArray(appData.budgets) ? appData.budgets : [];
        const partners = Array.isArray(appData.partners) ? appData.partners : [];
        const notes = Array.isArray(appData.notes) ? appData.notes : [];
        const visitLogs = Array.isArray(appData.visitLogs) ? appData.visitLogs : [];
        const settings = appData.systemSettings || DEFAULT_SYSTEM_SETTINGS;

        switch (view) {
            case 'dashboard':
                return <Dashboard installments={installments} contracts={contracts} schedules={schedules} projectProgress={[]} otherPayments={otherPayments} expenses={expenses} />;
            case 'budgets':
                return <Budgets budgets={budgets} onAddBudget={() => { setBudgetToConvert(null); setEditingContract(null); setView('new-contract'); }} onDeleteBudget={(id) => setAppData(p => ({...p, budgets: p.budgets.filter(b => b.id !== id)}))} onApproveBudget={(b) => {setBudgetToConvert(b); setEditingContract(null); setView('new-contract')}} />;
            case 'contracts':
                return <Contracts contracts={contracts} schedules={schedules} clients={appData.clients || []} systemSettings={settings} onEditContract={(c) => {setEditingContract(c); setBudgetToConvert(null); setView('new-contract')}} onDeleteContract={(id) => setAppData(p => ({...p, contracts: p.contracts.filter(c => c.id !== id)}))} onCreateProject={() => { setBudgetToConvert(null); setEditingContract(null); setView('new-contract'); }} onViewPortal={(id) => {setSelectedProjectId(id); setView('project-portal')}} />;
            case 'new-contract':
                return <NewContract 
                    appData={appData} 
                    editingContract={editingContract} 
                    budgetToConvert={budgetToConvert} 
                    onCancel={() => setView('contracts')} 
                    onAddBudgetOnly={(b) => {
                        setAppData(p => ({...p, budgets: [...p.budgets, { ...b, id: Date.now(), createdAt: new Date(), lastContactDate: new Date(), status: 'Aberto' }]})); 
                        setView('budgets');
                    }} 
                    onAddContract={(c) => {
                        const contractId = Date.now();
                        
                        // 1. Cronograma
                        const schedule: ProjectSchedule = { 
                            id: Date.now() + 500, 
                            contractId, 
                            clientName: c.clientName, 
                            projectName: c.projectName, 
                            startDate: new Date(c.date).toISOString().split('T')[0], 
                            stages: (settings.projectStagesTemplate || []).map(t => ({ id: Math.random(), name: t.name, durationWorkDays: t.durationWorkDays })) 
                        };

                        // 2. Checklist Técnico
                        const initialChecklist: ProjectChecklist = {
                            contractId,
                            items: (settings.checklistTemplate || []).map(t => ({
                                id: Math.random(),
                                text: t.text,
                                stage: t.stage,
                                completed: false
                            }))
                        };

                        // 3. Financeiro (Geração Automática de Parcelas)
                        const newInstallments: PaymentInstallment[] = [];
                        
                        // Entrada / Sinal
                        if (c.downPayment > 0) {
                            newInstallments.push({
                                id: Date.now() + 1000,
                                contractId,
                                clientName: c.clientName,
                                projectName: c.projectName,
                                installment: 'ENTRADA',
                                dueDate: new Date(c.downPaymentDate),
                                value: c.downPayment,
                                status: 'Pendente'
                            });
                        }

                        // Parcelas Mensais
                        if (c.installments > 0) {
                            const baseDate = c.firstInstallmentDate ? new Date(c.firstInstallmentDate) : new Date(c.downPaymentDate);
                            if (!c.firstInstallmentDate) baseDate.setMonth(baseDate.getMonth() + 1);
                            
                            for (let i = 1; i <= c.installments; i++) {
                                const dueDate = new Date(baseDate);
                                dueDate.setMonth(dueDate.getMonth() + (i - 1));
                                newInstallments.push({
                                    id: Date.now() + 2000 + i,
                                    contractId,
                                    clientName: c.clientName,
                                    projectName: c.projectName,
                                    installment: `${i}/${c.installments}`,
                                    dueDate: dueDate,
                                    value: c.installmentValue,
                                    status: 'Pendente'
                                });
                            }
                        }

                        // Atualiza Estado Global
                        setAppData(p => ({ 
                            ...p, 
                            contracts: [...p.contracts, { ...c, id: contractId }] as Contract[], 
                            schedules: [...p.schedules, schedule],
                            checklists: [...p.checklists, initialChecklist],
                            installments: [...p.installments, ...newInstallments],
                            // Remove o orçamento se ele estava sendo convertido
                            budgets: budgetToConvert ? p.budgets.filter(b => b.id !== budgetToConvert.id) : p.budgets
                        }));

                        setBudgetToConvert(null);
                        setEditingContract(null);
                        setView('contracts');
                    }} 
                    onUpdateContract={(c) => {
                        setAppData(p => ({...p, contracts: p.contracts.map(x => x.id === c.id ? c : x)})); 
                        setEditingContract(null);
                        setView('contracts');
                    }} 
                />;
            case 'client-area':
                const activeProjects = contracts.filter(c => c.status === 'Ativo');
                return (
                    <div className="space-y-8 animate-fadeIn">
                        <header className="bg-[var(--primary-color)] text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-8 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                            <h1 className="text-3xl font-bold uppercase tracking-tight">Área do Cliente</h1>
                            <p className="text-blue-100 opacity-90">Portais individuais de acompanhamento.</p>
                        </header>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeProjects.map(project => (
                                <div key={project.id} onClick={() => { setSelectedProjectId(project.id); setView('project-portal'); }} className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-[var(--primary-color)] cursor-pointer group transition-all">
                                    <ArchitectIcon className="w-10 h-10 text-[var(--primary-color)] mb-4" />
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{project.projectName}</h3>
                                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase">{project.clientName}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'project-portal':
                const portalContract = contracts.find(c => c.id === selectedProjectId);
                return portalContract ? (
                    <ProjectPortal contract={portalContract} schedule={schedules.find(s => s.contractId === selectedProjectId)} checklist={appData.checklists?.find(c => c.contractId === selectedProjectId) || { contractId: selectedProjectId!, items: [] }} installments={installments.filter(i => i.contractId === selectedProjectId)} notes={notes.filter(n => n.contractId === selectedProjectId)} updates={appData.projectUpdates?.filter(u => u.contractId === selectedProjectId) || []} visitLogs={visitLogs.filter(v => v.contractId === selectedProjectId)} onAddVisitLog={(v) => setAppData(p => ({...p, visitLogs: [...p.visitLogs, { ...v, id: Date.now(), createdAt: new Date() }]}))} onAddProjectUpdate={(u) => setAppData(p => ({...p, projectUpdates: [...p.projectUpdates, { ...u, id: Date.now() }]}))} onUpdateChecklist={handleUpdateChecklist} onBack={() => setView('client-area')} systemSettings={settings} />
                ) : null;
            case 'pricing':
                return <Pricing expenses={expenses} pricingData={appData.pricing} onUpdatePricing={(p) => setAppData(prev => ({...prev, pricing: p}))} />;
            case 'progress':
                return <Progress schedules={schedules} setSchedules={(s) => setAppData(prev => ({...prev, schedules: s}))} contracts={contracts} />;
            case 'projections':
                return <Projections installments={installments} otherPayments={otherPayments} contracts={contracts} onRegisterInstallment={(id, date) => setAppData(prev => ({...prev, installments: prev.installments.map(i => i.id === id ? {...i, status: 'Pago em dia', paymentDate: date} : i)}))} onRegisterOther={(desc, date, val) => setAppData(prev => ({...prev, otherPayments: [...prev.otherPayments, {id: Date.now(), description: desc, paymentDate: date, value: val}]}))} />;
            case 'expenses':
                return <Expenses expenses={expenses} fixedExpenseTemplates={appData.fixedExpenseTemplates || []} onAddExpense={(e) => setAppData(prev => ({...prev, expenses: [...prev.expenses, {...e, id: Date.now()}]}))} onDeleteExpense={(id) => setAppData(prev => ({...prev, expenses: prev.expenses.filter(e => e.id !== id)}))} onUpdateExpense={(e) => setAppData(prev => ({...prev, expenses: prev.expenses.map(exp => exp.id === e.id ? e : exp)}))} onAddFixedExpenseTemplate={(t) => setAppData(prev => ({...prev, fixedExpenseTemplates: [...prev.fixedExpenseTemplates, {...t, id: Date.now()}]}))} onDeleteFixedExpenseTemplate={(id) => setAppData(prev => ({...prev, fixedExpenseTemplates: prev.fixedExpenseTemplates.filter(t => t.id !== id)}))} />;
            case 'notes':
                return <Notes notes={notes} visitLogs={visitLogs} contracts={contracts} onUpdateNote={(n) => setAppData(prev => ({...prev, notes: prev.notes.map(note => note.id === n.id ? n : note)}))} onDeleteNote={(id) => setAppData(prev => ({...prev, notes: prev.notes.filter(n => n.id !== id)}))} onAddNote={(n) => setAppData(prev => ({...prev, notes: [...prev.notes, {...n, id: Date.now(), createdAt: new Date()}]}))} onAddVisitLog={(v) => setAppData(prev => ({...prev, visitLogs: [...prev.visitLogs, { ...v, id: Date.now(), createdAt: new Date() }]}))} />;
            case 'partners':
                return <Partners partners={partners} clients={appData.clients || []} onAddPartner={(p) => setAppData(p => ({...p, partners: [...p.partners, { ...p, id: Date.now() }]}))} onUpdatePartner={(p) => setAppData(p => ({...p, partners: p.partners.map(x => x.id === p.id ? p : x)}))} onDeletePartner={(id) => setAppData(p => ({...p, partners: p.partners.filter(x => x.id !== id)}))} />;
            case 'settings':
                return <Settings appData={appData} setAppData={setAppData} />;
            case 'construction-checklist':
                return <ConstructionChecklist contracts={contracts} checklists={appData.checklists || []} onUpdateChecklist={handleUpdateChecklist} />;
            default:
                return <Dashboard installments={installments} contracts={contracts} schedules={schedules} projectProgress={[]} otherPayments={otherPayments} expenses={expenses} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-color)]">
            <aside className="w-64 bg-[var(--sidebar-color)] flex-shrink-0 flex flex-col no-print shadow-2xl z-40">
                <div className="p-8 border-b border-white/5 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--primary-color)] shadow-lg mb-4">
                        {appData?.systemSettings?.logoUrl ? <img src={appData.systemSettings.logoUrl} className="w-full h-full object-contain" /> : <BrandLogo className="w-8 h-8 text-white" />}
                    </div>
                    <h1 className="text-xl font-black text-white uppercase tracking-widest">{appData?.systemSettings?.appName || 'E-PROJET'}</h1>
                </div>
                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <NavItem icon={<DashboardIcon />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                    <NavItem icon={<WalletIcon />} label="Orçamentos" isActive={view === 'budgets'} onClick={() => setView('budgets')} />
                    <NavItem icon={<FileTextIcon />} label="Projetos" isActive={view === 'contracts'} onClick={() => setView('contracts')} />
                    <NavItem icon={<CheckCircleIcon />} label="Checklist Obra" isActive={view === 'construction-checklist'} onClick={() => setView('construction-checklist')} />
                    <NavItem icon={<NotepadIcon />} label="Notas & Visitas" isActive={view === 'notes'} onClick={() => setView('notes')} />
                    <NavItem icon={<UsersIcon />} label="Parceiros" isActive={view === 'partners'} onClick={() => setView('partners')} />
                    <NavItem icon={<UsersIcon />} label="Área Cliente" isActive={view === 'client-area'} onClick={() => setView('client-area')} />
                    <NavItem icon={<MoneyBagIcon />} label="Precificação" isActive={view === 'pricing'} onClick={() => setView('pricing')} />
                    <NavItem icon={<TrendingUpIcon />} label="Andamento" isActive={view === 'progress'} onClick={() => setView('progress')} />
                    <NavItem icon={<ReceiptIcon />} label="Financeiro" isActive={view === 'projections'} onClick={() => setView('projections')} />
                    <NavItem icon={<CreditCardIcon />} label="Despesas" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                    <NavItem icon={<CogIcon />} label="Ajustes" isActive={view === 'settings'} onClick={() => setView('settings')} />
                </nav>
            </aside>
            <main className="flex-1 overflow-y-auto p-6 md:p-10">
                {renderView()}
            </main>
        </div>
    );
};

export default App;
