import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { GraduationCap } from "lucide-react";
import { useAuthStore } from "./lib/auth-store";
import { fetchMe } from "./lib/api";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AppShell from "./components/layout/AppShell";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import AskTutor from "./pages/AskTutor";
import Infographics from "./pages/Infographics";
import Subjects from "./pages/Subjects";
import NotFound from "./pages/NotFound";

function useAuthBootstrap() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const logout = useAuthStore((s) => s.logout);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setReady(true);
      return;
    }
    if (profile) {
      setReady(true);
      return;
    }
    fetchMe()
      .then(setProfile)
      .catch(() => logout())
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  return ready;
}

function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <span className="font-display text-lg text-white/60">NidhiAI</span>
      </div>
    </div>
  );
}

export default function App() {
  const ready = useAuthBootstrap();

  if (!ready) return <SplashScreen />;

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#1a1730",
            color: "#f4f3f8",
            border: "1px solid rgba(255,255,255,0.08)",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="ask" element={<AskTutor />} />
            <Route path="infographics" element={<Infographics />} />
            <Route path="subjects" element={<Subjects />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
