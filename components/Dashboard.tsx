import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatCard from './StatCard';
import {
  DownloadIcon,
  MoneyBagIcon,
  DollarIcon,
  ChartBarIcon,
  DocumentIcon,
  SendIcon,
} from './Icons';
import { GANTT_STAGES_CONFIG } from '../constants';
import { PaymentInstallment, AttentionPoint, Contract, ProjectProgress, OtherPayment, ProjectSchedule, StageProgress } from '../types';
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

const ProjectStatusChart: React.FC<{ contracts: Contract[], schedules: ProjectSchedule[] }> = ({ contracts, schedules }) => {
    const projectStatusData = useMemo(() => {
        const statuses = {
            'No Prazo': 0,
            'Em Risco': 0,
            'Atrasado': 0,
        };

        const activeContracts = contracts.filter(c => c.status === 'Ativo');

        activeContracts.forEach(contract => {
            const schedule = schedules.find(s => s.contractId === contract.id);
            let status: 'No Prazo' | 'Em Risco' | 'Atrasado' = 'No Prazo';
            
            if (schedule) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                for (const stage of schedule.stages) {
                    if (!stage.completionDate && stage.deadline) {
                        const deadline = new Date(stage.deadline);
                        deadline.setHours(0, 0, 0, 0);
                        const diffTime = deadline.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays < 0) {
                            status = 'Atrasado';
                            break; // Once a project is late, it's late.
                        }
                        if (diffDays <= 7) {
                            status = 'Em Risco';
                            // Don't break, continue checking for a late stage
                        }
                    }
                }
            }
            statuses[status]++;
        });

        return [
            { name: 'No Prazo', value: statuses['No Prazo'], color: '#22c55e' }, // green-500
            { name: 'Em Risco', value: statuses['Em Risco'], color: '#f97316' }, // orange-500
            { name: 'Atrasado', value: statuses['Atrasado'], color: '#ef4444' }, // red-500
        ];
    }, [contracts, schedules]);
    
    const totalProjects = projectStatusData.reduce((sum, entry) => sum + entry.value, 0);

    return (
        <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={90}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        labelLine={false}
                    >
                        {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Legend
                        iconSize={10}
                        iconType="circle"
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        formatter={(value, entry) => (
                            <span className="text-slate-600 ml-2">{`${value} (${entry.payload?.value})`}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                    <p className="text-4xl font-bold text-slate-800">{totalProjects}</p>
                    <p className="text-sm text-slate-500">Ativos</p>
                </div>
            </div>
        </div>
    );
};


const ProjectStageChart: React.FC<{
  projectProgress: ProjectProgress[];
  contracts: Contract[];
}> = ({ projectProgress, contracts }) => {
  const [filterStage, setFilterStage] = useState<string>('all');
  const stageNames = GANTT_STAGES_CONFIG.map(s => s.name);

  const filteredProjects = useMemo(() => {
    const activeProjects = projectProgress.filter(p =>
      contracts.some(c => c.id === p.contractId && c.status === 'Ativo')
    );

    if (filterStage === 'all') {
      return activeProjects.filter(p => p.stages.some(s => s.status === 'in_progress'));
    }

    return activeProjects.filter(project =>
      project.stages.some(stage => stage.name === filterStage && stage.status === 'in_progress')
    );
  }, [filterStage, projectProgress, contracts]);
  
  const gridColsTemplate = `minmax(120px, 1.5fr) repeat(${stageNames.length}, minmax(0, 2fr))`;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-2 sm:mb-0">Posição dos Projetos por Etapa</h2>
          <div className="flex items-center">
              <label htmlFor="stage-filter" className="text-sm font-medium text-slate-600 mr-2 whitespace-nowrap">Filtrar por etapa em progresso:</label>
              <select
                  id="stage-filter"
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-9 px-3 bg-white"
              >
                  <option value="all">Mostrar Tudo</option>
                  {stageNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                  ))}
              </select>
          </div>
      </div>
      
      <div className="grid gap-x-2 gap-y-1" style={{ gridTemplateColumns: gridColsTemplate }}>
        {/* Header Row using 'contents' so its children are direct grid items */}
        <div className="contents">
          <div className="text-left text-sm font-semibold text-slate-800 pb-2 self-end">Cliente</div>
          {stageNames.map(name => (
            <div key={name} className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider pb-2">
              {name}
            </div>
          ))}
        </div>

        {/* Separator */}
        <div className="col-span-full border-b border-slate-200 mb-2" style={{ gridColumn: `1 / span ${stageNames.length + 1}` }}></div>


        {/* Project Rows */}
        {filteredProjects.map(project => (
          <div key={project.contractId} className="contents">
            <div className="text-sm font-medium text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis pr-2 self-center py-2">
              {project.clientName}
            </div>
            {stageNames.map(stageName => {
              const stage = project.stages.find(s => s.name === stageName);
              
              let barStyle = 'bg-slate-100'; // Pending
              let title = `${stageName}: Pendente`;

              if (stage) {
                if (stage.status === 'completed') {
                  barStyle = 'bg-green-500';
                  title = `${stageName}: Concluído`;
                } else if (stage.status === 'in_progress') {
                  barStyle = 'bg-yellow-400';
                  title = `${stageName}: Em Progresso`;
                }
              }
              
              return (
                <div key={stageName} className="h-6 rounded my-1" title={title}>
                   <div className={`h-full w-full rounded-sm ${barStyle} transition-colors duration-300`}></div>
                </div>
              );
            })}
          </div>
        ))}
        {filteredProjects.length === 0 && (
            <div className="text-center text-slate-500 py-4 mt-2" style={{ gridColumn: `1 / span ${stageNames.length + 1}` }}>
                {filterStage === 'all'
                    ? 'Nenhum projeto em andamento para exibir.'
                    : `Nenhum projeto ativo na etapa "${filterStage}".`
                }
            </div>
        )}
      </div>
    </div>
  );
};

const PaymentRegistration: React.FC<{
    installments: PaymentInstallment[];
    onRegisterInstallment: (installmentId: number, paymentDate: Date) => void;
    onRegisterOther: (description: string, paymentDate: Date, value: number) => void;
}> = ({ installments, onRegisterInstallment, onRegisterOther }) => {
    const [activeTab, setActiveTab] = useState<'installment' | 'other'>('installment');

    // States for installment form
    const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    
    // States for other payment form
    const [otherDesc, setOtherDesc] = useState('');
    const [otherDate, setOtherDate] = useState(new Date().toISOString().split('T')[0]);
    const [otherValue, setOtherValue] = useState('');

    const pendingInstallments = installments
        .filter(i => i.status === 'Pendente')
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const handleInstallmentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedInstallmentId || !paymentDate) {
            alert("Por favor, selecione uma parcela e a data de pagamento.");
            return;
        }
        onRegisterInstallment(parseInt(selectedInstallmentId), new Date(`${paymentDate}T00:00:00`));
        setSelectedInstallmentId('');
    };

    const handleOtherSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const valueNum = parseFloat(otherValue);
        if (!otherDesc || !otherDate || isNaN(valueNum) || valueNum <= 0) {
            alert("Por favor, preencha todos os campos com valores válidos.");
            return;
        }
        onRegisterOther(otherDesc, new Date(`${otherDate}T00:00:00`), valueNum);
        setOtherDesc('');
        setOtherValue('');
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="border-b border-slate-200 mb-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('installment')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'installment'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Registrar Parcela
                    </button>
                    <button
                        onClick={() => setActiveTab('other')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'other'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        Registrar Outros
                    </button>
                </nav>
            </div>
            
            {activeTab === 'installment' && (
                <form onSubmit={handleInstallmentSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label htmlFor="installment-select" className="block text-sm font-medium text-slate-600">Parcela Pendente</label>
                        <select id="installment-select" value={selectedInstallmentId} onChange={e => setSelectedInstallmentId(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3">
                            <option value="">Selecione uma parcela...</option>
                            {pendingInstallments.map(i => (
                                <option key={i.id} value={i.id}>
                                    {`${i.clientName} (${i.projectName}) - ${i.installment} de ${formatCurrency(i.value)} - Vence em ${formatDate(new Date(i.dueDate))}`}
                                </option>
                            ))}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="payment-date" className="block text-sm font-medium text-slate-600">Data do Pagamento</label>
                        <input type="date" id="payment-date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                    <div className="md:col-span-3">
                        <button type="submit" className="w-full md:w-auto justify-center rounded-md border border-transparent bg-blue-600 py-2 px-8 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            Registrar Pagamento de Parcela
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'other' && (
                <form onSubmit={handleOtherSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                     <div className="md:col-span-2">
                        <label htmlFor="other-desc" className="block text-sm font-medium text-slate-600">Descrição</label>
                        <input type="text" id="other-desc" value={otherDesc} onChange={e => setOtherDesc(e.target.value)} required placeholder="Ex: Consultoria extra" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="other-date" className="block text-sm font-medium text-slate-600">Data do Pagamento</label>
                        <input type="date" id="other-date" value={otherDate} onChange={e => setOtherDate(e.target.value)} required className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                     <div>
                        <label htmlFor="other-value" className="block text-sm font-medium text-slate-600">Valor (R$)</label>
                        <input type="number" id="other-value" value={otherValue} onChange={e => setOtherValue(e.target.value)} required placeholder="0.00" step="0.01" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"/>
                    </div>
                    <div className="md:col-span-4">
                        <button type="submit" className="w-full md:w-auto justify-center rounded-md border border-transparent bg-green-600 py-2 px-8 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                            Adicionar Recebimento
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

interface DashboardProps {
    installments: PaymentInstallment[];
    setInstallments: (installments: PaymentInstallment[]) => void;
    contracts: Contract[];
    schedules: ProjectSchedule[];
    projectProgress: ProjectProgress[];
    otherPayments: OtherPayment[];
    onAddOtherPayment: (newPayment: Omit<OtherPayment, 'id'>) => void;
}


const Dashboard: React.FC<DashboardProps> = ({ installments, setInstallments, contracts, schedules, projectProgress, otherPayments, onAddOtherPayment }) => {
    const today = new Date();
    today.setHours(0,0,0,0);

    const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<PaymentInstallment | null>(null);

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
        
        // 1. Overdue Installments
        installments.forEach(inst => {
            if (inst.status === 'Pendente' && new Date(inst.dueDate) < today) {
                const diffTime = today.getTime() - new Date(inst.dueDate).getTime();
                const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                points.push({
                    clientName: inst.clientName,
                    description: `Parcela ${inst.installment} (${formatCurrency(inst.value)}) vencida há ${daysOverdue} dia(s).`,
                    daysRemaining: -daysOverdue, // Negative for sorting
                    type: 'payment',
                });
            }
        });

        // 2. Upcoming Stage Deadlines (next 7 days)
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
        
        // 3. Upcoming Contract Expirations (next 30 days)
        contracts.forEach(contract => {
            if (contract.status === 'Ativo') {
                const contractDate = new Date(contract.date);
                const expirationDate = new Date(contractDate.setMonth(contractDate.getMonth() + contract.durationMonths));
                expirationDate.setHours(0,0,0,0);
                if(expirationDate >= today) {
                    const diffTime = expirationDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 30) {
                        points.push({
                            clientName: contract.clientName,
                            description: `Contrato "${contract.projectName}" vence em ${diffDays} dia(s).`,
                            daysRemaining: diffDays,
                            type: 'contract',
                        });
                    }
                }
            }
        });

        return points.sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [schedules, contracts, installments]);
    
    const { receivedThisMonth, receivedThisYear, toReceive } = useMemo(() => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        let receivedThisMonth = 0;
        let receivedThisYear = 0;
        let toReceive = 0;

        installments.forEach(i => {
            if(i.paymentDate) {
                const paymentDate = new Date(i.paymentDate);
                const paymentYear = paymentDate.getFullYear();
                if(paymentYear === currentYear) {
                    receivedThisYear += i.value;
                    if(paymentDate.getMonth() === currentMonth) {
                        receivedThisMonth += i.value;
                    }
                }
            }
            if(i.status === 'Pendente') {
                toReceive += i.value;
            }
        });
        
        otherPayments.forEach(op => {
            const paymentDate = new Date(op.paymentDate);
            const paymentYear = paymentDate.getFullYear();
            if(paymentYear === currentYear) {
                receivedThisYear += op.value;
                if(paymentDate.getMonth() === currentMonth) {
                    receivedThisMonth += op.value;
                }
            }
        });


        return { receivedThisMonth, receivedThisYear, toReceive };
    }, [installments, otherPayments]);
    
    const handleRegisterPayment = (installmentId: number, paymentDate: Date) => {
        setInstallments(
            installments.map(inst => {
                if (inst.id === installmentId) {
                    const dueDate = new Date(inst.dueDate);
                    dueDate.setHours(0,0,0,0);
                    paymentDate.setHours(0,0,0,0);
                    const status = paymentDate <= dueDate ? 'Pago em dia' : 'Pago com atraso';
                    return { ...inst, status, paymentDate: paymentDate };
                }
                return inst;
            })
        );
    };

    const handleAddOtherPayment = (description: string, paymentDate: Date, value: number) => {
        onAddOtherPayment({ description, paymentDate, value });
    };

    
    const getStatusChip = (status: PaymentInstallment['status']) => {
        switch (status) {
            case 'Pendente': return 'bg-amber-100 text-amber-800';
            case 'Pago em dia': return 'bg-green-100 text-green-800';
            case 'Pago com atraso': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };
    
    const upcomingInstallments = installments
        .filter(i => i.status === 'Pendente' && new Date(i.dueDate) >= today)
        .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);


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
      
      <section>
          <PaymentRegistration 
            installments={installments} 
            onRegisterInstallment={handleRegisterPayment}
            onRegisterOther={handleAddOtherPayment}
            />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Recebido Este Mês"
          value={formatCurrency(receivedThisMonth)}
          icon={<MoneyBagIcon className="w-6 h-6 text-green-500" />}
        />
        <StatCard
          title="Recebido Este Ano"
          value={formatCurrency(receivedThisYear)}
          icon={<DollarIcon className="w-6 h-6 text-blue-500" />}
        />
        <StatCard
          title="A Receber"
          value={formatCurrency(toReceive)}
          icon={<ChartBarIcon className="w-6 h-6 text-amber-500" />}
        />
        <StatCard
          title="Contratos Ativos"
          value={contracts.filter(c => c.status === 'Ativo').length.toString()}
          icon={<DocumentIcon className="w-6 h-6 text-purple-500" />}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Status dos Projetos Ativos</h2>
          <ProjectStatusChart contracts={contracts} schedules={schedules} />
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-lg font-semibold text-slate-800">Pontos de Atenção</h2>
          <ul className="mt-4 space-y-4">
            {attentionPoints.length > 0 ? attentionPoints.map((point: AttentionPoint, index: number) => {
              const getIconColor = () => {
                 if (point.daysRemaining < 0) return 'bg-red-500'; // Overdue payment
                 if (point.type === 'stage') return 'bg-orange-500';
                 if (point.type === 'contract') return 'bg-yellow-500';
                 return 'bg-slate-500';
              }
              return (
              <li key={index} className="flex items-start">
                <div className={`w-2.5 h-2.5 ${getIconColor()} rounded-full mt-1.5 mr-4 flex-shrink-0`}></div>
                <div>
                  <p className="font-semibold text-slate-700">{point.clientName}</p>
                  <p className="text-sm text-slate-500">{point.description}</p>
                </div>
              </li>
              )
            }) : <p className="text-sm text-slate-500">Nenhum ponto de atenção no momento.</p>}
          </ul>
        </div>
      </section>

      <section>
        <ProjectStageChart projectProgress={projectProgress} contracts={contracts} />
      </section>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-slate-800">Próximas Parcelas a Receber</h2>
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
                    <td colSpan={6} className="text-center p-4 text-slate-500">Nenhuma parcela pendente.</td>
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