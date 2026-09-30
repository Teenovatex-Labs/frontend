"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { WhatsappIcon } from "@hugeicons/core-free-icons";
import type { IconHandle } from "@animateicons/react";

// AnimateIcons has no brand glyphs, so WhatsApp uses the Hugeicons mark and
// exposes the same start/stop handle, which lets it sit next to the animated
// icons and react to hover like them.
const WhatsAppIcon = forwardRef<IconHandle, { size?: number; className?: string }>(function WhatsAppIcon(
  { size = 24, className },
  ref
) {
  const [playing, setPlaying] = useState(false);
  useImperativeHandle(ref, () => ({
    startAnimation: () => setPlaying(true),
    stopAnimation: () => setPlaying(false),
  }));

  return (
    <span className={`inline-flex ${playing ? "icon-wiggle" : ""}`}>
      <HugeiconsIcon icon={WhatsappIcon} size={size} strokeWidth={1.6} className={className} />
    </span>
  );
});

export default WhatsAppIcon;
