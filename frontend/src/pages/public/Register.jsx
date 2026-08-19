import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/FormControls";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";

const INITIAL = { first_name: "", last_name: "", email: "", password: "", password_confirm: "" };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.password_confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      navigate("/login", { state: { justRegistered: true } });
    } catch (err) {
      setError(getErrorMessage(err, "Could not create your account. Please check the form and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20">
      <Card className="animate-slide-up">
        <h1 className="text-xl font-semibold text-ink mb-1">Create your account</h1>
        <p className="text-sm text-ink-soft mb-6">Free, and takes about a minute.</p>

        {error && (
          <Alert tone="danger" className="mb-5">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={form.first_name} onChange={update("first_name")} autoComplete="given-name" />
            <Input label="Last name" value={form.last_name} onChange={update("last_name")} autoComplete="family-name" />
          </div>
          <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={update("email")} />
          <Input
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            hint="At least 8 characters, not too common or numeric-only."
            value={form.password}
            onChange={update("password")}
          />
          <Input
            label="Confirm password"
            type="password"
            required
            autoComplete="new-password"
            value={form.password_confirm}
            onChange={update("password_confirm")}
          />
          <Button type="submit" className="w-full" loading={submitting}>
            Create account
          </Button>
        </form>

        <p className="text-sm text-ink-soft text-center mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
