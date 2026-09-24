// @animateicons/react's lucide set has no WhatsApp mark (lucide ships
// generic icons only, not brand logos), so this fills the gap with a static
// icon drawn in the same outline style — 24px box, 2px stroke, round caps —
// so it sits flush with the animated icons beside it in the footer.
export default function WhatsappIcon({
  size = 24,
  color = "currentColor",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 21l1.4-4.2A8.5 8.5 0 1 1 8 19.5L3 21Z" />
      <path d="M8.5 9.5c0 3.5 2.5 6 6 6 .6 0 1-.5.8-1l-.7-1.6a.9.9 0 0 0-1-.5l-1 .3c-.9-.5-1.7-1.3-2.2-2.2l.3-1a.9.9 0 0 0-.5-1L8.6 8.2c-.5-.2-1 .2-1 .8v.5Z" />
    </svg>
  );
}
