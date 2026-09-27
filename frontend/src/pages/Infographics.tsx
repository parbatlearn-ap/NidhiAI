import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Image as ImageIcon, Wand2 } from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { api, generateInfographic, extractErrorMessage, type InfographicResponse } from "../lib/api";

const STANDARDS = ["", "8th", "9th", "10th"];

export default function Infographics() {
  const [topic, setTopic] = useState("");
  const [standard, setStandard] = useState("");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<InfographicResponse | null>(null);
  const [pngPreview, setPngPreview] = useState<string | null>(null);
  const [history, setHistory] = useState<InfographicResponse[]>([]);
  const [downloading, setDownloading] = useState<"png" | "pdf" | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim() || loading) return;
    setLoading(true);
    setCurrent(null);
    setPngPreview(null);
    try {
      const result = await generateInfographic({ topic: topic.trim(), standard: standard || undefined });
      setCurrent(result);
      setHistory((h) => [result, ...h].slice(0, 8));

      const { data } = await api.get(`/infographics/${result.id}/download`, {
        params: { format: "png" },
        responseType: "blob",
      });
      setPngPreview(URL.createObjectURL(data));
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't generate that infographic. Try a different topic."));
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(fileId: string, format: "png" | "pdf") {
    setDownloading(format);
    try {
      const { data } = await api.get(`/infographics/${fileId}/download`, {
        params: { format },
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nidhiai-infographic.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't download that file."));
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Infographics</h1>
        <p className="text-sm text-white/50">
          Turn any topic into a hand-drawn-style infographic you can download and revise from.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleGenerate} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Topic"
              placeholder="e.g. Photosynthesis, Newton's Laws, The French Revolution"
              icon={<Wand2 className="h-4 w-4" />}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:w-40">
            <label className="text-sm font-medium text-white/70">Standard</label>
            <select
              value={standard}
              onChange={(e) => setStandard(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-400/60"
            >
              {STANDARDS.map((s) => (
                <option key={s} value={s} className="bg-ink-900">
                  {s || "Any"}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={loading} className="sm:w-auto">
            <Sparkles className="h-4 w-4" /> Generate
          </Button>
        </form>
      </Card>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="flex flex-col items-center gap-4 p-16">
              <div className="h-56 w-full max-w-md animate-shimmer rounded-xl" />
              <p className="text-sm text-white/40">Sketching your infographic...</p>
            </Card>
          </motion.div>
        )}

        {!loading && current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="overflow-hidden p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="flex items-center justify-center bg-white p-6">
                  {pngPreview ? (
                    <img src={pngPreview} alt={current.title} className="max-h-[420px] rounded-lg shadow-lg" />
                  ) : (
                    <div className="h-64 w-full animate-shimmer rounded-lg" />
                  )}
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-8">
                  <h2 className="font-display text-xl font-semibold">{current.title}</h2>
                  <ul className="mt-4 space-y-2.5">
                    {current.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-white/70">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(current.id, "png")}
                      loading={downloading === "png"}
                    >
                      <ImageIcon className="h-4 w-4" /> PNG
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDownload(current.id, "pdf")}
                      loading={downloading === "pdf"}
                    >
                      <FileText className="h-4 w-4" /> PDF
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 1 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-white/50">Earlier this session</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {history.slice(1).map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setCurrent(h);
                  api
                    .get(`/infographics/${h.id}/download`, { params: { format: "png" }, responseType: "blob" })
                    .then(({ data }) => setPngPreview(URL.createObjectURL(data)))
                    .catch(() => toast.error("Couldn't reload that infographic."));
                }}
                className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.06]"
              >
                <p className="truncate font-medium">{h.title}</p>
                <p className="mt-0.5 text-xs text-white/40">{h.points.length} key points</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !current && (
        <Card className="flex flex-col items-center gap-3 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20">
            <Sparkles className="h-6 w-6 text-accent-300" />
          </div>
          <p className="font-medium text-white/80">No infographic yet</p>
          <p className="max-w-sm text-sm text-white/40">
            Type a topic above and hit generate — you'll get a hand-drawn-style visual in seconds.
          </p>
        </Card>
      )}
    </div>
  );
}
