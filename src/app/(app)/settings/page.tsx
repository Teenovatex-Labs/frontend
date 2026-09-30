"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { ApiError, settingsApi, uploadsApi } from "@/lib/api";
import { accountApi, petApi, safetyApi } from "@/lib/services";
import { alfredController } from "@/lib/alfred";
import { keys, timeAgo } from "@/lib/labs";
import { fieldErrors, newPasswordSchema } from "@/lib/validation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Dialog from "@/components/ui/Dialog";
import Skeleton from "@/components/ui/Skeleton";
import FormField from "@/components/FormField";
import TextAreaField from "@/components/TextAreaField";
import GoogleAuthCard from "@/components/auth/GoogleAuthCard";
import { useToast } from "@/components/ui/Toast";

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <Card className="p-5 md:p-7">
      <h2 className="text-[22px] tracking-[-0.02em]">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative mt-1 h-6 w-11 shrink-0 rounded-full border border-ink bg-cream transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:border after:border-ink after:bg-ink after:transition-transform peer-checked:bg-pink peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-rose"
      />
    </label>
  );
}

const BIO_MAX = 200;

function ProfileSection() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(user?.full_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [links, setLinks] = useState({
    twitter: user?.social_links?.twitter ?? "",
    github: user?.social_links?.github ?? "",
    linkedin: user?.social_links?.linkedin ?? "",
    website: user?.social_links?.website ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => accountApi.update({ full_name: name.trim(), bio, social_links: links }),
    onSuccess: async () => {
      await refreshUser();
      toast.success("Profile saved.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't save. Try again."),
  });
  const photo = useMutation({
    mutationFn: (f: File) => uploadsApi.avatar(f),
    onSuccess: async () => {
      await refreshUser();
      toast.success("Photo updated.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't upload that photo."),
  });

  if (!user) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Enter your full name";
    for (const [k, v] of Object.entries(links)) {
      if (v && !/^https?:\/\//i.test(v)) errs[k] = "Start with https://";
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) save.mutate();
  };

  const pickPhoto = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error("That needs to be an image.");
    if (f.size > 5 * 1024 * 1024) return toast.error("Keep photos under 5MB.");
    photo.mutate(f);
  };

  return (
    <Section title="Your profile" hint="What other Teenovators see.">
      <div className="mb-6 flex items-center gap-4">
        <Avatar name={user.username} src={user.avatar_url} size={72} />
        <div>
          <button type="button" className="btn-secondary btn-sm" onClick={() => file.current?.click()} disabled={photo.isPending}>
            {photo.isPending ? "Uploading…" : "Change photo"}
          </button>
          <input ref={file} type="file" accept="image/*" aria-label="Choose a new profile photo" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
          <p className="mt-1.5 text-xs text-muted">JPG or PNG, up to 5MB.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField label="Full name" name="full_name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
        <div>
          <p className="text-sm font-medium">Username</p>
          <p className="mt-1.5 rounded-md border border-line bg-cream/60 px-4 py-3 text-[15px] text-muted">@{user.username}</p>
        </div>
        <TextAreaField label="Bio" name="bio" rows={3} maxLength={BIO_MAX} value={bio} onChange={(e) => setBio(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          {(["twitter", "github", "linkedin", "website"] as const).map((k) => (
            <FormField
              key={k}
              label={k === "twitter" ? "X (Twitter)" : k.charAt(0).toUpperCase() + k.slice(1)}
              name={k}
              inputMode="url"
              value={links[k]}
              onChange={(e) => setLinks((l) => ({ ...l, [k]: e.target.value }))}
              error={errors[k]}
            />
          ))}
        </div>
        <button type="submit" className="btn self-start disabled:opacity-60" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </Section>
  );
}

function PreferencesSection() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const s = user?.settings;
  const [prefs, setPrefs] = useState({
    email_notifications: s?.email_notifications ?? true,
    vote_alerts: s?.vote_alerts ?? true,
    contest_updates: s?.contest_updates ?? true,
    public_profile: s?.public_profile ?? true,
  });

  const save = useMutation({
    mutationFn: (patch: Partial<typeof prefs>) => accountApi.notifications(patch),
    onError: (e, patch) => {
      // Put the switch back where the server still has it.
      setPrefs((p) => ({ ...p, ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, !v])) }));
      toast.error(e instanceof ApiError ? e.message : "Couldn't save that.");
    },
    onSuccess: () => void refreshUser(),
  });
  const set = (key: keyof typeof prefs) => (v: boolean) => {
    setPrefs((p) => ({ ...p, [key]: v }));
    save.mutate({ [key]: v });
  };

  return (
    <Section title="Notifications and privacy">
      <div className="divide-y divide-line">
        <Toggle label="Vote alerts" hint="Tell me when someone votes for my lab." checked={prefs.vote_alerts} onChange={set("vote_alerts")} />
        <Toggle label="Updates and events" hint="News about events and the community." checked={prefs.contest_updates} onChange={set("contest_updates")} />
        <Toggle label="Emails" hint="Send me email as well as in-app notifications." checked={prefs.email_notifications} onChange={set("email_notifications")} />
        <Toggle label="Public profile" hint="Let other members see your profile and labs. Turn off to keep it private." checked={prefs.public_profile} onChange={set("public_profile")} />
      </div>
    </Section>
  );
}

function AlfredSection() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const status = useQuery({ queryKey: ["pet", "status"], queryFn: petApi.status });
  const [on, setOn] = useState(user?.settings?.ai_chat ?? false);

  const save = useMutation({
    mutationFn: (v: boolean) => accountApi.notifications({ ai_chat: v }),
    onSuccess: () => void refreshUser(),
    onError: (e, v) => {
      setOn(!v);
      toast.error(e instanceof ApiError ? e.message : "Couldn't save that.");
    },
  });

  return (
    <Section title="Alfred's AI brain" hint="Optional. Off unless you turn it on.">
      <div className="space-y-3 text-sm text-muted">
        <p>
          Alfred already understands a fixed list of commands, and that all happens without sending anything anywhere. If you turn this on, then
          when you type something he doesn&rsquo;t recognise, <strong className="text-ink">that message, your username and the page you&rsquo;re on</strong> are
          sent to an AI service (Google Gemini or Groq) so it can work out what you mean.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>We never send your email, other people&rsquo;s messages, or anything private.</li>
          <li>Those services are outside TeenovateX and have their own privacy rules. Free plans may use what they receive to improve their products, so don&rsquo;t type anything personal to Alfred.</li>
          <li>Alfred can only suggest things from a short list, and always asks before he changes anything.</li>
          <li>You can turn this off any time. If you&rsquo;re under 16, please ask a parent or guardian first.</li>
        </ul>
      </div>
      <div className="mt-4">
        <Toggle
          label="Let Alfred use AI"
          hint={
            status.data && !status.data.available
              ? "Not available right now. Alfred's quick commands still work."
              : status.data
                ? `You have ${status.data.remaining_today} of ${status.data.daily_limit} AI chats left today.`
                : "Off by default."
          }
          checked={on}
          onChange={(v) => {
            setOn(v);
            save.mutate(v);
          }}
        />
      </div>
    </Section>
  );
}

// What Alfred has done for you, what he remembers, and which permissions you've given him.
function AlfredDataSection() {
  const qc = useQueryClient();
  const toast = useToast();
  const actions = useQuery({ queryKey: ["pet", "actions"], queryFn: petApi.actions });
  const memories = useQuery({ queryKey: ["pet", "memories"], queryFn: petApi.memories });
  const [always, setAlways] = useState<string[]>(() => alfredController.alwaysAllowed());

  const undo = useMutation({
    mutationFn: petApi.undo,
    onSuccess: () => {
      toast.success("Undone.");
      void qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Couldn't undo that."),
  });
  const forget = useMutation({ mutationFn: petApi.forget, onSuccess: () => qc.invalidateQueries({ queryKey: ["pet", "memories"] }) });
  const forgetAll = useMutation({ mutationFn: petApi.forgetAll, onSuccess: () => qc.invalidateQueries({ queryKey: ["pet", "memories"] }) });

  const when = (iso: string) => timeAgo(iso);
  return (
    <Section title="What Alfred did and remembers" hint="You're always in charge. Undo works for 15 minutes.">
      <h3 className="text-sm font-semibold">Recent things Alfred did for you</h3>
      {actions.isPending ? (
        <Skeleton className="mt-2 h-10 w-full" />
      ) : !actions.data || actions.data.actions.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nothing yet. When you ask Alfred to follow, vote or clear notifications, it shows up here.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {actions.data.actions.slice(0, 8).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0">
                <span className={`block truncate ${a.undone ? "text-muted line-through" : ""}`}>{a.summary}</span>
                <span className="block text-xs text-muted">{when(a.created_at)}{a.undone ? " · undone" : ""}</span>
              </span>
              {a.can_undo && (
                <button type="button" className="shrink-0 text-rose underline underline-offset-4" disabled={undo.isPending} onClick={() => undo.mutate(a.id)}>
                  Undo
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-6 text-sm font-semibold">Things Alfred remembers</h3>
      {memories.isPending ? (
        <Skeleton className="mt-2 h-10 w-full" />
      ) : !memories.data || memories.data.memories.length === 0 ? (
        <p className="mt-2 text-sm text-muted">Nothing. Tell him “remember that I prefer dark mode” and it will show here.</p>
      ) : (
        <>
          <ul className="mt-2 divide-y divide-line">
            {memories.data.memories.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 break-words">{m.text}</span>
                <button type="button" className="shrink-0 text-rose underline underline-offset-4" onClick={() => forget.mutate(m.id)}>Forget</button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-secondary btn-sm mt-3" onClick={() => forgetAll.mutate()}>Forget everything</button>
        </>
      )}

      <h3 className="mt-6 text-sm font-semibold">Permissions you've given him</h3>
      {always.length === 0 ? (
        <p className="mt-2 text-sm text-muted">None. Alfred asks you before he changes anything.</p>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted">You chose &ldquo;Always allow&rdquo; for {always.length === 1 ? "one thing" : `${always.length} things`} on this device, so he does {always.length === 1 ? "it" : "them"} without asking.</p>
          <button
            type="button"
            className="btn-secondary btn-sm mt-3"
            onClick={() => {
              alfredController.revokeAlwaysAllowed();
              setAlways([]);
              toast.success("Alfred will ask first again.");
            }}
          >
            Make him ask again
          </button>
        </>
      )}
    </Section>
  );
}

function PasswordSection() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: () => settingsApi.setPassword({ ...(user?.has_password ? { current_password: current } : {}), new_password: next }),
    onSuccess: async () => {
      await refreshUser();
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(user?.has_password ? "Password updated." : "Password added.");
    },
    onError: (e) => setErrors({ current: e instanceof ApiError ? e.message : "Couldn't update your password." }),
  });

  if (!user) return null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = newPasswordSchema.safeParse({ password: next, confirm_password: confirm });
    const errs = fieldErrors(parsed);
    if (user.has_password && !current) errs.current = "Enter your current password";
    if (parsed.success && next !== confirm) errs.confirm_password = "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length === 0) save.mutate();
  };

  return (
    <Section
      title={user.has_password ? "Change your password" : "Add a password"}
      hint={user.has_password ? undefined : "You signed up with Google. Add a password so you can log in either way."}
    >
      <form onSubmit={onSubmit} noValidate className="flex max-w-[420px] flex-col gap-4">
        {user.has_password && (
          <FormField label="Current password" type="password" name="current" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" error={errors.current} />
        )}
        <FormField label="New password" type="password" name="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" error={errors.password} />
        <FormField label="Confirm new password" type="password" name="confirm_password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" error={errors.confirm_password} />
        <button type="submit" className="btn self-start disabled:opacity-60" disabled={save.isPending}>
          {save.isPending ? "Saving…" : user.has_password ? "Update password" : "Add password"}
        </button>
      </form>
    </Section>
  );
}

function DevicesSection() {
  const qc = useQueryClient();
  const toast = useToast();
  const sessions = useQuery({ queryKey: keys.sessions, queryFn: accountApi.sessions });
  const revoke = useMutation({
    mutationFn: accountApi.revokeSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sessions }),
    onError: () => toast.error("Couldn't sign that device out."),
  });

  return (
    <Section title="Where you're signed in" hint="Sign out any device you don't recognise.">
      {sessions.isPending ? (
        <Skeleton className="h-14 w-full" />
      ) : sessions.isError ? (
        <p className="text-sm text-muted">Couldn&rsquo;t load your devices.</p>
      ) : (
        <ul className="divide-y divide-line">
          {sessions.data.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 py-3">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{s.device_info ?? "Unknown device"}</span>
                <span className="block text-xs text-muted">
                  Active {timeAgo(s.last_active)}
                  {s.ip ? ` · ${s.ip}` : ""}
                </span>
              </span>
              <button type="button" className="text-sm text-rose underline underline-offset-4" onClick={() => revoke.mutate(s.id)} disabled={revoke.isPending}>
                Sign out
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function BlockedSection() {
  const qc = useQueryClient();
  const toast = useToast();
  const blocks = useQuery({ queryKey: keys.blocks, queryFn: safetyApi.blocks });
  const unblock = useMutation({
    mutationFn: safetyApi.unblock,
    onSuccess: () => qc.invalidateQueries(),
    onError: () => toast.error("Couldn't unblock them."),
  });

  return (
    <Section title="Blocked members" hint="You won't see each other's posts or comments.">
      {blocks.isPending ? (
        <Skeleton className="h-10 w-full" />
      ) : !blocks.data || blocks.data.blocks.length === 0 ? (
        <p className="text-sm text-muted">You haven&rsquo;t blocked anyone.</p>
      ) : (
        <ul className="divide-y divide-line">
          {blocks.data.blocks.map((b) => (
            <li key={b.username} className="flex items-center justify-between gap-4 py-3">
              <span className="flex items-center gap-3"><Avatar name={b.username} src={b.avatar_url} size={32} />@{b.username}</span>
              <button type="button" className="text-sm text-rose underline underline-offset-4" onClick={() => unblock.mutate(b.username)} disabled={unblock.isPending}>Unblock</button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function DangerSection() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();

  const remove = useMutation({
    mutationFn: (data: { password?: string; id_token?: string }) => accountApi.deleteAccount(data),
    onSuccess: async () => {
      toast.success("Your account is deleted.");
      await logout();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "Couldn't delete your account."),
  });

  if (!user) return null;

  return (
    <Section title="Delete your account" hint="This removes your profile, labs, votes and points for good.">
      <button type="button" className="btn-secondary" onClick={() => { setOpen(true); setError(undefined); }}>
        Delete my account
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Are you sure?">
        <p className="text-sm text-muted">There&rsquo;s no undo. {user.has_password ? "Enter your password to confirm." : "Confirm with Google to continue."}</p>
        {user.has_password ? (
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!password) return setError("Enter your password");
              remove.mutate({ password });
            }}
          >
            <FormField label="Password" type="password" name="delete_password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} autoFocus />
            <div className="flex gap-3">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Keep my account</button>
              <button type="submit" className="btn" disabled={remove.isPending}>{remove.isPending ? "Deleting…" : "Delete everything"}</button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <GoogleAuthCard
              text="signin_with"
              onSuccess={(c) => c.credential && remove.mutate({ id_token: c.credential })}
              onError={() => setError("Google confirmation failed.")}
            />
            {error && <p className="mt-3 text-sm text-rose">{error}</p>}
            <button type="button" className="btn-secondary mt-4" onClick={() => setOpen(false)}>Keep my account</button>
          </div>
        )}
      </Dialog>
    </Section>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-10 md:px-10 md:py-14">
      <PageHeader eyebrow="Settings" title="Make it" accent="yours." />
      <div className="mt-8 flex flex-col gap-7">
        <ProfileSection />
        <PreferencesSection />
        <AlfredSection />
        <AlfredDataSection />
        <PasswordSection />
        <DevicesSection />
        <BlockedSection />
        <DangerSection />
      </div>
    </main>
  );
}
