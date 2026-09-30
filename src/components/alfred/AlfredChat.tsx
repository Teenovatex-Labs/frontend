"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAlfred } from "@/context/AlfredContext";
import { SUGGESTIONS } from "@/lib/alfred-commands";

function Typewriter({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return;
    }
    const id = window.setInterval(() => setShown((n) => (n >= text.length ? n : n + 2)), 22);
    return () => window.clearInterval(id);
  }, [text]);
  return <>{text.slice(0, shown)}</>;
}

// The little box under Alfred where you type to him. The composer grows as you write, like a chat app.
export default function AlfredChat() {
  const { messages, busy, send, closeChat, undo } = useAlfred();
  const [text, setText] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);
  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const grow = () => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const submit = (value: string) => {
    const clean = value.trim();
    if (!clean || busy) return;
    setText("");
    requestAnimationFrame(grow);
    void send(clean);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(text);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit(text);
    } else if (e.key === "Escape") {
      closeChat();
    }
  };

  return (
    <section
      aria-label="Chat with Alfred"
      className="flex w-full flex-col border border-ink bg-cream shadow-[4px_4px_0_var(--ink)]"
    >
      <header className="flex items-center justify-between border-b border-ink bg-yellow px-3 py-1.5">
        <span className="text-xs font-semibold">Alfred</span>
        <button type="button" onClick={closeChat} aria-label="Close chat" className="-mr-1 px-1.5 text-lg leading-none text-ink/70 hover:text-ink">
          ×
        </button>
      </header>

      <div ref={log} className="max-h-[min(220px,28vh)] min-h-[64px] space-y-2 overflow-y-auto px-3 py-3" role="log" aria-live="polite">
        {messages.map((m, i) => {
          // Alfred's newest message types itself out, like a person texting. Older ones just show.
          const live = m.from === "alfred" && i === messages.length - 1 && Date.now() - m.at < 1500;
          return (
            <div key={m.id} className={`max-w-[92%] ${m.from === "you" ? "ml-auto" : ""}`}>
              <p
                className={`whitespace-pre-line break-words rounded-xl px-3 py-2 text-[13px] leading-snug ${
                  m.from === "you" ? "bg-ink text-cream" : "border border-line bg-white"
                }`}
              >
                {live ? <Typewriter text={m.text} /> : m.text}
              </p>
              {m.undoId && (
                <button type="button" onClick={() => void undo(m.undoId!)} className="mt-1 text-[11px] text-rose underline underline-offset-4">
                  Undo
                </button>
              )}
            </div>
          );
        })}
        {busy && (
          <p className="w-fit rounded-xl border border-line bg-white px-3 py-2 text-[13px] text-muted" aria-label="Alfred is working on it">
            …
          </p>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 px-3 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="rounded-full border border-ink px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-yellow"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-ink p-2">
        <textarea
          ref={input}
          value={text}
          rows={1}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onKeyDown={onKey}
          placeholder="Tell me what to do…"
          aria-label="Message Alfred"
          className="max-h-24 min-h-[36px] flex-1 resize-none rounded-md border border-ink bg-white px-3 py-2 text-[13px] leading-snug outline-none focus:ring-2 focus:ring-rose"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          aria-label="Send"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-ink bg-pink text-ink transition-opacity disabled:opacity-40"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </section>
  );
}
