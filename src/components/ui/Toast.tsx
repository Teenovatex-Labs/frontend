"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type Tone = "info" | "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

type ToastApi = { show: (message: string, tone?: Tone) => void; success: (m: string) => void; error: (m: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

const TONES: Record<Tone, string> = {
  info: "bg-cream",
  success: "bg-yellow",
  error: "bg-pink",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const show = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3800);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({ show, success: (m) => show(m, "success"), error: (m) => show(m, "error") }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              role={t.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex max-w-[380px] items-start gap-3 border border-ink px-4 py-3 text-sm font-medium shadow-[4px_4px_0_var(--ink)] ${TONES[t.tone]}`}
            >
              <span className="flex-1">{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-mr-1 text-ink/75 hover:text-ink">
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
