"use client";

import { useRef, useState, type KeyboardEvent } from "react";

// A message box that grows as you type (up to a few lines), like the chat apps you already use.
// Enter sends; Shift+Enter starts a new line.
export default function Composer({
  onSend,
  onSendImage,
  disabled,
  placeholder = "Write a message…",
}: {
  onSend: (text: string) => void;
  /** Present only where images are allowed (lab team chats). */
  onSendImage?: (file: File, caption: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLTextAreaElement>(null);

  const grow = () => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  };

  const pick = (f?: File) => {
    setFileError(null);
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) return setFileError("Use a JPG, PNG or WebP image.");
    if (f.size > 5 * 1024 * 1024) return setFileError("Keep images under 5MB.");
    setFile(f);
  };

  const send = () => {
    const clean = text.trim();
    if (file && onSendImage) {
      if (disabled) return;
      onSendImage(file, clean);
      setFile(null);
      setText("");
      requestAnimationFrame(grow);
      return;
    }
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
      className="flex flex-wrap items-end gap-2 border-t border-ink bg-white p-3"
    >
      {file && (
        <div className="flex w-full items-center justify-between gap-3 rounded-md border border-ink bg-cream px-3 py-2 text-sm">
          <span className="min-w-0 truncate">Image: {file.name} <span className="text-muted">(a moderator checks it before your team sees it)</span></span>
          <button type="button" onClick={() => setFile(null)} className="shrink-0 underline underline-offset-4">Remove</button>
        </div>
      )}
      {fileError && <p role="alert" className="w-full text-sm text-rose">{fileError}</p>}
      {onSendImage && (
        <>
          <button type="button" onClick={() => picker.current?.click()} aria-label="Attach an image" disabled={disabled} className="btn-secondary btn-icon shrink-0 disabled:opacity-40">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m21 16-5-5-8 8" />
            </svg>
          </button>
          <input ref={picker} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose an image" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        </>
      )}
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
      <button type="submit" disabled={disabled || (!text.trim() && !file)} aria-label="Send" className="btn btn-icon shrink-0 disabled:opacity-40">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
