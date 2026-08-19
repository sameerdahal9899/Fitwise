import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/FormControls";
import { Badge, PageLoading } from "../../components/ui/Primitives";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { getMyApplication, submitApplication } from "../../services/coaches";

const EMPTY = {
  full_name: "",
  display_name: "",
  bio: "",
  specialization: "",
  experience_years: "",
  certifications: "",
  coaching_approach: "",
};

export default function CoachApply() {
  const { refreshUser } = useAuth();
  const [application, setApplication] = useState(undefined); // undefined = loading, null = none yet
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getMyApplication()
      .then((app) => {
        setApplication(app);
        if (app) {
          setForm({
            full_name: app.full_name,
            display_name: app.display_name,
            bio: app.bio,
            specialization: app.specialization,
            experience_years: app.experience_years,
            certifications: app.certifications || "",
            coaching_approach: app.coaching_approach || "",
          });
        }
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await submitApplication({ ...form, experience_years: Number(form.experience_years) });
      setApplication(result);
      setSubmitted(true);
      await refreshUser();
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit your application."));
    } finally {
      setSubmitting(false);
    }
  }

  if (application === undefined) return <PageLoading />;

  const locked = application && (application.status === "pending" || application.status === "approved");

  return (
    <div className="max-w-lg">
      <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight mb-1">Become a coach</h1>
      <p className="text-sm text-ink-soft mb-6">
        Every application is reviewed by an admin before you're listed publicly.
      </p>

      {application && (
        <Alert tone={application.status === "approved" ? "success" : application.status === "rejected" ? "danger" : "info"} className="mb-5">
          Status: <Badge tone={application.status === "approved" ? "success" : application.status === "rejected" ? "danger" : "warning"}>{application.status}</Badge>
          {application.status === "rejected" && application.rejection_reason && (
            <p className="mt-2">{application.rejection_reason}</p>
          )}
          {application.status === "rejected" && <p className="mt-2">You can edit and resubmit below.</p>}
          {application.status === "approved" && (
            <p className="mt-2">
              You're approved! Manage your listing from the{" "}
              <Link to="/coach/profile" className="underline">
                Coach Dashboard
              </Link>
              .
            </p>
          )}
        </Alert>
      )}

      {submitted && !error && (
        <Alert tone="success" className="mb-5">
          Application submitted — we'll let you know once it's reviewed.
        </Alert>
      )}

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader title="Application" />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" required disabled={locked} value={form.full_name} onChange={update("full_name")} />
          <Input
            label="Public display name"
            required
            disabled={locked}
            hint="Shown to users browsing the directory."
            value={form.display_name}
            onChange={update("display_name")}
          />
          <Textarea label="Bio" required disabled={locked} rows={4} value={form.bio} onChange={update("bio")} />
          <Input
            label="Specialization"
            required
            disabled={locked}
            hint="e.g. Strength training, Weight management, Nutrition"
            value={form.specialization}
            onChange={update("specialization")}
          />
          <Input
            label="Years of experience"
            type="number"
            min={0}
            max={80}
            required
            disabled={locked}
            value={form.experience_years}
            onChange={update("experience_years")}
          />
          <Textarea
            label="Certifications"
            disabled={locked}
            rows={2}
            hint="Optional but strengthens your application."
            value={form.certifications}
            onChange={update("certifications")}
          />
          <Textarea
            label="Coaching approach"
            disabled={locked}
            rows={3}
            value={form.coaching_approach}
            onChange={update("coaching_approach")}
          />
          {!locked && (
            <Button type="submit" className="w-full" loading={submitting}>
              {application?.status === "rejected" ? "Resubmit application" : "Submit application"}
            </Button>
          )}
        </form>
      </Card>
    </div>
  );
}
