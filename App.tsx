

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
import { AppData, PaymentInstallment, Contract, OtherPayment, Client, Partner } from './types';
import { CLIENTS, MOCK_CONTRACTS, MOCK_REMINDERS, INITIAL_INSTALLMENTS, MOCK_PROJECT_SCHEDULES, MOCK_PROJECT_PROGRESS, MOCK_SERVICE_PRICES, MOCK_HOURLY_RATES, MOCK_MEASUREMENT_TIERS, MOCK_EXTRA_TIERS, DEFAULT_PROJECT_STAGES_TEMPLATE, MOCK_OTHER_PAYMENTS, MOCK_PARTNERS } from './constants';


type View = 'dashboard' | 'contracts' | 'new-contract' | 'progress' | 'projections' | 'receipts' | 'reminders' | 'settings' | 'database' | 'late-payments' | 'partners';

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

  const [view, setView] = useState<View>('dashboard');
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  const handleAddContract = (newContract: Omit<Contract, 'id'>) => {
    const contractWithId: Contract = {
        ...newContract,
        id: Date.now(), // simple unique ID
    };
    setAppData(prev => ({
        ...prev,
        contracts: [contractWithId, ...prev.contracts]
    }));
    setView('contracts'); // Navigate to contracts list after adding
  };
  
  const handleUpdateContract = (updatedContract: Contract) => {
    setAppData(prev => ({
        ...prev,
        contracts: prev.contracts.map(c => c.id === updatedContract.id ? updatedContract : c)
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
                  otherPayments={appData.otherPayments}
                  onAddOtherPayment={handleAddOtherPayment}
                />;
      case 'contracts':
        return <Contracts 
                    contracts={appData.contracts}
                    onEditContract={handleStartEditContract}
                    onDeleteContract={handleDeleteContract}
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
                  projectStagesTemplate={appData.projectStagesTemplate}
                />;
      case 'projections':
        return <Projections installments={appData.installments} otherPayments={appData.otherPayments} />;
      case 'late-payments':
        return <LatePayments installments={appData.installments} />;
      case 'receipts':
        return <Receipts contracts={appData.contracts}/>;
      case 'reminders':
        return <Reminders 
                  reminders={appData.reminders}
                  setReminders={(newReminders) => setAppData(prev => ({...prev, reminders: newReminders}))}
                  clients={appData.clients}
                />;
       case 'partners':
        return <Partners 
                  partners={appData.partners}
                  onAddPartner={handleAddPartner}
                  onUpdatePartner={handleUpdatePartner}
                  onDeletePartner={handleDeletePartner}
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
                  label="Contratos"
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