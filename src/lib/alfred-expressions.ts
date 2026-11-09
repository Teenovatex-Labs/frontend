// Which of Alfred's existing poses to show for what is happening in the application. Pure, so it can be tested.
//
// He has 14 painted animations, not 10 emotions. Some mappings below are honest approximations (surprised uses the
// "has an update" pose, confused uses the "hit a snag" pose); see docs/alfred.md. Motion only follows meaning: if nothing
// is happening, he stands still.

export type ReactionType = "surprised" | "curious" | "playful" | "impressed" | "reflective" | "supportive" | "serious";
export type AlfredMood = "idle" | "curious" | "thinking" | "excited" | "surprised" | "amused" | "encouraging" | "celebrating" | "confused" | "serious";
export type AlfredPose = "curious" | "greeting" | "playful" | "thinking" | "alerting" | "failed" | "celebrating" | "done" | "planning";

const POSE: Record<AlfredMood, AlfredPose | null> = {
  idle: null,
  curious: "curious",
  thinking: "thinking",
  excited: "playful",
  surprised: "alerting",
  amused: "playful",
  encouraging: "greeting",
  celebrating: "celebrating",
  confused: "failed",
  serious: "planning",
};

export const poseFor = (mood: AlfredMood): AlfredPose | null => POSE[mood];

const BY_REACTION: Record<ReactionType, AlfredMood> = {
  surprised: "surprised",
  curious: "curious",
  playful: "amused",
  impressed: "excited",
  reflective: "thinking",
  supportive: "encouraging",
  serious: "serious",
};

export const moodForReaction = (type: string | null | undefined): AlfredMood => (type && type in BY_REACTION ? BY_REACTION[type as ReactionType] : "curious");

export type InterviewEvent =
  | { kind: "welcome" }
  | { kind: "thinking" }
  | { kind: "question"; reaction?: string | null; first?: boolean }
  | { kind: "answered" }
  | { kind: "hint" }
  | { kind: "fallback" }
  | { kind: "safety" }
  | { kind: "finished" };

export const moodForEvent = (e: InterviewEvent): AlfredMood => {
  switch (e.kind) {
    case "welcome":
      return "encouraging";
    case "thinking":
      return "thinking";
    case "question":
      return e.reaction ? moodForReaction(e.reaction) : e.first ? "curious" : "idle";
    case "answered":
      return "thinking";
    case "hint":
      return "encouraging";
    case "fallback":
      return "confused";
    case "safety":
      return "serious";
    case "finished":
      return "celebrating";
  }
};

/** A short plain-words description of what Alfred is doing, for screen readers. */
export const MOOD_LABEL: Record<AlfredMood, string> = {
  idle: "Alfred is waiting",
  curious: "Alfred looks curious",
  thinking: "Alfred is thinking",
  excited: "Alfred is excited",
  surprised: "Alfred looks surprised",
  amused: "Alfred is amused",
  encouraging: "Alfred is encouraging you",
  celebrating: "Alfred is celebrating",
  confused: "Alfred looks puzzled",
  serious: "Alfred is listening carefully",
};
