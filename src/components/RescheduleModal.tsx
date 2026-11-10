import { useMemo, useState } from "react";
import type { Appointment } from "@/lib/types";
import { useLookups, useStore } from "@/lib/store";
import { getSlots } from "@/lib/availability";
import { addDays, formatDateLong, todayISO } from "@/lib/dates";
import { Calendar } from "./Calendar";
import { SlotPicker } from "./SlotPicker";
import { Avatar, Button, Field, Modal, Select, cn } from "./ui";
import { useToast } from "./toast";

/** Reagendamento real (usado no painel administrativo): valida conflito e atualiza a agenda. */
export function RescheduleModal({ appointment, onClose }: { appointment: Appointment | null; onClose: () => void }) {
  if (!appointment) return null;
  return <Inner key={appointment.id} a={appointment} onClose={onClose} />;
}

function Inner({ a, onClose }: { a: Appointment; onClose: () => void }) {
  const { db, rescheduleAppointment } = useStore();
  const { service, client } = useLookups();
  const toast = useToast();
  const [proId, setProId] = useState(a.professionalId);
  const [date, setDate] = useState<string | null>(a.date >= todayISO() ? a.date : null);
  const [time, setTime] = useState<string | null>(null);
  const pros = db.professionals.filter((p) => p.active && p.serviceIds.includes(a.serviceId));
  const max = addDays(todayISO(), db.settings.bookingWindowDays);
  const slots = useMemo(() => (date ? getSlots(db, { serviceId: a.serviceId, professionalId: proId, date, excludeAppointmentId: a.id, durationOverride: a.duration }) : []), [db, a, proId, date]);

  const save = () => {
    if (!date || !time) return;
    const r = rescheduleAppointment(a.id, { date, time, professionalId: proId });
    if (!r.ok) return toast(r.error, "error");
    toast("Atendimento reagendado e agenda atualizada.");
    onClose();
  };

  return (
    <Modal open onClose={onClose} size="xl" title="Reagendar atendimento" subtitle={`${service[a.serviceId]?.name ?? "Serviço"} · ${client[a.clientId]?.name ?? "Cliente"}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={!date || !time}>Salvar novo horário</Button></>}>
      {a.changeRequest && (
        <div className="mb-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Pedido da cliente:</strong> “{a.changeRequest.note}”
        </div>
      )}
      <Field label="Profissional" className="mb-5">
        <Select value={proId} onChange={(e) => { setProId(e.target.value); setTime(null); }}>
          {pros.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}
        </Select>
      </Field>
      <div className="grid gap-8 lg:grid-cols-2">
        <Calendar value={date} maxDate={max} onChange={(d) => { setDate(d); setTime(null); }}
          isAvailable={(d) => getSlots(db, { serviceId: a.serviceId, professionalId: proId, date: d, excludeAppointmentId: a.id, durationOverride: a.duration }).some((s) => s.available)} />
        <div>
          {date ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                <Avatar src={db.professionals.find((p) => p.id === proId)?.photo} name={db.professionals.find((p) => p.id === proId)?.name ?? ""} />
                <p className="text-sm font-semibold capitalize text-ink-700">{formatDateLong(date)}</p>
              </div>
              <SlotPicker slots={slots} value={time} onChange={setTime} />
            </>
          ) : (
            <p className={cn("rounded-2xl bg-nude-100 p-6 text-center text-sm text-ink-500")}>Selecione uma data no calendário.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
