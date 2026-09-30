// A quiet shimmer block that holds a place while data loads. Sized by the caller.
export default function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-md bg-ink/[0.07] ${className}`} />;
}
