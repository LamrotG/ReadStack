import { load } from "cheerio";

const WORDS_PER_MINUTE = 225;
const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254"]);

export function isSafeHttpUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(url.protocol)) return false;

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname)) return false;
  if (
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  ) {
    return false;
  }

  return true;
}

export async function fetchLinkMetadata(link) {
  try {
    const res = await fetch(link, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return {};

    const html = await res.text();
    const $ = load(html);

    const title =
      $('meta[property="og:title"]').attr("content")?.trim() ||
      $("title").first().text().trim() ||
      null;

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText ? bodyText.split(" ").length : 0;
    const estimatedReadTimeMinutes = wordCount ? Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE)) : null;

    return { title, estimatedReadTimeMinutes };
  } catch {
    return {};
  }
}
