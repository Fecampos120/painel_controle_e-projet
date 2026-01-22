
import React, { useState, useRef, useMemo } from 'react';
import { PlusIcon, TrashIcon, XIcon, BrandLogo, UploadIcon, CheckCircleIcon, ArchitectIcon, MapPinIcon, GripVerticalIcon, MoneyBagIcon, SparklesIcon, DownloadIcon, HistoryIcon, PencilIcon, NotepadIcon } from './Icons';
import { ServicePrice, AppData, ProjectStageTemplateItem, SystemSettings, ChecklistItemTemplate, MenuItem } from '../types';
import { FONT_OPTIONS } from '../constants';

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})(\d+?)$/, "$1");
};

const Settings: React.FC<{ appData: AppData; setAppData: (data: AppData | ((prev: AppData) => AppData)) => void }> = ({ appData, setAppData }) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'visual' | 'servicos' | 'modelos' | 'checklist' | 'menu' | 'manutencao'>('empresa');
  const [localSettings, setLocalSettings] = useState<SystemSettings>(JSON.parse(JSON.stringify(appData.systemSettings)));
  const [localServices, setLocalServices] = useState<ServicePrice[]>(appData.servicePrices || []);
  const [localStages, setLocalStages] = useState<ProjectStageTemplateItem[]>(appData.systemSettings.projectStagesTemplate || []);
  const [localChecklist, setLocalChecklist] = useState<ChecklistItemTemplate[]>(appData.systemSettings.checklistTemplate || []);
  const [localMenu, setLocalMenu] = useState<MenuItem[]>(appData.systemSettings.menuOrder || []);
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lógica de Drag and Drop
  const [draggedStageIndex, setDraggedStageIndex] = useState<number | null>(null);
  const [draggedMenuIndex, setDraggedMenuIndex] = useState<number | null>(null);

  const handleStageDragStart = (index: number) => setDraggedStageIndex(index);
  const handleMenuDragStart = (index: number) => setDraggedMenuIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleStageDrop = (index: number) => {
    if (draggedStageIndex === null || draggedStageIndex === index) return;
    const list = [...localStages].sort((a, b) => a.sequence - b.sequence);
    const itemToMove = list[draggedStageIndex];
    list.splice(draggedStageIndex, 1);
    list.splice(index, 0, itemToMove);
    setLocalStages(list.map((item, idx) => ({ ...item, sequence: idx + 1 })));
    setDraggedStageIndex(null);
  };

  const handleMenuDrop = (index: number) => {
    if (draggedMenuIndex === null || draggedMenuIndex === index) return;
    const list = [...localMenu].sort((a, b) => a.sequence - b.sequence);
    const itemToMove = list[draggedMenuIndex];
    list.splice(draggedMenuIndex, 1);
    list.splice(index, 0, itemToMove);
    setLocalMenu(list.map((item, idx) => ({ ...item, sequence: idx + 1 })));
    setDraggedMenuIndex(null);
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setAppData(prev => ({ 
        ...prev, 
        systemSettings: {
            ...localSettings,
            projectStagesTemplate: localStages,
            checklistTemplate: localChecklist,
            menuOrder: localMenu
        },
        servicePrices: localServices
    }));
    setTimeout(() => {
        setIsSaving(false);
        alert('Configurações aplicadas com sucesso!');
    }, 800);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      let val = value;
      if (name === 'phone') val = maskPhone(value);
      
      if (name.startsWith('address.')) {
          const field = name.split('.')[1];
          setLocalSettings(prev => ({ ...prev, address: { ...prev.address, [field]: val.toUpperCase() } }));
      } else if (name.startsWith('theme.')) {
          const field = name.split('.')[1];
          setLocalSettings(prev => ({ ...prev, theme: { ...prev.theme, [field]: val } }));
      } else {
          setLocalSettings(prev => ({ ...prev, [name]: val.toUpperCase() }));
      }
  };

  const groupedChecklist = useMemo(() => {
    const groups: { [key: string]: ChecklistItemTemplate[] } = {};
    localChecklist.forEach(item => {
        if (!groups[item.stage]) groups[item.stage] = [];
        groups[item.stage].push(item);
    });
    return groups;
  }, [localChecklist]);

  return (
    <div className="space-y-8 pb-40 animate-fadeIn">
      <header className="bg-[var(--primary-color)] text-white p-8 rounded-xl shadow-lg -mx-4 md:-mx-8 lg:-mx-10 -mt-4 md:-mt-8 lg:-mt-10 mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Configurações Gerais</h1>
            <p className="mt-1 text-white/80 text-[10px] font-black uppercase tracking-widest">Personalize o comportamento, visual e modelos do seu estúdio.</p>
        </div>
        <button onClick={handleSaveAll} className="w-full sm:w-auto px-8 py-3 bg-white text-[var(--primary-color)] font-black rounded-xl shadow-xl hover:scale-105 transition-all text-[10px] tracking-[0.2em] uppercase">
            Salvar Alterações
        </button>
      </header>

      <div className="flex border-b border-slate-200 mb-10 space-x-8 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'empresa', label: 'Empresa', color: 'text-blue-500' },
            { id: 'visual', label: 'Visual', color: 'text-pink-500' },
            { id: 'servicos', label: 'Serviços', color: 'text-green-500' },
            { id: 'modelos', label: 'Cronogramas', color: 'text-indigo-500' },
            { id: 'checklist', label: 'Checklist Obra', color: 'text-amber-500' },
            { id: 'menu', label: 'Menu', color: 'text-purple-500' },
            { id: 'manutencao', label: 'Backup', color: 'text-red-500' }
          ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? tab.color : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab.label}
                {activeTab === tab.id && <div className={`absolute bottom-0 left-0 w-full h-1 bg-current rounded-full`}></div>}
              </button>
          ))}
      </div>

      {activeTab === 'empresa' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-100 pb-8 lg:pb-0 lg:pr-12">
                        <div className="w-48 h-48 bg-slate-50 rounded-[2rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            {localSettings.logoUrl ? <img src={localSettings.logoUrl} className="w-full h-full object-contain p-4" /> : <BrandLogo className="w-16 h-16 text-slate-200" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <UploadIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setLocalSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
                                reader.readAsDataURL(file);
                            }
                        }} accept="image/*" className="hidden" />
                        <p className="mt-4 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest leading-relaxed">Logomarca do Escritório</p>
                    </div>
                    
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome do Sistema</label>
                            <input name="appName" value={localSettings.appName} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                            <input name="companyName" value={localSettings.companyName} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Arquiteto Responsável</label>
                            <input name="professionalName" value={localSettings.professionalName} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">WhatsApp de Contato</label>
                            <input name="phone" value={localSettings.phone} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-800" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-8 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-3 text-[var(--primary-color)]" /> Localização & Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">CEP</label>
                        <input name="address.cep" value={localSettings.address.cep} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold" />
                    </div>
                    <div className="md:col-span-7 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Logradouro / Rua</label>
                        <input name="address.street" value={localSettings.address.street} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Nº</label>
                        <input name="address.number" value={localSettings.address.number} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold" />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Bairro</label>
                        <input name="address.district" value={localSettings.address.district} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold" />
                    </div>
                    <div className="md:col-span-5 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">Cidade</label>
                        <input name="address.city" value={localSettings.address.city} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">UF</label>
                        <input name="address.state" maxLength={2} value={localSettings.address.state} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white font-bold text-center" />
                    </div>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'visual' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-3 text-yellow-500" /> Paleta de Cores & Layout
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cor de Destaque</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100">
                            <input type="color" name="theme.primaryColor" value={localSettings.theme.primaryColor} onChange={handleChange} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent" />
                            <span className="font-bold text-sm text-slate-700">{localSettings.theme.primaryColor}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menu Lateral</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100">
                            <input type="color" name="theme.sidebarColor" value={localSettings.theme.sidebarColor} onChange={handleChange} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent" />
                            <span className="font-bold text-sm text-slate-700">{localSettings.theme.sidebarColor}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fundo de Tela</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border-2 border-slate-100">
                            <input type="color" name="theme.backgroundColor" value={localSettings.theme.backgroundColor} onChange={handleChange} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent" />
                            <span className="font-bold text-sm text-slate-700">{localSettings.theme.backgroundColor}</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arredondamento</label>
                        <select name="theme.borderRadius" value={localSettings.theme.borderRadius} onChange={handleChange} className="w-full h-16 px-5 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none text-sm">
                            <option value="8px">LEVE (8PX)</option>
                            <option value="12px">PADRÃO (12PX)</option>
                            <option value="20px">MODERNO (20PX)</option>
                            <option value="32px">SOFT (32PX)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-10">Fonte do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FONT_OPTIONS.map(font => (
                        <div 
                            key={font.value}
                            onClick={() => setLocalSettings(prev => ({ ...prev, theme: { ...prev.theme, fontFamily: font.value } }))}
                            className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all hover:scale-105 group relative overflow-hidden ${localSettings.theme.fontFamily === font.value ? 'border-[var(--primary-color)] bg-blue-50/30' : 'border-slate-100 bg-white'}`}
                        >
                            <div style={{ fontFamily: font.value }}>
                                <p className="text-xl font-bold text-slate-800 mb-2">{font.name.split(' ')[0]}</p>
                                <p className="text-xs text-slate-500 leading-relaxed">The quick brown fox jumps over the lazy dog.</p>
                            </div>
                            {localSettings.theme.fontFamily === font.value && (
                                <div className="mt-4 flex items-center text-[9px] font-bold text-[var(--primary-color)] uppercase tracking-widest">
                                    <CheckCircleIcon className="w-4 h-4 mr-2" /> Selecionada
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'servicos' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                            <MoneyBagIcon className="w-5 h-5 mr-3 text-yellow-600" /> Catálogo de Serviços do Estúdio
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">Defina seus serviços e valores base para agilizar novos orçamentos.</p>
                    </div>
                    <button onClick={() => setLocalServices(prev => [...prev, { id: Date.now(), name: 'NOVO SERVIÇO', unit: 'm²' }])} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all uppercase">
                        + Add Novo Serviço
                    </button>
                </div>
                <div className="space-y-4">
                    {localServices.map(service => (
                        <div key={service.id} className="p-6 bg-slate-50/50 rounded-2xl border-2 border-slate-100 flex flex-col md:flex-row items-center gap-8 group">
                            <div className="flex-1 w-full space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Nome do Serviço</label>
                                <input value={service.name} onChange={e => setLocalServices(prev => prev.map(s => s.id === service.id ? {...s, name: e.target.value.toUpperCase()} : s))} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl font-bold text-sm shadow-sm" />
                            </div>
                            <div className="w-full md:w-56 space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Tipo de Cobrança</label>
                                <select className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase shadow-sm">
                                    <option>Valor Fixo / Pacote</option>
                                    <option>Por Hora Técnica</option>
                                    <option>Por Metragem (m²)</option>
                                </select>
                            </div>
                            <div className="w-full md:w-36 space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">Valor Sugerido (R$)</label>
                                <input type="number" value={service.price || 0} onChange={e => setLocalServices(prev => prev.map(s => s.id === service.id ? {...s, price: parseFloat(e.target.value)} : s))} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl font-bold text-blue-600 text-sm shadow-sm text-center" />
                            </div>
                            <button onClick={() => setLocalServices(prev => prev.filter(s => s.id !== service.id))} className="text-slate-300 hover:text-red-500 transition-colors p-2"><TrashIcon className="w-5 h-5" /></button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'modelos' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                            <GripVerticalIcon className="w-5 h-5 mr-3 text-blue-600" /> Fases Padrão de Projeto (Cronograma)
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">Arraste as fases para reordenar a sequência cronológica.</p>
                    </div>
                    <button onClick={() => setLocalStages(prev => [...prev, { id: Date.now(), name: 'NOVA ETAPA', sequence: prev.length + 1, durationWorkDays: 5 }])} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-[9px] tracking-widest shadow-lg uppercase">+ Add Etapa</button>
                </div>
                <div className="space-y-3">
                    {[...localStages].sort((a,b) => a.sequence - b.sequence).map((stage, idx) => (
                        <div 
                            key={stage.id} 
                            draggable
                            onDragStart={() => handleStageDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleStageDrop(idx)}
                            className={`flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all group cursor-move ${draggedStageIndex === idx ? 'opacity-40 scale-95 border-blue-400' : ''}`}
                        >
                            <div className="text-slate-300"><GripVerticalIcon className="w-5 h-5" /></div>
                            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">{idx + 1}</div>
                            <input value={stage.name} onChange={e => setLocalStages(prev => prev.map(s => s.id === stage.id ? {...s, name: e.target.value.toUpperCase()} : s))} className="flex-1 bg-transparent border-none font-bold text-sm uppercase focus:ring-0 text-slate-700" />
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col items-end">
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">Dias Úteis</span>
                                    <input type="number" value={stage.durationWorkDays} onChange={e => setLocalStages(prev => prev.map(s => s.id === stage.id ? {...s, durationWorkDays: parseInt(e.target.value) || 0} : s))} className="w-16 h-8 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs" />
                                </div>
                                <button onClick={() => setLocalStages(prev => prev.filter(s => s.id !== stage.id))} className="text-slate-200 group-hover:text-red-400 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'checklist' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                            <NotepadIcon className="w-5 h-5 mr-3 text-purple-600" /> Checklist Mestre de Obra
                        </h3>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">Configure as tarefas padrão que serão carregadas em cada nova obra técnica.</p>
                    </div>
                    <button onClick={() => setLocalChecklist(prev => [...prev, { id: Date.now(), text: 'NOVA TAREFA...', stage: '1. GESTÃO INICIAL' }])} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all uppercase">
                        + Add Tarefa
                    </button>
                </div>

                <div className="space-y-10">
                    {/* Fix: Explicitly typed groupedChecklist entries to resolve potential unknown sorting issues */}
                    {(Object.entries(groupedChecklist) as [string, ChecklistItemTemplate[]][]).sort(([a], [b]) => a.localeCompare(b)).map(([stageName, items]) => (
                        <div key={stageName} className="space-y-4">
                            <h4 className="text-[11px] font-black text-purple-400 uppercase tracking-[0.2em] border-b border-purple-50 pb-2">{stageName}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {items.map(item => (
                                    <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 group hover:bg-white hover:border-purple-200 transition-all">
                                        <div className="flex-1">
                                            <input 
                                                value={item.text} 
                                                /* Fix: Added explicit type (ChecklistItemTemplate[]) to setLocalChecklist functional update to resolve unknown inference */
                                                onChange={e => setLocalChecklist((prev: ChecklistItemTemplate[]) => prev.map(c => c.id === item.id ? {...c, text: e.target.value.toUpperCase()} : c))} 
                                                className="w-full bg-transparent border-none font-bold text-xs uppercase text-slate-700 p-0 focus:ring-0" 
                                                placeholder="DESCRIÇÃO DA TAREFA"
                                            />
                                            <select 
                                                value={item.stage} 
                                                /* Fix: Added explicit type (ChecklistItemTemplate[]) to setLocalChecklist functional update to resolve unknown inference */
                                                onChange={e => setLocalChecklist((prev: ChecklistItemTemplate[]) => prev.map(c => c.id === item.id ? {...c, stage: e.target.value.toUpperCase()} : c))}
                                                className="text-[8px] font-black text-purple-400 uppercase tracking-widest bg-transparent border-none p-0 focus:ring-0 mt-1 cursor-pointer appearance-none outline-none"
                                            >
                                                {Object.keys(groupedChecklist).map(s => <option key={s} value={s}>{s}</option>)}
                                                <option value="NOVA CATEGORIA">ADICIONAR NOVA ETAPA...</option>
                                            </select>
                                        </div>
                                        <button onClick={() => setLocalChecklist(prev => prev.filter(c => c.id !== item.id))} className="text-slate-200 group-hover:text-red-400 transition-colors p-2"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'menu' && (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                <div className="mb-10">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
                        <GripVerticalIcon className="w-5 h-5 mr-3 text-blue-600" /> Configuração do Menu Lateral
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">Arraste para reordenar o acesso rápido e use as chaves para ocultar módulos.</p>
                </div>
                <div className="space-y-3 max-w-2xl">
                    {[...localMenu].sort((a,b) => a.sequence - b.sequence).map((item, idx) => (
                        <div 
                            key={item.id} 
                            draggable
                            onDragStart={() => handleMenuDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleMenuDrop(idx)}
                            className={`flex items-center gap-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white transition-all group cursor-move ${draggedMenuIndex === idx ? 'opacity-40 scale-95 border-blue-400' : ''}`}
                        >
                            <div className="text-slate-300"><GripVerticalIcon className="w-5 h-5" /></div>
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-700 text-sm">{item.label}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={item.visible} 
                                        onChange={e => setLocalMenu(prev => prev.map(m => m.id === item.id ? { ...m, visible: e.target.checked } : m))}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.visible ? 'Visível' : 'Oculto'}</span>
                                </label>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'manutencao' && (
          <div className="animate-fadeIn space-y-8">
              <div className="bg-white p-10 rounded-[2rem] shadow-sm border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                      <HistoryIcon className="w-5 h-5 mr-3 text-blue-500" /> Manutenção do Sistema
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                          <h4 className="text-sm font-bold text-slate-800">Backup Geral de Segurança</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Baixe todos os seus dados em um arquivo criptografado.</p>
                          <button onClick={() => {
                            const dataStr = JSON.stringify(appData, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `backup_eprojet_${new Date().toISOString().split('T')[0]}.json`;
                            link.click();
                          }} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center text-[10px] tracking-widest uppercase">
                            <DownloadIcon className="w-4 h-4 mr-2" /> Exportar Dados (.JSON)
                          </button>
                      </div>
                      <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                          <h4 className="text-sm font-bold text-slate-800">Relatório de Projetos</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Gere uma planilha de todos os contratos ativos.</p>
                          <button onClick={() => {
                            let csvContent = "data:text/csv;charset=utf-8,Cliente,Projeto,Valor,Status\n";
                            appData.contracts.forEach(c => { csvContent += `${c.clientName},${c.projectName},${c.totalValue},${c.status}\n`; });
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", "relatorio_projetos.csv");
                            document.body.appendChild(link);
                            link.click();
                          }} className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all flex items-center justify-center text-[10px] tracking-widest uppercase">
                            <DownloadIcon className="w-4 h-4 mr-2" /> Exportar Planilha (.CSV)
                          </button>
                      </div>
                  </div>
                  <div className="mt-12 pt-10 border-t border-red-50 text-center">
                      <button onClick={() => { if(window.confirm('APAGAR TUDO? ESTA AÇÃO NÃO PODE SER DESFEITA.')) { localStorage.clear(); window.location.reload(); } }} className="px-10 py-3 border-2 border-red-100 text-red-400 hover:bg-red-500 hover:text-white font-bold rounded-xl transition-all uppercase text-[10px] tracking-widest">
                        Limpar Todos os Dados Locais
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* FOOTER FIXO DE SALVAMENTO */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white/95 backdrop-blur-md p-6 border-t border-slate-200 z-[50] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center text-green-600 font-bold text-[10px] uppercase tracking-widest">
              <CheckCircleIcon className="w-4 h-4 mr-2" /> Salve para aplicar os modelos em novos projetos
          </div>
          <div className="flex items-center gap-8 w-full sm:w-auto">
              <button onClick={() => window.location.reload()} className="flex-1 sm:flex-none text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 tracking-widest">Descartar</button>
              <button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex-[2] sm:flex-none px-12 py-3.5 bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all text-xs tracking-widest uppercase"
              >
                  {isSaving ? 'Salvando...' : 'Salvar Tudo'}
              </button>
          </div>
      </div>
    </div>
  );
};

export default Settings;
