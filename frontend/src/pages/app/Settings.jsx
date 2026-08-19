import { useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, CardHeader } from "../../components/ui/Card";
import { Input } from "../../components/ui/FormControls";
import { Badge } from "../../components/ui/Primitives";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { changePassword, updateAccount } from "../../services/auth";

export default function Settings() {
  const { user, updateLocalUser, logout } = useAuth();
  const [accountForm, setAccountForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });
  const [accountStatus, setAccountStatus] = useState({ loading: false, error: "", success: false });

  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" });
  const [pwStatus, setPwStatus] = useState({ loading: false, error: "", success: false });

  async function handleAccountSubmit(e) {
    e.preventDefault();
    setAccountStatus({ loading: true, error: "", success: false });
    try {
      const updated = await updateAccount(accountForm);
      updateLocalUser(updated);
      setAccountStatus({ loading: false, error: "", success: true });
    } catch (err) {
      setAccountStatus({ loading: false, error: getErrorMessage(err), success: false });
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwStatus({ loading: true, error: "", success: false });
    try {
      await changePassword(pwForm);
      setPwForm({ old_password: "", new_password: "" });
      setPwStatus({ loading: false, error: "", success: true });
    } catch (err) {
      setPwStatus({ loading: false, error: getErrorMessage(err), success: false });
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">Settings</h1>
        <p className="text-sm text-ink-soft mt-1">Manage your account.</p>
      </div>

      <Card>
        <CardHeader title="Account" />
        {accountStatus.success && (
          <Alert tone="success" className="mb-4">
            Saved.
          </Alert>
        )}
        {accountStatus.error && (
          <Alert tone="danger" className="mb-4">
            {accountStatus.error}
          </Alert>
        )}
        <form onSubmit={handleAccountSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              value={accountForm.first_name}
              onChange={(e) => setAccountForm({ ...accountForm, first_name: e.target.value })}
            />
            <Input
              label="Last name"
              value={accountForm.last_name}
              onChange={(e) => setAccountForm({ ...accountForm, last_name: e.target.value })}
            />
          </div>
          <Input
            label="Email"
            type="email"
            value={accountForm.email}
            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
          />
          <Button type="submit" loading={accountStatus.loading}>
            Save
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader title="Password" />
        {pwStatus.success && (
          <Alert tone="success" className="mb-4">
            Password updated.
          </Alert>
        )}
        {pwStatus.error && (
          <Alert tone="danger" className="mb-4">
            {pwStatus.error}
          </Alert>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pwForm.old_password}
            onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters."
            value={pwForm.new_password}
            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
          />
          <Button type="submit" loading={pwStatus.loading}>
            Update password
          </Button>
        </form>
      </Card>

      <Card>
        <CardHeader
          title="Coach status"
          action={user?.is_coach ? <Badge tone="primary">Approved coach</Badge> : null}
        />
        {user?.is_coach ? (
          <p className="text-sm text-ink-soft">
            You're an approved coach. Manage your public listing from the Coach Dashboard.
          </p>
        ) : user?.coach_application_status ? (
          <p className="text-sm text-ink-soft">
            Your coach application is currently{" "}
            <Badge tone={user.coach_application_status === "rejected" ? "danger" : "warning"}>
              {user.coach_application_status}
            </Badge>
            . <Link to="/app/coach-apply" className="text-primary hover:underline ml-1">View application</Link>
          </p>
        ) : (
          <div>
            <p className="text-sm text-ink-soft mb-3">Want to coach others on FitWise? Apply for verification.</p>
            <Button as={Link} to="/app/coach-apply" variant="secondary" size="sm">
              Apply to become a coach
            </Button>
          </div>
        )}
      </Card>

      <Button variant="ghost" onClick={logout} className="text-danger">
        Log out
      </Button>
    </div>
  );
}
