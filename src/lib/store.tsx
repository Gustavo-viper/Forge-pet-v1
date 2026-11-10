import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Appointment, AppointmentStatus, Block, Client, DB, Professional, Service, Session, Settings, WorkDay } from "./types";
import { ADMIN_CREDENTIALS, buildSeed, DB_VERSION } from "./seed";
import { isSlotFree } from "./availability";
import { uid } from "./format";
import { formatDateShort } from "./dates";

const DB_KEY = "espaco-delas:db";
const SESSION_KEY = "espaco-delas:session";

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    /* dados corrompidos: recria a base demonstrativa */
  }
  return buildSeed();
}
function loadSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as Session;
  } catch {
    /* ignore */
  }
  return { clientId: null, admin: false };
}

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const fail = (error: string): Result<never> => ({ ok: false, error });

const stamp = (a: Appointment, text: string): Appointment => ({
  ...a,
  history: [...(a.history ?? []), { at: new Date().toISOString(), text }],
});

function useStoreValue() {
  const [db, setDb] = useState<DB>(loadDB);
  const [session, setSession] = useState<Session>(loadSession);

  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }, [db]);
  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, [session]);

  // Sincroniza entre abas (ex.: cliente em uma aba, admin em outra).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_KEY && e.newValue) setDb(JSON.parse(e.newValue));
      if (e.key === SESSION_KEY && e.newValue) setSession(JSON.parse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const currentClient = useMemo(
    () => db.clients.find((c) => c.id === session.clientId) ?? null,
    [db.clients, session.clientId],
  );

  // ---------- Autenticação simulada ----------
  const login = useCallback(
    (email: string, password: string): Result<Client> => {
      const c = db.clients.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
      if (!c || c.password !== password) return fail("E-mail ou senha incorretos.");
      setSession((s) => ({ ...s, clientId: c.id }));
      return ok(c);
    },
    [db.clients],
  );

  const register = useCallback(
    (input: Pick<Client, "name" | "phone" | "email" | "password">): Result<Client> => {
      if (db.clients.some((x) => x.email.toLowerCase() === input.email.trim().toLowerCase()))
        return fail("Já existe uma conta com este e-mail.");
      const c: Client = { ...input, email: input.email.trim().toLowerCase(), id: uid("cli"), createdAt: new Date().toISOString() };
      setDb((d) => ({ ...d, clients: [...d.clients, c] }));
      setSession((s) => ({ ...s, clientId: c.id }));
      return ok(c);
    },
    [db.clients],
  );

  const logout = useCallback(() => setSession((s) => ({ ...s, clientId: null })), []);

  const adminLogin = useCallback((email: string, password: string): Result => {
    if (email.trim().toLowerCase() !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password)
      return fail("Credenciais administrativas inválidas.");
    setSession((s) => ({ ...s, admin: true }));
    return ok(undefined);
  }, []);
  const adminLogout = useCallback(() => setSession((s) => ({ ...s, admin: false })), []);

  // ---------- Clientes ----------
  const updateClient = useCallback(
    (id: string, patch: Partial<Omit<Client, "id" | "createdAt">>): Result => {
      if (patch.email && db.clients.some((x) => x.id !== id && x.email.toLowerCase() === patch.email!.toLowerCase()))
        return fail("Este e-mail já está em uso por outra conta.");
      setDb((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
      return ok(undefined);
    },
    [db.clients],
  );
  const addClient = useCallback(
    (input: Pick<Client, "name" | "phone" | "email">): Result<Client> => {
      if (db.clients.some((x) => x.email.toLowerCase() === input.email.toLowerCase())) return fail("E-mail já cadastrado.");
      const c: Client = { ...input, password: "123456", id: uid("cli"), createdAt: new Date().toISOString() };
      setDb((d) => ({ ...d, clients: [...d.clients, c] }));
      return ok(c);
    },
    [db.clients],
  );
  const deleteClient = useCallback((id: string) => {
    setDb((d) => ({
      ...d,
      clients: d.clients.filter((c) => c.id !== id),
      appointments: d.appointments.filter((a) => a.clientId !== id),
    }));
    setSession((s) => (s.clientId === id ? { ...s, clientId: null } : s));
  }, []);

  // ---------- Agendamentos ----------
  const createAppointment = useCallback(
    (input: { clientId: string; serviceId: string; professionalId: string; date: string; time: string; status?: AppointmentStatus }): Result<Appointment> => {
      const svc = db.services.find((s) => s.id === input.serviceId);
      if (!svc) return fail("Serviço não encontrado.");
      // Regra: não permite reserva duplicada no mesmo horário para o mesmo profissional.
      if (!isSlotFree(db, input)) return fail("Este horário acabou de ficar indisponível. Escolha outro horário.");
      const a: Appointment = {
        id: uid("apt"),
        clientId: input.clientId,
        serviceId: svc.id,
        professionalId: input.professionalId,
        date: input.date,
        time: input.time,
        duration: svc.duration,
        price: svc.price,
        status: input.status ?? (db.settings.autoConfirm ? "confirmado" : "pendente"),
        createdAt: new Date().toISOString(),
        history: [{ at: new Date().toISOString(), text: "Agendamento criado" }],
      };
      setDb((d) => ({ ...d, appointments: [...d.appointments, a] }));
      return ok(a);
    },
    [db],
  );

  const setAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    const labels: Record<AppointmentStatus, string> = { pendente: "Marcado como pendente", confirmado: "Agendamento confirmado", concluido: "Atendimento concluído", cancelado: "Agendamento cancelado" };
    setDb((d) => ({
      ...d,
      appointments: d.appointments.map((a) => (a.id === id ? stamp({ ...a, status, changeRequest: status === "cancelado" ? undefined : a.changeRequest }, labels[status]) : a)),
    }));
  }, []);

  const rescheduleAppointment = useCallback(
    (id: string, next: { date: string; time: string; professionalId: string }): Result => {
      const a = db.appointments.find((x) => x.id === id);
      if (!a) return fail("Agendamento não encontrado.");
      if (!isSlotFree(db, { ...next, serviceId: a.serviceId, excludeAppointmentId: id, durationOverride: a.duration }))
        return fail("Horário indisponível para este profissional.");
      setDb((d) => ({
        ...d,
        appointments: d.appointments.map((x) =>
          x.id === id
            ? stamp({ ...x, ...next, changeRequest: undefined, status: x.status === "cancelado" ? "confirmado" : x.status }, `Reagendado de ${formatDateShort(x.date)} ${x.time} para ${formatDateShort(next.date)} ${next.time}`)
            : x,
        ),
      }));
      return ok(undefined);
    },
    [db],
  );

  const requestChange = useCallback((id: string, note: string) => {
    setDb((d) => ({
      ...d,
      appointments: d.appointments.map((a) => (a.id === id ? stamp({ ...a, changeRequest: { note, requestedAt: new Date().toISOString() } }, "Cliente solicitou alteração de horário") : a)),
    }));
  }, []);
  const dismissChangeRequest = useCallback((id: string) => {
    setDb((d) => ({ ...d, appointments: d.appointments.map((a) => (a.id === id ? stamp({ ...a, changeRequest: undefined }, "Solicitação de alteração recusada") : a)) }));
  }, []);

  // ---------- Serviços ----------
  const saveService = useCallback((svc: Omit<Service, "id"> & { id?: string }) => {
    setDb((d) => {
      if (svc.id && d.services.some((s) => s.id === svc.id))
        return { ...d, services: d.services.map((s) => (s.id === svc.id ? ({ ...s, ...svc } as Service) : s)) };
      return { ...d, services: [...d.services, { ...svc, id: uid("srv") } as Service] };
    });
  }, []);
  const deleteService = useCallback((id: string) => {
    setDb((d) => ({
      ...d,
      services: d.services.filter((s) => s.id !== id),
      professionals: d.professionals.map((p) => ({ ...p, serviceIds: p.serviceIds.filter((x) => x !== id) })),
    }));
  }, []);

  // ---------- Profissionais ----------
  const saveProfessional = useCallback((pro: Omit<Professional, "id"> & { id?: string }) => {
    setDb((d) => {
      if (pro.id && d.professionals.some((p) => p.id === pro.id))
        return { ...d, professionals: d.professionals.map((p) => (p.id === pro.id ? ({ ...p, ...pro } as Professional) : p)) };
      return { ...d, professionals: [...d.professionals, { ...pro, id: uid("pro") } as Professional] };
    });
  }, []);
  const deleteProfessional = useCallback((id: string) => {
    setDb((d) => ({
      ...d,
      professionals: d.professionals.filter((p) => p.id !== id),
      blocks: d.blocks.filter((b) => b.professionalId !== id),
    }));
  }, []);

  // ---------- Bloqueios, horários e configurações ----------
  const addBlock = useCallback((b: Omit<Block, "id">) => setDb((d) => ({ ...d, blocks: [...d.blocks, { ...b, id: uid("blk") }] })), []);
  const removeBlock = useCallback((id: string) => setDb((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) })), []);
  const setBusinessHours = useCallback((h: WorkDay[]) => setDb((d) => ({ ...d, businessHours: h })), []);
  const saveSettings = useCallback((s: Settings) => setDb((d) => ({ ...d, settings: s })), []);
  const resetDemo = useCallback(() => {
    setDb(buildSeed());
    setSession({ clientId: null, admin: true });
  }, []);

  return {
    db, session, currentClient,
    login, register, logout, adminLogin, adminLogout,
    updateClient, addClient, deleteClient,
    createAppointment, setAppointmentStatus, rescheduleAppointment, requestChange, dismissChangeRequest,
    saveService, deleteService, saveProfessional, deleteProfessional,
    addBlock, removeBlock, setBusinessHours, saveSettings, resetDemo,
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}

/** Atalhos de leitura frequentes. */
export function useLookups() {
  const { db } = useStore();
  return useMemo(() => {
    const service = Object.fromEntries(db.services.map((s) => [s.id, s]));
    const pro = Object.fromEntries(db.professionals.map((p) => [p.id, p]));
    const client = Object.fromEntries(db.clients.map((c) => [c.id, c]));
    return { service, pro, client } as { service: Record<string, Service | undefined>; pro: Record<string, Professional | undefined>; client: Record<string, Client | undefined> };
  }, [db]);
}
