import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import BmiGauge from "../../components/ui/BmiGauge";
import { Card, GlassCard, CardHeader } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { ChartIcon, UsersIcon, ArrowRightIcon } from "../../components/ui/Icons";
import { PageLoading } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getCalculations, getRecommendations, BMI_CATEGORY_LABELS } from "../../services/fitness";
import { getProgressSummary } from "../../services/progress";
import { listConnections } from "../../services/connections";
import { formatSignedNumber, formatWeight } from "../../utils/formatters";
import { getErrorMessage } from "../../services/api";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", calc: null, recs: [], progress: null, connections: [] });

  useEffect(() => {
    if (!user?.has_fitness_profile) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [calc, recs, progress, connections] = await Promise.all([
          getCalculations(),
          getRecommendations(),
          getProgressSummary(),
          listConnections({ as: "user", status: "accepted" }),
        ]);
        if (!cancelled) setState({ loading: false, error: "", calc, recs, progress, connections });
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
      <div>
        <PageHeader title={`${greeting()}, ${user?.first_name || "there"}`} />
        <GlassCard>
          <EmptyState
            icon={<ChartIcon size={26} />}
            title="Your dashboard is ready when you are"
            description="Complete your fitness profile — it takes about a minute — and FitWise will calculate your BMI, BMR, TDEE, and a personalized calorie target."
            action={
              <Button as={Link} to="/app/onboarding">
                Complete your profile
              </Button>
            }
          />
        </GlassCard>
      </div>
    );
  }

  if (state.loading) return <PageLoading />;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user?.first_name || "there"}`}
        subtitle="Here's where things stand today."
      />

      {state.error && (
        <Alert tone="danger" className="mb-6">
          {state.error}
        </Alert>
      )}

      {state.calc && (
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          <GlassCard className="lg:col-span-1 flex flex-col items-center justify-center">
            <BmiGauge bmi={state.calc.bmi} category={BMI_CATEGORY_LABELS[state.calc.bmi_category]} />
          </GlassCard>
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <StatCard label="Current weight" value={formatWeight(state.progress?.current_weight_kg).split(" ")[0]} unit="kg" />
            <StatCard label="Calorie target" value={state.calc.calorie_target} unit="kcal/day" />
            <StatCard label="BMR" value={Math.round(state.calc.bmr)} unit="kcal/day" />
            <StatCard label="TDEE" value={Math.round(state.calc.tdee)} unit="kcal/day" />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Top recommendations"
            subtitle="Deterministic guidance based on your profile"
            action={
              <Link to="/app/analysis" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline">
                See all <ArrowRightIcon size={14} />
              </Link>
            }
          />
          <div className="space-y-3">
            {state.recs.slice(0, 3).map((rec) => (
              <div key={rec.title} className="p-3.5 rounded-xl bg-surface-2 border border-edge">
                <p className="text-sm font-medium text-ink">{rec.title}</p>
                <p className="text-sm text-ink-soft mt-0.5">{rec.message}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Progress" />
            {state.progress?.entries_count > 0 ? (
              <div>
                <p className="text-2xl font-semibold text-ink tabular-nums">{formatWeight(state.progress.current_weight_kg)}</p>
                {state.progress.change_kg != null && (
                  <p className="text-sm text-ink-soft mt-1">
                    {formatSignedNumber(state.progress.change_kg, " kg")} since last entry
                  </p>
                )}
                <Link to="/app/progress" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline mt-3">
                  View history <ArrowRightIcon size={14} />
                </Link>
              </div>
            ) : (
              <p className="text-sm text-ink-soft">No entries yet.</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Coach" />
            {state.connections.length > 0 ? (
              <div>
                <p className="text-sm text-ink-soft mb-3">
                  Connected with <span className="text-ink font-medium">{state.connections[0].coach_display_name}</span>
                </p>
                <Button as={Link} to="/app/my-coach" variant="secondary" size="sm">
                  Open My Coach
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-sm text-ink-soft mb-3">You're not connected with a coach yet.</p>
                <Button as={Link} to="/app/coaches" variant="secondary" size="sm">
                  <UsersIcon size={16} /> Browse coaches
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
