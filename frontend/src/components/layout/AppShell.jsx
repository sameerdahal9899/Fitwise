import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar, Badge } from "../ui/Primitives";
import {
  ChartIcon,
  HomeIcon,
  LogoutIcon,
  MessageIcon,
  MoonIcon,
  MoreIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
} from "../ui/Icons";

const PRIMARY_NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/app/progress", label: "Progress", icon: ChartIcon },
  { to: "/app/coaches", label: "Coaches", icon: UsersIcon },
  { to: "/app/messages", label: "Messages", icon: MessageIcon },
];

const SIDEBAR_NAV = [
  { to: "/app/dashboard", label: "Dashboard", icon: HomeIcon },
  { to: "/app/analysis", label: "Fitness Analysis", icon: ChartIcon },
  { to: "/app/progress", label: "Progress", icon: ChartIcon },
  { to: "/app/coaches", label: "Coaches", icon: UsersIcon },
  { to: "/app/my-coach", label: "My Coach", icon: UsersIcon },
  { to: "/app/messages", label: "Messages", icon: MessageIcon },
  { to: "/app/profile", label: "Fitness Profile", icon: UserIcon },
  { to: "/app/settings", label: "Settings", icon: SettingsIcon },
];

const COACH_NAV = [
  { to: "/coach/dashboard", label: "Coach Dashboard", icon: HomeIcon },
  { to: "/coach/clients", label: "My Clients", icon: UsersIcon },
  { to: "/coach/profile", label: "Coach Listing", icon: UserIcon },
];

function navLinkClasses({ isActive }) {
  return [
    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
    isActive ? "bg-primary-light/70 text-primary-dark" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
  ].join(" ");
}

function Logo() {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
        <span className="text-white font-bold text-sm">F</span>
      </div>
      <span className="font-semibold text-ink tracking-tight">FitWise</span>
    </div>
  );
}

export default function AppShell({ coachMode = false }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navItems = coachMode ? COACH_NAV : SIDEBAR_NAV;

  return (
    <div className="min-h-screen">
      <div className="app-backdrop" aria-hidden="true" />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col gap-1 border-r border-edge glass-solid px-4 py-6">
        <div className="mb-6">
          <Logo />
        </div>
        <nav className="flex-1 flex flex-col gap-1" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          {user?.is_coach && !coachMode && (
            <>
              <div className="h-px bg-edge my-3" />
              <p className="px-3.5 text-xs font-semibold text-ink-faint uppercase tracking-wide mb-1">Coaching</p>
              {COACH_NAV.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClasses}>
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
          {coachMode && (
            <>
              <div className="h-px bg-edge my-3" />
              <NavLink to="/app/dashboard" className={navLinkClasses}>
                <HomeIcon size={18} />
                Switch to my account
              </NavLink>
            </>
          )}
        </nav>
        <div className="border-t border-edge pt-4 flex items-center gap-3">
          <Avatar name={user?.full_name || user?.email} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink truncate">{user?.first_name || user?.email}</p>
            {user?.is_coach && <Badge tone="primary">Coach</Badge>}
          </div>
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
          >
            {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
          <button
            onClick={logout}
            aria-label="Log out"
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-2 hover:text-danger transition-colors"
          >
            <LogoutIcon size={18} />
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between glass px-4 py-3">
        <Logo />
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-2"
          >
            {isDark ? <SunIcon size={19} /> : <MoonIcon size={19} />}
          </button>
          <NavLink to="/app/settings" aria-label="Settings">
            <Avatar name={user?.full_name || user?.email} size="sm" />
          </NavLink>
        </div>
      </header>

      {/* Content */}
      <main className="lg:pl-64 pb-24 lg:pb-8 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 glass px-2 pb-[env(safe-area-inset-bottom)]"
        aria-label="Primary"
      >
        <div className="flex items-center justify-around py-2">
          {(coachMode ? COACH_NAV : PRIMARY_NAV).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors min-w-[60px]",
                  isActive ? "text-primary" : "text-ink-faint",
                ].join(" ")
              }
            >
              <item.icon size={21} />
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/app/more"
            className={({ isActive }) =>
              [
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors min-w-[60px]",
                isActive ? "text-primary" : "text-ink-faint",
              ].join(" ")
            }
          >
            <MoreIcon size={21} />
            More
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
