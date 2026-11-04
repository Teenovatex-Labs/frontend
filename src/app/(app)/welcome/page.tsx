"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheckIcon } from "@animateicons/react/lucide/circle-check-icon";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { onboardingApi } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";

export default function WelcomePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const toast = useToast();
  const state = useQuery({ queryKey: keys.admin("onboarding-me"), queryFn: onboardingApi.get });

  const confirm = useMutation({
    mutationFn: (step: string) => onboardingApi.confirmStep(step),
    onSuccess: (s) => {
      qc.setQueryData(keys.admin("onboarding-me"), s);
      if (s.complete) toast.success("You're all set. Welcome in!");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't save that."),
  });

  return (
    <main className="mx-auto w-full max-w-[640px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Welcome" title="Let's get you" accent="settled in." >
        A few quick things before you dive in. Nothing here is a test.
      </PageHeader>

      <div className="mt-8">
        {state.isPending ? (
          <Skeleton className="h-64 w-full" />
        ) : state.isError || !state.data ? (
          <p className="text-muted">Couldn&rsquo;t load your onboarding.</p>
        ) : (
          <Card className="flex flex-col gap-4 p-5 md:p-7">
            {state.data.due_at && !state.data.complete && (
              <p className={`text-sm ${state.data.overdue ? "font-semibold text-rose" : "text-muted"}`}>
                {state.data.overdue ? "This is overdue — finish it when you can." : `Finish by ${timeAgo(state.data.due_at)}.`}
              </p>
            )}
            {state.data.steps.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3 rounded-md border border-ink bg-cream p-3.5">
                <div>
                  <p className={`font-medium ${s.done ? "line-through text-muted" : ""}`}>{s.title}</p>
                  {s.link && (
                    <a href={s.link} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">
                      Open link
                    </a>
                  )}
                  {s.key === "profile" && !s.done && (
                    <button type="button" onClick={() => router.push("/settings")} className="text-sm underline underline-offset-4">
                      Go to settings
                    </button>
                  )}
                </div>
                {s.done ? (
                  <CircleCheckIcon size={20} />
                ) : s.self_reported ? (
                  <button type="button" onClick={() => confirm.mutate(s.key)} disabled={confirm.isPending} className="btn-secondary text-xs disabled:opacity-60">
                    I&rsquo;ve done this
                  </button>
                ) : null}
              </div>
            ))}
            {state.data.complete && (
              <div className="rounded-md border border-ink bg-yellow/40 p-4 text-center">
                <p className="font-semibold">You&rsquo;re active. Go build something.</p>
                <button type="button" onClick={() => router.push("/home")} className="btn mt-3">Take me home</button>
              </div>
            )}
          </Card>
        )}
      </div>
    </main>
  );
}
