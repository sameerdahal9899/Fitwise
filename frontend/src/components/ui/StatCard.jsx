export default function StatCard({ label, value, unit, icon, trend, className = "" }) {
  return (
    <div className={["glass-solid rounded-xl2 p-5 flex flex-col gap-3", className].join(" ")}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-soft">{label}</span>
        {icon && <span className="text-primary opacity-80">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-ink tabular-nums">{value}</span>
        {unit && <span className="text-sm text-ink-faint">{unit}</span>}
      </div>
      {trend && <div className="text-xs">{trend}</div>}
    </div>
  );
}
