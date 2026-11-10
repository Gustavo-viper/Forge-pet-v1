export type ID = string;

export interface Service {
  id: ID;
  name: string;
  description: string;
  price: number; // valor demonstrativo
  duration: number; // minutos
  image: string;
  category: "Cabelo" | "Unhas" | "Tratamento";
  audience: "Feminino" | "Masculino" | "Unissex";
  active: boolean;
}

export interface WorkDay {
  enabled: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
}

export interface Professional {
  id: ID;
  name: string;
  role: string;
  photo: string;
  bio: string;
  serviceIds: ID[];
  schedule: WorkDay[]; // índice 0 = domingo
  active: boolean; // disponível para novos agendamentos
}

export interface Client {
  id: ID;
  name: string;
  phone: string;
  email: string;
  password: string; // apenas demonstração — nunca armazene senhas assim em produção
  createdAt: string; // ISO
}

export type AppointmentStatus = "pendente" | "confirmado" | "concluido" | "cancelado";

export interface Appointment {
  id: ID;
  clientId: ID;
  serviceId: ID;
  professionalId: ID;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number;
  price: number;
  status: AppointmentStatus;
  createdAt: string;
  changeRequest?: { note: string; requestedAt: string };
  history?: { at: string; text: string }[];
}

export interface Block {
  id: ID;
  professionalId: ID | "all";
  date: string;
  start: string;
  end: string;
  reason: string;
}

export interface Settings {
  salonName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  instagram: string;
  facebook: string;
  slotInterval: number; // minutos
  bookingWindowDays: number;
  cancelPolicyHours: number;
  autoConfirm: boolean;
}

export interface DB {
  version: number;
  services: Service[];
  professionals: Professional[];
  clients: Client[];
  appointments: Appointment[];
  blocks: Block[];
  businessHours: WorkDay[]; // índice 0 = domingo
  settings: Settings;
}

export interface Session {
  clientId: ID | null;
  admin: boolean;
}
