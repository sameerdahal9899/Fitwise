import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import { Card } from "../../components/ui/Card";
import FitnessProfileForm from "../../components/FitnessProfileForm";
import { useAuth } from "../../context/AuthContext";
import { createFitnessProfile } from "../../services/fitness";
import { getErrorMessage } from "../../services/api";

export default function Onboarding() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(payload) {
    setError("");
    setSubmitting(true);
    try {
      await createFitnessProfile(payload);
      await refreshUser();
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Could not save your profile. Please check the values and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold text-ink">Let's set up your profile</h1>
        <p className="text-sm text-ink-soft mt-1">
          A few numbers is all it takes — FitWise turns these into your BMI, BMR, TDEE, and a calorie target.
        </p>
      </div>
      <Card>
        {error && (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        )}
        <FitnessProfileForm mode="create" onSubmit={handleSubmit} submitting={submitting} />
      </Card>
    </div>
  );
}
