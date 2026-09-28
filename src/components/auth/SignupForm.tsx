"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { UserIcon } from "@animateicons/react/lucide/user-icon";
import { LockIcon } from "@animateicons/react/lucide/lock-icon";
import { RocketIcon } from "@animateicons/react/lucide/rocket-icon";
import { ArrowLeftIcon } from "@animateicons/react/lucide/arrow-left-icon";
import { ArrowRightIcon } from "@animateicons/react/lucide/arrow-right-icon";
import { PencilIcon } from "@animateicons/react/lucide/pencil-icon";
import { useAuth } from "@/context/AuthContext";
import FormField from "@/components/FormField";
import StepRail, { type Step } from "@/components/auth/StepRail";
import GoogleAuthCard from "@/components/auth/GoogleAuthCard";
import VerifyCodeScreen from "@/components/auth/VerifyCodeScreen";
import useIconHover from "@/lib/useIconHover";
import { registerBaseSchema, fieldErrors } from "@/lib/validation";

const STEPS: Step[] = [
  { id: "you", label: "You", icon: UserIcon },
  { id: "secure", label: "Secure", icon: LockIcon },
  { id: "teenovate", label: "Teenovate!", icon: RocketIcon },
];

export default function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const { register, verifyEmail, resendVerification, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [attempt, setAttempt] = useState(0);
  const [stepFailed, setStepFailed] = useState(false);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [verifying, setVerifying] = useState(false);

  const backIcon = useIconHover();
  const nextIcon = useIconHover();
  const rocketIcon = useIconHover();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const goTo = (index: number, dir: "forward" | "back") => {
    setDirection(dir);
    setStepFailed(false);
    setStep(index);
  };

  const validateStep = (index: number) => {
    if (index === 0) {
      const result = registerBaseSchema
        .pick({ full_name: true, username: true })
        .safeParse({ full_name: fullName, username });
      setErrors(fieldErrors(result));
      return result.success;
    }
    if (index === 1) {
      const result = registerBaseSchema
        .pick({ email: true, password: true, confirm_password: true })
        .safeParse({ email, password, confirm_password: confirmPassword });
      const errs = fieldErrors(result);
      if (result.success && password !== confirmPassword) {
        errs.confirm_password = "Passwords don't match";
      }
      setErrors(errs);
      return result.success && password === confirmPassword;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) {
      setStepFailed(true);
      setAttempt((a) => a + 1);
      return;
    }
    goTo(Math.min(STEPS.length - 1, step + 1), "forward");
  };

  const goBack = () => goTo(Math.max(0, step - 1), "back");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = registerBaseSchema.safeParse({
      full_name: fullName,
      username,
      email,
      password,
      confirm_password: confirmPassword,
    });
    if (!result.success || password !== confirmPassword) {
      setErrors(fieldErrors(result));
      if (password !== confirmPassword) setErrors((prev) => ({ ...prev, confirm_password: "Passwords don't match" }));
      goTo(result.success ? 1 : 0, "back");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        full_name: result.data.full_name,
        username: result.data.username,
        email: result.data.email,
        password: result.data.password,
      });
      setVerifying(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const panelClass = direction === "back" ? "step-panel-back" : "step-panel-forward";

  if (verifying) {
    return (
      <VerifyCodeScreen
        email={email}
        heading={
          <>
            Check your <span className="font-serif italic font-medium text-rose">inbox.</span>
          </>
        }
        description="We sent a 6-digit code to finish becoming a Teenovator to"
        onSubmit={async (code) => {
          await verifyEmail(email, code);
          setTimeout(() => router.push("/dashboard"), 700);
        }}
        onResend={() => resendVerification(email)}
        onBack={() => {
          setVerifying(false);
          goTo(1, "back");
        }}
      />
    );
  }

  return (
    <>
      <Link href="/" aria-label="TeenovateX home" className="mb-5 flex items-center">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
      </Link>

      <StepRail steps={STEPS} current={step} />

      <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
        {step === 0 && (
          <>
            Tell us <span className="font-serif italic font-medium text-rose">who you are.</span>
          </>
        )}
        {step === 1 && (
          <>
            Lock it down <span className="font-serif italic font-medium text-rose">and secure it.</span>
          </>
        )}
        {step === 2 && (
          <>
            Time to <span className="font-serif italic font-medium text-rose">teenovate!</span>
          </>
        )}
      </h1>

      {step === 0 && (
        <div className="mt-4">
          <GoogleAuthCard
            text="signup_with"
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
          {step === 0 && (
            <>
              <FormField
                label="Full name"
                name="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                error={errors.full_name}
                autoFocus
              />
              <FormField
                label="Username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                error={errors.username}
              />
            </>
          )}

          {step === 1 && (
            <>
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
              <FormField
                label="Password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                error={errors.password}
              />
              <FormField
                label="Confirm password"
                type="password"
                name="confirm_password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={errors.confirm_password}
              />
            </>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-2.5 rounded-md border border-ink bg-pink/30 p-3.5">
              <ReviewRow label="Name" value={fullName} onEdit={() => goTo(0, "back")} />
              <ReviewRow label="Username" value={`@${username}`} onEdit={() => goTo(0, "back")} />
              <ReviewRow label="Email" value={email} onEdit={() => goTo(1, "back")} />
              <ReviewRow
                label="Password"
                value={password ? "You know what you wrote, right? 👀" : ""}
                onEdit={() => goTo(1, "back")}
              />
            </div>
          )}

          {formError && <p className="text-sm text-rose">{formError}</p>}

          <div className="mt-1 flex items-center gap-3">
            {step > 0 && (
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

            {step < STEPS.length - 1 ? (
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
                onMouseEnter={rocketIcon.onMouseEnter}
                onMouseLeave={rocketIcon.onMouseLeave}
                className="btn flex-1 justify-center disabled:opacity-60"
              >
                {submitting ? "Launching…" : "Become a Teenovator!"} <RocketIcon ref={rocketIcon.ref} size={16} />
              </button>
            )}
          </div>
        </div>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Already a Teenovator?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-ink underline underline-offset-4"
        >
          Log in
        </button>
      </p>
    </>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  const pencil = useIconHover();
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        onMouseEnter={pencil.onMouseEnter}
        onMouseLeave={pencil.onMouseLeave}
        aria-label={`Edit ${label.toLowerCase()}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink bg-cream transition-colors hover:bg-yellow"
      >
        <PencilIcon ref={pencil.ref} size={14} />
      </button>
    </div>
  );
}
