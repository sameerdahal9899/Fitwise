import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, CardHeader, GlassCard } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { UsersIcon } from "../../components/ui/Icons";
import { Avatar, PageLoading } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import { getErrorMessage } from "../../services/api";
import { acceptConnection, listConnections, rejectConnection } from "../../services/connections";

export default function ClientConnections() {
  const [pending, setPending] = useState(null);
  const [active, setActive] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      const [p, a] = await Promise.all([
        listConnections({ as: "coach", status: "pending" }),
        listConnections({ as: "coach", status: "accepted" }),
      ]);
      setPending(p);
      setActive(a);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAccept(id) {
    setBusyId(id);
    try {
      await acceptConnection(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id) {
    setBusyId(id);
    try {
      await rejectConnection(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  if (pending === null) return <PageLoading />;

  return (
    <div>
      <PageHeader title="My Clients" subtitle="Review requests and manage active connections." />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <Card className="mb-5">
        <CardHeader title="Pending requests" />
        {pending.length === 0 ? (
          <p className="text-sm text-ink-soft">No pending requests.</p>
        ) : (
          <div className="space-y-2">
            {pending.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-2 border border-edge">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={c.user_name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.user_name}</p>
                    {c.message && <p className="text-xs text-ink-faint truncate">{c.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => handleReject(c.id)} loading={busyId === c.id}>
                    Decline
                  </Button>
                  <Button size="sm" onClick={() => handleAccept(c.id)} loading={busyId === c.id}>
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Active clients" />
        {active === null ? null : active.length === 0 ? (
          <GlassCard className="border-0 bg-transparent shadow-none">
            <EmptyState icon={<UsersIcon size={22} />} title="No active clients yet" description="Accepted connections will appear here." />
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {active.map((c) => (
              <Link
                key={c.id}
                to={`/coach/clients/${c.id}`}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-2 border border-edge hover:border-edge-strong transition-colors"
              >
                <Avatar name={c.user_name} size="sm" />
                <span className="text-sm font-medium text-ink flex-1">{c.user_name}</span>
                <span className="text-xs text-primary">View client</span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
