import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft } from "lucide-react";
import AuroraBackground from "../components/ui/AuroraBackground";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-white">
      <AuroraBackground />
      <GraduationCap className="mb-4 h-12 w-12 text-white/20" />
      <h1 className="font-display text-5xl font-semibold">404</h1>
      <p className="mt-2 text-white/50">This page doesn't exist.</p>
      <Link to="/" className="mt-6">
        <Button variant="secondary">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Button>
      </Link>
    </div>
  );
}
