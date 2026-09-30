"use client";

import { siteUrl } from "@/lib/hosts";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import CodeSlots, { type CodeSlotsStatus } from "@/components/ui/CodeSlots";

type ResendState = "idle" | "sending" | "success" | "error";

export default function VerifyCodeScreen({
  email,
  heading,
  description,
  onSubmit,
  onResend,
  onBack,
  backPrompt = "Wrong email?",
  backLabel = "Go back",
}: {
  email: string;
  heading: ReactNode;
  description: ReactNode;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  backPrompt?: string;
  backLabel?: string;
}) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<CodeSlotsStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [resendState, setResendState] = useState<ResendState>("idle");
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleComplete = async (submittedCode: string) => {
    setError(null);
    try {
      await onSubmit(submittedCode);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "That code isn't right.");
      setTimeout(() => {
        setStatus("idle");
        setCode("");
      }, 900);
    }
  };

  const handleResend = async () => {
    setResendState("sending");
    setResendMessage(null);
    try {
      await onResend();
      setResendState("success");
      setResendMessage("New code sent — check your inbox.");
      setResendCooldown(30);
      setTimeout(() => setResendState((s) => (s === "success" ? "idle" : s)), 3000);
    } catch (err) {
      setResendState("error");
      setResendMessage(err instanceof Error ? err.message : "Couldn't resend the code.");
      setTimeout(() => setResendState((s) => (s === "error" ? "idle" : s)), 3000);
    }
  };

  return (
    <>
      <Link href={siteUrl("/")} aria-label="TeenovateX home" className="mb-5 flex items-center">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
      </Link>

      <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">{heading}</h1>
      <p className="mt-3 text-sm text-muted">
        {description} <span className="font-medium text-ink">{email}</span>.
      </p>

      <div className="mt-8 flex justify-center">
        <CodeSlots
          length={6}
          value={code}
          onChange={setCode}
          onComplete={handleComplete}
          status={status}
          autoFocus
          accentColor="var(--ink)"
          inkColor="var(--rose)"
          slotColor="var(--line)"
          digitColor="var(--cream)"
          dangerColor="#c0463f"
          slotSize={48}
        />
      </div>

      {status === "error" && error && <p className="mt-4 text-center text-sm text-rose">{error}</p>}
      {status === "success" && <p className="mt-4 text-center text-sm font-medium text-emerald-600">Code accepted!</p>}

      <div className="mt-8 text-center text-sm text-muted">
        Didn&rsquo;t get it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resendState === "sending" || resendCooldown > 0}
          className={`font-semibold underline underline-offset-4 disabled:no-underline ${
            resendState === "error" ? "text-rose" : "text-ink"
          } disabled:opacity-50`}
        >
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : resendState === "sending"
              ? "Sending…"
              : "Resend code"}
        </button>
      </div>

      {resendMessage && (
        <p
          className={`mt-2 flex items-center justify-center gap-1.5 text-center text-xs ${
            resendState === "error" ? "text-rose" : resendState === "success" ? "text-emerald-600" : "text-muted"
          }`}
        >
          {resendState === "success" && <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={2.5} />}
          {resendState === "error" && <HugeiconsIcon icon={Alert02Icon} size={13} strokeWidth={2.5} />}
          {resendMessage}
        </p>
      )}

      <p className="mt-5 text-center text-sm text-muted">
        {backPrompt}{" "}
        <button type="button" onClick={onBack} className="font-semibold text-ink underline underline-offset-4">
          {backLabel}
        </button>
      </p>
    </>
  );
}
