"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAlfred } from "@/context/AlfredContext";

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
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
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

  // Just a pill to type in. Alfred's latest answer floats above it as a small bubble; there is no
  // header, history panel or suggestion chips.
  const last = messages[messages.length - 1];
  const reply = last?.from === "alfred" ? last : undefined;
  const live = reply ? Date.now() - reply.at < 1500 : false;

  return (
    <section aria-label="Chat with Alfred" className="flex w-full flex-col items-stretch gap-2">
      <div ref={log} role="log" aria-live="polite" className="contents">
        {(busy || reply) && (
          <div className="max-w-[92%] self-start">
            <p className="max-h-[120px] overflow-y-auto whitespace-pre-line break-words rounded-2xl border border-ink bg-white px-3 py-2 text-[13px] leading-snug shadow-[2px_2px_0_var(--ink)]">
              {busy ? <span aria-label="Alfred is working on it">…</span> : live ? <Typewriter text={reply!.text} /> : reply!.text}
            </p>
            {!busy && reply?.undoId && (
              <button type="button" onClick={() => void undo(reply.undoId!)} className="mt-1 text-[11px] text-rose underline underline-offset-4">
                Undo
              </button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-1.5 rounded-full border border-ink bg-white py-1 pl-4 pr-1 shadow-[2px_2px_0_var(--ink)] focus-within:ring-2 focus-within:ring-rose">
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
          className="max-h-20 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[13px] leading-snug outline-none"
        />
        <button
          type="button"
          onClick={closeChat}
          aria-label="Close chat"
          title="Close"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg leading-none text-ink/60 transition-colors hover:bg-cream hover:text-ink"
        >
          ×
        </button>
        <button
          type="submit"
          disabled={busy || !text.trim()}
          aria-label="Send"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-cream transition-opacity disabled:opacity-30"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </section>
  );
}
