import { forwardRef, useId } from "react";

const fieldBase =
  "w-full rounded-xl border border-edge bg-surface-2 px-3.5 h-11 text-sm text-ink placeholder:text-ink-faint " +
  "transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50";

function FieldWrapper({ label, error, hint, htmlFor, required, children }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, required, className = "", id, ...props }, ref) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <FieldWrapper label={label} error={error} hint={hint} htmlFor={fieldId} required={required}>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={[fieldBase, error ? "border-danger focus:border-danger focus:ring-danger/20" : "", className].join(" ")}
        {...props}
      />
    </FieldWrapper>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, hint, required, className = "", id, rows = 4, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <FieldWrapper label={label} error={error} hint={hint} htmlFor={fieldId} required={required}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={!!error}
        className={[fieldBase, "h-auto py-2.5 resize-y", error ? "border-danger" : "", className].join(" ")}
        {...props}
      />
    </FieldWrapper>
  );
});

export const Select = forwardRef(function Select(
  { label, error, hint, required, className = "", id, children, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id || generatedId;
  return (
    <FieldWrapper label={label} error={error} hint={hint} htmlFor={fieldId} required={required}>
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={!!error}
          className={[fieldBase, "appearance-none pr-9", error ? "border-danger" : "", className].join(" ")}
          {...props}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </FieldWrapper>
  );
});

export function Toggle({ checked, onChange, label, description, disabled = false }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="min-w-0">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-ink cursor-pointer">
            {label}
          </label>
        )}
        {description && <p className="text-xs text-ink-faint mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          checked ? "bg-primary" : "bg-edge-strong",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[22px]" : "translate-x-1",
          ].join(" ")}
          style={{ height: "18px", width: "18px" }}
        />
      </button>
    </div>
  );
}
