// Carries out what Alfred understood (see alfred-intents.ts for how he understands it).
//
// An intent becomes either an answer (reads are free) or an action. Anything that CHANGES something
// asks first with a permission card, and works with no AI behind it.

import { ApiError } from "@/lib/api";
import { PAGES, interpret, type Intent } from "@/lib/alfred-intents";
import { eventsApi, inboxApi, labsApi, labsDeepApi, peopleApi, rewardsApi, votesApi } from "@/lib/services";

// --- running an intent -----------------------------------------------------------------------

export type CommandContext = {
  /** The signed-in member. */
  me: { username: string; points: number; streak: number; rank?: number; level: { level: number; title: string; points: number; next_at: number | null } };
  navigate: (path: string) => void;
  ask: (input: { title: string; message: string; actionId?: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  /** Refresh anything on screen that an action may have changed. */
  changed: () => void;
};

const list = (items: string[]) => items.map((s) => `• ${s}`).join("\n");
const oops = (e: unknown) => (e instanceof ApiError ? e.message : "I couldn't reach the server. Try again in a moment.");
const DECLINED = "No problem, I've left it alone.";

export { interpret };
export const HELP_TEXT = `Here's what I can do:
${list([
  "Take you places: “open labs”, “go to my profile”, “start a lab”",
  "Tell you things: “my points”, “my streak”, “what's new”, “upcoming events”, “trending labs”",
  "Do things (I always ask first): “mark all notifications read”, “follow @name”, “vote for <lab name>”, “sign out”",
])}`;

export async function run(intent: Intent, ctx: CommandContext): Promise<string> {
  try {
    switch (intent.kind) {
      case "greet":
        return `Yo, ${ctx.me.username}! What do you need?`;

      case "help":
        return HELP_TEXT;

      case "go": {
        const page = PAGES[intent.to];
        ctx.navigate(page.path);
        return `Taking you to ${page.name}.`;
      }

      case "points":
        return `You have ${ctx.me.points.toLocaleString()} point${ctx.me.points === 1 ? "" : "s"}${ctx.me.rank ? `, ranked #${ctx.me.rank}` : ""}.`;

      case "rank":
        return ctx.me.rank ? `You're #${ctx.me.rank} on the leaderboard with ${ctx.me.points.toLocaleString()} points.` : "You're not ranked yet. Earn a point and you're on the board.";

      case "streak":
        return ctx.me.streak > 0
          ? `You're on a ${ctx.me.streak}-day streak. Come back tomorrow to keep it going.`
          : "No streak yet. Show up tomorrow and it starts.";

      case "unread": {
        const { unread } = await inboxApi.unread();
        return unread === 0 ? "You're all caught up. Nothing unread." : `You have ${unread} unread notification${unread === 1 ? "" : "s"}.`;
      }

      case "latest": {
        const items = (await inboxApi.list()).slice(0, 3);
        return items.length ? `Latest for you:\n${list(items.map((n) => n.message))}` : "Nothing new yet.";
      }

      case "events": {
        const { events } = await eventsApi.list("upcoming");
        if (events.length === 0) return "Nothing on the calendar right now.";
        const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
        return `Coming up:\n${list(events.slice(0, 3).map((e) => `${e.title} (${when(e.starts_at)})`))}`;
      }

      case "trending": {
        const { projects } = await labsApi.list({ sort: "trending", limit: 3 });
        return projects.length ? `Trending labs:\n${list(projects.map((p) => `${p.name} by @${p.user.username}, ${p.vote_count} vote${p.vote_count === 1 ? "" : "s"}`))}` : "No labs yet. Be the first to start one.";
      }

      case "mylabs": {
        const { projects } = await labsApi.mine();
        return projects.length ? `Your labs:\n${list(projects.map((p) => p.name))}` : "You haven't started a lab yet. Say “start a lab” and I'll take you there.";
      }

      case "due": {
        const { tasks } = await labsDeepApi.myTasks();
        if (tasks.length === 0) return "Nothing on your plate. Add tasks on a lab's Board and I'll keep track.";
        const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
        return `Up next:\n${list(tasks.slice(0, 5).map((t) => `${t.title} (${t.lab.name}${t.due_at ? `, due ${day(t.due_at)}` : ""})`))}`;
      }

      case "level": {
        const l = ctx.me.level;
        return l.next_at
          ? `You're a ${l.title} (level ${l.level}). ${l.next_at - l.points} more points to reach the next level.`
          : `You're a ${l.title}, the top level. Legendary.`;
      }

      case "quest": {
        const q = await rewardsApi.quest();
        if (q.claimed) return `Today's quest (${q.title}) is done and claimed. Come back tomorrow!`;
        return q.complete
          ? `You finished "${q.title}". Claim your ${q.points} points on Home!`
          : `Today's quest: ${q.title}. ${q.description} (${q.progress} of ${q.goal})`;
      }

      case "readall": {
        const { unread } = await inboxApi.unread();
        if (unread === 0) return "Nothing to mark. You're already caught up.";
        const ok = await ctx.ask({
          title: "Mark everything as read?",
          message: `I'll mark your ${unread} unread notification${unread === 1 ? "" : "s"} as read.`,
          actionId: "notifications.read-all",
        });
        if (!ok) return DECLINED;
        await inboxApi.readAll();
        ctx.changed();
        return "Done. Everything's marked as read.";
      }

      case "follow": {
        if (intent.username.toLowerCase() === ctx.me.username.toLowerCase()) return "That's you! Nobody follows themselves.";
        const person = await peopleApi.get(intent.username);
        const ok = await ctx.ask({
          title: intent.undo ? `Unfollow @${person.username}?` : `Follow @${person.username}?`,
          message: intent.undo ? `You'll stop seeing updates from @${person.username}.` : `@${person.username} will get a notification that you followed them.`,
        });
        if (!ok) return DECLINED;
        if (intent.undo) await peopleApi.unfollow(person.username);
        else await peopleApi.follow(person.username);
        ctx.changed();
        return intent.undo ? `Unfollowed @${person.username}.` : `You're now following @${person.username}.`;
      }

      case "vote": {
        const { projects } = await labsApi.list({ search: intent.query, limit: 5 });
        const lab = projects.find((p) => p.name.toLowerCase() === intent.query) ?? projects[0];
        if (!lab) return `I couldn't find a lab called “${intent.query}”.`;
        if (lab.has_voted_today) return `You've already voted for ${lab.name} today.`;
        const ok = await ctx.ask({
          title: `Vote for ${lab.name}?`,
          message: `Your vote is public and counts toward today's three. It goes to @${lab.user.username}'s lab.`,
        });
        if (!ok) return DECLINED;
        const result = await votesApi.cast(lab.id);
        ctx.changed();
        return `Voted for ${lab.name}. It has ${result.new_vote_count} vote${result.new_vote_count === 1 ? "" : "s"} now.`;
      }

      case "signout": {
        const ok = await ctx.ask({ title: "Sign out?", message: "I'll sign you out of this device." });
        if (!ok) return DECLINED;
        await ctx.signOut();
        return "Signed out. See you soon!";
      }

      case "unknown":
        return "I didn't catch that one. Try “help” to see what I can do.";
    }
  } catch (e) {
    return oops(e);
  }
}

/** Suggestions shown as one-tap chips under the chat. */
export const SUGGESTIONS = ["My points", "What's new", "Open labs", "Help"] as const;
