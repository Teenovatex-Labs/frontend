"use client";

import { useEffect, useRef, type ComponentType, type RefAttributes } from "react";
import { CheckIcon } from "@animateicons/react/lucide/check-icon";
import type { IconHandle } from "@animateicons/react";

type StepIconProps = {
  size?: number;
  color?: string;
  isAnimated?: boolean;
  className?: string;
};

export type Step = {
  id: string;
  label: string;
  icon: ComponentType<StepIconProps & RefAttributes<IconHandle>>;
};

type NodeState = "done" | "active" | "upcoming";

/** Numbered progress rail for a multi-step form — nodes pop in, the fill
 * between them eases forward and back, and the active step's icon plays
 * its built-in animation so the rail itself feels alive, not just a bar. */
export default function StepRail({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <div className="mb-9 flex items-start" role="list" aria-label="Signup progress">
      {steps.map((step, i) => {
        const state: NodeState = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <div key={step.id} className="flex flex-1 items-center last:flex-none" role="listitem">
            <StepNode step={step} state={state} index={i} />
            {i < steps.length - 1 && (
              <div className="relative mx-1.5 h-0.5 flex-1 self-center bg-line sm:mx-2.5">
                <div
                  className="step-rail-fill absolute inset-y-0 left-0 bg-rose"
                  style={{ width: i < current ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepNode({ step, state, index }: { step: Step; state: NodeState; index: number }) {
  const ref = useRef<IconHandle>(null);
  const Icon = step.icon;

  // Give the active node's icon a little life beyond the slide-in — it
  // plays its own hover animation the moment it becomes current.
  useEffect(() => {
    if (state === "active") ref.current?.startAnimation();
  }, [state]);

  return (
    <div className="flex flex-col items-center gap-1.5" aria-current={state === "active" ? "step" : undefined}>
      <div
        key={state}
        className={`step-node-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
          state === "active"
            ? "border-rose bg-rose text-cream"
            : state === "done"
              ? "border-ink bg-ink text-cream"
              : "border-line bg-cream text-muted"
        }`}
      >
        {state === "done" ? (
          <CheckIcon size={17} isAnimated={false} />
        ) : (
          <Icon ref={ref} size={17} isAnimated={state === "active"} />
        )}
      </div>
      <span
        className={`hidden text-[9px] font-bold uppercase tracking-[0.08em] sm:block ${
          state === "upcoming" ? "text-muted" : "text-ink"
        }`}
      >
        {index + 1}. {step.label}
      </span>
    </div>
  );
}
