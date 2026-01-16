
import React, { useState, useRef } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, XIcon, BrandLogo, UploadIcon, CheckCircleIcon } from './Icons';
import { ServicePrice, PriceTier, AppData, ProjectStageTemplateItem, SystemSettings } from '../types';

type SettingItem = ServicePrice | PriceTier | ProjectStageTemplateItem;

const SettingSection: React.FC<{
  title: string;
  description: string;
  items: SettingItem[];
  onAdd?: () => void;
  onEdit: (item: SettingItem) => void;
  onDelete?: (id: number) => void;
  renderItem: (item: SettingItem) => React.ReactNode;
}> = ({ title, description, items, onAdd, onEdit, onDelete, renderItem }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        {renderItem(item)}
                        <div className="flex items-center space-x-1">
                            <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><PencilIcon className="w-4 h-4" /></button>
                            {onDelete && <button onClick={() => onDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"><TrashIcon className="w-4 h-4" /></button>}
                        </div>
                    </div>
                ))}
                {onAdd && (
                    <button onClick={onAdd} className="flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 pt-2 uppercase tracking-widest">
                       <PlusIcon className="w-4 h-4 mr-1.5" /> Adicionar Novo
                    </button>
                )}
            </div>
        </div>
    </div>
);

const Settings: React.FC<{ appData: AppData; setAppData: React.Dispatch<React.SetStateAction<AppData>> }> = ({ appData, setAppData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<{key: keyof AppData, title: string} | null>(null);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [formData, setFormData] = useState<Partial<SettingItem>>({});
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(appData.systemSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sections: { [key in keyof AppData]?: any } = {
    servicePrices: {
      title: 'Tipo de Serviço',
      description: 'Configure os serviços que você oferece e seus preços base.',
      fields: ['name', 'price', 'unit'],
      labels: { name: 'Nome do Serviço', price: 'Preço Base', unit: 'Unidade'},
      render: (item: ServicePrice) => (
          <div><p className="font-bold text-slate-700 text-sm">{item.name}</p><p className="text-xs text-slate-500">{item.price ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)} / ${item.unit}` : 'Preço por Projeto'}</p></div>
      )
    },
    hourlyRates: {
      title: 'Taxa por Hora',
      description: 'Defina valores para serviços cobrados por hora.',
      fields: ['name', 'price'],
      labels: { name: 'Identificação', price: 'Valor Hora'},
       render: (item: ServicePrice) => (
          <div><p className="font-bold text-slate-700 text-sm">{item.name}</p><p className="text-xs text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)} / hora</p></div>
      )
    },
  };

  const openModal = (sectionKey: keyof AppData, item: SettingItem | null = null) => {
    setCurrentSection({ key: sectionKey, title: sections[sectionKey]!.title});
    setEditingItem(item);
    setFormData(item ? { ...item } : {});
    setIsModalOpen(true);
  };

  const handleSystemSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name.includes('address.')) {
          const field = name.split('.')[1];
          setSystemSettings(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
      } else {
          setSystemSettings(prev => ({ ...prev, [name]: value }));
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

  return (
    <div className="space-y-8 pb-10 animate-fadeIn">
      {/* Header replicado da imagem: Azul sólido com subtítulo */}
      <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="mt-1 text-blue-50 opacity-90 text-sm">
          Personalize os valores padrão, modelos e a identidade da sua empresa.
        </p>
      </header>

      {/* Identidade Visual Card - Replicado da imagem */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <div className="flex justify-between items-start mb-8">
              <div>
                  <h2 className="text-xl font-bold text-slate-800">Identidade Visual e Dados da Empresa</h2>
                  <p className="text-sm text-slate-500 mt-1">Personalize o nome, logo e endereço que aparecerão no menu e nos relatórios.</p>
              </div>
              <button onClick={() => setAppData(prev => ({ ...prev, systemSettings }))} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-all flex items-center">
                  Salvar Alterações
              </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 flex flex-col items-center">
                  <div className="w-full aspect-square max-w-[240px] bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                      {systemSettings.logoUrl ? (
                          <img src={systemSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                      ) : (
                          <BrandLogo className="w-16 h-16 text-slate-200" />
                      )}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white rounded-full shadow-lg text-blue-600"><UploadIcon className="w-6 h-6" /></button>
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="mt-4 flex items-center text-xs font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-800">
                      <UploadIcon className="w-4 h-4 mr-2" /> Alterar Logotipo
                  </button>
              </div>

              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do App (Menu)</label>
                      <input type="text" name="appName" value={systemSettings.appName} onChange={handleSystemSettingChange} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg focus:bg-white transition-all text-sm font-medium" />
                  </div>
                  <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Empresa (Relatórios)</label>
                      <input type="text" name="companyName" value={systemSettings.companyName} onChange={handleSystemSettingChange} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg focus:bg-white transition-all text-sm font-medium" />
                  </div>
                  <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome do Profissional</label>
                      <input type="text" name="professionalName" value={systemSettings.professionalName} onChange={handleSystemSettingChange} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg focus:bg-white transition-all text-sm font-medium" />
                  </div>
                  <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone / Contato</label>
                      <input type="text" name="phone" value={systemSettings.phone} onChange={handleSystemSettingChange} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg focus:bg-white transition-all text-sm font-medium" />
                  </div>
                  
                  <div className="md:col-span-2 pt-4 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Endereço Profissional</h3>
                      <div className="grid grid-cols-6 gap-4">
                          <div className="col-span-6"><label className="text-[10px] font-bold text-slate-400 uppercase">Logradouro</label><input type="text" name="address.street" value={systemSettings.address.street} onChange={handleSystemSettingChange} className="w-full h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                          <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Número</label><input type="text" name="address.number" value={systemSettings.address.number} onChange={handleSystemSettingChange} className="w-full h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                          <div className="col-span-4"><label className="text-[10px] font-bold text-slate-400 uppercase">Bairro</label><input type="text" name="address.district" value={systemSettings.address.district} onChange={handleSystemSettingChange} className="w-full h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                          <div className="col-span-4"><label className="text-[10px] font-bold text-slate-400 uppercase">Cidade</label><input type="text" name="address.city" value={systemSettings.address.city} onChange={handleSystemSettingChange} className="w-full h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                          <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">Estado</label><input type="text" name="address.state" value={systemSettings.address.state} onChange={handleSystemSettingChange} className="w-full h-10 px-3 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {(Object.keys(sections) as (keyof AppData)[]).map(key => (
              <SettingSection
                key={key}
                title={sections[key].title}
                description={sections[key].description}
                items={appData[key] as SettingItem[]}
                onAdd={() => openModal(key)}
                onEdit={(item) => openModal(key, item)}
                onDelete={(id) => setAppData(prev => ({...prev, [key]: (prev[key] as any[]).filter(i => i.id !== id)}))}
                renderItem={sections[key].render}
              />
          ))}
      </div>

      {isModalOpen && currentSection && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight">{editingItem ? 'Editar' : 'Adicionar'} Item</h3>
                    <button onClick={() => setIsModalOpen(false)}><XIcon className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="p-8 space-y-4">
                    {sections[currentSection.key].fields.map((f: string) => (
                        <div key={f}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{sections[currentSection.key].labels[f]}</label>
                            <input type={f === 'price' ? 'number' : 'text'} value={(formData as any)[f] || ''} onChange={e => setFormData(p => ({...p, [f]: f==='price' ? parseFloat(e.target.value) : e.target.value}))} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-xl" />
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-slate-500 uppercase text-xs">Cancelar</button>
                    <button onClick={() => {
                        setAppData(p => ({...p, [currentSection.key]: editingItem ? (p[currentSection.key] as any[]).map(i => i.id === editingItem.id ? {...i, ...formData} : i) : [...(p[currentSection.key] as any[]), {...formData, id: Date.now()}]}));
                        setIsModalOpen(false);
                    }} className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 uppercase text-xs tracking-widest">Salvar Item</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
