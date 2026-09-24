"use client";

import { useEffect } from "react";
import Image from "next/image";
import type { Founder } from "./People";

export default function FounderModal({
  founder,
  onClose,
}: {
  founder: Founder;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="founder-modal-name"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl border border-ink bg-cream p-8 shadow-[6px_6px_0_var(--ink)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-ink text-sm hover:bg-pink"
        >
          ✕
        </button>

        <div
          className={`mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-ink ${
            founder.photo ? "" : `${founder.bg} ${founder.fg ?? ""}`
          }`}
        >
          {founder.photo ? (
            <Image
              src={founder.photo}
              alt={founder.name}
              width={160}
              height={160}
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 18%" }}
            />
          ) : (
            <span className="text-2xl font-medium">{founder.initials}</span>
          )}
        </div>

        <h3 id="founder-modal-name" className="mt-5 text-center text-2xl tracking-tight">
          {founder.name}
        </h3>
        <p className="mt-1 text-center text-sm text-muted">{founder.role}</p>

        <p className="mt-5 text-center text-[15px] leading-relaxed text-muted">
          &ldquo;{founder.bio}&rdquo;
        </p>

        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 text-left text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose">Speciality</p>
            <p className="mt-1 text-muted">{founder.speciality}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose">Contribution</p>
            <p className="mt-1 text-muted">{founder.contribution}</p>
          </div>
        </div>

        {founder.href && (
          <a
            href={founder.href}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-6 w-full !gap-3 text-sm"
          >
            Connect on LinkedIn <span>↗︎</span>
          </a>
        )}
      </div>
    </div>
  );
}
