import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, User, ArrowRight, Users, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import AuroraBackground from "../components/ui/AuroraBackground";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { signup, login, fetchMe, extractErrorMessage } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";

const STANDARDS = ["8th", "9th", "10th"];

export default function Signup() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "parent">("student");
  const [standard, setStandard] = useState("9th");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({
        email,
        password,
        full_name: fullName,
        role,
        ...(role === "student" ? { standard } : {}),
      });
      const data = await login({ email, password });
      setSession({ accessToken: data.access_token, refreshToken: data.refresh_token });
      const profile = await fetchMe();
      setProfile(profile);
      toast.success("Account created! Let's get learning.");
      navigate("/app");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't create your account. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 text-white">
      <AuroraBackground />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="mb-6 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-600/30">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-2xl font-semibold">NidhiAI</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-white/50">Free forever for students & parents</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                  role === "student"
                    ? "border-brand-400/60 bg-brand-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                )}
              >
                <UserRound className="h-5 w-5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("parent")}
                className={clsx(
                  "flex flex-col items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all",
                  role === "parent"
                    ? "border-brand-400/60 bg-brand-500/15 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                )}
              >
                <Users className="h-5 w-5" />
                Parent
              </button>
            </div>

            <Input
              id="fullName"
              label="Full name"
              placeholder="Aarav Sharma"
              icon={<User className="h-4 w-4" />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="At least 6 characters"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {role === "student" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white/70">Standard</label>
                <div className="grid grid-cols-3 gap-2">
                  {STANDARDS.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setStandard(s)}
                      className={clsx(
                        "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                        standard === s
                          ? "border-brand-400/60 bg-brand-500/15 text-white"
                          : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
              Create account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-white/50">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent-300 hover:text-accent-200">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
