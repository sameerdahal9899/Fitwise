import { Link } from "react-router-dom";

import Button from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/Card";
import { ChartIcon, LockIcon, MessageIcon, ShieldIcon, UsersIcon } from "../../components/ui/Icons";
import BmiGauge from "../../components/ui/BmiGauge";

const FEATURES = [
  {
    icon: ChartIcon,
    title: "Real calculations, not guesses",
    body: "BMI, BMR, TDEE, and a calorie target — computed once, centrally, with published formulas (Mifflin-St Jeor) and safety limits so you never see a reckless number.",
  },
  {
    icon: ShieldIcon,
    title: "Guidance you can trace",
    body: "Every recommendation comes from an explicit, deterministic rule tied to your profile. No AI, no black box — the same inputs always produce the same guidance.",
  },
  {
    icon: UsersIcon,
    title: "Verified coaches",
    body: "Every coach is reviewed before they're listed. Browse by specialization, check real credentials, and connect only when you're ready.",
  },
  {
    icon: LockIcon,
    title: "Your data, your call",
    body: "Nothing is shared with a coach until you explicitly grant it — field by field. Revoke access any time; the backend enforces it, not just the UI.",
  },
];

export default function Landing() {
  return (
    <div>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-slide-up">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-dark bg-primary-light/70 rounded-full px-3 py-1.5 mb-5">
            No AI. No guesswork. Just formulas and consent.
          </span>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ink leading-[1.1]">
            Fitness tracking that explains itself.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-ink-soft max-w-xl">
            FitWise turns your profile into clear numbers and clear next steps — then, if you want it, connects
            you with a verified coach who only ever sees what you choose to share.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button as={Link} to="/register" size="lg">
              Get started
            </Button>
            <Button as={Link} to="/login" variant="secondary" size="lg">
              Log in
            </Button>
          </div>
        </div>
        <GlassCard className="mx-auto animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-ink-soft">Sample dashboard</p>
            <span className="text-xs text-ink-faint">Normal range</span>
          </div>
          <BmiGauge bmi={22.9} category="normal" size={260} />
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-edge">
            <div className="text-center">
              <p className="text-lg font-semibold text-ink tabular-nums">1674</p>
              <p className="text-[11px] text-ink-faint">BMR kcal</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-ink tabular-nums">2594</p>
              <p className="text-[11px] text-ink-faint">TDEE kcal</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-ink tabular-nums">2094</p>
              <p className="text-[11px] text-ink-faint">Target kcal</p>
            </div>
          </div>
        </GlassCard>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 gap-5">
          {FEATURES.map((f) => (
            <GlassCard key={f.title}>
              <div className="h-11 w-11 rounded-xl bg-primary-light/70 text-primary flex items-center justify-center mb-4">
                <f.icon size={22} />
              </div>
              <h3 className="font-semibold text-ink mb-1.5">{f.title}</h3>
              <p className="text-sm text-ink-soft leading-relaxed">{f.body}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <GlassCard className="text-center py-12">
          <MessageIcon size={28} className="mx-auto text-primary mb-4" />
          <h2 className="text-2xl font-semibold text-ink mb-2">Your data is private by default.</h2>
          <p className="text-ink-soft max-w-lg mx-auto mb-7">
            Connect with a coach and nothing is shared automatically. You choose exactly which fields — weight,
            BMI, history, goals — a coach can see, and you can revoke any of it at any time.
          </p>
          <Button as={Link} to="/register" size="lg">
            Create your free account
          </Button>
        </GlassCard>
      </section>
    </div>
  );
}
