"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DONATE, formatMoney } from "@/lib/donate";
import { openContact } from "@/lib/contactBus";

const SEGMENTS = 8;
const TIERS = [
  { under: 10, name: "A spark" },
  { under: 25, name: "A circuit" },
  { under: 50, name: "A whole Lab" },
  { under: Infinity, name: "A launch" },
];

const tierFor = (amount: number) => TIERS.find((t) => amount < t.under)!.name;
const litFor = (amount: number) => {
  const top = DONATE.amounts[DONATE.amounts.length - 1];
  return Math.max(1, Math.min(SEGMENTS, Math.ceil((amount / top) * SEGMENTS)));
};

function PowerCell({ lit, reduce }: { lit: number; reduce: boolean | null }) {
  const segH = 17;
  const gap = 4;
  return (
    <svg viewBox="0 0 120 210" className="h-auto w-[104px] md:w-[124px]" role="img" aria-label={`${lit} of ${SEGMENTS} charge segments lit`}>
      <rect x="42" y="2" width="36" height="12" rx="3" fill="var(--ink)" />
      <rect x="6" y="14" width="108" height="192" rx="16" fill="none" stroke="var(--ink)" strokeWidth="3" />
      {Array.from({ length: SEGMENTS }).map((_, i) => {
        const on = i < lit;
        const y = 206 - 12 - (i + 1) * segH - i * gap;
        return (
          <motion.rect
            key={i}
            x="20"
            width="80"
            height={segH}
            rx="4"
            y={y}
            initial={false}
            animate={{
              fill: on ? (i > SEGMENTS - 3 ? "#f5e89e" : "#f3aac7") : "rgba(38,40,34,0.09)",
              scale: on ? 1 : 0.94,
            }}
            transition={{ duration: reduce ? 0 : 0.3, delay: reduce ? 0 : on ? i * 0.03 : 0 }}
            style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
          />
        );
      })}
      <path d="M66 62 L44 112 H62 L54 158 L80 100 H62 Z" fill="var(--ink)" stroke="var(--cream)" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke" />
    </svg>
  );
}

export default function Donate() {
  const reduce = useReducedMotion();
  const [amount, setAmount] = useState<number>(DONATE.defaultAmount);
  const [custom, setCustom] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const live = Boolean(DONATE.url);
  const lit = litFor(amount);

  const pick = (a: number) => {
    setAmount(a);
    setCustom("");
  };

  const onCustom = (v: string) => {
    const digits = v.replace(/[^\d]/g, "").slice(0, 5);
    setCustom(digits);
    const n = Number(digits);
    if (n >= 1) setAmount(Math.min(n, DONATE.maxAmount));
  };

  const copy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // Clipboard can be blocked (permissions, insecure context); the value
      // is still on screen to copy by hand.
    }
  };

  return (
    <section id="donate" className="relative overflow-hidden border-y border-ink bg-ink py-16 text-cream md:py-24">
      <img
        src="/assets/logo-long6.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 w-[520px] max-w-none opacity-[0.05] invert"
      />

      <div className="wrap relative grid gap-12 md:grid-cols-[1.05fr_1fr] md:items-center md:gap-20">
        <div>
          <p className="eyebrow text-pink">05 / Keep the lights on</p>
          <h2 className="mt-6 text-[40px] leading-[1.05] md:text-[62px]">
            Help the next teenager
            <br />
            <span className="font-serif font-normal italic text-yellow">build their first thing.</span>
          </h2>
          <p className="mt-6 max-w-[460px] text-lg text-cream/75">
            TeenovateX is youth-led and free for every teen who joins. Your gift helps keep it that way,
            and keeps the doors open for the ones who haven&rsquo;t found us yet.
          </p>

          <div className="mt-10 border-t border-cream/20 pt-6">
            <p className="text-sm text-cream/60">Not giving money? Give something else.</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {[
                { label: "Mentor a team", topic: "mentor" as const },
                { label: "Sponsor an event", topic: "sponsor" as const },
                { label: "Partner with us", topic: "partner" as const },
              ].map((o) => (
                <button
                  key={o.topic}
                  type="button"
                  onClick={() => openContact(o.topic)}
                  className="rounded-full border border-cream/40 px-4 py-1.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-yellow hover:text-yellow"
                >
                  {o.label} <span aria-hidden="true">↗︎</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative border border-cream bg-cream p-6 text-ink shadow-[8px_8px_0_var(--pink)] md:p-8">
          <div className="grid grid-cols-[auto_1fr] items-center gap-6 md:gap-8">
            <div className="flex flex-col items-center">
              <PowerCell lit={lit} reduce={reduce} />
              <div className="mt-3 h-6 overflow-hidden text-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={tierFor(amount)}
                    initial={reduce ? false : { y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={reduce ? undefined : { y: -14, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="font-serif text-lg italic leading-6 text-rose"
                  >
                    {tierFor(amount)}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div>
              <p className="eyebrow text-muted">Your gift</p>
              <p className="mt-1 text-[52px] font-semibold leading-none tracking-[-0.05em] tabular-nums md:text-[64px]">
                {formatMoney(amount)}
              </p>

              <div role="group" aria-label="Choose an amount" className="mt-5 flex flex-wrap gap-2">
                {DONATE.amounts.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => pick(a)}
                    aria-pressed={amount === a && custom === ""}
                    className={`rounded-md border border-ink px-3.5 py-2 text-sm font-semibold transition-all ${
                      amount === a && custom === ""
                        ? "-translate-y-0.5 bg-yellow shadow-[3px_3px_0_var(--ink)]"
                        : "hover:-translate-y-0.5 hover:bg-pink/50"
                    }`}
                  >
                    {formatMoney(a)}
                  </button>
                ))}
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span>Or your own:</span>
                <input
                  inputMode="numeric"
                  value={custom}
                  onChange={(e) => onCustom(e.target.value)}
                  placeholder="0"
                  aria-label="Custom amount"
                  className="w-24 rounded-md border border-ink bg-cream px-3 py-1.5 text-[15px] text-ink outline-none focus:ring-2 focus:ring-rose"
                />
              </label>
            </div>
          </div>

          {live ? (
            <a href={DONATE.url} target="_blank" rel="noopener noreferrer" className="btn mt-7 w-full">
              Give {formatMoney(amount)} <span>↗︎</span>
            </a>
          ) : (
            <div className="mt-7">
              <button type="button" onClick={() => openContact("donate")} className="btn w-full">
                Donations open soon. Tell us you&rsquo;re in <span>↗︎</span>
              </button>
              <p className="mt-2.5 text-center text-xs text-muted">
                We&rsquo;ll reach out the moment giving is live.
              </p>
            </div>
          )}

          {DONATE.bank && (
            <details className="mt-5 border-t border-line pt-4 text-sm">
              <summary className="cursor-pointer font-semibold">Prefer a bank transfer?</summary>
              <dl className="mt-3 space-y-2">
                {[
                  ["Bank", DONATE.bank.bank],
                  ["Account name", DONATE.bank.accountName],
                  ["Account number", DONATE.bank.accountNumber],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="flex items-center gap-2 font-medium">
                      {v}
                      <button
                        type="button"
                        onClick={() => copy(k, v)}
                        className="rounded border border-ink px-2 py-0.5 text-[11px] font-semibold hover:bg-yellow"
                      >
                        {copied === k ? "Copied" : "Copy"}
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
              {DONATE.bank.note && <p className="mt-3 text-xs text-muted">{DONATE.bank.note}</p>}
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
