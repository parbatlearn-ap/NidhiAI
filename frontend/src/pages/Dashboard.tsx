import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircleQuestion, Sparkles, BookOpen, ArrowRight, Flame, GraduationCap } from "lucide-react";
import Card from "../components/ui/Card";
import { useAuthStore } from "../lib/auth-store";
import { fetchSubjects, type Subject } from "../lib/api";

const quickActions = [
  {
    to: "/app/ask",
    icon: MessageCircleQuestion,
    title: "Ask a question",
    desc: "Get a grounded, step-by-step answer from your textbook.",
  },
  {
    to: "/app/infographics",
    icon: Sparkles,
    title: "Make an infographic",
    desc: "Turn a topic into a hand-drawn visual you can download.",
  },
  {
    to: "/app/subjects",
    icon: BookOpen,
    title: "Browse subjects",
    desc: "See everything available for your standard.",
  },
];

export default function Dashboard() {
  const profile = useAuthStore((s) => s.profile);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]))
      .finally(() => setLoading(false));
  }, []);

  const firstName = (profile?.full_name || profile?.email || "there").split(" ")[0];

  return (
    <div className="flex flex-col gap-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-semibold">
          Hey {firstName} <span className="inline-block animate-float">👋</span>
        </h1>
        <p className="mt-1 text-white/50">What would you like to explore today?</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {quickActions.map((a, i) => (
          <motion.div
            key={a.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={a.to}>
              <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:border-brand-400/30">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <a.icon className="h-5 w-5 text-accent-300" />
                </div>
                <h3 className="mb-1.5 font-semibold text-white">{a.title}</h3>
                <p className="text-sm text-white/50">{a.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-300 opacity-0 transition-opacity group-hover:opacity-100">
                  Go <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <GraduationCap className="h-5 w-5 text-brand-300" />
              Available subjects
            </h2>
            <Link to="/app/subjects" className="text-sm font-medium text-brand-300 hover:text-brand-200">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-shimmer rounded-xl" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <p className="text-sm text-white/40">
              No subjects yet — an admin needs to add textbooks first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {subjects.slice(0, 8).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]"
                >
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-white/40">Std {s.standard}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
        <Card className="flex items-center gap-4 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
            <Flame className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <p className="font-medium">Tip: the more specific your question, the better the answer.</p>
            <p className="text-sm text-white/50">
              Try "Explain photosynthesis using the leaf diagram" instead of just "photosynthesis".
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
