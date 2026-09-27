import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, BookMarked, Sparkles, GraduationCap, User } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Markdown from "../components/ui/Markdown";
import { askQuestion, fetchSubjects, extractErrorMessage, type Subject } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  usedTextbook?: boolean;
  sourcePages?: number[];
  pending?: boolean;
}

const STANDARDS = ["8th", "9th", "10th"];
const SUGGESTIONS = [
  "Explain photosynthesis in simple words",
  "What is Newton's third law of motion?",
  "Summarize the causes of the French Revolution",
  "How do I solve a quadratic equation?",
];

export default function AskTutor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState<string>("");
  const [standard, setStandard] = useState<string>("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSubjects()
      .then(setSubjects)
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    const incomingSubjectId = (location.state as { subjectId?: string } | null)?.subjectId;
    if (incomingSubjectId) {
      setSubjectId(incomingSubjectId);
      inputRef.current?.focus();
      // Clear the router state so navigating back here later doesn't reapply it.
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const q = (text ?? question).trim();
    if (!q || sending) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: q };
    const pendingMsg: Message = { id: crypto.randomUUID(), role: "assistant", text: "", pending: true };
    setMessages((m) => [...m, userMsg, pendingMsg]);
    setQuestion("");
    setSending(true);

    try {
      const subject = subjects.find((s) => s.id === subjectId);
      const res = await askQuestion({
        question: q,
        subject_id: subjectId || undefined,
        subject: subject?.name,
        standard: standard || subject?.standard,
      });
      setMessages((m) =>
        m.map((msg) =>
          msg.id === pendingMsg.id
            ? {
                ...msg,
                text: res.answer,
                usedTextbook: res.used_textbook,
                sourcePages: res.source_pages,
                pending: false,
              }
            : msg
        )
      );
    } catch (err) {
      const message = extractErrorMessage(err, "Couldn't get an answer. Please try again.");
      toast.error(message);
      setMessages((m) => m.filter((msg) => msg.id !== pendingMsg.id));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">Ask Tutor</h1>
        <p className="text-sm text-white/50">Ask any question from your syllabus — get a grounded answer.</p>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <BookMarked className="h-4 w-4" />
          Filters:
        </div>
        <select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-brand-400/60"
        >
          <option value="" className="bg-ink-900">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id} className="bg-ink-900">
              {s.name} · {s.standard}
            </option>
          ))}
        </select>
        <select
          value={standard}
          onChange={(e) => setStandard(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-brand-400/60"
        >
          <option value="" className="bg-ink-900">Any standard</option>
          {STANDARDS.map((s) => (
            <option key={s} value={s} className="bg-ink-900">
              {s}
            </option>
          ))}
        </select>
      </Card>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20">
                <Sparkles className="h-6 w-6 text-accent-300" />
              </div>
              <div>
                <p className="font-medium text-white/80">Ask your first question</p>
                <p className="mt-1 text-sm text-white/40">Try one of these to get started:</p>
              </div>
              <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-left text-sm text-white/70 transition-colors hover:border-brand-400/30 hover:bg-white/[0.06]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                <div
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    m.role === "user"
                      ? "bg-white/10"
                      : "bg-gradient-to-br from-brand-500 to-accent-500"
                  )}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <GraduationCap className="h-4 w-4 text-white" />}
                </div>
                <div
                  className={clsx(
                    "min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "user" ? "max-w-[80%]" : "max-w-[92%] sm:max-w-[85%]",
                    m.role === "user"
                      ? "bg-white/10 text-white"
                      : "border border-brand-400/15 bg-gradient-to-br from-brand-500/10 to-accent-500/5 text-white/90"
                  )}
                >
                  {m.pending ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" />
                    </div>
                  ) : (
                    <>
                      {m.role === "assistant" ? (
                        <Markdown>{m.text}</Markdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      )}
                      {m.role === "assistant" && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={clsx(
                              "rounded-full px-2.5 py-1 text-[11px] font-medium",
                              m.usedTextbook
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-white/10 text-white/40"
                            )}
                          >
                            {m.usedTextbook ? "Grounded in your textbook" : "General knowledge"}
                          </span>
                          {m.sourcePages && m.sourcePages.length > 0 && (
                            <span className="rounded-full bg-brand-500/15 px-2.5 py-1 text-[11px] font-medium text-brand-200">
                              Pages: {m.sourcePages.join(", ")}
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-white/5 p-4"
        >
          <input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-400/60 focus:ring-2 focus:ring-brand-500/20"
          />
          <Button type="submit" loading={sending} disabled={!question.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}
