import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/format";

export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-3 py-12 text-muted", className)}>
      <Loader2 className="size-8 animate-spin text-green-600" aria-hidden />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-4 py-10 text-center", className)}>
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
        {icon ?? <Inbox className="size-7" aria-hidden />}
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {description ? <div className="mt-1 max-w-sm text-sm text-muted">{description}</div> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  className,
}: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center px-4 py-10 text-center", className)}>
      <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
        <AlertTriangle className="size-7" aria-hidden />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {description ? <div className="mt-1 max-w-sm text-sm text-muted">{description}</div> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
