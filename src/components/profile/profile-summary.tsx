"use client";

import Image from "next/image";
import { BadgeCheck, Pencil } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { Button } from "@/components/common/button";
import type { UserProfile } from "@/lib/types";

/** Profile header with avatar placeholder, identity and member details. */
export function ProfileSummary({ profile, onEdit }: { profile: UserProfile; onEdit: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-panel border border-line bg-blue-50" aria-labelledby="profile-name">
      <Image src="/images/bg-image.png" alt="" fill loading="eager" sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover object-[80%_70%]" />
      <div className="absolute inset-0 bg-linear-to-r from-white via-white/85 to-white/20" />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
        <Avatar name={profile.name} size={104} className="ring-4 shadow-card" />
        <div className="min-w-0 flex-1">
          <h2 id="profile-name" className="truncate text-2xl font-extrabold sm:text-3xl">
            {profile.name}
          </h2>
          <p className="truncate text-ink-soft">{profile.email}</p>
          {profile.emailVerified ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-green-700">
              <BadgeCheck className="size-4" aria-hidden /> Verified email
            </p>
          ) : null}
          {profile.bio ? <p className="mt-2 text-sm text-ink-soft">{profile.bio}</p> : null}
        </div>
        <Button variant="secondary" onClick={onEdit} className="self-start bg-white/90 sm:self-center">
          <Pencil className="size-4" aria-hidden /> Edit profile
        </Button>
      </div>
    </section>
  );
}
