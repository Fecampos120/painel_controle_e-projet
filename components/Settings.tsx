
import React, { useState } from 'react';
import { PlusIcon, TrashIcon, PencilIcon, XIcon } from './Icons';
import { ServicePrice, PriceTier, AppData, ProjectStageTemplateItem } from '../types';

// Generic type for items in sections
type SettingItem = ServicePrice | PriceTier | ProjectStageTemplateItem;

interface SettingSectionProps {
  title: string;
  description: string;
  items: SettingItem[];
  onAdd?: () => void; // Made optional
  onEdit: (item: SettingItem) => void;
  onDelete?: (id: number) => void; // Made optional
  renderItem: (item: SettingItem) => React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, description, items, onAdd, onEdit, onDelete, renderItem }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
        <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-md">
                        {renderItem(item)}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <button 
                                onClick={() => onEdit(item)}
                                disabled={(item as ServicePrice).name === 'Gerenciamento de Obras'}
                                className="p-1 text-slate-400 hover:text-blue-600 disabled:text-slate-300 disabled:cursor-not-allowed"
                                aria-label="Editar"
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            {onDelete && (
                                <button onClick={() => onDelete(item.id)} className="p-1 text-slate-400 hover:text-red-600" aria-label="Excluir"><TrashIcon className="w-5 h-5" /></button>
                            )}
                        </div>
                    </div>
                ))}
                {onAdd && (
                    <button onClick={onAdd} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 pt-2">
                       <PlusIcon className="w-5 h-5 mr-1" /> Adicionar
                    </button>
                )}
            </div>
        </div>
    </div>
);

interface SettingsProps {
    appData: AppData;
    setAppData: React.Dispatch<React.SetStateAction<AppData>>;
}

const Settings: React.FC<SettingsProps> = ({ appData, setAppData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<{key: keyof AppData, title: string} | null>(null);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [formData, setFormData] = useState<Partial<SettingItem>>({});

  const sections: { [key in keyof AppData]?: any } = {
    servicePrices: {
      title: 'Tipo de Serviço',
      description: 'Configure os serviços que você oferece e seus preços base.',
      fields: ['name', 'price', 'unit'],
      labels: { name: 'Nome do Serviço', price: 'Preço (Opcional)', unit: 'Unidade'},
      render: (item: ServicePrice) => (
          <div>
              <p className="font-medium text-slate-700">{item.name}</p>
              <p className="text-sm text-slate-500">
                {typeof item.price === 'number'
                    ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)} / ${item.unit}`
                    : item.name === 'Medição e Planta Baixa' 
                        ? 'Preço configurado por faixas de m²'
                        : 'Valor a definir por projeto'
                }
              </p>
          </div>
      )
    },
    hourlyRates: {
      title: 'Taxa por Hora',
      description: 'Defina valores para serviços cobrados por hora.',
      fields: ['name', 'price'],
      labels: { name: 'Nome da Taxa', price: 'Preço por Hora'},
       render: (item: ServicePrice) => (
          <div>
              <p className="font-medium text-slate-700">{item.name}</p>
              <p className="text-sm text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)} / hora</p>
          </div>
      )
    },
    measurementTiers: {
      title: 'Medição e Planta Baixa',
      description: 'Preços fixos com base na área total.',
      fields: ['range', 'price'],
      labels: { range: 'Faixa (Ex: 0 a 100 m²)', price: 'Preço Fixo'},
      render: (item: PriceTier) => (
          <div>
              <p className="font-medium text-slate-700">{item.range}</p>
              <p className="text-sm text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
          </div>
      )
    },
    extraTiers: {
      title: 'Acréscimos (Elétrica/Hidráulica/Forro)',
      description: 'Valores adicionais por pontos extras.',
      fields: ['range', 'price'],
      labels: { range: 'Faixa (Ex: 0 a 100 m²)', price: 'Preço Fixo'},
      render: (item: PriceTier) => (
           <div>
              <p className="font-medium text-slate-700">{item.range}</p>
              <p className="text-sm text-slate-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}</p>
          </div>
      )
    },
    projectStagesTemplate: {
      title: 'Grade de Etapas Padrão',
      description: 'Edite ou adicione etapas que servirão como modelo para novos projetos. A ordem é reajustada automaticamente ao salvar.',
      fields: ['sequence', 'name', 'durationWorkDays'],
      labels: { sequence: 'Ordem', name: 'Nome da Etapa', durationWorkDays: 'Duração (dias úteis)'},
      render: (item: ProjectStageTemplateItem) => (
          <div className="flex items-center space-x-4 flex-grow">
              <span className="font-bold text-slate-500 w-6 text-center">{item.sequence}</span>
              <div className="border-l border-slate-200 pl-4">
                  <p className="font-medium text-slate-700">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.durationWorkDays} dia(s) útil(eis)</p>
              </div>
          </div>
      )
    },
  };

  const openModal = (sectionKey: keyof AppData, item: SettingItem | null = null) => {
    setCurrentSection({ key: sectionKey, title: sections[sectionKey]!.title});
    setEditingItem(item);
    if (item) {
        setFormData({ ...item });
    } else if (sectionKey === 'projectStagesTemplate') {
        const lastItem = [...appData.projectStagesTemplate].sort((a,b) => a.sequence - b.sequence).pop();
        const nextSequence = lastItem ? lastItem.sequence + 1 : 1;
        setFormData({ sequence: nextSequence });
    } else {
        setFormData({});
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSection(null);
    setEditingItem(null);
    setFormData({});
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: (name === 'price' || name === 'durationWorkDays' || name === 'sequence') ? (value === '' ? undefined : parseFloat(value)) : value }));
  };

  const handleSave = () => {
    if (!currentSection) return;
    const sectionKey = currentSection.key;

    setAppData(prevData => {
        const currentItems = [...(prevData[sectionKey] as SettingItem[])] || [];
        let intermediateItems;
        if (editingItem) {
            intermediateItems = currentItems.map(item => item.id === editingItem.id ? { ...item, ...formData } : item);
        } else {
            let newItem: any = { id: Date.now(), ...formData };
            if (sectionKey === 'hourlyRates') {
                newItem.unit = 'hora';
            }
            intermediateItems = [...currentItems, newItem];
        }
        
        let finalItems = intermediateItems;
        if (sectionKey === 'projectStagesTemplate') {
            finalItems = (intermediateItems as ProjectStageTemplateItem[])
                .sort((a, b) => (a.sequence || 999) - (b.sequence || 999))
                .map((item, index) => ({ ...item, sequence: index + 1 }));
        }

        return { ...prevData, [sectionKey]: finalItems };
    });
    
    closeModal();
  };

  const handleDelete = (id: number, sectionKey: keyof AppData) => {
      if(window.confirm('Tem certeza que deseja excluir este item?')) {
        setAppData(prevData => {
            const currentItems = prevData[sectionKey] as SettingItem[] || [];
            const newItems = currentItems.filter(item => item.id !== id);
            return { ...prevData, [sectionKey]: newItems };
        });
      }
  };
  
  const handleGlobalSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const numValue = value === '' ? 0 : parseFloat(value);
      setAppData(prev => ({
          ...prev,
          appSettings: {
              ...prev.appSettings,
              [name]: numValue
          }
      }));
  };
  
  const renderModalFormFields = () => {
      if (!currentSection) return null;
      const sectionConfig = sections[currentSection.key]!;
      const isMeasurementService = (formData as ServicePrice)?.name === 'Medição e Planta Baixa';
      
      return sectionConfig.fields.map((field: string) => {
        const isNameField = field === 'name';
        const isUnitField = field === 'unit';
        const isPriceField = field === 'price';
        const isDisabled = (currentSection.key === 'servicePrices' && (isNameField || (isMeasurementService && (isPriceField || isUnitField))));

        if (currentSection.key === 'servicePrices' && field === 'unit') {
            return (
                <div key={field}>
                    <label htmlFor={field} className="block text-sm font-medium text-slate-700">{sectionConfig.labels[field]}</label>
                    <select
                        id={field}
                        name={field}
                        value={(formData as ServicePrice).unit || 'm²'}
                        onChange={handleFormChange}
                        disabled={isDisabled}
                        className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 ${isDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    >
                        <option value="m²">m²</option>
                        <option value="hora">hora</option>
                        <option value="un">un</option>
                        <option value="mês">mês</option>
                    </select>
                </div>
            );
        }

        return (
            <div key={field}>
                <label htmlFor={field} className="block text-sm font-medium text-slate-700">{sectionConfig.labels[field]}</label>
                <input
                    type={field === 'price' || field === 'durationWorkDays' || field === 'sequence' ? 'number' : 'text'}
                    id={field}
                    name={field}
                    value={(formData as any)[field] || ''}
                    onChange={handleFormChange}
                    disabled={isDisabled}
                    step={field === 'price' ? '0.01' : '1'}
                    min="0"
                    placeholder={field === 'price' ? 'Deixe em branco se for variável' : ''}
                    className={`mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 ${isDisabled ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                    required={field !== 'price' || currentSection.key !== 'servicePrices'}
                />
                 {isMeasurementService && (isPriceField || isUnitField) && (
                    <p className="text-xs text-slate-500 mt-1">O preço deste serviço é configurado na seção "Medição e Planta Baixa".</p>
                )}
            </div>
        );
      });
  };

  return (
    <div className="space-y-8">
        <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
            <h1 className="text-3xl font-bold">Configurações</h1>
            <p className="mt-1 text-blue-100">
                Ajuste as configurações da sua conta e do aplicativo.
            </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Global Settings Section */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-lg font-semibold text-slate-800">Parâmetros Globais</h2>
                <p className="mt-1 text-sm text-slate-500">Valores padrão utilizados em novos contratos.</p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="visitBasePrice" className="block text-sm font-medium text-slate-700">Preço Base da Visita Técnica (R$)</label>
                        <input
                            type="number"
                            id="visitBasePrice"
                            name="visitBasePrice"
                            value={appData.appSettings?.visitBasePrice ?? 80}
                            onChange={handleGlobalSettingsChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                            step="0.01"
                            min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1">Utilizado ao adicionar visitas in loco no contrato.</p>
                    </div>
                    <div>
                        <label htmlFor="mileageRate" className="block text-sm font-medium text-slate-700">Valor do KM Rodado (R$)</label>
                        <input
                            type="number"
                            id="mileageRate"
                            name="mileageRate"
                            value={appData.appSettings?.mileageRate ?? 1.40}
                            onChange={handleGlobalSettingsChange}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                            step="0.01"
                            min="0"
                        />
                        <p className="text-xs text-slate-500 mt-1">Utilizado para cálculo automático de deslocamento.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                <SettingSection
                    title={sections.servicePrices!.title}
                    description={sections.servicePrices!.description}
                    items={appData.servicePrices}
                    onEdit={(item) => openModal('servicePrices', item)}
                    renderItem={(item) => sections.servicePrices!.render(item as ServicePrice)}
                />
                 <SettingSection
                    title={sections.hourlyRates!.title}
                    description={sections.hourlyRates!.description}
                    items={appData.hourlyRates}
                    onAdd={() => openModal('hourlyRates')}
                    onEdit={(item) => openModal('hourlyRates', item)}
                    onDelete={(id) => handleDelete(id, 'hourlyRates')}
                    renderItem={(item) => sections.hourlyRates!.render(item as ServicePrice)}
                />
                 <SettingSection
                    title={sections.projectStagesTemplate!.title}
                    description={sections.projectStagesTemplate!.description}
                    items={[...appData.projectStagesTemplate].sort((a, b) => a.sequence - b.sequence)}
                    onAdd={() => openModal('projectStagesTemplate')}
                    onEdit={(item) => openModal('projectStagesTemplate', item)}
                    onDelete={(id) => handleDelete(id, 'projectStagesTemplate')}
                    renderItem={(item) => sections.projectStagesTemplate!.render(item as ProjectStageTemplateItem)}
                />
            </div>

            <div className="space-y-8">
                <SettingSection
                    title={sections.measurementTiers!.title}
                    description={sections.measurementTiers!.description}
                    items={appData.measurementTiers}
                    onAdd={() => openModal('measurementTiers')}
                    onEdit={(item) => openModal('measurementTiers', item)}
                    onDelete={(id) => handleDelete(id, 'measurementTiers')}
                    renderItem={(item) => sections.measurementTiers!.render(item as PriceTier)}
                />
                 <SettingSection
                    title={sections.extraTiers!.title}
                    description={sections.extraTiers!.description}
                    items={appData.extraTiers}
                    onAdd={() => openModal('extraTiers')}
                    onEdit={(item) => openModal('extraTiers', item)}
                    onDelete={(id) => handleDelete(id, 'extraTiers')}
                    renderItem={(item) => sections.extraTiers!.render(item as PriceTier)}
                />
            </div>
        </div>
        
        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-lg font-semibold">{editingItem ? 'Editar' : 'Adicionar'} {currentSection?.title}</h3>
                        <button onClick={closeModal} className="text-slate-400 hover:text-slate-600" aria-label="Fechar">
                            <XIcon className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                        <div className="p-6 space-y-4">
                            {renderModalFormFields()}
                        </div>
                        <div className="flex justify-end space-x-4 p-4 bg-slate-50 rounded-b-lg">
                            <button type="button" onClick={closeModal} className="px-6 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50">Cancelar</button>
                            <button type="submit" className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Settings;