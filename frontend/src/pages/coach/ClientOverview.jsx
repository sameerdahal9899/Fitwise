import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import { Card, CardHeader, GlassCard } from "../../components/ui/Card";
import { ChevronLeftIcon, CheckIcon, XIcon } from "../../components/ui/Icons";
import { Avatar, PageLoading } from "../../components/ui/Primitives";
import { getErrorMessage } from "../../services/api";
import { getClientData, listConnections } from "../../services/connections";
import { PERMISSION_FIELDS } from "../../utils/constants";
import { BMI_CATEGORY_LABELS } from "../../services/fitness";
import { formatWeight } from "../../utils/formatters";

const FIELD_TO_PERMISSION_KEY = {
  share_basic_profile: "basic_profile",
  share_height: "height_cm",
  share_weight: "current_weight_kg",
  share_weight_history: "weight_history",
  share_bmi: "bmi",
  share_activity_level: "activity_level",
  share_fitness_goal: "goal",
  share_calorie_target: "calorie_target",
  share_fitness_calculations: "bmr",
  share_progress_information: "progress",
};

export default function ClientOverview() {
  const { connectionId } = useParams();
  const [data, setData] = useState(null);
  const [clientName, setClientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getClientData(connectionId), listConnections({ as: "coach" })])
      .then(([clientData, connections]) => {
        if (cancelled) return;
        setData(clientData);
        const match = connections.find((c) => String(c.id) === String(connectionId));
        setClientName(match?.user_name || "Client");
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, "You no longer have access to this client's data.")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [connectionId]);

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-2xl">
      <Link to="/coach/clients" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-5">
        <ChevronLeftIcon size={16} /> Back to clients
      </Link>

      {error ? (
        <Alert tone="danger">{error}</Alert>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-6">
            <Avatar name={clientName} size="lg" />
            <h1 className="text-xl font-semibold text-ink">{clientName}</h1>
          </div>

          <GlassCard className="mb-5">
            <p className="text-sm text-ink-soft">
              You can see exactly what this client has chosen to share — nothing more. Fields they haven't granted
              are shown as unavailable, not blank or estimated.
            </p>
          </GlassCard>

          <Card>
            <CardHeader title="Shared data" />
            <div className="space-y-2">
              {PERMISSION_FIELDS.map((field) => {
                const granted = data?.granted_fields?.includes(field.key);
                return (
                  <div key={field.key} className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-edge">
                    <div className="flex items-center gap-2.5">
                      {granted ? <CheckIcon size={17} className="text-success" /> : <XIcon size={17} className="text-ink-faint" />}
                      <span className={`text-sm ${granted ? "text-ink font-medium" : "text-ink-faint"}`}>{field.label}</span>
                    </div>
                    {granted && <ValuePreview fieldKey={field.key} data={data} />}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function ValuePreview({ fieldKey, data }) {
  switch (fieldKey) {
    case "share_basic_profile":
      return (
        <span className="text-sm text-ink-soft">
          {data.basic_profile?.name}, {data.basic_profile?.age}
        </span>
      );
    case "share_height":
      return <span className="text-sm text-ink-soft">{data.height_cm} cm</span>;
    case "share_weight":
      return <span className="text-sm text-ink-soft">{formatWeight(data.current_weight_kg)}</span>;
    case "share_weight_history":
      return <span className="text-sm text-ink-soft">{data.weight_history?.length || 0} entries</span>;
    case "share_bmi":
      return (
        <span className="text-sm text-ink-soft">
          {data.bmi} ({BMI_CATEGORY_LABELS[data.bmi_category]})
        </span>
      );
    case "share_activity_level":
      return <span className="text-sm text-ink-soft capitalize">{data.activity_level?.replace("_", " ")}</span>;
    case "share_fitness_goal":
      return <span className="text-sm text-ink-soft capitalize">{data.goal}</span>;
    case "share_calorie_target":
      return <span className="text-sm text-ink-soft">{data.calorie_target} kcal</span>;
    case "share_fitness_calculations":
      return (
        <span className="text-sm text-ink-soft">
          BMR {Math.round(data.bmr)} · TDEE {Math.round(data.tdee)}
        </span>
      );
    case "share_progress_information":
      return (
        <span className="text-sm text-ink-soft">
          {data.progress?.trend_kg_per_week != null ? `${data.progress.trend_kg_per_week.toFixed(2)} kg/wk` : "Not enough data"}
        </span>
      );
    default:
      return null;
  }
}
