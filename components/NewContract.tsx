
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadIcon, XIcon, CheckCircleIcon, WalletIcon, CalendarIcon } from './Icons';
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
    
    // NOVOS ESTADOS FINANCEIROS
    const [discountPercent, setDiscountPercent] = useState(() => isEditing ? String((editingContract.discountValue / (editingContract.totalValue + editingContract.discountValue)) * 100) : '0');
    const [hasDownPayment, setHasDownPayment] = useState(() => isEditing ? editingContract.downPayment > 0 : true);
    const [downPaymentPercentage, setDownPaymentPercentage] = useState(() => isEditing && editingContract.downPayment > 0 ? String(Math.round((editingContract.downPayment / editingContract.totalValue) * 100)) : '30');
    const [numInstallments, setNumInstallments] = useState(() => isEditing ? String(editingContract.installments) : '4');

    const [contractDate, setContractDate] = useState(() => isEditing ? new Date(editingContract.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [downPaymentDate, setDownPaymentDate] = useState(() => isEditing ? new Date(editingContract.downPaymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [firstInstallmentDate, setFirstInstallmentDate] = useState(() => isEditing && editingContract.firstInstallmentDate ? new Date(editingContract.firstInstallmentDate).toISOString().split('T')[0] : '');

    const allServices = useMemo(() => [...appData.servicePrices, ...appData.hourlyRates], [appData]);

    // Cálculos Financeiros Dinâmicos
    const financialSummary = useMemo(() => {
        const subtotal = contractTypes.reduce((acc, ct) => acc + (parseFloat(ct.value) || 0), 0);
        const discountVal = subtotal * (parseFloat(discountPercent) / 100);
        const totalFinal = subtotal - discountVal;
        
        const downPaymentVal = hasDownPayment ? totalFinal * (parseFloat(downPaymentPercentage) / 100) : 0;
        const remaining = totalFinal - downPaymentVal;
        const installmentsCount = parseInt(numInstallments, 10) || 0;
        const installmentValue = installmentsCount > 0 ? remaining / installmentsCount : 0;

        // Gerar Preview de Parcelas para a UI
        const previewItems: { label: string; value: number; date: string }[] = [];
        
        if (hasDownPayment && downPaymentVal > 0) {
            previewItems.push({ label: 'Entrada / Sinal', value: downPaymentVal, date: downPaymentDate });
        }

        if (installmentsCount > 0) {
            const startDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date(downPaymentDate);
            if (!firstInstallmentDate) startDate.setMonth(startDate.getMonth() + 1);

            for (let i = 1; i <= installmentsCount; i++) {
                const d = new Date(startDate);
                d.setMonth(d.getMonth() + (i - 1));
                previewItems.push({ 
                    label: `Parcela ${i}/${installmentsCount}`, 
                    value: installmentValue, 
                    date: d.toISOString().split('T')[0] 
                });
            }
        }

        return { subtotal, discountVal, totalFinal, downPaymentVal, installmentValue, previewItems };
    }, [contractTypes, discountPercent, hasDownPayment, downPaymentPercentage, numInstallments, downPaymentDate, firstInstallmentDate]);

    const handleContractTypeChange = (id: number, field: string, value: string) => {
        setContractTypes(prev => prev.map(ct => {
            if (ct.id !== id) return ct;
            const updated = { ...ct, [field]: value };
            const s = allServices.find(srv => srv.name === updated.serviceName);
            
            if (field === 'serviceName' && s) {
                if (s.unit === 'm²') updated.calculationMethod = 'metragem';
                else if (s.unit === 'hora') updated.calculationMethod = 'hora';
                else updated.calculationMethod = 'manual';
            }

            if (field === 'value') updated.calculationMethod = 'manual';

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

    const handleSubmit = (mode: 'budget' | 'contract') => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const p = Object.fromEntries(formData.entries());

        if (mode === 'budget') {
            onAddBudgetOnly({
                clientName: p.fullName as string,
                projectName: p.projectDescription as string,
                totalValue: financialSummary.totalFinal,
                services: contractTypes,
                clientEmail: p.email as string,
                clientPhone: p.phone as string
            });
        } else {
            const data = {
                clientName: p.fullName as string,
                projectName: p.projectDescription as string, 
                totalValue: financialSummary.totalFinal,
                date: new Date(`${contractDate}T00:00:00`),
                durationMonths: parseInt(durationMonths, 10) || 0,
                clientAddress: { street: p.clientStreet, number: p.clientNumber, complement: p.clientComplement, district: p.clientDistrict, city: p.clientCity, state: p.clientState, cep: p.clientCep } as any,
                projectAddress: isSameAddress ? { street: p.clientStreet, number: p.clientNumber, complement: p.clientComplement, district: p.clientDistrict, city: p.clientCity, state: p.clientState, cep: p.clientCep } : { street: p.workStreet, number: p.workNumber, complement: p.workComplement, district: p.workDistrict, city: p.workCity, state: p.workState, cep: p.workCep } as any,
                downPayment: financialSummary.downPaymentVal,
                installments: parseInt(numInstallments, 10) || 0,
                installmentValue: financialSummary.installmentValue,
                serviceType: serviceType,
                services: contractTypes,
                discountType: 'Porcentagem (%)',
                discountValue: financialSummary.discountVal,
                downPaymentDate: new Date(`${downPaymentDate}T00:00:00`),
                firstInstallmentDate: firstInstallmentDate ? new Date(`${firstInstallmentDate}T00:00:00`) : undefined,
                budgetId: isConverting ? budgetToConvert.id : undefined,
                status: 'Ativo'
            };
            if (isEditing) onUpdateContract({ ...editingContract, ...data } as Contract);
            else onAddContract(data as any);
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <header className="bg-blue-600 text-white p-6 rounded-xl shadow-lg -mx-6 -mt-6 mb-6 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-bold">
                    {isEditing ? 'Editar Projeto' : isConverting ? 'Ativação de Contrato' : 'Nova Proposta'}
                </h1>
                <p className="mt-1 text-blue-100 italic">Configure o escopo e as condições financeiras.</p>
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
                                    <select value={ct.serviceName} onChange={e => handleContractTypeChange(ct.id, 'serviceName', e.target.value)} className="w-full h-11 px-3 rounded-lg border-slate-300 shadow-sm focus:ring-blue-500 bg-white">
                                        <option value="">Selecione um serviço...</option>
                                        {allServices.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">{ct.calculationMethod === 'hora' ? 'Horas' : 'Qtd (m²)'}</label>
                                    <input type="number" value={ct.calculationMethod === 'hora' ? ct.hours : ct.area} onChange={e => handleContractTypeChange(ct.id, ct.calculationMethod === 'hora' ? 'hours' : 'area', e.target.value)} className="w-full h-11 px-3 rounded-lg border-slate-300 shadow-sm focus:ring-blue-500 text-center font-bold bg-white" />
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Total (R$)</label>
                                    <input type="number" value={ct.value} onChange={e => handleContractTypeChange(ct.id, 'value', e.target.value)} className="w-full h-11 px-3 rounded-lg border-slate-300 shadow-sm focus:ring-blue-500 font-black bg-white" />
                                </div>
                                <div className="flex-shrink-0">
                                    <button type="button" onClick={() => setContractTypes(prev => prev.filter(item => item.id !== ct.id))} className="h-11 px-4 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-bold text-xs">REMOVER</button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => setContractTypes([...contractTypes, {id: Date.now(), serviceName: '', calculationMethod: 'metragem', area: '0', hours: '0', value: '0.00'}])} className="bg-white border-2 border-dashed border-blue-200 w-full py-4 rounded-xl text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm">+ ADICIONAR NOVO ITEM AO ESCOPO</button>
                    </div>
                    <FormField label="Descrição do Projeto" id="projectDescription" className="mt-4">
                        <textarea id="projectDescription" name="projectDescription" rows={3} placeholder="Ex: Reforma total de apartamento..." className="w-full p-4 border rounded-xl shadow-sm focus:ring-blue-500 border-slate-300 bg-white" defaultValue={isEditing ? editingContract.projectName : isConverting ? budgetToConvert.projectName : ''} />
                    </FormField>
                </FormSection>

                <FormSection title="3. Localização">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <FormField label="CEP Cliente" id="clientCep" className="md:col-span-2" defaultValue={isEditing ? editingContract.clientAddress.cep : ''} />
                        <FormField label="Logradouro" id="clientStreet" className="md:col-span-4" defaultValue={isEditing ? editingContract.clientAddress.street : ''} />
                    </div>
                    <div className="flex items-center mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <input type="checkbox" id="sameAddress" checked={isSameAddress} onChange={e => setIsSameAddress(e.target.checked)} className="h-5 w-5 text-blue-600 rounded" />
                        <label htmlFor="sameAddress" className="ml-3 text-sm font-bold text-blue-800 uppercase text-[10px]">O endereço da obra é o mesmo do cliente</label>
                    </div>
                    {!isSameAddress && (
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 animate-fadeIn pt-4">
                            <FormField label="CEP Obra" id="workCep" className="md:col-span-2" />
                            <FormField label="Logradouro Obra" id="workStreet" className="md:col-span-4" />
                        </div>
                    )}
                </FormSection>

                {/* 5. FINANCEIRO E DATAS - CONFORME IMAGEM DE REFERÊNCIA */}
                <FormSection title="5. Financeiro e Datas">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Subtotal Bruto</label>
                                <p className="text-xl font-black text-slate-400 line-through">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.subtotal)}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-blue-600 uppercase mb-1">Desconto (%)</label>
                                <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full h-12 px-4 rounded-xl border-blue-300 font-black text-blue-600 shadow-sm focus:ring-blue-500" placeholder="0%" />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor Final</label>
                                <p className="text-3xl font-black text-blue-700 leading-none">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialSummary.totalFinal)}</p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assinatura</label>
                                <input type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} className="w-full h-11 px-3 border rounded-lg bg-white" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nº Parcelas</label>
                                <select value={numInstallments} onChange={e => setNumInstallments(e.target.value)} className="w-full h-11 px-3 border rounded-lg bg-white font-bold">
                                    {[0,1,2,3,4,5,6,8,10,12,18,24,36].map(v => <option key={v} value={v}>{v === 0 ? 'À Vista' : `${v}x`}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center pt-6 border-t border-slate-200">
                             <div className="flex items-center gap-3 h-12">
                                <input type="checkbox" id="checkDownPayment" checked={hasDownPayment} onChange={e => setHasDownPayment(e.target.checked)} className="w-6 h-6 rounded text-green-600 focus:ring-green-500" />
                                <label htmlFor="checkDownPayment" className="text-xs font-black uppercase text-slate-700 cursor-pointer">Terá Valor de Entrada?</label>
                            </div>
                            {hasDownPayment && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-bold text-green-600 uppercase mb-1">% Entrada</label>
                                        <input type="number" value={downPaymentPercentage} onChange={e => setDownPaymentPercentage(e.target.value)} className="w-full h-11 px-3 border-green-300 rounded-lg bg-white font-black text-green-700" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Venc. Entrada</label>
                                        <input type="date" value={downPaymentDate} onChange={e => setDownPaymentDate(e.target.value)} className="w-full h-11 px-3 border rounded-lg bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">1ª Parcela em:</label>
                                        <input type="date" value={firstInstallmentDate} onChange={e => setFirstInstallmentDate(e.target.value)} className="w-full h-11 px-3 border rounded-lg bg-white" placeholder="Opcional" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* PREVIEW DAS PARCELAS EM TEMPO REAL */}
                        <div className="mt-8">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-2" /> Visualização do Fluxo de Recebimento
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                {financialSummary.previewItems.map((item, i) => (
                                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-24 hover:border-blue-300 transition-all">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">{item.label}</p>
                                        <p className="text-lg font-black text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}</p>
                                        <p className="text-[10px] font-bold text-blue-600">{new Date(item.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                    </div>
                                ))}
                                {financialSummary.previewItems.length === 0 && (
                                    <div className="col-span-full py-6 text-center bg-white rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase">Ajuste as parcelas para ver o fluxo.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </FormSection>
                
                <div className="flex flex-col md:flex-row justify-center gap-6 mt-12 bg-slate-100 p-8 rounded-2xl border-2 border-dashed border-slate-300">
                    <div className="text-center">
                        <button type="button" onClick={() => handleSubmit('budget')} className="flex items-center justify-center w-full md:w-auto px-10 py-5 bg-slate-800 text-white font-black rounded-2xl shadow-2xl hover:bg-slate-700 transition-all transform hover:scale-[1.02]"><WalletIcon className="w-6 h-6 mr-3" /> SALVAR SOMENTE ORÇAMENTO</button>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold">Ficará na lista de negociações</p>
                    </div>
                    <div className="flex items-center justify-center font-bold text-slate-300">OU</div>
                    <div className="text-center">
                        <button type="button" onClick={() => handleSubmit('contract')} className="flex items-center justify-center w-full md:w-auto px-12 py-5 bg-green-600 text-white font-black rounded-2xl shadow-2xl hover:bg-green-700 transition-all transform hover:scale-[1.05]"><CheckCircleIcon className="w-6 h-6 mr-3" /> ATIVAR PROJETO (CONTRATO)</button>
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
