import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, CardHeader, GlassCard } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { Input, Textarea } from "../../components/ui/FormControls";
import { ChartIcon, PlusIcon, TrashIcon } from "../../components/ui/Icons";
import Modal from "../../components/ui/Modal";
import { PageLoading } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { addWeightEntry, deleteWeightEntry, getProgressSummary, listWeightEntries } from "../../services/progress";
import { formatDate, formatSignedNumber, formatWeight } from "../../utils/formatters";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function Progress() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ weight_kg: "", recorded_at: todayIso(), note: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [entriesRes, summaryRes] = await Promise.all([listWeightEntries(), getProgressSummary()]);
      setEntries(entriesRes.results);
      setSummary(summaryRes);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.has_fitness_profile) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.has_fitness_profile]);

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await addWeightEntry({ weight_kg: Number(form.weight_kg), recorded_at: form.recorded_at, note: form.note });
      setModalOpen(false);
      setForm({ weight_kg: "", recorded_at: todayIso(), note: "" });
      await load();
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save that entry."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this weight entry? This can't be undone.")) return;
    try {
      await deleteWeightEntry(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (!user?.has_fitness_profile) {
    return (
      <GlassCard>
        <EmptyState
          icon={<ChartIcon size={26} />}
          title="Complete your profile first"
          description="Progress tracking starts once you've set up your fitness profile."
          action={
            <Button as={Link} to="/app/onboarding">
              Complete profile
            </Button>
          }
        />
      </GlassCard>
    );
  }

  if (loading) return <PageLoading />;

  const chartData = [...entries]
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at))
    .map((e) => ({ date: formatDate(e.recorded_at, { year: undefined }), weight: e.weight_kg }));

  return (
    <div>
      <PageHeader
        title="Progress"
        subtitle="Track your weight over time."
        action={
          <Button onClick={() => setModalOpen(true)} size="sm">
            <PlusIcon size={16} /> Log weight
          </Button>
        }
      />

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      {entries.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<ChartIcon size={26} />}
            title="No entries yet"
            description="Log your first weigh-in to start seeing your trend."
            action={
              <Button onClick={() => setModalOpen(true)}>
                <PlusIcon size={16} /> Log weight
              </Button>
            }
          />
        </GlassCard>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <StatCard label="Current" value={formatWeight(summary?.current_weight_kg).split(" ")[0]} unit="kg" />
            <StatCard
              label="Change"
              value={summary?.change_kg != null ? formatSignedNumber(summary.change_kg) : "—"}
              unit={summary?.change_kg != null ? "kg" : ""}
            />
            <StatCard
              label="Weekly trend"
              value={summary?.trend_kg_per_week != null ? formatSignedNumber(summary.trend_kg_per_week) : "—"}
              unit={summary?.trend_kg_per_week != null ? "kg/wk" : "need 2+"}
            />
          </div>

          {chartData.length >= 2 && (
            <Card className="mb-5">
              <CardHeader title="Weight over time" />
              <div className="h-64 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="date" stroke="var(--color-text-faint)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="var(--color-text-faint)"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={["dataMin - 2", "dataMax + 2"]}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface-2)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 12,
                        fontSize: 13,
                      }}
                      formatter={(v) => [`${v} kg`, "Weight"]}
                    />
                    <Line type="monotone" dataKey="weight" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="History" />
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-2 border border-edge">
                  <div>
                    <p className="text-sm font-medium text-ink">{formatWeight(entry.weight_kg)}</p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {formatDate(entry.recorded_at)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    aria-label="Delete entry"
                    className="p-2 rounded-lg text-ink-faint hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <TrashIcon size={17} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Log a weight entry">
        {formError && (
          <Alert tone="danger" className="mb-4">
            {formError}
          </Alert>
        )}
        <form onSubmit={handleAdd} className="space-y-4">
          <Input
            label="Weight (kg)"
            type="number"
            step="0.1"
            min={30}
            max={300}
            required
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
          />
          <Input
            label="Date"
            type="date"
            required
            max={todayIso()}
            value={form.recorded_at}
            onChange={(e) => setForm({ ...form, recorded_at: e.target.value })}
          />
          <Textarea
            label="Note"
            hint="Optional"
            rows={2}
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <Button type="submit" className="w-full" loading={submitting}>
            Save entry
          </Button>
        </form>
      </Modal>
    </div>
  );
}
