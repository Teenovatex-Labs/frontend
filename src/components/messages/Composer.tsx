"use client";

import { useRef, useState, type KeyboardEvent } from "react";

// A message box that grows as you type (up to a few lines), like the chat apps you already use.
// Enter sends; Shift+Enter starts a new line.
export default function Composer({ onSend, disabled, placeholder = "Write a message…" }: { onSend: (text: string) => void; disabled?: boolean; placeholder?: string }) {
  const [text, setText] = useState("");
  const box = useRef<HTMLTextAreaElement>(null);

  const grow = () => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  const send = () => {
    const clean = text.trim();
    if (!clean || disabled) return;
    onSend(clean);
    setText("");
    requestAnimationFrame(grow);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
      className="flex items-end gap-2 border-t border-ink bg-white p-3"
    >
      <textarea
        ref={box}
        value={text}
        rows={1}
        maxLength={2000}
        onChange={(e) => {
          setText(e.target.value);
          grow();
        }}
        onKeyDown={onKey}
        placeholder={placeholder}
        aria-label="Message"
        className="max-h-[132px] min-h-[44px] flex-1 resize-none rounded-md border border-ink bg-cream px-4 py-2.5 text-[15px] leading-snug outline-none focus:ring-2 focus:ring-rose"
      />
      <button type="submit" disabled={disabled || !text.trim()} aria-label="Send" className="btn btn-icon shrink-0 disabled:opacity-40">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
