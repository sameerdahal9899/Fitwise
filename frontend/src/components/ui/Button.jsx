import { forwardRef } from "react";

const VARIANTS = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:scale-[0.98] shadow-sm shadow-primary/20 disabled:hover:bg-primary",
  secondary:
    "glass-solid text-ink hover:border-edge-strong border border-edge active:scale-[0.98]",
  ghost: "text-ink hover:bg-surface-2 active:scale-[0.98]",
  danger: "bg-danger text-white hover:brightness-110 active:scale-[0.98]",
  link: "text-primary hover:underline underline-offset-4 p-0 h-auto",
};

const SIZES = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl2 gap-2",
};

const Button = forwardRef(function Button(
  { as: Component = "button", variant = "primary", size = "md", className = "", loading = false, disabled, children, ...props },
  ref
) {
  const isLink = variant === "link";
  return (
    <Component
      ref={ref}
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        isLink ? "" : SIZES[size],
        VARIANTS[variant],
        className,
      ].join(" ")}
      {...props}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </Component>
  );
});

export default Button;
