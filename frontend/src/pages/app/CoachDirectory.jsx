import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Alert from "../../components/ui/Alert";
import { GlassCard } from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { Input } from "../../components/ui/FormControls";
import { StarIcon, UsersIcon } from "../../components/ui/Icons";
import { Avatar, Badge, PageLoading, Skeleton } from "../../components/ui/Primitives";
import PageHeader from "../../components/ui/PageHeader";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { getErrorMessage } from "../../services/api";
import { searchDirectory } from "../../services/coaches";

export default function CoachDirectory() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchDirectory({ search: debouncedSearch })
      .then((results) => !cancelled && setCoaches(results))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  return (
    <div>
      <PageHeader title="Find a coach" subtitle="Every coach here has been reviewed and approved." />

      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search by name or specialization"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search coaches"
        />
      </div>

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : coaches.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon={<UsersIcon size={26} />}
            title="No coaches found"
            description={search ? "Try a different search term." : "No verified coaches are listed yet — check back soon."}
          />
        </GlassCard>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {coaches.map((coach) => (
            <Link key={coach.id} to={`/app/coaches/${coach.id}`}>
              <GlassCard hoverable className="h-full">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={coach.display_name} size="lg" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-ink truncate">{coach.display_name}</h3>
                      <StarIcon size={14} className="text-primary shrink-0" />
                    </div>
                    <p className="text-xs text-ink-faint">{coach.experience_years} yrs experience</p>
                  </div>
                </div>
                <Badge tone="primary" className="mb-2.5">
                  {coach.specialization}
                </Badge>
                <p className="text-sm text-ink-soft line-clamp-2">{coach.bio}</p>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
