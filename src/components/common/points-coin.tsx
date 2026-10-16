import { cn } from "@/lib/format";

/** Gold reward coin, drawn to match the coin in the BotleValor logo. */
export function PointsCoin({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0 drop-shadow-[0_6px_10px_rgba(201,133,0,0.35)]", className)}
      aria-hidden
    >
      <circle cx="32" cy="32" r="30" fill="#f5a300" />
      <path d="M32 2a30 30 0 0 1 0 60z" fill="#e58e00" />
      <circle cx="32" cy="32" r="23" fill="#ffbe2e" stroke="#d47f00" strokeOpacity=".35" strokeWidth="2" />
      <path d="M14 26a19 19 0 0 1 22-14" stroke="#ffe08a" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".8" />
      <path
        d="M32 17.5l4.4 9 9.9 1.4-7.2 7 1.7 9.8L32 40.1l-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4z"
        fill="#fffaf0"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
