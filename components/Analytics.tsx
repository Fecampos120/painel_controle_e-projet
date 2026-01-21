
import React, { useMemo } from 'react';
import { 
    ResponsiveContainer, 
    PieChart, 
    Pie, 
    Cell, 
    Legend, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid, 
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import { AppData, Contract, Budget, ProjectSchedule } from '../types';
import StatCard from './StatCard';
import { 
    MoneyBagIcon, 
    CheckCircleIcon, 
    XIcon, 
    ExclamationTriangleIcon, 
    TrendingUpIcon, 
    UsersIcon, 
    FileTextIcon,
    WalletIcon,
    ChartPieIcon,
    ArchitectIcon,
    HistoryIcon,
    SparklesIcon
} from './Icons';

interface AnalyticsProps {
    appData: AppData;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#475569'];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

const Analytics: React.FC<AnalyticsProps> = ({ appData }) => {
    const { contracts, budgets, schedules } = appData;

    const stats = useMemo(() => {
        const totalBudgets = budgets.length;
        const approvedBudgets = budgets.filter(b => b.status === 'Aprovado').length;
        const lostBudgets = budgets.filter(b => b.status === 'Perdido').length;
        const openBudgets = budgets.filter(b => b.status === 'Aberto').length;
        
        const conversionRate = totalBudgets > 0 ? (approvedBudgets / totalBudgets) * 100 : 0;
        
        // --- Análise por Categoria ---
        const categoryMap: Record<string, { count: number, revenue: number, delays: number }> = {};
        
        contracts.forEach(c => {
            const type = (c.serviceType || 'OUTROS').toUpperCase();
            if (!categoryMap[type]) categoryMap[type] = { count: 0, revenue: 0, delays: 0 };
            
            categoryMap[type].count += 1;
            categoryMap[type].revenue += (c.totalValue || 0);
            
            const schedule = schedules.find(s => s.contractId === c.id);
            if (schedule) {
                const today = new Date();
                today.setHours(0,0,0,0);
                const isDelayed = schedule.stages.some(st => !st.completionDate && st.deadline && new Date(`${st.deadline}T12:00:00`) < today);
                if (isDelayed) categoryMap[type].delays += 1;
            }
        });

        // --- Cálculo de Rentabilidade (Ticket Médio por Tipo) ---
        const profitabilityData = Object.entries(categoryMap).map(([name, data]) => ({
            name,
            count: data.count,
            revenue: data.revenue,
            avgTicket: data.revenue / (data.count || 1),
            efficiency: ((data.count - data.delays) / (data.count || 1)) * 100
        })).sort((a, b) => b.avgTicket - a.avgTicket);

        const mostProfitable = [...profitabilityData].sort((a,b) => b.avgTicket - a.avgTicket)[0];
        const highestRevenue = [...profitabilityData].sort((a,b) => b.revenue - a.revenue)[0];

        // Matriz Bubble (Volume vs Valor)
        const bubbleData = profitabilityData.map((item, idx) => ({
            name: item.name,
            volume: item.count,
            ticket: item.avgTicket,
            size: item.revenue,
            color: COLORS[idx % COLORS.length]
        }));

        // --- Análise por Disciplina (Arquitetônico vs Interiores) ---
        let archiCount = 0;
        let designCount = 0;
        contracts.forEach(c => {
            const hasArchi = c.services.some(s => s.serviceName.toUpperCase().includes('ARQUI'));
            const hasDesign = c.services.some(s => s.serviceName.toUpperCase().includes('INTERIOR') || s.serviceName.toUpperCase().includes('DESIGN'));
            if (hasArchi) archiCount++;
            if (hasDesign) designCount++;
        });

        return {
            conversionRate,
            avgTicketTotal: contracts.length > 0 ? (contracts.reduce((a, b) => a + b.totalValue, 0) / contracts.length) : 0,
            totalValue: contracts.reduce((a, b) => a + b.totalValue, 0),
            approvedBudgets,
            lostBudgets,
            openBudgets,
            totalBudgets,
            profitabilityData,
            bubbleData,
            archiCount,
            designCount,
            mostProfitable,
            highestRevenue,
            totalActive: contracts.filter(c => c.status === 'Ativo').length
        };
    }, [contracts, budgets, schedules]);

    return (
        <div className="space-y-8 animate-fadeIn uppercase pb-24">
            <header className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-xl -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center"><ChartPieIcon className="w-6 h-6" /></div>
                        <h1 className="text-3xl font-black tracking-tighter">BI & ANALYTICS</h1>
                    </div>
                    <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Inteligência aplicada à rentabilidade e performance do escritório.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-green-500/10 px-6 py-3 rounded-2xl border border-green-500/20 text-center">
                        <p className="text-[9px] font-black text-green-500 mb-1">MAIOR RENTABILIDADE (TICKET)</p>
                        <p className="text-xl font-black text-white">{stats.mostProfitable?.name || '-'}</p>
                    </div>
                </div>
            </header>

            {/* KPI PRINCIPAIS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Taxa de Conversão" value={`${stats.conversionRate.toFixed(1)}%`} icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} />
                <StatCard title="Ticket Médio Escritório" value={formatCurrency(stats.avgTicketTotal)} icon={<MoneyBagIcon className="w-6 h-6 text-blue-500" />} />
                <StatCard title="Valor Total Projetos" value={formatCurrency(stats.totalValue)} icon={<WalletIcon className="w-6 h-6 text-indigo-500" />} />
                <StatCard title="Total Propostas" value={stats.totalBudgets.toString()} icon={<FileTextIcon className="w-6 h-6 text-amber-500" />} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* FUNIL COMERCIAL */}
                <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                        <TrendingUpIcon className="w-5 h-5 mr-3 text-blue-600" /> Funil de Conversão Comercial
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                                { name: 'ORÇAMENTOS', valor: stats.totalBudgets },
                                { name: 'NEGOCIAÇÃO', valor: stats.openBudgets + stats.approvedBudgets },
                                { name: 'CONTRATOS', valor: stats.approvedBudgets }
                            ]}>
                                <defs>
                                    <linearGradient id="colorBI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorBI)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* MIX DE DISCIPLINAS */}
                <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
                    <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-10">Mix de Disciplinas</h3>
                    <div className="space-y-8">
                        <div>
                            <div className="flex justify-between text-[10px] font-black mb-2">
                                <span className="text-blue-400">ARQUITETURA</span>
                                <span>{stats.archiCount} PROJETOS</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${(stats.archiCount / (stats.archiCount + stats.designCount || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-black mb-2">
                                <span className="text-purple-400">INTERIORES</span>
                                <span>{stats.designCount} PROJETOS</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${(stats.designCount / (stats.archiCount + stats.designCount || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <p className="mt-10 text-[9px] text-slate-500 italic leading-relaxed">O SISTEMA IDENTIFICA A DISCIPLINA PELO TIPO DE SERVIÇO VINCULADO AO CONTRATO.</p>
                </div>
            </div>

            {/* MATRIZ DE RENTABILIDADE */}
            <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center">
                        <MoneyBagIcon className="w-5 h-5 mr-3 text-green-600" /> Matriz de Rentabilidade (Volume vs Ticket Médio)
                    </h3>
                </div>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis type="number" dataKey="volume" name="Qtd Projetos" unit=" un" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                            <YAxis type="number" dataKey="ticket" name="Ticket Médio" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} tickFormatter={(v) => `${v/1000}k`} />
                            <ZAxis type="number" dataKey="size" range={[200, 2000]} name="Receita Total" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '15px', border: 'none'}} />
                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                            {stats.bubbleData.map((entry, index) => (
                                <Scatter key={index} name={entry.name} data={[entry]} fill={entry.color} />
                            ))}
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <SparklesIcon className="w-6 h-6 text-yellow-500" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400">MAIOR TICKET (LUCRO POR PROJETO)</p>
                            <p className="text-sm font-black text-slate-800">{stats.mostProfitable?.name} - {formatCurrency(stats.mostProfitable?.avgTicket || 0)}</p>
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <HistoryIcon className="w-6 h-6 text-blue-500" />
                        <div>
                            <p className="text-[10px] font-black text-slate-400">MAIOR VOLUME COMERCIAL</p>
                            <p className="text-sm font-black text-slate-800">{stats.highestRevenue?.name} - {stats.highestRevenue?.count} PROJETOS</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* TABELA DE RANKING FINAL */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-10 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Análise Técnica por Categoria</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 tracking-[0.2em]">
                                <th className="p-6">CATEGORIA</th>
                                <th className="p-6 text-center">PROJETOS</th>
                                <th className="p-6">FATURAMENTO</th>
                                <th className="p-6">TICKET MÉDIO</th>
                                <th className="p-6 text-right">STATUS SAÚDE (PRAZO)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.profitabilityData.map((item, idx) => (
                                <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6"><span className="font-black text-slate-700">{item.name}</span></td>
                                    <td className="p-6 text-center font-bold text-slate-500">{item.count}</td>
                                    <td className="p-6 font-bold text-slate-800">{formatCurrency(item.revenue)}</td>
                                    <td className="p-6 font-black text-blue-600">{formatCurrency(item.avgTicket)}</td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${item.efficiency > 80 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${item.efficiency}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400">{item.efficiency.toFixed(0)}% OK</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default Analytics;
