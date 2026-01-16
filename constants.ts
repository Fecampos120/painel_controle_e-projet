
import { 
  PricingModel, 
  SystemSettings, 
  FixedExpenseTemplate, 
  ChecklistItemTemplate,
  ServicePrice,
  PriceTier,
  ProjectStageTemplateItem
} from './types';

export const PARTNER_TYPES = [
    'Marmoraria', 'Marcenaria', 'Vidraçaria', 'Gesso', 'Pintura', 
    'Elétrica', 'Hidráulica', 'Climatização', 'Outros'
];

export const FONT_OPTIONS = [
    { name: 'Inter (Padrão Moderno)', value: "'Inter', sans-serif" },
    { name: 'Montserrat (Geométrico)', value: "'Montserrat', sans-serif" },
    { name: 'Roboto (Limpo)', value: "'Roboto', sans-serif" },
    { name: 'Playfair Display (Elegante/Luxo)', value: "'Playfair Display', serif" },
    { name: 'Poppins (Amigável)', value: "'Poppins', sans-serif" },
];

export const INITIAL_PROJECT_STAGES_TEMPLATE: ProjectStageTemplateItem[] = [
    { id: 1, sequence: 1, name: 'Briefing & Reunião', durationWorkDays: 3 },
    { id: 2, sequence: 2, name: 'Medição Técnica', durationWorkDays: 2 },
    { id: 3, sequence: 3, name: 'Estudo de Layout', durationWorkDays: 7 },
    { id: 4, sequence: 4, name: 'Modelagem 3D', durationWorkDays: 10 },
    { id: 5, sequence: 5, name: 'Detalhamento Executivo', durationWorkDays: 12 },
    { id: 6, sequence: 6, name: 'Entrega Técnica', durationWorkDays: 1 },
];

export const INITIAL_CHECKLIST_TEMPLATE: ChecklistItemTemplate[] = [
    // 1. Gestão Inicial
    { id: 1, stage: '1. Gestão Inicial', text: 'Criar grupo no WhatsApp com o cliente' },
    { id: 2, stage: '1. Gestão Inicial', text: 'Confirmar dados para o contrato' },
    { id: 3, stage: '1. Gestão Inicial', text: 'Enviar contrato para assinatura digital' },
    { id: 4, stage: '1. Gestão Inicial', text: 'Validar comprovante de entrada/sinal' },
    { id: 5, stage: '1. Gestão Inicial', text: 'Liberar acesso ao Portal do Cliente' },

    // 2. Medição Técnica
    { id: 6, stage: '2. Medição Técnica', text: 'Agendar visita técnica no local' },
    { id: 7, stage: '2. Medição Técnica', text: 'Realizar medição completa de ambientes' },
    { id: 8, stage: '2. Medição Técnica', text: 'Conferir pontos de água e gás' },
    { id: 9, stage: '2. Medição Técnica', text: 'Conferir quadro elétrico e pontos de luz' },
    { id: 10, stage: '2. Medição Técnica', text: 'Anexar croqui de medição ao projeto' },

    // 3. Projeto & Marcenaria
    { id: 11, stage: '3. Projeto dos Móveis', text: 'Definir distribuição interna (aramados/gavetas)' },
    { id: 12, stage: '3. Projeto dos Móveis', text: 'Finalizar modelagem 3D' },
    { id: 13, stage: '3. Projeto dos Móveis', text: 'Apresentar projeto preliminar ao cliente' },
    { id: 14, stage: '3. Projeto dos Móveis', text: 'Ajustar medidas conforme medição fina' },
    { id: 15, stage: '3. Projeto dos Móveis', text: 'Coletar aprovação final do 3D' },

    // 4. Escolhas & Especificação
    { id: 16, stage: '4. Escolhas Técnicas', text: 'Definir padrões de MDF e acabamentos' },
    { id: 17, stage: '4. Escolhas Técnicas', text: 'Escolher modelos de puxadores' },
    { id: 18, stage: '4. Escolhas Técnicas', text: 'Definir ferragens (dobradiças/corrediças)' },
    { id: 19, stage: '4. Escolhas Técnicas', text: 'Especificar vidros e espelhos' },

    // 5. Produção
    { id: 20, stage: '5. Produção em Fábrica', text: 'Enviar plano de corte para produção' },
    { id: 21, stage: '5. Produção em Fábrica', text: 'Início da fabricação dos módulos' },
    { id: 22, stage: '5. Produção em Fábrica', text: 'Conferência de qualidade pré-entrega' },

    // 6. Logística
    { id: 23, stage: '6. Logística & Entrega', text: 'Agendar data de entrega com o cliente' },
    { id: 24, stage: '6. Logística & Entrega', text: 'Confirmar saída do caminhão' },
    { id: 25, stage: '6. Logística & Entrega', text: 'Check de volumes entregues no local' },

    // 7. Montagem
    { id: 26, stage: '7. Montagem Técnica', text: 'Definir equipe de montagem' },
    { id: 27, stage: '7. Montagem Técnica', text: 'Início da montagem no local' },
    { id: 28, stage: '7. Montagem Técnica', text: 'Ajustes e regulagem de portas/gavetas' },
    { id: 29, stage: '7. Montagem Técnica', text: 'Limpeza pós-montagem' },

    // 8. Vistoria Final
    { id: 30, stage: '8. Vistoria Final', text: 'Realizar vistoria de entrega com cliente' },
    { id: 31, stage: '8. Vistoria Final', text: 'Coletar assinatura do Termo de Aceite' },

    // 9. Pós-venda
    { id: 32, stage: '9. Pós-venda', text: 'Entregar Manual de Uso e Garantia' },
    { id: 33, stage: '9. Pós-venda', text: 'Coletar avaliação do serviço (estrelas)' },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    appName: 'E-Projet',
    companyName: 'STUDIO BATTELLI',
    professionalName: 'Arquiteta Responsável',
    phone: '(00) 00000-0000',
    address: {
        street: 'Rua Principal',
        number: '123',
        district: 'Centro',
        city: 'Cidade Exemplo',
        state: 'EX',
        cep: '00000-000'
    },
    theme: {
        primaryColor: '#2563eb', // blue-600
        sidebarColor: '#0f172a', // slate-900
        backgroundColor: '#f1f5f9', // slate-100
        fontFamily: "'Inter', sans-serif",
        borderRadius: '12px'
    },
    projectStagesTemplate: INITIAL_PROJECT_STAGES_TEMPLATE,
    checklistTemplate: INITIAL_CHECKLIST_TEMPLATE
};

export const MOCK_FIXED_EXPENSE_TEMPLATES: FixedExpenseTemplate[] = [
    { id: 1, description: 'Aluguel Escritório', amount: 1500, day: 5 },
    { id: 2, description: 'Internet', amount: 120, day: 10 },
];

export const INITIAL_SERVICE_PRICES: ServicePrice[] = [
    { id: 1, name: 'Projeto Arquitetônico', price: 50, unit: 'm²' },
    { id: 2, name: 'Design de Interiores', price: 65, unit: 'm²' },
];

export const INITIAL_HOURLY_RATES: ServicePrice[] = [
    { id: 101, name: 'Consultoria Técnica', price: 150, unit: 'hora' },
];

export const INITIAL_MEASUREMENT_TIERS: PriceTier[] = [
    { id: 1, range: '0 a 100 m²', price: 800 },
];

export const INITIAL_PRICING_MODEL: PricingModel = {
    projectName: '',
    taxPercentage: 0,
    profitPercentage: 10,
    participants: [
        { id: 1, name: 'Arquiteto Principal', hourlyRate: 150, isPrincipal: true }
    ],
    stages: [
        {
            id: 1, number: 1, name: 'PROPOSTA / CONTRATO', isOpen: true,
            tasks: [
                { id: 101, description: 'Reunião Inicial', hours: 2, participantId: 1 },
                { id: 102, description: 'Elaboração de Proposta', hours: 4, participantId: 1 },
            ]
        }
    ]
};
