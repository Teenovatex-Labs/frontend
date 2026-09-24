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
import FormField from "@/components/FormField";
import StepRail, { type Step } from "@/components/auth/StepRail";
import GoogleAuthCard from "@/components/auth/GoogleAuthCard";
import AuthSplit from "@/components/auth/AuthSplit";
import useIconHover from "@/lib/useIconHover";
import useViewTransitionNav from "@/lib/useViewTransitionNav";
import { loginFormSchema, fieldErrors } from "@/lib/validation";
import { z } from "zod";

const STEPS: Step[] = [
  { id: "email", label: "Email", icon: MailIcon },
  { id: "password", label: "Password", icon: LockIcon },
];

const emailSchema = loginFormSchema.pick({ email: true });

export default function LoginPage() {
  const { login, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [attempt, setAttempt] = useState(0);
  const [stepFailed, setStepFailed] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const backIcon = useIconHover();
  const nextIcon = useIconHover();
  const loginIcon = useIconHover();
  const navigate = useViewTransitionNav();

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
    setFormError(null);

    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(fieldErrors(result));
      if (result.error.issues.some((i) => i.path[0] === "email")) goTo(0, "back");
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      await login(result.data.email, result.data.password);
      router.push("/dashboard");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const panelClass = direction === "back" ? "step-panel-back" : "step-panel-forward";

  return (
    <AuthSplit image={{ src: "/assets/logo2.svg" }} imageSide="left">
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
                  type="button"
                  onClick={goNext}
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
          <Link
            href="/signup"
            onClick={(e) => {
              e.preventDefault();
              navigate("/signup");
            }}
            className="font-semibold text-ink underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
    </AuthSplit>
  );
}
