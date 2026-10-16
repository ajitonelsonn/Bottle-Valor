import Image from "next/image";
import { Button } from "@/components/common/button";
import { PointsCoin } from "@/components/common/points-coin";
import { cn } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import type { Reward } from "@/lib/types";

const CATEGORY_TONES: Record<Reward["category"], string> = {
  voucher: "from-blue-50 to-blue-100",
  "partner-offer": "from-gold-50 to-gold-100",
  merchandise: "from-green-50 to-teal-50",
  community: "from-teal-50 to-green-100",
};

/** Reward artwork on a soft category-tinted backdrop. */
export function RewardImage({ reward, className, sizes = "240px" }: { reward: Reward; className?: string; sizes?: string }) {
  return (
    <div className={cn("relative bg-linear-to-br", CATEGORY_TONES[reward.category], className)}>
      <Image src={reward.imageUrl} alt="" fill sizes={sizes} className="object-contain p-4 drop-shadow-[0_8px_12px_rgba(16,39,95,0.18)]" />
    </div>
  );
}

export function RewardStatusBadge({ status }: { status: Reward["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "coming-soon" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-600",
      )}
    >
      Coming soon
    </span>
  );
}

export function RewardCard({ reward, balance, onDetails }: { reward: Reward; balance: number; onDetails: (id: string) => void }) {
  const reached = balance >= reward.pointsRequired;
  return (
    <article className="card flex flex-col overflow-hidden" aria-labelledby={`reward-${reward.id}`}>
      <div className="relative">
        <RewardImage reward={reward} className="h-40" />
        {reward.popular ? (
          <span className="absolute left-3 top-3 rounded-full bg-green-600 px-2.5 py-1 text-xs font-semibold text-white">Popular</span>
        ) : null}
        <span className="absolute right-3 top-3">
          <RewardStatusBadge status={reward.status} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-subtle">{t.rewardCategories[reward.category]}</p>
        <h3 id={`reward-${reward.id}`} className="mt-0.5 text-lg font-bold">
          {reward.title}
        </h3>
        <p className="text-sm text-muted">{reward.subtitle}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="flex items-center gap-1.5 whitespace-nowrap font-display text-lg font-bold text-navy-900">
            <PointsCoin size={24} className="drop-shadow-none" />
            {reward.pointsRequired} pts
          </span>
          <Button
            size="sm"
            variant={reached ? "soft" : "secondary"}
            onClick={() => onDetails(reward.id)}
            className="whitespace-nowrap"
            aria-label={`View details for ${reward.title}`}
          >
            Details
          </Button>
        </div>
      </div>
    </article>
  );
}
