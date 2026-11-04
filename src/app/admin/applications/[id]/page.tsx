"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { admissionsAdminApi, type ApplicationDetail } from "@/lib/services";
import { keys, timeAgo } from "@/lib/labs";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";

const CRITERIA_LABEL: Record<string, string> = {
  curiosity_creativity: "Curiosity & creativity",
  initiative_action: "Initiative & action",
  growth_mindset: "Growth mindset",
  collaboration_community: "Collaboration & community",
  motivation_commitment: "Motivation & commitment",
  problem_solving_impact: "Problem-solving impact",
};

export default function ApplicationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();

  const app = useQuery({ queryKey: keys.admin("application", id), queryFn: () => admissionsAdminApi.get(id) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });
  const fail = (e: unknown) => toast.error(e instanceof ApiError ? e.message : "That didn't work.");

  const claim = useMutation({ mutationFn: () => admissionsAdminApi.claim(id), onSuccess: () => { toast.success("Claimed."); void refresh(); }, onError: fail });

  const [summary, setSummary] = useState<string | null>(null);
  const summarise = useMutation({ mutationFn: () => admissionsAdminApi.summarise(id), onSuccess: (r) => setSummary(r.summary), onError: fail });

  // undefined = not chosen yet, null = insufficient evidence. There is no default, so nobody is nudged towards a middle score.
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [recommendation, setRecommendation] = useState<"accept" | "decline" | "waitlist" | "shortlist">("shortlist");
  const [note, setNote] = useState("");
  const review = useMutation({
    mutationFn: (payload: Record<string, number | null>) => admissionsAdminApi.review(id, { scores: payload, recommendation, note: note || null }),
    onSuccess: () => { toast.success("Review saved."); void refresh(); },
    onError: fail,
  });

  const [clarQ, setClarQ] = useState("");
  const askClar = useMutation({
    mutationFn: () => admissionsAdminApi.askClarification(id, clarQ.trim()),
    onSuccess: () => { toast.success("Sent."); setClarQ(""); void refresh(); },
    onError: fail,
  });

  const [decisionNote, setDecisionNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const decide = useMutation({
    mutationFn: (decision: "accept" | "decline" | "waitlist" | "shortlist") => admissionsAdminApi.decide(id, { decision, note: decisionNote || null, feedback: feedback || null }),
    onSuccess: () => { toast.success("Decision saved."); void refresh(); },
    onError: fail,
  });

  if (app.isPending) return <Skeleton className="h-96 w-full" />;
  if (app.isError || !app.data) return <p className="text-muted">Couldn&rsquo;t load that application.</p>;

  const a: ApplicationDetail = app.data;
  const isMine = a.claimed_by === me?.id;
  const canReview = isMine || a.second_reviewer_id === me?.id;
  const myReview = a.reviews.find((r) => r.reviewer_id === me?.id);
  const chosen = (c: string): number | null | undefined => (c in scores ? scores[c] : myReview?.scores[c]);
  const complete = a.criteria.every((c) => chosen(c) !== undefined);

  return (
    <>
      <Link href="/admin/applications" className="text-sm text-muted underline underline-offset-4">← Back to applications</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] tracking-[-0.03em] md:text-[36px]">{a.full_name}</h1>
          <p className="text-sm text-muted">{a.reference} · {a.status.replace("_", " ")} · age {a.age} · {a.city}, {a.country}</p>
        </div>
        {!a.claimed_by && (
          <button onClick={() => claim.mutate()} disabled={claim.isPending} className="btn disabled:opacity-60">Claim this review</button>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-md border border-ink bg-white p-4">
            <h2 className="font-bold">Profile</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <Field label="Email" value={a.email} />
              <Field label="WhatsApp" value={a.whatsapp} />
              <Field label="School" value={a.school ?? "—"} />
              <Field label="Education" value={a.education_level} />
              <Field label="Skill level" value={a.skill_level ?? "Not sure"} />
            </dl>
            {a.skill_level_note && <p className="mt-2 text-sm text-muted">{a.skill_level_note}</p>}
            <TagRow label="Interests" items={a.interests} />
            <TagRow label="Current skills" items={a.current_skills} />
            <TagRow label="Learning goals" items={a.learning_goals} />
            <div className="mt-3 flex gap-3 text-sm">
              {a.portfolio_url && <a href={a.portfolio_url} target="_blank" rel="noreferrer" className="underline">Portfolio</a>}
              {a.github_url && <a href={a.github_url} target="_blank" rel="noreferrer" className="underline">GitHub</a>}
              {a.linkedin_url && <a href={a.linkedin_url} target="_blank" rel="noreferrer" className="underline">LinkedIn</a>}
            </div>
          </section>

          <section className="rounded-md border border-ink bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Alfred&rsquo;s questions</h2>
              <button onClick={() => summarise.mutate()} disabled={summarise.isPending} className="btn-secondary text-xs disabled:opacity-60">
                {summarise.isPending ? "Reading…" : "Machine-written summary"}
              </button>
            </div>
            {summary && <p className="mt-2 rounded-md border border-ink bg-yellow/30 p-3 text-sm">{summary}</p>}
            <div className="mt-3 flex flex-col gap-3">
              {a.answers.map((qa) => (
                <div key={qa.id}>
                  <p className="text-sm font-medium">{qa.question}</p>
                  <p className="text-sm text-muted">{qa.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {a.attachments.length > 0 && (
            <section className="rounded-md border border-ink bg-white p-4">
              <h2 className="font-bold">Attachments</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.attachments.map((at) => (
                  <AttachmentLink key={at.id} applicationId={id} attachment={at} />
                ))}
              </div>
            </section>
          )}

          <section className="rounded-md border border-ink bg-white p-4">
            <h2 className="font-bold">Clarifications</h2>
            {a.clarifications.map((c) => (
              <div key={c.id} className="mt-2 rounded-md border border-line p-3 text-sm">
                <p className="font-medium">{c.question}</p>
                <p className="text-muted">{c.response ?? `Awaiting reply (due ${timeAgo(c.due_at)})`}</p>
              </div>
            ))}
            {canReview && (
              <div className="mt-3 flex gap-2">
                <input value={clarQ} onChange={(e) => setClarQ(e.target.value)} placeholder="Ask the applicant something" className="flex-1 rounded-md border border-ink bg-cream px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose" />
                <button onClick={() => askClar.mutate()} disabled={askClar.isPending || !clarQ.trim()} className="btn-secondary text-sm disabled:opacity-60">Ask</button>
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {canReview && (
            <section className="rounded-md border border-ink bg-white p-4">
              <h2 className="font-bold">{myReview ? "Your review (saved)" : "Your review"}</h2>
              {a.rubric && (
                <details className="mt-2 text-sm">
                  <summary className="cursor-pointer underline underline-offset-4">How to rate</summary>
                  <div className="mt-2 flex flex-col gap-2 text-xs text-muted">
                    {a.rubric.ratings.map((r) => <p key={r.rating}><b className="text-ink">{r.rating} · {r.label}.</b> {r.meaning}</p>)}
                    <p><b className="text-ink">Insufficient evidence.</b> {a.rubric.insufficient_evidence}</p>
                    {a.criteria.map((c) => (
                      <p key={c}><b className="text-ink">{a.rubric!.criteria[c]?.title}.</b> {a.rubric!.criteria[c]?.lookFor} <i>{a.rubric!.criteria[c]?.notThis}</i></p>
                    ))}
                  </div>
                </details>
              )}
              <div className="mt-3 flex flex-col gap-3">
                {a.criteria.map((c) => (
                  <label key={c} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {a.rubric?.criteria[c]?.title ?? CRITERIA_LABEL[c] ?? c}
                      {a.rubric?.weights[c] ? <span className="ml-1 text-xs text-muted">({a.rubric.weights[c]}%)</span> : null}
                    </span>
                    <select
                      value={chosen(c) === undefined ? "" : chosen(c) === null ? "none" : String(chosen(c))}
                      onChange={(e) => setScores((s) => ({ ...s, [c]: e.target.value === "none" ? null : Number(e.target.value) }))}
                      className="rounded-md border border-ink bg-cream px-2 py-1"
                    >
                      <option value="" disabled>Choose…</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} · {a.rubric?.ratings[n - 1]?.label ?? ""}</option>)}
                      <option value="none">Insufficient evidence</option>
                    </select>
                  </label>
                ))}
                <select value={recommendation} onChange={(e) => setRecommendation(e.target.value as typeof recommendation)} className="rounded-md border border-ink bg-cream px-3 py-2 text-sm">
                  <option value="shortlist">Shortlist</option>
                  <option value="accept">Accept</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="decline">Decline</option>
                </select>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note (optional)" rows={2} className="rounded-md border border-ink bg-cream px-3 py-2 text-sm" />
                <button onClick={() => review.mutate(Object.fromEntries(a.criteria.map((c) => [c, chosen(c) ?? null])))} disabled={review.isPending || !complete} className="btn text-sm disabled:opacity-60">{review.isPending ? "Saving…" : "Save review"}</button>
              </div>
            </section>
          )}

          {a.reviews.length > 0 && (
            <section className="rounded-md border border-ink bg-white p-4">
              <h2 className="font-bold">Reviews so far</h2>
              {a.reviews_disagree && <p className="mt-1 text-sm font-semibold text-rose">Reviewers disagree — worth a second look.</p>}
              {a.reviews.map((r) => (
                <div key={r.id} className="mt-2 text-sm">
                  <p className="font-medium">{r.kind === "first" ? "First reviewer" : "Second reviewer"}: {r.recommendation} (score {r.weighted_score ?? "not rated"})</p>
                  {r.note && <p className="text-muted">{r.note}</p>}
                </div>
              ))}
            </section>
          )}

          {isMine && (
            <section className="rounded-md border border-ink bg-pink/20 p-4">
              <h2 className="font-bold">Decide</h2>
              <textarea value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Internal note (optional)" rows={2} className="mt-2 w-full rounded-md border border-ink bg-cream px-3 py-2 text-sm" />
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback if declining (optional, applicant may see this)" rows={2} className="mt-2 w-full rounded-md border border-ink bg-cream px-3 py-2 text-sm" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => decide.mutate("accept")} disabled={decide.isPending} className="btn-secondary text-xs disabled:opacity-60">Accept</button>
                <button onClick={() => decide.mutate("shortlist")} disabled={decide.isPending} className="btn-secondary text-xs disabled:opacity-60">Shortlist</button>
                <button onClick={() => decide.mutate("waitlist")} disabled={decide.isPending} className="btn-secondary text-xs disabled:opacity-60">Waitlist</button>
                <button onClick={() => decide.mutate("decline")} disabled={decide.isPending} className="btn-secondary text-xs disabled:opacity-60">Decline</button>
              </div>
              <p className="mt-2 text-xs text-muted">Decisions stay private until the window&rsquo;s release date.</p>
            </section>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TagRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((i) => <span key={i} className="rounded-full border border-ink bg-cream px-2 py-0.5 text-xs">{i}</span>)}
      </div>
    </div>
  );
}

function AttachmentLink({ applicationId, attachment }: { applicationId: string; attachment: { id: string; kind: "image" | "link"; url: string; filename: string | null } }) {
  const [url, setUrl] = useState<string | null>(attachment.kind === "link" ? attachment.url : null);
  const load = async () => {
    const r = await admissionsAdminApi.reviewerLink(applicationId, attachment.id);
    setUrl(r.url);
  };
  if (attachment.kind === "link") return <a href={attachment.url} target="_blank" rel="noreferrer" className="rounded-md border border-ink bg-cream px-3 py-1.5 text-sm underline">{attachment.url}</a>;
  return url ? (
    <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="" className="h-20 w-20 rounded-md border border-ink object-cover" /></a>
  ) : (
    <button onClick={load} className="h-20 w-20 rounded-md border border-ink bg-cream text-xs">View image</button>
  );
}
