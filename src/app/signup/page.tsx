"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import FormField from "@/components/FormField";
import { registerFormSchema, fieldErrors } from "@/lib/validation";

export default function SignupPage() {
  const { register, loginWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = registerFormSchema.safeParse({
      full_name: fullName,
      username,
      email,
      password,
      confirm_password: confirmPassword,
    });
    if (!result.success) {
      setErrors(fieldErrors(result));
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      await register({
        full_name: result.data.full_name,
        username: result.data.username,
        email: result.data.email,
        password: result.data.password,
      });
      router.push("/dashboard");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <Link href="/" className="mb-10 flex items-center gap-2.5">
          <span className="text-[32px] leading-none tracking-[-0.19em] pr-1">
            t<span className="text-rose">×</span>
          </span>
          <span className="font-bold text-lg tracking-tight">
            teenovate<span className="text-rose">x</span>
          </span>
        </Link>

        <p className="eyebrow text-rose">Join the community</p>
        <h1 className="mt-3 text-[34px] leading-[1.1] tracking-[-0.03em]">
          Create your <span className="font-serif italic font-medium text-rose">free account.</span>
        </h1>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-5">
          <FormField
            label="Full name"
            name="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            error={errors.full_name}
          />
          <FormField
            label="Username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            error={errors.username}
          />
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

          {formError && <p className="text-sm text-rose">{formError}</p>}

          <button type="submit" disabled={submitting} className="btn justify-center disabled:opacity-60">
            {submitting ? "Creating account…" : "Create account"}
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
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
