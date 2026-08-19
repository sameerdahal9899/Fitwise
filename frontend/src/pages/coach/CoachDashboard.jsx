import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import { Card, CardHeader, GlassCard } from "../../components/ui/Card";
import { ArrowRightIcon, UsersIcon } from "../../components/ui/Icons";
import { PageLoading } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { listConnections } from "../../services/connections";

export default function CoachDashboard() {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, error: "", pending: [], active: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pending, active] = await Promise.all([
          listConnections({ as: "coach", status: "pending" }),
          listConnections({ as: "coach", status: "accepted" }),
        ]);
        if (!cancelled) setState({ loading: false, error: "", pending, active });
      } catch (err) {
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) return <PageLoading />;

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.first_name || "Coach"}`} subtitle="Here's your coaching activity." />

      {state.error && (
        <Alert tone="danger" className="mb-6">
          {state.error}
        </Alert>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatCard label="Pending requests" value={state.pending.length} />
        <StatCard label="Active clients" value={state.active.length} />
      </div>

      <Card>
        <CardHeader
          title="Pending requests"
          action={
            <Link to="/coach/clients" className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline">
              Manage all <ArrowRightIcon size={14} />
            </Link>
          }
        />
        {state.pending.length === 0 ? (
          <p className="text-sm text-ink-soft">No pending requests right now.</p>
        ) : (
          <div className="space-y-2">
            {state.pending.slice(0, 4).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-edge">
                <span className="text-sm font-medium text-ink">{c.user_name}</span>
                <Link to="/coach/clients" className="text-xs text-primary hover:underline">
                  Review
                </Link>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!user?.is_coach && (
        <GlassCard className="mt-6">
          <div className="flex items-start gap-3">
            <UsersIcon size={20} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-ink-soft">
              Your coach status isn't active. If you believe this is a mistake, check your application status in
              Settings.
            </p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
