"use client";

import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/format";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
  error?: string | null;
  hint?: string;
  trailing?: ReactNode;
};

export function inputClass(hasError?: boolean, hasIcon?: boolean) {
  return cn(
    "min-h-12 w-full rounded-control border bg-white px-3.5 text-[0.95rem] text-ink placeholder:text-subtle transition-colors",
    "focus:outline-none focus-visible:outline-none focus:ring-4",
    hasError
      ? "border-danger-600 focus:ring-danger-100"
      : "border-line-strong hover:border-subtle focus:border-blue-500 focus:ring-blue-100",
    hasIcon && "pl-11",
  );
}

export function TextField({ label, icon, error, hint, trailing, className, id, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = [error ? `${inputId}-error` : null, hint ? `${inputId}-hint` : null].filter(Boolean).join(" ");
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-subtle" aria-hidden>
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(inputClass(!!error, !!icon), trailing ? "pr-12" : undefined)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...rest}
        />
        {trailing ? <span className="absolute inset-y-0 right-1 flex items-center">{trailing}</span> : null}
      </div>
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm font-medium text-danger-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField(props: Omit<TextFieldProps, "type" | "trailing">) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-canvas hover:text-navy-900"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      }
    />
  );
}

type SelectFieldProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hideLabel?: boolean;
  options: { value: string; label: string; disabled?: boolean }[];
};

export function SelectField({ label, hideLabel, options, className, id, ...rest }: SelectFieldProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={selectId} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-ink-soft"}>
        {label}
      </label>
      <select
        id={selectId}
        className="min-h-11 w-full appearance-none rounded-control border border-line-strong bg-white bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat py-2 pl-3.5 pr-10 text-sm font-medium text-ink hover:border-subtle focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2333415c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  error,
  id,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  id?: string;
}) {
  const autoId = useId();
  const boxId = id ?? autoId;
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={boxId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${boxId}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer rounded accent-green-600"
        />
        <label htmlFor={boxId} className="text-sm leading-snug text-ink-soft">
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${boxId}-error`} role="alert" className="mt-1.5 text-sm font-medium text-danger-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
