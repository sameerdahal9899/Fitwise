import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import BmiGauge from "../../components/ui/BmiGauge";
import { Card, GlassCard, CardHeader } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Primitives";
import EmptyState from "../../components/ui/EmptyState";
import { ChartIcon } from "../../components/ui/Icons";
import { PageLoading } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { getCalculations, getRecommendations, BMI_CATEGORY_LABELS } from "../../services/fitness";
import { getErrorMessage } from "../../services/api";
import { RECOMMENDATION_CATEGORY_META } from "../../utils/constants";

function CalcRow({ label, value, unit, formula }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-edge last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {formula && <p className="text-xs text-ink-faint mt-0.5">{formula}</p>}
      </div>
      <p className="text-base font-semibold text-ink tabular-nums">
        {value} <span className="text-xs font-normal text-ink-faint">{unit}</span>
      </p>
    </div>
  );
}

export default function FitnessAnalysis() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", calc: null, recs: [] });

  useEffect(() => {
    if (!user?.has_fitness_profile) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [calc, recs] = await Promise.all([getCalculations(), getRecommendations()]);
        if (!cancelled) setState({ loading: false, error: "", calc, recs });
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.has_fitness_profile]);

  if (!user?.has_fitness_profile) {
    return (
      <GlassCard>
        <EmptyState
          icon={<ChartIcon size={26} />}
          title="Complete your profile first"
          description="Fitness Analysis needs your profile to calculate anything."
          action={
            <Button as={Link} to="/app/onboarding">
              Complete profile
            </Button>
          }
        />
      </GlassCard>
    );
  }

  if (state.loading) return <PageLoading />;
  if (state.error) return <Alert tone="danger">{state.error}</Alert>;

  const { calc, recs } = state;

  return (
    <div>
      <PageHeader title="Fitness Analysis" subtitle="Every number below traces back to a published formula." />

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <GlassCard className="flex flex-col items-center justify-center">
          <BmiGauge bmi={calc.bmi} category={BMI_CATEGORY_LABELS[calc.bmi_category]} size={240} />
          {calc.safety_floor_applied && (
            <Alert tone="warning" className="mt-4 w-full">
              Your calorie target was raised to a safe minimum — the deficit your goal implied was too aggressive
              for your numbers.
            </Alert>
          )}
        </GlassCard>

        <Card>
          <CardHeader title="Calculation breakdown" subtitle="Backend-computed, centralized, deterministic" />
          <CalcRow label="BMI" value={calc.bmi} unit="" formula="weight (kg) ÷ height (m)²" />
          <CalcRow label="BMR" value={Math.round(calc.bmr)} unit="kcal/day" formula="Mifflin-St Jeor equation" />
          <CalcRow
            label="TDEE"
            value={Math.round(calc.tdee)}
            unit="kcal/day"
            formula={`BMR × ${calc.activity_multiplier} activity multiplier`}
          />
          <CalcRow
            label="Daily calorie target"
            value={calc.calorie_target}
            unit="kcal/day"
            formula={calc.goal_adjustment_kcal === 0 ? "= TDEE (maintenance)" : `TDEE ${calc.goal_adjustment_kcal > 0 ? "+" : "−"} ${Math.abs(calc.goal_adjustment_kcal)} kcal`}
          />
        </Card>
      </div>

      <Card>
        <CardHeader title="Recommendations" subtitle="Deterministic and rule-based — the same profile always produces the same guidance" />
        <div className="space-y-3">
          {recs.map((rec) => {
            const meta = RECOMMENDATION_CATEGORY_META[rec.category] || { label: rec.category, tone: "neutral" };
            return (
              <div key={rec.title} className="p-4 rounded-xl bg-surface-2 border border-edge">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <p className="text-sm font-medium text-ink">{rec.title}</p>
                </div>
                <p className="text-sm text-ink-soft leading-relaxed">{rec.message}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
