"use client";

import Link from "next/link";
import { useMemo, useState, type SubmitEvent } from "react";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  Cloud,
  Crown,
  Globe,
  Leaf,
  Mail,
  MapPin,
  Milk,
  Pencil,
  Settings,
  Sprout,
  User,
} from "lucide-react";
import { Button, buttonClass } from "@/components/common/button";
import { Dialog } from "@/components/common/dialog";
import { SelectField, TextField } from "@/components/common/form-field";
import { PageHeader } from "@/components/common/page-header";
import { PointsCoin } from "@/components/common/points-coin";
import { ProgressBar } from "@/components/common/progress-bar";
import { StatCard } from "@/components/common/stat-card";
import { EmptyState } from "@/components/common/states";
import { useToast } from "@/components/common/toast";
import { ProfileSummary } from "./profile-summary";
import { SubmissionCard } from "@/components/recycling/submission-card";
import { SubmissionDetailsDialog } from "@/components/recycling/submission-details-dialog";
import { cn, formatDate, formatKg, formatPoints } from "@/lib/format";
import { LANGUAGES } from "@/lib/i18n/messages";
import { LEVELS } from "@/lib/config";
import { computeStats, levelForPoints, sortByNewest } from "@/lib/selectors";
import { actions, useAppState } from "@/lib/store/app-store";
import type { LanguageCode, UserProfile } from "@/lib/types";

export function ProfileView() {
  const { profile, submissions, ledger } = useAppState();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [openSubmission, setOpenSubmission] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(submissions, ledger), [submissions, ledger]);
  const level = levelForPoints(stats.points);
  const recent = useMemo(() => sortByNewest(submissions).slice(0, 4), [submissions]);
  const language = LANGUAGES.find((l) => l.code === profile.language)?.label ?? "English";

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your account, view your progress, and make a bigger impact for a cleaner Timor-Leste."
      />
      <ProfileSummary profile={profile} onEdit={() => setEditing(true)} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <section className="card p-5" aria-labelledby="personal-info">
            <div className="flex items-center justify-between gap-3">
              <h2 id="personal-info" className="flex items-center gap-2 text-lg font-bold">
                <User className="size-5 text-blue-600" aria-hidden /> Personal information
              </h2>
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden /> Edit
              </Button>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoItem icon={<User className="size-4.5" />} label="Full name" value={profile.name} />
              <InfoItem
                icon={<Mail className="size-4.5" />}
                label="Email address"
                value={
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="break-all">{profile.email}</span>
                    {profile.emailVerified ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">Verified</span>
                    ) : null}
                  </span>
                }
              />
              <InfoItem icon={<Globe className="size-4.5" />} label="Language" value={language} />
              <InfoItem icon={<MapPin className="size-4.5" />} label="Location" value={profile.city} />
            </dl>
          </section>

          <section className="card p-5" aria-labelledby="stats-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="stats-title" className="text-lg font-bold">
                Recycling statistics
              </h2>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <StatCard tone="gold" icon={<PointsCoin size={30} className="drop-shadow-none" />} value={formatPoints(stats.points)} label="Total points" trend={`${formatPoints(stats.pointsThisMonth, true)} this month`} />
              <StatCard tone="blue" icon={<Milk className="size-6" aria-hidden />} value={stats.bottles} label="Bottles recycled" trend={`+${stats.bottlesThisMonth} this month`} />
              <StatCard tone="green" icon={<Leaf className="size-6" aria-hidden />} value={formatKg(stats.plasticKg)} label="Plastic saved (est.)" />
              <StatCard tone="violet" icon={<Cloud className="size-6" aria-hidden />} value={formatKg(stats.co2Kg)} label="CO₂e reduced (est.)" />
            </div>
          </section>

          <section className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between" aria-label="Account settings">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Settings className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-navy-900">Account &amp; security</p>
                <p className="text-sm text-muted">Email, password, notifications and privacy.</p>
              </div>
            </div>
            <Link href="/settings" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Manage settings <ChevronRight className="size-4" aria-hidden />
            </Link>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5" aria-labelledby="level-title">
            <div className="flex items-center justify-between">
              <h2 id="level-title" className="flex items-center gap-2 text-lg font-bold">
                <Crown className="size-5 text-navy-800" aria-hidden /> Your level
              </h2>
              <button
                type="button"
                onClick={() => setLevelsOpen(true)}
                className="flex min-h-10 items-center gap-0.5 rounded-lg px-1 text-sm font-semibold text-blue-600 hover:underline"
              >
                View all levels <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <LevelBadge index={level.index} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-bold text-navy-900">{level.current.name}</p>
                <p className="text-sm text-muted">{level.next ? `Keep recycling to reach ${level.next.name}.` : "Top level reached!"}</p>
              </div>
            </div>
            {level.next ? (
              <>
                <ProgressBar value={stats.points} max={level.next.minPoints} label={`Progress to ${level.next.name}`} className="mt-4" />
                <p className="mt-1.5 text-right text-sm font-semibold tabular-nums text-ink-soft">
                  {stats.points} / {level.next.minPoints} pts
                </p>
              </>
            ) : null}
          </section>

          <section className="card flex items-start gap-4 p-5" aria-labelledby="member-since">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="member-since" className="text-base font-bold">
                Member since
              </h2>
              <p className="font-display text-xl font-bold text-navy-900">{formatDate(profile.memberSince)}</p>
              <p className="mt-1 text-sm text-muted">Thank you for being part of a cleaner and brighter Timor-Leste!</p>
            </div>
            <Sprout className="size-12 shrink-0 text-green-500" aria-hidden />
          </section>

          <section className="card p-5" aria-labelledby="profile-activity">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="profile-activity" className="flex items-center gap-2 text-lg font-bold">
                <Clock className="size-5 text-navy-800" aria-hidden /> Recent activity
              </h2>
              <Link href="/history" className="flex min-h-10 items-center text-sm font-semibold text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {recent.length ? (
              <ul className="divide-y divide-line">
                {recent.map((s) => (
                  <li key={s.id} className="py-1">
                    <SubmissionCard submission={s} onOpen={setOpenSubmission} compact />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No activity yet" />
            )}
          </section>
        </aside>
      </div>

      <EditProfileDialog
        open={editing}
        onClose={() => setEditing(false)}
        profile={profile}
        onSaved={() => notify({ tone: "success", title: "Profile updated" })}
      />

      <Dialog open={levelsOpen} onClose={() => setLevelsOpen(false)} title="Contributor levels" description="Levels are based on your lifetime points.">
        <ul className="space-y-3">
          {LEVELS.map((l, i) => (
            <li
              key={l.id}
              className={cn("flex items-center gap-4 rounded-2xl border p-3", i === level.index ? "border-green-400 bg-green-50" : "border-line")}
            >
              <LevelBadge index={i} size="sm" />
              <div className="flex-1">
                <p className="font-semibold text-navy-900">
                  {l.name} {i === level.index ? <span className="text-sm font-medium text-green-700">· current</span> : null}
                </p>
                <p className="text-sm text-muted">{l.description}</p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-ink-soft">{l.minPoints}+ pts</p>
            </li>
          ))}
        </ul>
      </Dialog>

      <SubmissionDetailsDialog submissionId={openSubmission} onClose={() => setOpenSubmission(null)} />
    </>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 text-muted" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-sm text-muted">{label}</dt>
        <dd className="font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}

const LEVEL_STYLES = [
  "from-[#c98a4b] to-[#8a5a2b] text-white",
  "from-green-400 to-green-700 text-white",
  "from-blue-500 to-blue-700 text-gold-400",
  "from-violet-600 to-[#4b2fb0] text-white",
];

function LevelBadge({ index, size = "md" }: { index: number; size?: "sm" | "md" }) {
  const Icon = index >= 3 ? Crown : index === 0 ? Sprout : Leaf;
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-linear-to-br shadow-card [clip-path:polygon(50%_0,93%_25%,93%_75%,50%_100%,7%_75%,7%_25%)]",
        LEVEL_STYLES[index] ?? LEVEL_STYLES[0],
        size === "md" ? "size-20" : "size-12",
      )}
    >
      <Icon className={size === "md" ? "size-9" : "size-5"} />
    </span>
  );
}

function EditProfileDialog({
  open,
  onClose,
  profile,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaved: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} title="Edit profile">
      {open ? <EditProfileForm profile={profile} onClose={onClose} onSaved={onSaved} /> : null}
    </Dialog>
  );
}

function EditProfileForm({ profile, onClose, onSaved }: { profile: UserProfile; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [language, setLanguage] = useState<LanguageCode>(profile.language);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (saving) return;
    if (name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    setSaving(true);
    try {
      await actions.updateProfile({ name: name.trim(), bio: bio.trim(), language });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile. Please try again.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={error} autoComplete="name" />
      <SelectField
        label="Language preference"
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        options={LANGUAGES.map((l) => ({ value: l.code, label: l.available ? l.label : `${l.label} (coming soon)`, disabled: !l.available }))}
      />
      <div>
        <label htmlFor="profile-bio" className="mb-1.5 block text-sm font-medium text-ink-soft">
          About you <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="profile-bio"
          value={bio}
          maxLength={140}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded-control border border-line-strong px-3.5 py-2.5 text-[0.95rem] focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
        <p className="mt-1 text-right text-xs text-muted">{bio.length}/140</p>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} loadingText="Saving…">
          Save changes
        </Button>
      </div>
    </form>
  );
}
