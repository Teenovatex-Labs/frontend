// The photo wall. Add a picture by dropping the file in /public/story and setting
// `photo` to its path (e.g. "/story/first-event.jpg"); until then a card shows as
// a photo that's still developing. Add, remove or reorder entries freely.
export type StoryKind = "milestone" | "event" | "teenovator";

export const KIND_LABEL: Record<StoryKind, string> = {
  milestone: "Milestone",
  event: "Event",
  teenovator: "Teenovators",
};

export type Moment = {
  id: string;
  kind: StoryKind;
  title: string;
  caption: string;
  body: string[];
  when?: string;
  photo?: string;
  alt?: string;
  doodle: "laptop" | "robot" | "notes" | "circuit";
};

export const MOMENTS: Moment[] = [
  {
    id: "first-event",
    kind: "event",
    title: "Our first event",
    caption: "Where it stopped being an idea.",
    body: [
      "The first time TeenovateX put a real event on the calendar and teenagers actually turned up.",
      "Everything that came after started in this room.",
    ],
    doodle: "notes",
  },
  {
    id: "founders-met",
    kind: "milestone",
    title: "Three founders, one room",
    caption: "The first time we all met.",
    body: [
      "Months of messages, calls and shared documents, and then the three founders finally in the same place.",
      "It turns out the group chat had it right all along.",
    ],
    doodle: "laptop",
  },
  {
    id: "first-physical",
    kind: "event",
    title: "Our first physical event",
    caption: "Screens off. People on.",
    body: [
      "Our first time doing this in person, with real faces, real handshakes and real noise.",
      "The community stopped being a link and became a place.",
    ],
    doodle: "circuit",
  },
  {
    id: "teenovators",
    kind: "teenovator",
    title: "The Teenovators",
    caption: "The people who make it real.",
    body: [
      "TeenovateX is only as good as the teenagers in it. These are the ones asking the strange questions and shipping the half-finished things.",
      "Every one of them started by saying hello.",
    ],
    doodle: "robot",
  },
];
