"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Camera, ChevronRight, ClipboardList, Gift, Hand, Leaf, MapPin, Milk, Sprout } from "lucide-react";
import { BinCard } from "@/components/bins/bin-card";
import { buttonClass } from "@/components/common/button";
import { PointsBalanceCard } from "@/components/common/points-balance-card";
import { ProgressBar } from "@/components/common/progress-bar";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState, LoadingState } from "@/components/common/states";
import { BinMap } from "@/components/map/bin-map";
import { SubmissionCard } from "@/components/recycling/submission-card";
import { SubmissionDetailsDialog } from "@/components/recycling/submission-details-dialog";
import { formatKg, formatPoints } from "@/lib/format";
import { DEMO_REFERENCE_POINT } from "@/lib/geo";
import { computeStats, sortByNewest } from "@/lib/selectors";
import { featuredReward, useBins, useRewards } from "@/lib/data/catalog";
import { sortByDistance } from "@/lib/services/bin-service";
import { useAppState } from "@/lib/store/app-store";

export function DashboardView() {
  const { profile, submissions, ledger, settings } = useAppState();
  const [openSubmission, setOpenSubmission] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(submissions, ledger), [submissions, ledger]);
  const recent = useMemo(() => sortByNewest(submissions).slice(0, 4), [submissions]);
  const binsRes = useBins();
  const rewardsRes = useRewards();
  const nearby = useMemo(
    () => (binsRes.status === "ready" ? sortByDistance(binsRes.data, DEMO_REFERENCE_POINT).filter((b) => b.isActive) : []),
    [binsRes],
  );
  const reward = featuredReward(rewardsRes.status === "ready" ? rewardsRes.data : undefined);
  const firstName = profile.name.split(" ")[0] || profile.name;

  return (
    <div className="space-y-5">
      {/* Greeting hero */}
      <section className="relative overflow-hidden rounded-panel border border-line bg-blue-50" aria-labelledby="greeting">
        <Image src="/images/bg-image.png" alt="" fill loading="eager" sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover object-[70%_65%]" />
        <div className="absolute inset-0 bg-linear-to-r from-white via-white/85 to-white/10" />
        <div className="relative px-5 py-7 sm:px-8 sm:py-9">
          <p className="text-lg font-medium text-ink-soft">Welcome back,</p>
          <h1 id="greeting" className="mt-0.5 text-3xl font-extrabold sm:text-4xl">
            {firstName} <Hand className="inline size-8 -rotate-12 text-gold-500" aria-hidden />
          </h1>
          <p className="mt-1.5 text-ink-soft">Small actions make a big difference.</p>
        </div>
      </section>


      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <PointsBalanceCard
          points={stats.points}
          trend={`${formatPoints(stats.pointsThisWeek, true)} this week`}
          href="/history"
          className="sm:col-span-2 xl:col-span-1"
        />
        <StatCard tone="blue" icon={<Milk className="size-6" aria-hidden />} value={stats.bottles} label="Bottles recycled" href="/history" />
        <StatCard
          tone="green"
          icon={<Leaf className="size-6" aria-hidden />}
          value={formatKg(stats.plasticKg)}
          label="Plastic saved (est.)"
          href="/history"
        />
        <StatCard tone="violet" icon={<Calendar className="size-6" aria-hidden />} value={stats.daysActive} label="Days active" href="/profile" />
      </div>

      {/* Primary actions */}
      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <Link
          href="/recycle/capture"
          className="group flex items-center gap-4 rounded-card bg-linear-to-r from-green-600 to-green-700 p-5 text-white shadow-button transition-transform hover:-translate-y-0.5 sm:p-6"
        >
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/15">
            <Camera className="size-8" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl font-bold">Recycle a Bottle</span>
            <span className="block text-sm text-green-50">Take a photo at a recycling bin to earn points.</span>
          </span>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-green-700">
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
        <Link
          href="/bins"
          className="group flex items-center gap-4 rounded-card border border-blue-100 bg-blue-50 p-5 transition-shadow hover:shadow-card sm:p-6"
        >
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white text-blue-600">
            <MapPin className="size-8" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-xl font-bold text-navy-900">Find a Recycling Bin</span>
            <span className="block text-sm text-muted">View nearby bins on the map around Dili.</span>
          </span>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-card">
            <ArrowRight className="size-5" aria-hidden />
          </span>
        </Link>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        {/* Nearby bins */}
        <section className="card p-4 sm:p-5" aria-labelledby="nearby-bins">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="nearby-bins" className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="size-5 text-green-600" aria-hidden /> Nearby recycling bins
            </h2>
            <Link href="/bins" className="flex min-h-10 items-center gap-0.5 text-sm font-semibold text-green-700 hover:underline">
              View all <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          {binsRes.status === "loading" ? (
            <LoadingState label="Loading bins…" className="h-56 rounded-card bg-blue-50 sm:h-64" />
          ) : (
            <BinMap bins={nearby} compact showLegend={false} className="h-56 sm:h-64" label="Preview map of recycling bins" />
          )}
          <ul className="mt-3 grid gap-1 md:grid-cols-3 xl:grid-cols-1">
            {nearby.slice(0, 3).map((bin) => (
              <li key={bin.id}>
                <BinCard bin={bin} distanceMeters={bin.distanceMeters} unit={settings.distanceUnit} compact href={`/bins?bin=${bin.id}`} />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Distances from {DEMO_REFERENCE_POINT.label}.</p>
        </section>

        {/* Recent activity */}
        <section className="card p-4 sm:p-5" aria-labelledby="recent-activity">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="recent-activity" className="flex items-center gap-2 text-lg font-bold">
              <ClipboardList className="size-5 text-blue-600" aria-hidden /> Recent activity
            </h2>
            <Link href="/history" className="flex min-h-10 items-center gap-0.5 text-sm font-semibold text-blue-600 hover:underline">
              View all <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((s) => (
                <li key={s.id} className="py-1">
                  <SubmissionCard submission={s} onOpen={setOpenSubmission} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No recycling yet"
              description="Your submissions will appear here."
              action={
                <Link href="/recycle/capture" className={buttonClass()}>
                  Recycle a bottle
                </Link>
              }
            />
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Link href="/rewards" className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-raised">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600">
            <Gift className="size-7" aria-hidden />
          </span>
          {reward ? (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-muted">Next reward · coming soon</span>
                <span className="block font-display text-lg font-bold text-navy-900">{reward.title}</span>
                <ProgressBar value={stats.points} max={reward.pointsRequired} label={`Progress toward ${reward.title}`} className="mt-2" />
              </span>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-ink-soft">
                {Math.min(stats.points, reward.pointsRequired)} / {reward.pointsRequired} pts
              </span>
            </>
          ) : (
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg font-bold text-navy-900">Rewards</span>
              <span className="block text-sm text-muted">{rewardsRes.status === "loading" ? "Loading rewards…" : "See what you can earn."}</span>
            </span>
          )}
        </Link>
        <section className="relative overflow-hidden rounded-card border border-green-100 bg-linear-to-r from-green-50 to-teal-50 p-5" aria-labelledby="impact-title">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-white text-green-600 shadow-card">
              <Leaf className="size-7" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="impact-title" className="text-lg font-bold">
                Your impact
              </h2>
              <p className="text-sm text-ink-soft">
                About {formatKg(stats.co2Kg)} CO₂e avoided (estimate). Together we can build a cleaner and healthier
                Timor-Leste.
              </p>
            </div>
          </div>
          <Sprout className="absolute -bottom-3 -right-2 size-24 text-green-600/15" aria-hidden />
        </section>
      </div>

      <SubmissionDetailsDialog submissionId={openSubmission} onClose={() => setOpenSubmission(null)} />
    </div>
  );
}
