// Carries out what Alfred understood (see alfred-intents.ts for how he understands it).
//
// An intent becomes either an answer (reads are free) or an action. Anything that CHANGES something
// asks first with a permission card, and works with no AI behind it.

import { ApiError } from "@/lib/api";
import { PAGES, interpret, type Intent } from "@/lib/alfred-intents";
import { eventsApi, inboxApi, labsApi, labsDeepApi, petApi, rewardsApi, votesApi } from "@/lib/services";

// --- running an intent -----------------------------------------------------------------------

export type CommandContext = {
  /** The signed-in member. */
  me: { username: string; points: number; streak: number; rank?: number; level: { level: number; title: string; points: number; next_at: number | null } };
  navigate: (path: string) => void;
  ask: (input: { title: string; message: string; actionId?: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Refresh anything on screen that an action may have changed. */
  changed: () => void;
  startTour: () => void;
};

/** What Alfred says back, and (for things that can be reversed) the id of the log entry that undoes it. */
export type Outcome = { text: string; undoId?: string };

const list = (items: string[]) => items.map((s) => `• ${s}`).join("\n");
const oops = (e: unknown) => (e instanceof ApiError ? e.message : "couldn't reach the server. try again in a sec.");
const DECLINED = "aight, left it alone.";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export { interpret };
export const HELP_TEXT = `here's what i can do:
${list([
  "take you places: “open labs”, “go to my profile”, “start a lab”",
  "tell you stuff: “my points”, “my streak”, “weekly challenges”, “what's due”, “what's new”, “upcoming events”, “trending labs”",
  "do things (i always ask first): “mark all notifications read”, “vote for <lab name>”, “sign out”",
  "remember things: “remember that I hate gradients”, or “forget everything”",
])}`;

/** Logs something Alfred did so the member can see it and undo it. A failed log never breaks the action. */
async function record(kind: "vote" | "readall", summary: string, payload: Record<string, unknown>): Promise<string | undefined> {
  try {
    return (await petApi.logAction({ kind, summary, payload })).id;
  } catch {
    return undefined;
  }
}

async function runInner(intent: Intent, ctx: CommandContext): Promise<string | Outcome> {
  switch (intent.kind) {
    case "greet":
      return `yo ${ctx.me.username}. what do you need?`;

    case "help":
      return HELP_TEXT;

    case "tour":
      ctx.startTour();
      return "say less, let me show you around.";

    case "go": {
      const page = PAGES[intent.to];
      ctx.navigate(page.path);
      return `taking you to ${page.name}.`;
    }

    case "points":
      return `${ctx.me.points.toLocaleString()} point${ctx.me.points === 1 ? "" : "s"}${ctx.me.rank ? `, #${ctx.me.rank} on the board` : ""}.`;

    case "rank":
      return ctx.me.rank ? `you're #${ctx.me.rank} with ${ctx.me.points.toLocaleString()} points.` : "not ranked yet. earn a point and you're on the board.";

    case "streak":
      return ctx.me.streak > 0 ? `${ctx.me.streak}-day streak. show up tomorrow and keep it going.` : "no streak yet. show up tomorrow and it starts.";

    case "unread": {
      const { unread } = await inboxApi.unread();
      return unread === 0 ? "all caught up. nothing unread." : `${plural(unread, "unread notification")}.`;
    }

    case "latest": {
      const items = (await inboxApi.list()).slice(0, 3);
      return items.length ? `latest:\n${list(items.map((n) => n.message))}` : "nothing new yet.";
    }

    case "events": {
      const { events } = await eventsApi.list("upcoming");
      if (events.length === 0) return "nothing on the calendar right now.";
      const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
      return `coming up:\n${list(events.slice(0, 3).map((e) => `${e.title} (${when(e.starts_at)})`))}`;
    }

    case "trending": {
      const { projects } = await labsApi.list({ sort: "trending", limit: 3 });
      return projects.length ? `trending:\n${list(projects.map((p) => `${p.name} by @${p.user.username}, ${plural(p.vote_count, "vote")}`))}` : "no labs yet. be the first to start one.";
    }

    case "mylabs": {
      const { projects } = await labsApi.mine();
      return projects.length ? `your labs:\n${list(projects.map((p) => p.name))}` : "you haven't started a lab yet. say “start a lab” and i'll take you there.";
    }

    case "due": {
      const { tasks } = await labsDeepApi.myTasks();
      if (tasks.length === 0) return "nothing on your plate. add tasks on a lab's board and i'll keep track.";
      const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
      return `up next:\n${list(tasks.slice(0, 5).map((t) => `${t.title} (${t.lab.name}${t.due_at ? `, due ${day(t.due_at)}` : ""})`))}`;
    }

    case "level": {
      const l = ctx.me.level;
      return l.next_at ? `you're a ${l.title} (level ${l.level}). ${l.next_at - l.points} more points for the next one.` : `you're a ${l.title}, top level. legendary.`;
    }

    case "quest": {
      const q = await rewardsApi.quest();
      if (q.claimed) return `today's quest (${q.title}) is done and claimed. come back tomorrow.`;
      return q.complete ? `you finished "${q.title}". claim your ${q.points} points on home.` : `today's quest: ${q.title}. ${q.description} (${q.progress} of ${q.goal})`;
    }

    case "weekly": {
      const w = await rewardsApi.weekly();
      const lines = w.challenges.map((c) => `${c.claimed ? "✓" : c.complete ? "★" : "•"} ${c.title} (${c.progress}/${c.goal})`);
      const ready = w.challenges.some((c) => c.complete && !c.claimed) || (w.bonus.available && !w.bonus.claimed);
      return `this week:\n${list(lines)}${ready ? "\nyou've got rewards to claim on home." : ""}`;
    }

    case "remember": {
      try {
        await petApi.addMemory(intent.text);
        return `got it, i'll remember that. (you can see and delete everything i remember in settings)`;
      } catch (e) {
        return e instanceof ApiError ? e.message : oops(e);
      }
    }

    case "forget": {
      const r = await petApi.forgetAll();
      return r.forgotten ? `forgot all ${r.forgotten}.` : "there was nothing to forget.";
    }

    case "readall": {
      const items = await inboxApi.list();
      const ids = items.filter((n) => !n.read).map((n) => n.id);
      if (ids.length === 0) return "nothing to mark. you're already caught up.";
      const ok = await ctx.ask({
        title: "Mark everything as read?",
        message: `I'll mark your ${plural(ids.length, "unread notification")} as read.`,
        actionId: "notifications.read-all",
      });
      if (!ok) return DECLINED;
      await inboxApi.readAll();
      ctx.changed();
      const undoId = await record("readall", `Marked ${plural(ids.length, "notification")} as read`, { ids: ids.slice(0, 100) });
      return { text: "done. all marked read.", undoId };
    }

    case "vote": {
      const { projects } = await labsApi.list({ search: intent.query, limit: 5 });
      const lab = projects.find((p) => p.name.toLowerCase() === intent.query) ?? projects[0];
      if (!lab) return `couldn't find a lab called “${intent.query}”.`;
      if (lab.has_voted_today) return `you already voted for ${lab.name} today.`;
      const ok = await ctx.ask({
        title: `Vote for ${lab.name}?`,
        message: `Your vote is public and counts toward today's three. It goes to @${lab.user.username}'s lab.`,
      });
      if (!ok) return DECLINED;
      const result = await votesApi.cast(lab.id);
      ctx.changed();
      const undoId = await record("vote", `Voted for ${lab.name}`, { lab_id: lab.id });
      return { text: `voted for ${lab.name}. it's at ${plural(result.new_vote_count, "vote")} now.`, undoId };
    }

    case "signout": {
      const ok = await ctx.ask({ title: "Sign out?", message: "I'll sign you out of this device." });
      if (!ok) return DECLINED;
      await ctx.signOut();
      return "signed out. see you.";
    }

    case "unknown":
      return "didn't catch that one. try “help” and i'll show you what i can do.";
  }
}

export async function run(intent: Intent, ctx: CommandContext): Promise<Outcome> {
  try {
    const r = await runInner(intent, ctx);
    return typeof r === "string" ? { text: r } : r;
  } catch (e) {
    return { text: oops(e) };
  }
}

/** Suggestions shown as one-tap chips under the chat. */
export const SUGGESTIONS = ["My points", "What's due", "Open labs", "Help"] as const;
