
import React, { useState, useMemo } from 'react';
import { Partner, Client } from '../types';
import { PARTNER_TYPES } from '../constants';
import { UsersIcon, PencilIcon, TrashIcon, XIcon, PlusIcon, SparklesIcon, CheckCircleIcon } from './Icons';

interface PartnersProps {
    partners: Partner[];
    clients: Client[];
    onAddPartner: (partner: Omit<Partner, 'id'>) => void;
    onUpdatePartner: (partner: Partner) => void;
    onDeletePartner: (id: number) => void;
}

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})(\d+?)$/, "$1");
};

const emptyPartner: Omit<Partner, 'id'> = {
    name: '',
    type: 'MARCENARIA',
    contactPerson: '',
    phone: '',
    email: '',
    rating: 5,
    clientIds: []
};

const StarRating: React.FC<{ rating: number; onChange?: (rating: number) => void }> = ({ rating, onChange }) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange && onChange(star)}
                    className={`transition-transform hover:scale-110 ${star <= (rating || 0) ? 'text-yellow-400' : 'text-slate-200'}`}
                >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};

const Partners: React.FC<PartnersProps> = ({ partners = [], clients = [], onAddPartner, onUpdatePartner, onDeletePartner }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
    const [formData, setFormData] = useState<Omit<Partner, 'id'> | Partner>(emptyPartner);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('TODOS');

    const filteredPartners = useMemo(() => {
        const list = Array.isArray(partners) ? partners : [];
        return list.filter(p => {
            const matchesSearch = (p.name || '').toUpperCase().includes(searchTerm.toUpperCase()) || 
                                (p.contactPerson || '').toUpperCase().includes(searchTerm.toUpperCase());
            const matchesType = filterType === 'TODOS' || (p.type || '').toUpperCase() === filterType.toUpperCase();
            return matchesSearch && matchesType;
        }).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }, [partners, searchTerm, filterType]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let processed = value;
        if (name === 'phone') processed = maskPhone(value);
        else if (name !== 'email') processed = value.toUpperCase();
        
        setFormData(prev => ({ ...prev, [name]: processed }));
    };

    const handleEdit = (partner: Partner) => {
        setEditingPartner(partner);
        setFormData(partner);
        setIsFormOpen(true);
    };

    const handleCancel = () => {
        setEditingPartner(null);
        setFormData(emptyPartner);
        setIsFormOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPartner) {
            onUpdatePartner(formData as Partner);
        } else {
            onAddPartner(formData);
        }
        handleCancel();
    };

    return (
        <div className="space-y-8 pb-32 animate-fadeIn">
            <header className="bg-slate-900 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">Agenda de Parceiros</h1>
                    <p className="mt-1 text-slate-400 italic text-sm">Gerencie contatos de fornecedores e avalie a qualidade técnica de cada um.</p>
                </div>
                <button 
                    onClick={() => setIsFormOpen(true)}
                    className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-xl hover:scale-105 transition-all uppercase text-[10px] tracking-widest flex items-center"
                >
                    <PlusIcon className="w-5 h-5 mr-2" /> Novo Parceiro
                </button>
            </header>

            {/* Barra de Filtros */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pesquisar por Nome ou Contato</label>
                    <input 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="EX: MARCENARIA DO JOSÉ, VIDRAÇARIA ART..."
                        className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold uppercase text-sm focus:border-blue-500 outline-none"
                    />
                </div>
                <div className="w-full md:w-64 space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Serviço</label>
                    <select 
                        value={filterType}
                        onChange={e => setFilterType(e.target.value)}
                        className="w-full h-11 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold uppercase text-sm focus:border-blue-500 outline-none"
                    >
                        <option value="TODOS">TODOS OS SERVIÇOS</option>
                        {PARTNER_TYPES.map(t => <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            {/* Grid de Parceiros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPartners.map(partner => (
                    <div key={partner.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-blue-50 transition-colors"></div>
                        
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">{partner.type}</span>
                                <StarRating rating={partner.rating || 0} />
                            </div>

                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight line-clamp-1">{partner.name}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6 flex items-center">
                                <UsersIcon className="w-4 h-4 mr-1 text-blue-500" /> {partner.contactPerson || 'SEM CONTATO NOMINAL'}
                            </p>

                            <div className="space-y-3 pt-6 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                                    </div>
                                    <p className="text-sm font-black text-slate-700">{partner.phone || '(00) 00000-0000'}</p>
                                </div>
                                {partner.email && (
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                        </div>
                                        <p className="text-xs font-medium text-slate-500 lowercase truncate">{partner.email}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex gap-2">
                                <button onClick={() => handleEdit(partner)} className="flex-1 py-3 bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">Editar</button>
                                <button onClick={() => window.confirm('Deseja remover este parceiro da agenda?') && onDeletePartner(partner.id)} className="w-12 h-12 flex items-center justify-center text-slate-200 hover:text-red-500 transition-colors">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredPartners.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 opacity-50">
                        <UsersIcon className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest">Agenda Vazia</h2>
                        <p className="text-sm font-bold text-slate-400">Clique em "Novo Parceiro" para começar a construir sua rede de contatos.</p>
                    </div>
                )}
            </div>

            {/* Modal Formulário */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-slideUp">
                        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                    <UsersIcon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight leading-none">{editingPartner ? 'Editar' : 'Novo'} Parceiro</h3>
                                    <p className="text-blue-400 text-[10px] font-black mt-2 uppercase tracking-[0.2em]">Agenda Técnica do Estúdio</p>
                                </div>
                            </div>
                            <button onClick={handleCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors outline-none">
                                <XIcon className="w-10 h-10 text-slate-400" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Empresa / Profissional *</label>
                                    <input name="name" required value={formData.name} onChange={handleInputChange} className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="EX: MARCENARIA ESTILO" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Serviço *</label>
                                    <select name="type" required value={formData.type} onChange={handleInputChange} className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500">
                                        {PARTNER_TYPES.map(t => <option key={t} value={t.toUpperCase()}>{t.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Contato</label>
                                    <input name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500" placeholder="EX: JOSÉ ALMEIDA" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone WhatsApp</label>
                                    <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500 no-uppercase" placeholder="(00) 00000-0000" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail Corporativo</label>
                                    <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-blue-500 no-uppercase" placeholder="contato@empresa.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação Técnica</label>
                                    <div className="h-12 flex items-center justify-center bg-slate-50 border-2 border-slate-100 rounded-xl px-4">
                                        <StarRating rating={formData.rating || 0} onChange={r => setFormData({...formData, rating: r})} />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={handleCancel} className="flex-1 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                                <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all">
                                    {editingPartner ? 'Salvar Alterações' : 'Cadastrar na Agenda'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Partners;
