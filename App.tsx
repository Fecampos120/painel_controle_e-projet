
import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Contracts from './components/Contracts';
import NewContract from './components/NewContract';
import Progress from './components/Progress';
import Projections from './components/Projections';
import Receipts from './components/Receipts';
import Reminders from './components/Reminders';
import Settings from './components/Settings';
import Database from './components/Database';
import ConstructionChecklist from './components/ConstructionChecklist';
import Expenses from './components/Expenses';
import TechnicalVisits from './components/TechnicalVisits';
import Notes from './components/Notes';
import Pricing from './components/Pricing';
import Auth from './components/Auth';
import { useUserData } from './hooks/useUserData';

import { 
    DashboardIcon, 
    FileTextIcon, 
    MoneyBagIcon, 
    TrendingUpIcon, 
    MapPinIcon, 
    ClipboardCheckIcon,
    NotepadIcon,
    CogIcon,
    DatabaseIcon,
    CreditCardIcon,
    ReceiptIcon
} from './components/Icons';

import { AppData, Contract, Expense, FixedExpenseTemplate, Note, Partner, ProjectChecklist, ProjectSchedule, Reminder, VisitLog } from './types';
import { 
  MOCK_FIXED_EXPENSE_TEMPLATES, 
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_PRICING_MODEL,
  INITIAL_SERVICE_PRICES,
  INITIAL_HOURLY_RATES,
  INITIAL_MEASUREMENT_TIERS,
  INITIAL_PROJECT_STAGES_TEMPLATE
} from './constants';

type View = 'dashboard' | 'contracts' | 'new-contract' | 'progress' | 'projections' | 'receipts' | 'reminders' | 'settings' | 'database' | 'checklist' | 'expenses' | 'visits' | 'notes' | 'pricing';

const INITIAL_DATA: AppData = {
    clients: [],
    contracts: [],
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
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <li className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`} onClick={onClick}>
        <span className="mr-3">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
    </li>
);

const App: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { data: appData, saveData: setAppData, loadingData } = useUserData(user, INITIAL_DATA);
    const [view, setView] = useState<View>('dashboard');
    const [editingContract, setEditingContract] = useState<Contract | null>(null);

    if (!user) {
        return <Auth onLoginSuccess={setUser} />;
    }

    if (loadingData) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

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
            case 'pricing':
                return <Pricing 
                            expenses={appData.expenses || []} 
                            pricingData={appData.pricing}
                            onUpdatePricing={(p) => setAppData({...appData, pricing: p})} 
                        />;
            case 'contracts':
                return <Contracts 
                            contracts={appData.contracts}
                            schedules={appData.schedules}
                            clients={appData.clients}
                            systemSettings={appData.systemSettings}
                            onEditContract={(c) => { setEditingContract(c); setView('new-contract'); }}
                            onDeleteContract={(id) => setAppData({...appData, contracts: appData.contracts.filter(c => c.id !== id)})}
                            onCreateProject={() => { setEditingContract(null); setView('new-contract'); }}
                        />;
            case 'new-contract':
                return <NewContract 
                            appData={appData}
                            editingContract={editingContract}
                            onCancel={() => setView('contracts')}
                            onAddContract={(c) => {
                                const id = Date.now();
                                setAppData({...appData, contracts: [...appData.contracts, { ...c, id }] as Contract[], view: 'contracts' as any});
                                setView('contracts');
                            }}
                            onUpdateContract={(c) => {
                                setAppData({...appData, contracts: appData.contracts.map(contract => contract.id === c.id ? c : contract)});
                                setView('contracts');
                            }}
                        />;
            case 'progress':
                return <Progress 
                            schedules={appData.schedules}
                            setSchedules={(s) => setAppData({...appData, schedules: s})}
                            contracts={appData.contracts}
                        />;
            case 'projections':
                return <Projections 
                            installments={appData.installments}
                            otherPayments={appData.otherPayments}
                            contracts={appData.contracts}
                            onRegisterInstallment={(id, date) => {
                                setAppData({
                                    ...appData,
                                    installments: appData.installments.map(i => i.id === id ? {...i, status: 'Pago em dia', paymentDate: date} : i)
                                });
                            }}
                            onRegisterOther={(desc, date, val) => {
                                setAppData({
                                    ...appData,
                                    otherPayments: [...appData.otherPayments, { id: Date.now(), description: desc, paymentDate: date, value: val }]
                                });
                            }}
                        />;
            case 'reminders':
                return <Reminders 
                            reminders={appData.reminders}
                            setReminders={(r) => setAppData({...appData, reminders: r})}
                            clients={appData.clients}
                        />;
            case 'receipts':
                return <Receipts 
                            contracts={appData.contracts}
                            installments={appData.installments}
                            systemSettings={appData.systemSettings}
                        />;
            case 'checklist':
                return <ConstructionChecklist 
                            contracts={appData.contracts}
                            checklists={appData.checklists}
                            systemSettings={appData.systemSettings}
                            onUpdateChecklist={(c) => {
                                const exists = appData.checklists.find(check => check.contractId === c.contractId);
                                if (exists) {
                                    setAppData({...appData, checklists: appData.checklists.map(check => check.contractId === c.contractId ? c : check)});
                                } else {
                                    setAppData({...appData, checklists: [...appData.checklists, c]});
                                }
                            }}
                        />;
            case 'expenses':
                return <Expenses 
                            expenses={appData.expenses}
                            fixedExpenseTemplates={appData.fixedExpenseTemplates}
                            onAddExpense={(e) => setAppData({...appData, expenses: [...appData.expenses, { ...e, id: Date.now() }]})}
                            onDeleteExpense={(id) => setAppData({...appData, expenses: appData.expenses.filter(e => e.id !== id)})}
                            onUpdateExpense={(e) => setAppData({...appData, expenses: appData.expenses.map(exp => exp.id === e.id ? e : exp)})}
                            onAddFixedExpenseTemplate={(t) => setAppData({...appData, fixedExpenseTemplates: [...appData.fixedExpenseTemplates, { ...t, id: Date.now() }]})}
                            onDeleteFixedExpenseTemplate={(id) => setAppData({...appData, fixedExpenseTemplates: appData.fixedExpenseTemplates.filter(t => t.id !== id)})}
                        />;
            case 'visits':
                return <TechnicalVisits 
                            contracts={appData.contracts}
                            visitLogs={appData.visitLogs}
                            onAddVisitLog={(l) => setAppData({...appData, visitLogs: [...appData.visitLogs, { ...l, id: Date.now() }]})}
                        />;
            case 'notes':
                return <Notes 
                            notes={appData.notes}
                            contracts={appData.contracts}
                            onAddNote={(n) => setAppData({...appData, notes: [...appData.notes, { ...n, id: Date.now(), createdAt: new Date() }]})}
                            onUpdateNote={(n) => setAppData({...appData, notes: appData.notes.map(note => note.id === n.id ? n : note)})}
                            onDeleteNote={(id) => setAppData({...appData, notes: appData.notes.filter(n => n.id !== id)})}
                        />;
            case 'database':
                return <Database 
                            appData={appData}
                            setAppData={setAppData}
                            onDeleteContract={(id) => setAppData({...appData, contracts: appData.contracts.filter(c => c.id !== id)})}
                            onResetData={() => { if(window.confirm('Resetar tudo?')) setAppData(INITIAL_DATA); }}
                        />;
            case 'settings':
                return <Settings 
                            appData={appData}
                            setAppData={setAppData}
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
    };

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col no-print">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-bold text-white uppercase tracking-wider">{appData.systemSettings.appName}</h1>
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                    <ul className="space-y-1">
                        <NavItem icon={<DashboardIcon className="w-5 h-5" />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                        <NavItem icon={<FileTextIcon className="w-5 h-5" />} label="Projetos" isActive={view === 'contracts'} onClick={() => setView('contracts')} />
                        <NavItem icon={<MoneyBagIcon className="w-5 h-5" />} label="Precificação" isActive={view === 'pricing'} onClick={() => setView('pricing')} />
                        <NavItem icon={<TrendingUpIcon className="w-5 h-5" />} label="Andamento" isActive={view === 'progress'} onClick={() => setView('progress')} />
                        <NavItem icon={<ReceiptIcon className="w-5 h-5" />} label="Financeiro" isActive={view === 'projections'} onClick={() => setView('projections')} />
                        <NavItem icon={<CreditCardIcon className="w-5 h-5" />} label="Despesas" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                        <NavItem icon={<MapPinIcon className="w-5 h-5" />} label="Visitas Técnicas" isActive={view === 'visits'} onClick={() => setView('visits')} />
                        <NavItem icon={<ClipboardCheckIcon className="w-5 h-5" />} label="Checklist Obra" isActive={view === 'checklist'} onClick={() => setView('checklist')} />
                        <NavItem icon={<NotepadIcon className="w-5 h-5" />} label="Notas" isActive={view === 'notes'} onClick={() => setView('notes')} />
                        <NavItem icon={<CogIcon className="w-5 h-5" />} label="Configurações" isActive={view === 'settings'} onClick={() => setView('settings')} />
                        <NavItem icon={<DatabaseIcon className="w-5 h-5" />} label="Banco de Dados" isActive={view === 'database'} onClick={() => setView('database')} />
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

export default App;
