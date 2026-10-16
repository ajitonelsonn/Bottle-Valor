"use client";

import { useMemo, useState } from "react";
import { Gift, Heart, LayoutGrid, Lightbulb, Lock, Receipt, Shirt, Store, Ticket } from "lucide-react";
import { Button } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";
import { SelectField } from "@/components/common/form-field";
import { PageHeader } from "@/components/common/page-header";
import { PointsBalanceCard } from "@/components/common/points-balance-card";
import { ProgressBar } from "@/components/common/progress-bar";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/states";
import { InlineAlert, useToast } from "@/components/common/toast";
import { cn } from "@/lib/format";
import { t } from "@/lib/i18n/messages";
import { pointsBalance } from "@/lib/selectors";
import { featuredReward, retryRewards, useRewards } from "@/lib/data/catalog";
import { useAppState } from "@/lib/store/app-store";
import type { Reward, RewardCategory } from "@/lib/types";
import { RewardCard, RewardImage, RewardStatusBadge } from "./reward-card";

const CATEGORIES: { id: "all" | RewardCategory; label: string; Icon: typeof Gift }[] = [
  { id: "all", label: "All rewards", Icon: LayoutGrid },
  { id: "voucher", label: t.rewardCategories.voucher, Icon: Ticket },
  { id: "partner-offer", label: t.rewardCategories["partner-offer"], Icon: Store },
  { id: "merchandise", label: t.rewardCategories.merchandise, Icon: Shirt },
  { id: "community", label: t.rewardCategories.community, Icon: Heart },
];

const HOW_IT_WORKS = [
  { title: "Recycle and earn points", body: "Each verified report earns 1–3 points — 1 point per bottle, up to 3 per report." },
  { title: "Choose a reward", body: "Rewards start from 500 points and go up for bigger items." },
  { title: "Redeem your points", body: "Redemption will deduct points when it launches — not yet available." },
  { title: "Keep making an impact", body: "Every bottle helps build a cleaner Timor-Leste." },
];

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; rewards: Reward[] };

export function RewardsView() {
  const { ledger } = useAppState();
  const { notify } = useToast();
  const balance = pointsBalance(ledger);
  const rewardsRes = useRewards();
  const load = useMemo<Load>(
    () =>
      rewardsRes.status === "ready"
        ? { status: "ready", rewards: rewardsRes.data }
        : rewardsRes.status === "error"
          ? { status: "error" }
          : { status: "loading" },
    [rewardsRes],
  );
  const featured = featuredReward(load.status === "ready" ? load.rewards : undefined);

  const [category, setCategory] = useState<"all" | RewardCategory>("all");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (load.status !== "ready") return [];
    return load.rewards
      .filter((r) => category === "all" || r.category === category)
      .sort((a, b) => (sort === "asc" ? a.pointsRequired - b.pointsRequired : b.pointsRequired - a.pointsRequired));
  }, [load, category, sort]);

  const details = load.status === "ready" ? load.rewards.find((r) => r.id === detailsId) ?? null : null;

  return (
    <>
      <PageHeader title="Rewards" description="Earn points now — reward redemption for a cleaner Timor-Leste is coming soon." />

      <div className="grid gap-4 lg:grid-cols-2">
        <PointsBalanceCard points={balance} caption="Your points balance" note="Keep recycling to earn more points!" size="lg" />
        <section className="card flex flex-col justify-center p-5" aria-labelledby="featured-title">
          {featured ? (
          <>
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600">
              <Gift className="size-7" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted">Next reward</p>
              <h2 id="featured-title" className="text-xl font-bold">
                {featured.title}
              </h2>
              <p className="text-sm text-muted">{featured.subtitle}</p>
            </div>
            <p className="shrink-0 font-semibold tabular-nums text-ink-soft">
              {Math.min(balance, featured.pointsRequired)} / {featured.pointsRequired} pts
            </p>
          </div>
          <ProgressBar value={balance} max={featured.pointsRequired} label={`Progress toward ${featured.title}`} className="mt-4" />
          </>
          ) : (
            <LoadingState label="Loading rewards…" className="py-6" />
          )}
        </section>
      </div>

      <InlineAlert tone="info" title="Rewards are coming soon" className="mt-4">
        Rewards start from 500 points. These are illustrative examples: redemption is disabled and your points won&apos;t be
        deducted. No business shown here has partnered with BotleValor yet.
      </InlineAlert>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div role="group" aria-label="Reward category" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {CATEGORIES.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={category === id}
                  onClick={() => setCategory(id)}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition-colors",
                    category === id ? "border-green-600 bg-green-600 text-white" : "border-line bg-white text-ink-soft hover:bg-canvas",
                  )}
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </button>
              ))}
            </div>
            <SelectField
              label="Sort rewards"
              hideLabel
              value={sort}
              onChange={(e) => setSort(e.target.value as "asc" | "desc")}
              options={[
                { value: "asc", label: "Points: low to high" },
                { value: "desc", label: "Points: high to low" },
              ]}
              className="sm:w-56 sm:self-end 2xl:self-auto"
            />
          </div>

          <h2 className="mt-5 text-xl font-bold">Available rewards</h2>
          <div className="mt-3">
            {load.status === "loading" ? <LoadingState label="Loading rewards…" /> : null}
            {load.status === "error" ? (
              <ErrorState
                title="Couldn't load rewards"
                action={
                  <Button
                    variant="secondary"
                    onClick={() => {
                      retryRewards();
                    }}
                  >
                    Try again
                  </Button>
                }
              />
            ) : null}
            {load.status === "ready" && !visible.length ? (
              <EmptyState title="No rewards in this category yet" description="Check back when the rewards programme launches." />
            ) : null}
            {visible.length ? (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((r) => (
                  <li key={r.id} className="flex">
                    <div className="flex w-full">
                      <RewardCard reward={r} balance={balance} onDetails={setDetailsId} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5">
          <section className="card p-5" aria-labelledby="how-rewards-title">
            <h2 id="how-rewards-title" className="flex items-center gap-2 text-lg font-bold">
              <Lightbulb className="size-5 text-blue-600" aria-hidden /> How rewards work
            </h2>
            <ol className="mt-4 space-y-4">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                      ["bg-green-600", "bg-blue-600", "bg-violet-600", "bg-gold-500"][i],
                    )}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-navy-900">{step.title}</p>
                    <p className="text-sm text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section className="card p-5" aria-labelledby="redemptions-title">
            <h2 id="redemptions-title" className="flex items-center gap-2 text-lg font-bold">
              <Receipt className="size-5 text-blue-600" aria-hidden /> My redemption history
            </h2>
            <EmptyState
              className="py-6"
              icon={<Lock className="size-7" aria-hidden />}
              title="No redemptions yet"
              description="Redemption isn't available yet, so no points have been spent."
            />
          </section>
        </aside>
      </div>

      <Dialog
        open={!!details}
        onClose={() => setDetailsId(null)}
        title={details?.title ?? "Reward"}
        description={details?.subtitle}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetailsId(null)}>
              Close
            </Button>
            <Button
              variant="soft"
              onClick={() => {
                notify({ tone: "info", title: "We'll keep you posted", body: "Watch the bell menu and this page for launch news." });
                setDetailsId(null);
              }}
            >
              Notify me when available
            </Button>
          </>
        }
      >
        {details ? (
          <div className="space-y-4">
            <RewardImage reward={details} className="h-48 overflow-hidden rounded-2xl" sizes="480px" />
            <div className="flex items-center justify-between">
              <RewardStatusBadge status={details.status} />
              <p className="font-display text-xl font-bold text-navy-900">{details.pointsRequired} pts</p>
            </div>
            <p className="text-sm text-ink-soft">{details.description}</p>
            <ProgressBar value={balance} max={details.pointsRequired} label="Your progress" />
            <p className="text-sm text-muted">
              You have {balance} points
              {balance >= details.pointsRequired ? " — enough for this reward once redemption opens." : ` — ${details.pointsRequired - balance} more needed.`}
            </p>
            <Button full disabled>
              <Lock className="size-4" aria-hidden /> Redeem — not available yet
            </Button>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
