import { initials } from "../../utils/formatters";

const BADGE_TONES = {
  primary: "bg-primary-light text-primary-dark",
  neutral: "bg-surface-2 text-ink-soft border border-edge",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function Badge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        BADGE_TONES[tone] || BADGE_TONES.neutral,
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function Avatar({ name, size = "md", className = "" }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };
  return (
    <div
      className={[
        "flex items-center justify-center rounded-full bg-primary-light text-primary-dark font-semibold shrink-0 select-none",
        sizes[size],
        className,
      ].join(" ")}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  );
}

export function ProgressBar({ value = 0, max = 100, tone = "primary", className = "", label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={className}>
      <div
        className="h-2 w-full rounded-full bg-surface-2 border border-edge overflow-hidden"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={["h-full rounded-full transition-all duration-500", tone === "primary" ? "bg-primary" : "bg-success"].join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = "md", className = "" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-9 w-9" };
  return (
    <svg
      className={["animate-spin text-primary", sizes[size], className].join(" ")}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={["animate-pulse rounded-lg bg-surface-2", className].join(" ")} aria-hidden="true" />;
}

export function PageLoading() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
      <LoadingSpinner size="lg" />
      <span className="sr-only-live">Loading content</span>
    </div>
  );
}
