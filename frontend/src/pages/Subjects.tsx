import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, X, Search } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { fetchSubjects, createSubject, extractErrorMessage, type Subject } from "../lib/api";
import { useAuthStore } from "../lib/auth-store";

const STANDARDS = ["8th", "9th", "10th"];
const CARD_GRADIENTS = [
  "from-brand-500/20 to-accent-500/20",
  "from-sky-500/20 to-brand-500/20",
  "from-amber-500/20 to-accent-500/20",
  "from-emerald-500/20 to-sky-500/20",
];

export default function Subjects() {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = profile?.role === "admin";

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [standardFilter, setStandardFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  function load() {
    setLoading(true);
    fetchSubjects()
      .then(setSubjects)
      .catch((err) => toast.error(extractErrorMessage(err, "Couldn't load subjects.")))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = subjects.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesStandard = !standardFilter || s.standard === standardFilter;
    return matchesSearch && matchesStandard;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Subjects</h1>
          <p className="text-sm text-white/50">Browse everything available for your standard.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add subject
          </Button>
        )}
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-400/60"
          />
        </div>
        <select
          value={standardFilter}
          onChange={(e) => setStandardFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-brand-400/60"
        >
          <option value="" className="bg-ink-900">All standards</option>
          {STANDARDS.map((s) => (
            <option key={s} value={s} className="bg-ink-900">
              {s}
            </option>
          ))}
        </select>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-shimmer rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-16 text-center">
          <BookOpen className="h-8 w-8 text-white/20" />
          <p className="font-medium text-white/70">No subjects found</p>
          <p className="text-sm text-white/40">
            {subjects.length === 0 ? "An admin needs to add subjects first." : "Try a different search or filter."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full p-5 transition-transform hover:-translate-y-1">
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${
                    CARD_GRADIENTS[i % CARD_GRADIENTS.length]
                  }`}
                >
                  <BookOpen className="h-5 w-5 text-white/80" />
                </div>
                <h3 className="font-semibold">{s.name}</h3>
                <p className="mt-0.5 text-xs text-white/40">Standard {s.standard}</p>
                {s.description && <p className="mt-2 text-sm text-white/50">{s.description}</p>}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {modalOpen && <AddSubjectModal onClose={() => setModalOpen(false)} onCreated={load} />}
      </AnimatePresence>
    </div>
  );
}

function AddSubjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [standard, setStandard] = useState("9th");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createSubject({ name: name.trim(), standard, description: description.trim() || undefined });
      toast.success("Subject added!");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't create that subject."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Add a subject</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Name" placeholder="e.g. Science" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/70">Standard</label>
              <div className="grid grid-cols-3 gap-2">
                {STANDARDS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setStandard(s)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      standard === s
                        ? "border-brand-400/60 bg-brand-500/15 text-white"
                        : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Description (optional)"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button type="submit" loading={saving} className="mt-1 w-full justify-center">
              Add subject
            </Button>
          </form>
        </Card>
      </motion.div>
    </motion.div>
  );
}
