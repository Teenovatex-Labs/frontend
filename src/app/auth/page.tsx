"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthSplit from "@/components/auth/AuthSplit";
import SignupForm from "@/components/auth/SignupForm";
import LoginForm from "@/components/auth/LoginForm";

type Mode = "login" | "signup";

function AuthPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get("mode") === "login" ? "login" : "signup");

  const switchMode = (next: Mode) => {
    setMode(next);
    router.replace(`/auth?mode=${next}`, { scroll: false });
  };

  return (
    <AuthSplit
      image={mode === "signup" ? { src: "/assets/Logo1.svg", flip: true } : { src: "/assets/logo2.svg" }}
      imageSide={mode === "signup" ? "right" : "left"}
    >
      {mode === "signup" ? (
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
