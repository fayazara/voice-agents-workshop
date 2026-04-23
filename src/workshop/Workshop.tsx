import { useState, useEffect, useCallback } from "react";
import { steps, type ContentBlock } from "./steps";
import { CodeBlock } from "./CodeBlock";
import { MermaidDiagram } from "./MermaidDiagram";
import { QRCode } from "./QRCode";

const LINK_ICONS: Record<string, string> = {
  github:
    "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  globe:
    "M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.22.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z",
  doc: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
};

function LinkIcon({ icon, className }: { icon?: string; className?: string }) {
  const path = icon && LINK_ICONS[icon];
  if (!path) return null;
  const viewBox = icon === "twitter" || icon === "linkedin" ? "0 0 24 24" : "0 0 24 24";
  const vb = icon === "github" ? "0 0 16 16" : viewBox;
  return (
    <svg className={className} viewBox={vb} fill="currentColor">
      <path d={path} />
    </svg>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "text":
      return <p className="text-neutral-600 leading-relaxed">{block.content}</p>;
    case "heading":
      return (
        <h3 className="text-lg font-semibold text-neutral-900 mt-2">{block.content}</h3>
      );
    case "code":
      return (
        <CodeBlock
          code={block.content}
          language={block.language}
          filename={block.filename}
        />
      );
    case "diagram":
      return <MermaidDiagram code={block.content} />;
    case "note":
      return (
        <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-lg px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Note: </span>
          {block.content}
        </div>
      );
    case "list":
      return (
        <ul className="space-y-1.5 text-neutral-600">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2 leading-relaxed">
              <span className="text-orange-500 shrink-0 mt-1">&#x2022;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "intro":
      return (
        <div className="flex flex-col items-center text-center gap-5 py-6">
          <img
            src={block.photo}
            alt={block.name}
            className="w-28 h-28 rounded-full ring-4 ring-orange-100 object-cover"
          />
          <div>
            <h3 className="text-2xl font-bold text-neutral-900">{block.name}</h3>
            <p className="text-neutral-500 mt-1">{block.role}</p>
          </div>
        </div>
      );
    case "resources":
      return (
        <div className="flex flex-col sm:flex-row gap-10 items-center sm:items-start">
          <div className="flex flex-col items-center gap-3 shrink-0">
            <QRCode url={block.qrUrl} size={180} />
            <p className="text-xs text-neutral-400">Scan for this page</p>
          </div>
          <div className="flex-1 space-y-2.5 w-full">
            {block.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-neutral-200 hover:border-orange-300 hover:bg-orange-50 transition-colors group"
              >
                <LinkIcon
                  icon={link.icon}
                  className="w-4 h-4 text-neutral-400 group-hover:text-orange-500 shrink-0"
                />
                <span className="text-sm font-medium text-neutral-700 group-hover:text-orange-600">
                  {link.label}
                </span>
                <span className="ml-auto text-xs text-neutral-300 group-hover:text-orange-400 truncate max-w-[200px] hidden sm:block">
                  {link.url.replace(/^https?:\/\//, "")}
                </span>
              </a>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function Workshop() {
  const [currentStep, setCurrentStep] = useState(() => {
    const hash = window.location.hash;
    const match = hash.match(/#\/workshop\/(\d+)/);
    return match ? Math.min(Number(match[1]), steps.length - 1) : 0;
  });

  const goTo = useCallback(
    (step: number) => {
      const clamped = Math.max(0, Math.min(step, steps.length - 1));
      setCurrentStep(clamped);
      window.location.hash = `#/workshop/${clamped}`;
    },
    [],
  );

  const prev = useCallback(() => goTo(currentStep - 1), [goTo, currentStep]);
  const next = useCallback(() => goTo(currentStep + 1), [goTo, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  // Sync hash changes (browser back/forward)
  useEffect(() => {
    const handler = () => {
      const match = window.location.hash.match(/#\/workshop\/(\d+)/);
      if (match) {
        setCurrentStep(Math.min(Number(match[1]), steps.length - 1));
      }
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="h-dvh bg-white text-neutral-900 flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-100 w-full shrink-0">
        <div
          className="h-full bg-orange-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white px-6 py-3 flex items-center justify-between">
        <a
          href="#/"
          className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          &larr; Back to app
        </a>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/fayazara/voice-agents-workshop"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
          <span className="text-sm text-neutral-400 font-mono">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {/* Step title */}
          <div className="mb-8">
            {step.subtitle && (
              <p className="text-sm font-medium text-orange-500 mb-1 uppercase tracking-wider">
                {step.subtitle}
              </p>
            )}
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">
              {step.title}
            </h2>
          </div>

          {/* Blocks */}
          <div className="space-y-5">
            {step.blocks.map((block, i) => (
              <BlockRenderer key={`${currentStep}-${i}`} block={block} />
            ))}
          </div>
        </div>
      </main>

      {/* Navigation footer */}
      <footer className="shrink-0 border-t border-neutral-200 bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            &larr; Previous
          </button>

          {/* Step dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                  i === currentStep
                    ? "bg-orange-500 scale-125"
                    : i < currentStep
                      ? "bg-orange-300"
                      : "bg-neutral-200"
                }`}
                title={steps[i].title}
              />
            ))}
          </div>

          <button
            onClick={next}
            disabled={currentStep === steps.length - 1}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Next &rarr;
          </button>
        </div>
      </footer>
    </div>
  );
}
