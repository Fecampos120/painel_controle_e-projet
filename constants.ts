
import { Client, PaymentInstallment, AttentionPoint, Reminder, Contract, ProjectProgress, Address, ProjectSchedule, ServicePrice, PriceTier, ProjectStageTemplateItem, OtherPayment, ProjectStage, Partner, StageProgress, ChecklistItemTemplate } from './types';

export const CLIENTS: Client[] = [];

export const MOCK_ATTENTION_POINTS: AttentionPoint[] = [];

export const MOCK_REMINDERS: Reminder[] = [];

const MOCK_ADDRESS: Address = { street: 'Rua Fictícia', number: '123', district: 'Centro', city: 'São Paulo', state: 'SP', cep: '01000-000' };


export const MOCK_OTHER_PAYMENTS: OtherPayment[] = [];

export const MOCK_PARTNERS: Partner[] = [];

export const PARTNER_TYPES: string[] = [
    'Gesso',
    'Elétrica/Hidráulica',
    'Construtora',
    'Material de Construção',
    'Marcenaria',
    'Pintura',
    'Serralheria',
    'Vidraçaria',
    'Marmoraria',
    'Automação',
    'Paisagismo',
    'Outro',
];

// Template do Checklist de Obra (Genérico)
export const CHECKLIST_TEMPLATE: ChecklistItemTemplate[] = [
    // ETAPA 1: INÍCIO DO PROJETO
    { id: 1, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Abrir grupo do cliente' },
    { id: 2, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Mandar msg de boas-vindas' },
    { id: 3, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Abrir projeto no Gerenciador de Tarefas (Asana/Trello)' },
    { id: 4, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Agendar medição' },
    { id: 5, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Agendar reunião de briefing com o cliente (verificar disponibilidade da agenda)' },
    { id: 6, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Agendar Reunião de criação para o mesmo dia do Briefing' },
    { id: 7, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Confirmar data da reunião na agenda' },
    { id: 8, stage: 'ETAPA 1: INÍCIO DO PROJETO - Start', text: 'Em caso de reunião online: link da reunião para os clientes' },
    
    { id: 9, stage: 'ETAPA 1: INÍCIO DO PROJETO - Medição', text: 'Pegar kit medição antes da medição' },
    { id: 10, stage: 'ETAPA 1: INÍCIO DO PROJETO - Medição', text: 'Depois: salvar as fotos na pasta (incluindo as fotos do croqui da medição)' },
    { id: 11, stage: 'ETAPA 1: INÍCIO DO PROJETO - Medição', text: 'Separar as pastas por ambientes' },
    { id: 12, stage: 'ETAPA 1: INÍCIO DO PROJETO - Medição', text: 'Passar a base inteira para o software 3D (Sketch/Revit)' },
    { id: 13, stage: 'ETAPA 1: INÍCIO DO PROJETO - Medição', text: 'Colocar mobílias sanitárias existentes na base' },
    
    { id: 14, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Limpeza da mesa e organização geral da sala de reunião' },
    { id: 15, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Preparar kit boas-vindas' },
    { id: 16, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Música da banda preferida do cliente' },
    { id: 17, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Fazer ata da reunião' },
    { id: 18, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Envio da ata do Briefing e pedir assinatura do cliente aprovando o documento' },
    { id: 19, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Envio da ficha de eletros' },
    { id: 20, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Salvar documento de aprovação + print do WhatsApp na pasta' },
    { id: 21, stage: 'ETAPA 1: INÍCIO DO PROJETO - Psicobriefing', text: 'Criar checklist do briefing' },

    // ETAPA 2: CRIATIVO
    { id: 22, stage: 'ETAPA 2: CRIATIVO', text: 'Levar para a reunião de criação: planta base, briefing e checklist do briefing' },
    { id: 23, stage: 'ETAPA 2: CRIATIVO', text: 'Tirar foto e salvar na pasta CRIAÇÃO todos os croquis e as anotações das ideias' },
    { id: 24, stage: 'ETAPA 2: CRIATIVO', text: 'Criar checklist dos ambientes que é preciso modelar' },
    { id: 25, stage: 'ETAPA 2: CRIATIVO', text: 'Criar lista de itens personalizados para o cliente' },
    { id: 26, stage: 'ETAPA 2: CRIATIVO', text: 'Criar checklist das modelagens' },
    { id: 27, stage: 'ETAPA 2: CRIATIVO', text: 'Modelar todos os ambientes' },
    { id: 28, stage: 'ETAPA 2: CRIATIVO', text: 'Avisar o Administrativo com antecedência para colocar na agenda a Revisão Interna' },
    { id: 29, stage: 'ETAPA 2: CRIATIVO', text: 'Passar checklist do briefing' },
    { id: 30, stage: 'ETAPA 2: CRIATIVO', text: 'Salvar imagens prévias sem render e avisar o Responsável (se necessário)' },
    { id: 31, stage: 'ETAPA 2: CRIATIVO', text: 'Agendar reunião de apresentação com os clientes (verificar disponibilidade da agenda)' },
    { id: 32, stage: 'ETAPA 2: CRIATIVO', text: 'Confirmar a reunião na agenda' },
    { id: 33, stage: 'ETAPA 2: CRIATIVO', text: 'Fazer ajustes conforme solicitado na Revisão Interna' },
    { id: 34, stage: 'ETAPA 2: CRIATIVO', text: 'Avisar novamente dos ajustes' },
    { id: 35, stage: 'ETAPA 2: CRIATIVO', text: 'Dado o OK da Revisão Interna, fazer os renders' },
    { id: 36, stage: 'ETAPA 2: CRIATIVO', text: 'Avisar o Responsável dos renders prontos' },
    { id: 37, stage: 'ETAPA 2: CRIATIVO', text: 'Montar apresentação' },
    { id: 38, stage: 'ETAPA 2: CRIATIVO', text: 'Avisar o Responsável da conclusão da apresentação' },

    { id: 39, stage: 'ETAPA 2: CRIATIVO - Reunião de apresentação', text: 'Limpeza da mesa e organização geral da sala de reunião' },
    { id: 40, stage: 'ETAPA 2: CRIATIVO - Reunião de apresentação', text: 'Separar amostras' },
    { id: 41, stage: 'ETAPA 2: CRIATIVO - Reunião de apresentação', text: 'Música da banda preferida do cliente' },
    { id: 42, stage: 'ETAPA 2: CRIATIVO - Reunião de apresentação', text: 'Ata da reunião' },
    { id: 43, stage: 'ETAPA 2: CRIATIVO - Reunião de apresentação', text: 'Envio da ata da reunião com a solicitação de alterações e pedir assinatura do cliente aprovando o documento' },
    { id: 44, stage: 'ETAPA 2: CRIATIVO - Reunião de apresentação', text: 'Salvar documento de aprovação + print do WhatsApp na pasta' },

    { id: 45, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Salvar provas de pedidos de alterações (arquivos, prints de whats e etc)' },
    { id: 46, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Fazer as modificações solicitadas' },
    { id: 47, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Mostrar para o Responsável' },
    { id: 48, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Envio para o cliente por e-mail' },
    { id: 49, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Envio para o cliente por whatsapp (imagens soltas)' },
    { id: 50, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Printar novos pedidos de alteração pelo whatsapp e salvar na pasta' },
    { id: 51, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Salvar na pasta todo e qualquer arquivo do cliente em relação a pedidos de alteração' },
    { id: 52, stage: 'ETAPA 2: CRIATIVO - Alterações', text: 'Envio do documento para assinatura de projeto criativo aprovado' },
    
    { id: 53, stage: 'ETAPA 2: CRIATIVO - Após aprovação 100%', text: 'Verificar com Marcenaria/Internos sugestão dos armários' },
    { id: 54, stage: 'ETAPA 2: CRIATIVO - Após aprovação 100%', text: 'Enviar vídeo explicando aos clientes' },
    { id: 55, stage: 'ETAPA 2: CRIATIVO - Após aprovação 100%', text: 'Alterar conforme o necessário' },
    { id: 56, stage: 'ETAPA 2: CRIATIVO - Após aprovação 100%', text: 'Envio do documento para assinatura de projeto criativo aprovado' },
    { id: 57, stage: 'ETAPA 2: CRIATIVO - Após aprovação 100%', text: 'Colocar na pasta FINAL imagens aprovadas e definidas.' },

    // ETAPA 3: EXECUTIVO
    { id: 58, stage: 'ETAPA 3: EXECUTIVO - Preparo', text: 'Reunião criativo + executivo' },
    { id: 59, stage: 'ETAPA 3: EXECUTIVO - Preparo', text: 'Criar checklist de todos os ambientes' },
    { id: 60, stage: 'ETAPA 3: EXECUTIVO - Preparo', text: 'Verificar pedidos específicos do cliente na ata de projeto técnico' },

    { id: 61, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Elaboração de todo projeto' },
    { id: 62, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Sinalizar conclusão para Revisão Técnica' },
    { id: 63, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Atender as correções e sinalizar a Revisão Técnica novamente' },
    { id: 64, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Atender novas possíveis correções' },
    { id: 65, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'OK final da Revisão Técnica' },
    { id: 66, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Após finalizado, enviar para o cliente com o vídeo explicativo + documento de assinatura' },
    { id: 67, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Avisar o cliente no whatsapp que foi enviado por e-mail' },
    { id: 68, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Avisar o cliente que em breve enviaremos o memorial e os orçamentos' },
    { id: 69, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Salvar documento assinado na pasta' },
    { id: 70, stage: 'ETAPA 3: EXECUTIVO - Desenvolvimento', text: 'Colocar na pasta FINAL o projeto completo aprovado' },

    // ETAPA 4: MEMORIAL E ORÇAMENTOS
    { id: 71, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Elaborar memorial' },
    { id: 72, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Sinalizar a conclusão para Revisão Técnica' },
    { id: 73, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Atender as correções e avisar a Revisão Técnica novamente' },
    { id: 74, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Atender a novas possíveis correções' },
    { id: 75, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'OK final da Revisão Técnica' },
    { id: 76, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Verificar com Marcenaria/Internos se há algum fornecedor diferente do comum' },
    { id: 77, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Enviar para os fornecedores' },
    { id: 78, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Fazer um checklist no gerenciador de tarefas de todos orçamentos em andamento' },
    { id: 79, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Cobrar os fornecedores' },
    { id: 80, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Verificar os orçamentos conforme memorial e projeto' },
    { id: 81, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Depois de tudo verificado avisar Financeiro/Conferência' },
    { id: 82, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Correção do Financeiro/Conferência' },
    { id: 83, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'OK do Financeiro/Conferência' },
    { id: 84, stage: 'ETAPA 4: MEMORIAL E ORÇAMENTOS', text: 'Enviar para os clientes' },

    // ETAPA 5: COMPRAS
    { id: 85, stage: 'ETAPA 5: COMPRAS', text: 'Follow up com os clientes frequentemente e agendar compras de: Revestimentos + Iluminação' },
    { id: 86, stage: 'ETAPA 5: COMPRAS', text: 'Compras de: Móveis Soltos' },
    { id: 87, stage: 'ETAPA 5: COMPRAS', text: 'Compras de: Cortinas, tapetes, enxoval, papéis de parede' },
    { id: 88, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Ladrilhos' },
    { id: 89, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Tijolinhos' },
    { id: 90, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Marcenaria' },
    { id: 91, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Marmoraria' },
    { id: 92, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Vidros' },
    { id: 93, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Louças e metais' },
    { id: 94, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Jardim vertical' },
    { id: 95, stage: 'ETAPA 5: COMPRAS', text: 'Follow up: Plantas' },
    { id: 96, stage: 'ETAPA 5: COMPRAS - Depois das compras', text: 'Verificar com Responsável se houveram alterações nas compras presenciais' },
    { id: 97, stage: 'ETAPA 5: COMPRAS - Depois das compras', text: 'Salvar pedidos fechados na pasta' },
    { id: 98, stage: 'ETAPA 5: COMPRAS - Depois das compras', text: 'Enviar pedidos fechados para o Administrativo' },

    // ETAPA 6: OBRAS
    { id: 99, stage: 'ETAPA 6: OBRAS', text: 'Follow up quinzenal com os clientes' },
    { id: 100, stage: 'ETAPA 6: OBRAS', text: 'Pegar contato de quem vai fazer a obra e criar um grupo' },
    { id: 101, stage: 'ETAPA 6: OBRAS', text: 'Agendar visitas nas etapas necessárias' },
    { id: 102, stage: 'ETAPA 6: OBRAS', text: 'Salvar fotos na pasta' },
    { id: 103, stage: 'ETAPA 6: OBRAS', text: 'Mandar fotos no grupo do escritório' },
    { id: 104, stage: 'ETAPA 6: OBRAS', text: 'Passar para estagiário elaborar relatório' },
    { id: 105, stage: 'ETAPA 6: OBRAS', text: 'Verificar relatório' },
    { id: 106, stage: 'ETAPA 6: OBRAS', text: 'Enviar para o cliente' },

    // ETAPA 7: PRODUÇÃO
    { id: 107, stage: 'ETAPA 7: PRODUÇÃO', text: 'Elaborar memorial com links de itens de decor (almofadas, mantas, roupas de cama, etc)' },
    { id: 108, stage: 'ETAPA 7: PRODUÇÃO', text: 'Agilizar orçamento e pedido das plantas' },
    { id: 109, stage: 'ETAPA 7: PRODUÇÃO', text: 'Follow up com o cliente das compras de decor' },
    { id: 110, stage: 'ETAPA 7: PRODUÇÃO', text: 'Agendar visita pré produção' },
    { id: 111, stage: 'ETAPA 7: PRODUÇÃO', text: 'Agendar dia para a produção (verificar agenda do Administrativo, Responsável + equipe filmagem)' },
];

export const DEFAULT_PROJECT_STAGES_TEMPLATE: ProjectStageTemplateItem[] = [
    { id: 1, name: 'Reunião de Briefing', durationWorkDays: 1, sequence: 1 },
    { id: 2, name: 'Medição', durationWorkDays: 1, sequence: 2 }, 
    { id: 3, name: 'Apresentação do Layout Planta Baixa', durationWorkDays: 15, sequence: 3 },
    { id: 4, name: 'Revisão 01 (Planta Baixa)', durationWorkDays: 7, sequence: 4 },
    { id: 5, name: 'Revisão 02 (Planta Baixa)', durationWorkDays: 7, sequence: 5 },
    { id: 6, name: 'Revisão 03 (Planta Baixa)', durationWorkDays: 7, sequence: 6 },
    { id: 7, name: 'Apresentação de 3D', durationWorkDays: 15, sequence: 7 },
    { id: 8, name: 'Revisão 01 (3D)', durationWorkDays: 7, sequence: 8 },
    { id: 9, name: 'Revisão 02 (3D)', durationWorkDays: 7, sequence: 9 },
    { id: 10, name: 'Revisão 03 (3D)', durationWorkDays: 7, sequence: 10 },
    { id: 11, name: 'Executivo', durationWorkDays: 20, sequence: 11 },
    { id: 12, name: 'Entrega', durationWorkDays: 0, sequence: 12 },
];


// Helper function to create schedule data
const addWorkDays = (startDate: Date, days: number): Date => {
    const newDate = new Date(startDate);
    let dayOfWeek = newDate.getDay();
    if (dayOfWeek === 6) { newDate.setDate(newDate.getDate() + 2); }
    else if (dayOfWeek === 0) { newDate.setDate(newDate.getDate() + 1); }
    
    let addedDays = 0;
    while (addedDays < days) {
        newDate.setDate(newDate.getDate() + 1);
        dayOfWeek = newDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { addedDays++; }
    }
    return newDate;
};

const createScheduleStages = (template: ProjectStageTemplateItem[], startDateString: string, completedStagesCount: number = 0): ProjectStage[] => {
    const stages: ProjectStage[] = [];
    if (!startDateString) return stages;

    let projectStartDateObj = new Date(startDateString);

    let dayOfWeek = projectStartDateObj.getDay();
    while (dayOfWeek === 0 || dayOfWeek === 6) { 
        projectStartDateObj.setDate(projectStartDateObj.getDate() + 1);
        dayOfWeek = projectStartDateObj.getDay();
    }
    
    template.forEach((stageTemplate, index) => {
        let currentStageStartDate: Date;

        if (index > 0) {
            const prevStage = stages[index - 1];
            const prevStageEndDate = prevStage.completionDate ? new Date(prevStage.completionDate) : new Date(prevStage.deadline!);
            currentStageStartDate = addWorkDays(prevStageEndDate, 1);
        } else {
            currentStageStartDate = new Date(projectStartDateObj);
        }
        
        const duration = Math.max(0, stageTemplate.durationWorkDays > 0 ? stageTemplate.durationWorkDays - 1 : 0);
        const deadline = addWorkDays(new Date(currentStageStartDate), duration);

        const completionDate = index < completedStagesCount ? deadline.toISOString().split('T')[0] : undefined;

        stages.push({
            id: stageTemplate.id,
            name: stageTemplate.name,
            durationWorkDays: stageTemplate.durationWorkDays,
            startDate: currentStageStartDate.toISOString().split('T')[0],
            deadline: deadline.toISOString().split('T')[0],
            completionDate: completionDate,
        });
    });
    return stages;
};


export const MOCK_PROJECT_SCHEDULES: ProjectSchedule[] = [];

export const MOCK_CONTRACTS: Contract[] = [];

export const INITIAL_INSTALLMENTS: PaymentInstallment[] = [];

export const GANTT_STAGES_CONFIG: { name: string, duration: number }[] = [
    { name: 'Briefing', duration: 3 },
    { name: 'Layout', duration: 20 },
    { name: '3D', duration: 20 },
    { name: 'Executivo', duration: 25 },
    { name: 'Entrega', duration: 2 },
];

// Helper to generate project progress from a schedule
const generateProjectProgressFromSchedule = (schedule: ProjectSchedule): ProjectProgress => {
    const stageMapping: { [key: string]: string[] } = {
        'Briefing': ['Reunião de Briefing', 'Medição'],
        'Layout': ['Apresentação do Layout Planta Baixa', 'Revisão 01 (Planta Baixa)', 'Revisão 02 (Planta Baixa)', 'Revisão 03 (Planta Baixa)'],
        '3D': ['Apresentação de 3D', 'Revisão 01 (3D)', 'Revisão 02 (3D)', 'Revisão 03 (3D)'],
        'Executivo': ['Executivo'],
        'Entrega': ['Entrega'],
    };

    const progressStages: StageProgress[] = GANTT_STAGES_CONFIG.map(ganttStage => {
        const detailedStageNames = stageMapping[ganttStage.name] || [];
        const relevantDetailedStages = schedule.stages.filter(s => detailedStageNames.includes(s.name));
        
        if (relevantDetailedStages.length === 0) {
            return { name: ganttStage.name, status: 'pending' };
        }

        const completedCount = relevantDetailedStages.filter(s => s.completionDate).length;
        
        let status: 'completed' | 'in_progress' | 'pending';
        if (completedCount === relevantDetailedStages.length) {
            status = 'completed';
        } else if (completedCount > 0) {
            status = 'in_progress';
        } else {
            const firstStageOfGroup = relevantDetailedStages[0];
            const today = new Date();
            today.setHours(0,0,0,0);
            const stageStartDate = firstStageOfGroup.startDate ? new Date(firstStageOfGroup.startDate) : null;
            if(stageStartDate && stageStartDate <= today){
                status = 'in_progress';
            } else {
                status = 'pending';
            }
        }
        return { name: ganttStage.name, status };
    });

    return {
        contractId: schedule.contractId,
        projectName: schedule.projectName,
        clientName: schedule.clientName,
        stages: progressStages,
    };
};

export const MOCK_PROJECT_PROGRESS: ProjectProgress[] = MOCK_PROJECT_SCHEDULES.map(generateProjectProgressFromSchedule);

export const MOCK_SERVICE_PRICES: ServicePrice[] = [
    { id: 1, name: 'Arquitetônico', unit: 'm²' },
    { id: 2, name: 'Estrutural', price: 15, unit: 'm²' },
    { id: 3, name: 'Projeto do Zero', price: 40, unit: 'm²' },
    { id: 4, name: 'Design de Interiores', unit: 'm²' },
    { id: 5, name: 'Medição e Planta Baixa', unit: 'un' },
    { id: 6, name: 'Consultoria', unit: 'un' },
    { id: 7, name: 'Terceiros', unit: 'un' },
    { id: 8, name: 'RT (Responsabilidade Técnica)', unit: 'un' },
    { id: 9, name: 'Gerenciamento de Obras', price: 1400, unit: 'mês' },
];

export const MOCK_HOURLY_RATES: ServicePrice[] = [
    { id: 1, name: 'Visita Técnica', price: 80, unit: 'hora' },
];

export const MOCK_MEASUREMENT_TIERS: PriceTier[] = [
    { id: 1, range: '0 a 50 m²', price: 1000 },
    { id: 2, range: '51 a 100 m²', price: 1500 },
];

export const MOCK_EXTRA_TIERS: PriceTier[] = [];
