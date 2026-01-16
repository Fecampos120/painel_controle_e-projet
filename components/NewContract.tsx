
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadIcon, XIcon, CheckCircleIcon, WalletIcon, MapPinIcon, ArchitectIcon, CalendarIcon } from './Icons';
import { AppData, Contract, ContractService, Budget, PriceTier } from '../types';

// Funções auxiliares
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date + 'T12:00:00') : date;
  return new Intl.DateTimeFormat('pt-BR').format(d);
};

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
    <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest mb-6">{title}</h2>
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
    
    // Estados principais do formulário
    const [contractTypes, setContractTypes] = useState<ContractService[]>(() => {
        if (isEditing) return editingContract.services;
        if (isConverting) return budgetToConvert.services;
        return [{ id: Date.now(), serviceName: '', calculationMethod: 'metragem', area: '0', hours: '0', value: '0.00' }];
    });

    const [isSameAddress, setIsSameAddress] = useState(true);
    const [mileageDistance, setMileageDistance] = useState(() => isEditing ? String(editingContract.mileageDistance || 0) : '0');
    const [mileageCost, setMileageCost] = useState(() => isEditing ? String(editingContract.mileageCost || 0) : '2.50');
    const [techVisitsQty, setTechVisitsQty] = useState(() => isEditing ? String(editingContract.techVisits?.quantity || 0) : '0');
    const [techVisitsPrice, setTechVisitsPrice] = useState(() => isEditing ? String((editingContract.techVisits?.totalValue || 0) / (editingContract.techVisits?.quantity || 1)) : '250.00');
    
    const [discountPercent, setDiscountPercent] = useState(() => {
        if (isEditing) {
            const sub = editingContract.services.reduce((a, b) => a + parseFloat(b.value), 0);
            return String(Math.round((editingContract.discountValue / sub) * 100) || 0);
        }
        return '0';
    });

    const [contractDate, setContractDate] = useState(new Date().toISOString().split('T')[0]);
    const [numInstallments, setNumInstallments] = useState('4');
    const [hasDownPayment, setHasDownPayment] = useState(true);
    const [downPaymentPercent, setDownPaymentPercent] = useState('20');
    const [downPaymentDate, setDownPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [firstInstallmentDate, setFirstInstallmentDate] = useState('');

    // Cálculo Financeiro Dinâmico
    const financial = useMemo(() => {
        const servicesSubtotal = contractTypes.reduce((acc, ct) => acc + (parseFloat(ct.value) || 0), 0);
        const locomotionTotal = (parseFloat(mileageDistance) || 0) * (parseFloat(mileageCost) || 0);
        const visitsTotal = (parseFloat(techVisitsQty) || 0) * (parseFloat(techVisitsPrice) || 0);
        
        const subtotalBruto = servicesSubtotal + locomotionTotal + visitsTotal;
        const discountVal = subtotalBruto * (parseFloat(discountPercent) / 100);
        const totalFinal = subtotalBruto - discountVal;

        const downPaymentValue = hasDownPayment ? totalFinal * (parseFloat(downPaymentPercent) / 100) : 0;
        const remaining = totalFinal - downPaymentValue;
        const instCount = parseInt(numInstallments) || 1;
        const installmentValue = instCount > 0 ? remaining / instCount : 0;

        // Geração do fluxo de parcelas para o preview
        const previewFlow = [];
        if (hasDownPayment && downPaymentValue > 0) {
            previewFlow.push({ label: 'ENTRADA', value: downPaymentValue, date: downPaymentDate });
        }
        
        const startDate = firstInstallmentDate ? new Date(firstInstallmentDate + 'T12:00:00') : new Date(downPaymentDate + 'T12:00:00');
        if (!firstInstallmentDate) startDate.setMonth(startDate.getMonth() + 1);

        for (let i = 1; i <= instCount; i++) {
            const d = new Date(startDate);
            d.setMonth(d.getMonth() + (i - 1));
            previewFlow.push({ label: `PARCELA ${i}/${instCount}`, value: installmentValue, date: d.toISOString().split('T')[0] });
        }

        return { subtotalBruto, locomotionTotal, visitsTotal, discountVal, totalFinal, downPaymentValue, installmentValue, previewFlow };
    }, [contractTypes, mileageDistance, mileageCost, techVisitsQty, techVisitsPrice, discountPercent, hasDownPayment, downPaymentPercent, numInstallments, downPaymentDate, firstInstallmentDate]);

    const handleServiceChange = (id: number, field: string, value: string) => {
        setContractTypes(prev => prev.map(ct => {
            if (ct.id !== id) return ct;
            const updated = { ...ct, [field]: value };
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

        const baseData = {
            clientName: p.clientName as string,
            projectName: p.projectName as string, 
            totalValue: financial.totalFinal,
            services: contractTypes,
            clientPhone: p.phone as string,
            clientEmail: p.email as string
        };

        if (mode === 'budget') {
            onAddBudgetOnly(baseData);
        } else {
            const contractData = {
                ...baseData,
                date: new Date(contractDate + 'T12:00:00'),
                status: 'Ativo',
                clientAddress: { street: p.c_street, number: p.c_number, city: p.c_city, state: p.c_state, cep: p.c_cep, district: p.c_district } as any,
                projectAddress: isSameAddress ? { street: p.c_street, number: p.c_number, city: p.c_city, state: p.c_state, cep: p.c_cep, district: p.c_district } : { street: p.p_street, number: p.p_number, city: p.p_city, state: p.p_state, cep: p.p_cep, district: p.p_district } as any,
                durationMonths: 6,
                installments: parseInt(numInstallments),
                installmentValue: financial.installmentValue,
                serviceType: 'Residencial',
                discountType: 'Porcentagem',
                discountValue: financial.discountVal,
                mileageDistance: parseFloat(mileageDistance),
                mileageCost: parseFloat(mileageCost),
                techVisits: { enabled: parseInt(techVisitsQty) > 0, quantity: parseInt(techVisitsQty), totalValue: financial.visitsTotal },
                downPayment: financial.downPaymentValue,
                downPaymentDate: new Date(downPaymentDate + 'T12:00:00'),
                firstInstallmentDate: firstInstallmentDate ? new Date(firstInstallmentDate + 'T12:00:00') : undefined
            };
            if (isEditing) onUpdateContract({ ...editingContract, ...contractData } as any);
            else onAddContract(contractData as any);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-24 space-y-8 animate-fadeIn">
            {/* Header conforme imagem */}
            <header className="bg-blue-600 text-white p-8 rounded-xl shadow-lg -mx-6 -mt-6 mb-10 md:-mx-8 md:-mt-8 lg:-mx-10 lg:-mt-10">
                <h1 className="text-3xl font-black uppercase tracking-tight">Nova Proposta</h1>
                <p className="mt-1 text-blue-100 italic text-sm">Configure o escopo e as condições financeiras.</p>
            </header>

            <form ref={formRef} className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                
                {/* 1. DADOS DO CLIENTE */}
                <FormSection title="1. DADOS DO CLIENTE">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo *</label>
                            <input name="clientName" required defaultValue={isEditing ? editingContract.clientName : ''} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm" placeholder="Nome do cliente" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</label>
                            <input name="phone" defaultValue={isEditing ? editingContract.clientPhone : ''} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm" placeholder="(00) 00000-0000" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</label>
                            <input name="email" type="email" defaultValue={isEditing ? editingContract.clientEmail : ''} className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm" placeholder="email@exemplo.com" />
                        </div>
                    </div>
                </FormSection>

                {/* 2. ESCOPO DO TRABALHO */}
                <FormSection title="2. ESCOPO DO TRABALHO">
                    <div className="space-y-4">
                        {contractTypes.map(ct => (
                            <div key={ct.id} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col md:flex-row gap-6 items-end group">
                                <div className="flex-1 w-full space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço</label>
                                    <select value={ct.serviceName} onChange={e => handleServiceChange(ct.id, 'serviceName', e.target.value)} className="w-full h-11 px-4 bg-white border-slate-200 rounded-lg text-sm font-medium">
                                        <option value="">Selecione um serviço...</option>
                                        {[...appData.servicePrices, ...appData.hourlyRates].map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-32 space-y-1 text-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ct.calculationMethod === 'hora' ? 'Horas' : 'Qtd (m²)'}</label>
                                    <input type="number" value={ct.calculationMethod === 'hora' ? ct.hours : ct.area} onChange={e => handleServiceChange(ct.id, ct.calculationMethod === 'hora' ? 'hours' : 'area', e.target.value)} className="w-full h-11 text-center bg-white border-slate-200 rounded-lg font-bold" />
                                </div>
                                <div className="w-full md:w-48 space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total (R$)</label>
                                    <input type="number" value={ct.value} onChange={e => handleServiceChange(ct.id, 'value', e.target.value)} className="w-full h-11 px-4 bg-white border-slate-200 rounded-lg font-black text-slate-800" />
                                </div>
                                <button type="button" onClick={() => setContractTypes(prev => prev.filter(i => i.id !== ct.id))} className="h-11 px-4 text-red-500 font-black text-[10px] uppercase hover:bg-red-50 rounded-lg transition-colors">REMOVER</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setContractTypes([...contractTypes, {id: Date.now(), serviceName: '', calculationMethod: 'metragem', area: '0', value: '0.00'}])} className="w-full py-4 border-2 border-dashed border-blue-100 bg-blue-50/20 text-blue-600 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-all">
                            + Adicionar novo item ao escopo
                        </button>
                    </div>
                    <div className="pt-4 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição do Projeto</label>
                        <textarea name="projectName" rows={3} defaultValue={isEditing ? editingContract.projectName : ''} className="w-full p-4 bg-slate-50 border-slate-200 rounded-xl text-sm" placeholder="Ex: Reforma total de apartamento..." />
                    </div>
                </FormSection>

                {/* 3. VISITAS E DESLOCAMENTO (Mantido conforme solicitado) */}
                <FormSection title="3. VISITAS E DESLOCAMENTO">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><MapPinIcon className="w-4 h-4 mr-2" /> Locomoção</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Km Total Estimado</label><input type="number" value={mileageDistance} onChange={e => setMileageDistance(e.target.value)} className="w-full h-10 px-3 bg-white border-slate-200 rounded-lg text-sm" /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Valor por Km (R$)</label><input type="number" value={mileageCost} onChange={e => setMileageCost(e.target.value)} className="w-full h-10 px-3 bg-white border-slate-200 rounded-lg text-sm" /></div>
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-800 text-sm"><span>TOTAL KM:</span><span>{formatCurrency(financial.locomotionTotal)}</span></div>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArchitectIcon className="w-4 h-4 mr-2" /> Visitas Técnicas</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Qtd de Visitas</label><input type="number" value={techVisitsQty} onChange={e => setTechVisitsQty(e.target.value)} className="w-full h-10 px-3 bg-white border-slate-200 rounded-lg text-sm" /></div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">R$ por Visita</label><input type="number" value={techVisitsPrice} onChange={e => setTechVisitsPrice(e.target.value)} className="w-full h-10 px-3 bg-white border-slate-200 rounded-lg text-sm" /></div>
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-800 text-sm"><span>TOTAL VISITAS:</span><span>{formatCurrency(financial.visitsTotal)}</span></div>
                        </div>
                    </div>
                </FormSection>

                {/* 4. LOCALIZAÇÃO */}
                <FormSection title="4. LOCALIZAÇÃO">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                        <div className="md:col-span-1 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">CEP Cliente</label><input name="c_cep" className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                        <div className="md:col-span-5 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Logradouro / Endereço</label><input name="c_street" className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                    </div>

                    <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <input type="checkbox" id="sameAdd" checked={isSameAddress} onChange={e => setIsSameAddress(e.target.checked)} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                        <label htmlFor="sameAdd" className="ml-3 text-[11px] font-black text-blue-700 uppercase tracking-widest cursor-pointer">O endereço da obra é o mesmo do cliente</label>
                    </div>

                    {!isSameAddress && (
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 animate-fadeIn">
                            <div className="md:col-span-1 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">CEP Obra</label><input name="p_cep" className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                            <div className="md:col-span-5 space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase">Logradouro Obra</label><input name="p_street" className="w-full h-11 px-4 bg-slate-50 border-slate-200 rounded-lg text-sm" /></div>
                        </div>
                    )}
                </FormSection>

                {/* 5. FINANCEIRO E DATAS */}
                <FormSection title="5. FINANCEIRO E DATAS">
                    <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-end">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Subtotal Bruto</label>
                                <p className="text-xl font-black text-slate-300 line-through decoration-2">{formatCurrency(financial.subtotalBruto)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Desconto (%)</label>
                                <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full h-11 px-4 border-blue-200 rounded-lg text-blue-600 font-black text-lg shadow-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase">Valor Final</label>
                                <p className="text-3xl font-black text-blue-700 leading-none">{formatCurrency(financial.totalFinal)}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assinatura</label>
                                <div className="relative">
                                    <input type="date" value={contractDate} onChange={e => setContractDate(e.target.value)} className="w-full h-11 px-4 bg-white border-slate-200 rounded-lg text-sm font-bold pr-10" />
                                    <CalendarIcon className="w-5 h-5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nº Parcelas</label>
                                <select value={numInstallments} onChange={e => setNumInstallments(e.target.value)} className="w-full h-11 px-4 bg-white border-slate-200 rounded-lg text-sm font-bold">
                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24, 36].map(n => <option key={n} value={n}>{n}x</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center">
                                <div className="flex items-center">
                                    <input type="checkbox" id="downPay" checked={hasDownPayment} onChange={e => setHasDownPayment(e.target.checked)} className="w-6 h-6 rounded text-blue-600 focus:ring-blue-500" />
                                    <label htmlFor="downPay" className="ml-3 text-[11px] font-black text-slate-700 uppercase tracking-widest cursor-pointer">Terá valor de entrada?</label>
                                </div>
                                {hasDownPayment && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest">% Entrada</label>
                                            <input type="number" value={downPaymentPercent} onChange={e => setDownPaymentPercent(e.target.value)} className="w-full h-11 px-4 border-green-100 rounded-lg text-green-700 font-black" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">Venc. Entrada</label>
                                            <input type="date" value={downPaymentDate} onChange={e => setDownPaymentDate(e.target.value)} className="w-full h-11 px-4 border-slate-200 rounded-lg text-sm font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">1ª Parcela em:</label>
                                            <input type="date" value={firstInstallmentDate} onChange={e => setFirstInstallmentDate(e.target.value)} className="w-full h-11 px-4 border-slate-200 rounded-lg text-sm font-bold" placeholder="Opcional" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* VISUALIZAÇÃO DO FLUXO (Cards brancos da imagem) */}
                        <div className="mt-10">
                            <div className="flex items-center space-x-2 mb-4">
                                <WalletIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Visualização do fluxo de recebimento</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {financial.previewFlow.map((item, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</span>
                                        <span className="text-sm font-black text-slate-800">{formatCurrency(item.value)}</span>
                                        <span className="text-[10px] font-bold text-slate-400 mt-1">{formatDate(item.date)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </FormSection>

                {/* BOTÕES FINAIS */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <button 
                        type="button" 
                        onClick={() => handleSubmit('budget')} 
                        className="group flex flex-col items-center gap-3"
                    >
                        <div className="px-10 py-5 bg-[#1e293b] text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all flex items-center">
                            <WalletIcon className="w-6 h-6 mr-3" /> SALVAR SOMENTE ORÇAMENTO
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600">Ficará na lista de negociação</span>
                    </button>

                    <span className="text-slate-300 font-bold italic">ou</span>

                    <button 
                        type="button" 
                        onClick={() => handleSubmit('contract')} 
                        className="group flex flex-col items-center gap-3"
                    >
                        <div className="px-12 py-5 bg-[#10b981] text-white font-black rounded-2xl shadow-xl hover:bg-[#059669] transition-all flex items-center">
                            <CheckCircleIcon className="w-6 h-6 mr-3" /> ATIVAR PROJETO (CONTRATO)
                        </div>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest group-hover:text-green-700">Gera financeiro e cronograma de obra</span>
                    </button>
                </div>

                <div className="text-center">
                    <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600 font-bold uppercase text-xs tracking-widest transition-colors">
                        Desistir e voltar
                    </button>
                </div>

            </form>
        </div>
    );
};

export default NewContract;
