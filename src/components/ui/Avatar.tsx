// A member's photo, or their initials on a soft colour when they haven't added one.
const COLOURS = ["bg-pink", "bg-yellow", "bg-cream"];

export default function Avatar({
  name,
  src,
  size = 40,
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .replace(/^@/, "")
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  const colour = COLOURS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % COLOURS.length];
  const box = { width: size, height: size, fontSize: Math.max(11, size * 0.4) };

  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={box} className={`shrink-0 rounded-full border border-ink object-cover ${className}`} />
  ) : (
    <span
      aria-hidden="true"
      style={box}
      className={`flex shrink-0 items-center justify-center rounded-full border border-ink font-semibold ${colour} ${className}`}
    >
      {initials || "?"}
    </span>
  );
}
