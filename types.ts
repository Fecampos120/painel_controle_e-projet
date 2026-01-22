
export interface Address {
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
    cep: string;
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
    serviceType?: string;
}

// Add missing properties to Contract
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
    discountValue: number;
    mileageDistance?: number;
    mileageCost?: number;
    techVisits?: {
        enabled: boolean;
        quantity: number;
        totalValue: number;
    };
    downPayment: number;
    downPaymentDate: Date;
    clientPhone?: string;
    clientEmail?: string;
    durationMonths?: number;
    discountType?: string;
    hasDownPayment?: boolean;
    firstInstallmentDate?: Date;
    budgetId?: number;
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

export interface Expense {
    id: number;
    description: string;
    category: 'Fixa' | 'Variável';
    amount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago';
    paidDate?: string;
}

// Add all missing interfaces used across components
export interface ThemeSettings {
    primaryColor: string;
    sidebarColor: string;
    backgroundColor: string;
    fontFamily: string;
    borderRadius: string;
}

export interface ProjectStageTemplateItem {
    id: number;
    sequence: number;
    name: string;
    durationWorkDays: number;
}

export interface ChecklistItemTemplate {
    id: number;
    stage: string;
    text: string;
}

export interface MenuItem {
    id: string;
    label: string;
    iconName: string;
    view: string;
    sequence: number;
    visible: boolean;
}

export interface SystemSettings {
    appName: string;
    companyName: string;
    professionalName: string;
    phone: string;
    logoUrl?: string;
    address: Address;
    theme: ThemeSettings;
    projectStagesTemplate: ProjectStageTemplateItem[];
    checklistTemplate: ChecklistItemTemplate[];
    menuOrder: MenuItem[];
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
    isOpen: boolean;
    tasks: PricingTask[];
    environments?: PricingEnvironment[];
}

export interface PricingModel {
    projectName: string;
    taxPercentage: number;
    profitPercentage: number;
    participants: PricingParticipant[];
    stages: PricingStage[];
}

export interface FixedExpenseTemplate {
    id: number;
    description: string;
    amount: number;
    day: number;
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

export interface VisitLog {
    id: number;
    contractId: number;
    date: string;
    notes: string;
    createdAt?: Date;
}

export interface Partner {
    id: number;
    name: string;
    type: string;
    contactPerson: string;
    phone: string;
    email: string;
    cnpj: string;
    photoUrl: string;
    rating: number;
    clientIds: number[];
}

export interface Appointment {
    id: number;
    title: string;
    date: string;
    time: string;
    clientId?: number;
    clientName?: string;
    completed: boolean;
    description?: string;
}

export interface Note {
    id: number;
    title: string;
    content: string;
    createdAt?: Date;
    completed: boolean;
    alertDate?: string;
    contractId?: number;
}

export interface ProjectUpdate {
    id: number;
    contractId: number;
    date: string;
    description: string;
    nextSteps?: string;
    photos?: string[];
}

export interface OtherPayment {
    id: number;
    description: string;
    paymentDate: Date;
    value: number;
}

export interface AttentionPoint {
    clientName: string;
    description: string;
    daysRemaining: number;
    type: 'stage' | 'payment' | 'alert';
}

export interface ProjectProgress {
    contractId: number;
    progress: number;
}

export interface Client {
    id: number;
    name: string;
    logoUrl?: string;
}

export interface Reminder {
    id: number;
    clientId: number;
    clientName: string;
    description: string;
    date: Date;
    completed: boolean;
}

export interface Meeting {
    id: number;
    contractId: number;
    date: string;
    title: string;
}

// Complete AppData definition
export interface AppData {
    clients: Client[];
    contracts: Contract[];
    budgets: Budget[];
    reminders: Reminder[];
    appointments: Appointment[];
    installments: PaymentInstallment[];
    schedules: ProjectSchedule[];
    servicePrices: ServicePrice[];
    hourlyRates: ServicePrice[];
    measurementTiers: PriceTier[];
    extraTiers: any[];
    otherPayments: OtherPayment[];
    partners: Partner[];
    checklists: ProjectChecklist[];
    expenses: Expense[];
    fixedExpenseTemplates: FixedExpenseTemplate[];
    visitLogs: VisitLog[];
    notes: Note[];
    systemSettings: SystemSettings;
    pricing: PricingModel;
    meetings: Meeting[];
    projectUpdates: ProjectUpdate[];
    projectProgress?: ProjectProgress[];
}
