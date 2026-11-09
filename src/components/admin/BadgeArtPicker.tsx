"use client";

import { useEffect, useRef, useState } from "react";
import { BADGE_ART_ACCEPT, badgeArtProblem } from "@/lib/badgeArt";

/** Choose the finished badge design (PNG or SVG). Nothing is generated: this exact file becomes the badge. */
export default function BadgeArtPicker({ current, file, onFile }: { current: string | null; file: File | null; onFile: (f: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview ?? current;
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-ink bg-cream">
        {shown ? <img src={shown} alt="Badge artwork preview" className="h-16 w-16 object-contain" /> : <span className="px-2 text-center text-[11px] text-muted">No artwork</span>}
      </div>
      <div className="min-w-0 text-sm">
        <button type="button" className="btn-secondary text-xs" onClick={() => input.current?.click()}>{shown ? "Replace artwork" : "Upload artwork"}</button>
        <p className="mt-1 text-xs text-muted">Your finished design as a PNG (under 1 MB) or SVG (under 200 KB). Used as is, everywhere the badge appears.</p>
        {file && <p className="mt-1 truncate text-xs">{file.name}</p>}
        {problem && <p role="alert" className="mt-1 text-xs text-rose">{problem}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept={BADGE_ART_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          e.target.value = "";
          if (!f) return;
          const p = badgeArtProblem(f);
          setProblem(p);
          if (!p) onFile(f);
        }}
      />
    </div>
  );
}
