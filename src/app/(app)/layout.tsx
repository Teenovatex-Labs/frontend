import type { Metadata } from "next";
import type { ReactNode } from "react";
import AppGate from "@/components/app/AppGate";

export const metadata: Metadata = {
  title: "TeenovateX",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppGate>{children}</AppGate>;
}
