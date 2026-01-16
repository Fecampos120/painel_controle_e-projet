

export interface Address {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    cep: string;
}

export interface Client {
    id: number;
    name: string;
    logoUrl?: string;
    address?: Address;
}

export interface Attachment {
    name: string;
    type: string;
    content: string;
}

export interface ContractService {
    id: number;
    serviceName: string;
    calculationMethod: 'metragem' | 'hora' | 'manual';
    area?: string;
    hours?: string;
    value: string;
}

export interface Budget {
    id: number;
    clientName: string;
    projectName: string;
    totalValue: number;
    createdAt: Date;
    status: 'Aberto' | 'Aprovado' | 'Perdido';
    lastContactDate: Date;
    services: ContractService[];
    clientEmail?: string;
    clientPhone?: string;
}

export interface Contract {
    id: number;
    clientName: string;
    projectName: string;
    totalValue: number;
    date: Date;
    status: 'Ativo' | 'Concluído' | 'Cancelado';
    clientAddress: Address;
    projectAddress: Address;
    installments: number;
    installmentValue: number;
    serviceType: string;
    services: ContractService[];
    discountType: string;
    discountValue: number;
    mileageDistance?: number;
    mileageCost?: number;
    durationMonths: number;
    techVisits?: {
        enabled: boolean;
        quantity: number;
        totalValue: number;
    };
    downPayment: number;
    downPaymentDate: Date;
    firstInstallmentDate?: Date;
    attachments?: {
        signedContract: Attachment[];
        workFiles: Attachment[];
        sitePhotos: Attachment[];
    };
    budgetId?: number;
}

export interface ProjectUpdate {
    id: number;
    contractId: number;
    date: string;
    description: string;
    nextSteps: string;
    photos?: string[]; // base64 strings
}

export interface Meeting {
    id: number;
    contractId: number;
    date: string;
    title: string;
    participants: string;
    summary: string; // Ata da reunião
    decisions: string;
}

export interface Reminder {
    id: number;
    clientId: number;
    clientName: string;
    description: string;
    date: Date;
    completed: boolean;
}

export interface PaymentInstallment {
    id: number;
    contractId: number;
    clientName: string;
    projectName: string;
    installment: string;
    dueDate: Date;
    value: number;
    status: 'Pendente' | 'Pago em dia' | 'Pago com atraso';
    paymentDate?: Date;
}

// Fixed missing AttentionPoint export
export interface AttentionPoint {
    clientName: string;
    description: string;
    daysRemaining: number;
    type: 'stage' | 'payment';
}

export interface ProjectStage {
    id: number;
    name: string;
    durationWorkDays: number;
    startDate?: string;
    deadline?: string;
    completionDate?: string;
}

export interface ProjectSchedule {
    id: number;
    contractId: number;
    clientName: string;
    projectName: string;
    startDate: string;
    stages: ProjectStage[];
}

export interface ServicePrice {
    id: number;
    name: string;
    price?: number;
    unit: string;
}

export interface PriceTier {
    id: number;
    range: string;
    price: number;
}

export interface ProjectProgress {
    id: number;
    contractId: number;
    progress: number;
}

export interface ProjectStageTemplateItem {
    id: number;
    sequence: number;
    name: string;
    durationWorkDays: number;
}

export interface OtherPayment {
    id: number;
    description: string;
    paymentDate: Date;
    value: number;
}

export interface Partner {
    id: number;
    name: string;
    type: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: Address;
    clientIds?: number[];
}

export interface ChecklistItemTemplate {
    id: number;
    text: string;
    stage: string;
}

export interface ProjectChecklistItem {
    id: number;
    text: string;
    stage: string;
    completed: boolean;
    completionDate?: string;
}

export interface ProjectChecklist {
    contractId: number;
    items: ProjectChecklistItem[];
}

export interface Expense {
    id: number;
    description: string;
    category: 'Fixa' | 'Variável';
    amount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago';
    paidDate?: string;
    recurrence?: boolean;
    recurrenceId?: number;
}

export interface FixedExpenseTemplate {
    id: number;
    description: string;
    amount: number;
    day: number;
}

export interface VisitLog {
    id: number;
    contractId: number;
    date: string;
    notes: string;
    createdAt?: Date;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    createdAt: Date;
    alertDate?: string;
    completed: boolean;
    contractId?: number;
}

export interface SystemSettings {
    appName: string;
    companyName: string;
    professionalName: string;
    phone: string;
    logoUrl?: string;
    address: Address;
}

export interface PricingParticipant {
    id: number;
    name: string;
    hourlyRate: number;
    isPrincipal: boolean;
}

export interface PricingTask {
    id: number;
    description: string;
    hours: number;
    participantId: number;
}

export interface PricingEnvironment {
    id: number;
    name: string;
    tasks: PricingTask[];
}

export interface PricingStage {
    id: number;
    number: number;
    name: string;
    tasks: PricingTask[];
    environments?: PricingEnvironment[];
    isOpen: boolean;
}

export interface PricingModel {
    projectName: string;
    participants: PricingParticipant[];
    stages: PricingStage[];
    taxPercentage: number;
    profitPercentage: number;
}

export interface AppData {
    clients: Client[];
    contracts: Contract[];
    budgets: Budget[];
    reminders: Reminder[];
    installments: PaymentInstallment[];
    schedules: ProjectSchedule[];
    servicePrices: ServicePrice[];
    hourlyRates: ServicePrice[];
    measurementTiers: PriceTier[];
    extraTiers: PriceTier[];
    projectProgress?: ProjectProgress[];
    projectStagesTemplate: ProjectStageTemplateItem[];
    otherPayments: OtherPayment[];
    partners: Partner[];
    checklists: ProjectChecklist[];
    expenses: Expense[];
    fixedExpenseTemplates: FixedExpenseTemplate[];
    visitLogs: VisitLog[];
    notes: Note[];
    systemSettings: SystemSettings;
    pricing?: PricingModel;
    meetings: Meeting[];
    projectUpdates: ProjectUpdate[];
}

