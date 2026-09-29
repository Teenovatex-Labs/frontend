"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { MailIcon } from "@animateicons/react/lucide/mail-icon";
import { LockIcon } from "@animateicons/react/lucide/lock-icon";
import { LogInIcon } from "@animateicons/react/lucide/log-in-icon";
import { ArrowLeftIcon } from "@animateicons/react/lucide/arrow-left-icon";
import { ArrowRightIcon } from "@animateicons/react/lucide/arrow-right-icon";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import FormField from "@/components/FormField";
import StepRail, { type Step } from "@/components/auth/StepRail";
import GoogleAuthCard from "@/components/auth/GoogleAuthCard";
import VerifyCodeScreen from "@/components/auth/VerifyCodeScreen";
import ForgotPasswordFlow from "@/components/auth/ForgotPasswordFlow";
import useIconHover from "@/lib/useIconHover";
import { loginFormSchema, fieldErrors } from "@/lib/validation";
import { z } from "zod";

const STEPS: Step[] = [
  { id: "email", label: "Email", icon: MailIcon },
  { id: "password", label: "Password", icon: LockIcon },
];

const emailSchema = loginFormSchema.pick({ email: true });

export default function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const { login, verifyEmail, resendVerification, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [attempt, setAttempt] = useState(0);
  const [stepFailed, setStepFailed] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const backIcon = useIconHover();
  const nextIcon = useIconHover();
  const loginIcon = useIconHover();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const goTo = (index: number, dir: "forward" | "back") => {
    setDirection(dir);
    setStepFailed(false);
    setStep(index);
  };

  const goNext = () => {
    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setErrors(fieldErrors(result as { success: boolean; error?: z.ZodError }));
      setStepFailed(true);
      setAttempt((a) => a + 1);
      return;
    }
    setErrors({});
    goTo(1, "forward");
  };

  const goBack = () => goTo(0, "back");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Both steps' buttons are type="submit" so Enter always does the right
    // thing from wherever the cursor is — advance past email, actually log
    // in once password is on screen.
    if (step === 0) {
      goNext();
      return;
    }
    setFormError(null);

    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(fieldErrors(result));
      if (result.error.issues.some((i) => i.path[0] === "email")) goTo(0, "back");
      return;
    }
    // Clear first (a separate render from the one that re-sets it below) so
    // failing with the exact same message twice in a row still re-triggers
    // the field's shake instead of silently no-op'ing on an unchanged error.
    setErrors((prev) => {
      const { password: _password, ...rest } = prev;
      return rest;
    });

    setSubmitting(true);
    try {
      await login(result.data.email, result.data.password, rememberMe);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
      } else {
        setErrors((prev) => ({ ...prev, password: err instanceof Error ? err.message : "Login failed" }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const panelClass = direction === "back" ? "step-panel-back" : "step-panel-forward";

  // Still checking a persisted session, or already have one — skip the form
  // entirely instead of flashing it before the redirect effect above fires.
  if (loading || user) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-rose" />
        Taking you in…
      </div>
    );
  }

  if (needsVerification) {
    return (
      <VerifyCodeScreen
        email={email}
        heading={
          <>
            One quick <span className="font-serif italic font-medium text-rose">check.</span>
          </>
        }
        description="Your email isn't verified yet — we sent a 6-digit code to"
        onSubmit={async (code) => {
          await verifyEmail(email, code);
          router.push("/dashboard");
        }}
        onResend={() => resendVerification(email)}
        onBack={() => setNeedsVerification(false)}
      />
    );
  }

  if (forgotPassword) {
    return <ForgotPasswordFlow initialEmail={email} onBack={() => setForgotPassword(false)} />;
  }

  return (
    <>
      <Link href="/" aria-label="TeenovateX home" className="mb-5 flex items-center">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
      </Link>

      <StepRail steps={STEPS} current={step} />

      <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
        {step === 0 ? (
          <>
            Welcome <span className="font-serif italic font-medium text-rose">back.</span>
          </>
        ) : (
          <>
            Good to <span className="font-serif italic font-medium text-rose">see you.</span>
          </>
        )}
      </h1>

      {step === 0 && (
        <div className="mt-4">
          <GoogleAuthCard
            text="signin_with"
            onSuccess={async (credentialResponse) => {
              if (!credentialResponse.credential) return;
              setFormError(null);
              try {
                await loginWithGoogle(credentialResponse.credential);
                router.push("/dashboard");
              } catch (err) {
                setFormError(err instanceof Error ? err.message : "Google sign-in failed");
              }
            }}
            onError={() => setFormError("Google sign-in failed")}
          />
        </div>
      )}

      {step === 0 && (
        <div className="my-4 flex items-center gap-4 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          or fill it in yourself
          <span className="h-px flex-1 bg-line" />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className={step === 0 ? "" : "mt-5"}>
        <div key={`panel-${step}`} className={`flex flex-col gap-3.5 ${panelClass}`}>
          {step === 0 ? (
            <FormField
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              error={errors.email}
              autoFocus
            />
          ) : (
            <>
              <button
                type="button"
                onClick={goBack}
                className="flex items-center justify-between rounded-md border border-line bg-cream px-4 py-2.5 text-left text-sm transition-colors hover:border-ink"
              >
                <span className="truncate text-muted">
                  Logging in as <span className="font-medium text-ink">{email}</span>
                </span>
                <span className="shrink-0 pl-3 text-xs font-semibold text-rose underline underline-offset-4">
                  Change
                </span>
              </button>

              <FormField
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                error={errors.password}
                autoFocus
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-medium text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-ink accent-rose"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink"
                >
                  Forgot password?
                </button>
              </div>
            </>
          )}

          {formError && <p className="text-sm text-rose">{formError}</p>}

          <div className="mt-1 flex items-center gap-3">
            {step === 1 && (
              <button
                type="button"
                onClick={goBack}
                onMouseEnter={backIcon.onMouseEnter}
                onMouseLeave={backIcon.onMouseLeave}
                aria-label="Back"
                className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md border border-ink transition-colors hover:bg-pink"
              >
                <ArrowLeftIcon ref={backIcon.ref} size={18} />
              </button>
            )}

            {step === 0 ? (
              <button
                type="submit"
                onMouseEnter={nextIcon.onMouseEnter}
                onMouseLeave={nextIcon.onMouseLeave}
                key={attempt}
                className={`btn flex-1 justify-center ${stepFailed ? "step-shake" : ""}`}
              >
                Continue <ArrowRightIcon ref={nextIcon.ref} size={16} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                onMouseEnter={loginIcon.onMouseEnter}
                onMouseLeave={loginIcon.onMouseLeave}
                className="btn flex-1 justify-center disabled:opacity-60"
              >
                {submitting ? "Logging in…" : "Log in"} <LogInIcon ref={loginIcon.ref} size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        New here?{" "}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-ink underline underline-offset-4"
        >
          Create an account
        </button>
      </p>
    </>
  );
}
