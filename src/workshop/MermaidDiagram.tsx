import { useMemo } from "react";
import { renderMermaidSVG } from "beautiful-mermaid";

interface MermaidDiagramProps {
  code: string;
}

export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const { svg, error } = useMemo(() => {
    try {
      return {
        svg: renderMermaidSVG(code, {
          bg: "#ffffff",
          fg: "#27272a",
          accent: "#f97316",
          transparent: true,
        }),
        error: null,
      };
    } catch (err) {
      return {
        svg: null,
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }, [code]);

  if (error) {
    return (
      <pre className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 overflow-x-auto">
        {error.message}
      </pre>
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-lg border border-neutral-200 p-4 bg-white [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg! }}
    />
  );
}
