
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

        // Encontrar os destaques
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

        // Radar Data
        const radarData = profitabilityData.map(item => ({
            subject: item.name,
            Ticket: item.avgTicket / 5000, // Escala
            Volume: item.count * 2, // Escala
            Saude: item.efficiency / 10
        }));

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
            radarData,
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
                        <h1 className="text-3xl font-black tracking-tighter">ESTRATÉGIA & RENTABILIDADE</h1>
                    </div>
                    <p className="text-slate-400 font-bold text-[10px] tracking-widest uppercase">Análise profunda de quais tipos de projeto geram maior lucro real.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-green-500/10 px-6 py-3 rounded-2xl border border-green-500/20 text-center">
                        <p className="text-[9px] font-black text-green-500 mb-1">MAIOR TICKET MÉDIO</p>
                        <p className="text-xl font-black text-white">{stats.mostProfitable?.name || '-'}</p>
                    </div>
                    <div className="bg-blue-500/10 px-6 py-3 rounded-2xl border border-blue-500/20 text-center">
                        <p className="text-[9px] font-black text-blue-500 mb-1">LÍDER DE FATURAMENTO</p>
                        <p className="text-xl font-black text-white">{stats.highestRevenue?.name || '-'}</p>
                    </div>
                </div>
            </header>

            {/* SEÇÃO DE HIGHLIGHTS DE RENTABILIDADE */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                        <MoneyBagIcon className="w-5 h-5 mr-3 text-green-600" /> Comparativo de Ticket Médio por Tipo (Lucratividade Real)
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.profitabilityData} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} />
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '20px', border: 'none', fontWeight: 'bold', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                                />
                                <Bar dataKey="avgTicket" fill="#10b981" radius={[0, 10, 10, 0]} barSize={35}>
                                    {stats.profitabilityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center">
                        <SparklesIcon className="w-4 h-4 mr-2 text-yellow-500" /> Dica BI: O Ticket Médio alto indica categorias onde você ganha mais por cada projeto assinado.
                    </div>
                </div>

                <div className="lg:col-span-1 bg-slate-900 p-10 rounded-[2.5rem] shadow-xl text-white flex flex-col justify-between">
                    <div>
                        <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-10">Insights de Nicho</h3>
                        <div className="space-y-8">
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[9px] font-black text-slate-500 mb-2">TOP RENTABILIDADE</p>
                                <p className="text-xl font-black text-white">{stats.mostProfitable?.name}</p>
                                <p className="text-sm font-black text-green-400 mt-1">{formatCurrency(stats.mostProfitable?.avgTicket || 0)} / PROJETO</p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                <p className="text-[9px] font-black text-slate-500 mb-2">TICKET MÉDIO GERAL</p>
                                <p className="text-xl font-black text-white">{formatCurrency(stats.avgTicketTotal)}</p>
                                <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-tighter">Comparativo base do escritório</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-10">
                        <div className="flex justify-between items-end">
                            <p className="text-[9px] font-black text-blue-500">MIX DE DISCIPLINAS</p>
                            <span className="text-[10px] font-bold text-slate-500">{stats.archiCount + stats.designCount} TOTAL</span>
                        </div>
                        <div className="flex h-3 w-full bg-white/10 rounded-full mt-3 overflow-hidden">
                            <div style={{ width: `${(stats.archiCount / (stats.archiCount + stats.designCount || 1)) * 100}%` }} className="bg-blue-500"></div>
                            <div style={{ width: `${(stats.designCount / (stats.archiCount + stats.designCount || 1)) * 100}%` }} className="bg-purple-500"></div>
                        </div>
                        <div className="flex justify-between mt-3">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><span className="text-[8px] font-black">ARQUITETURA</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-purple-500 rounded-full"></div><span className="text-[8px] font-black">INTERIORES</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* MATRIZ DE POSICIONAMENTO ESTRATÉGICO */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                        <TrendingUpIcon className="w-5 h-5 mr-3 text-indigo-600" /> Matriz de Força: Volume vs Ticket Médio
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis type="number" dataKey="volume" name="Projetos" unit=" un" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                                <YAxis type="number" dataKey="ticket" name="Ticket" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} tickFormatter={(v) => `${v/1000}k`} />
                                <ZAxis type="number" dataKey="size" range={[100, 1000]} name="Faturamento" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '15px', border: 'none'}} />
                                {stats.bubbleData.map((entry, index) => (
                                    <Scatter key={index} name={entry.name} data={[entry]} fill={entry.color} />
                                ))}
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-3 bg-blue-50 text-blue-700 text-[8px] font-black rounded-xl border border-blue-100 uppercase tracking-widest text-center">ALTO VOLUME (VENDAS)</div>
                        <div className="p-3 bg-green-50 text-green-700 text-[8px] font-black rounded-xl border border-green-100 uppercase tracking-widest text-center">ALTA RENTABILIDADE (LUCRO)</div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                        <ChartPieIcon className="w-5 h-5 mr-3 text-orange-600" /> Saúde Operacional por Categoria
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={stats.radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 9, fontWeight: 900}} />
                                <PolarRadiusAxis hide />
                                <Radar name="Score Operacional" dataKey="Saude" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                                <Radar name="Fator de Lucro" dataKey="Ticket" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                <Tooltip contentStyle={{borderRadius: '15px'}} />
                                <Legend wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* TABELA DE INTELIGÊNCIA FINANCEIRA */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-10 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Ranking de Performance Comercial</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 tracking-[0.2em]">
                                <th className="p-6">CATEGORIA</th>
                                <th className="p-6 text-center">PROJETOS</th>
                                <th className="p-6">FATURAMENTO TOTAL</th>
                                <th className="p-6">TICKET MÉDIO / PROJ.</th>
                                <th className="p-6 text-right">SAÚDE TÉCNICA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.profitabilityData.map((item, idx) => (
                                <tr key={item.name} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs" style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}>
                                                {idx + 1}
                                            </div>
                                            <span className="font-black text-slate-700">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-center font-bold text-slate-500">{item.count}</td>
                                    <td className="p-6 font-bold text-slate-800">{formatCurrency(item.revenue)}</td>
                                    <td className="p-6">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${item.avgTicket >= stats.avgTicketTotal ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {formatCurrency(item.avgTicket)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${item.efficiency > 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${item.efficiency}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400">{item.efficiency.toFixed(0)}%</span>
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
