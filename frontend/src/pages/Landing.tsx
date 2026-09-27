import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  MessageCircleQuestion,
  BookOpen,
  ShieldCheck,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";
import AuroraBackground from "../components/ui/AuroraBackground";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const features = [
  {
    icon: MessageCircleQuestion,
    title: "Ask Anything, Anytime",
    desc: "Type a question in your own words and get a simple, step-by-step explanation — grounded in your actual textbook, not generic answers.",
  },
  {
    icon: Sparkles,
    title: "Hand-Drawn Infographics",
    desc: "Turn any topic into a beautiful sketch-style infographic in seconds. Download it as PNG or PDF for revision or printing.",
  },
  {
    icon: BookOpen,
    title: "Real Textbook Grounding",
    desc: "Every subject is backed by your actual Maharashtra Board textbooks — answers cite the exact pages they came from.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Role-Based",
    desc: "Students, parents, and admins each get exactly the access they need, protected by secure login on every request.",
  },
];

const steps = [
  { title: "Create your account", desc: "Sign up as a student or parent in under a minute." },
  { title: "Pick a subject", desc: "Browse subjects for your standard — Marathi, Science, Maths, and more." },
  { title: "Ask & visualize", desc: "Ask questions or generate infographics — grounded in your syllabus." },
];

export default function Landing() {
  return (
    <div className="min-h-screen text-white">
      <AuroraBackground />

      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-600/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-semibold">NidhiAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 pb-24 pt-20 text-center sm:pt-28">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70"
        >
          <Star className="h-3.5 w-3.5 text-accent-400" />
          Built for Class 8–10 Maharashtra Board students
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="font-display text-4xl font-semibold leading-tight sm:text-6xl"
        >
          Your personal AI tutor,
          <br />
          <span className="text-gradient">grounded in your textbooks</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="mt-6 max-w-2xl text-balance text-lg text-white/60"
        >
          Ask questions in plain language, get answers straight from your syllabus, and turn tricky
          topics into hand-drawn infographics you can actually remember.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link to="/signup">
            <Button size="lg">
              Start learning free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              I already have an account
            </Button>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="relative mt-20 w-full"
        >
          <Card className="animate-float mx-auto max-w-3xl p-2">
            <div className="rounded-xl bg-gradient-to-br from-ink-900 to-ink-800 p-6 text-left sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                <span className="h-3 w-3 rounded-full bg-green-400/70" />
                <span className="ml-3 text-xs text-white/40">Ask Tutor</span>
              </div>
              <div className="mb-4 rounded-xl bg-white/5 px-4 py-3 text-sm text-white/80">
                Why does the Krebs cycle happen in the mitochondria?
              </div>
              <div className="rounded-xl border border-brand-400/20 bg-gradient-to-br from-brand-500/10 to-accent-500/10 px-4 py-3 text-sm leading-relaxed text-white/90">
                Great question! The Krebs cycle needs the mitochondria's inner membrane because that's
                where the enzymes for the reaction live...
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-brand-500/20 px-2.5 py-1 text-[11px] font-medium text-brand-200">
                    Grounded in Science textbook · Page 42
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Everything you need to <span className="text-gradient">actually understand</span> your syllabus
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/50">
            Not just another chatbot — NidhiAI is built specifically around the Maharashtra Board curriculum.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="h-full p-6 transition-transform hover:-translate-y-1">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                  <f.icon className="h-5 w-5 text-accent-300" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 text-center"
        >
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Three steps to your first answer</h2>
        </motion.div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 font-display text-lg font-semibold shadow-lg shadow-brand-600/30">
                {i + 1}
              </div>
              <h3 className="mb-2 font-semibold">{s.title}</h3>
              <p className="text-sm text-white/50">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <Card className="relative overflow-hidden px-8 py-14 text-center">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-brand-500/30 blur-[100px]" />
          <Zap className="mx-auto mb-4 h-8 w-8 text-accent-400" />
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Ready to study smarter?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            Join NidhiAI free and get your first grounded answer in under a minute.
          </p>
          <Link to="/signup">
            <Button size="lg" className="mt-8">
              Create your free account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-sm text-white/30">
        © {new Date().getFullYear()} NidhiAI. Built for Maharashtra Board students, Class 8–10.
      </footer>
    </div>
  );
}
