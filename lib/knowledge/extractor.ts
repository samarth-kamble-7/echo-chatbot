const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
]);

function isPrivateOrBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower) || lower.endsWith(".local")) {
    return true;
  }
  // Block private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)
  const ipv4Match = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) {
      return true;
    }
  }
  return false;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

/**
 * Extracts a readable title and clean plain text from raw HTML.
 */
export function extractTextFromHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim()) : "";

  const stripped = html
    // Remove non-content elements
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Preserve structure with newlines on block elements
    .replace(/<\/(p|div|section|article|li|tr|h[1-6]|blockquote|pre)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // Strip all remaining tags
    .replace(/<[^>]+>/g, " ");

  const text = decodeHtmlEntities(stripped)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { title, text };
}

/**
 * Fetches a public web URL and extracts clean text for indexing.
 */
export async function fetchAndExtractUrl(
  rawUrl: string
): Promise<{ title: string; text: string; finalUrl: string }> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error("Invalid URL format. Please include http:// or https://");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  if (isPrivateOrBlockedHost(parsed.hostname)) {
    throw new Error("Local or private network URLs are not allowed.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "EchoSupportBot/1.0 (+https://echosupport.ai)",
        Accept: "text/html,text/plain,text/markdown,application/json;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (HTTP ${response.status})`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const rawBody = await response.text();

    if (contentType.includes("text/html")) {
      const { title, text } = extractTextFromHtml(rawBody);
      if (!text) {
        throw new Error("No readable text content found at this URL.");
      }
      return {
        title: title || parsed.hostname,
        text,
        finalUrl: response.url || parsed.toString(),
      };
    }

    const text = rawBody.trim();
    if (!text) {
      throw new Error("The URL returned empty content.");
    }

    return {
      title: parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname,
      text,
      finalUrl: response.url || parsed.toString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
