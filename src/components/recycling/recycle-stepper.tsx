import { Check } from "lucide-react";
import { cn } from "@/lib/format";

const STEPS = ["Take photo", "Verify", "Earn points"];

/** Progress indicator for the recycle flow. `current` is 0-based; `done` marks all complete. */
export function RecycleStepper({ current, failedAt }: { current: number; failedAt?: number }) {
  return (
    <nav aria-label="Recycling progress" className="mx-auto w-full max-w-md">
      <ol className="flex items-start">
        {STEPS.map((label, i) => {
          const complete = i < current;
          const active = i === current;
          const failed = failedAt === i;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 ? (
                <span
                  aria-hidden
                  className={cn("absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-green-400" : "bg-line")}
                />
              ) : null}
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-bold ring-4 ring-white",
                  complete && "bg-green-600 text-white",
                  active && !failed && "bg-green-600 text-white",
                  failed && "bg-danger-600 text-white",
                  !complete && !active && !failed && "bg-line text-muted",
                )}
              >
                {complete ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("mt-1.5 text-xs font-semibold sm:text-sm", complete || active ? "text-green-700" : "text-muted")}>
                {label}
                <span className="sr-only">{complete ? " (complete)" : active ? " (current step)" : ""}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
