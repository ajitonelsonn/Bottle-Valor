import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-extrabold leading-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-[0.95rem] text-muted sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function SectionCard({
  title,
  icon,
  action,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section className={cn("card", className)} aria-labelledby={title && id ? `${id}-title` : undefined}>
      {title ? (
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <h2 id={id ? `${id}-title` : undefined} className="flex items-center gap-2.5 text-lg font-bold">
            {icon}
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
