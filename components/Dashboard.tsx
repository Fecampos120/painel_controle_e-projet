
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
  /* Fix: Added missing imports for TrendingUpIcon and CreditCardIcon */
  TrendingUpIcon,
  CreditCardIcon
} from './Icons';
import { PaymentInstallment, AttentionPoint, Contract, ProjectProgress, OtherPayment, ProjectSchedule, Expense } from '../types';
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
}


const Dashboard: React.FC<DashboardProps> = ({ installments, contracts, schedules, projectProgress, otherPayments, expenses }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
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
        
        // Upcoming Stage Deadlines (next 7 days)
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
                        points.push({
                            clientName: schedule.clientName,
                            description: `Etapa "${nextStage.name}" vence em ${diffDays} dia(s).`,
                            daysRemaining: diffDays,
                            type: 'stage',
                        });
                    }
                }
            }
        });

        // REGRAS DE ASSINATURA SEM PAGAMENTO (5 DIAS)
        contracts.forEach(c => {
            if (c.contractSigningDate && c.status === 'Ativo') {
                const signing = new Date(c.contractSigningDate);
                const entry = installments.find(i => i.contractId === c.id && i.installment.toUpperCase().includes('ENTRADA'));
                
                if (entry && entry.status === 'Pendente') {
                    const diffTime = today.getTime() - signing.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays >= 5) {
                        points.push({
                            clientName: c.clientName,
                            description: `Assinado há ${diffDays} dias e entrada continua PENDENTE.`,
                            daysRemaining: 0,
                            type: 'alert',
                        });
                    }
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

                // Only show upcoming payments (0 to 7 days), exclude overdue
                if (diffDays >= 0 && diffDays <= 7) {
                    points.push({
                        clientName: inst.clientName,
                        description: `Parcela ${inst.installment} (${formatCurrency(inst.value)}) vence ${diffDays === 0 ? 'hoje' : `em ${diffDays} dia(s)`}.`,
                        daysRemaining: diffDays,
                        type: 'payment',
                    });
                }
            }
        });

        return points.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [installments]);
    
    const { receivedThisMonth, expectedThisMonth, totalOverdue } = useMemo(() => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let receivedThisMonth = 0;
        let expectedThisMonth = 0;
        let totalOverdue = 0;

        installments.forEach(i => {
            // Recebido no Mês
            if(i.paymentDate) {
                const paymentDate = new Date(i.paymentDate);
                const paymentYear = paymentDate.getFullYear();
                if(paymentYear === currentYear && paymentDate.getMonth() === currentMonth) {
                    receivedThisMonth += i.value;
                }
            }
            
            // Previsto/Pendente no Mês
            const dueDate = new Date(i.dueDate);
            if (i.status === 'Pendente') {
                if (dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth) {
                    expectedThisMonth += i.value;
                }
                // Total Atrasado
                const dDate = new Date(i.dueDate);
                dDate.setHours(0,0,0,0);
                if (dDate < today) {
                    totalOverdue += i.value;
                }
            }
        });
        
        otherPayments.forEach(op => {
            const paymentDate = new Date(op.paymentDate);
            const paymentYear = paymentDate.getFullYear();
            if(paymentYear === currentYear && paymentDate.getMonth() === currentMonth) {
                receivedThisMonth += op.value;
            }
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

    // Financial Charts Data Calculation
    const { cashFlowData, expenseData, summaryMetrics } = useMemo(() => {
        // Cash Flow (Full Year - Jan to Dec)
        const cashFlow = [];
        const currentYear = today.getFullYear();

        for (let i = 0; i <= 11; i++) {
            const date = new Date(currentYear, i, 1);
            const month = date.getMonth();
            const label = date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();

            let entry = 0;
            let exit = 0;

            installments.forEach(inst => {
                if (inst.paymentDate) {
                    const d = new Date(inst.paymentDate);
                    if (d.getMonth() === month && d.getFullYear() === currentYear) entry += inst.value;
                }
            });
            otherPayments.forEach(op => {
                const d = new Date(op.paymentDate);
                if (d.getMonth() === month && d.getFullYear() === currentYear) entry += op.value;
            });
            expenses.forEach(exp => {
                const d = new Date(exp.paidDate || exp.dueDate);
                if (d.getMonth() === month && d.getFullYear() === currentYear) exit += exp.amount;
            });

            cashFlow.push({ name: label, Entradas: entry, Saídas: exit });
        }

        // Expense Pie Chart - FILTRO POR MÊS CORRENTE
        const currentMonth = today.getMonth();
        let fixedExp = 0;
        let varExp = 0;
        expenses.forEach(exp => {
            const expDate = new Date(exp.dueDate + 'T12:00:00');
            // Só considera se for do mês e ano atual
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                if (exp.category === 'Fixa') fixedExp += exp.amount;
                else varExp += exp.amount;
            }
        });
        const pieData = [
            { name: 'Fixas', value: fixedExp, color: '#f59e0b' }, // amber-500
            { name: 'Variáveis', value: varExp, color: '#0ea5e9' }, // sky-500
        ];

        // Summary Metrics (Vertical Bars)
        let recOpen = 0;
        let recLate = 0;
        let recPaidMonth = 0;

        installments.forEach(inst => {
            const due = new Date(inst.dueDate);
            if (inst.status === 'Pendente') {
                if (due < today) recLate += inst.value;
                else recOpen += inst.value;
            } else if (inst.paymentDate) {
                const pd = new Date(inst.paymentDate);
                if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
                    recPaidMonth += inst.value;
                }
            }
        });

        let payOpen = 0;
        let payLate = 0;
        let payPaidMonth = 0;

        expenses.forEach(exp => {
            const due = new Date(exp.dueDate);
            if (exp.status === 'Pendente') {
                if (due < today) payLate += exp.amount;
                else payOpen += exp.amount;
            } else if (exp.paidDate) {
                const pd = new Date(exp.paidDate);
                if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
                    payPaidMonth += exp.amount;
                }
            }
        });

        return { 
            cashFlowData: cashFlow, 
            expenseData: pieData, 
            summaryMetrics: { recOpen, recLate, recPaidMonth, payOpen, payLate, payPaidMonth } 
        };
    }, [installments, otherPayments, expenses]);


  return (
    <div className="space-y-8 uppercase">
      <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-3xl font-black tracking-tight">PAINEL E-PROJET</h1>
                <p className="mt-1 text-blue-100 font-bold text-sm">
                    GESTÃO FINANCEIRA E DE PROJETOS ATIVOS
                </p>
            </div>
            <button className="mt-4 sm:mt-0 flex items-center justify-center px-6 py-2.5 bg-white/20 border border-white/30 text-white rounded-xl font-black text-xs tracking-widest hover:bg-white/30 transition-all uppercase">
                <DownloadIcon className="w-5 h-5 mr-2" />
                RELATÓRIO GERAL
            </button>
        </div>
      </header>
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="PREVISTO (MÊS)"
          value={formatCurrency(expectedThisMonth)}
          icon={<DollarIcon className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="RECEBIDO (MÊS)"
          value={formatCurrency(receivedThisMonth)}
          icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="TOTAL ATRASADO"
          value={formatCurrency(totalOverdue)}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />}
        />
        <StatCard
          title="CONTRATOS ATIVOS"
          value={contracts.filter(c => c.status === 'Ativo').length.toString()}
          icon={<DocumentIcon className="w-6 h-6 text-purple-500" />}
        />
      </section>

      {/* Alertas Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
            <HistoryIcon className="w-5 h-5 mr-2 text-blue-500" /> ALERTAS DE PROJETO
          </h2>
          <ul className="mt-4 space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
            {attentionPoints.length > 0 ? attentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = point.type === 'alert' ? 'bg-red-600 animate-pulse' : 'bg-orange-500';
              return (
              <li key={index} className={`flex items-start p-3 rounded-xl border border-slate-50 transition-all hover:bg-slate-50 ${point.type === 'alert' ? 'bg-red-50 border-red-100' : ''}`}>
                <div className={`w-3 h-3 ${iconColor} rounded-full mt-1 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-black text-xs text-slate-800 tracking-tight">{point.clientName}</p>
                  <p className={`text-[11px] font-bold mt-1 ${point.type === 'alert' ? 'text-red-700' : 'text-slate-500'}`}>{point.description.toUpperCase()}</p>
                </div>
              </li>
              )
            }) : <p className="text-[10px] font-bold text-slate-400 py-4 uppercase">Sem pendências críticas detectadas.</p>}
          </ul>
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
            <DollarIcon className="w-5 h-5 mr-2 text-amber-500" /> PRÓXIMOS RECEBIMENTOS
          </h2>
          <ul className="mt-4 space-y-4 max-h-64 overflow-y-auto pr-2 no-scrollbar">
            {financialAttentionPoints.length > 0 ? financialAttentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = 'bg-amber-500';
              return (
              <li key={index} className="flex items-start p-3 rounded-xl border border-slate-50 transition-all hover:bg-slate-50">
                <div className={`w-3 h-3 ${iconColor} rounded-full mt-1 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-black text-xs text-slate-800 tracking-tight">{point.clientName}</p>
                  <p className="text-[11px] font-bold text-slate-500 mt-1">{point.description.toUpperCase()}</p>
                </div>
              </li>
              )
            }) : <p className="text-[10px] font-bold text-slate-400 py-4 uppercase">Nenhum recebimento nos próximos 7 dias.</p>}
          </ul>
        </div>
      </section>

      {/* Financial Charts & Summary Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center">
                <TrendingUpIcon className="w-5 h-5 mr-3 text-green-500" /> FLUXO DE CAIXA ANUAL
              </h2>
              <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowData}>
                          <defs>
                              <linearGradient id="colorEntry" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorExit" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip 
                              contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '10px', fontWeight: 'bold'}}
                              formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend wrapperStyle={{paddingTop: '25px', fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase'}} />
                          <Area type="monotone" dataKey="Entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntry)" strokeWidth={3} />
                          <Area type="monotone" dataKey="Saídas" stroke="#ef4444" fillOpacity={1} fill="url(#colorExit)" strokeWidth={3} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="lg:col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">DESPESAS DO MÊS</h2>
              <div className="h-72 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={expenseData}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={95}
                              paddingAngle={6}
                              dataKey="value"
                          >
                              {expenseData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                              ))}
                          </Pie>
                          <Legend 
                              layout="horizontal" 
                              verticalAlign="bottom" 
                              align="center"
                              iconType="circle"
                              wrapperStyle={{fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase'}}
                          />
                          <Tooltip contentStyle={{borderRadius: '12px', fontWeight: 'bold'}} formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">TOTAL</p>
                          <p className="text-xl font-black text-slate-800">{formatCurrency(expenseData.reduce((a, b) => a + b.value, 0))}</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Summary Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center">
                <MoneyBagIcon className="w-5 h-5 mr-3 text-green-500" /> FATURAMENTO ATIVO
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">EM ABERTO</p>
                      <p className="text-lg font-black text-slate-800">{formatCurrency(summaryMetrics.recOpen)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">ATRASADAS</p>
                      <p className="text-lg font-black text-red-600">{formatCurrency(summaryMetrics.recLate)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-2">PAGO (MÊS)</p>
                      <p className="text-lg font-black text-green-700">{formatCurrency(summaryMetrics.recPaidMonth)}</p>
                  </div>
              </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-black text-slate-800 mb-8 uppercase tracking-widest flex items-center">
                <CreditCardIcon className="w-5 h-5 mr-3 text-red-500" /> CUSTOS OPERACIONAIS
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">A VENCER</p>
                      <p className="text-lg font-black text-slate-800">{formatCurrency(summaryMetrics.payOpen)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-2">VENCIDAS</p>
                      <p className="text-lg font-black text-red-600">{formatCurrency(summaryMetrics.payLate)}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-2">LIQUIDADO</p>
                      <p className="text-lg font-black text-green-700">{formatCurrency(summaryMetrics.payPaidMonth)}</p>
                  </div>
              </div>
          </div>
      </section>

      <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">AGENDA DE RECEBIMENTOS</h2>
            <select 
                value={selectedClientFilter} 
                onChange={e => setSelectedClientFilter(e.target.value)}
                className="block rounded-xl border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-[10px] font-black h-10 px-4 uppercase bg-slate-50"
            >
                <option value="">TODOS OS CLIENTES</option>
                {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                ))}
            </select>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-50">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">CLIENTE</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">PARCELA</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">VENCIMENTO</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">VALOR</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUS</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">COBRANÇA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {upcomingInstallments.map((payment: PaymentInstallment) => (
                <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-black text-slate-800">{payment.clientName}</td>
                  <td className="p-4 text-xs font-bold text-slate-500">{payment.installment.toUpperCase()}</td>
                  <td className="p-4 text-xs font-black text-slate-700">{formatDate(new Date(payment.dueDate))}</td>
                  <td className="p-4 text-xs font-black text-blue-600">{formatCurrency(payment.value)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-tighter ${getStatusChip(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleOpenReminderModal(payment)}
                      className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      title="Enviar WhatsApp"
                    >
                      <SendIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
               {upcomingInstallments.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center p-12 text-[10px] font-black text-slate-300 uppercase italic">Nenhuma parcela pendente {selectedClientFilter ? 'para este cliente' : ''}.</td>
                </tr>
               )}
            </tbody>
          </table>
        </div>
      </section>
      
      <PaymentReminderModal 
        isOpen={isReminderModalOpen}
        onClose={handleCloseReminderModal}
        installment={selectedInstallment}
      />
    </div>
  );
};

export default Dashboard;
