import type { DB } from "./types";
import { addDays, fromMin, isPast, toMin, todayISO, weekday } from "./dates";

export interface Slot {
  time: string;
  available: boolean;
  reason?: "ocupado" | "bloqueado" | "passado";
}

interface Query {
  serviceId: string;
  professionalId: string;
  date: string;
  excludeAppointmentId?: string;
  durationOverride?: number;
}

/** Janela de trabalho efetiva = interseção entre horário do salão e do profissional. */
export function workingWindow(db: DB, professionalId: string, date: string): [number, number] | null {
  const wd = weekday(date);
  const biz = db.businessHours[wd];
  const pro = db.professionals.find((p) => p.id === professionalId);
  if (!pro || !pro.active || !biz?.enabled) return null;
  const ps = pro.schedule[wd];
  if (!ps?.enabled) return null;
  const start = Math.max(toMin(biz.start), toMin(ps.start));
  const end = Math.min(toMin(biz.end), toMin(ps.end));
  return end > start ? [start, end] : null;
}

/** Intervalos ocupados (agendamentos ativos + bloqueios) do profissional na data. */
export function busyIntervals(db: DB, professionalId: string, date: string, excludeAppointmentId?: string) {
  const out: { start: number; end: number; kind: "ocupado" | "bloqueado" }[] = [];
  for (const a of db.appointments) {
    if (a.id === excludeAppointmentId || a.status === "cancelado") continue;
    if (a.professionalId !== professionalId || a.date !== date) continue;
    out.push({ start: toMin(a.time), end: toMin(a.time) + a.duration, kind: "ocupado" });
  }
  for (const b of db.blocks) {
    if (b.date !== date) continue;
    if (b.professionalId !== "all" && b.professionalId !== professionalId) continue;
    out.push({ start: toMin(b.start), end: toMin(b.end), kind: "bloqueado" });
  }
  return out;
}

export function getSlots(db: DB, q: Query): Slot[] {
  const svc = db.services.find((s) => s.id === q.serviceId);
  if (!svc) return [];
  const duration = q.durationOverride ?? svc.duration;
  if (q.date < todayISO() || q.date > addDays(todayISO(), db.settings.bookingWindowDays)) return [];
  const win = workingWindow(db, q.professionalId, q.date);
  if (!win) return [];
  const busy = busyIntervals(db, q.professionalId, q.date, q.excludeAppointmentId);
  const step = db.settings.slotInterval || 30;
  const slots: Slot[] = [];
  for (let m = win[0]; m + duration <= win[1]; m += step) {
    const time = fromMin(m);
    const hit = busy.find((b) => m < b.end && m + duration > b.start);
    if (isPast(q.date, time)) slots.push({ time, available: false, reason: "passado" });
    else if (hit) slots.push({ time, available: false, reason: hit.kind });
    else slots.push({ time, available: true });
  }
  return slots;
}

export function isSlotFree(db: DB, q: Query & { time: string }): boolean {
  return getSlots(db, q).some((s) => s.time === q.time && s.available);
}

export function dateHasAvailability(db: DB, serviceId: string, professionalId: string, date: string) {
  return getSlots(db, { serviceId, professionalId, date }).some((s) => s.available);
}
