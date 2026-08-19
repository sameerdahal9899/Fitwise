import { Navigate, Route, BrowserRouter, Routes } from "react-router-dom";

import AppShell from "./components/layout/AppShell";
import PublicLayout from "./components/layout/PublicLayout";
import { RequireAuth, RequireCoach, RequireGuest } from "./components/layout/RouteGuards";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";

import Onboarding from "./pages/onboarding/Onboarding";
import CoachApply from "./pages/onboarding/CoachApply";

import Dashboard from "./pages/app/Dashboard";
import FitnessAnalysis from "./pages/app/FitnessAnalysis";
import ProgressPage from "./pages/app/Progress";
import ProfilePage from "./pages/app/ProfilePage";
import CoachDirectory from "./pages/app/CoachDirectory";
import CoachProfilePage from "./pages/app/CoachProfilePage";
import MyCoach from "./pages/app/MyCoach";
import Messages from "./pages/app/Messages";
import Settings from "./pages/app/Settings";
import More from "./pages/app/More";

import CoachDashboard from "./pages/coach/CoachDashboard";
import CoachProfileEdit from "./pages/coach/CoachProfileEdit";
import ClientConnections from "./pages/coach/ClientConnections";
import ClientOverview from "./pages/coach/ClientOverview";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route element={<PublicLayout />}>
              <Route index element={<Landing />} />
              <Route element={<RequireGuest />}>
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
              </Route>
            </Route>

            {/* Authenticated — normal user app */}
            <Route element={<RequireAuth />}>
              <Route path="app/onboarding" element={<Onboarding />} />
              <Route path="app/coach-apply" element={<CoachApply />} />

              <Route path="app" element={<AppShell />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="analysis" element={<FitnessAnalysis />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="coaches" element={<CoachDirectory />} />
                <Route path="coaches/:id" element={<CoachProfilePage />} />
                <Route path="my-coach" element={<MyCoach />} />
                <Route path="messages" element={<Messages />} />
                <Route path="messages/:id" element={<Messages />} />
                <Route path="settings" element={<Settings />} />
                <Route path="more" element={<More />} />
              </Route>

              {/* Authenticated — coach app */}
              <Route element={<RequireCoach />}>
                <Route path="coach" element={<AppShell coachMode />}>
                  <Route path="dashboard" element={<CoachDashboard />} />
                  <Route path="clients" element={<ClientConnections />} />
                  <Route path="clients/:connectionId" element={<ClientOverview />} />
                  <Route path="profile" element={<CoachProfileEdit />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
