
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

export const GANTT_STAGES_CONFIG = [
    { name: 'Briefing' },
    { name: 'Layout' },
    { name: '3D' },
    { name: 'Executivo' },
    { name: 'Entrega' }
];

export const CHECKLIST_TEMPLATE: ChecklistItemTemplate[] = [
    { id: 1, stage: 'Fundação', text: 'Locação da obra' },
    { id: 2, stage: 'Fundação', text: 'Escavação de sapatas' },
    { id: 3, stage: 'Estrutura', text: 'Concretagem de pilares' },
    { id: 4, stage: 'Alvenaria', text: 'Elevação de paredes' },
    { id: 5, stage: 'Instalações', text: 'Tubulação hidráulica bruta' },
];

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    appName: 'E-Projet',
    companyName: 'STUDIO BATTELLI',
    professionalName: 'Arquiteto Responsável',
    phone: '(00) 00000-0000',
    address: {
        street: 'Rua Principal',
        number: '123',
        district: 'Centro',
        city: 'Cidade Exemplo',
        state: 'EX',
        cep: '00000-000'
    }
};

export const MOCK_FIXED_EXPENSE_TEMPLATES: FixedExpenseTemplate[] = [
    { id: 1, description: 'Aluguel Escritório', amount: 1500, day: 5 },
    { id: 2, description: 'Internet', amount: 120, day: 10 },
    { id: 3, description: 'Energia Elétrica', amount: 250, day: 15 },
];

export const INITIAL_SERVICE_PRICES: ServicePrice[] = [
    { id: 1, name: 'Projeto Arquitetônico', price: 50, unit: 'm²' },
    { id: 2, name: 'Design de Interiores', price: 65, unit: 'm²' },
    { id: 3, name: 'Medição e Planta Baixa', unit: 'fixo' },
];

export const INITIAL_HOURLY_RATES: ServicePrice[] = [
    { id: 101, name: 'Consultoria Técnica', price: 150, unit: 'hora' },
];

export const INITIAL_MEASUREMENT_TIERS: PriceTier[] = [
    { id: 1, range: '0 a 100 m²', price: 800 },
    { id: 2, range: '101 a 200 m²', price: 1500 },
];

export const INITIAL_PROJECT_STAGES_TEMPLATE: ProjectStageTemplateItem[] = [
    { id: 1, sequence: 1, name: 'Levantamento', durationWorkDays: 5 },
    { id: 2, sequence: 2, name: 'Estudo Preliminar', durationWorkDays: 10 },
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
                { id: 103, description: 'Apresentação da Proposta', hours: 2, participantId: 1 },
                { id: 104, description: 'Elaboração de Contrato', hours: 2, participantId: 1 },
            ]
        },
        {
            id: 2, number: 2, name: 'LEVANTAMENTO DE DADOS', isOpen: true,
            tasks: [
                { id: 201, description: 'Visita ao Local', hours: 4, participantId: 1 },
                { id: 202, description: 'Levantamento', hours: 6, participantId: 1 },
                { id: 203, description: 'Digitalização do Levantamento', hours: 4, participantId: 1 },
                { id: 204, description: 'Pesquisa de Referências', hours: 6, participantId: 1 },
                { id: 205, description: 'Briefing', hours: 2, participantId: 1 },
            ]
        },
        {
            id: 3, number: 3, name: 'ESTUDO PRELIMINAR', isOpen: true,
            tasks: [
                { id: 301, description: 'Estudo das Informações', hours: 4, participantId: 1 },
                { id: 302, description: 'Criação de Layouts', hours: 8, participantId: 1 },
                { id: 303, description: 'Criação de Moodboards', hours: 4, participantId: 1 },
                { id: 304, description: 'Montar Apresentação', hours: 4, participantId: 1 },
            ]
        },
        {
            id: 4, number: 4, name: 'ANTEPROJETO', isOpen: true,
            tasks: [],
            environments: [
                {
                    id: 401, name: 'Cozinha',
                    tasks: [
                        { id: 4011, description: 'Referência - Conceito', hours: 2, participantId: 1 },
                        { id: 4012, description: 'Layout', hours: 4, participantId: 1 },
                        { id: 4013, description: 'Modelagem 3D', hours: 6, participantId: 1 },
                        { id: 4014, description: 'Renderização', hours: 4, participantId: 1 },
                    ]
                }
            ]
        },
        {
            id: 5, number: 5, name: 'PROJETO EXECUTIVO', isOpen: true,
            tasks: [
                { id: 501, description: 'Planta Baixa (Móveis Fixo/Soltos)', hours: 8, participantId: 1 },
                { id: 502, description: 'Elétrica / Hidrossanitária', hours: 8, participantId: 1 },
                { id: 503, description: 'Iluminação / Gesso', hours: 6, participantId: 1 },
                { id: 504, description: 'Detalhamento Marcenaria', hours: 12, participantId: 1 },
            ]
        }
    ]
};
