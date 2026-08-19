export function Card({ className = "", children, as: Component = "div", ...props }) {
  return (
    <Component className={["glass-solid rounded-xl2 p-5 sm:p-6", className].join(" ")} {...props}>
      {children}
    </Component>
  );
}

export function GlassCard({ className = "", children, hoverable = false, as: Component = "div", ...props }) {
  return (
    <Component
      className={[
        "glass rounded-xl2 p-5 sm:p-6 transition-shadow duration-200",
        hoverable ? "hover:shadow-glass-hover cursor-pointer" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={["flex items-start justify-between gap-4 mb-4", className].join(" ")}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-ink truncate">{title}</h3>
        {subtitle && <p className="text-sm text-ink-soft mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
