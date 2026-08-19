const BMI_MIN = 15;
const BMI_MAX = 40;

const ZONES = [
  { from: 15, to: 18.5, color: "#F59E0B", label: "Under" },
  { from: 18.5, to: 25, color: "#16A34A", label: "Normal" },
  { from: 25, to: 30, color: "#F59E0B", label: "Over" },
  { from: 30, to: 40, color: "#DC2626", label: "Obese" },
];

function bmiToAngle(bmi) {
  const clamped = Math.max(BMI_MIN, Math.min(BMI_MAX, bmi));
  return 180 - ((clamped - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 180;
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = startAngle - endAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

/**
 * A semi-circular gauge showing BMI (15-40) against WHO category zones.
 * This is FitWise's signature dashboard visual — a single, deterministic
 * read of "where do I sit right now," never animated in a way that implies
 * anything other than a static snapshot of today's numbers.
 */
export default function BmiGauge({ bmi, category, size = 220 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 18;
  const needleAngle = bmi != null ? bmiToAngle(bmi) : 180;
  const needleEnd = polarToCartesian(cx, cy, r - 2, needleAngle);
  const needleBase1 = polarToCartesian(cx, cy, 6, needleAngle + 90);
  const needleBase2 = polarToCartesian(cx, cy, 6, needleAngle - 90);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`} role="img" aria-label={`BMI gauge showing ${bmi ?? "no"} value, category ${category ?? "unknown"}`}>
        {ZONES.map((zone) => (
          <path
            key={zone.label}
            d={describeArc(cx, cy, r, bmiToAngle(zone.from), bmiToAngle(zone.to))}
            stroke={zone.color}
            strokeWidth={14}
            strokeLinecap="butt"
            fill="none"
            opacity={0.85}
          />
        ))}
        {bmi != null && (
          <g className="animate-fade-in">
            <polygon
              points={`${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y} ${needleEnd.x},${needleEnd.y}`}
              fill="currentColor"
              className="text-ink"
            />
            <circle cx={cx} cy={cy} r={7} fill="currentColor" className="text-ink" />
          </g>
        )}
      </svg>
      <div className="text-center -mt-2">
        <div className="text-3xl font-semibold text-ink tabular-nums">{bmi != null ? bmi.toFixed(1) : "—"}</div>
        <div className="text-xs text-ink-soft mt-0.5">BMI{category ? ` · ${category}` : ""}</div>
      </div>
    </div>
  );
}
