export default function PageHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={["flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6", className].join(" ")}>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-soft mt-1">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
