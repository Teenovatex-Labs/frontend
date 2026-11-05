"use client";

import { useEffect, useState } from "react";
import { CircleCheckIcon } from "@animateicons/react/lucide/circle-check-icon";
import { getInterview, listAttachments, type ApplicationView, type Attachment, type InterviewState } from "@/lib/admissions";

type Props = {
  app: ApplicationView;
  token: string;
  onEdit: (step: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  canSubmit: boolean;
};

/** Everything the applicant has said, in one place, each part with a way back to edit it. */
export default function ReviewStep({ app, token, onEdit, onSubmit, submitting, canSubmit }: Props) {
  const [interview, setInterview] = useState<InterviewState | null>(null);
  const [files, setFiles] = useState<Attachment[] | null>(null);

  useEffect(() => {
    getInterview(token).then(setInterview).catch(() => setInterview(null));
    listAttachments(token).then(setFiles).catch(() => setFiles(null));
  }, [token]);

  const answered = interview?.questions.filter((q) => q.answer) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">Read it through. Anything that looks wrong, you can change before you send it.</p>

      <Section title="About you" onEdit={() => onEdit(0)}>
        <Row label="Name" value={app.full_name} />
        <Row label="Where" value={[app.city, app.country].filter(Boolean).join(", ")} />
        <Row label="School" value={[app.school, app.education_level].filter(Boolean).join(" · ")} />
        <Row label="Interests" value={app.interests.join(", ")} />
        <Row label="Skill level" value={[app.skill_level, app.skill_level_note].filter(Boolean).join(" — ")} />
        <Row label="Can already do" value={app.current_skills.join(", ")} />
        <Row label="Wants to learn" value={app.learning_goals.join(", ")} />
        <Row label="Links" value={[app.portfolio_url, app.github_url, app.linkedin_url].filter(Boolean).join(" · ")} />
      </Section>

      <Section title="Your chat with Alfred" onEdit={() => onEdit(1)}>
        {interview === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : answered.length === 0 ? (
          <p className="text-sm text-muted">No answers yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {answered.map((q) => (
              <li key={q.position} className="text-sm">
                <p className="font-semibold">{q.question}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-muted">{q.answer}</p>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Your work" onEdit={() => onEdit(2)}>
        {files === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-muted">Nothing added. That&apos;s fine, it&apos;s optional.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm">
            {files.map((f) => (
              <li key={f.id}>{f.kind === "link" ? f.url : f.filename ?? "Image"}</li>
            ))}
          </ul>
        )}
      </Section>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <p className="text-sm">
          <strong>Submitting is not an acceptance.</strong> Results come out together on the decision date, and you can edit until a reviewer starts.
        </p>
        <button type="button" onClick={onSubmit} disabled={!canSubmit || submitting || app.window.state !== "open"} className="btn self-start disabled:opacity-50">
          <CircleCheckIcon size={16} /> {submitting ? "Sending…" : app.status === "draft" ? "Submit application" : "Resubmit"}
        </button>
        {!canSubmit && <p className="text-xs text-muted">Pick at least one interest and finish talking with Alfred first.</p>}
        {app.window.state !== "open" && <p className="text-xs text-muted">Applications are closed right now, so you can&apos;t submit yet.</p>}
      </div>
    </div>
  );
}

function Section({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-ink bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-bold">{title}</h3>
        <button type="button" onClick={onEdit} className="text-sm font-semibold underline underline-offset-4">
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <p className="text-sm">
      <span className="font-semibold">{label}: </span>
      <span className="text-muted">{value}</span>
    </p>
  );
}
