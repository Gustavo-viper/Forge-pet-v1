import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "./ui";

type Tone = "success" | "error" | "info";
interface Toast { id: number; tone: Tone; text: string }
const Ctx = createContext<(text: string, tone?: Tone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setItems((x) => [...x, { id, tone, text }]);
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800);
  }, []);
  const icon = { success: CheckCircle2, error: XCircle, info: Info };
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-auto sm:right-6 sm:bottom-6 sm:left-auto sm:items-end">
        {items.map((t) => {
          const I = icon[t.tone];
          return (
            <div key={t.id} role="status" className={cn("pointer-events-auto flex max-w-sm animate-fade-up items-start gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium shadow-soft",
              t.tone === "success" && "border-emerald-100", t.tone === "error" && "border-red-100", t.tone === "info" && "border-rose-100")}>
              <I className={cn("mt-0.5 size-5 shrink-0", t.tone === "success" && "text-emerald-500", t.tone === "error" && "text-red-500", t.tone === "info" && "text-rose-500")} />
              <span className="text-ink-700">{t.text}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
export const useToast = () => useContext(Ctx);
