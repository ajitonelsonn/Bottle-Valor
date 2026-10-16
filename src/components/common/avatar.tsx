import { cn, initials } from "@/lib/format";

/** Initials avatar (profile photos are not collected). */
export function Avatar({ name, size = 44, className }: { name: string; size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-green-600 font-display font-bold text-white ring-2 ring-white",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
