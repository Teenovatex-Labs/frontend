// Turns what you type into something Alfred can act on. Pure text-in, intent-out, no app imports,
// so it is easy to test. A smarter brain (an LLM) can later sit in front of this and hand back the
// same intents; nothing that runs them has to change.

export type Intent =
  | { kind: "greet" }
  | { kind: "help" }
  | { kind: "go"; to: keyof typeof PAGES }
  | { kind: "points" }
  | { kind: "streak" }
  | { kind: "rank" }
  | { kind: "unread" }
  | { kind: "latest" }
  | { kind: "events" }
  | { kind: "trending" }
  | { kind: "mylabs" }
  | { kind: "due" }
  | { kind: "level" }
  | { kind: "tour" }
  | { kind: "remember"; text: string }
  | { kind: "forget" }
  | { kind: "quest" }
  | { kind: "readall" }
  | { kind: "vote"; query: string }
  | { kind: "signout" }
  | { kind: "unknown" };

export const PAGES = {
  home: { path: "/home", name: "Home", words: ["home", "dashboard", "start"] },
  labs: { path: "/labs", name: "Labs", words: ["labs", "lab", "showcase", "projects", "explore"] },
  mylabs: { path: "/labs/mine", name: "your labs", words: ["my labs", "my lab", "my projects", "my stuff"] },
  newlab: { path: "/labs/new", name: "a new lab", words: ["new lab", "start a lab", "create a lab", "make a lab", "new project"] },
  leaderboard: { path: "/leaderboard", name: "the Leaderboard", words: ["leaderboard", "rankings", "top"] },
  notifications: { path: "/notifications", name: "your notifications", words: ["notifications", "inbox", "alerts", "updates"] },
  community: { path: "/community", name: "Community", words: ["community", "spaces", "forums", "forum"] },
  messages: { path: "/messages", name: "your messages", words: ["messages", "message", "chats", "chat", "dms"] },
  events: { path: "/events", name: "Events", words: ["events", "event", "calendar"] },
  learn: { path: "/learn", name: "Learn", words: ["learn", "lessons", "courses", "tracks"] },
  profile: { path: "/profile", name: "your profile", words: ["profile", "my profile"] },
  settings: { path: "/settings", name: "Settings", words: ["settings", "preferences", "account"] },
} as const;

const norm = (s: string) => s.toLowerCase().replace(/['’]/g, "").replace(/[^\p{L}\p{N}@_\s-]/gu, " ").replace(/\s+/g, " ").trim();
const has = (text: string, ...phrases: string[]) => phrases.some((p) => text.includes(p));

/** Longest match wins, so "my labs" beats "labs". */
function pageFor(text: string): keyof typeof PAGES | null {
  let best: { key: keyof typeof PAGES; len: number } | null = null;
  for (const [key, page] of Object.entries(PAGES) as [keyof typeof PAGES, (typeof PAGES)[keyof typeof PAGES]][]) {
    for (const w of page.words) {
      const hit = new RegExp(`(^|\\s)${w}(\\s|$)`).test(text);
      if (hit && (!best || w.length > best.len)) best = { key, len: w.length };
    }
  }
  return best?.key ?? null;
}

export function interpret(input: string): Intent {
  const t = norm(input);
  if (!t) return { kind: "unknown" };

  if (/^(hi|hey|hello|yo|sup|hiya|howdy|good (morning|afternoon|evening))\b/.test(t) && t.split(" ").length <= 3) return { kind: "greet" };
  const remember = input.trim().match(/^(?:please\s+)?remember\s+(?:that\s+)?(.{3,120})$/i);
  if (remember) return { kind: "remember", text: remember[1]!.trim() };
  if (has(t, "forget everything", "forget all", "forget it all", "clear your memory", "wipe your memory")) return { kind: "forget" };
  if (has(t, "show me around", "give me a tour", "take a tour", "tour", "how does this work", "how do i use this")) return { kind: "tour" };
  if (has(t, "help", "what can you do", "commands", "what do you do")) return { kind: "help" };

  if (has(t, "sign out", "log out", "logout", "signout")) return { kind: "signout" };
  if (has(t, "mark all", "read all", "clear notifications", "mark everything") && has(t, "read", "notification")) return { kind: "readall" };


  const vote = t.match(/\bvote (?:for|on)\s+(.{2,})$/);
  if (vote) return { kind: "vote", query: vote[1]!.replace(/^(the|my)\s+/, "").trim() };

  if (has(t, "how many points", "my points", "points do i have", "my score", "how am i doing")) return { kind: "points" };
  if (has(t, "streak")) return { kind: "streak" };
  if (has(t, "my rank", "what rank", "my position", "where do i stand", "how am i ranked")) return { kind: "rank" };
  if (has(t, "unread", "how many notifications", "any notifications", "new notifications")) return { kind: "unread" };
  if (has(t, "whats new", "latest", "anything new", "what did i miss")) return { kind: "latest" };
  if (has(t, "upcoming events", "what events", "any events", "events this week", "whats on")) return { kind: "events" };
  if (has(t, "trending", "popular", "best labs", "top labs", "hot right now")) return { kind: "trending" };
  if (has(t, "my level", "what level", "what level am i", "how far to the next level", "next level")) return { kind: "level" };
  if (has(t, "daily quest", "todays quest", "my quest", "quest")) return { kind: "quest" };
  if (has(t, "whats due", "what is due", "my tasks", "my deadlines", "deadlines", "what do i need to do", "whats next", "up next", "to do")) return { kind: "due" };
  if (has(t, "list my labs", "what labs do i have", "what have i built", "my projects") && !/^(go|open|take)/.test(t)) return { kind: "mylabs" };

  if (/^(go|open|show|take|bring|navigate|visit|jump|head)\b/.test(t) || /\b(take me|bring me|show me|go to|open up)\b/.test(t)) {
    const to = pageFor(t);
    if (to) return { kind: "go", to };
  }
  const bare = pageFor(t);
  if (bare && t.split(" ").length <= 3) return { kind: "go", to: bare };

  return { kind: "unknown" };
}
