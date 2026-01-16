
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
import Budgets from './components/Budgets';
import Auth from './components/Auth';
import { useUserData } from './hooks/useUserData';

import { 
    DashboardIcon, 
    FileTextIcon, 
    MoneyBagIcon, 
    TrendingUpIcon, 
    MapPinIcon, 
    NotepadIcon,
    CogIcon,
    CreditCardIcon,
    ReceiptIcon,
    WalletIcon,
    CheckCircleIcon,
    BrandLogo
} from './components/Icons';

import { AppData, Contract, Budget, Expense, PaymentInstallment } from './types';
import { 
  MOCK_FIXED_EXPENSE_TEMPLATES, 
  DEFAULT_SYSTEM_SETTINGS,
  INITIAL_PRICING_MODEL,
  INITIAL_SERVICE_PRICES,
  INITIAL_HOURLY_RATES,
  INITIAL_MEASUREMENT_TIERS,
  INITIAL_PROJECT_STAGES_TEMPLATE
} from './constants';

type View = 'dashboard' | 'contracts' | 'new-contract' | 'progress' | 'projections' | 'receipts' | 'reminders' | 'settings' | 'database' | 'checklist' | 'expenses' | 'visits' | 'notes' | 'pricing' | 'budgets';

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
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }> = ({ icon, label, isActive, onClick }) => (
    <li 
      className={`flex items-center p-3 rounded-xl cursor-pointer transition-all duration-300 group ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-900/20 translate-x-2' : 'hover:bg-slate-800 hover:translate-x-1'}`} 
      onClick={onClick}
    >
        <div className={`mr-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105 opacity-70 group-hover:opacity-100'}`}>
          {icon}
        </div>
        <span className={`text-sm font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
          {label}
        </span>
    </li>
);

const App: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const { data: appData, saveData: setAppData, loadingData } = useUserData(user, INITIAL_DATA);
    const [view, setView] = useState<View>('dashboard');
    const [editingContract, setEditingContract] = useState<Contract | null>(null);
    const [budgetToConvert, setBudgetToConvert] = useState<Budget | null>(null);

    if (!user) {
        return <Auth onLoginSuccess={setUser} />;
    }

    if (loadingData) {
        return <div className="flex items-center justify-center h-screen bg-slate-900 text-white font-bold">Carregando Estúdio...</div>;
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
            case 'budgets':
                return <Budgets 
                            budgets={appData.budgets || []}
                            onAddBudget={() => { setBudgetToConvert(null); setEditingContract(null); setView('new-contract'); }}
                            onDeleteBudget={(id) => setAppData({...appData, budgets: appData.budgets.filter(b => b.id !== id)})}
                            onApproveBudget={(budget) => {
                                setBudgetToConvert(budget);
                                setEditingContract(null);
                                setView('new-contract');
                            }}
                        />;
            case 'contracts':
                return <Contracts 
                            contracts={appData.contracts}
                            schedules={appData.schedules}
                            clients={appData.clients}
                            systemSettings={appData.systemSettings}
                            onEditContract={(c) => { setEditingContract(c); setBudgetToConvert(null); setView('new-contract'); }}
                            onDeleteContract={(id) => setAppData({...appData, contracts: appData.contracts.filter(c => c.id !== id)})}
                            onCreateProject={() => { setEditingContract(null); setBudgetToConvert(null); setView('new-contract'); }}
                        />;
            case 'new-contract':
                return <NewContract 
                            appData={appData}
                            editingContract={editingContract}
                            budgetToConvert={budgetToConvert}
                            onCancel={() => setView(budgetToConvert ? 'budgets' : 'contracts')}
                            onAddBudgetOnly={(b) => {
                                const newBudget = { ...b, id: Date.now(), createdAt: new Date(), lastContactDate: new Date(), status: 'Aberto' as const };
                                setAppData({...appData, budgets: [...(appData.budgets || []), newBudget]});
                                setView('budgets');
                            }}
                            onAddContract={(c) => {
                                const id = Date.now();
                                let updatedBudgets = appData.budgets;
                                if (budgetToConvert) {
                                    updatedBudgets = appData.budgets.map(b => b.id === budgetToConvert.id ? { ...b, status: 'Aprovado' } : b);
                                }

                                const installments: PaymentInstallment[] = [];
                                if (c.downPayment > 0) {
                                    installments.push({
                                        id: Date.now() + 1,
                                        contractId: id,
                                        clientName: c.clientName,
                                        projectName: c.projectName,
                                        installment: 'Entrada',
                                        dueDate: c.downPaymentDate,
                                        value: c.downPayment,
                                        status: 'Pendente'
                                    });
                                }

                                for(let i = 1; i <= c.installments; i++) {
                                    const dueDate = new Date(c.firstInstallmentDate || new Date());
                                    dueDate.setMonth(dueDate.getMonth() + (i - 1));
                                    installments.push({
                                        id: Date.now() + i + 10,
                                        contractId: id,
                                        clientName: c.clientName,
                                        projectName: c.projectName,
                                        installment: i.toString(),
                                        dueDate: dueDate,
                                        value: c.installmentValue,
                                        status: 'Pendente'
                                    });
                                }

                                setAppData({
                                    ...appData, 
                                    contracts: [...appData.contracts, { ...c, id }] as Contract[],
                                    budgets: updatedBudgets,
                                    installments: [...appData.installments, ...installments]
                                });
                                setView('contracts');
                            }}
                            onUpdateContract={(c) => {
                                setAppData({...appData, contracts: appData.contracts.map(contract => contract.id === c.id ? c : contract)});
                                setView('contracts');
                            }}
                        />;
            case 'receipts':
                return <Receipts 
                            contracts={appData.contracts}
                            installments={appData.installments}
                            systemSettings={appData.systemSettings}
                        />;
            case 'progress':
                return <Progress schedules={appData.schedules} setSchedules={(s) => setAppData({...appData, schedules: s})} contracts={appData.contracts} />;
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
                return <Reminders reminders={appData.reminders} setReminders={(r) => setAppData({...appData, reminders: r})} clients={appData.clients} />;
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
            case 'database':
                return <Database appData={appData} setAppData={setAppData} onDeleteContract={(id) => setAppData({...appData, contracts: appData.contracts.filter(c => c.id !== id)})} onResetData={() => { if(window.confirm('Resetar tudo?')) setAppData(INITIAL_DATA); }} />;
            case 'settings':
                return <Settings appData={appData} setAppData={setAppData} />;
            case 'notes':
                return <Notes notes={appData.notes} onAddNote={(n) => setAppData({...appData, notes: [...appData.notes, {...n, id: Date.now(), createdAt: new Date()}]})} onUpdateNote={(n) => setAppData({...appData, notes: appData.notes.map(note => note.id === n.id ? n : note)})} onDeleteNote={(id) => setAppData({...appData, notes: appData.notes.filter(n => n.id !== id)})} contracts={appData.contracts} />;
            case 'pricing':
                return <Pricing expenses={appData.expenses} pricingData={appData.pricing} onUpdatePricing={(p) => setAppData({...appData, pricing: p})} />;
            default:
                return <Dashboard installments={appData.installments} contracts={appData.contracts} schedules={appData.schedules} projectProgress={appData.projectProgress || []} otherPayments={appData.otherPayments} expenses={appData.expenses || []} />;
        }
    };

    return (
        <div className="flex min-h-screen bg-[#f8fafc]">
            <aside className="w-72 bg-slate-900 flex-shrink-0 flex flex-col no-print border-r border-slate-800 shadow-2xl">
                <div className="p-8 border-b border-slate-800 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
                           {/* Add missing BrandLogo component */}
                           <BrandLogo className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-xl font-black text-white uppercase tracking-[0.2em]">{appData.systemSettings.appName}</h1>
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <ul className="space-y-2">
                        <NavItem icon={<DashboardIcon className="w-7 h-7" />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => setView('dashboard')} />
                        <NavItem icon={<WalletIcon className="w-7 h-7" />} label="Orçamentos" isActive={view === 'budgets'} onClick={() => setView('budgets')} />
                        <NavItem icon={<FileTextIcon className="w-7 h-7" />} label="Projetos" isActive={view === 'contracts'} onClick={() => setView('contracts')} />
                        <NavItem icon={<MoneyBagIcon className="w-7 h-7" />} label="Precificação" isActive={view === 'pricing'} onClick={() => setView('pricing')} />
                        <NavItem icon={<TrendingUpIcon className="w-7 h-7" />} label="Andamento" isActive={view === 'progress'} onClick={() => setView('progress')} />
                        <NavItem icon={<ReceiptIcon className="w-7 h-7" />} label="Financeiro" isActive={view === 'projections'} onClick={() => setView('projections')} />
                        <NavItem icon={<CreditCardIcon className="w-7 h-7" />} label="Despesas" isActive={view === 'expenses'} onClick={() => setView('expenses')} />
                        <NavItem icon={<NotepadIcon className="w-7 h-7" />} label="Notas" isActive={view === 'notes'} onClick={() => setView('notes')} />
                        <NavItem icon={<CogIcon className="w-7 h-7" />} label="Ajustes" isActive={view === 'settings'} onClick={() => setView('settings')} />
                    </ul>
                </nav>
                <div className="p-6 border-t border-slate-800">
                    <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400">
                            AB
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white uppercase">Studio Battelli</p>
                            <p className="text-[10px] text-slate-500 font-medium">Versão Pro 2.5</p>
                        </div>
                    </div>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto bg-slate-50/50">
                <div className="max-w-[1400px] mx-auto p-10">
                    {renderView()}
                </div>
            </main>
        </div>
    );
};

export default App;
