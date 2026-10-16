import { CheckCircle2, Lightbulb } from "lucide-react";
import { cn } from "@/lib/format";

export const PHOTO_TIPS = [
  "Show your hand holding the plastic bottle",
  "Make sure the recycling bin is clearly visible",
  "Take the photo at the selected bin",
  "Use good lighting — avoid dark or blurry photos",
];

export function PhotoTips({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <section
      aria-labelledby="photo-tips-title"
      className={cn("rounded-2xl p-4", dark ? "bg-navy-950/80 text-white backdrop-blur" : "border border-blue-100 bg-blue-50", className)}
    >
      <h2 id="photo-tips-title" className={cn("flex items-center gap-2 text-base font-bold", dark && "text-white")}>
        <Lightbulb className={cn("size-5", dark ? "text-gold-400" : "text-blue-600")} aria-hidden />
        Tips for a successful photo
      </h2>
      <ul className="mt-2.5 space-y-1.5 text-sm">
        {PHOTO_TIPS.map((tip) => (
          <li key={tip} className="flex items-start gap-2">
            <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", dark ? "text-green-400" : "text-green-600")} aria-hidden />
            <span className={dark ? "text-white/90" : "text-ink-soft"}>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
