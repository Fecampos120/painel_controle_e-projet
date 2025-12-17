
import React, { useState, useEffect } from 'react';
import { PaymentInstallment } from '../types';
import { XIcon, SparklesIcon } from './Icons';
import { GoogleGenAI } from "@google/genai";

interface PaymentReminderModalProps {
    isOpen: boolean;
    onClose: () => void;
    installment: PaymentInstallment | null;
}

const formatCurrencyModal = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDateModal = (date: Date) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(date));

const PaymentReminderModal: React.FC<PaymentReminderModalProps> = ({ isOpen, onClose, installment }) => {
    const [message, setMessage] = useState('');
    const [tone, setTone] = useState<'Amigável' | 'Formal' | 'Urgente'>('Amigável');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (installment) {
            const isLate = new Date(installment.dueDate) < new Date() && installment.status === 'Pendente';
            const introMessage = isLate 
                ? `Olá ${installment.clientName}, tudo bem?\n\nVerificamos que a parcela abaixo, referente ao seu projeto "${installment.projectName}", está em atraso.`
                : `Olá ${installment.clientName}, tudo bem?\n\nEste é um lembrete amigável sobre a próxima parcela do seu projeto "${installment.projectName}".`;

            const defaultMessage = `${introMessage}\n\nDetalhes da Parcela:\n- Parcela: ${installment.installment}\n- Vencimento: ${formatDateModal(installment.dueDate)}\n- Valor: ${formatCurrencyModal(installment.value)}\n\nQualquer dúvida, estou à disposição!`;
            setMessage(defaultMessage);
        }
    }, [installment]);

    const handleGenerateMessage = async () => {
        if (!installment) return;
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const isLate = new Date(installment.dueDate) < new Date() && installment.status === 'Pendente';
            const prompt = `Escreva uma mensagem de cobrança de arquiteto para cliente.
            Tom: ${tone}. Status: ${isLate ? 'Atrasado' : 'Lembrete de Vencimento'}.
            Dados: Cliente ${installment.clientName}, Projeto ${installment.projectName}, Valor ${formatCurrencyModal(installment.value)}, Vencimento ${formatDateModal(installment.dueDate)}.`;

            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
            });
            
            setMessage(response.text || message);
        } catch (error) {
            console.error("Erro ao gerar mensagem:", error);
        } finally {
            setIsGenerating(false);
        }
    };
    
    if (!isOpen || !installment) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-slate-800">Enviar Lembrete</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                        <select value={tone} onChange={(e) => setTone(e.target.value as any)} className="bg-white border rounded p-1 text-sm">
                            <option>Amigável</option>
                            <option>Formal</option>
                            <option>Urgente</option>
                        </select>
                        <button onClick={handleGenerateMessage} disabled={isGenerating} className="flex items-center text-blue-600 text-sm font-bold">
                            <SparklesIcon className="w-4 h-4 mr-1"/> {isGenerating ? 'Gerando...' : 'Reescrever com IA'}
                        </button>
                    </div>
                    <textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-3 border rounded-md text-sm" />
                </div>
                <div className="flex justify-end space-x-3 p-4 bg-slate-50 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600">Cancelar</button>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')} className="px-6 py-2 bg-green-600 text-white rounded-md font-bold">Enviar WhatsApp</button>
                </div>
            </div>
        </div>
    );
};

export default PaymentReminderModal;
