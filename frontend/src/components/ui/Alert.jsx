const TONES = {
  info: { wrap: "bg-primary-light/60 border-primary/20 text-primary-dark", icon: "M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  success: { wrap: "bg-success/10 border-success/25 text-success", icon: "M9 12.75l2.25 2.25L15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  warning: { wrap: "bg-warning/10 border-warning/25 text-warning", icon: "M12 9v3.75m0 3.75h.008v.008H12V16.5zM3.75 12a8.25 8.25 0 1116.5 0 8.25 8.25 0 01-16.5 0z" },
  danger: { wrap: "bg-danger/10 border-danger/25 text-danger", icon: "M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" },
};

export default function Alert({ tone = "info", title, children, className = "" }) {
  const t = TONES[tone] || TONES.info;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={["flex gap-3 rounded-xl border p-4 text-sm", t.wrap, className].join(" ")}>
      <svg className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
      </svg>
      <div>
        {title && <p className="font-medium mb-0.5">{title}</p>}
        <div className="text-current/90">{children}</div>
      </div>
    </div>
  );
}
