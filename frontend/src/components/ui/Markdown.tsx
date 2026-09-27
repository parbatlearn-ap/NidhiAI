import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-white/90 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h3 className="font-display text-base font-semibold text-white" {...props} />,
          h2: (props) => <h3 className="font-display text-base font-semibold text-white" {...props} />,
          h3: (props) => <h4 className="font-display text-sm font-semibold text-white" {...props} />,
          p: (props) => <p className="leading-relaxed" {...props} />,
          strong: (props) => <strong className="font-semibold text-white" {...props} />,
          ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
          ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
          li: (props) => <li className="marker:text-accent-400" {...props} />,
          hr: () => <hr className="border-white/10" />,
          code: ({ className, children, ...props }) => {
            const isBlock = /language-/.test(className || "");
            return isBlock ? (
              <code
                className="block overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-xs text-brand-200"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs text-brand-200" {...props}>
                {children}
              </code>
            );
          },
          table: (props) => (
            <div className="overflow-x-auto rounded-lg border border-white/10">
              <table className="w-full text-left text-xs" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-white/5" {...props} />,
          th: (props) => <th className="border-b border-white/10 px-3 py-2 font-semibold text-white/80" {...props} />,
          td: (props) => <td className="border-b border-white/5 px-3 py-2 text-white/70" {...props} />,
          a: (props) => (
            <a className="text-brand-300 underline decoration-brand-400/40 hover:text-brand-200" target="_blank" rel="noreferrer" {...props} />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
