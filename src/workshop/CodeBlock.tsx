import { useEffect, useRef, useState } from "react";
import { createHighlighter, type Highlighter } from "shiki";

// Only load the languages and theme we actually use in the workshop
const LANGS = [
  "typescript",
  "tsx",
  "json",
  "html",
  "bash",
  "text",
] as const;

const highlighterPromise = createHighlighter({
  themes: ["github-light"],
  langs: [...LANGS],
});

interface CodeBlockProps {
  code: string;
  language: string;
  filename?: string;
}

export function CodeBlock({ code, language, filename }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const hlRef = useRef<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;
    const lang = language === "jsonc" ? "json" : language;

    highlighterPromise.then((hl) => {
      if (cancelled) return;
      hlRef.current = hl;
      const loadedLangs = hl.getLoadedLanguages();
      const safeLang = loadedLangs.includes(lang) ? lang : "text";
      setHtml(
        hl.codeToHtml(code, {
          lang: safeLang,
          theme: "github-light",
        }),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative group rounded-lg overflow-hidden text-sm border border-neutral-200">
      {filename && (
        <div className="bg-neutral-100 text-neutral-500 px-4 py-2 text-xs font-mono border-b border-neutral-200">
          {filename}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs bg-neutral-200 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-300 cursor-pointer"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      {html ? (
        <div
          className="overflow-x-auto [&_pre]:!p-4 [&_pre]:!m-0 [&_pre]:!rounded-none [&_code]:!text-[13px] [&_code]:!leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-neutral-50 text-neutral-700 p-4 overflow-x-auto">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
