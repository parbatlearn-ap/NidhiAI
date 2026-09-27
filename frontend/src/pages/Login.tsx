import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import AuroraBackground from "../components/ui/AuroraBackground";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { login, fetchMe, extractErrorMessage } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";

export default function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login({ email, password });
      setSession({ accessToken: data.access_token, refreshToken: data.refresh_token });
      const profile = await fetchMe();
      setProfile(profile);
      toast.success(`Welcome back, ${profile.full_name || profile.email}!`);
      navigate("/app");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't log you in. Check your email and password."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-white">
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
          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-white/50">Log in to continue learning</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="mt-1 w-full justify-center">
              Log in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-white/50">
          New to NidhiAI?{" "}
          <Link to="/signup" className="font-medium text-accent-300 hover:text-accent-200">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
