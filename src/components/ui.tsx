import { clsx, type ClassValue } from "clsx";
import { forwardRef, useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Link, type LinkProps } from "react-router-dom";
import { ImageOff, Loader2, Scissors, X } from "lucide-react";
import type { AppointmentStatus } from "@/lib/types";
import { initials } from "@/lib/format";

export const cn = (...c: ClassValue[]) => clsx(c);

// ---------------- Botões ----------------
type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger" | "gold" | "white";
type Size = "sm" | "md" | "lg";
const variants: Record<Variant, string> = {
  primary: "bg-rose-500 text-white shadow-[0_8px_24px_-10px_rgb(183_110_121/0.9)] hover:bg-rose-600 active:bg-rose-700",
  secondary: "bg-rose-100 text-rose-700 hover:bg-rose-200",
  ghost: "text-ink-700 hover:bg-rose-50",
  outline: "border border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50",
  danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-100",
  gold: "bg-gradient-to-r from-gold-500 to-gold-400 text-white shadow-[0_8px_24px_-10px_rgb(193_154_75/0.9)] hover:brightness-105",
  white: "bg-white text-rose-700 hover:bg-nude-100 shadow-soft",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5 rounded-xl",
  md: "h-11 px-5 text-sm gap-2 rounded-2xl",
  lg: "h-14 px-7 text-[15px] gap-2.5 rounded-2xl tracking-wide",
};
const base = "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200 select-none";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", loading, icon, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
});

export function ButtonLink({ variant = "primary", size = "md", className, icon, children, ...rest }: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({ className, label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn("inline-flex size-10 items-center justify-center rounded-xl text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-4 focus-visible:ring-rose-200 focus-visible:outline-none", className)} {...rest}>
      {children}
    </button>
  );
}

// ---------------- Formulários ----------------
export function Field({ label, error, hint, children, className, required }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-ink-400">{hint}</span> : null}
    </label>
  );
}
const inputCls = "w-full rounded-2xl border border-nude-200 bg-white px-4 text-[15px] text-ink-900 placeholder:text-ink-400 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100 aria-[invalid=true]:border-red-300 aria-[invalid=true]:ring-red-50";
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; leading?: ReactNode; trailing?: ReactNode }>(function Input(
  { className, invalid, leading, trailing, ...rest },
  ref,
) {
  return (
    <div className="relative">
      {leading && <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-400">{leading}</span>}
      <input ref={ref} aria-invalid={invalid || undefined} className={cn(inputCls, "h-12", leading && "pl-11", trailing && "pr-12", className)} {...rest} />
      {trailing && <span className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</span>}
    </div>
  );
});
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, "h-12 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%239b8a8c%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_14px_center] bg-no-repeat pr-10", className)} {...rest}>
      {children}
    </select>
  );
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "min-h-24 py-3", className)} {...rest} />;
}
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50", checked ? "bg-rose-500" : "bg-nude-300")}>
      <span className={cn("inline-block size-5 rounded-full bg-white shadow transition", checked ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

// ---------------- Superfícies ----------------
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-3xl border border-nude-200/70 bg-white shadow-card", className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "rose", className }: { children: ReactNode; tone?: "rose" | "gold" | "green" | "gray" | "red" | "blue" | "amber"; className?: string }) {
  const tones = {
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    gold: "bg-[#fbf4e4] text-gold-600 ring-gold-300/50",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    gray: "bg-nude-100 text-ink-500 ring-nude-200",
    red: "bg-red-50 text-red-700 ring-red-100",
    blue: "bg-sky-50 text-sky-700 ring-sky-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ring-1", tones[tone], className)}>{children}</span>;
}

export const STATUS_META: Record<AppointmentStatus, { label: string; tone: "amber" | "green" | "blue" | "red"; dot: string }> = {
  pendente: { label: "Pendente", tone: "amber", dot: "bg-amber-400" },
  confirmado: { label: "Confirmado", tone: "green", dot: "bg-emerald-500" },
  concluido: { label: "Concluído", tone: "blue", dot: "bg-sky-500" },
  cancelado: { label: "Cancelado", tone: "red", dot: "bg-red-400" },
};
export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const m = STATUS_META[status];
  return (
    <Badge tone={m.tone}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </Badge>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return <span className={cn("rounded-md bg-gold-300/25 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-gold-600 uppercase", className)}>demonstrativo</span>;
}

// ---------------- Imagens ----------------
export function Photo({ src, alt, className, fallbackIcon }: { src?: string; alt: string; className?: string; fallbackIcon?: ReactNode }) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setFailed(!src);
    setLoaded(false);
  }, [src]);
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-rose-100 via-nude-100 to-gold-300/40", className)}>
      {!failed && (
        <img src={src} alt={alt} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover transition-opacity duration-700", loaded ? "opacity-100" : "opacity-0")} />
      )}
      {(failed || !loaded) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-rose-400/80">
          {failed ? fallbackIcon ?? <Scissors className="size-8" strokeWidth={1.25} /> : null}
          {failed && !fallbackIcon && <span className="font-serif text-sm italic">Espaço Delas</span>}
        </div>
      )}
    </div>
  );
}
export function Avatar({ src, name, className }: { src?: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => setFailed(!src), [src]);
  return (
    <div className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-rose-200 to-gold-300 font-bold text-white", className ?? "size-10 text-sm")}>
      {!failed ? <img src={src} alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} /> : <span>{initials(name)}</span>}
    </div>
  );
}
export { ImageOff };

// ---------------- Marca ----------------
export function Logo({ light, compact, className }: { light?: boolean; compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className={cn("relative flex size-10 items-center justify-center rounded-2xl", light ? "bg-white/15 ring-1 ring-white/30" : "bg-gradient-to-br from-rose-400 to-rose-600 shadow-soft")}>
        <span className="font-serif text-lg font-bold text-white italic">ED</span>
        <span className="absolute -top-1 -right-1 size-3 rounded-full bg-gradient-to-br from-gold-300 to-gold-500 ring-2 ring-white" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className={cn("block font-serif text-[22px] font-semibold tracking-wide", light ? "text-white" : "text-ink-900")}>Espaço Delas</span>
          <span className={cn("block text-[9px] font-bold tracking-[0.32em] uppercase", light ? "text-white/70" : "text-gold-500")}>Beleza & bem-estar</span>
        </span>
      )}
    </span>
  );
}

// ---------------- Modal ----------------
export function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" | "xl" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  const w = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative flex max-h-[92dvh] w-full animate-scale-in flex-col rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]", w)}>
        <div className="flex items-start justify-between gap-4 border-b border-nude-100 px-6 pt-6 pb-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          <IconButton label="Fechar" onClick={onClose} className="-mt-1 -mr-2">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="scrollbar-thin overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-nude-100 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmar", danger }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: ReactNode; confirmLabel?: string; danger?: boolean }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Voltar</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </>}>
      <div className="text-[15px] leading-relaxed text-ink-700">{message}</div>
    </Modal>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-400">{icon}</div>
      <p className="font-serif text-xl font-semibold text-ink-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, text, center, light }: { eyebrow: string; title: ReactNode; text?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <span className={cn("inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.3em] uppercase", light ? "text-gold-300" : "text-gold-500")}>
        <span className="h-px w-6 bg-current" /> {eyebrow} {center && <span className="h-px w-6 bg-current" />}
      </span>
      <h2 className={cn("mt-3 font-serif text-4xl leading-[1.05] font-semibold sm:text-5xl", light ? "text-white" : "text-ink-900")}>{title}</h2>
      {text && <p className={cn("mt-4 text-[15px] leading-relaxed sm:text-base", light ? "text-white/75" : "text-ink-500")}>{text}</p>}
    </div>
  );
}
