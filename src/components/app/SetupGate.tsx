"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { ApiError, usersApi } from "@/lib/api";
import FormField from "@/components/FormField";
import { todayIso } from "@/lib/age";
import { birthDateSchema, usernameSchema } from "@/lib/validation";

// Full-screen stop for an account that isn't finished yet. Google sign-ups skip
// the sign-up form, so they arrive with no age and a placeholder username; older
// accounts have no age either. We ask only for what's missing, and nothing in the
// app is reachable until it's answered.
export default function SetupGate() {
  const { user, refreshUser, logout } = useAuth();
  const needsBirthDate = !user?.age_confirmed;
  const needsUsername = !user?.username_set;

  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [removed, setRemoved] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const errs: Record<string, string> = {};
    if (needsBirthDate) {
      const r = birthDateSchema.safeParse(birthDate);
      if (!r.success) errs.birth_date = r.error.issues[0]?.message ?? "Check that date";
    }
    if (needsUsername) {
      const r = usernameSchema.safeParse(username);
      if (!r.success) errs.username = r.error.issues[0]?.message ?? "Check that username";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      // Age first: under 13 removes the account, so don't spend a username on it.
      if (needsBirthDate) {
        try {
          await usersApi.setBirthDate(birthDate);
        } catch (err) {
          if (!(err instanceof ApiError && err.code === "ALREADY_SET")) throw err;
        }
      }
      if (needsUsername) {
        try {
          await usersApi.setUsername(username);
        } catch (err) {
          if (err instanceof ApiError && err.code === "USERNAME_TAKEN") {
            // Age is saved by now; refresh so only the username is asked for again.
            await refreshUser();
            setErrors({ username: err.message });
            return;
          }
          if (!(err instanceof ApiError && err.code === "ALREADY_SET")) throw err;
        }
      }
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.code === "AGE_TOO_YOUNG") setRemoved(err.message);
      else setFormError(err instanceof ApiError ? err.message : "Couldn't save that. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-[440px] border border-ink bg-white p-6 shadow-[8px_8px_0_var(--pink)] md:p-8">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="mb-6 h-7 w-auto" />

        {removed ? (
          <div role="alert">
            <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em]">
              See you <span className="font-serif font-medium italic text-rose">later.</span>
            </h1>
            <p className="mt-4 text-muted">{removed}</p>
            <button type="button" onClick={() => void logout()} className="btn mt-6 w-full justify-center">
              Okay
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em]">
              Almost there, <span className="font-serif font-medium italic text-rose">finish setting up.</span>
            </h1>
            <p className="text-muted">
              {needsUsername && needsBirthDate
                ? "Pick a username and tell us your birthday. TeenovateX is for ages 13 and up."
                : needsUsername
                  ? "Pick the username other Teenovators will see. You can't change it later."
                  : "TeenovateX is for ages 13 and up, so we ask everyone once. It stays private."}
            </p>

            {needsUsername && (
              <FormField
                label="Username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                error={errors.username}
                autoFocus
              />
            )}
            {needsBirthDate && (
              <FormField
                label="Date of birth"
                type="date"
                name="birth_date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                autoComplete="bday"
                max={todayIso()}
                error={errors.birth_date}
                autoFocus={!needsUsername}
              />
            )}

            {formError && <p className="text-sm text-rose">{formError}</p>}

            <button type="submit" disabled={submitting} className="btn w-full justify-center disabled:opacity-60">
              {submitting ? "Saving…" : "Continue"}
            </button>
            <button type="button" onClick={() => void logout()} className="text-sm text-muted underline underline-offset-4">
              Log out instead
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
