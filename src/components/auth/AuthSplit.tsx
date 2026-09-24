import type { CSSProperties, ReactNode } from "react";

/** Two-sided shell for /login and /signup. On large screens the form sits
 * beside a full-height brand panel (swapped left/right per page); below
 * that it collapses to a single centred column with a big illustration
 * watermark behind the form instead, since there's no room for a side
 * panel. Both the form and image panels carry a `viewTransitionName` so
 * navigating between the two pages (see useViewTransitionNav) animates
 * them sliding to their new side rather than cutting instantly. */
export default function AuthSplit({
  children,
  image,
  imageSide,
}: {
  children: ReactNode;
  image: { src: string; flip?: boolean };
  imageSide: "left" | "right";
}) {
  const panel = <ImagePanel key="panel" {...image} />;
  const form = (
    <div
      key="form"
      style={{ viewTransitionName: "auth-form" } as CSSProperties}
      className="relative flex h-screen items-center justify-center overflow-hidden px-5 py-6"
    >
      {/* Mobile/tablet only — there's no room for the side panel, so the
          brand shows up as a big, quiet watermark behind the form instead. */}
      <img
        src="/assets/illustration2-nobg.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 w-[220%] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-[0.09] lg:hidden"
      />
      <div className="relative w-full max-w-[440px]">{children}</div>
    </div>
  );

  return (
    <main className="h-screen overflow-hidden lg:grid lg:grid-cols-2">
      {imageSide === "left" ? [panel, form] : [form, panel]}
    </main>
  );
}

function ImagePanel({ src, flip }: { src: string; flip?: boolean }) {
  return (
    <div
      style={{ viewTransitionName: "auth-panel" } as CSSProperties}
      className="relative hidden overflow-hidden lg:block"
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`h-full w-full object-cover ${flip ? "-scale-x-100" : ""}`}
      />
    </div>
  );
}
