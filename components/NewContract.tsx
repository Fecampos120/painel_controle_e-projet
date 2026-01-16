
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadIcon, XIcon, CheckCircleIcon, WalletIcon } from './Icons';
import { AppData, Contract, Attachment, ContractService, Budget, PriceTier } from '../types';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
    <h2 className="text-lg font-bold text-blue-600 border-b border-blue-100 pb-4 uppercase tracking-wide text-sm">{title}</h2>
    <div className="mt-6 space-y-4">
      {children}
    </div>
  </div>
);

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
  required?: boolean;
  defaultValue?: string | number;
  value?: string | number;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;
}

const FormField: React.FC<FormFieldProps> = ({ label, id, type = 'text', placeholder, className, children, required, defaultValue, value, onChange }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
      {label}{required && <span className="text-red-500">*</span>}
    </label>
    {children ? (
       <div className="mt-1">{children}</div>
    ) : (
      <input
        type={type}
        id={id}
        name={id}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 bg-white"
        required={required}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
      />
    )}
  </div>
);

interface NewContractProps {
    appData: AppData;
    onAddContract: (contract: Omit<Contract, 'id'>) => void;
    onAddBudgetOnly: (budget: Omit<Budget, 'id' | 'createdAt' | 'lastContactDate' | 'status'>) => void;
    onUpdateContract: (contract: Contract) => void;
    editingContract: Contract | null;
    budgetToConvert: Budget | null;
    onCancel: () => void;
}

const NewContract: React.FC<NewContractProps> = ({ appData, onAddContract, onAddBudgetOnly, onUpdateContract, editingContract, budgetToConvert, onCancel }) => {
    const isEditing = !!editingContract;
    const isConverting = !!budgetToConvert;
    const formRef = useRef<HTMLFormElement>(null);
    
    const MILEAGE_RATE = 1.40;
    const VISIT_BASE_PRICE = 80.00;

    const [isSameAddress, setIsSameAddress] = useState(() => 
        isEditing ? (editingContract.clientAddress.cep === editingContract.projectAddress.cep) : false
    );

    const [contractTypes, setContractTypes] = useState<ContractService[]>(() => {
        if (isEditing) return editingContract.services;
        if (isConverting) return budgetToConvert.services;
        return [{ id: Date.now(), serviceName: '', calculationMethod: 'metragem', area: '0', hours: '0', value: '0.00' }];
    });

    const [serviceType, setServiceType] = useState(() => isEditing ? editingContract.serviceType : 'Residencial');
    const [durationMonths, setDurationMonths] = useState(() => isEditing ? String(editingContract.durationMonths) : '6');
    
    const [financialInputs, setFinancialInputs] = useState(() => isEditing ? {
        discountType: editingContract.discountType,
        discountValue: String(editingContract.discountValue),
        downPaymentPercentage: String((editingContract.downPayment / (editingContract.totalValue || 1)) * 100),
        installments: String(editingContract.installments),
    } : {
        discountType: 'Valor (R$)',
        discountValue: '0',
        downPaymentPercentage: '30',
        installments: '0',
    });

    const [mileage, setMileage] = useState({ 
        enabled: isEditing ? (editingContract.mileageDistance ? editingContract.mileageDistance > 0 : false) : false, 
        distance: isEditing ? String(editingContract.mileageDistance || '') : '' 
    });
    const [techVisits, setTechVisits] = useState({ 
        enabled: isEditing ? !!editingContract.techVisits?.enabled : false, 
        quantity: isEditing ? String(editingContract.techVisits?.quantity || '1') : '1' 
    });

    const [financials, setFinancials] = useState({ subtotal: 0, total: 0, downPayment: 0, remaining: 0, installmentValue: 0, mileageCost: 0 });
    
    const [contractDate, setContractDate] = useState(() => isEditing ? new Date(editingContract.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [downPaymentDate, setDownPaymentDate] = useState(() => isEditing ? new Date(editingContract.downPaymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [firstInstallmentDate, setFirstInstallmentDate] = useState(() => isEditing && editingContract.firstInstallmentDate ? new Date(editingContract.firstInstallmentDate).toISOString().split('T')[0] : '');

    const allServices = useMemo(() => [...appData.servicePrices, ...appData.hourlyRates], [appData]);

    useEffect(() => {
        const servicesSubtotal = contractTypes.reduce((acc, ct) => acc + (parseFloat(ct.value) || 0), 0);
        let extraCost = 0;
        if (techVisits.enabled) {
            extraCost = (VISIT_BASE_PRICE + (mileage.enabled ? (parseFloat(mileage.distance) || 0) * MILEAGE_RATE : 0)) * (parseFloat(techVisits.quantity) || 0);
        } else if (mileage.enabled) {
            extraCost = (parseFloat(mileage.distance) || 0) * MILEAGE_RATE;
        }

        const subtotal = servicesSubtotal + extraCost;
        const discountAmount = financialInputs.discountType === 'Porcentagem (%)' 
            ? subtotal * ((parseFloat(financialInputs.discountValue) || 0) / 100) 
            : (parseFloat(financialInputs.discountValue) || 0);

        const total = subtotal - discountAmount;
        const downPayment = total * ((parseFloat(financialInputs.downPaymentPercentage) || 0) / 100);
        const installmentsCount = parseInt(financialInputs.installments, 10) || 0;

        setFinancials({
            subtotal, total, downPayment, 
            remaining: total - downPayment,
            installmentValue: installmentsCount > 0 ? (total - downPayment) / installmentsCount : 0,
            mileageCost: extraCost
        });
    }, [contractTypes, financialInputs, mileage, techVisits]);

    const handleSubmit = (mode: 'budget' | 'contract') => {
        if (!formRef.current) return;
        
        const formData = new FormData(formRef.current);
        const p = Object.fromEntries(formData.entries());

        if (mode === 'budget') {
            onAddBudgetOnly({
                clientName: p.fullName as string,
                projectName: p.projectDescription as string,
                totalValue: financials.total,
                services: contractTypes,
                clientEmail: p.email as string,
                clientPhone: p.phone as string
            });
        } else {
            const data = {
                clientName: p.fullName as string,
                projectName: p.projectDescription as string, 
                totalValue: financials.total,
                date: new Date(`${contractDate}T00:00:00`),
                durationMonths: parseInt(durationMonths, 10) || 0,
                clientAddress: { 
                    street: p.clientStreet as string, 
                    number: p.clientNumber as string, 
                    complement: p.clientComplement as string, 
                    district: p.clientDistrict as string, 
                    city: p.clientCity as string, 
                    state: p.clientState as string, 
                    cep: p.clientCep as string 
                },
                projectAddress: isSameAddress ? { 
                    street: p.clientStreet as string, 
                    number: p.clientNumber as string, 
                    complement: p.clientComplement as string, 
                    district: p.clientDistrict as string, 
                    city: p.clientCity as string, 
                    state: p.clientState as string, 
                    cep: p.clientCep as string 
                } : { 
                    street: p.workStreet as string, 
                    number: p.workNumber as string, 
                    complement: p.workComplement as string, 
                    district: p.workDistrict as string, 
                    city: p.workCity as string, 
                    state: p.workState as string, 
                    cep: p.workCep as string 
                },
                downPayment: financials.downPayment,
                installments: parseInt(financialInputs.installments, 10) || 0,
                installmentValue: financials.installmentValue,
                serviceType: serviceType,
                services: contractTypes,
                discountType: financialInputs.discountType,
                discountValue: parseFloat(financialInputs.discountValue as string) || 0,
                mileageDistance: parseFloat(mileage.distance) || 0,
                mileageCost: financials.mileageCost,
                techVisits: {
                    enabled: techVisits.enabled,
                    quantity: parseInt(techVisits.quantity, 10) || 0,
                    totalValue: financials.mileageCost
                },
                downPaymentDate: new Date(`${downPaymentDate}T00:00:00`),
                firstInstallmentDate: firstInstallmentDate ? new Date(`${firstInstallmentDate}T00:00:00`) : undefined,
                budgetId: isConverting ? budgetToConvert.id : undefined,
                status: 'Ativo'
            };

            if (isEditing) onUpdateContract({ ...editingContract, ...data } as Contract);
            else onAddContract(data as any);
        }
    };

    const handleContractTypeChange = (id: number, field: string, value: string) => {
        setContractTypes(prev => prev.map(ct => {
            if (ct.id !== id) return ct;
            
            const updated = { ...ct, [field]: value };
            const s = allServices.find(srv => srv.name === updated.serviceName);
            
            // Lógica de Detecção de Mudança:
            // 1. Se alterou o serviço, reseta para automático
            if (field === 'serviceName' && s) {
                if (s.unit === 'm²') updated.calculationMethod = 'metragem';
                else if (s.unit === 'hora') updated.calculationMethod = 'hora';
                else updated.calculationMethod = 'manual';
            }

            // 2. Se o usuário digitou no campo de VALOR TOTAL, vira MANUAL
            if (field === 'value') {
                updated.calculationMethod = 'manual';
            }

            // 3. Se alterou AREA ou HORAS, garante que o cálculo automático rode (se não for manual)
            if (updated.calculationMethod !== 'manual') {
                if (updated.serviceName === 'Medição e Planta Baixa') {
                    const areaNum = parseFloat(updated.area || '0');
                    const tier = appData.measurementTiers.find((t: PriceTier) => {
                        const [min, max] = t.range.replace(/[^\d\s]/g, '').split(/\s+/).map(Number);
                        return areaNum >= min && (max ? areaNum <= max : true);
                    });
                    updated.value = (tier?.price || 0).toFixed(2);
                } else if (updated.calculationMethod === 'metragem') {
                    updated.value = ((parseFloat(updated.area || '0') * (s?.price || 0))).toFixed(2);
                } else if (updated.calculationMethod === 'hora') {
                    updated.value = ((parseFloat(updated.hours || '0') * (s?.price || 0))).toFixed(2);
                }
            }

            return updated;
        }));
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">
                    {isEditing ? 'Editar Projeto' : isConverting ? 'Detalhar Contrato para Ativação' : 'Nova Proposta'}
                </h1>
                <p className="mt-1 text-blue-100 italic">Configure o escopo e decida se salvará apenas o orçamento ou ativará o projeto.</p>
            </header>

            <form ref={formRef} className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <FormSection title="1. Dados do Cliente">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="Nome Completo" id="fullName" required defaultValue={isEditing ? editingContract.clientName : isConverting ? budgetToConvert.clientName : ''}/>
                        <FormField label="Telefone" id="phone" defaultValue={isEditing ? editingContract.clientPhone : isConverting ? budgetToConvert.clientPhone : ''} />
                        <FormField label="E-mail" id="email" type="email" defaultValue={isEditing ? editingContract.clientEmail : isConverting ? budgetToConvert.clientEmail : ''} />
                    </div>
                </FormSection>

                <FormSection title="2. Escopo do Trabalho">
                    <div className="space-y-4">
                        {contractTypes.map((ct, idx) => (
                            <div key={ct.id} className="p-4 border rounded-xl bg-slate-50 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serviço</label>
                                    <select 
                                        value={ct.serviceName} 
                                        onChange={e => handleContractTypeChange(ct.id, 'serviceName', e.target.value)} 
                                        className="w-full h-11 px-3 rounded-lg border-slate-300 shadow-sm focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Selecione um serviço...</option>
                                        {allServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                        {ct.calculationMethod === 'hora' ? 'Horas' : 'Qtd (m²)'}
                                    </label>
                                    <input 
                                        type="number" 
                                        value={ct.calculationMethod === 'hora' ? ct.hours : ct.area} 
                                        onChange={e => handleContractTypeChange(ct.id, ct.calculationMethod === 'hora' ? 'hours' : 'area', e.target.value)} 
                                        className="w-full h-11 px-3 rounded-lg border-slate-300 shadow-sm focus:ring-blue-500 text-center font-bold bg-white" 
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                        Valor Total (R$) {ct.calculationMethod === 'manual' && <span className="text-blue-500 normal-case">(Manual)</span>}
                                    </label>
                                    <input 
                                        type="number" 
                                        value={ct.value} 
                                        onChange={e => handleContractTypeChange(ct.id, 'value', e.target.value)} 
                                        className={`w-full h-11 px-3 rounded-lg border-slate-300 shadow-sm focus:ring-blue-500 font-black bg-white ${ct.calculationMethod === 'manual' ? 'text-blue-700' : 'text-slate-700'}`} 
                                    />
                                </div>
                                <div className="flex-shrink-0">
                                    <button 
                                        type="button" 
                                        onClick={() => setContractTypes(prev => prev.filter(item => item.id !== ct.id))} 
                                        className="h-11 px-4 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-bold text-xs"
                                    >
                                        REMOVER
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={() => setContractTypes([...contractTypes, {id: Date.now(), serviceName: '', calculationMethod: 'metragem', area: '0', hours: '0', value: '0.00'}])} 
                            className="bg-white border-2 border-dashed border-blue-200 w-full py-4 rounded-xl text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                        >
                            + ADICIONAR NOVO ITEM AO ESCOPO
                        </button>
                    </div>
                    
                    <FormField label="Descrição Resumida para Relatórios" id="projectDescription" className="mt-4">
                        <textarea 
                            id="projectDescription" 
                            name="projectDescription" 
                            rows={3} 
                            placeholder="Ex: Reforma total de apartamento 3 quartos..."
                            className="w-full p-4 border rounded-xl shadow-sm focus:ring-blue-500 border-slate-300 bg-white" 
                            defaultValue={isEditing ? editingContract.projectName : isConverting ? budgetToConvert.projectName : ''} 
                        />
                    </FormField>
                </FormSection>

                {/* ESSAS SEÇÕES ABAIXO SÃO EXIBIDAS PARA CONTRATO OU QUANDO O USUÁRIO QUER MAIS DETALHE */}
                <FormSection title="3. Localização e Logística">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <FormField label="CEP" id="clientCep" className="md:col-span-2" defaultValue={isEditing ? editingContract.clientAddress.cep : ''} />
                        <FormField label="Logradouro" id="clientStreet" className="md:col-span-3" defaultValue={isEditing ? editingContract.clientAddress.street : ''} />
                        <FormField label="Nº" id="clientNumber" className="md:col-span-1" defaultValue={isEditing ? editingContract.clientAddress.number : ''} />
                        <FormField label="Bairro" id="clientDistrict" className="md:col-span-2" defaultValue={isEditing ? editingContract.clientAddress.district : ''} />
                        <FormField label="Cidade" id="clientCity" className="md:col-span-2" defaultValue={isEditing ? editingContract.clientAddress.city : ''} />
                        <FormField label="UF" id="clientState" className="md:col-span-2" defaultValue={isEditing ? editingContract.clientAddress.state : ''} />
                    </div>

                    <div className="flex items-center mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <input 
                            type="checkbox" 
                            id="sameAddress" 
                            checked={isSameAddress} 
                            onChange={e => setIsSameAddress(e.target.checked)} 
                            className="h-5 w-5 text-blue-600 rounded"
                        />
                        <label htmlFor="sameAddress" className="ml-3 text-sm font-bold text-blue-800">O endereço da obra é o mesmo do cliente</label>
                    </div>
                    
                    {!isSameAddress && (
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 animate-fadeIn border-t pt-6 mt-4">
                            <FormField label="CEP Obra" id="workCep" className="md:col-span-2" defaultValue={isEditing ? editingContract.projectAddress.cep : ''} />
                            <FormField label="Logradouro Obra" id="workStreet" className="md:col-span-4" defaultValue={isEditing ? editingContract.projectAddress.street : ''} />
                            <FormField label="Cidade Obra" id="workCity" className="md:col-span-3" defaultValue={isEditing ? editingContract.projectAddress.city : ''} />
                            <FormField label="Bairro Obra" id="workDistrict" className="md:col-span-3" defaultValue={isEditing ? editingContract.projectAddress.district : ''} />
                        </div>
                    )}
                </FormSection>

                <FormSection title="4. Custos de Deslocamento e Visitas">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-4 bg-slate-50 rounded-xl border">
                            <div className="flex items-center mb-3">
                                <input type="checkbox" checked={mileage.enabled} onChange={e => setMileage({...mileage, enabled: e.target.checked})} className="h-4 w-4" />
                                <label className="ml-2 font-bold text-slate-700">Cobrar Deslocamento (Km)</label>
                            </div>
                            {mileage.enabled && (
                                <input type="number" placeholder="Distância total (Km)" value={mileage.distance} onChange={e => setMileage({...mileage, distance: e.target.value})} className="w-full h-10 border rounded px-3 bg-white" />
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border">
                            <div className="flex items-center mb-3">
                                <input type="checkbox" checked={techVisits.enabled} onChange={e => setTechVisits({...techVisits, enabled: e.target.checked})} className="h-4 w-4" />
                                <label className="ml-2 font-bold text-slate-700">Pacote de Visitas Técnicas</label>
                            </div>
                            {techVisits.enabled && (
                                <input type="number" placeholder="Qtd de visitas" value={techVisits.quantity} onChange={e => setTechVisits({...techVisits, quantity: e.target.value})} className="w-full h-10 border rounded px-3 bg-white" />
                            )}
                        </div>
                    </div>
                </FormSection>

                <FormSection title="5. Financeiro e Datas">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Final</label>
                            <p className="text-3xl font-black text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financials.total)}</p>
                        </div>
                        <FormField label="Assinatura" id="contractDate" type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} />
                        <FormField label="Venc. Entrada" id="downPaymentDate" type="date" value={downPaymentDate} onChange={e => setDownPaymentDate(e.target.value)} />
                        <FormField label="Nº Parcelas" id="installments">
                            <select value={financialInputs.installments} onChange={e => setFinancialInputs({...financialInputs, installments: e.target.value})} className="w-full h-10 px-3 border rounded-lg bg-white">
                                {[0,1,2,3,4,5,6,8,10,12,24,36].map(v => <option key={v} value={v}>{v === 0 ? 'À Vista' : `${v}x`}</option>)}
                            </select>
                        </FormField>
                    </div>
                </FormSection>
                
                {/* BOTÕES DE FINALIZAÇÃO */}
                <div className="flex flex-col md:flex-row justify-center gap-6 mt-12 bg-slate-100 p-8 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={() => handleSubmit('budget')}
                            className="flex items-center justify-center w-full md:w-auto px-10 py-5 bg-slate-800 text-white font-black rounded-2xl shadow-2xl hover:bg-slate-700 transition-all transform hover:scale-[1.02]"
                        >
                            <WalletIcon className="w-6 h-6 mr-3" /> SALVAR SOMENTE ORÇAMENTO
                        </button>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold">Ficará na lista de negociações</p>
                    </div>

                    <div className="flex items-center justify-center font-bold text-slate-300">OU</div>

                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={() => handleSubmit('contract')}
                            className="flex items-center justify-center w-full md:w-auto px-12 py-5 bg-green-600 text-white font-black rounded-2xl shadow-2xl hover:bg-green-700 transition-all transform hover:scale-[1.05]"
                        >
                            <CheckCircleIcon className="w-6 h-6 mr-3" /> ATIVAR PROJETO (CONTRATO)
                        </button>
                        <p className="text-[10px] text-green-600 mt-2 uppercase font-bold underline">Gera financeiro e cronograma de obra</p>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <button type="button" onClick={onCancel} className="text-slate-400 font-bold hover:text-slate-600 uppercase text-xs tracking-widest">Desistir e Voltar</button>
                </div>
            </form>
        </div>
    );
};

export default NewContract;
