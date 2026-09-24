"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import FormField from "@/components/FormField";
import { loginFormSchema, fieldErrors } from "@/lib/validation";

export default function LoginPage() {
  const { login, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = loginFormSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(fieldErrors(result));
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

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <Link href="/" aria-label="TeenovateX home" className="mb-10 flex items-center">
          <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-8 w-auto" />
        </Link>

        <p className="eyebrow text-rose">Welcome back</p>
        <h1 className="mt-3 text-[34px] leading-[1.1] tracking-[-0.03em]">
          Log in to <span className="font-serif italic font-medium text-rose">keep building.</span>
        </h1>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
          <FormField
            label="Email"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            error={errors.email}
          />
          <FormField
            label="Password"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={errors.password}
          />

          {formError && <p className="text-sm text-rose">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn justify-center disabled:opacity-60">
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-4 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="flex justify-center">
          <GoogleLogin
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

        <p className="mt-8 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
