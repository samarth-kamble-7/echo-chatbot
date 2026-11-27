const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
]);

const SKIP_EXTENSIONS =
  /\.(png|jpe?g|gif|svg|webp|ico|css|js|mjs|map|woff2?|ttf|eot|mp4|mp3|zip|tar|gz|pdf)$/i;

function isPrivateOrBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower) || lower.endsWith(".local")) {
    return true;
  }
  const ipv4Match = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    ) {
      return true;
    }
  }
  return false;
}

function validatePublicUrl(rawUrl: string): URL {
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

  return parsed;
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

function stripHtmlFragment(fragment: string): string {
  const stripped = fragment
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<\/(p|div|section|article|li|tr|h[1-6]|blockquote|pre)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(stripped)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extracts a readable title and clean plain text from raw HTML,
 * prioritizing <main> or <article> when available.
 */
export function extractTextFromHtml(html: string): { title: string; text: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch
    ? decodeHtmlEntities(titleMatch[1].replace(/\s+/g, " ").trim())
    : "";

  const mainMatch =
    html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  if (mainMatch) {
    const mainText = stripHtmlFragment(mainMatch[1]);
    if (mainText.length >= 120) {
      return { title, text: mainText };
    }
  }

  return { title, text: stripHtmlFragment(html) };
}

/**
 * Fallback extractor using Jina Reader for JS-rendered SPAs.
 */
async function fetchViaJinaReader(targetUrl: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`https://r.jina.ai/${targetUrl}`, {
      signal: controller.signal,
      headers: {
        Accept: "text/plain",
      },
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.length >= 60 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches a public web URL and extracts clean text for indexing.
 * Automatically falls back to Jina Reader for JS-rendered SPAs.
 */
export async function fetchAndExtractUrl(
  rawUrl: string
): Promise<{ title: string; text: string; finalUrl: string; html?: string }> {
  const parsed = validatePublicUrl(rawUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "EchoSupportBot/1.0",
        Accept: "text/html,text/plain,text/markdown,application/json;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (HTTP ${response.status})`);
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const rawBody = await response.text();
    const finalUrl = response.url || parsed.toString();

    if (contentType.includes("text/html")) {
      const { title, text } = extractTextFromHtml(rawBody);
      if (text.length >= 120) {
        return {
          title: title || parsed.hostname,
          text,
          finalUrl,
          html: rawBody,
        };
      }

      // Fallback to Jina Reader for client-rendered SPAs
      const jinaText = await fetchViaJinaReader(finalUrl);
      if (jinaText) {
        return {
          title: title || parsed.hostname,
          text: jinaText,
          finalUrl,
          html: rawBody,
        };
      }

      if (text) {
        return {
          title: title || parsed.hostname,
          text,
          finalUrl,
          html: rawBody,
        };
      }

      throw new Error("No readable text content found at this URL.");
    }

    const text = rawBody.trim();
    if (!text) {
      throw new Error("The URL returned empty content.");
    }

    return {
      title: parsed.pathname.split("/").filter(Boolean).pop() || parsed.hostname,
      text,
      finalUrl,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeCandidateUrl(href: string, base: URL): string | null {
  try {
    const resolved = new URL(href, base);
    if (resolved.origin !== base.origin) return null;
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    if (SKIP_EXTENSIONS.test(resolved.pathname)) return null;
    resolved.hash = "";
    // Normalize trailing slash (except root)
    if (resolved.pathname.length > 1 && resolved.pathname.endsWith("/")) {
      resolved.pathname = resolved.pathname.slice(0, -1);
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

/**
 * Discovers up to `maxPages` same-origin URLs starting from `rootUrl`
 * using sitemap.xml and links extracted from the starting page.
 */
export async function discoverSiteUrls(
  rootUrl: string,
  maxPages = 10,
  initialHtml?: string
): Promise<string[]> {
  const base = validatePublicUrl(rootUrl);
  const normalizedRoot = normalizeCandidateUrl(base.toString(), base) || base.toString();
  const pathPrefix =
    base.pathname.length > 1 && base.pathname.endsWith("/")
      ? base.pathname.slice(0, -1)
      : base.pathname;

  const discovered = new Set<string>([normalizedRoot]);

  // 1. Check /sitemap.xml
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const sitemapRes = await fetch(`${base.origin}/sitemap.xml`, {
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (sitemapRes.ok) {
      const xml = await sitemapRes.text();
      const locMatches = xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi);
      for (const m of locMatches) {
        if (discovered.size >= maxPages) break;
        const candidate = normalizeCandidateUrl(m[1], base);
        if (!candidate) continue;
        if (pathPrefix !== "/" && !new URL(candidate).pathname.startsWith(pathPrefix)) {
          continue;
        }
        discovered.add(candidate);
      }
    }
  } catch {
    // ignore missing or unreachable sitemap
  }

  // 2. Extract same-origin <a href="..."> links from the root page HTML
  if (discovered.size < maxPages && initialHtml) {
    const hrefMatches = initialHtml.matchAll(/href=["']([^"']+)["']/gi);
    for (const m of hrefMatches) {
      if (discovered.size >= maxPages) break;
      const rawHref = m[1].trim();
      if (
        !rawHref ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("javascript:")
      ) {
        continue;
      }
      const candidate = normalizeCandidateUrl(rawHref, base);
      if (!candidate) continue;
      if (pathPrefix !== "/" && !new URL(candidate).pathname.startsWith(pathPrefix)) {
        continue;
      }
      discovered.add(candidate);
    }
  }

  return Array.from(discovered).slice(0, maxPages);
}
