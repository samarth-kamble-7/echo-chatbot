export interface TextChunk {
  chunkIndex: number;
  content: string;
  tokenCount: number;
}

export interface ChunkOptions {
  maxChars?: number;
  overlapChars?: number;
}

/**
 * Estimates token count (~4 characters per token for English/code text).
 */
export function estimateTokenCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return Math.max(1, Math.ceil(trimmed.length / 4));
}

/**
 * Splits cleaned text into overlapping chunks, preferring paragraph or sentence boundaries.
 */
export function chunkText(
  rawText: string,
  options: ChunkOptions = {}
): TextChunk[] {
  const maxChars = options.maxChars ?? 1800; // ~450 tokens
  const overlapChars = Math.min(options.overlapChars ?? 250, Math.floor(maxChars / 2));

  const cleaned = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) return [];

  if (cleaned.length <= maxChars) {
    return [
      {
        chunkIndex: 0,
        content: cleaned,
        tokenCount: estimateTokenCount(cleaned),
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + maxChars, cleaned.length);

    // Try to break cleanly on a paragraph or sentence boundary if not at EOF
    if (end < cleaned.length) {
      const slice = cleaned.slice(start, end);
      const lastParagraph = slice.lastIndexOf("\n\n");
      const lastNewline = slice.lastIndexOf("\n");
      const lastSentence = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! ")
      );

      const minBreak = Math.floor(maxChars * 0.5);
      if (lastParagraph >= minBreak) {
        end = start + lastParagraph + 2;
      } else if (lastSentence >= minBreak) {
        end = start + lastSentence + 2;
      } else if (lastNewline >= minBreak) {
        end = start + lastNewline + 1;
      }
    }

    const content = cleaned.slice(start, end).trim();
    if (content) {
      chunks.push({
        chunkIndex: index++,
        content,
        tokenCount: estimateTokenCount(content),
      });
    }

    if (end >= cleaned.length) break;

    const nextStart = end - overlapChars;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}
