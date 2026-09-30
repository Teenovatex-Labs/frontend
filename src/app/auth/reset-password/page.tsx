"use client";

import { siteUrl } from "@/lib/hosts";
import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogInIcon } from "@animateicons/react/lucide/log-in-icon";
import AuthSplit from "@/components/auth/AuthSplit";
import FormField from "@/components/FormField";
import { useAuth } from "@/context/AuthContext";
import useIconHover from "@/lib/useIconHover";
import { newPasswordSchema, fieldErrors } from "@/lib/validation";

// Landing page for the fallback link in the password-reset email
// (/auth/reset-password?token=...) — the token is the same short-lived JWT
// verify-reset-code returns, so this skips straight to the new-password step.
function ResetPasswordInner() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const doneIcon = useIconHover();

  if (!token) {
    return (
      <>
        <Link href={siteUrl("/")} aria-label="TeenovateX home" className="mb-5 flex items-center">
          <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
        </Link>
        <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
          That link&rsquo;s <span className="font-serif italic font-medium text-rose">missing something.</span>
        </h1>
        <p className="mt-3 text-sm text-muted">
          Head back to{" "}
          <Link href="/auth?mode=login" className="font-semibold text-ink underline underline-offset-4">
            login
          </Link>{" "}
          and try &ldquo;Forgot password?&rdquo; again.
        </p>
      </>
    );
  }

  if (done) {
    return (
      <>
        <Link href={siteUrl("/")} aria-label="TeenovateX home" className="mb-5 flex items-center">
          <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
        </Link>
        <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
          Password <span className="font-serif italic font-medium text-rose">reset.</span>
        </h1>
        <p className="mt-3 text-sm text-muted">You&rsquo;re all set — log in with your new password.</p>
        <button
          type="button"
          onClick={() => router.push("/auth?mode=login")}
          onMouseEnter={doneIcon.onMouseEnter}
          onMouseLeave={doneIcon.onMouseLeave}
          className="btn mt-6 justify-center"
        >
          Back to login <LogInIcon ref={doneIcon.ref} size={16} />
        </button>
      </>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = newPasswordSchema.safeParse({ password: newPassword, confirm_password: confirmPassword });
    const errs = fieldErrors(result);
    if (result.success && newPassword !== confirmPassword) errs.confirm_password = "Passwords don't match";
    setErrors(errs);
    if (!result.success || newPassword !== confirmPassword) return;

    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't reset your password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Link href={siteUrl("/")} aria-label="TeenovateX home" className="mb-5 flex items-center">
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
          error={errors.password}
          autoFocus
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
        {formError && <p className="text-sm text-rose">{formError}</p>}
        <button type="submit" disabled={submitting} className="btn mt-1 justify-center disabled:opacity-60">
          {submitting ? "Saving…" : "Save new password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <AuthSplit image={{ src: "/assets/logo2.svg" }} imageSide="left">
        <ResetPasswordInner />
      </AuthSplit>
    </Suspense>
  );
}
