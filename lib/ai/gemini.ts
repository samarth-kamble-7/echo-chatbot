export interface GroundedContext {
  title: string;
  sourceUrl?: string | null;
  content: string;
  similarity?: number;
}

export interface SectionPromptConfig {
  name: string;
  tone: string;
  instructions?: string | null;
  allowedTopics: string[];
  blockedTopics: string[];
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

export type ConversationToolAction = "none" | "escalate" | "resolve";

export interface ConversationHistoryMessage {
  role: "user" | "assistant" | "operator";
  content: string;
}

const CONVERSATION_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "escalate_conversation",
        description:
          "Escalate the conversation to a human support operator. Call this when the user asks to speak with a human, operator, agent, or support team, OR when the provided documentation context does not contain enough information to answer the user's question.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {
              type: "STRING",
              description: "Brief reason why the conversation is being escalated.",
            },
          },
          required: ["reason"],
        },
      },
      {
        name: "resolve_conversation",
        description:
          "Mark the conversation as resolved and close it. Call this when the user confirms their issue is solved, their question is answered, or they express thanks/goodbye indicating they need no further help.",
        parameters: {
          type: "OBJECT",
          properties: {
            reason: {
              type: "STRING",
              description: "Brief reason why the conversation is being resolved.",
            },
          },
          required: ["reason"],
        },
      },
    ],
  },
];

/**
 * Generates a grounded support answer strictly from retrieved documentation chunks,
 * with Gemini tool calling support for escalating or resolving conversations.
 */
export async function generateGroundedAnswer(params: {
  question: string;
  contexts: GroundedContext[];
  history?: ConversationHistoryMessage[];
  sectionConfig?: SectionPromptConfig;
  botIdentity?: {
    botName?: string;
    systemPrompt?: string | null;
  };
}): Promise<{
  answer: string;
  model: string;
  action: ConversationToolAction;
}> {
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

  const sectionRules: string[] = [];
  if (params.sectionConfig) {
    const sc = params.sectionConfig;
    sectionRules.push(`Active Section: ${sc.name}`);
    sectionRules.push(`Tone: Respond in a ${sc.tone} tone.`);
    if (sc.instructions) {
      sectionRules.push(`Section Behavior Instructions: ${sc.instructions}`);
    }
    if (sc.allowedTopics.length > 0) {
      sectionRules.push(
        `Allowed Topics (stay focused on these): ${sc.allowedTopics.join(", ")}`
      );
    }
    if (sc.blockedTopics.length > 0) {
      sectionRules.push(
        `Blocked Topics (strictly refuse to answer or discuss these, politely redirect instead): ${sc.blockedTopics.join(
          ", "
        )}`
      );
    }
  }

  const botName = params.botIdentity?.botName?.trim() || "Echo Support";
  const customInstructions = params.botIdentity?.systemPrompt?.trim();

  const systemInstruction = `You are ${botName}, a technical customer support assistant.
Answer the user's question using ONLY the provided documentation context below.
Rules:
1. Never invent facts, endpoints, pricing, or steps that are not explicitly in the provided context.
2. If the user asks to talk to a human, operator, or support team, OR if the documentation context does not cover their question, call the escalate_conversation tool.
3. If the user confirms their issue is resolved, thanks you without asking a follow-up question, or says they are done, call the resolve_conversation tool.
4. Do not mention internal source labels like [Source 1] or file names in your reply.
5. Keep answers clear, concise, and helpful.${
    customInstructions ? `\n\nWorkspace Instructions:\n${customInstructions}` : ""
  }${
    sectionRules.length > 0 ? `\n\nSection Rules:\n${sectionRules.join("\n")}` : ""
  }`;

  const historyContents = (params.history || []).map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const userTurn = {
    role: "user",
    parts: [
      {
        text: `Documentation Context:\n${contextBlock}\n\nUser Message: ${params.question}`,
      },
    ],
  };

  const candidateModels = ["gemini-2.5-flash", "gemini-3.8-flash"];
  let lastError = "";

  for (const model of candidateModels) {
    const contents: Array<Record<string, unknown>> = [
      ...historyContents,
      userTurn,
    ];

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
          contents,
          tools: CONVERSATION_TOOLS,
          toolConfig: {
            functionCallingConfig: {
              mode: "AUTO",
            },
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 768,
            thinkingConfig: {
              thinkingBudget: 0,
            },
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
        content?: {
          role?: string;
          parts?: Array<{
            text?: string;
            functionCall?: {
              name?: string;
              args?: Record<string, unknown>;
            };
          }>;
        };
      }>;
    };

    const parts = data.candidates?.[0]?.content?.parts || [];
    const fnCall = parts.find((p) => p.functionCall?.name)?.functionCall;

    let action: ConversationToolAction = "none";
    if (fnCall?.name === "escalate_conversation") {
      action = "escalate";
    } else if (fnCall?.name === "resolve_conversation") {
      action = "resolve";
    }

    let answer = parts
      .map((p) => p.text || "")
      .join("")
      .trim();

    if (fnCall?.name && (action === "escalate" || !answer)) {
      const toolResponsePayload =
        action === "escalate"
          ? {
              status: "escalated",
              success: true,
              instruction:
                "AI is now paused for this session. Clearly inform the user that this conversation has been escalated to a human operator who will reply here shortly. Do NOT invite them to ask more documentation questions.",
            }
          : {
              status: "resolved",
              success: true,
              instruction:
                "The conversation is now marked as resolved and closed. Give a brief, polite closing message.",
            };

      const followUpContents = [
        ...contents,
        {
          role: "model",
          parts: [{ functionCall: fnCall }],
        },
        {
          role: "user",
          parts: [
            {
              functionResponse: {
                name: fnCall.name,
                response: toolResponsePayload,
              },
            },
          ],
        },
      ];

      const followUpRes = await fetch(
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
            contents: followUpContents,
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 256,
              thinkingConfig: {
                thinkingBudget: 0,
              },
            },
          }),
        }
      );

      if (followUpRes.ok) {
        const followUpData = (await followUpRes.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        answer =
          followUpData.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join("")
            .trim() || "";
      }
    }

    if (!answer) {
      if (action === "escalate") {
        answer =
          "I've escalated this conversation to a human operator. Our team will respond shortly.";
      } else if (action === "resolve") {
        answer =
          "Glad I could help! This conversation is now marked as resolved.";
      } else {
        throw new Error("The AI model returned an empty response.");
      }
    }

    return { answer, model, action };
  }

  throw new Error(lastError || "All Gemini models are currently unavailable.");
}
