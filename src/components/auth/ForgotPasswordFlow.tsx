"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LogInIcon } from "@animateicons/react/lucide/log-in-icon";
import { useAuth } from "@/context/AuthContext";
import FormField from "@/components/FormField";
import VerifyCodeScreen from "@/components/auth/VerifyCodeScreen";
import useIconHover from "@/lib/useIconHover";
import { emailOnlySchema, newPasswordSchema, fieldErrors } from "@/lib/validation";

type Stage = "email" | "code" | "password" | "done";

export default function ForgotPasswordFlow({
  initialEmail,
  onBack,
}: {
  initialEmail: string;
  onBack: () => void;
}) {
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();

  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const doneIcon = useIconHover();

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    const result = emailOnlySchema.safeParse({ email });
    if (!result.success) {
      setEmailError(fieldErrors(result).email);
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      await forgotPassword(email);
      setStage("code");
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Couldn't send the code");
    } finally {
      setSending(false);
    }
  };

  if (stage === "code") {
    return (
      <VerifyCodeScreen
        email={email}
        heading={
          <>
            Reset your <span className="font-serif italic font-medium text-rose">password.</span>
          </>
        }
        description="Enter the 6-digit code we sent to"
        onSubmit={async (code) => {
          const token = await verifyResetCode(email, code);
          setResetToken(token);
          setStage("password");
        }}
        onResend={() => forgotPassword(email)}
        onBack={() => setStage("email")}
      />
    );
  }

  if (stage === "password" && resetToken) {
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      setFormError(null);
      const result = newPasswordSchema.safeParse({ password: newPassword, confirm_password: confirmPassword });
      const errs = fieldErrors(result);
      if (result.success && newPassword !== confirmPassword) errs.confirm_password = "Passwords don't match";
      setPasswordErrors(errs);
      if (!result.success || newPassword !== confirmPassword) return;

      setSubmitting(true);
      try {
        await resetPassword(resetToken, newPassword);
        setStage("done");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Couldn't reset your password");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <>
        <Link href="/" aria-label="TeenovateX home" className="mb-5 flex items-center">
          <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
        </Link>
        <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
          Pick a new <span className="font-serif italic font-medium text-rose">password.</span>
        </h1>
        <p className="mt-3 text-sm text-muted">Make it one you&rsquo;ll actually remember this time.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-5 flex flex-col gap-3.5">
          <FormField
            label="New password"
            type="password"
            name="new_password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            error={passwordErrors.password}
            autoFocus
          />
          <FormField
            label="Confirm password"
            type="password"
            name="confirm_password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={passwordErrors.confirm_password}
          />
          {formError && <p className="text-sm text-rose">{formError}</p>}
          <button type="submit" disabled={submitting} className="btn mt-1 justify-center disabled:opacity-60">
            {submitting ? "Saving…" : "Save new password"}
          </button>
        </form>
      </>
    );
  }

  if (stage === "done") {
    return (
      <>
        <Link href="/" aria-label="TeenovateX home" className="mb-5 flex items-center">
          <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
        </Link>
        <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
          Password <span className="font-serif italic font-medium text-rose">reset.</span>
        </h1>
        <p className="mt-3 text-sm text-muted">You&rsquo;re all set — log in with your new password.</p>
        <button
          type="button"
          onClick={onBack}
          onMouseEnter={doneIcon.onMouseEnter}
          onMouseLeave={doneIcon.onMouseLeave}
          className="btn mt-6 justify-center"
        >
          Back to login <LogInIcon ref={doneIcon.ref} size={16} />
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/" aria-label="TeenovateX home" className="mb-5 flex items-center">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
      </Link>
      <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
        Forgot your <span className="font-serif italic font-medium text-rose">password?</span>
      </h1>
      <p className="mt-3 text-sm text-muted">Happens to the best of us. Enter your email and we&rsquo;ll send a code.</p>

      <form onSubmit={handleSendCode} noValidate className="mt-5 flex flex-col gap-3.5">
        <FormField
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          error={emailError ?? undefined}
          autoFocus
        />
        <button type="submit" disabled={sending} className="btn mt-1 justify-center disabled:opacity-60">
          {sending ? "Sending…" : "Send reset code"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        Remembered it?{" "}
        <button type="button" onClick={onBack} className="font-semibold text-ink underline underline-offset-4">
          Back to login
        </button>
      </p>
    </>
  );
}
