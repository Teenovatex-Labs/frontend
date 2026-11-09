"use client";

import TestBanner from "@/components/apply/TestBanner";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheckIcon } from "@animateicons/react/lucide/circle-check-icon";
import { ShieldCheckIcon } from "@animateicons/react/lucide/shield-check-icon";
import StepRail, { type Step } from "@/components/auth/StepRail";
import { UserIcon } from "@animateicons/react/lucide/user-icon";
import { MessageCircleIcon } from "@animateicons/react/lucide/message-circle-icon";
import { UploadIcon } from "@animateicons/react/lucide/upload-icon";
import { ArrowLeftIcon } from "@animateicons/react/lucide/arrow-left-icon";
import { ArrowRightIcon } from "@animateicons/react/lucide/arrow-right-icon";
import ReviewStep from "@/components/apply/ReviewStep";
import SubmittedCelebration from "@/components/apply/SubmittedCelebration";
import CelebrationCard, { useFirstTime } from "@/components/ui/CelebrationCard";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import {
  getMyApplication,
  replyToClarification,
  requestGuardian,
  submitApplication,
  updateDraft,
  withdrawApplication,
  type ApplicationView,
} from "@/lib/admissions";
import InterviewChat from "@/components/apply/InterviewChat";
import AttachmentsPanel from "@/components/apply/AttachmentsPanel";
import TagListEditor from "@/components/apply/TagListEditor";

const STATUS_LABEL: Record<ApplicationView["status"], string> = {
  draft: "Draft",
  submitted: "Submitted — awaiting review",
  shortlisted: "Shortlisted",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  declined: "Not this time",
  withdrawn: "Withdrawn",
};

const STEPS: Step[] = [
  { id: "about", label: "About you", icon: UserIcon },
  { id: "alfred", label: "Alfred", icon: MessageCircleIcon },
  { id: "work", label: "Your work", icon: UploadIcon },
  { id: "review", label: "Review", icon: CircleCheckIcon },
];

export default function ApplicationPortal({ token }: { token: string }) {
  const [app, setApp] = useState<ApplicationView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showAccepted, markAcceptedSeen] = useFirstTime(app?.status === "accepted" ? `accepted:${app.reference}` : null);
  const [canSubmitInterview, setCanSubmitInterview] = useState(false);
  const toast = useToast();

  const load = async () => {
    try {
      setApp(await getMyApplication(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load your application.");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (error) {
    return (
      <div className="rounded-md border border-ink bg-pink/20 p-6 text-center">
        <p className="font-semibold">{error}</p>
        <Link href="/apply/status" className="mt-3 inline-block font-semibold text-ink underline underline-offset-4">
          Ask for a new link
        </Link>
      </div>
    );
  }
  if (!app) return <p className="text-sm text-muted">Loading your application…</p>;

  const locked = !app.editable;
  const canSubmit = app.interests.length > 0 && canSubmitInterview;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      setApp(await submitApplication(token));
      setCelebrate(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't submit that.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("Withdraw your application? You can apply again next window.")) return;
    try {
      setApp(await withdrawApplication(token));
      toast.success("Withdrawn.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't withdraw that.");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {app.window.is_test && <TestBanner />}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-ink bg-white p-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Reference {app.reference}</p>
          <p className="text-lg font-bold">{STATUS_LABEL[app.status]}</p>
        </div>
        {app.status === "draft" && app.window.state === "closed" && (
          <p className="text-sm text-muted">Applications are closed right now. Your draft is saved for the next window.</p>
        )}
      </div>

      {app.clarifications.filter((c) => c.status === "open").map((c) => (
        <ClarificationCard key={c.id} id={c.id} question={c.question} token={token} onAnswered={load} />
      ))}

      {showAccepted && (
        <CelebrationCard lottie="/lottie/accepted.json" title={`Welcome to TeenovateX, ${app.full_name.trim().split(/\s+/)[0] || "there"}!`} onClose={markAcceptedSeen}>
          Your application was accepted.
        </CelebrationCard>
      )}

      {app.status === "accepted" && app.guardian?.required && (
        <GuardianPanel token={token} status={app.guardian.status} />
      )}

      {celebrate && app.status === "submitted" && (
        <SubmittedCelebration name={app.full_name} reference={app.reference} decisionDate={app.window.decisions_publish_at} />
      )}

      {!locked ? (
        <>
          <StepRail steps={STEPS} current={step} />

          {step === 0 && <AboutYouForm app={app} token={token} onSaved={setApp} />}
          {step === 1 && <InterviewChat token={token} locked={locked} onProgress={setCanSubmitInterview} />}
          {step === 2 && <AttachmentsPanel token={token} locked={locked} />}
          {step === 3 && <ReviewStep app={app} token={token} onEdit={setStep} onSubmit={handleSubmit} submitting={submitting} canSubmit={canSubmit} />}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <button type="button" onClick={() => setStep((n) => Math.max(0, n - 1))} disabled={step === 0} className="btn-secondary text-sm disabled:opacity-40">
              <ArrowLeftIcon size={16} /> Back
            </button>
            <button type="button" onClick={handleWithdraw} className="text-sm font-semibold text-muted underline underline-offset-4">
              Withdraw
            </button>
            {step < STEPS.length - 1 && (
              <button type="button" onClick={() => setStep((n) => Math.min(STEPS.length - 1, n + 1))} className="btn text-sm">
                Next <ArrowRightIcon size={16} />
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="rounded-md border border-ink bg-cream p-4 text-sm text-muted">
          This application is being reviewed and can no longer be edited.
        </p>
      )}
    </div>
  );
}

function AboutYouForm({ app, token, onSaved }: { app: ApplicationView; token: string; onSaved: (a: ApplicationView) => void }) {
  const [interests, setInterests] = useState(app.interests);
  const [currentSkills, setCurrentSkills] = useState(app.current_skills);
  const [learningGoals, setLearningGoals] = useState(app.learning_goals);
  const [skillLevel, setSkillLevel] = useState(app.skill_level ?? "");
  const [skillNote, setSkillNote] = useState(app.skill_level_note ?? "");
  const [portfolio, setPortfolio] = useState(app.portfolio_url ?? "");
  const [github, setGithub] = useState(app.github_url ?? "");
  const [linkedin, setLinkedin] = useState(app.linkedin_url ?? "");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateDraft(token, {
        interests,
        current_skills: currentSkills,
        learning_goals: learningGoals,
        skill_level: skillLevel || null,
        skill_level_note: skillNote || null,
        portfolio_url: portfolio || null,
        github_url: github || null,
        linkedin_url: linkedin || null,
      });
      onSaved(updated);
      toast.success("Saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save that.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-md border border-ink bg-white p-4">
      <TagListEditor label="Interests" value={interests} onChange={setInterests} placeholder="e.g. robotics, web dev" />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" htmlFor="skill_level">Skill level</label>
        <select id="skill_level" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} className="w-full rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-rose">
          <option value="">Not sure yet</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <textarea
        value={skillNote}
        onChange={(e) => setSkillNote(e.target.value)}
        placeholder="Anything else about where you're at (optional)"
        rows={2}
        maxLength={600}
        className="w-full rounded-md border border-ink bg-cream px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-rose"
      />
      <TagListEditor label="Things you can already do" value={currentSkills} onChange={setCurrentSkills} placeholder="e.g. built a website" />
      <TagListEditor label="What you want to learn" value={learningGoals} onChange={setLearningGoals} placeholder="e.g. machine learning" />
      <div className="grid gap-3 sm:grid-cols-3">
        <LinkField label="Portfolio" value={portfolio} onChange={setPortfolio} />
        <LinkField label="GitHub" value={github} onChange={setGithub} />
        <LinkField label="LinkedIn" value={linkedin} onChange={setLinkedin} />
      </div>
      <button type="button" onClick={save} disabled={saving} className="btn self-start disabled:opacity-60">
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function LinkField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" className="w-full rounded-md border border-ink bg-cream px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose" />
    </div>
  );
}

function ClarificationCard({ id, question, token, onAnswered }: { id: string; question: string; token: string; onAnswered: () => void }) {
  const [response, setResponse] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const send = async () => {
    if (!response.trim()) return;
    setBusy(true);
    try {
      await replyToClarification(token, id, response.trim());
      toast.success("Sent to your reviewer.");
      onAnswered();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-ink bg-yellow/30 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">A reviewer has a question</p>
      <p className="mt-1 font-medium">{question}</p>
      <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={2} className="mt-2 w-full rounded-md border border-ink bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
      <button type="button" onClick={send} disabled={busy || !response.trim()} className="btn-secondary mt-2 text-sm disabled:opacity-60">
        Send reply
      </button>
    </div>
  );
}

function GuardianPanel({ token, status }: { token: string; status: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(status !== "not_requested");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const request = async () => {
    if (!email.trim()) return;
    setBusy(true);
    try {
      await requestGuardian(token, email.trim());
      setSent(true);
      toast.success("Sent to your parent or guardian.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-md border border-ink bg-pink/20 p-4">
      <p className="flex items-center gap-2 font-semibold"><ShieldCheckIcon size={16} /> Congratulations — you're in!</p>
      <p className="mt-1 text-sm text-muted">Because you're under 16, a parent or guardian needs to confirm before your account is created.</p>
      {sent || status !== "not_requested" ? (
        <p className="mt-2 text-sm font-medium">
          {status === "confirmed" ? "Confirmed — you can create your account." : status === "withdrawn" ? "Your guardian withdrew consent. Ask them to try again." : "Waiting on your parent or guardian."}
        </p>
      ) : (
        <div className="mt-2 flex gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Parent/guardian email" className="flex-1 rounded-md border border-ink bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
          <button type="button" onClick={request} disabled={busy} className="btn-secondary text-sm disabled:opacity-60">Send</button>
        </div>
      )}
    </div>
  );
}
