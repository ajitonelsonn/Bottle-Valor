"use client";

import Link from "next/link";
import { Bell, CheckCheck, LogOut, MapPin, Settings, User } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Avatar } from "@/components/common/avatar";
import { formatDateTime } from "@/lib/format";
import { actions, useAppState } from "@/lib/store/app-store";
import { LanguageSelect } from "./language-select";
import { usePopover } from "./use-popover";

/** Notifications are derived from the user's own verification results. */
function useNotifications() {
  const { submissions } = useAppState();
  return submissions
    .filter((s) => s.status !== "pending")
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      title:
        s.status === "verified"
          ? `Submission verified · +${s.points} pt${s.points === 1 ? "" : "s"}`
          : s.status === "needs-review"
            ? "Submission needs review"
            : "Submission not verified",
      body: `${s.binName}${s.status === "verified" ? "" : ` — ${s.explanation ?? ""}`}`,
    }));
}

function NotificationsMenu() {
  const { readNotificationIds, settings } = useAppState();
  const { open, rootRef, triggerRef, toggle } = usePopover();
  const notifications = useNotifications();
  const unread = notifications.filter((n) => !readNotificationIds.includes(n.id));
  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications${unread.length ? ` (${unread.length} unread)` : ""}`}
        className="relative flex size-11 items-center justify-center rounded-xl border border-line bg-white text-navy-900 shadow-card hover:bg-blue-50"
      >
        <Bell className="size-5" aria-hidden />
        {unread.length ? <span className="absolute right-2 top-2 size-2.5 rounded-full bg-danger-600 ring-2 ring-white" /> : null}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-fade-in rounded-2xl border border-line bg-white p-2 shadow-raised"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <p className="font-display font-bold text-navy-900">Notifications</p>
            <button
              type="button"
              disabled={!unread.length}
              onClick={() => actions.markNotificationsRead(notifications.map((n) => n.id))}
              className="flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:text-subtle disabled:hover:bg-transparent"
            >
              <CheckCheck className="size-4" aria-hidden />
              Mark all read
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">No notifications yet. Results of your recycling reports will appear here.</li>
            ) : null}
            {notifications.map((n) => {
              const isUnread = !readNotificationIds.includes(n.id);
              return (
                <li key={n.id} className="rounded-xl px-3 py-2.5 hover:bg-canvas">
                  <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {isUnread ? <span className="size-2 rounded-full bg-blue-600" aria-label="Unread" /> : null}
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-subtle">{formatDateTime(n.createdAt, settings.dateFormat, settings.timeFormat)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function UserMenu() {
  const { profile } = useAppState();
  const { open, close, rootRef, triggerRef, toggle } = usePopover();
  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex rounded-full shadow-card"
      >
        <Avatar name={profile.name} />
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-50 mt-2 w-64 animate-fade-in rounded-2xl border border-line bg-white p-2 shadow-raised"
        >
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate font-semibold text-ink">{profile.name}</p>
            <p className="truncate text-sm text-muted">{profile.email}</p>
          </div>
          <div className="pt-1.5">
            <Link role="menuitem" href="/profile" onClick={() => close()} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-soft hover:bg-canvas">
              <User className="size-4.5 text-muted" aria-hidden /> Profile
            </Link>
            <Link role="menuitem" href="/settings" onClick={() => close()} className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-soft hover:bg-canvas">
              <Settings className="size-4.5 text-muted" aria-hidden /> Settings
            </Link>
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                close();
                void actions.signOut();
              }}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-danger-700 hover:bg-danger-50"
            >
              <LogOut className="size-4.5" aria-hidden /> Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TopBar() {
  const { profile } = useAppState();
  return (
    <div className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur lg:border-none lg:bg-transparent lg:backdrop-blur-none">
      <div className="mx-auto flex h-topbar max-w-content items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:justify-end lg:px-8">
        <div className="lg:hidden">
          <BrandLogo href="/dashboard" size="sm" showTagline={false} />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/bins"
            className="hidden min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3.5 text-sm font-semibold text-green-700 shadow-card hover:bg-green-50 md:flex"
          >
            <MapPin className="size-4.5" aria-hidden />
            {profile.city}
          </Link>
          <div className="hidden sm:block">
            <LanguageSelect />
          </div>
          <NotificationsMenu />
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
