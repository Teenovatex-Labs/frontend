export type PromptKind = "install" | "notifications";
export type PromptHistory = { shown: number; last: number; dismissed: boolean };

// Space requests across visits. A decline ends automatic prompts; Settings remains available.
export const PROMPT_RULES: Record<PromptKind, { delay: number; cooldown: number; limit: number }> = {
  install: { delay: 45_000, cooldown: 14 * 86_400_000, limit: 2 },
  notifications: { delay: 90_000, cooldown: 30 * 86_400_000, limit: 1 },
};

export function canShowPrompt(kind: PromptKind, history: PromptHistory | null, now: number) {
  const rules = PROMPT_RULES[kind];
  return !history?.dismissed && (history?.shown ?? 0) < rules.limit &&
    (!history?.last || now - history.last >= rules.cooldown);
}

export function recordPrompt(history: PromptHistory | null, now: number, dismissed = false): PromptHistory {
  return { shown: (history?.shown ?? 0) + 1, last: now, dismissed: dismissed || !!history?.dismissed };
}
