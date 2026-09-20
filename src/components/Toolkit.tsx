const FEATURES = [
  {
    name: "TXDiscuss",
    description: "Real-time chat rooms for every stack, project, and rabbit hole.",
  },
  {
    name: "TXShare",
    description: "Post what you're building and get feedback from people who've been there.",
  },
  {
    name: "TXExplore",
    description: "Curated resources, tutorials, and tools picked by the community.",
  },
  {
    name: "TXAsk",
    description: "Stuck on a bug at 1am? Ask and get answers from peers, not just docs.",
  },
  {
    name: "TXTeamUp",
    description: "Find collaborators for hackathons, side projects, and long-term builds.",
  },
];

export default function Toolkit() {
  return (
    <section id="explore" className="bg-yellow py-24 md:py-32">
      <div className="wrap">
        <p className="eyebrow text-rose">02 / The toolkit</p>
        <h2 className="mt-4 max-w-2xl text-4xl md:text-5xl">
          Everything you need to go from idea to shipped.
        </h2>
      </div>

      <div className="mt-12 flex gap-6 overflow-x-auto px-[max(56px,calc((100%-1280px)/2))] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FEATURES.map((feature) => (
          <div
            key={feature.name}
            className="flex w-72 shrink-0 flex-col justify-between rounded-3xl border border-line bg-cream p-8"
          >
            <h3 className="text-2xl">{feature.name}</h3>
            <p className="mt-4 text-muted">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
