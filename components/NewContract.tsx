
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadIcon, XIcon, CheckCircleIcon, WalletIcon, MapPinIcon, ArchitectIcon, CalendarIcon, HistoryIcon } from './Icons';
import { AppData, Contract, ContractService, Budget, PriceTier, Address } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
};

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .replace(/(-\d{4})(\d+?)$/, "$1");
};

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h2 className="text-sm font-black text-[var(--primary-color)] uppercase tracking-widest mb-6">{title}</h2>
    <div className="space-y-6">
      {children}
    </div>
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
    
    const [clientPhone, setClientPhone] = useState(() => {
        if (isEditing) return editingContract.clientPhone || '';
        if (isConverting) return budgetToConvert.clientPhone || '';
        return '';
    });
    
    const [contractTypes, setContractTypes] = useState<ContractService[]>(() => {
        if (isEditing) return editingContract.services;
        if (isConverting) return budgetToConvert.services;
        return [{ id: Date.now(), serviceName: '', calculationMethod: 'metragem', area: '0', hours: '0', value: '0.00' }];
    });

    const [isSameAddress, setIsSameAddress] = useState(true);
    const [mileageDistance, setMileageDistance] = useState(() => isEditing ? String(editingContract.mileageDistance || 0) : '0');
    const [mileageCost, setMileageCost] = useState(() => isEditing ? String(editingContract.mileageCost || 0) : '2,50');
    const [techVisitsQty, setTechVisitsQty] = useState(() => isEditing ? String(editingContract.techVisits?.quantity || 0) : '0');
    const [techVisitsPrice, setTechVisitsPrice] = useState(() => isEditing ? String((editingContract.techVisits?.totalValue || 0) / (editingContract.techVisits?.quantity || 1)) : '250,00');
    
    const [discountPercent, setDiscountPercent] = useState(() => {
        if (isEditing) {
            const sub = editingContract.services.reduce((a, b) => a + parseFloat(b.value), 0);
            return String(Math.round((editingContract.discountValue / sub) * 100) || 0);
        }
        return '0';
    });

    const [contractSigningDate, setContractSigningDate] = useState(new Date().toISOString().split('T')[0]);
    const [numInstallments, setNumInstallments] = useState('2');
    const [hasDownPayment, setHasDownPayment] = useState(true);
    const [downPaymentType, setDownPaymentType] = useState<'percent' | 'value'>('percent');
    const [downPaymentAmount, setDownPaymentAmount] = useState('20');
    const [downPaymentDate, setDownPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [firstInstallmentDate, setFirstInstallmentDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1);
        return d.toISOString().split('T')[0];
    });

    const financial = useMemo(() => {
        const servicesSubtotal = contractTypes.reduce((acc, ct) => acc + (parseFloat(ct.value) || 0), 0);
        const locomotionTotal = (parseFloat(mileageDistance) || 0) * (parseFloat(mileageCost.replace(',', '.')) || 0);
        const visitsTotal = (parseFloat(techVisitsQty) || 0) * (parseFloat(techVisitsPrice.replace(',', '.')) || 0);
        
        const subtotalBruto = servicesSubtotal + locomotionTotal + visitsTotal;
        const discountVal = subtotalBruto * (parseFloat(discountPercent) / 100);
        const totalFinal = subtotalBruto - discountVal;

        let downPaymentValue = 0;
        if (hasDownPayment) {
            if (downPaymentType === 'percent') {
                downPaymentValue = totalFinal * (parseFloat(downPaymentAmount) / 100);
            } else {
                downPaymentValue = parseFloat(downPaymentAmount) || 0;
            }
        }
        
        const remaining = totalFinal - downPaymentValue;
        const instCount = parseInt(numInstallments) || 1;
        const installmentValue = Math.max(0, remaining / instCount);

        const previewFlow = [];
        if (hasDownPayment && downPaymentValue > 0) {
            previewFlow.push({ label: 'ENTRADA / INÍCIO', value: downPaymentValue, date: downPaymentDate });
        }
        
        const baseDate = new Date(firstInstallmentDate + 'T12:00:00');

        for (let i = 1; i <= instCount; i++) {
            const d = new Date(baseDate);
            d.setMonth(d.getMonth() + (i - 1));
            previewFlow.push({ label: `PARCELA ${i}/${instCount}`, value: installmentValue, date: d.toISOString().split('T')[0] });
        }

        return { subtotalBruto, locomotionTotal, visitsTotal, discountVal, totalFinal, downPaymentValue, installmentValue, previewFlow };
    }, [contractTypes, mileageDistance, mileageCost, techVisitsQty, techVisitsPrice, discountPercent, hasDownPayment, downPaymentType, downPaymentAmount, numInstallments, downPaymentDate, firstInstallmentDate]);

    const handleServiceChange = (id: number, field: string, value: string) => {
        setContractTypes(prev => prev.map(ct => {
            if (ct.id !== id) return ct;
            const updated = { ...ct, [field]: value.toUpperCase() };
            const s = [...appData.servicePrices, ...appData.hourlyRates].find(srv => srv.name === updated.serviceName);
            if (field === 'serviceName' && s) {
                updated.calculationMethod = s.unit === 'm²' ? 'metragem' : s.unit === 'hora' ? 'hora' : 'manual';
            }
            if (updated.calculationMethod === 'metragem') {
                updated.value = (parseFloat(updated.area || '0') * (s?.price || 0)).toFixed(2);
            } else if (updated.calculationMethod === 'hora') {
                updated.value = (parseFloat(updated.hours || '0') * (s?.price || 0)).toFixed(2);
            }
            return updated;
        }));
    };

    const handleSubmit = (mode: 'budget' | 'contract') => {
        if (!formRef.current) return;
        const formData = new FormData(formRef.current);
        const p = Object.fromEntries(formData.entries());

        const clientAddr = {
            street: (p.c_street as string || '').toUpperCase(),
            number: (p.c_number as string || '').toUpperCase(),
            district: (p.c_district as string || '').toUpperCase(),
            city: (p.c_city as string || '').toUpperCase(),
            state: (p.c_state as string || '').toUpperCase(),
            cep: (p.c_cep as string || '').toUpperCase()
        };

        const projectAddr = isSameAddress ? { ...clientAddr } : {
            street: (p.p_street as string || '').toUpperCase(),
            number: (p.p_number as string || '').toUpperCase(),
            district: (p.p_district as string || '').toUpperCase(),
            city: (p.p_city as string || '').toUpperCase(),
            state: (p.p_state as string || '').toUpperCase(),
            cep: (p.p_cep as string || '').toUpperCase()
        };

        const baseData = {
            clientName: (p.clientName as string).toUpperCase(),
            projectName: (p.projectName as string).toUpperCase(), 
            totalValue: financial.totalFinal,
            services: contractTypes,
            clientPhone: clientPhone,
            clientEmail: p.email as string
        };

        if (mode === 'budget') {
            onAddBudgetOnly(baseData);
        } else {
            const contractData = {
                ...baseData,
                budgetId: budgetToConvert?.id,
                date: new Date(contractSigningDate + 'T12:00:00'),
                contractSigningDate: new Date(contractSigningDate + 'T12:00:00'),
                status: 'Ativo' as const,
                clientAddress: clientAddr as Address,
                projectAddress: projectAddr as Address,
                durationMonths: 6,
                installments: parseInt(numInstallments),
                installmentValue: financial.installmentValue,
                serviceType: 'RESIDENCIAL',
                discountType: 'PORCENTAGEM',
                discountValue: financial.discountVal,
                mileageDistance: parseFloat(mileageDistance),
                mileageCost: parseFloat(mileageCost.replace(',', '.')),
                techVisits: { enabled: parseInt(techVisitsQty) > 0, quantity: parseInt(techVisitsQty), totalValue: financial.visitsTotal },
                downPayment: financial.downPaymentValue,
                downPaymentDate: new Date(downPaymentDate + 'T12:00:00'),
                firstInstallmentDate: new Date(firstInstallmentDate + 'T12:00:00'),
                hasDownPayment: hasDownPayment
            };
            if (isEditing) onUpdateContract({ ...editingContract, ...contractData } as any);
            else onAddContract(contractData as any);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-fadeIn uppercase">
            <header className="bg-[var(--primary-color)] text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight">
                        {isConverting ? 'FINALIZAR CONTRATO' : isEditing ? 'EDITAR PROJETO' : 'NOVA PROPOSTA'}
                    </h1>
                    <p className="mt-1 text-white/80 italic text-sm">
                        {isConverting ? `CONVERTENDO ORÇAMENTO DE ${budgetToConvert.clientName}` : 'CONFIGURE O ESCOPO E AS CONDIÇÕES FINANCEIRAS.'}
                    </p>
                </div>
                <div className="text-right">
                    <label className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Data de Assinatura</label>
                    <input type="date" value={contractSigningDate} onChange={e => setContractSigningDate(e.target.value)} className="bg-white/20 border border-white/30 rounded-lg h-10 px-3 text-sm font-bold text-white outline-none" />
                </div>
            </header>

            <form ref={formRef} className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <FormSection title="1. DADOS DO CLIENTE">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NOME COMPLETO *</label>
                            <input name="clientName" required defaultValue={isEditing ? editingContract.clientName : isConverting ? budgetToConvert.clientName : ''} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PROJETO *</label>
                            <input name="projectName" required defaultValue={isEditing ? editingContract.projectName : isConverting ? budgetToConvert.projectName : ''} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TELEFONE</label>
                            <input name="phone" value={clientPhone} onChange={e => setClientPhone(maskPhone(e.target.value))} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm no-uppercase font-bold" />
                        </div>
                    </div>
                </FormSection>

                <FormSection title="2. ESCOPO DO TRABALHO">
                    <div className="space-y-4">
                        {contractTypes.map(ct => (
                            <div key={ct.id} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col md:flex-row gap-6 items-end group">
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SERVIÇO SELECIONADO</label>
                                    <select value={ct.serviceName} onChange={e => handleServiceChange(ct.id, 'serviceName', e.target.value)} className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-black uppercase text-slate-900 focus:border-[var(--primary-color)]">
                                        <option value="">SELECIONE UM SERVIÇO...</option>
                                        {[...appData.servicePrices, ...appData.hourlyRates].map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-32 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">COBRANÇA</label>
                                    <select value={ct.calculationMethod} onChange={e => handleServiceChange(ct.id, 'calculationMethod', e.target.value)} className="w-full h-12 px-3 bg-white border-2 border-slate-100 rounded-xl text-[11px] font-bold uppercase">
                                        <option value="metragem">M²</option>
                                        <option value="hora">HORA</option>
                                        <option value="manual">MANUAL</option>
                                    </select>
                                </div>
                                <div className="w-full md:w-28 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ct.calculationMethod === 'hora' ? 'HORAS' : 'QTD'}</label>
                                    <input type="number" value={ct.calculationMethod === 'hora' ? ct.hours : ct.area} onChange={e => handleServiceChange(ct.id, ct.calculationMethod === 'hora' ? 'hours' : 'area', e.target.value)} className="w-full h-12 text-center bg-white border-2 border-slate-100 rounded-xl font-black" />
                                </div>
                                <div className="w-full md:w-44 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL ITEM (R$)</label>
                                    <input type="number" value={ct.value} onChange={e => handleServiceChange(ct.id, 'value', e.target.value)} className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-[var(--primary-color)]" />
                                </div>
                                <button type="button" onClick={() => setContractTypes(prev => prev.filter(i => i.id !== ct.id))} className="h-12 px-4 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 rounded-xl">REMOVER</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setContractTypes([...contractTypes, {id: Date.now(), serviceName: '', calculationMethod: 'metragem', area: '0', value: '0.00'}])} className="w-full py-4 border-2 border-dashed border-slate-200 bg-slate-50/50 text-[var(--primary-color)] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-white transition-all">
                            + ADICIONAR NOVO ITEM AO ESCOPO
                        </button>
                    </div>
                </FormSection>

                <FormSection title="3. LOCALIZAÇÃO">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest -mt-4 mb-4">ENDEREÇO DE FATURAMENTO (CLIENTE)</p>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP</label>
                                <input name="c_cep" defaultValue={editingContract?.clientAddress?.cep} className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold no-uppercase" />
                            </div>
                            <div className="md:col-span-7 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LOGRADOURO / RUA</label>
                                <input name="c_street" defaultValue={editingContract?.clientAddress?.street} className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold" />
                            </div>
                            <div className="md:col-span-3 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NÚMERO</label>
                                <input name="c_number" defaultValue={editingContract?.clientAddress?.number} className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BAIRRO</label>
                                <input name="c_district" defaultValue={editingContract?.clientAddress?.district} className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold" />
                            </div>
                            <div className="md:col-span-6 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CIDADE</label>
                                <input name="c_city" defaultValue={editingContract?.clientAddress?.city} className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold" />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESTADO</label>
                                <input name="c_state" maxLength={2} defaultValue={editingContract?.clientAddress?.state} className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold text-center" />
                            </div>
                        </div>
                        
                        <div className="bg-slate-50/80 p-4 rounded-xl flex items-center gap-3">
                            <div 
                                onClick={() => setIsSameAddress(!isSameAddress)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all ${isSameAddress ? 'bg-slate-700 text-white' : 'bg-white border-2 border-slate-200'}`}
                            >
                                {isSameAddress && <CheckCircleIcon className="w-4 h-4" />}
                            </div>
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer" onClick={() => setIsSameAddress(!isSameAddress)}>MESMO ENDEREÇO PARA OBRA</label>
                        </div>

                        {!isSameAddress && (
                             <div className="pt-6 border-t border-slate-100 space-y-4 animate-fadeIn">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ENDEREÇO DA OBRA (PROJETO)</p>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP</label>
                                        <input name="p_cep" className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold no-uppercase" />
                                    </div>
                                    <div className="md:col-span-7 space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LOGRADOURO</label>
                                        <input name="p_street" className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold" />
                                    </div>
                                    <div className="md:col-span-3 space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NÚMERO</label>
                                        <input name="p_number" className="w-full h-12 px-4 bg-slate-50/50 border-2 border-slate-100 rounded-xl font-bold" />
                                    </div>
                                </div>
                             </div>
                        )}
                    </div>
                </FormSection>

                <FormSection title="4. VISITAS E DESLOCAMENTO">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* LOCOMOÇÃO */}
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                            <div className="flex items-center gap-2 text-slate-400">
                                <MapPinIcon className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">LOCOMOÇÃO</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">KM TOTAL ESTIMADO</label>
                                    <input type="number" value={mileageDistance} onChange={e => setMileageDistance(e.target.value)} className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">VALOR POR KM (R$)</label>
                                    <input type="text" value={mileageCost} onChange={e => setMileageCost(e.target.value)} className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] font-black text-slate-800 uppercase">TOTAL KM:</span>
                                <span className="text-sm font-black text-slate-900">{formatCurrency((parseFloat(mileageDistance) || 0) * (parseFloat(mileageCost.replace(',', '.')) || 0))}</span>
                            </div>
                        </div>

                        {/* VISITAS TÉCNICAS */}
                        <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
                            <div className="flex items-center gap-2 text-slate-400">
                                <HistoryIcon className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">VISITAS TÉCNICAS</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">QTD DE VISITAS</label>
                                    <input type="number" value={techVisitsQty} onChange={e => setTechVisitsQty(e.target.value)} className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase">R$ POR VISITA</label>
                                    <input type="text" value={techVisitsPrice} onChange={e => setTechVisitsPrice(e.target.value)} className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl font-black text-slate-700" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] font-black text-slate-800 uppercase">TOTAL VISITAS:</span>
                                <span className="text-sm font-black text-slate-900">{formatCurrency((parseFloat(techVisitsQty) || 0) * (parseFloat(techVisitsPrice.replace(',', '.')) || 0))}</span>
                            </div>
                        </div>
                    </div>
                </FormSection>

                <FormSection title="5. FINANCEIRO E DATAS">
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-end">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SUBTOTAL BRUTO</label>
                                <p className="text-xl font-black text-slate-300 line-through tracking-tighter">{formatCurrency(financial.subtotalBruto)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-[var(--primary-color)] uppercase tracking-widest">DESCONTO (%)</label>
                                <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full h-12 px-4 border-2 border-[var(--primary-color)]/20 focus:border-[var(--primary-color)] rounded-xl text-[var(--primary-color)] font-black text-xl" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VALOR FINAL</label>
                                <p className="text-4xl font-black text-[var(--primary-color)] tracking-tighter">{formatCurrency(financial.totalFinal)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VENC. ENTRADA / INÍCIO</label>
                                <input type="date" value={downPaymentDate} onChange={e => setDownPaymentDate(e.target.value)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl text-sm font-black" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº PARCELAS</label>
                                <select value={numInstallments} onChange={e => setNumInstallments(e.target.value)} className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl font-black text-sm">
                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map(n => <option key={n} value={n}>{n}X</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            <div className="md:col-span-4 flex items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm h-16">
                                <input type="checkbox" id="hasDown" checked={hasDownPayment} onChange={e => setHasDownPayment(e.target.checked)} className="w-5 h-5 rounded text-[var(--primary-color)] shrink-0" />
                                <label htmlFor="hasDown" className="ml-3 text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer">COBRAR SINAL / ENTRADA?</label>
                            </div>

                            {hasDownPayment && (
                                <div className="md:col-span-4 flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm h-16">
                                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                                        <button 
                                            type="button" 
                                            onClick={() => setDownPaymentType('percent')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${downPaymentType === 'percent' ? 'bg-[var(--primary-color)] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            %
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setDownPaymentType('value')}
                                            className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${downPaymentType === 'value' ? 'bg-[var(--primary-color)] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            R$
                                        </button>
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            value={downPaymentAmount} 
                                            onChange={e => setDownPaymentAmount(e.target.value)} 
                                            className="w-full bg-transparent border-none text-right font-black text-slate-700 outline-none p-0 focus:ring-0" 
                                            placeholder={downPaymentType === 'percent' ? "20" : "1500"}
                                        />
                                        <span className="text-[10px] font-black text-slate-300 uppercase">{downPaymentType === 'percent' ? '%' : 'FIXO'}</span>
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-4 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DATA DO 1º PAGAMENTO (PARCELA 1)</label>
                                <input type="date" value={firstInstallmentDate} onChange={e => setFirstInstallmentDate(e.target.value)} className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl text-sm font-black" />
                            </div>
                        </div>

                        <div className="mt-10 overflow-x-auto pb-4 no-scrollbar">
                             <div className="flex gap-4">
                                {financial.previewFlow.map((item, idx) => (
                                    <div key={idx} className="bg-white min-w-[160px] p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center transition-transform hover:scale-105">
                                        <span className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">{item.label}</span>
                                        <span className="text-base font-black text-slate-800 tracking-tighter">{formatCurrency(item.value)}</span>
                                        <span className="text-[11px] font-black text-slate-400 mt-2">{formatDate(item.date)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </FormSection>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-10 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    {!isConverting && !isEditing && (
                        <button type="button" onClick={() => handleSubmit('budget')} className="px-10 py-5 bg-slate-800 text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all text-xs tracking-widest">
                             SALVAR SOMENTE ORÇAMENTO
                        </button>
                    )}
                    <button type="button" onClick={() => handleSubmit('contract')} className="px-12 py-5 bg-[var(--primary-color)] text-white font-black rounded-2xl shadow-xl hover:brightness-110 hover:scale-105 transition-all text-xs tracking-widest">
                        {isEditing ? 'SALVAR ALTERAÇÕES' : 'ATIVAR PROJETO (CONTRATO)'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewContract;
