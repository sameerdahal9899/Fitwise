import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, GlassCard } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import FitnessProfileForm from "../../components/FitnessProfileForm";
import { UserIcon } from "../../components/ui/Icons";
import { PageLoading } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { getFitnessProfile, updateFitnessProfile } from "../../services/fitness";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.has_fitness_profile) {
      setLoading(false);
      return;
    }
    getFitnessProfile()
      .then(setProfile)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [user?.has_fitness_profile]);

  async function handleSubmit(payload) {
    setError("");
    setSuccess(false);
    setSubmitting(true);
    try {
      const updated = await updateFitnessProfile(payload);
      setProfile(updated);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (!user?.has_fitness_profile) {
    return (
      <GlassCard>
        <EmptyState
          icon={<UserIcon size={26} />}
          title="No fitness profile yet"
          description="Set one up to unlock your dashboard, calculations, and recommendations."
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

  return (
    <div className="max-w-lg">
      <PageHeader title="Fitness Profile" subtitle="Update this any time — your calculations refresh automatically." />
      <Card>
        {success && (
          <Alert tone="success" className="mb-5">
            Profile updated.
          </Alert>
        )}
        {error && (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        )}
        <FitnessProfileForm mode="edit" initialValues={profile} onSubmit={handleSubmit} submitting={submitting} />
      </Card>
    </div>
  );
}
