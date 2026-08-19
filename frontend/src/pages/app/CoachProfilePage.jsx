import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Card, GlassCard } from "../../components/ui/Card";
import { Textarea } from "../../components/ui/FormControls";
import { ChevronLeftIcon, StarIcon } from "../../components/ui/Icons";
import Modal from "../../components/ui/Modal";
import { Avatar, Badge, PageLoading } from "../../components/ui/Primitives";
import { getErrorMessage } from "../../services/api";
import { getCoachProfile } from "../../services/coaches";
import { listConnections, requestConnection } from "../../services/connections";

export default function CoachProfilePage() {
  const { id } = useParams();
  const [coach, setCoach] = useState(null);
  const [existingConnection, setExistingConnection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getCoachProfile(id), listConnections({ as: "user" })])
      .then(([coachData, connections]) => {
        if (cancelled) return;
        setCoach(coachData);
        setExistingConnection(connections.find((c) => String(c.coach) === String(id) && c.status !== "disconnected" && c.status !== "rejected") || null);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleRequest(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await requestConnection(Number(id), message);
      setRequestSent(true);
      setModalOpen(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not send the request."));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading />;
  if (error && !coach) return <Alert tone="danger">{error}</Alert>;
  if (!coach) return null;

  return (
    <div className="max-w-2xl">
      <Link to="/app/coaches" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-5">
        <ChevronLeftIcon size={16} /> Back to directory
      </Link>

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <GlassCard>
        <div className="flex items-start gap-4 mb-5">
          <Avatar name={coach.display_name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-semibold text-ink">{coach.display_name}</h1>
              <StarIcon size={16} className="text-primary" />
            </div>
            <p className="text-sm text-ink-faint">{coach.experience_years} years of experience</p>
            <Badge tone="primary" className="mt-2">
              {coach.specialization}
            </Badge>
          </div>
        </div>

        <section className="mb-5">
          <h2 className="text-sm font-semibold text-ink mb-1.5">About</h2>
          <p className="text-sm text-ink-soft leading-relaxed">{coach.bio}</p>
        </section>

        {coach.certifications && (
          <section className="mb-5">
            <h2 className="text-sm font-semibold text-ink mb-1.5">Certifications</h2>
            <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{coach.certifications}</p>
          </section>
        )}

        {coach.coaching_approach && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-ink mb-1.5">Coaching approach</h2>
            <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-line">{coach.coaching_approach}</p>
          </section>
        )}

        {requestSent || existingConnection ? (
          <Alert tone="success">
            {existingConnection?.status === "accepted"
              ? "You're already connected with this coach."
              : "Your connection request is pending — you'll be notified once they respond."}
          </Alert>
        ) : (
          <Button onClick={() => setModalOpen(true)}>Request connection</Button>
        )}
      </GlassCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Connect with ${coach.display_name}`}>
        <form onSubmit={handleRequest} className="space-y-4">
          <Textarea
            label="A short note (optional)"
            hint="Let them know what you're hoping for help with."
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={submitting}>
            Send request
          </Button>
        </form>
      </Modal>
    </div>
  );
}
