
import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatCard from './StatCard';
import {
  DownloadIcon,
  MoneyBagIcon,
  DollarIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SendIcon,
  HistoryIcon,
  TrendingUpIcon,
  CreditCardIcon,
  CalendarIcon,
  UsersIcon,
  XIcon
} from './Icons';
import { PaymentInstallment, AttentionPoint, Contract, ProjectProgress, OtherPayment, ProjectSchedule, Expense, Appointment } from '../types';
import PaymentReminderModal from './PaymentReminderModal';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: Date) => {
    if (!date) return '';
     const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {timeZone: 'UTC'}).format(d);
}

const getStatusChip = (status: string) => {
    switch (status) {
        case 'Pendente': return 'bg-amber-100 text-amber-800';
        case 'Pago em dia': return 'bg-green-100 text-green-800';
        case 'Pago com atraso': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-slate-100 text-slate-800';
    }
};

interface DashboardProps {
    installments: PaymentInstallment[];
    contracts: Contract[];
    schedules: ProjectSchedule[];
    projectProgress: ProjectProgress[];
    otherPayments: OtherPayment[];
    expenses: Expense[];
    appointments?: Appointment[];
}


const Dashboard: React.FC<DashboardProps> = ({ installments, contracts, schedules, projectProgress, otherPayments, expenses, appointments = [] }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [isFloatingAgendaOpen, setIsFloatingAgendaOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);
    const [selectedClientFilter, setSelectedClientFilter] = useState('');

    const handleOpenReminderModal = (installment: PaymentInstallment) => {
        setSelectedInstallment(installment);
        setIsReminderModalOpen(true);
    };

    const handleCloseReminderModal = () => {
        setSelectedInstallment(null);
        setIsReminderModalOpen(false);
    };
    
    const attentionPoints: AttentionPoint[] = useMemo(() => {
        const points: AttentionPoint[] = [];
        schedules.forEach(schedule => {
            const contractIsActive = contracts.some(c => c.id === schedule.contractId && c.status === 'Ativo');
            if (!contractIsActive) return;
            const nextStage = schedule.stages.find(s => !s.completionDate);
            if (nextStage && nextStage.deadline) {
                const deadline = new Date(nextStage.deadline);
                deadline.setHours(0,0,0,0);
                if (deadline >= today) {
                    const diffTime = deadline.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 7) {
                        points.push({ clientName: schedule.clientName, description: `Etapa "${nextStage.name}" vence em ${diffDays} dia(s).`, daysRemaining: diffDays, type: 'stage' });
                    }
                }
            }
        });
        
        // Alerta simplificado para entradas pendentes
        installments.forEach(inst => {
            if (inst.installment.toUpperCase().includes('ENTRADA') && inst.status === 'Pendente') {
                const dueDate = new Date(inst.dueDate);
                if (dueDate < today) {
                    points.push({ 
                        clientName: inst.clientName, 
                        description: `ENTRADA EM ATRASO DESDE ${formatDate(dueDate)}.`, 
                        daysRemaining: 0, 
                        type: 'alert' 
                    });
                }
            }
        });

        return points.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [schedules, contracts, installments]);

    const financialAttentionPoints: AttentionPoint[] = useMemo(() => {
        const points: AttentionPoint[] = [];
        installments.forEach(inst => {
            if (inst.status === 'Pendente') {
                const dueDate = new Date(inst.dueDate);
                dueDate.setHours(0,0,0,0);
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= 7) {
                    points.push({ clientName: inst.clientName, description: `Parcela ${inst.installment} (${formatCurrency(inst.value)}) vence ${diffDays === 0 ? 'hoje' : `em ${diffDays} dia(s)`}.`, daysRemaining: diffDays, type: 'payment' });
                }
            }
        });
        return points.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [installments]);
    
    const { receivedThisMonth, expectedThisMonth, totalOverdue } = useMemo(() => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        let receivedThisMonth = 0; let expectedThisMonth = 0; let totalOverdue = 0;
        installments.forEach(i => {
            if(i.paymentDate) {
                const paymentDate = new Date(i.paymentDate);
                if(paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === currentMonth) receivedThisMonth += i.value;
            }
            const dueDate = new Date(i.dueDate);
            if (i.status === 'Pendente') {
                if (dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth) expectedThisMonth += i.value;
                const dDate = new Date(i.dueDate);
                dDate.setHours(0,0,0,0);
                if (dDate < today) totalOverdue += i.value;
            }
        });
        otherPayments.forEach(op => {
            const paymentDate = new Date(op.paymentDate);
            if(paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === currentMonth) receivedThisMonth += op.value;
        });
        return { receivedThisMonth, expectedThisMonth, totalOverdue };
    }, [installments, otherPayments]);
    
    const upcomingInstallments = installments
        .filter(i => i.status === 'Pendente' && new Date(i.dueDate) >= today)
        .filter(i => selectedClientFilter ? i.clientName === selectedClientFilter : true)
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        
    const uniqueClients = useMemo(() => {
        const clients = new Set(installments.map(i => i.clientName));
        return Array.from(clients).sort();
    }, [installments]);

    const upcomingAppointments = useMemo(() => {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        return appointments
            .filter(a => !a.completed)
            .filter(a => {
                const appDate = new Date(a.date + 'T00:00:00');
                return appDate >= today && appDate <= nextWeek;
            })
            .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    }, [appointments]);

    const { cashFlowData, expenseData, summaryMetrics } = useMemo(() => {
        const cashFlow = []; const currentYear = today.getFullYear();
        for (let i = 0; i <= 11; i++) {
            const date = new Date(currentYear, i, 1);
            const month = date.getMonth();
            const label = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
            let entry = 0; let exit = 0;
            installments.forEach(inst => { if (inst.paymentDate) { const d = new Date(inst.paymentDate); if (d.getMonth() === month && d.getFullYear() === currentYear) entry += inst.value; } });
            otherPayments.forEach(op => { const d = new Date(op.paymentDate); if (d.getMonth() === month && d.getFullYear() === currentYear) entry += op.value; });
            expenses.forEach(exp => { const d = new Date(exp.paidDate || exp.dueDate); if (d.getMonth() === month && d.getFullYear() === currentYear) exit += exp.amount; });
            cashFlow.push({ name: label, Entradas: entry, Saídas: exit });
        }
        const currentMonth = today.getMonth();
        let fixedExp = 0; let varExp = 0;
        expenses.forEach(exp => { const expDate = new Date(exp.dueDate + 'T12:00:00'); if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) { if (exp.category === 'Fixa') fixedExp += exp.amount; else varExp += exp.amount; } });
        const pieData = [ { name: 'Fixas', value: fixedExp, color: '#f59e0b' }, { name: 'Variáveis', value: varExp, color: '#0ea5e9' } ];
        let recOpen = 0; let recLate = 0; let recPaidMonth = 0;
        installments.forEach(inst => { const due = new Date(inst.dueDate); if (inst.status === 'Pendente') { if (due < today) recLate += inst.value; else recOpen += inst.value; } else if (inst.paymentDate) { const pd = new Date(inst.paymentDate); if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) recPaidMonth += inst.value; } });
        let payOpen = 0; let payLate = 0; let payPaidMonth = 0;
        expenses.forEach(exp => { const due = new Date(exp.dueDate); if (exp.status === 'Pendente') { if (due < today) payLate += exp.amount; else payOpen += exp.amount; } else if (exp.paidDate) { const pd = new Date(exp.paidDate); if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) payPaidMonth += exp.amount; } });
        return { cashFlowData: cashFlow, expenseData: pieData, summaryMetrics: { recOpen, recLate, recPaidMonth, payOpen, payLate, payPaidMonth } };
    }, [installments, otherPayments, expenses]);

  const postItColors = ['bg-amber-100 border-amber-200', 'bg-blue-100 border-blue-200', 'bg-green-100 border-green-200', 'bg-pink-100 border-pink-200', 'bg-purple-100 border-purple-200'];

  return (
    <div className="space-y-8 uppercase relative">
      <header className="bg-slate-900 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-2xl font-black uppercase tracking-tight">Painel de Controle Financeiro</h1>
                <p className="mt-1 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Acompanhe recebimentos, despesas e andamento dos projetos ativos.</p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
                <button onClick={() => setIsFloatingAgendaOpen(true)} className="flex items-center justify-center px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-[10px] tracking-[0.1em] hover:bg-blue-500 transition-all uppercase shadow-lg shadow-blue-500/20">
                    <CalendarIcon className="w-4 h-4 mr-2" /> VER AGENDA
                </button>
                <button className="flex items-center justify-center px-6 py-2 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-[10px] tracking-[0.1em] hover:bg-white/20 transition-all uppercase">
                    <DownloadIcon className="w-4 h-4 mr-2" /> RELATÓRIO GERAL
                </button>
            </div>
        </div>
      </header>

      {/* BOTÃO FLUTUANTE DE AGENDA NO CANTO DA TELA */}
      <button onClick={() => setIsFloatingAgendaOpen(true)} className="fixed bottom-8 right-8 z-[70] w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-bounce" title="Agenda da Semana">
        <CalendarIcon className="w-8 h-8" />
        {upcomingAppointments.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{upcomingAppointments.length}</span>}
      </button>

      {/* POPUP FLUTUANTE DA AGENDA (POST-ITS) */}
      {isFloatingAgendaOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><CalendarIcon className="w-6 h-6" /></div>
                          <div>
                              <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Compromissos Agendados</h2>
                              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Visualização de próximos passos na semana</p>
                          </div>
                      </div>
                      <button onClick={() => setIsFloatingAgendaOpen(false)} className="p-3 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 transition-all"><XIcon className="w-6 h-6" /></button>
                  </div>
                  <div className="p-8 overflow-y-auto no-scrollbar flex-1 bg-slate-50/30">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {upcomingAppointments.length > 0 ? upcomingAppointments.map((app, idx) => (
                            <div key={app.id} className={`p-6 rounded-lg border-2 shadow-sm transition-transform hover:-translate-y-1 hover:rotate-1 ${postItColors[idx % postItColors.length]}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-[9px] font-bold text-slate-500">{formatDate(new Date(app.date + 'T12:00:00'))}</span>
                                    <span className="text-[9px] font-bold bg-white/50 px-1.5 py-0.5 rounded text-slate-600">{app.time}</span>
                                </div>
                                <h3 className="text-sm font-bold text-slate-800 leading-tight mb-2 uppercase tracking-tighter line-clamp-2">{app.title}</h3>
                                {app.clientName && <p className="text-[8px] font-bold text-slate-400 mt-2 flex items-center gap-1 uppercase"><UsersIcon className="w-2.5 h-2.5" /> {app.clientName}</p>}
                            </div>
                        )) : (
                            <div className="col-span-full py-16 text-center">
                                <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Sem compromissos agendados</p>
                            </div>
                        )}
                      </div>
                  </div>
                  <div className="p-6 bg-white border-t border-slate-100 flex justify-center">
                      <button onClick={() => setIsFloatingAgendaOpen(false)} className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs tracking-widest uppercase">FECHAR PAINEL</button>
                  </div>
              </div>
          </div>
      )}
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="PREVISTO (MÊS)" value={formatCurrency(expectedThisMonth)} icon={<DollarIcon className="w-6 h-6 text-blue-500" />} />
        <StatCard title="RECEBIDO (MÊS)" value={formatCurrency(receivedThisMonth)} icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />} />
        <StatCard title="TOTAL ATRASADO" value={formatCurrency(totalOverdue)} icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />} />
        <StatCard title="CONTRATOS ATIVOS" value={contracts.filter(c => c.status === 'Ativo').length.toString()} icon={<DocumentIcon className="w-6 h-6 text-purple-500" />} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center mb-4">
            <HistoryIcon className="w-4 h-4 mr-2 text-blue-500" /> ALERTAS DE PROJETO
          </h2>
          <ul className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
            {attentionPoints.length > 0 ? attentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = point.type === 'alert' ? 'bg-red-600 animate-pulse' : 'bg-orange-500';
              return (
              <li key={index} className={`flex items-start p-3 rounded-xl border border-slate-50 transition-all hover:bg-slate-50 ${point.type === 'alert' ? 'bg-red-50 border-red-100' : ''}`}>
                <div className={`w-2.5 h-2.5 ${iconColor} rounded-full mt-1.5 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-bold text-xs text-slate-800 tracking-tight">{point.clientName}</p>
                  <p className={`text-[10px] font-semibold mt-1 ${point.type === 'alert' ? 'text-red-700' : 'text-slate-500'}`}>{point.description.toUpperCase()}</p>
                </div>
              </li>
              )
            }) : <p className="text-[10px] font-bold text-slate-400 py-4 uppercase">Sem pendências críticas detectadas.</p>}
          </ul>
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] flex items-center mb-4">
            <DollarIcon className="w-4 h-4 mr-2 text-amber-500" /> PRÓXIMOS RECEBIMENTOS
          </h2>
          <ul className="space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
            {financialAttentionPoints.length > 0 ? financialAttentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = 'bg-amber-500';
              return (
              <li key={index} className="flex items-start p-3 rounded-xl border border-slate-50 transition-all hover:bg-slate-50">
                <div className={`w-2.5 h-2.5 ${iconColor} rounded-full mt-1.5 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-bold text-xs text-slate-800 tracking-tight">{point.clientName}</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-1">{point.description.toUpperCase()}</p>
                </div>
              </li>
              )
            }) : <p className="text-[10px] font-bold text-slate-400 py-4 uppercase">Nenhum recebimento nos próximos 7 dias.</p>}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-[0.15em] flex items-center">
                <TrendingUpIcon className="w-5 h-5 mr-3 text-green-500" /> FLUXO DE CAIXA ANUAL
              </h2>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowData}>
                          <defs>
                              <linearGradient id="colorEntry" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                              <linearGradient id="colorExit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 'bold'}} formatter={(value: number) => formatCurrency(value)} />
                          <Legend wrapperStyle={{paddingTop: '25px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                          <Area type="monotone" dataKey="Entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntry)" strokeWidth={2.5} />
                          <Area type="monotone" dataKey="Saídas" stroke="#ef4444" fillOpacity={1} fill="url(#colorExit)" strokeWidth={2.5} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>
          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-[0.15em]">DESPESAS DO MÊS</h2>
              <div className="h-72 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie data={expenseData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={6} dataKey="value">
                              {expenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} stroke="none" />))}
                          </Pie>
                          <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase'}} />
                          <Tooltip contentStyle={{borderRadius: '12px', fontWeight: 'bold'}} formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center"><p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">TOTAL</p><p className="text-xl font-bold text-slate-800">{formatCurrency(expenseData.reduce((a, b) => a + b.value, 0))}</p></div>
                  </div>
              </div>
          </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-[0.15em] flex items-center"><MoneyBagIcon className="w-5 h-5 mr-3 text-green-500" /> FATURAMENTO ATIVO</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">EM ABERTO</p><p className="text-lg font-bold text-slate-800">{formatCurrency(summaryMetrics.recOpen)}</p></div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100"><p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2">ATRASADAS</p><p className="text-lg font-bold text-red-600">{formatCurrency(summaryMetrics.recLate)}</p></div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100"><p className="text-[9px] font-bold text-green-400 uppercase tracking-widest mb-2">PAGO (MÊS)</p><p className="text-lg font-bold text-green-700">{formatCurrency(summaryMetrics.recPaidMonth)}</p></div>
              </div>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-[10px] font-bold text-slate-500 mb-8 uppercase tracking-[0.15em] flex items-center"><CreditCardIcon className="w-4 h-4 mr-3 text-red-500" /> CUSTOS OPERACIONAIS</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">A VENCER</p><p className="text-lg font-bold text-slate-800">{formatCurrency(summaryMetrics.payOpen)}</p></div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100"><p className="text-[9px] font-bold text-red-400 uppercase tracking-widest mb-2">VENCIDAS</p><p className="text-lg font-bold text-red-600">{formatCurrency(summaryMetrics.payLate)}</p></div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100"><p className="text-[9px] font-bold text-green-400 uppercase tracking-widest mb-2">LIQUIDADO</p><p className="text-lg font-bold text-green-700">{formatCurrency(summaryMetrics.payPaidMonth)}</p></div>
              </div>
          </div>
      </section>

      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">AGENDA DE RECEBIMENTOS</h2>
            <select value={selectedClientFilter} onChange={e => setSelectedClientFilter(e.target.value)} className="block rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-[10px] font-bold h-9 px-4 uppercase bg-slate-50 outline-none">
                <option value="">TODOS OS CLIENTES</option>
                {uniqueClients.map(client => (<option key={client} value={client}>{client}</option>))}
            </select>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CLIENTE</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">PARCELA</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">VENCIMENTO</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">VALOR</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">STATUS</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">COBRANÇA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {upcomingInstallments.map((payment: PaymentInstallment) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-bold text-slate-800">{payment.clientName}</td>
                  <td className="p-4 text-xs font-semibold text-slate-500">{payment.installment.toUpperCase()}</td>
                  <td className="p-4 text-xs font-bold text-slate-700">{formatDate(new Date(payment.dueDate))}</td>
                  <td className="p-4 text-xs font-bold text-blue-600">{formatCurrency(payment.value)}</td>
                  <td className="p-4"><span className={`px-3 py-1 text-[9px] font-bold rounded-full uppercase tracking-tighter ${getStatusChip(payment.status)}`}>{payment.status}</span></td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleOpenReminderModal(payment)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Enviar WhatsApp"><SendIcon className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
               {upcomingInstallments.length === 0 && (<tr><td colSpan={6} className="text-center p-12 text-[10px] font-bold text-slate-300 uppercase italic">Nenhuma parcela pendente {selectedClientFilter ? 'para este cliente' : ''}.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
      
      <PaymentReminderModal isOpen={isReminderModalOpen} onClose={handleCloseReminderModal} installment={selectedInstallment} />
    </div>
  );
};

export default Dashboard;
