import { figureBlocks, parseFigure } from "./figures.mjs";
import type { Chart, Diagram } from "./figures.mjs";
import { parseMarkdown } from "./markdown.mjs";
import { chartGeometry, diagramGeometry } from "./figure-layout";
import type { PreparedFigure } from "@/components/Figure";

/**
 * Every figure fence in a markdown body, checked and laid out, in document
 * order. Diagram layout is async (elkjs), so it is done here, before the
 * synchronous markdown render; the renderer picks each one up by its index.
 * A block that breaks the contract fails the build with its line.
 */
export async function prepareFigures(markdown: string): Promise<PreparedFigure[]> {
  const blocks = figureBlocks(parseMarkdown(markdown));
  return Promise.all(
    blocks.map(async (b, i): Promise<PreparedFigure> => {
      const parsed = parseFigure(b.lang, b.value);
      if ("problems" in parsed) {
        throw new Error(`${b.lang} block ${i + 1} (body line ${b.line}): ${parsed.problems.join("; ")}`);
      }
      if (b.lang === "chart") {
        const chart = parsed.figure as Chart;
        return { lang: "chart", chart, geo: chartGeometry(chart) };
      }
      const diagram = parsed.figure as Diagram;
      return { lang: "diagram", diagram, geo: await diagramGeometry(diagram) };
    }),
  );
}
