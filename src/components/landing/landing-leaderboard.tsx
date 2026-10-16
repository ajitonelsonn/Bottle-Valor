"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Crown, Medal, Milk, RefreshCw, Trophy } from "lucide-react";
import { Button, buttonClass } from "@/components/common/button";
import { PointsCoin } from "@/components/common/points-coin";
import { apiFetch } from "@/lib/api/client";
import { useSignedIn } from "./auth-ctas";
import { cn } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/types";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; leaders: LeaderboardEntry[] };

const PODIUM = [
  { ring: "ring-gold-400", badge: "bg-gold-400 text-navy-950", card: "from-gold-50 to-white border-gold-100", Icon: Crown, label: "1st" },
  { ring: "ring-slate-300", badge: "bg-slate-300 text-navy-950", card: "from-slate-50 to-white border-slate-200", Icon: Medal, label: "2nd" },
  { ring: "ring-[#d29a63]", badge: "bg-[#d29a63] text-white", card: "from-[#fbf1e8] to-white border-[#f0dcc8]", Icon: Medal, label: "3rd" },
] as const;

/** Public leaderboard of top recyclers by points (first name + last initial only). */
export function LandingLeaderboard() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const signedIn = useSignedIn();

  const fetchLeaders = useCallback(() => {
    apiFetch<{ leaders: LeaderboardEntry[] }>("/api/leaderboard", { auth: false })
      .then(({ leaders }) => setLoad({ status: "ready", leaders }))
      .catch(() => setLoad({ status: "error" }));
  }, []);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders]);

  return (
    <section id="leaderboard" className="scroll-mt-20 py-16 lg:py-24" aria-labelledby="leaderboard-title">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-wider text-green-700">Leaderboard</p>
            <h2 id="leaderboard-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">
              Top recyclers in Dili
            </h2>
            <p className="mt-3 text-lg text-ink-soft">
              Ranked by points earned from verified recycling reports. Every bottle counts.
            </p>
          </div>
          <Link
            href={signedIn ? "/history" : "/signup"}
            className={buttonClass({ variant: "secondary", className: "self-start sm:self-auto" })}
          >
            {signedIn ? "See my points" : "Join the ranking"} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-10">
          {load.status === "loading" ? <LeaderboardSkeleton /> : null}

          {load.status === "error" ? (
            <div className="card flex flex-col items-center gap-3 p-8 text-center" role="alert">
              <p className="font-display text-lg font-bold text-navy-900">The leaderboard couldn&apos;t load</p>
              <p className="text-sm text-muted">Check your connection and try again.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLoad({ status: "loading" });
                  fetchLeaders();
                }}
              >
                <RefreshCw className="size-4" aria-hidden /> Try again
              </Button>
            </div>
          ) : null}

          {load.status === "ready" && load.leaders.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 p-10 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-gold-50 text-gold-500">
                <Trophy className="size-8" aria-hidden />
              </span>
              <p className="font-display text-xl font-bold text-navy-900">No one on the leaderboard yet</p>
              <p className="max-w-md text-sm text-muted">
                Recycle a bottle at a BotleValor bin and earn the first points — your name could be at the top.
              </p>
              <Link href={signedIn ? "/recycle/capture" : "/signup"} className={buttonClass({ className: "mt-2" })}>
                {signedIn ? "Recycle a Bottle" : "Get Started"} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ) : null}

          {load.status === "ready" && load.leaders.length > 0 ? <Leaders leaders={load.leaders} /> : null}
        </div>

        <p className="mt-4 text-xs text-muted">
          Only first names and last initials are shown. You can hide yourself from the leaderboard in Settings.
        </p>
      </div>
    </section>
  );
}

function Leaders({ leaders }: { leaders: LeaderboardEntry[] }) {
  const top = leaders.slice(0, 3);
  const rest = leaders.slice(3);
  return (
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <ol className="grid items-start gap-4 pt-3 sm:grid-cols-3" aria-label="Top three recyclers">
        {top.map((l, i) => {
          const style = PODIUM[i];
          return (
            <li
              key={l.rank}
              className={cn(
                "relative flex flex-col items-center rounded-card border bg-linear-to-b p-5 text-center shadow-card",
                style.card,
                i === 0 && "sm:-translate-y-3",
              )}
            >
              <span className={cn("absolute -top-3 rounded-full px-3 py-1 text-xs font-bold shadow-card", style.badge)}>
                {style.label}
              </span>
              <style.Icon className={cn("mt-2 size-6", i === 0 ? "text-gold-500" : "text-subtle")} aria-hidden />
              <span
                aria-hidden
                className={cn(
                  "mt-2 flex size-16 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-green-600 font-display text-xl font-bold text-white ring-4",
                  style.ring,
                )}
              >
                {l.initials}
              </span>
              <p className="mt-3 truncate font-display text-lg font-bold text-navy-900" title={l.name}>
                {l.name}
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-display text-2xl font-extrabold text-navy-950">
                <PointsCoin size={24} className="drop-shadow-none" />
                {l.points.toLocaleString("en")}
                <span className="text-sm font-semibold text-muted">pts</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                <Milk className="size-4 text-blue-600" aria-hidden />
                {l.bottles} bottle{l.bottles === 1 ? "" : "s"} recycled
              </p>
            </li>
          );
        })}
      </ol>

      <div className="card overflow-hidden">
        {rest.length ? (
          <ol aria-label="Ranks 4 to 10" className="divide-y divide-line">
            {rest.map((l) => (
              <li key={l.rank} className="flex items-center gap-3 px-4 py-3">
                <span className="w-7 text-center font-display text-lg font-bold text-subtle">{l.rank}</span>
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-blue-600 to-green-600 text-sm font-bold text-white"
                >
                  {l.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-navy-900">{l.name}</span>
                  <span className="text-xs text-muted">
                    {l.bottles} bottle{l.bottles === 1 ? "" : "s"}
                  </span>
                </span>
                <span className="shrink-0 font-display font-bold tabular-nums text-green-700">{l.points.toLocaleString("en")} pts</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
            <Trophy className="size-7 text-gold-500" aria-hidden />
            <p className="font-semibold text-navy-900">Spots 4–10 are open</p>
            <p className="text-sm text-muted">Recycle at a BotleValor bin to climb the ranking.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div role="status" aria-label="Loading leaderboard" className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-60 animate-pulse rounded-card bg-blue-50" />
        ))}
      </div>
      <div className="h-60 animate-pulse rounded-card bg-blue-50" />
    </div>
  );
}
