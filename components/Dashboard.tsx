
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
  SendIcon
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

// FIX: Added getStatusChip helper function to resolve the "Cannot find name 'getStatusChip'" error
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

        return points.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [schedules, contracts]);

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
    <div className="space-y-8">
      <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <h1 className="text-3xl font-bold">Painel de Controle E-Projet</h1>
                <p className="mt-1 text-blue-100">
                    Visão geral dos seus projetos e recebimentos
                </p>
            </div>
            <button className="mt-4 sm:mt-0 flex items-center justify-center px-4 py-2 bg-white/20 border border-white/30 text-white rounded-lg shadow-sm hover:bg-white/30 transition-colors">
                <DownloadIcon className="w-5 h-5 mr-2" />
                Exportar Excel
            </button>
        </div>
      </header>
      
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Previsto (Mês Atual)"
          value={formatCurrency(expectedThisMonth)}
          icon={<DollarIcon className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="Recebido (Mês Atual)"
          value={formatCurrency(receivedThisMonth)}
          icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="Total Atrasado"
          value={formatCurrency(totalOverdue)}
          icon={<ExclamationTriangleIcon className="w-6 h-6 text-red-500" />}
        />
        <StatCard
          title="Contratos Ativos"
          value={contracts.filter(c => c.status === 'Ativo').length.toString()}
          icon={<DocumentIcon className="w-6 h-6 text-purple-500" />}
        />
      </section>

      {/* Alertas Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Prazos de Etapas</h2>
          <ul className="mt-4 space-y-4 max-h-64 overflow-y-auto">
            {attentionPoints.length > 0 ? attentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = 'bg-orange-500'; // For stages
              return (
              <li key={index} className="flex items-start">
                <div className={`w-2.5 h-2.5 ${iconColor} rounded-full mt-1.5 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-semibold text-slate-700">{point.clientName}</p>
                  <p className="text-sm text-slate-500">{point.description}</p>
                </div>
              </li>
              )
            }) : <p className="text-sm text-slate-500">Nenhum prazo próximo nos próximos 7 dias.</p>}
          </ul>
        </div>
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Próximos Pagamentos</h2>
          <ul className="mt-4 space-y-4 max-h-64 overflow-y-auto">
            {financialAttentionPoints.length > 0 ? financialAttentionPoints.map((point: AttentionPoint, index: number) => {
              const iconColor = 'bg-amber-500';
              return (
              <li key={index} className="flex items-start">
                <div className={`w-2.5 h-2.5 ${iconColor} rounded-full mt-1.5 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-semibold text-slate-700">{point.clientName}</p>
                  <p className="text-sm text-slate-500">{point.description}</p>
                </div>
              </li>
              )
            }) : <p className="text-sm text-slate-500">Nenhum pagamento vencendo nos próximos 7 dias.</p>}
          </ul>
        </div>
      </section>

      {/* Financial Charts & Summary Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash Flow Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Fluxo de Caixa (Janeiro - Dezembro)</h2>
              <div className="h-64 w-full">
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
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} tickFormatter={(value) => `${value/1000}k`} />
                          <Tooltip 
                              contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}}
                              formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend wrapperStyle={{paddingTop: '20px'}} />
                          <Area type="monotone" dataKey="Entradas" stroke="#10b981" fillOpacity={1} fill="url(#colorEntry)" strokeWidth={2} />
                          <Area type="monotone" dataKey="Saídas" stroke="#ef4444" fillOpacity={1} fill="url(#colorExit)" strokeWidth={2} />
                      </AreaChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Expense Breakdown */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Despesas</h2>
              <div className="h-64 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={expenseData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {expenseData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Legend 
                              layout="horizontal" 
                              verticalAlign="bottom" 
                              align="center"
                              iconType="circle"
                          />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                          <p className="text-[10px] text-slate-500 uppercase font-black">Total Despesas</p>
                          <p className="text-lg font-black text-slate-800">{formatCurrency(expenseData.reduce((a, b) => a + b.value, 0))}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Mês Corrente</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Summary Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recebimentos Widget */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Recebimentos</h2>
              <div className="space-y-6">
                  <div className="flex items-center">
                      <div className="w-1.5 h-12 bg-yellow-400 rounded-full mr-4"></div>
                      <div>
                          <p className="text-sm text-slate-500">Faturas em aberto</p>
                          <p className="text-xl font-bold text-slate-800">{formatCurrency(summaryMetrics.recOpen)}</p>
                      </div>
                  </div>
                  <div className="flex items-center">
                      <div className="w-1.5 h-12 bg-red-500 rounded-full mr-4"></div>
                      <div>
                          <p className="text-sm text-slate-500">Faturas em atraso</p>
                          <p className="text-xl font-bold text-slate-800">{formatCurrency(summaryMetrics.recLate)}</p>
                      </div>
                  </div>
                  <div className="flex items-center">
                      <div className="w-1.5 h-12 bg-green-500 rounded-full mr-4"></div>
                      <div>
                          <p className="text-sm text-slate-500">Pago(s) em Esse mês</p>
                          <p className="text-xl font-bold text-slate-800">{formatCurrency(summaryMetrics.recPaidMonth)}</p>
                      </div>
                  </div>
              </div>
          </div>

          {/* Pagamentos Widget */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Pagamentos (Despesas)</h2>
              <div className="space-y-6">
                  <div className="flex items-center">
                      <div className="w-1.5 h-12 bg-yellow-400 rounded-full mr-4"></div>
                      <div>
                          <p className="text-sm text-slate-500">A vencer</p>
                          <p className="text-xl font-bold text-slate-800">{formatCurrency(summaryMetrics.payOpen)}</p>
                      </div>
                  </div>
                  <div className="flex items-center">
                      <div className="w-1.5 h-12 bg-red-500 rounded-full mr-4"></div>
                      <div>
                          <p className="text-sm text-slate-500">Atrasadas</p>
                          <p className="text-xl font-bold text-slate-800">{formatCurrency(summaryMetrics.payLate)}</p>
                      </div>
                  </div>
                  <div className="flex items-center">
                      <div className="w-1.5 h-12 bg-green-500 rounded-full mr-4"></div>
                      <div>
                          <p className="text-sm text-slate-500">Pago(s) em Esse mês</p>
                          <p className="text-xl font-bold text-slate-800">{formatCurrency(summaryMetrics.payPaidMonth)}</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Próximas Parcelas a Receber</h2>
            <select 
                value={selectedClientFilter} 
                onChange={e => setSelectedClientFilter(e.target.value)}
                className="block rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-2"
            >
                <option value="">Todos os Clientes</option>
                {uniqueClients.map(client => (
                    <option key={client} value={client}>{client}</option>
                ))}
            </select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-200">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-500">Cliente</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Parcela</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Vencimento</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Valor</th>
                <th className="p-3 text-sm font-semibold text-slate-500">Status</th>
                <th className="p-3 text-sm font-semibold text-slate-500 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {upcomingInstallments.map((payment: PaymentInstallment) => (
                <tr key={payment.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="p-3 text-slate-700">{payment.clientName}</td>
                  <td className="p-3 text-slate-700">{payment.installment}</td>
                  <td className="p-3 text-slate-700">{formatDate(new Date(payment.dueDate))}</td>
                  <td className="p-3 text-slate-700">{formatCurrency(payment.value)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusChip(payment.status)}`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleOpenReminderModal(payment)}
                      className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                      aria-label="Enviar Lembrete"
                      title="Enviar Lembrete"
                    >
                      <SendIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
               {upcomingInstallments.length === 0 && (
                <tr>
                    <td colSpan={6} className="text-center p-4 text-slate-500">Nenhuma parcela pendente {selectedClientFilter ? 'para este cliente' : ''}.</td>
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
