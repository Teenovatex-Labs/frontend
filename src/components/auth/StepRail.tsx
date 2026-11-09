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
    <div className="mb-5 flex items-center" role="list" aria-label="Signup progress">
      {steps.map((step, i) => {
        const state: NodeState = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <div key={step.id} className="flex flex-1 items-center last:flex-none" role="listitem">
            <StepNode step={step} state={state} />
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

function StepNode({ step, state }: { step: Step; state: NodeState }) {
  const ref = useRef<IconHandle>(null);
  const Icon = step.icon;

  // Give the active node's icon a little life beyond the slide-in — it
  // plays its own animation the moment it becomes current, and every node
  // (done or upcoming) can still be replayed on hover.
  useEffect(() => {
    if (state === "active") ref.current?.startAnimation();
  }, [state]);

  return (
    <div aria-current={state === "active" ? "step" : undefined}>
      <div
        key={state}
        onMouseEnter={() => ref.current?.startAnimation()}
        onMouseLeave={() => ref.current?.stopAnimation()}
        aria-label={step.label}
        className={`step-node-pop flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ${
          state === "active"
            ? "border-rose bg-rose text-cream"
            : state === "done"
              ? "border-ink bg-ink text-cream"
              : "border-line bg-cream text-muted"
        }`}
      >
        {state === "done" ? <CheckIcon ref={ref} size={16} /> : <Icon ref={ref} size={16} />}
      </div>
    </div>
  );
}
