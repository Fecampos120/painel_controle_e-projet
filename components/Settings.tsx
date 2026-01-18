
import React, { useState, useRef } from 'react';
import { PlusIcon, TrashIcon, XIcon, BrandLogo, UploadIcon, CheckCircleIcon, ArchitectIcon, MapPinIcon, GripVerticalIcon, MoneyBagIcon, SparklesIcon, DownloadIcon, HistoryIcon } from './Icons';
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
  const [activeTab, setActiveTab] = useState<'empresa' | 'visual' | 'servicos' | 'modelos' | 'manutencao'>('empresa');
  const [localSettings, setLocalSettings] = useState<SystemSettings>(JSON.parse(JSON.stringify(appData.systemSettings)));
  const [localServices, setLocalServices] = useState<ServicePrice[]>(appData.servicePrices || []);
  const [localStages, setLocalStages] = useState<ProjectStageTemplateItem[]>(appData.systemSettings.projectStagesTemplate || []);
  const [localChecklist, setLocalChecklist] = useState<ChecklistItemTemplate[]>(appData.systemSettings.checklistTemplate || []);
  
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveAll = () => {
    setIsSaving(true);
    setAppData(prev => ({ 
        ...prev, 
        systemSettings: {
            ...localSettings,
            projectStagesTemplate: localStages,
            checklistTemplate: localChecklist
        },
        servicePrices: localServices
    }));
    setTimeout(() => {
        setIsSaving(false);
        alert('CONFIGURAÇÕES APLICADAS COM SUCESSO!');
    }, 800);
  };

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_eprojet_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    // Exportação simplificada em CSV para compatibilidade Excel
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "TIPO,CLIENTE,PROJETO,VALOR,STATUS\n";
    appData.contracts.forEach(c => {
        csvContent += `PROJETO,${c.clientName},${c.projectName},${c.totalValue},${c.status}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_geral_eprojet.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleResetData = () => {
      if (window.confirm("ATENÇÃO: VOCÊ ESTÁ PRESTES A APAGAR TODOS OS CLIENTES, CONTRATOS E FINANCEIRO. ESTA AÇÃO NÃO PODE SER DESFEITA. DESEJA CONTINUAR?")) {
          localStorage.clear();
          window.location.reload();
      }
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

  return (
    <div className="space-y-8 pb-40 animate-fadeIn uppercase">
      <header className="bg-[var(--primary-color)] text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-black tracking-tight">CONFIGURAÇÕES GERAIS</h1>
            <p className="mt-1 text-white/80 italic text-sm">PERSONALIZE O COMPORTAMENTO, VISUAL E CATÁLOGO DE SERVIÇOS DO SEU SISTEMA.</p>
        </div>
        <button onClick={handleSaveAll} className="px-8 py-3 bg-white text-[var(--primary-color)] font-black rounded-xl shadow-xl hover:scale-105 transition-all text-xs tracking-widest">
            SALVAR ALTERAÇÕES
        </button>
      </header>

      <div className="flex border-b border-slate-200 mb-8 space-x-10 overflow-x-auto no-scrollbar">
          {['empresa', 'visual', 'servicos', 'modelos', 'manutencao'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab as any)} 
                className={`pb-4 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-[var(--primary-color)]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'empresa' && 'DADOS DA EMPRESA'}
                {tab === 'visual' && 'IDENTIDADE VISUAL'}
                {tab === 'servicos' && 'SERVIÇOS & PREÇOS'}
                {tab === 'modelos' && 'FASES & CRONOGRAMAS'}
                {tab === 'manutencao' && 'SISTEMA & BACKUP'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--primary-color)] rounded-full"></div>}
              </button>
          ))}
      </div>

      {activeTab === 'empresa' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 flex flex-col items-center justify-center border-r border-slate-100 pr-12">
                        <div className="w-48 h-48 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
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
                        <p className="mt-4 text-[10px] font-black text-slate-400 text-center uppercase tracking-widest leading-relaxed">LOGO PRINCIPAL<br/>(APARECE NOS RELATÓRIOS E PORTAL)</p>
                    </div>
                    
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NOME DO SISTEMA / APP</label>
                            <input name="appName" value={localSettings.appName} onChange={handleChange} className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NOME DA EMPRESA (RAZÃO SOCIAL)</label>
                            <input name="companyName" value={localSettings.companyName} onChange={handleChange} className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RESPONSÁVEL TÉCNICO / ARQUITETO</label>
                            <input name="professionalName" value={localSettings.professionalName} onChange={handleChange} className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-slate-800" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WHATSAPP CORPORATIVO</label>
                            <input name="phone" value={localSettings.phone} onChange={handleChange} className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-black text-slate-800 no-uppercase" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-3 text-[var(--primary-color)]" /> ENDEREÇO COMERCIAL
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-3 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">CEP</label>
                        <input name="address.cep" value={localSettings.address.cep} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-bold no-uppercase" />
                    </div>
                    <div className="md:col-span-7 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">LOGRADOURO / RUA</label>
                        <input name="address.street" value={localSettings.address.street} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-bold" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">Nº</label>
                        <input name="address.number" value={localSettings.address.number} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-bold" />
                    </div>
                    <div className="md:col-span-4 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">BAIRRO</label>
                        <input name="address.district" value={localSettings.address.district} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-bold" />
                    </div>
                    <div className="md:col-span-6 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">CIDADE</label>
                        <input name="address.city" value={localSettings.address.city} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-bold" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase">UF</label>
                        <input name="address.state" maxLength={2} value={localSettings.address.state} onChange={handleChange} className="w-full h-12 px-4 rounded-xl border-2 border-slate-100 bg-slate-50/50 font-bold text-center" />
                    </div>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'visual' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                    <SparklesIcon className="w-5 h-5 mr-3 text-yellow-500" /> PALETA DE CORES & LAYOUT
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase">COR DE DESTAQUE</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                            <input type="color" name="theme.primaryColor" value={localSettings.theme.primaryColor} onChange={handleChange} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent" />
                            <input type="text" value={localSettings.theme.primaryColor} onChange={(e) => setLocalSettings(p => ({...p, theme: {...p.theme, primaryColor: e.target.value}}))} className="bg-transparent font-bold text-xs w-20 outline-none no-uppercase" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase">MENU LATERAL</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                            <input type="color" name="theme.sidebarColor" value={localSettings.theme.sidebarColor} onChange={handleChange} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent" />
                            <input type="text" value={localSettings.theme.sidebarColor} onChange={(e) => setLocalSettings(p => ({...p, theme: {...p.theme, sidebarColor: e.target.value}}))} className="bg-transparent font-bold text-xs w-20 outline-none no-uppercase" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase">FUNDO DE TELA</label>
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border-2 border-slate-100">
                            <input type="color" name="theme.backgroundColor" value={localSettings.theme.backgroundColor} onChange={handleChange} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent" />
                            <input type="text" value={localSettings.theme.backgroundColor} onChange={(e) => setLocalSettings(p => ({...p, theme: {...p.theme, backgroundColor: e.target.value}}))} className="bg-transparent font-bold text-xs w-20 outline-none no-uppercase" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase">ARREDONDAMENTO</label>
                        <select name="theme.borderRadius" value={localSettings.theme.borderRadius} onChange={handleChange} className="w-full h-16 px-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none">
                            <option value="4px">RETRO (4PX)</option>
                            <option value="8px">LEVE (8PX)</option>
                            <option value="12px">PADRÃO (12PX)</option>
                            <option value="20px">MODERNO (20PX)</option>
                            <option value="32px">SOFT (32PX)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10">FONTE DO SISTEMA</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {FONT_OPTIONS.map(font => (
                        <div 
                            key={font.value} 
                            onClick={() => setLocalSettings(prev => ({ ...prev, theme: { ...prev.theme, fontFamily: font.value } }))}
                            className={`p-8 rounded-[2rem] border-2 cursor-pointer transition-all hover:scale-[1.02] ${localSettings.theme.fontFamily === font.value ? 'border-[var(--primary-color)] bg-blue-50/20 shadow-lg' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                            style={{ fontFamily: font.value }}
                        >
                            <p className="text-xl font-black mb-2 text-slate-800 no-uppercase">{font.name.split(' (')[0]}</p>
                            <p className="text-xs text-slate-400 leading-relaxed no-uppercase">The quick brown fox jumps over the lazy dog.</p>
                            {localSettings.theme.fontFamily === font.value && (
                                <p className="mt-4 text-[9px] font-black text-[var(--primary-color)] flex items-center uppercase tracking-widest">
                                    <CheckCircleIcon className="w-4 h-4 mr-2" /> SELECIONADA
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'servicos' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                            <MoneyBagIcon className="w-5 h-5 mr-3 text-yellow-600" /> CATÁLOGO DE SERVIÇOS DO ESTÚDIO
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2">DEFINA SEUS SERVIÇOS E VALORES BASE PARA AGILIZAR NOVOS ORÇAMENTOS.</p>
                    </div>
                    <button 
                        onClick={() => setLocalServices([...localServices, { id: Date.now(), name: 'NOVO SERVIÇO', unit: 'm²' }])}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg hover:scale-105 transition-all"
                    >
                        + ADD NOVO SERVIÇO
                    </button>
                </div>

                <div className="space-y-4">
                    {localServices.map((service, index) => (
                        <div key={service.id} className="p-6 bg-slate-50/50 rounded-2xl border-2 border-slate-100 flex flex-col md:flex-row items-center gap-8 group">
                            <div className="flex-1 w-full space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">NOME DO SERVIÇO</label>
                                <input 
                                    value={service.name} 
                                    onChange={(e) => setLocalServices(localServices.map(s => s.id === service.id ? {...s, name: e.target.value.toUpperCase()} : s))}
                                    className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-800 outline-none focus:border-blue-500" 
                                />
                            </div>
                            <div className="w-full md:w-64 space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">TIPO DE COBRANÇA</label>
                                <select 
                                    value={service.unit === 'm²' ? 'metragem' : service.unit === 'hora' ? 'hora' : 'fixo'}
                                    onChange={(e) => {
                                        const mapping: any = { metragem: 'm²', hora: 'hora', fixo: 'pacote' };
                                        setLocalServices(localServices.map(s => s.id === service.id ? {...s, unit: mapping[e.target.value]} : s));
                                    }}
                                    className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-[10px] uppercase outline-none focus:border-blue-500"
                                >
                                    <option value="metragem">POR METRAGEM (M²)</option>
                                    <option value="hora">POR HORA TÉCNICA</option>
                                    <option value="fixo">VALOR FIXO / PACOTE</option>
                                </select>
                            </div>
                            <div className="w-full md:w-40 space-y-1">
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">VALOR SUGERIDO (R$)</label>
                                <input 
                                    type="number" 
                                    value={service.price || 0} 
                                    onChange={(e) => setLocalServices(localServices.map(s => s.id === service.id ? {...s, price: parseFloat(e.target.value)} : s))}
                                    className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-blue-600 outline-none focus:border-blue-500 text-center" 
                                />
                            </div>
                            <button 
                                onClick={() => setLocalServices(localServices.filter(s => s.id !== service.id))}
                                className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                            >
                                <TrashIcon className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'modelos' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">FASES PADRÃO DE PROJETO</h3>
                    <button onClick={() => setLocalStages([...localStages, { id: Date.now(), name: 'NOVA ETAPA', sequence: localStages.length + 1, durationWorkDays: 5 }])} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase">+ ADD ETAPA</button>
                </div>
                <div className="space-y-3">
                    {localStages.sort((a,b) => a.sequence - b.sequence).map((stage, idx) => (
                        <div key={stage.id} className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 group">
                            <div className="w-8 h-8 flex items-center justify-center text-slate-300 cursor-grab"><GripVerticalIcon className="w-5 h-5" /></div>
                            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">{idx + 1}</span>
                            <input 
                                value={stage.name} 
                                onChange={(e) => setLocalStages(localStages.map(s => s.id === stage.id ? {...s, name: e.target.value.toUpperCase()} : s))}
                                className="flex-1 bg-transparent border-none font-black text-slate-700 uppercase focus:ring-0" 
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">DIAS ÚTEIS:</span>
                                <input 
                                    type="number" 
                                    value={stage.durationWorkDays} 
                                    onChange={(e) => setLocalStages(localStages.map(s => s.id === stage.id ? {...s, durationWorkDays: parseInt(e.target.value)} : s))}
                                    className="w-16 h-10 bg-white border border-slate-200 rounded-lg text-center font-black text-xs" 
                                />
                            </div>
                            <button onClick={() => setLocalStages(localStages.filter(s => s.id !== stage.id))} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">CHECKLIST MESTRE DE OBRA</h3>
                    <button onClick={() => setLocalChecklist([...localChecklist, { id: Date.now(), text: 'NOVA TAREFA', stage: 'GERAL' }])} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase">+ ADD TAREFA</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {localChecklist.map(item => (
                        <div key={item.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center gap-4 group">
                             <div className="flex-1 space-y-1">
                                <input 
                                    value={item.text} 
                                    onChange={(e) => setLocalChecklist(localChecklist.map(i => i.id === item.id ? {...i, text: e.target.value.toUpperCase()} : i))}
                                    className="w-full bg-transparent border-none font-bold text-slate-600 uppercase text-[11px] focus:ring-0" 
                                />
                                <input 
                                    value={item.stage} 
                                    onChange={(e) => setLocalChecklist(localChecklist.map(i => i.id === item.id ? {...i, stage: e.target.value.toUpperCase()} : i))}
                                    className="w-full bg-transparent border-none text-blue-500 font-black uppercase text-[8px] tracking-widest focus:ring-0" 
                                />
                             </div>
                             <button onClick={() => setLocalChecklist(localChecklist.filter(i => i.id !== item.id))} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'manutencao' && (
          <div className="animate-fadeIn space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center">
                      <HistoryIcon className="w-5 h-5 mr-3 text-blue-500" /> MANUTENÇÃO DO SISTEMA
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SEGURANÇA DOS DADOS</p>
                          <h4 className="text-xl font-black text-slate-800">BACKUP EXTERNO</h4>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">FAÇA O DOWNLOAD DE TODOS OS SEUS DADOS EM UM ARQUIVO JSON. VOCÊ PODE RESTAURAR ESTE ARQUIVO EM QUALQUER DISPOSITIVO.</p>
                          <button 
                            onClick={handleExportBackup}
                            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center uppercase text-[10px] tracking-widest"
                          >
                            <DownloadIcon className="w-5 h-5 mr-2" /> EXPORTAR BACKUP (JSON)
                          </button>
                      </div>

                      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RELATÓRIOS</p>
                          <h4 className="text-xl font-black text-slate-800">EXPORTAÇÃO EXCEL</h4>
                          <p className="text-xs text-slate-500 font-bold leading-relaxed">GERA UMA PLANILHA COM O RESUMO DE TODOS OS CONTRATOS E CLIENTES PARA ANÁLISE EXTERNA.</p>
                          <button 
                            onClick={handleExportExcel}
                            className="w-full py-4 bg-green-600 text-white font-black rounded-2xl shadow-xl hover:bg-green-700 transition-all flex items-center justify-center uppercase text-[10px] tracking-widest"
                          >
                            <DownloadIcon className="w-5 h-5 mr-2" /> EXPORTAR EXCEL (CSV)
                          </button>
                      </div>
                  </div>

                  <div className="mt-12 pt-10 border-t border-red-50">
                      <div className="flex flex-col items-center text-center space-y-4">
                          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                              <TrashIcon className="w-6 h-6" />
                          </div>
                          <div>
                              <h4 className="text-lg font-black text-red-600 uppercase tracking-tight">LIMPAR TODOS OS DADOS</h4>
                              <p className="text-[10px] text-slate-400 font-bold max-w-md mx-auto uppercase mt-2">ESSA OPERAÇÃO APAGA DEFINITIVAMENTE CLIENTES, CONTRATOS, NOTAS E REGISTROS. USE APENAS SE DESEJAR RECOMEÇAR O SISTEMA DO ZERO.</p>
                          </div>
                          <button 
                            onClick={handleResetData}
                            className="px-10 py-4 border-2 border-red-100 text-red-400 hover:bg-red-500 hover:text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest"
                          >
                            LIMPAR BANCO DE DADOS
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* FOOTER PERSISTENTE DE SALVAMENTO */}
      <div className="fixed bottom-0 left-64 right-0 bg-slate-100/95 backdrop-blur-md p-6 border-t border-slate-200 z-[100] flex justify-between items-center px-12">
          <div className="flex items-center text-green-600 font-black text-[10px] uppercase tracking-widest animate-pulse">
              <CheckCircleIcon className="w-5 h-5 mr-3" /> SALVE PARA APLICAR AS MUDANÇAS E ATUALIZAR SEU CATÁLOGO DE SERVIÇOS
          </div>
          <div className="flex items-center gap-8">
              <button onClick={() => window.location.reload()} className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-colors">DESCARTAR</button>
              <button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-16 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all text-xs tracking-[0.2em]"
              >
                  {isSaving ? 'PROCESSANDO...' : 'SALVAR TUDO'}
              </button>
          </div>
      </div>
    </div>
  );
};

export default Settings;
