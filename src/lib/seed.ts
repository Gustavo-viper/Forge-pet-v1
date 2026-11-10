import type { Appointment, AppointmentStatus, Client, DB, Professional, Service, WorkDay } from "./types";
import { addDays, isPast, todayISO, weekday, toMin, fromMin } from "./dates";
import { IMG } from "./images";

export const DB_VERSION = 1;

const day = (enabled: boolean, start = "09:00", end = "19:00"): WorkDay => ({ enabled, start, end });

export const seedServices: Service[] = [
  { id: "srv_fem", name: "Corte feminino", description: "Consultoria de visagismo, lavagem, corte personalizado e finalização com escova modelada.", price: 120, duration: 60, image: IMG.corteFeminino, category: "Cabelo", audience: "Feminino", active: true },
  { id: "srv_masc", name: "Corte masculino", description: "Corte clássico ou moderno com máquina e tesoura, acabamento na navalha e finalização.", price: 60, duration: 30, image: IMG.corteMasculino, category: "Cabelo", audience: "Masculino", active: true },
  { id: "srv_uni", name: "Corte unissex", description: "Cortes versáteis para todos os estilos, com lavagem e finalização leve.", price: 80, duration: 45, image: IMG.corteUnissex, category: "Cabelo", audience: "Unissex", active: true },
  { id: "srv_mani", name: "Manicure — mãos", description: "Cutilagem cuidadosa, lixamento, hidratação e esmaltação com acabamento impecável.", price: 40, duration: 45, image: IMG.manicure, category: "Unhas", audience: "Unissex", active: true },
  { id: "srv_pedi", name: "Pedicure — pés", description: "Escalda-pés relaxante, cutilagem, esfoliação, hidratação e esmaltação.", price: 50, duration: 60, image: IMG.pedicure, category: "Unhas", audience: "Unissex", active: true },
  { id: "srv_hidra", name: "Hidratação capilar", description: "Tratamento profundo com máscara nutritiva, vapor de ozônio e selagem de cutículas.", price: 90, duration: 60, image: IMG.hidratacao, category: "Tratamento", audience: "Unissex", active: true },
];

export const seedProfessionals: Professional[] = [
  { id: "pro_ana", name: "Ana Beatriz Souza", role: "Hair stylist & visagista", photo: IMG.pro1, bio: "12 anos de experiência em cortes femininos e tratamentos capilares.", serviceIds: ["srv_fem", "srv_uni", "srv_hidra"], schedule: [day(false), day(true), day(true), day(true), day(true), day(true), day(true, "09:00", "15:00")], active: true },
  { id: "pro_rafael", name: "Rafael Martins", role: "Barbeiro & cabeleireiro", photo: IMG.pro2, bio: "Especialista em cortes masculinos clássicos, degradê e acabamento na navalha.", serviceIds: ["srv_masc", "srv_uni"], schedule: [day(false), day(false), day(true, "10:00", "19:00"), day(true, "10:00", "19:00"), day(true, "10:00", "19:00"), day(true, "10:00", "19:00"), day(true, "09:00", "16:00")], active: true },
  { id: "pro_camila", name: "Camila Ferreira", role: "Manicure & pedicure", photo: IMG.pro3, bio: "Nail designer apaixonada por detalhes, biossegurança e cuidados com as mãos e os pés.", serviceIds: ["srv_mani", "srv_pedi"], schedule: [day(false), day(true), day(true), day(true), day(true), day(true), day(true, "09:00", "15:00")], active: true },
  { id: "pro_juliana", name: "Juliana Lima", role: "Terapeuta capilar", photo: IMG.pro4, bio: "Tratamentos capilares, cronograma de hidratação e cortes femininos.", serviceIds: ["srv_hidra", "srv_fem", "srv_mani"], schedule: [day(false), day(true, "09:00", "17:00"), day(true, "09:00", "17:00"), day(false), day(true, "09:00", "17:00"), day(true, "09:00", "17:00"), day(true, "09:00", "15:00")], active: true },
  { id: "pro_lucas", name: "Lucas Oliveira", role: "Cabeleireiro unissex", photo: IMG.pro5, bio: "Cortes unissex contemporâneos e atendimento masculino e feminino.", serviceIds: ["srv_uni", "srv_masc", "srv_fem"], schedule: [day(false), day(true, "11:00", "19:00"), day(true, "11:00", "19:00"), day(true, "11:00", "19:00"), day(true, "11:00", "19:00"), day(true, "11:00", "19:00"), day(false)], active: true },
];

const CLIENT_NAMES: [string, string][] = [
  ["Mariana Alves", "(11) 98765-4321"],
  ["Pedro Henrique Costa", "(11) 97654-3210"],
  ["Larissa Mendes", "(11) 96543-2109"],
  ["Gabriel Rocha", "(11) 95432-1098"],
  ["Fernanda Ribeiro", "(11) 94321-0987"],
  ["Thiago Nascimento", "(11) 93210-9876"],
  ["Beatriz Carvalho", "(11) 92109-8765"],
  ["Rodrigo Pereira", "(11) 91098-7654"],
  ["Patrícia Gomes", "(11) 99887-6655"],
  ["Isabela Duarte", "(11) 98776-5544"],
];

const slug = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(" ").filter((_, i, a) => i === 0 || i === a.length - 1).join(".");

export function buildSeed(): DB {
  const today = todayISO();
  const clients: Client[] = [
    { id: "cli_demo", name: "Mariana Alves", phone: "(11) 98765-4321", email: "cliente@demo.com", password: "123456", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString() },
    ...CLIENT_NAMES.slice(1).map(([name, phone], i) => ({
      id: `cli_${i + 2}`,
      name,
      phone,
      email: `${slug(name)}@email.com`,
      password: "123456",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (95 - i * 9)).toISOString(),
    })),
  ];

  // Gerador determinístico para que a demonstração seja sempre parecida.
  let s = 7;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];

  const appointments: Appointment[] = [];
  const taken = new Map<string, [number, number][]>();
  const fits = (proId: string, date: string, start: number, dur: number) => {
    const key = `${proId}|${date}`;
    const list = taken.get(key) ?? [];
    if (list.some(([a, b]) => start < b && start + dur > a)) return false;
    list.push([start, start + dur]);
    taken.set(key, list);
    return true;
  };

  const svcById = Object.fromEntries(seedServices.map((x) => [x.id, x]));
  let n = 0;
  for (let offset = -45; offset <= 14; offset++) {
    const date = addDays(today, offset);
    const wd = weekday(date);
    if (wd === 0) continue;
    const perDay = offset === 0 ? 7 : offset > 0 ? Math.floor(rnd() * 4) + 1 : Math.floor(rnd() * 5) + 2;
    for (let k = 0; k < perDay * 3 && appointments.filter((a) => a.date === date).length < perDay; k++) {
      const pro = pick(seedProfessionals);
      const sch = pro.schedule[wd];
      if (!sch.enabled) continue;
      const svc = svcById[pick(pro.serviceIds)];
      const slots: number[] = [];
      for (let m = toMin(sch.start); m + svc.duration <= toMin(sch.end); m += 30) slots.push(m);
      const start = pick(slots);
      if (!fits(pro.id, date, start, svc.duration)) continue;
      const time = fromMin(start);
      const client = offset === 0 && n === 0 ? clients[1] : pick(clients);
      const past = isPast(date, time);
      let status: AppointmentStatus;
      if (past) status = rnd() < 0.1 ? "cancelado" : "concluido";
      else status = rnd() < 0.65 ? "confirmado" : "pendente";
      n++;
      appointments.push({
        id: `apt_${n}`,
        clientId: client.id,
        serviceId: svc.id,
        professionalId: pro.id,
        date,
        time,
        duration: svc.duration,
        price: svc.price,
        status,
        createdAt: new Date(Date.now() + offset * 86400000 - 86400000 * 3).toISOString(),
      });
    }
  }

  // Garante um próximo agendamento para a cliente demo.
  const hasUpcoming = appointments.some((a) => a.clientId === "cli_demo" && !isPast(a.date, a.time) && a.status !== "cancelado");
  if (!hasUpcoming) {
    for (let off = 2; off < 14; off++) {
      const date = addDays(today, off);
      const wd = weekday(date);
      const pro = seedProfessionals[0];
      if (!pro.schedule[wd].enabled) continue;
      let placed = false;
      for (let m = toMin("10:00"); m < toMin("16:00"); m += 30) {
        if (fits(pro.id, date, m, 60)) {
          appointments.push({ id: `apt_${++n}`, clientId: "cli_demo", serviceId: "srv_hidra", professionalId: pro.id, date, time: fromMin(m), duration: 60, price: 90, status: "confirmado", createdAt: new Date().toISOString() });
          placed = true;
          break;
        }
      }
      if (placed) break;
    }
  }

  return {
    version: DB_VERSION,
    services: seedServices,
    professionals: seedProfessionals,
    clients,
    appointments,
    blocks: [
      { id: "blk_1", professionalId: "pro_ana", date: addDays(today, 1), start: "12:00", end: "13:00", reason: "Almoço estendido" },
    ],
    businessHours: [day(false), day(true, "09:00", "19:00"), day(true, "09:00", "19:00"), day(true, "09:00", "19:00"), day(true, "09:00", "19:00"), day(true, "09:00", "19:00"), day(true, "09:00", "16:00")],
    settings: {
      salonName: "Espaço Delas",
      phone: "(11) 3456-7890",
      whatsapp: "(11) 98888-7777",
      email: "contato@espacodelas.com.br",
      address: "Rua das Flores, 123 — Jardim Primavera",
      city: "São Paulo — SP",
      instagram: "@espacodelas",
      facebook: "/espacodelas",
      slotInterval: 30,
      bookingWindowDays: 45,
      cancelPolicyHours: 4,
      autoConfirm: false,
    },
  };
}

export const ADMIN_CREDENTIALS = { email: "admin@espacodelas.com", password: "admin123" };
