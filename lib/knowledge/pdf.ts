import { extractText } from "unpdf";

/**
 * Extracts plain text from an uploaded PDF File in memory.
 */
export async function extractTextFromPdf(
  file: File
): Promise<{ text: string; totalPages: number }> {
  const buffer = await file.arrayBuffer();
  const result = await extractText(new Uint8Array(buffer), {
    mergePages: true,
  });

  const text = (Array.isArray(result.text) ? result.text.join("\n\n") : result.text)
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    text,
    totalPages: result.totalPages ?? 0,
  };
}
