"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheckIcon } from "@animateicons/react/lucide/circle-check-icon";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { onboardingApi, type OnboardingState } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";

const NOTES: Record<string, string> = {
  welcome: "Your first week: read the code of conduct, make your profile, join the group, say hello, and join HCB. Nothing here is a test.",
  safeguarding: "TeenovateX is for teenagers, so we take safety seriously. Never share your address, school or passwords. If anything online or in the group feels wrong, tell a moderator straight away, or email hello@teenovatex.org. You will never be in trouble for telling us.",
};

function BioEditor({ onSaved }: { onSaved: (s: OnboardingState) => void }) {
  const toast = useToast();
  const [bio, setBio] = useState("");
  const suggestion = useQuery({ queryKey: keys.admin("onboarding-bio"), queryFn: onboardingApi.profileSuggestion });
  useEffect(() => {
    if (suggestion.data && !bio) setBio(suggestion.data.bio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion.data]);
  const save = useMutation({
    mutationFn: () => onboardingApi.saveBio(bio.trim()),
    onSuccess: onSaved,
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't save that."),
  });
  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-xs text-muted">We drafted this from your application. Change anything you like, then save it.</p>
      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200} className="w-full rounded-md border border-ink bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
      <button type="button" onClick={() => save.mutate()} disabled={save.isPending || bio.trim().length < 10} className="btn-secondary self-start text-xs disabled:opacity-60">Save my bio</button>
    </div>
  );
}

function IntroEditor({ state, onSaved }: { state: OnboardingState; onSaved: (s: OnboardingState) => void }) {
  const toast = useToast();
  const [intro, setIntro] = useState(state.intro ?? "");
  const save = useMutation({
    mutationFn: () => onboardingApi.saveIntro(intro.trim()),
    onSuccess: onSaved,
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't save that."),
  });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.whatsapp_text ?? "");
      toast.success("Copied. Paste it in the WhatsApp group.");
    } catch {
      toast.error("Couldn't copy. Select the text and copy it yourself.");
    }
  };
  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-xs text-muted">Two or three sentences: who you are and what you want to build. It is also shown on your profile once you are active.</p>
      <textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} maxLength={500} className="w-full rounded-md border border-ink bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => save.mutate()} disabled={save.isPending || intro.trim().length < 20} className="btn-secondary text-xs disabled:opacity-60">Save introduction</button>
        {state.whatsapp_text && <button type="button" onClick={copy} className="btn-secondary text-xs">Copy for WhatsApp</button>}
      </div>
      {state.whatsapp_text && <p className="rounded-md border border-ink bg-white p-2 text-xs text-muted">{state.whatsapp_text}</p>}
    </div>
  );
}

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
                  {NOTES[s.key] && !s.done && <p className="mt-1 text-sm text-muted">{NOTES[s.key]}</p>}
                  {s.key === "profile" && !s.done && <BioEditor onSaved={(d) => qc.setQueryData(keys.admin("onboarding-me"), d)} />}
                  {s.key === "intro" && !s.done && <IntroEditor state={state.data} onSaved={(d) => qc.setQueryData(keys.admin("onboarding-me"), d)} />}
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
