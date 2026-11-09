"use client";

import { landingPath } from "@/lib/landing";
import { siteUrl } from "@/lib/hosts";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthSplit from "@/components/auth/AuthSplit";
import SignupForm from "@/components/auth/SignupForm";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";

type Mode = "login" | "signup";

// Consumes the fallback link from the verification email
// (/auth?mode=signup&verify_email=...&code=...) for anyone whose OTP didn't
// land — verifies immediately on load instead of making them retype the code.
function EmailLinkVerifier({ email, code }: { email: string; code: string }) {
  const { verifyEmail } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<"verifying" | "error">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyEmail(email, code)
      .then(() => router.replace(landingPath()))
      .catch((err) => {
        setState("error");
        setError(err instanceof Error ? err.message : "That link isn't valid anymore.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Link href={siteUrl("/")} aria-label="TeenovateX home" className="mb-5 flex items-center">
        <img src="/assets/logo-long5.svg" alt="TeenovateX" className="h-7 w-auto" />
      </Link>
      <h1 className="text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[30px]">
        {state === "verifying" ? (
          <>
            Confirming <span className="font-serif italic font-medium text-rose">it's you.</span>
          </>
        ) : (
          <>
            Hmm, that <span className="font-serif italic font-medium text-rose">didn't work.</span>
          </>
        )}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {state === "verifying" ? "One sec…" : error}{" "}
        {state === "error" && (
          <>
            Head back to{" "}
            <Link href="/auth?mode=signup" className="font-semibold text-ink underline underline-offset-4">
              signup
            </Link>{" "}
            and enter the code by hand instead.
          </>
        )}
      </p>
    </>
  );
}

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "login" ? "login" : "signup");

  const verifyEmailParam = searchParams.get("verify_email");
  const codeParam = searchParams.get("code");

  const switchMode = (next: Mode) => {
    setMode(next);
    router.replace(`/auth?mode=${next}`, { scroll: false });
  };

  return (
    <AuthSplit
      image={mode === "signup" ? { src: "/assets/Logo1.svg", flip: true } : { src: "/assets/logo2.svg" }}
      imageSide={mode === "signup" ? "right" : "left"}
    >
      {verifyEmailParam && codeParam ? (
        <EmailLinkVerifier email={verifyEmailParam} code={codeParam} />
      ) : mode === "signup" ? (
        <SignupForm onSwitchToLogin={() => switchMode("login")} />
      ) : (
        <LoginForm onSwitchToSignup={() => switchMode("signup")} />
      )}
    </AuthSplit>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}
