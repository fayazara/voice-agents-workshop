import { useState, useEffect, useCallback } from "react";
import { steps, type ContentBlock } from "./steps";
import { CodeBlock } from "./CodeBlock";
import { MermaidDiagram } from "./MermaidDiagram";

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
    <div className="h-screen bg-white text-neutral-900 flex flex-col">
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
