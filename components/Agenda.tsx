
import React, { useState, useMemo } from 'react';
import { Appointment, Contract } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon, CheckCircleIcon, CalendarIcon, HistoryIcon, UsersIcon, TrashIcon, SparklesIcon } from './Icons';

interface AgendaProps {
    appointments: Appointment[];
    contracts: Contract[];
    onUpdateAppointments: (appointments: Appointment[]) => void;
}

const Agenda: React.FC<AgendaProps> = ({ appointments, contracts, onUpdateAppointments }) => {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Appointment>>({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        completed: false,
        description: ''
    });

    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0,0,0,0);
        
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);

        const pending = appointments.filter(a => !a.completed).length;
        const completed = appointments.filter(a => a.completed).length;
        const upcoming = appointments.filter(a => {
            const d = new Date(a.date + 'T00:00:00');
            return d >= today && d <= next7Days;
        }).length;

        return { pending, completed, upcoming };
    }, [appointments]);

    const handleSaveAppointment = (e: React.FormEvent) => {
        e.preventDefault();
        const newApp: Appointment = {
            id: Date.now(),
            title: formData.title!.toUpperCase(),
            date: formData.date!,
            time: formData.time!,
            clientId: formData.clientId,
            clientName: formData.clientId ? contracts.find(c => c.id === formData.clientId)?.clientName : undefined,
            completed: false,
            description: formData.description?.toUpperCase()
        };
        onUpdateAppointments([...appointments, newApp]);
        setIsModalOpen(false);
        setFormData({ title: '', date: new Date().toISOString().split('T')[0], time: '09:00', completed: false });
    };

    const handleDelete = (id: number) => {
        if(window.confirm("EXCLUIR COMPROMISSO?")) {
            onUpdateAppointments(appointments.filter(a => a.id !== id));
        }
    };

    const handleToggleComplete = (id: number) => {
        onUpdateAppointments(appointments.map(a => a.id === id ? {...a, completed: !a.completed} : a));
    };

    // Calendar Grid Calculation
    const calendarDays = useMemo(() => {
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        
        const days = [];
        const prevMonthLastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
        const startDayOfWeek = start.getDay();

        // Fill leading days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            days.push({ day: prevMonthLastDay - i, month: 'prev', fullDate: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()).padStart(2, '0')}-${String(prevMonthLastDay - i).padStart(2, '0')}` });
        }

        // Fill current month
        for (let i = 1; i <= end.getDate(); i++) {
            days.push({ day: i, month: 'current', fullDate: `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
        }

        // Fill trailing days
        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const nextMonth = currentMonth.getMonth() + 2;
            const nextYear = nextMonth > 12 ? currentMonth.getFullYear() + 1 : currentMonth.getFullYear();
            const nextMonthNormalized = nextMonth > 12 ? 1 : nextMonth;
            days.push({ day: i, month: 'next', fullDate: `${nextYear}-${String(nextMonthNormalized).padStart(2, '0')}-${String(i).padStart(2, '0')}` });
        }

        return days;
    }, [currentMonth]);

    const appointmentsByDate = useMemo(() => {
        const map: Record<string, Appointment[]> = {};
        appointments.forEach(a => {
            if(!map[a.date]) map[a.date] = [];
            map[a.date].push(a);
        });
        return map;
    }, [appointments]);

    return (
        <div className="space-y-8 animate-fadeIn uppercase">
            <header className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agenda do Escritório</h1>
                        <p className="text-slate-400 font-semibold text-[10px] tracking-widest mt-2 uppercase">Gestão centralizada de reuniões e visitas</p>
                    </div>
                    <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`px-5 py-2 rounded-xl text-[9px] font-bold tracking-[0.1em] transition-all flex items-center ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                        >
                            <HistoryIcon className="w-3.5 h-3.5 mr-2" /> LISTAGEM
                        </button>
                        <button 
                            onClick={() => setViewMode('calendar')}
                            className={`px-5 py-2 rounded-xl text-[9px] font-bold tracking-[0.1em] transition-all flex items-center ${viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                        >
                            <CalendarIcon className="w-3.5 h-3.5 mr-2" /> CALENDÁRIO
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex items-center gap-5">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-inner"><CalendarIcon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Pendentes</p>
                            <p className="text-xl font-bold text-slate-800">{stats.pending}</p>
                        </div>
                    </div>
                    <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100 flex items-center gap-5">
                        <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shadow-inner"><CheckCircleIcon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[9px] font-bold text-green-400 uppercase tracking-widest">Concluídos</p>
                            <p className="text-xl font-bold text-slate-800">{stats.completed}</p>
                        </div>
                    </div>
                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 flex items-center gap-5">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shadow-inner"><HistoryIcon className="w-5 h-5" /></div>
                        <div>
                            <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest">Próximos 7 Dias</p>
                            <p className="text-xl font-bold text-slate-800">{stats.upcoming}</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex justify-end">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-3.5 bg-[var(--primary-color)] text-white font-bold rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-[10px] tracking-[0.1em] flex items-center"
                >
                    <PlusIcon className="w-4 h-4 mr-3" /> AGENDAR NOVO COMPROMISSO
                </button>
            </div>

            {viewMode === 'calendar' ? (
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                            {currentMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase()}
                        </h2>
                        <div className="flex gap-4">
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-xl transition-all"><ChevronLeftIcon className="w-4 h-4" /></button>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-800 rounded-xl transition-all"><ChevronRightIcon className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-4">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-widest pb-4">{d}</div>
                        ))}
                        {calendarDays.map((date, idx) => {
                            const apps = appointmentsByDate[date.fullDate] || [];
                            const isToday = date.fullDate === new Date().toISOString().split('T')[0];
                            return (
                                <div key={idx} className={`min-h-[120px] p-4 rounded-2xl border-2 transition-all group ${date.month === 'current' ? 'bg-white border-slate-50' : 'bg-slate-50/30 border-transparent opacity-30'} ${isToday ? 'border-blue-500 shadow-lg shadow-blue-500/10' : ''}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`text-xs font-bold ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{date.day}</span>
                                        {apps.length > 0 && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]"></span>}
                                    </div>
                                    <div className="space-y-1.5 overflow-hidden">
                                        {apps.slice(0, 3).map(a => (
                                            <div key={a.id} className={`p-1.5 rounded-lg text-[8px] font-bold truncate border transition-all ${a.completed ? 'bg-slate-50 border-slate-100 text-slate-400 line-through' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                                                {a.time} {a.title}
                                            </div>
                                        ))}
                                        {apps.length > 3 && <p className="text-[7px] font-bold text-slate-300 ml-1">+ {apps.length - 3} itens</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.sort((a,b) => a.date.localeCompare(b.date)).map(a => (
                        <div key={a.id} className={`bg-white p-5 rounded-[1.5rem] border-2 transition-all flex flex-col md:flex-row items-center gap-6 group ${a.completed ? 'opacity-50 border-slate-100' : 'border-white hover:border-blue-100 shadow-sm'}`}>
                            <div className="w-20 text-center border-r border-slate-100 pr-6">
                                <p className="text-lg font-bold text-slate-800">{new Date(a.date + 'T00:00:00').getDate()}</p>
                                <p className="text-[9px] font-bold text-slate-400">{new Date(a.date + 'T00:00:00').toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</p>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded tracking-widest">{a.time}</span>
                                    {a.clientName && (
                                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                                            <UsersIcon className="w-3 h-3" /> {a.clientName}
                                        </span>
                                    )}
                                </div>
                                <h3 className={`text-md font-bold text-slate-800 uppercase ${a.completed ? 'line-through' : ''}`}>{a.title}</h3>
                                {a.description && <p className="text-[10px] text-slate-400 font-semibold mt-1 line-clamp-1 italic">"{a.description}"</p>}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => handleToggleComplete(a.id)} className={`p-2.5 rounded-xl transition-all border-2 ${a.completed ? 'bg-green-500 text-white border-green-500 shadow-md shadow-green-100' : 'bg-slate-50 text-slate-300 border-slate-100 hover:text-green-500 hover:bg-green-50'}`}>
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDelete(a.id)} className="p-2.5 bg-slate-50 text-slate-300 border-slate-100 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border-2">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {appointments.length === 0 && (
                         <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 opacity-50">
                            <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-slate-200" />
                            <h2 className="text-xl font-bold text-slate-300 tracking-widest uppercase">Sua agenda está limpa</h2>
                            <p className="text-xs font-semibold text-slate-300 uppercase mt-2">Planeje sua semana de projetos!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Novo Compromisso - Dynamic Popup UI */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-slideUp">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[var(--primary-color)] rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <SparklesIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-tight leading-none">Novo Compromisso</h3>
                                    <p className="text-blue-400 text-[8px] font-bold mt-2 uppercase tracking-[0.2em]">Registro na agenda técnica</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none">
                                <XIcon className="w-6 h-6 text-slate-500" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSaveAppointment} className="p-8 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Assunto / Evento *</label>
                                <input 
                                    required 
                                    autoFocus
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})} 
                                    className="w-full h-12 px-5 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-800 outline-none focus:border-[var(--primary-color)] transition-all placeholder:text-slate-300 text-sm" 
                                    placeholder="REUNIÃO, VISITA, ENTREGA..." 
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Data</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={formData.date} 
                                        onChange={e => setFormData({...formData, date: e.target.value})} 
                                        className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-[var(--primary-color)] text-sm" 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Horário</label>
                                    <input 
                                        type="time" 
                                        required 
                                        value={formData.time} 
                                        onChange={e => setFormData({...formData, time: e.target.value})} 
                                        className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-[var(--primary-color)] text-sm" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Vincular Projeto</label>
                                <select 
                                    value={formData.clientId} 
                                    onChange={e => setFormData({...formData, clientId: parseInt(e.target.value) || undefined})}
                                    className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-[var(--primary-color)] cursor-pointer appearance-none text-xs"
                                >
                                    <option value="">GERAL (SEM VÍNCULO)</option>
                                    {contracts.filter(c => c.status === 'Ativo').map(c => <option key={c.id} value={c.id}>{c.clientName} - {c.projectName}</option>)}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] ml-1">Notas / Localização</label>
                                <textarea 
                                    rows={3} 
                                    value={formData.description} 
                                    onChange={e => setFormData({...formData, description: e.target.value})} 
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium outline-none focus:border-[var(--primary-color)] transition-all text-xs" 
                                    placeholder="DETALHES OU ENDEREÇO..." 
                                />
                            </div>

                            <div className="pt-4 flex flex-col gap-4">
                                <button 
                                    type="submit" 
                                    className="w-full py-4 bg-slate-900 text-white font-bold uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-xl hover:bg-[var(--primary-color)] transition-all transform active:scale-95"
                                >
                                    <CheckCircleIcon className="w-5 h-5 mr-2" /> Efetivar Agendamento
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setIsModalOpen(false)} 
                                    className="text-[9px] font-bold text-slate-300 hover:text-red-500 uppercase tracking-widest transition-colors"
                                >
                                    Descartar Rascunho
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
