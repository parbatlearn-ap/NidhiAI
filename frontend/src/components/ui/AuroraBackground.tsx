export default function AuroraBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950 bg-grid">
      <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] animate-blob rounded-full bg-brand-600/30 blur-[110px]" />
      <div className="animation-delay-2000 absolute -top-20 right-0 h-[26rem] w-[26rem] animate-blob rounded-full bg-accent-500/25 blur-[110px]" />
      <div className="animation-delay-4000 absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] animate-blob rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950" />
    </div>
  );
}
