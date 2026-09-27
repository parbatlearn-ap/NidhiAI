import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageCircleQuestion,
  Sparkles,
  BookOpen,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "../../lib/auth-store";
import AuroraBackground from "../ui/AuroraBackground";

const navItems = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/ask", label: "Ask Tutor", icon: MessageCircleQuestion },
  { to: "/app/infographics", label: "Infographics", icon: Sparkles },
  { to: "/app/subjects", label: "Subjects", icon: BookOpen },
];

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = (profile?.full_name || profile?.email || "N A")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen text-white">
      <AuroraBackground />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-ink-950/60 backdrop-blur-xl lg:flex">
        <SidebarContent profile={profile} initials={initials} onLogout={handleLogout} />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink-950 lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <SidebarContent
                profile={profile}
                initials={initials}
                onLogout={handleLogout}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-ink-950/70 px-4 backdrop-blur-xl lg:px-8">
          <button
            className="rounded-lg p-2 text-white/70 hover:bg-white/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-display text-lg font-semibold lg:hidden">
            <GraduationCap className="h-5 w-5 text-accent-400" />
            NidhiAI
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="text-sm text-white/50">
              {profile?.standard ? `Standard ${profile.standard}` : "Welcome back"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.full_name || profile?.email}</p>
              <p className="text-xs capitalize leading-tight text-white/40">{profile?.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  profile,
  initials,
  onLogout,
  onNavigate,
}: {
  profile: ReturnType<typeof useAuthStore.getState>["profile"];
  initials: string;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-600/30">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <span className="font-display text-xl font-semibold text-white">NidhiAI</span>
        <button
          className="ml-auto rounded-lg p-1.5 text-white/50 hover:bg-white/5 lg:hidden"
          onClick={onNavigate}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-to-r from-brand-600/40 to-accent-500/20 text-white shadow-inner"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-3 rounded-xl border border-white/5 bg-white/[0.03] p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-xs font-bold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile?.full_name || profile?.email}</p>
            <p className="truncate text-xs capitalize text-white/40">{profile?.role}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="mx-3 mb-6 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        <LogOut className="h-4.5 w-4.5" />
        Sign out
      </button>
    </>
  );
}
