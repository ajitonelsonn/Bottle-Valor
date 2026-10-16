"use client";

import { useState, type SubmitEvent } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronRight,
  Clock,
  FileText,
  Gift,
  Globe,
  HelpCircle,
  Info,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Ruler,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Trophy,
  User,
} from "lucide-react";
import { LegalDialog, type LegalDoc } from "@/components/auth/legal-dialogs";
import { EMAIL_PASSWORD_AUTH_ENABLED } from "@/lib/config";
import { changePassword } from "@/lib/firebase/auth-actions";
import { Button } from "@/components/common/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Dialog } from "@/components/common/dialog";
import { PasswordField, SelectField } from "@/components/common/form-field";
import { PageHeader } from "@/components/common/page-header";
import { Switch } from "@/components/common/switch";
import { InlineAlert, useToast } from "@/components/common/toast";
import { formatDate, formatTime } from "@/lib/format";
import { LANGUAGES } from "@/lib/i18n/messages";
import { actions, useAppState } from "@/lib/store/app-store";
import type { AppSettings, DateFormat, DistanceUnit, LanguageCode, TimeFormat } from "@/lib/types";
import { SettingRow, SettingsSection } from "./settings-section";

const APP_VERSION = "0.1.0";
const SAMPLE_DATE = "2026-10-15T14:30:00+09:00";

type NotificationKey = keyof AppSettings["notifications"];
type PrivacyKey = keyof AppSettings["privacy"];

const NOTIFICATIONS: { key: NotificationKey; label: string; description: string; icon: React.ReactNode }[] = [
  { key: "submissionUpdates", label: "Recycling submission updates", description: "When your submission is verified or needs attention.", icon: <Bell className="size-5" /> },
  { key: "pointsAndRewards", label: "Points and rewards", description: "New rewards and points milestones.", icon: <Gift className="size-5" /> },
  { key: "nearbyBins", label: "Nearby bin updates", description: "When new recycling bins are added near you.", icon: <MapPin className="size-5" /> },
  { key: "tips", label: "Tips and educational content", description: "Recycling tips and environmental impact news.", icon: <Lightbulb className="size-5" /> },
];

export function SettingsView() {
  const { settings, profile } = useAppState();
  const { notify } = useToast();
  const [confirm, setConfirm] = useState<"clear-location" | "delete-account" | "sign-out" | null>(null);
  const [legal, setLegal] = useState<LegalDoc | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [leaderboardSaving, setLeaderboardSaving] = useState(false);

  const update = (patch: Partial<AppSettings>) => actions.updateSettings((s) => ({ ...s, ...patch }));
  const setNotification = (key: NotificationKey, value: boolean) =>
    actions.updateSettings((s) => ({ ...s, notifications: { ...s.notifications, [key]: value } }));
  const setPrivacy = (key: PrivacyKey, value: boolean) =>
    actions.updateSettings((s) => ({ ...s, privacy: { ...s.privacy, [key]: value } }));

  return (
    <>
      <PageHeader title="Settings" description="Customize your experience and manage your account preferences." />
      <p className="-mt-3 mb-5 flex items-center gap-2 text-sm text-muted">
        <Info className="size-4 text-blue-600" aria-hidden /> Display and privacy preferences are saved on this device.
      </p>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <SettingsSection icon={<Settings className="size-6" />} title="General settings" description="App preferences and language.">
            <SettingRow
              icon={<Globe className="size-5" />}
              label="Language"
              control={
                <SelectField
                  label="Language"
                  hideLabel
                  value={settings.language}
                  onChange={(e) => update({ language: e.target.value as LanguageCode })}
                  options={LANGUAGES.map((l) => ({ value: l.code, label: l.available ? l.label : `${l.label} (soon)`, disabled: !l.available }))}
                />
              }
            />
            <SettingRow
              icon={<Sun className="size-5" />}
              label="Theme"
              description="Dark mode is planned for a later release."
              control={
                <SelectField
                  label="Theme"
                  hideLabel
                  value={settings.theme}
                  onChange={(e) => update({ theme: e.target.value as AppSettings["theme"] })}
                  options={[
                    { value: "light", label: "Light (default)" },
                    { value: "dark", label: "Dark (coming soon)", disabled: true },
                  ]}
                />
              }
            />
            <SettingRow
              icon={<Ruler className="size-5" />}
              label="Distance unit"
              description="Used for bin distances."
              control={
                <SelectField
                  label="Distance unit"
                  hideLabel
                  value={settings.distanceUnit}
                  onChange={(e) => update({ distanceUnit: e.target.value as DistanceUnit })}
                  options={[
                    { value: "km", label: "Kilometres (km)" },
                    { value: "mi", label: "Miles (mi)" },
                  ]}
                />
              }
            />
            <SettingRow
              icon={<CalendarDays className="size-5" />}
              label="Date format"
              control={
                <SelectField
                  label="Date format"
                  hideLabel
                  value={settings.dateFormat}
                  onChange={(e) => update({ dateFormat: e.target.value as DateFormat })}
                  options={(["medium", "dmy", "iso"] as DateFormat[]).map((f) => ({ value: f, label: formatDate(SAMPLE_DATE, f) }))}
                />
              }
            />
            <SettingRow
              icon={<Clock className="size-5" />}
              label="Time format"
              control={
                <SelectField
                  label="Time format"
                  hideLabel
                  value={settings.timeFormat}
                  onChange={(e) => update({ timeFormat: e.target.value as TimeFormat })}
                  options={(["24h", "12h"] as TimeFormat[]).map((f) => ({
                    value: f,
                    label: `${f === "24h" ? "24-hour" : "12-hour"} (${formatTime(SAMPLE_DATE, f)})`,
                  }))}
                />
              }
            />
          </SettingsSection>

          <SettingsSection icon={<Bell className="size-6" />} title="Notifications" description="Choose what updates you want to receive.">
            {NOTIFICATIONS.map((n) => (
              <SettingRow
                key={n.key}
                icon={n.icon}
                label={n.label}
                description={n.description}
                descriptionId={`notif-${n.key}-desc`}
                control={
                  <Switch
                    label={n.label}
                    describedBy={`notif-${n.key}-desc`}
                    checked={settings.notifications[n.key]}
                    onChange={(v) => setNotification(n.key, v)}
                  />
                }
              />
            ))}
            <p className="pt-3 text-xs text-muted">Email and push notifications aren&apos;t available yet. Your verification results appear in the bell menu.</p>
          </SettingsSection>

          <SettingsSection icon={<Shield className="size-6" />} title="Location & privacy" description="Manage how your location is used.">
            <SettingRow
              icon={<MapPin className="size-5" />}
              label="Use my location"
              description="Needed to find nearby bins and to submit recycling evidence."
              descriptionId="privacy-use-desc"
              control={
                <Switch
                  label="Use my location"
                  describedBy="privacy-use-desc"
                  checked={settings.privacy.useLocation}
                  onChange={(v) => setPrivacy("useLocation", v)}
                />
              }
            />
            <SettingRow
              icon={<ShieldCheck className="size-5" />}
              label="Save location with submissions"
              description="Keep your device location on each submission record."
              descriptionId="privacy-save-desc"
              control={
                <Switch
                  label="Save location with submissions"
                  describedBy="privacy-save-desc"
                  checked={settings.privacy.saveLocationWithSubmissions}
                  onChange={(v) => setPrivacy("saveLocationWithSubmissions", v)}
                />
              }
            />
            <SettingRow
              icon={<Trophy className="size-5" />}
              label="Show me on the public leaderboard"
              description="Only your first name and last initial are shown, with your points."
              descriptionId="privacy-leaderboard-desc"
              control={
                <Switch
                  label="Show me on the public leaderboard"
                  describedBy="privacy-leaderboard-desc"
                  checked={profile.showOnLeaderboard}
                  disabled={leaderboardSaving}
                  onChange={async (v) => {
                    setLeaderboardSaving(true);
                    try {
                      await actions.updateProfile({ showOnLeaderboard: v });
                      notify({ tone: "success", title: v ? "You're on the leaderboard" : "Hidden from the leaderboard" });
                    } catch (err) {
                      notify({ tone: "error", title: "Couldn't update", body: err instanceof Error ? err.message : undefined });
                    } finally {
                      setLeaderboardSaving(false);
                    }
                  }}
                />
              }
            />
            <SettingRow
              icon={<Trash2 className="size-5 text-danger-600" />}
              label="Clear location history"
              description="Remove saved device locations from your submissions."
              control={
                <Button variant="danger-outline" size="sm" onClick={() => setConfirm("clear-location")}>
                  Clear data
                </Button>
              }
            />
          </SettingsSection>
        </div>

        <div className="space-y-5">
          <SettingsSection icon={<User className="size-6" />} title="Account settings" description="Your login information.">
            <SettingRow
              icon={<Mail className="size-5" />}
              label="Email address"
              description={<span className="break-all">{profile.email}</span>}
              control={
                <Button variant="secondary" size="sm" onClick={() => setEmailOpen(true)}>
                  Change
                </Button>
              }
            />
            {EMAIL_PASSWORD_AUTH_ENABLED ? (
            <SettingRow
                icon={<Lock className="size-5" />}
                label="Password"
                description="••••••••"
                control={
                  <Button variant="secondary" size="sm" onClick={() => setPasswordOpen(true)}>
                    Change
                  </Button>
                }
              />
            ) : null}
            <SettingRow
              icon={<LogOut className="size-5" />}
              label="Sign out"
              description="End your session on this device."
              control={
                <Button variant="secondary" size="sm" onClick={() => setConfirm("sign-out")}>
                  Sign out
                </Button>
              }
            />
          </SettingsSection>

          <SettingsSection icon={<Info className="size-6" />} title="App information" description="Version details and useful links.">
            <SettingRow
              icon={<Smartphone className="size-5" />}
              label="App version"
              control={
                <span className="flex items-center gap-2 text-sm sm:justify-end">
                  <span className="font-semibold tabular-nums">{APP_VERSION}</span>
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">Beta</span>
                </span>
              }
            />
            {(
              [
                { doc: "terms", label: "Terms of Service", icon: <FileText className="size-5" /> },
                { doc: "privacy", label: "Privacy Policy", icon: <Shield className="size-5" /> },
                { doc: "help", label: "Help & Support", icon: <HelpCircle className="size-5" /> },
                { doc: "about", label: "About BotleValor", icon: <Info className="size-5" /> },
              ] as const
            ).map((item) => (
              <button
                key={item.doc}
                type="button"
                onClick={() => setLegal(item.doc)}
                className="flex min-h-13 w-full items-center gap-3 py-3 text-left font-medium text-ink hover:text-green-700"
              >
                <span className="text-ink-soft" aria-hidden>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </button>
            ))}
          </SettingsSection>

          <SettingsSection
            tone="danger"
            icon={<AlertTriangle className="size-6" />}
            title="Danger zone"
            description="These actions cannot be undone."
          >
            <SettingRow
              icon={<Trash2 className="size-5 text-danger-600" />}
              label={<span className="text-danger-700">Delete account</span>}
              description="Permanently delete your account and all data, including points, history and personal information."
              control={
                <Button variant="danger-outline" size="sm" onClick={() => setConfirm("delete-account")}>
                  Delete account
                </Button>
              }
            />
          </SettingsSection>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === "clear-location"}
        onClose={() => setConfirm(null)}
        title="Clear location history?"
        description="Saved device locations will be removed from your submission records on this device."
        confirmLabel="Clear location data"
        tone="danger"
        onConfirm={async () => {
          try {
            await actions.clearLocationHistory();
            notify({ tone: "success", title: "Location history cleared" });
          } catch (err) {
            notify({ tone: "error", title: "Couldn't clear location history", body: err instanceof Error ? err.message : undefined });
          }
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === "sign-out"}
        onClose={() => setConfirm(null)}
        title="Sign out?"
        description="You'll need to log in again to continue recycling and earning points."
        confirmLabel="Sign out"
        onConfirm={async () => {
          setConfirm(null);
          await actions.signOut();
        }}
      />
      <ConfirmDialog
        open={confirm === "delete-account"}
        onClose={() => setConfirm(null)}
        title="Delete your account?"
        description={
          <>
            This permanently deletes your account, points, history and photos.{" "}
            <strong>In-app deletion isn&apos;t available yet</strong> — confirming will not delete anything.
          </>
        }
        confirmLabel="Delete account"
        tone="danger"
        confirmPhrase="DELETE"
        onConfirm={async () => {
          setConfirm(null);
          notify({ tone: "info", title: "Account deletion isn't available yet", body: "Nothing was deleted. This option is coming in a future update." });
        }}
      />

      <Dialog
        open={emailOpen}
        onClose={() => setEmailOpen(false)}
        title="Change email address"
        footer={<Button onClick={() => setEmailOpen(false)}>Got it</Button>}
      >
        <InlineAlert tone="info" title="Coming soon">
          Changing your email address isn&apos;t available in the app yet. Your current email is{" "}
          <strong className="break-all">{profile.email}</strong>.
        </InlineAlert>
      </Dialog>

      <Dialog open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Change password">
        {passwordOpen ? (
          <ChangePasswordForm
            onDone={() => {
              setPasswordOpen(false);
              notify({ tone: "success", title: "Password updated" });
            }}
            onCancel={() => setPasswordOpen(false)}
          />
        ) : null}
      </Dialog>

      <LegalDialog doc={legal} onClose={() => setLegal(null)} />
    </>
  );
}

function ChangePasswordForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [values, setValues] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof values, string>>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (busy) return;
    const next: typeof errors = {};
    if (!values.current) next.current = "Enter your current password.";
    if (values.next.length < 6) next.next = "Use at least 6 characters.";
    else if (values.next === values.current) next.next = "Choose a different password.";
    if (values.confirm !== values.next) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const result = await changePassword(values.current, values.next);
    setBusy(false);
    if (!result.ok) {
      setErrors({ current: result.error });
      return;
    }
    onDone();
  }

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <PasswordField label="Current password" autoComplete="current-password" value={values.current} onChange={set("current")} error={errors.current} />
      <PasswordField label="New password" autoComplete="new-password" value={values.next} onChange={set("next")} error={errors.next} />
      <PasswordField label="Confirm new password" autoComplete="new-password" value={values.confirm} onChange={set("confirm")} error={errors.confirm} />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy} loadingText="Saving…">
          Update password
        </Button>
      </div>
    </form>
  );
}
