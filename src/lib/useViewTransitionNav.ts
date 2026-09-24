"use client";

import { useRouter } from "next/navigation";

/** Navigates like router.push, but wrapped in the native View Transitions
 * API when the browser supports it. The auth pages tag their form and
 * image panels with matching `viewTransitionName`s (see AuthSplit), so
 * switching between /login and /signup animates them swapping sides
 * instead of just cutting to the new page. Falls back to a plain push
 * wherever the API isn't available (older Safari/Firefox). */
export default function useViewTransitionNav() {
  const router = useRouter();

  return (href: string) => {
    if (typeof document === "undefined" || !("startViewTransition" in document)) {
      router.push(href);
      return;
    }
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
      router.push(href);
    });
  };
}
