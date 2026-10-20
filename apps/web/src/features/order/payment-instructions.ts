/**
 * Shapes the country's free-text payment instructions (written by staff in the admin) for display.
 * No country or bank is known here: lines that read "Label: value" become label/value rows,
 * everything else stays text, and blank lines separate paragraphs.
 */
export type InstructionBlock =
  { kind: "text"; lines: string[] } | { kind: "details"; rows: { label: string; value: string }[] };

/** "Account title: The Giftpop". The label is short, has no comma, and a space follows the colon. */
const DETAIL_LINE = /^([^:,]{1,32}):\s+(\S.*)$/u;

function blocksOfParagraph(lines: readonly string[]): InstructionBlock[] {
  const blocks: InstructionBlock[] = [];
  for (const line of lines) {
    const match = DETAIL_LINE.exec(line);
    const last = blocks.at(-1);
    if (match?.[1] && match[2]) {
      const row = { label: match[1].trim(), value: match[2].trim() };
      if (last?.kind === "details") last.rows.push(row);
      else blocks.push({ kind: "details", rows: [row] });
    } else if (last?.kind === "text") {
      last.lines.push(line);
    } else {
      blocks.push({ kind: "text", lines: [line] });
    }
  }
  return blocks;
}

export function parsePaymentInstructions(text: string): InstructionBlock[] {
  const paragraphs = text
    .replace(/\r\n?/gu, "\n")
    .split(/\n\s*\n/u)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== ""),
    )
    .filter((lines) => lines.length > 0);
  return paragraphs.flatMap(blocksOfParagraph);
}
