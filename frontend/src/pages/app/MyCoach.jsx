import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, CardHeader, GlassCard } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { Toggle } from "../../components/ui/FormControls";
import { LockIcon, ShieldIcon, UsersIcon } from "../../components/ui/Icons";
import { Avatar, Badge, PageLoading, Skeleton } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import { getErrorMessage } from "../../services/api";
import {
  disconnectConnection,
  getPermissions,
  listConnections,
  updatePermissions,
} from "../../services/connections";
import { PERMISSION_FIELDS } from "../../utils/constants";

function PermissionsPanel({ connection }) {
  const [permissions, setPermissions] = useState(null);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPermissions(connection.id)
      .then(setPermissions)
      .catch((err) => setError(getErrorMessage(err)));
  }, [connection.id]);

  async function toggleField(key, value) {
    setSaving(key);
    setError("");
    // Optimistic update — reverted on failure so the UI never claims a grant that didn't save.
    setPermissions((p) => ({ ...p, [key]: value }));
    try {
      await updatePermissions(connection.id, { [key]: value });
    } catch (err) {
      setPermissions((p) => ({ ...p, [key]: !value }));
      setError(getErrorMessage(err, "Could not update that permission."));
    } finally {
      setSaving(null);
    }
  }

  if (!permissions) return <Skeleton className="h-40" />;

  const grantedCount = PERMISSION_FIELDS.filter((f) => permissions[f.key]).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary-light/50 text-primary-dark text-sm">
        <ShieldIcon size={16} className="shrink-0" />
        <span>
          {grantedCount === 0
            ? "Nothing is shared yet — everything below is private."
            : `Sharing ${grantedCount} of ${PERMISSION_FIELDS.length} categories with this coach.`}
        </span>
      </div>
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <div className="divide-y divide-edge">
        {PERMISSION_FIELDS.map((field) => (
          <Toggle
            key={field.key}
            label={field.label}
            description={field.hint}
            checked={!!permissions[field.key]}
            disabled={saving === field.key}
            onChange={(value) => toggleField(field.key, value)}
          />
        ))}
      </div>
    </div>
  );
}

function ConnectionCard({ connection, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDisconnect() {
    const verb = connection.status === "pending" ? "cancel this request" : "disconnect from this coach";
    if (!window.confirm(`Are you sure you want to ${verb}? This can't be undone.`)) return;
    setBusy(true);
    setError("");
    try {
      await disconnectConnection(connection.id);
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <Avatar name={connection.coach_display_name} />
          <div>
            <p className="font-semibold text-ink">{connection.coach_display_name}</p>
            <Badge tone={connection.status === "accepted" ? "success" : "warning"}>
              {connection.status === "accepted" ? "Connected" : "Pending"}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleDisconnect} loading={busy}>
          {connection.status === "pending" ? "Cancel" : "Disconnect"}
        </Button>
      </div>

      {error && (
        <Alert tone="danger" className="mt-3">
          {error}
        </Alert>
      )}

      {connection.status === "accepted" ? (
        <div className="mt-4 pt-4 border-t border-edge">
          <PermissionsPanel connection={connection} />
        </div>
      ) : (
        <p className="text-sm text-ink-soft mt-2">Waiting for {connection.coach_display_name} to respond.</p>
      )}
    </GlassCard>
  );
}

export default function MyCoach() {
  const [connections, setConnections] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const results = await listConnections({ as: "user" });
      setConnections(results.filter((c) => c.status === "pending" || c.status === "accepted"));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (connections === null) return <PageLoading />;

  return (
    <div>
      <PageHeader title="My Coach" subtitle="Your data is private by default — nothing is shared until you grant it." />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      {connections.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<UsersIcon size={26} />}
            title="No coach connections yet"
            description="Browse the directory to find a verified coach and send a request."
            action={
              <Button as={Link} to="/app/coaches">
                Browse coaches
              </Button>
            }
          />
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {connections.map((c) => (
            <ConnectionCard key={c.id} connection={c} onChanged={load} />
          ))}
        </div>
      )}

      <Card className="mt-6 flex items-start gap-3">
        <LockIcon size={18} className="text-ink-faint shrink-0 mt-0.5" />
        <p className="text-xs text-ink-faint leading-relaxed">
          Every toggle above is enforced on the backend, not just hidden in this screen — a coach's app literally
          cannot request a field you haven't granted. Revoking access takes effect immediately.
        </p>
      </Card>
    </div>
  );
}
