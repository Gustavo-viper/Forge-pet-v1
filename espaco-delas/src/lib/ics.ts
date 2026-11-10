import type { Appointment, Service, Professional, Settings } from "./types";
import { fromMin, toMin } from "./dates";

/** Gera e baixa um arquivo .ics para adicionar o agendamento à agenda do celular. */
export function downloadICS(a: Appointment, svc: Service | undefined, pro: Professional | undefined, s: Settings) {
  const d = a.date.replace(/-/g, "");
  const start = a.time.replace(":", "") + "00";
  const end = fromMin(toMin(a.time) + a.duration).replace(":", "") + "00";
  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Espaco Delas//Agendamento//PT",
    "BEGIN:VEVENT",
    `UID:${a.id}@espacodelas`,
    `DTSTART:${d}T${start}`, `DTEND:${d}T${end}`,
    `SUMMARY:${svc?.name ?? "Atendimento"} — ${s.salonName}`,
    `DESCRIPTION:Profissional: ${pro?.name ?? ""}`,
    `LOCATION:${s.address}, ${s.city}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `espaco-delas-${a.date}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
