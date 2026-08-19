import { useEffect, useState } from "react";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Input, Textarea } from "../../components/ui/FormControls";
import { PageLoading } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import { getErrorMessage } from "../../services/api";
import { getMyCoachProfile, updateMyCoachProfile } from "../../services/coaches";

export default function CoachProfileEdit() {
  const [profile, setProfile] = useState(undefined);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyCoachProfile()
      .then((p) => {
        setProfile(p);
        setForm(p);
      })
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      const updated = await updateMyCoachProfile(form);
      setProfile(updated);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (profile === undefined) return <PageLoading />;
  if (profile === null) {
    return <Alert tone="warning">You don't have an approved coach profile yet.</Alert>;
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="Coach Listing" subtitle="This is what users see in the directory." />
      <Card>
        <CardHeader title="Public profile" />
        {success && (
          <Alert tone="success" className="mb-4">
            Saved.
          </Alert>
        )}
        {error && (
          <Alert tone="danger" className="mb-4">
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Display name" required value={form.display_name} onChange={update("display_name")} />
          <Textarea label="Bio" required rows={4} value={form.bio} onChange={update("bio")} />
          <Input label="Specialization" required value={form.specialization} onChange={update("specialization")} />
          <Input
            label="Years of experience"
            type="number"
            min={0}
            max={80}
            required
            value={form.experience_years}
            onChange={update("experience_years")}
          />
          <Textarea label="Certifications" rows={2} value={form.certifications} onChange={update("certifications")} />
          <Textarea label="Coaching approach" rows={3} value={form.coaching_approach} onChange={update("coaching_approach")} />
          <Button type="submit" loading={submitting}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
