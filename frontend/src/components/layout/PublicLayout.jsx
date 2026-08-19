import { Link, Outlet } from "react-router-dom";

import { useTheme } from "../../context/ThemeContext";
import { MoonIcon, SunIcon } from "../ui/Icons";

export default function PublicLayout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="app-backdrop" aria-hidden="true" />
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <span className="font-semibold text-ink tracking-tight">FitWise</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-ink-soft hover:bg-surface-2 hover:text-ink transition-colors"
          >
            {isDark ? <SunIcon size={19} /> : <MoonIcon size={19} />}
          </button>
          <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink px-3 py-2 transition-colors">
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary-dark transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="px-4 sm:px-6 py-8 text-center text-xs text-ink-faint">
        FitWise gives general fitness guidance from deterministic, published formulas. It is not medical advice.
      </footer>
    </div>
  );
}
