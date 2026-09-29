"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { settingsApi, ApiError } from "@/lib/api";
import FormField from "@/components/FormField";
import { newPasswordSchema, fieldErrors } from "@/lib/validation";

// Shown to a Google-only account (has_google, no password yet) so it isn't
// stuck signing in one way forever — and, more importantly, so someone else
// can't register that same email later and squat on it: once this account
// has its own password, googleAuth's email-match linking no longer treats
// it as an abandoned/unverified row up for grabs.
export default function AddPasswordPrompt() {
  const { user, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user || user.has_password || dismissed) return null;

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
      await settingsApi.setPassword({ new_password: newPassword });
      await refreshUser();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Couldn't set your password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wrap mt-6">
      <div className="rounded-md border border-ink bg-pink/20 p-4">
        {!open ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Add a password to your account</p>
              <p className="text-sm text-muted">
                You signed up with Google — set a password so you can log in either way.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink"
              >
                Not now
              </button>
              <button type="button" onClick={() => setOpen(true)} className="btn">
                Set a password
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
            <p className="font-semibold">Add a password</p>
            <div className="grid gap-3.5 sm:grid-cols-2">
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
            </div>
            {formError && <p className="text-sm text-rose">{formError}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" disabled={submitting} className="btn disabled:opacity-60">
                {submitting ? "Saving…" : "Save password"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-muted underline underline-offset-4 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
