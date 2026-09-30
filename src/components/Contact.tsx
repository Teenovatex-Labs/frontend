"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import FormField from "./FormField";
import TextAreaField from "./TextAreaField";
import { ApiError, contactApi } from "@/lib/api";
import { CONTACT_TOPIC_EVENT } from "@/lib/contactBus";
import { contactFormSchema, fieldErrors, type ContactTopic } from "@/lib/validation";

const TOPICS: { id: ContactTopic; label: string }[] = [
  { id: "hello", label: "Say hello" },
  { id: "partner", label: "Partner" },
  { id: "sponsor", label: "Sponsor" },
  { id: "mentor", label: "Mentor" },
  { id: "donate", label: "Donate" },
  { id: "press", label: "Press" },
  { id: "other", label: "Something else" },
];

const PHRASES = ["a question", "an idea", "a partnership", "a wild what-if"];
const MAX = 2000;

function PaperPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M4 30 L60 6 L46 58 L32 40 Z" fill="var(--cream)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 40 L60 6 L22 34 Z" fill="var(--pink)" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M32 40 L34 54 L40 46" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

export default function Contact() {
  const reduce = useReducedMotion();
  const [phrase, setPhrase] = useState(0);
  const [topic, setTopic] = useState<ContactTopic>("hello");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (reduce) return;
    const t = window.setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 2600);
    return () => window.clearInterval(t);
  }, [reduce]);

  useEffect(() => {
    const onTopic = (e: Event) => {
      setTopic((e as CustomEvent<ContactTopic>).detail);
      setStatus("idle");
    };
    window.addEventListener(CONTACT_TOPIC_EVENT, onTopic);
    return () => window.removeEventListener(CONTACT_TOPIC_EVENT, onTopic);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setServerError(null);

    const parsed = contactFormSchema.safeParse({ name, email, topic, message });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed));
      return;
    }
    setErrors({});
    setStatus("sending");
    try {
      await contactApi.send({ ...parsed.data, website });
      setStatus("sent");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Couldn't reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  };

  const reset = () => {
    setName("");
    setEmail("");
    setMessage("");
    setTopic("hello");
    setStatus("idle");
  };

  return (
    <section id="contact" className="relative overflow-hidden border-b border-line py-16 md:py-24">
      <div className="wrap grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
        <div>
          <p className="eyebrow text-rose">06 / Say hello</p>
          <h2 className="mt-6 text-[40px] leading-[1.08] md:text-[60px]">
            Got
            <span className="mt-1 grid">
              {PHRASES.map((p, i) => (
                <span
                  key={p}
                  aria-hidden={i !== phrase}
                  style={{ gridArea: "1 / 1" }}
                  className={`font-serif font-normal italic transition-all duration-500 ${
                    i === phrase ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  }`}
                >
                  <span className="highlight">{p}</span>?
                </span>
              ))}
            </span>
          </h2>
          <p className="sr-only">Got a question, an idea, a partnership or a wild what-if?</p>

          <p className="mt-6 max-w-[420px] text-lg text-muted">
            Ask us anything, pitch us something, or just tell us what you&rsquo;re building. A real person
            on the team reads every message.
          </p>

          <ul className="mt-10 space-y-4 border-t border-line pt-6 text-[15px]">
            <li className="grid grid-cols-[110px_1fr] gap-3">
              <span className="eyebrow text-muted">Reply time</span>
              <span>Usually within a few days.</span>
            </li>
            <li className="grid grid-cols-[110px_1fr] gap-3">
              <span className="eyebrow text-muted">Prefer email</span>
              <a href="mailto:hello@teenovatex.com" className="font-semibold underline underline-offset-4 hover:text-rose">
                hello@teenovatex.com
              </a>
            </li>
            <li className="grid grid-cols-[110px_1fr] gap-3">
              <span className="eyebrow text-muted">Elsewhere</span>
              <span className="text-muted">Find us on Instagram, X and LinkedIn in the footer.</span>
            </li>
          </ul>
        </div>

        <div className="relative md:-rotate-[0.6deg]">
          <div className="relative overflow-hidden border border-ink bg-white shadow-[8px_8px_0_var(--pink)]">
            <div className="airmail h-3 border-b border-ink" aria-hidden="true" />

            <div className="relative min-h-[520px] p-6 md:p-9">
              <div
                aria-hidden="true"
                className="absolute right-6 top-6 hidden h-[74px] w-[62px] rotate-3 flex-col items-center justify-center border-2 border-dashed border-rose/70 md:flex"
              >
                <img src="/assets/logo-burgundy.svg" alt="" className="w-9" />
                <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.14em] text-rose">Post</span>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                {status !== "sent" ? (
                  <motion.form
                    key="form"
                    onSubmit={onSubmit}
                    noValidate
                    initial={false}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24, rotate: -1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-9"
                  >
                    <fieldset>
                      <legend className="eyebrow mb-3 text-muted">What&rsquo;s it about?</legend>
                      <div className="flex flex-wrap gap-2 md:max-w-[78%]">
                        {TOPICS.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTopic(t.id)}
                            aria-pressed={topic === t.id}
                            className={`rounded-full border border-ink px-3.5 py-1.5 text-sm font-semibold transition-all ${
                              topic === t.id
                                ? "bg-ink text-cream shadow-[3px_3px_0_var(--pink)]"
                                : "hover:-translate-y-0.5 hover:bg-yellow"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </fieldset>

                    <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2">
                      <FormField
                        label="Your name"
                        name="name"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                      />
                      <FormField
                        label="Your email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                      />
                    </div>

                    <TextAreaField
                      label="Your message"
                      name="message"
                      rows={6}
                      maxLength={MAX}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      error={errors.message}
                    />

                    <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                      <label>
                        Leave this empty
                        <input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} />
                      </label>
                    </div>

                    <div aria-live="polite">
                      {serverError && (
                        <p className="rounded-md border border-rose bg-rose/[0.08] px-4 py-2.5 text-sm text-rose">{serverError}</p>
                      )}
                    </div>

                    <button type="submit" disabled={status === "sending"} className="btn self-start disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none">
                      {status === "sending" ? "Sending..." : "Send it"} <span>↗︎</span>
                    </button>
                  </motion.form>
                ) : (
                  <motion.div
                    key="sent"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: reduce ? 0 : 0.5 }}
                    role="status"
                    className="flex min-h-[430px] flex-col items-start justify-center"
                  >
                    <div className="relative mb-6 h-28 w-full">
                      <svg viewBox="0 0 400 110" className="absolute inset-0 h-full w-full" aria-hidden="true">
                        <motion.path
                          d="M10 96 C 90 96, 110 20, 190 44 S 300 96, 392 14"
                          fill="none"
                          stroke="var(--pink)"
                          strokeWidth="3"
                          strokeDasharray="2 9"
                          strokeLinecap="round"
                          initial={reduce ? false : { pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1.1, ease: "easeInOut" }}
                        />
                      </svg>
                      <motion.div
                        className="absolute left-0 top-0 w-14"
                        initial={reduce ? false : { x: 0, y: 66, rotate: -8 }}
                        animate={{ x: [0, 90, 180, 300], y: [66, 8, 34, -6], rotate: [-8, -22, 4, -18] }}
                        transition={{ duration: 1.1, ease: "easeInOut" }}
                      >
                        <PaperPlane className="h-auto w-full" />
                      </motion.div>
                    </div>

                    <p className="eyebrow text-rose">Delivered</p>
                    <h3 className="mt-3 text-[36px] leading-[1.05] md:text-[46px]">
                      It&rsquo;s on its way,{" "}
                      <span className="font-serif font-normal italic">
                        <span className="highlight">{name.trim().split(" ")[0] || "friend"}.</span>
                      </span>
                    </h3>
                    <p className="mt-4 max-w-[420px] text-muted">
                      Your message reached the team, and we&rsquo;ve emailed you a copy. Expect a reply within a few days.
                    </p>
                    <button type="button" onClick={reset} className="mt-7 border-b border-ink pb-1 text-sm font-bold hover:text-rose">
                      Send another <span aria-hidden="true">↗</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
