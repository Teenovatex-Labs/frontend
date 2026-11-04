"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Skeleton from "@/components/ui/Skeleton";
import { ApiError, request } from "@/lib/api";

type ConsentView = { child_first_name: string; status: "pending" | "confirmed" | "withdrawn" | "expired"; text: string; text_version: string; expires_at: string };

const getConsent = (token: string) => request<ConsentView>(`/applications/guardian/${token}`);
const confirmConsent = (token: string) => request<{ status: string }>(`/applications/guardian/${token}/confirm`, { method: "POST" });
const withdrawConsent = (token: string) => request<{ status: string }>(`/applications/guardian/${token}/withdraw`, { method: "POST" });

export default function GuardianConsentPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<ConsentView["status"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const view = useQuery({
    queryKey: ["consent", token],
    queryFn: () => getConsent(token),
    retry: false,
  });

  const confirm = useMutation({
    mutationFn: () => confirmConsent(token),
    onSuccess: (r) => setStatus(r.status as ConsentView["status"]),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });
  const withdraw = useMutation({
    mutationFn: () => withdrawConsent(token),
    onSuccess: (r) => setStatus(r.status as ConsentView["status"]),
    onError: (e) => setError(e instanceof ApiError ? e.message : "Something went wrong."),
  });

  const current = status ?? view.data?.status;

  return (
    <>
      <Header />
      <main className="wrap max-w-[560px] py-14">
        <p className="eyebrow text-rose">Guardian confirmation</p>
        {view.isPending ? (
          <Skeleton className="mt-4 h-64 w-full" />
        ) : view.isError || !view.data ? (
          <p className="mt-4 text-muted">This link is not valid. Ask your child to send a new one.</p>
        ) : (
          <>
            <h1 className="mt-2 text-[32px] leading-[1.1] tracking-[-0.03em]">
              {view.data.child_first_name} has been accepted to <span className="font-serif italic font-medium text-rose">TeenovateX.</span>
            </h1>

            {current === "confirmed" ? (
              <div className="mt-6 rounded-md border border-ink bg-yellow/40 p-5">
                <p className="font-semibold">Confirmed. Thank you.</p>
                <p className="mt-1 text-sm text-muted">{view.data.child_first_name} can now create their account.</p>
                <button type="button" onClick={() => withdraw.mutate()} disabled={withdraw.isPending} className="mt-3 text-sm text-rose underline underline-offset-4">
                  Change your mind and withdraw this confirmation
                </button>
              </div>
            ) : current === "withdrawn" ? (
              <div className="mt-6 rounded-md border border-ink bg-pink/20 p-5">
                <p className="font-semibold">Confirmation withdrawn.</p>
                <p className="mt-1 text-sm text-muted">Your child can ask you to confirm again from their application.</p>
              </div>
            ) : current === "expired" ? (
              <div className="mt-6 rounded-md border border-ink bg-pink/20 p-5">
                <p className="font-semibold">This request has expired.</p>
                <p className="mt-1 text-sm text-muted">Ask your child to send a new request from their application.</p>
              </div>
            ) : (
              <div className="mt-6 rounded-md border border-ink bg-white p-5">
                <div className="max-h-[320px] overflow-y-auto whitespace-pre-wrap text-sm text-muted">{view.data.text}</div>
                {error && <p className="mt-3 text-sm text-rose">{error}</p>}
                <button type="button" onClick={() => confirm.mutate()} disabled={confirm.isPending} className="btn mt-4 disabled:opacity-60">
                  {confirm.isPending ? "Confirming…" : "I confirm, as a parent or guardian"}
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
