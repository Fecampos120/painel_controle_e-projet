
import React, { useState, useRef, useEffect } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, XIcon, BrandLogo, UploadIcon, CheckCircleIcon, SparklesIcon, ArchitectIcon, MapPinIcon, GripVerticalIcon, MoneyBagIcon } from './Icons';
import { ServicePrice, AppData, ProjectStageTemplateItem, SystemSettings, ChecklistItemTemplate } from '../types';
import { FONT_OPTIONS } from '../constants';

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})(\d+?)$/, "$1");
};

const Settings: React.FC<{ appData: AppData; setAppData: (data: AppData | ((prev: AppData) => AppData)) => void }> = ({ appData, setAppData }) => {
  const [activeTab, setActiveTab] = useState<'empresa' | 'visual' | 'modelos' | 'servicos'>('empresa');
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(appData.systemSettings);
  
  // Estados locais para serviços para permitir "Descartar"
  const [localServicePrices, setLocalServicePrices] = useState<ServicePrice[]>(appData.servicePrices || []);
  const [localHourlyRates, setLocalHourlyRates] = useState<ServicePrice[]>(appData.hourlyRates || []);
  
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setIsSaving(true);
    const finalSettings = {
        ...systemSettings,
        theme: { ...systemSettings.theme }
    };

    setAppData(prev => ({ 
        ...prev, 
        systemSettings: finalSettings,
        servicePrices: localServicePrices,
        hourlyRates: localHourlyRates
    }));

    setTimeout(() => {
        setIsSaving(false);
        alert('Configurações salvas com sucesso! O sistema foi atualizado.');
    }, 500);
  };

  const handleSystemSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      
      let processedValue = value;
      if (name === 'phone') {
          processedValue = maskPhone(value);
      } else if (!name.includes('theme') && !name.includes('logoUrl')) {
          processedValue = value.toUpperCase();
      }

      if (name.startsWith('address.')) {
          const field = name.split('.')[1];
          setSystemSettings(prev => ({ 
              ...prev, 
              address: { ...prev.address, [field]: value.toUpperCase() } 
          }));
      } else if (name.startsWith('theme.')) {
          const field = name.split('.')[1];
          setSystemSettings(prev => ({ 
              ...prev, 
              theme: { ...prev.theme, [field]: value } 
          }));
      } else {
          setSystemSettings(prev => ({ ...prev, [name]: processedValue }));
      }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSystemSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
          reader.readAsDataURL(file);
      }
  };

  // LÓGICA DE SERVIÇOS
  const addService = () => {
    const newService: ServicePrice = {
        id: Date.now(),
        name: 'NOVO SERVIÇO',
        price: 0,
        unit: 'm²'
    };
    setLocalServicePrices(prev => [...prev, newService]);
  };

  const updateService = (id: number, field: keyof ServicePrice, value: any) => {
    setLocalServicePrices(prev => prev.map(s => s.id === id ? { ...s, [field]: field === 'name' ? value.toUpperCase() : value } : s));
  };

  const removeService = (id: number) => {
    setLocalServicePrices(prev => prev.filter(s => s.id !== id));
  };

  // FASES E CHECKLISTS
  const addStageTemplate = () => {
    const newStage: ProjectStageTemplateItem = { 
        id: Date.now(), 
        sequence: systemSettings.projectStagesTemplate.length + 1, 
        name: 'NOVA ETAPA', 
        durationWorkDays: 5 
    };
    setSystemSettings(prev => ({ ...prev, projectStagesTemplate: [...prev.projectStagesTemplate, newStage] }));
  };

  const removeStageTemplate = (id: number) => {
    setSystemSettings(prev => ({ ...prev, projectStagesTemplate: prev.projectStagesTemplate.filter(s => s.id !== id) }));
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItemTemplate = {
        id: Date.now(),
        stage: 'FASE GERAL',
        text: 'NOVA AÇÃO TÉCNICA'
    };
    setSystemSettings(prev => ({ ...prev, checklistTemplate: [...prev.checklistTemplate, newItem] }));
  };

  // Drag and Drop Fases
  const handleDragStart = (index: number) => setDraggedItemIndex(index);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (index: number) => {
    if (draggedItemIndex === null) return;
    const newList = [...systemSettings.projectStagesTemplate];
    const draggedItem = newList.splice(draggedItemIndex, 1)[0];
    newList.splice(index, 0, draggedItem);
    const reorderedList = newList.map((item, idx) => ({ ...item, sequence: idx + 1 }));
    setSystemSettings(prev => ({ ...prev, projectStagesTemplate: reorderedList }));
    setDraggedItemIndex(null);
  };

  return (
    <div className="space-y-8 pb-32 animate-fadeIn">
      <header className="bg-[var(--primary-color)] text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex justify-between items-center transition-colors duration-500">
        <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Configurações Gerais</h1>
            <p className="mt-1 text-white/80 italic text-sm">Personalize o comportamento, visual e catálogo de serviços do seu sistema.</p>
        </div>
        <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`px-8 py-3 bg-white text-[var(--primary-color)] font-black rounded-xl shadow-xl hover:scale-105 transition-all uppercase text-xs tracking-widest ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </header>

      <div className="flex border-b border-slate-200 mb-8 space-x-8 overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab('empresa')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'empresa' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-slate-400 hover:text-slate-600'}`}>Dados da Empresa</button>
          <button onClick={() => setActiveTab('visual')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'visual' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-slate-400 hover:text-slate-600'}`}>Identidade Visual</button>
          <button onClick={() => setActiveTab('servicos')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'servicos' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-slate-400 hover:text-slate-600'}`}>Serviços & Preços</button>
          <button onClick={() => setActiveTab('modelos')} className={`pb-4 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'modelos' ? 'border-b-2 border-[var(--primary-color)] text-[var(--primary-color)]' : 'text-slate-400 hover:text-slate-600'}`}>Fases & Cronogramas</button>
      </div>

      {activeTab === 'empresa' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 flex flex-col items-center">
                        <div className="w-full aspect-square max-w-[200px] bg-slate-50 rounded-3xl border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group shadow-inner">
                            {systemSettings.logoUrl ? (
                                <img src={systemSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <BrandLogo className="w-16 h-16 text-slate-200" />
                            )}
                            <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <UploadIcon className="w-8 h-8 text-white" />
                            </button>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-relaxed">Logo Principal<br/>(Aparece nos relatórios e portal)</p>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Sistema / App</label>
                            <input name="appName" value={systemSettings.appName} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold uppercase" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Empresa (Razão Social)</label>
                            <input name="companyName" value={systemSettings.companyName} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold uppercase" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável Técnico / Arquiteto</label>
                            <input name="professionalName" value={systemSettings.professionalName} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold uppercase" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WhatsApp Corporativo</label>
                            <input name="phone" value={systemSettings.phone} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold no-uppercase" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-blue-500" /> Endereço Comercial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">CEP</label>
                        <input name="address.cep" value={systemSettings.address.cep} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold" />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Logradouro / Rua</label>
                        <input name="address.street" value={systemSettings.address.street} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold uppercase" />
                    </div>
                    <div className="md:col-span-1 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Nº</label>
                        <input name="address.number" value={systemSettings.address.number} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Bairro</label>
                        <input name="address.district" value={systemSettings.address.district} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold uppercase" />
                    </div>
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Cidade</label>
                        <input name="address.city" value={systemSettings.address.city} onChange={handleSystemSettingChange} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold uppercase" />
                    </div>
                    <div className="md:col-span-1 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase">UF</label>
                        <input name="address.state" value={systemSettings.address.state} onChange={handleSystemSettingChange} maxLength={2} className="w-full h-11 px-4 rounded-xl border-2 border-slate-200 bg-slate-50 font-bold text-center uppercase" />
                    </div>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'visual' && (
          <div className="space-y-8 animate-fadeIn">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-2 text-yellow-500" /> Paleta de Cores & Layout
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Cor de Destaque</label>
                          <div className="flex gap-3 items-center">
                            <input type="color" name="theme.primaryColor" value={systemSettings.theme.primaryColor} onChange={handleSystemSettingChange} className="w-12 h-12 rounded-xl cursor-pointer border-none" />
                            <input value={systemSettings.theme.primaryColor} onChange={handleSystemSettingChange} name="theme.primaryColor" className="flex-1 h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-xs font-mono no-uppercase" />
                          </div>
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Menu Lateral</label>
                          <div className="flex gap-3 items-center">
                            <input type="color" name="theme.sidebarColor" value={systemSettings.theme.sidebarColor} onChange={handleSystemSettingChange} className="w-12 h-12 rounded-xl cursor-pointer border-none" />
                            <input value={systemSettings.theme.sidebarColor} onChange={handleSystemSettingChange} name="theme.sidebarColor" className="flex-1 h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-xs font-mono no-uppercase" />
                          </div>
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Fundo de Tela</label>
                          <div className="flex gap-3 items-center">
                            <input type="color" name="theme.backgroundColor" value={systemSettings.theme.backgroundColor} onChange={handleSystemSettingChange} className="w-12 h-12 rounded-xl cursor-pointer border-none" />
                            <input value={systemSettings.theme.backgroundColor} onChange={handleSystemSettingChange} name="theme.backgroundColor" className="flex-1 h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-xs font-mono no-uppercase" />
                          </div>
                      </div>
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase">Arredondamento</label>
                          <select name="theme.borderRadius" value={systemSettings.theme.borderRadius} onChange={handleSystemSettingChange} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl font-bold text-xs no-uppercase">
                              <option value="0px">Quadrado (0px)</option>
                              <option value="8px">Leve (8px)</option>
                              <option value="12px">Padrão (12px)</option>
                              <option value="24px">Extra Arredondado (24px)</option>
                              <option value="50px">Cápsula (50px)</option>
                          </select>
                      </div>
                  </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Fonte do Sistema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {FONT_OPTIONS.map(font => (
                          <div 
                            key={font.name} 
                            onClick={() => setSystemSettings(prev => ({ ...prev, theme: { ...prev.theme, fontFamily: font.value }}))}
                            className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${systemSettings.theme.fontFamily === font.value ? 'border-[var(--primary-color)] bg-blue-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                            style={{ fontFamily: font.value }}
                          >
                              <p className="text-lg mb-1 no-uppercase">{font.name.split(' (')[0]}</p>
                              <p className="text-xs text-slate-500 no-uppercase">The quick brown fox jumps over the lazy dog.</p>
                              {systemSettings.theme.fontFamily === font.value && <div className="mt-3 flex items-center text-[var(--primary-color)] text-[10px] font-black uppercase tracking-widest"><CheckCircleIcon className="w-4 h-4 mr-1" /> Selecionada</div>}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'servicos' && (
          <div className="space-y-8 animate-fadeIn">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                            <MoneyBagIcon className="w-5 h-5 mr-2 text-green-500" /> Catálogo de Serviços do Estúdio
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Defina seus serviços e valores base para agilizar novos orçamentos.</p>
                      </div>
                      <button onClick={addService} className="px-4 py-2 bg-[var(--primary-color)] text-white font-black text-[10px] uppercase rounded-xl shadow-md">+ Add Novo Serviço</button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                      {localServicePrices.map((service) => (
                          <div key={service.id} className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col md:flex-row items-center gap-6 group hover:border-blue-200 transition-all">
                              <div className="flex-1 w-full space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Nome do Serviço</label>
                                  <input 
                                    value={service.name} 
                                    onChange={e => updateService(service.id, 'name', e.target.value)}
                                    className="w-full bg-white border-slate-200 rounded-xl px-4 h-10 font-bold uppercase text-sm outline-none focus:border-blue-500" 
                                    placeholder="EX: PROJETO DE INTERIORES"
                                  />
                              </div>

                              <div className="w-full md:w-48 space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Tipo de Cobrança</label>
                                  <select 
                                    value={service.unit} 
                                    onChange={e => updateService(service.id, 'unit', e.target.value)}
                                    className="w-full bg-white border-slate-200 rounded-xl px-4 h-10 font-bold text-xs outline-none focus:border-blue-500"
                                  >
                                      <option value="m²">POR METRAGEM (m²)</option>
                                      <option value="hora">POR HORA TÉCNICA</option>
                                      <option value="fixo">VALOR FIXO / PACOTE</option>
                                  </select>
                              </div>

                              <div className="w-full md:w-32 space-y-1">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Valor Sugerido (R$)</label>
                                  <input 
                                    type="number"
                                    value={service.price || 0} 
                                    onChange={e => updateService(service.id, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-white border-slate-200 rounded-xl px-4 h-10 font-black text-blue-600 text-sm text-center outline-none focus:border-blue-500" 
                                    placeholder="0,00"
                                  />
                              </div>

                              <div className="flex items-end h-full">
                                  <button onClick={() => removeService(service.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                                      <TrashIcon className="w-5 h-5" />
                                  </button>
                              </div>
                          </div>
                      ))}

                      {localServicePrices.length === 0 && (
                          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                               <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Nenhum serviço cadastrado ainda.</p>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'modelos' && (
          <div className="space-y-12 animate-fadeIn">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Fases Padrão de Projeto</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Defina a sequência que será carregada em cada novo contrato. Clique e arraste para reordenar.</p>
                      </div>
                      <button onClick={addStageTemplate} className="px-4 py-2 bg-[var(--primary-color)] text-white font-black text-[10px] uppercase rounded-xl shadow-md">+ Add Etapa</button>
                  </div>
                  <div className="space-y-3">
                      {systemSettings.projectStagesTemplate.map((stage, idx) => (
                          <div 
                            key={stage.id} 
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(idx)}
                            className={`flex gap-4 items-center p-3 bg-slate-50 rounded-xl border border-slate-100 group transition-all cursor-grab active:cursor-grabbing ${draggedItemIndex === idx ? 'opacity-50 border-dashed border-[var(--primary-color)]' : ''}`}
                          >
                              <div className="flex items-center text-slate-300">
                                <GripVerticalIcon className="w-5 h-5" />
                              </div>
                              <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[var(--primary-color)] font-black text-xs shadow-sm">{idx + 1}</span>
                              <input 
                                value={stage.name} 
                                onMouseDown={(e) => e.stopPropagation()} 
                                onChange={e => setSystemSettings(prev => ({ ...prev, projectStagesTemplate: prev.projectStagesTemplate.map(s => s.id === stage.id ? { ...s, name: e.target.value.toUpperCase() } : s) }))}
                                className="flex-1 bg-transparent border-none font-bold text-slate-700 outline-none uppercase" 
                              />
                              <div className="flex items-center gap-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase">Dias Úteis:</label>
                                  <input 
                                    type="number" 
                                    onMouseDown={(e) => e.stopPropagation()}
                                    value={stage.durationWorkDays} 
                                    onChange={e => setSystemSettings(prev => ({ ...prev, projectStagesTemplate: prev.projectStagesTemplate.map(s => s.id === stage.id ? { ...s, durationWorkDays: parseInt(e.target.value) || 0 } : s) }))}
                                    className="w-16 h-8 bg-white border border-slate-200 rounded-lg text-center font-bold text-xs" 
                                  />
                              </div>
                              <button onClick={() => removeStageTemplate(stage.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                  <TrashIcon className="w-4 h-4" />
                              </button>
                          </div>
                      ))}
                  </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Checklist Mestre de Obra</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sua lista técnica que garante a qualidade de cada entrega.</p>
                      </div>
                      <button onClick={addChecklistItem} className="px-4 py-2 bg-[var(--primary-color)] text-white font-black text-[10px] uppercase rounded-xl shadow-md">+ Add Item Técnico</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {systemSettings.checklistTemplate.map((item) => (
                          <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                              <div className="flex justify-between items-center">
                                  <input 
                                    placeholder="Fase da Obra" 
                                    value={item.stage}
                                    onChange={e => setSystemSettings(prev => ({ ...prev, checklistTemplate: prev.checklistTemplate.map(i => i.id === item.id ? { ...i, stage: e.target.value.toUpperCase() } : i) }))}
                                    className="text-[9px] font-black uppercase text-[var(--primary-color)] bg-transparent border-none outline-none tracking-widest"
                                  />
                                  <button onClick={() => setSystemSettings(prev => ({ ...prev, checklistTemplate: prev.checklistTemplate.filter(i => i.id !== item.id) }))} className="text-slate-300 hover:text-red-500 transition-colors">
                                      <TrashIcon className="w-4 h-4" />
                                  </button>
                              </div>
                              <input 
                                value={item.text} 
                                placeholder="Descreva a ação..."
                                onChange={e => setSystemSettings(prev => ({ ...prev, checklistTemplate: prev.checklistTemplate.map(i => i.id === item.id ? { ...i, text: e.target.value.toUpperCase() } : i) }))}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-600 outline-none focus:border-[var(--primary-color)] uppercase"
                              />
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* FOOTER PERSISTENTE DE AJUSTES */}
      <div className="fixed bottom-0 left-64 right-0 p-6 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40 flex justify-center no-print">
          <div className="max-w-4xl w-full flex justify-between items-center px-10">
              <div className="flex items-center text-slate-400 gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Salve para aplicar as mudanças e atualizar seu catálogo de serviços</span>
              </div>
              <div className="flex gap-4">
                  <button onClick={() => {
                      setSystemSettings(appData.systemSettings);
                      setLocalServicePrices(appData.servicePrices);
                      setLocalHourlyRates(appData.hourlyRates);
                  }} className="px-6 py-3 font-black uppercase text-[10px] text-slate-400 hover:text-slate-600 transition-all">Descartar</button>
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className={`px-12 py-3 bg-[var(--primary-color)] text-white font-black uppercase text-xs tracking-widest rounded-xl shadow-xl shadow-blue-500/20 hover:scale-105 transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Tudo'}
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Settings;
