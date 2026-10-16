import { useId, type ReactNode } from "react";
import { cn } from "@/lib/format";

export function SettingsSection({
  icon,
  title,
  description,
  children,
  tone = "default",
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "rounded-card border p-5",
        tone === "danger" ? "border-danger-100 bg-danger-50" : "card",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5", tone === "danger" ? "text-danger-600" : "text-navy-800")} aria-hidden>
          {icon}
        </span>
        <div>
          <h2 id={id} className={cn("text-lg font-bold", tone === "danger" && "text-danger-700")}>
            {title}
          </h2>
          {description ? <p className="text-sm text-muted">{description}</p> : null}
        </div>
      </div>
      <div className={cn("mt-3 divide-y", tone === "danger" ? "divide-danger-100" : "divide-line")}>{children}</div>
    </section>
  );
}

export function SettingRow({
  icon,
  label,
  description,
  control,
  labelId,
  descriptionId,
}: {
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  control: ReactNode;
  labelId?: string;
  descriptionId?: string;
}) {
  return (
    <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="mt-0.5 shrink-0 text-ink-soft" aria-hidden>
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p id={labelId} className="font-medium text-ink">
            {label}
          </p>
          {description ? (
            <p id={descriptionId} className="text-sm text-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="shrink-0 sm:max-w-[16rem] sm:flex-1 sm:text-right [&>*]:sm:ml-auto">{control}</div>
    </div>
  );
}
