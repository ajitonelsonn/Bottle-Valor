"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/common/button";
import { ErrorState, LoadingState } from "@/components/common/states";
import { actions, consumeExplicitSignOut, useAppState } from "@/lib/store/app-store";
import { DesktopSidebar } from "./desktop-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { TopBar } from "./top-bar";

/**
 * Authenticated app chrome. Redirects in the browser are for navigation only —
 * every API call is independently authorized on the server.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, session, accountError } = useAppState();
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = session.status === "signed-in";

  useEffect(() => {
    if (!hydrated || signedIn || accountError) return;
    if (session.status === "pending-verification") {
      router.replace("/verify");
    } else if (consumeExplicitSignOut()) {
      router.replace("/login?signed-out=1");
    } else {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, signedIn, session.status, accountError, pathname, router]);

  if (hydrated && accountError) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <ErrorState
          title="We couldn't load your account"
          description={accountError}
          action={
            <>
              <Button onClick={() => void actions.refreshAccount()}>Try again</Button>
              <Button variant="secondary" onClick={() => void actions.signOut()}>
                Sign out
              </Button>
            </>
          }
        />
      </div>
    );
  }

  if (!hydrated || !signedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <LoadingState label={hydrated ? "Redirecting…" : "Loading BotleValor…"} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:pl-sidebar">
      <DesktopSidebar />
      <TopBar />
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-content px-4 pb-[calc(var(--spacing-bottomnav)+2.5rem)] pt-5 focus:outline-none sm:px-6 lg:px-8 lg:pb-12 lg:pt-0"
      >
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
