export default function EmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div className={["flex flex-col items-center justify-center text-center py-14 px-6", className].join(" ")}>
      {icon && (
        <div className="h-14 w-14 rounded-2xl bg-primary-light/70 text-primary flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="text-sm text-ink-soft mt-1.5 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
