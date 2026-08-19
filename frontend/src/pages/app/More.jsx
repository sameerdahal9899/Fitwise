import { Link } from "react-router-dom";

import { GlassCard } from "../../components/ui/Card";
import { ArrowRightIcon, ChartIcon, SettingsIcon, UserIcon, UsersIcon } from "../../components/ui/Icons";
import { useAuth } from "../../context/AuthContext";

const ITEMS = [
  { to: "/app/analysis", label: "Fitness Analysis", icon: ChartIcon },
  { to: "/app/my-coach", label: "My Coach", icon: UsersIcon },
  { to: "/app/profile", label: "Fitness Profile", icon: UserIcon },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

const COACH_ITEMS = [
  { to: "/coach/dashboard", label: "Coach Dashboard", icon: UsersIcon },
  { to: "/coach/clients", label: "My Clients", icon: UsersIcon },
  { to: "/coach/profile", label: "Coach Listing", icon: UserIcon },
];

export default function More() {
  const { user } = useAuth();
  const items = user?.is_coach ? [...ITEMS, ...COACH_ITEMS] : ITEMS;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink tracking-tight mb-5">More</h1>
      <GlassCard className="p-0 overflow-hidden">
        <div className="divide-y divide-edge">
          {items.map((item) => (
            <Link key={item.to} to={item.to} className="flex items-center gap-3 px-4 py-4 hover:bg-surface-2 transition-colors">
              <item.icon size={19} className="text-primary" />
              <span className="flex-1 text-sm font-medium text-ink">{item.label}</span>
              <ArrowRightIcon size={16} className="text-ink-faint" />
            </Link>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
