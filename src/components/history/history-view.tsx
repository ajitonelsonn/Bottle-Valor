"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Cloud, Gift, Leaf, MapPin, Milk, Search } from "lucide-react";
import { Button, buttonClass } from "@/components/common/button";
import { PageHeader } from "@/components/common/page-header";
import { PointsBalanceCard } from "@/components/common/points-balance-card";
import { ProgressBar } from "@/components/common/progress-bar";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { EvidenceImage } from "@/components/recycling/evidence-image";
import { SubmissionCard } from "@/components/recycling/submission-card";
import { SubmissionDetailsDialog } from "@/components/recycling/submission-details-dialog";
import { cn, formatDate, formatDateTime, formatKg, formatPoints, formatTime } from "@/lib/format";
import { MATERIALS } from "@/lib/materials";
import { computeStats, sortByNewest } from "@/lib/selectors";
import { featuredReward, useRewards } from "@/lib/data/catalog";
import { useAppState } from "@/lib/store/app-store";
import { ActivityChart } from "./activity-chart";
import { DEFAULT_FILTERS, HistoryFilters, applyHistoryFilters, type HistoryFilterState } from "./history-filters";

const PAGE_SIZE = 6;


export function HistoryView() {
  const { submissions, ledger, settings } = useAppState();
  const [tab, setTab] = useState<"recycling" | "points">("recycling");
  const [filters, setFilters] = useState<HistoryFilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(submissions, ledger), [submissions, ledger]);
  const sorted = useMemo(() => sortByNewest(submissions), [submissions]);
  const filtered = useMemo(() => applyHistoryFilters(sorted, filters), [sorted, filters]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const rewardsRes = useRewards();
  const reward = featuredReward(rewardsRes.status === "ready" ? rewardsRes.data : undefined);

  function updateFilters(next: HistoryFilterState) {
    setFilters(next);
    setPage(1);
  }

  return (
    <>
      <PageHeader title="Points & Recycling History" description="Track your recycling journey and see your positive impact." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PointsBalanceCard points={stats.points} caption="Total points" trend={`${formatPoints(stats.pointsThisMonth, true)} this month`} />
        <StatCard tone="blue" icon={<Milk className="size-6" aria-hidden />} value={stats.bottles} label="Bottles recycled" trend={`+${stats.bottlesThisMonth} this month`} />
        <StatCard
          tone="green"
          icon={<Leaf className="size-6" aria-hidden />}
          value={formatKg(stats.plasticKg)}
          label="Plastic saved (est.)"
          trend={`+${formatKg(stats.plasticKgThisMonth)} this month`}
        />
        <StatCard
          tone="violet"
          icon={<Cloud className="size-6" aria-hidden />}
          value={formatKg(stats.co2Kg)}
          label="CO₂e reduced (est.)"
          trend={`+${formatKg(stats.co2KgThisMonth)} this month`}
        />
      </div>
      <p className="mt-2 text-xs text-muted">Plastic and CO₂e figures are rough estimates based on typical per-bottle weights.</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <ActivityChart submissions={submissions} />
        <section className="card flex flex-col p-5" aria-labelledby="next-reward-title">
          {reward ? (
            <>
              <div className="flex items-start gap-4">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-600">
                  <Gift className="size-7" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted">Next reward · coming soon</p>
                  <h2 id="next-reward-title" className="text-lg font-bold">
                    {reward.title}
                  </h2>
                  <p className="text-sm text-muted">{reward.subtitle}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-ink-soft">
                  {Math.min(stats.points, reward.pointsRequired)} / {reward.pointsRequired} pts
                </p>
              </div>
              <ProgressBar value={stats.points} max={reward.pointsRequired} label={`Progress toward ${reward.title}`} className="mt-4" />
              <p className="mt-3 text-sm text-muted">
                {stats.points >= reward.pointsRequired
                  ? "You've reached this reward's points level. Redemption isn't available yet."
                  : `${reward.pointsRequired - stats.points} more points to reach this reward.`}
              </p>
            </>
          ) : (
            <h2 id="next-reward-title" className="text-lg font-bold">
              Rewards
            </h2>
          )}
          <Link href="/rewards" className={buttonClass({ variant: "soft", className: "mt-auto self-start" })}>
            Explore rewards <ChevronRight className="size-4" aria-hidden />
          </Link>
        </section>
      </div>

      <section className="card mt-5" aria-label="History">
        <div role="tablist" aria-label="History type" className="flex gap-1 border-b border-line px-3 pt-2 sm:px-5">
          {(
            [
              { id: "recycling", label: "Recycling history" },
              { id: "points", label: "Points history" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-px min-h-12 border-b-[3px] px-3 text-sm font-semibold sm:px-4 sm:text-base",
                tab === t.id ? "border-green-600 text-green-700" : "border-transparent text-muted hover:text-navy-900",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "recycling" ? (
          <div role="tabpanel" id="panel-recycling" aria-labelledby="tab-recycling" className="p-3 sm:p-5">
            <HistoryFilters value={filters} onChange={updateFilters} />
            <p className="mt-3 text-sm text-muted" aria-live="polite">
              Showing {filtered.length ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ` : ""}
              {filtered.length} submission{filtered.length === 1 ? "" : "s"}
            </p>

            {!filtered.length ? (
              <EmptyState
                icon={<Search className="size-7" aria-hidden />}
                title={submissions.length ? "No submissions match these filters" : "No recycling history yet"}
                description={submissions.length ? "Try a different status, date range or search." : "Recycle your first bottle to see it here."}
                action={
                  submissions.length ? (
                    <Button variant="secondary" onClick={() => updateFilters(DEFAULT_FILTERS)}>
                      Clear filters
                    </Button>
                  ) : (
                    <Link href="/recycle/capture" className={buttonClass()}>
                      Recycle a bottle
                    </Link>
                  )
                }
              />
            ) : (
              <>
                {/* Mobile: cards */}
                <ul className="mt-3 divide-y divide-line md:hidden">
                  {pageItems.map((s) => (
                    <li key={s.id} className="py-1">
                      <SubmissionCard submission={s} onOpen={setOpenId} />
                    </li>
                  ))}
                </ul>

                {/* Tablet/desktop: table */}
                <div className="mt-3 hidden overflow-x-auto md:block">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Recycling submissions</caption>
                    <thead>
                      <tr className="border-b border-line text-muted">
                        <th scope="col" className="px-3 py-3 font-medium">Date & time</th>
                        <th scope="col" className="px-3 py-3 font-medium">Photo</th>
                        <th scope="col" className="px-3 py-3 font-medium">Material</th>
                        <th scope="col" className="px-3 py-3 font-medium">Bin location</th>
                        <th scope="col" className="px-3 py-3 font-medium">Points</th>
                        <th scope="col" className="px-3 py-3 font-medium">Status</th>
                        <th scope="col" className="px-3 py-3"><span className="sr-only">Details</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {pageItems.map((s) => (
                        <tr key={s.id} className="cursor-pointer hover:bg-canvas" onClick={() => setOpenId(s.id)}>
                          <td className="whitespace-nowrap px-3 py-3 text-ink">
                            {formatDate(s.createdAt, settings.dateFormat)}
                            <span className="block text-muted">{formatTime(s.createdAt, settings.timeFormat)}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className="relative block size-12 overflow-hidden rounded-lg bg-blue-50">
                              <EvidenceImage submissionId={s.id} alt="" hasPhoto={s.hasPhoto} />
                            </span>
                          </td>
                          <td className="px-3 py-3 text-ink">
                            <span className="flex items-center gap-2">
                              <Milk className="size-4.5 shrink-0 text-blue-600" aria-hidden />
                              <span>
                                {MATERIALS[s.material].label}
                                <span className="block text-xs text-muted">
                                  {s.bottleCount} bottle{s.bottleCount === 1 ? "" : "s"}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 size-4 shrink-0 text-navy-800" aria-hidden />
                              <span>
                                <span className="block font-medium text-ink">{s.binName}</span>
                                <span className="text-xs text-muted">{s.binArea}</span>
                              </span>
                            </span>
                          </td>
                          <td className={cn("whitespace-nowrap px-3 py-3 font-bold", s.points > 0 ? "text-green-700" : "text-muted")}>
                            {formatPoints(s.points, true)}
                          </td>
                          <td className="px-3 py-3">
                            <StatusBadge status={s.status} />
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenId(s.id);
                              }}
                              className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-white hover:text-navy-900"
                              aria-label={`View details for submission ${s.id}`}
                            >
                              <ChevronRight className="size-5" aria-hidden />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pageCount > 1 ? (
                  <nav aria-label="Pagination" className="mt-4 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex size-10 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas disabled:text-line-strong"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="size-5" aria-hidden />
                    </button>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setPage(n)}
                        aria-current={n === currentPage ? "page" : undefined}
                        aria-label={`Page ${n}`}
                        className={cn(
                          "flex size-10 items-center justify-center rounded-lg text-sm font-semibold",
                          n === currentPage ? "bg-green-600 text-white" : "text-ink-soft hover:bg-canvas",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage === pageCount}
                      className="flex size-10 items-center justify-center rounded-lg text-ink-soft hover:bg-canvas disabled:text-line-strong"
                      aria-label="Next page"
                    >
                      <ChevronRight className="size-5" aria-hidden />
                    </button>
                  </nav>
                ) : null}
              </>
            )}
          </div>
        ) : (
          <div role="tabpanel" id="panel-points" aria-labelledby="tab-points" className="p-3 sm:p-5">
            <p className="text-sm text-muted">Every change to your balance is recorded as a ledger entry.</p>
            {ledger.length ? (
              <ul className="mt-3 divide-y divide-line">
                {sortByNewest(ledger).map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <Leaf className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{e.description}</p>
                      <p className="text-sm text-muted">
                        {formatDateTime(e.createdAt, settings.dateFormat, settings.timeFormat)}
                        {e.submissionId ? (
                          <>
                            {" · "}
                            <button type="button" onClick={() => setOpenId(e.submissionId!)} className="font-medium text-blue-600 hover:underline">
                              {e.submissionId}
                            </button>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <span className={cn("shrink-0 font-bold", e.points >= 0 ? "text-green-700" : "text-danger-600")}>
                      {formatPoints(e.points, true)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No points yet" description="Verified recycling submissions add points here." />
            )}
          </div>
        )}
      </section>

      <SubmissionDetailsDialog submissionId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
