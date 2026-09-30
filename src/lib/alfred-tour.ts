import type { TourStep } from "@/lib/alfred";

// The first-visit walkthrough. Short, friendly, and skippable; each step can take the member to the
// place it is talking about.
export const TOUR: TourStep[] = [
  { message: "Hi, I'm Alfred! I live down here and help you get around. Want a quick look at what you can do?", path: "/home" },
  { message: "This is Home: your points, level and a small daily quest. Finish the quest and claim 5 points.", path: "/home" },
  { message: "Labs are projects. Start one, post updates, plan it on a board, and get votes from other teens.", path: "/labs" },
  { message: "Learn has short lessons, and every one you finish earns points.", path: "/learn" },
  { message: "Community is for asking questions and sharing what you made. Be kind, and keep your details private.", path: "/community" },
  { message: "Messages are for people you follow each other with, so you only hear from people you chose. Anything that feels off, you can report or block.", path: "/messages" },
  { message: "That's it! Say “Yo” any time. I can take you places, tell you your points, and more. Have fun building.", path: "/home" },
];

export const tourKey = (userId: string) => `tx_tour_done_${userId}`;
