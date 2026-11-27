export interface GroundedContext {
  title: string;
  sourceUrl?: string | null;
  content: string;
  similarity?: number;
}

const EMBEDDING_DIMENSION = 768;

function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key ? key : null;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

/**
 * Generates a 768-dimensional embedding vector using Google Gemini's embedding API.
 * Returns null if GEMINI_API_KEY is not configured.
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const trimmed = text.trim();
  if (!trimmed) return null;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-001",
        content: {
          parts: [{ text: trimmed }],
        },
        outputDimensionality: EMBEDDING_DIMENSION,
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Gemini embedding failed (${response.status}): ${errText || response.statusText}`
    );
  }

  const data = (await response.json()) as {
    embedding?: { values?: number[] };
  };

  const values = data.embedding?.values;
  if (!values || values.length === 0) {
    throw new Error("Gemini returned an empty embedding vector.");
  }

  return values;
}

/**
 * Generates embeddings for multiple text chunks sequentially/in small batches
 * to stay friendly with free-tier rate limits.
 */
export async function generateEmbeddingsForChunks(
  texts: string[]
): Promise<(number[] | null)[]> {
  if (!isGeminiConfigured()) {
    return texts.map(() => null);
  }

  const results: (number[] | null)[] = [];
  const batchSize = 5;

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const batch = await Promise.all(
      slice.map((t) =>
        generateEmbedding(t).catch((err) => {
          console.warn("Embedding failed for chunk:", err);
          return null;
        })
      )
    );
    results.push(...batch);
  }

  return results;
}

/**
 * Generates a grounded support answer strictly from retrieved documentation chunks.
 */
export async function generateGroundedAnswer(params: {
  question: string;
  contexts: GroundedContext[];
}): Promise<{ answer: string; model: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Add it to your .env file to enable AI answers."
    );
  }

  const contextBlock =
    params.contexts.length === 0
      ? "NO RELEVANT DOCUMENTATION FOUND."
      : params.contexts
          .map(
            (ctx, idx) =>
              `[Source ${idx + 1}: ${ctx.title}${
                ctx.sourceUrl ? ` (${ctx.sourceUrl})` : ""
              }]\n${ctx.content}`
          )
          .join("\n\n---\n\n");

  const systemInstruction = `You are Echo Support, a technical customer support assistant.
Answer the user's question using ONLY the provided documentation context below.
Rules:
1. Never invent facts, endpoints, pricing, or steps that are not explicitly in the provided context.
2. If the context does not contain enough information to answer, clearly state that the documentation does not cover this and recommend contacting human support.
3. Cite your sources inline like [Source 1] or [Source 2] when referencing information.
4. Keep answers clear, concise, and developer-friendly.`;

  const candidateModels = ["gemini-3.8-flash", "gemini-2.5-flash"];
  let lastError = "";

  for (const model of candidateModels) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Documentation Context:\n${contextBlock}\n\nUser Question: ${params.question}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      lastError = `Gemini generation failed (${response.status}): ${errText || response.statusText}`;
      if (response.status === 503 || response.status === 429) {
        continue;
      }
      throw new Error(lastError);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("")
        .trim() || "";

    if (!answer) {
      throw new Error("The AI model returned an empty response.");
    }

    return { answer, model };
  }

  throw new Error(lastError || "All Gemini models are currently unavailable.");
}
