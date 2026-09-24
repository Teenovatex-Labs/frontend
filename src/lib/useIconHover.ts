"use client";

import { useCallback, useRef } from "react";
import type { IconHandle } from "@animateicons/react";

/** @animateicons/react icons are supposed to animate on hover on their own,
 * but that self-triggering is unreliable once the icon sits inside a Link/
 * button (the wrapping element's own event handling gets in the way). This
 * drives the icon explicitly via its imperative ref instead, so hover always
 * plays the animation no matter what it's nested inside. */
export default function useIconHover() {
  const ref = useRef<IconHandle>(null);

  const onMouseEnter = useCallback(() => ref.current?.startAnimation(), []);
  const onMouseLeave = useCallback(() => ref.current?.stopAnimation(), []);

  return { ref, onMouseEnter, onMouseLeave };
}
