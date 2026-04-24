type LegacyMeta = {
  title?: string;
  description?: string;
  canonical?: string;
};

function firstMatch(html: string, re: RegExp): string | undefined {
  const m = html.match(re);
  return m?.[1]?.trim();
}

export function extractLegacyMeta(html: string): LegacyMeta {
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description =
    firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) ??
    firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const canonical =
    firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i) ??
    firstMatch(html, /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["'][^>]*>/i);

  return { title, description, canonical };
}

export function extractHeadStyles(html: string): string {
  // Concatenate all <style> blocks from the head.
  // We intentionally keep them as-is; these legacy pages use inline CSS heavily.
  const head = firstMatch(html, /<head[^>]*>([\s\S]*?)<\/head>/i) ?? '';
  const styles: string[] = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(head))) styles.push(m[1]);
  return styles.join('\n\n');
}

export function extractPageWrapperInner(html: string): string {
  // Most legacy pages wrap their content in <div class="page-wrapper">...</div>.
  // We return the inner HTML so BaseLayout can provide nav/footer/wrapper.
  const classIdx = html.search(/class=["'][^"']*\bpage-wrapper\b[^"']*["']/i);
  if (classIdx === -1) return '';

  const openDivIdx = html.lastIndexOf('<div', classIdx);
  if (openDivIdx === -1) return '';

  const openTagEnd = html.indexOf('>', openDivIdx);
  if (openTagEnd === -1) return '';

  const contentStart = openTagEnd + 1;
  let contentEnd = html.search(/<script\b/i);
  if (contentEnd !== -1 && contentEnd < contentStart) contentEnd = -1;
  if (contentEnd === -1) contentEnd = html.search(/<\/body\b/i);
  if (contentEnd === -1) return '';

  let inner = html.slice(contentStart, contentEnd).trim();

  // Drop the closing </div> for the page-wrapper (and only that last wrapper close).
  const lastClose = inner.toLowerCase().lastIndexOf('</div>');
  if (lastClose !== -1) inner = inner.slice(0, lastClose).trim();

  return inner;
}

export function extractBodyScripts(html: string): string {
  // Grab scripts that appear after the page-wrapper (common pattern in these pages).
  const scriptIdx = html.search(/<script\b/i);
  if (scriptIdx === -1) return '';
  const bodyEnd = html.search(/<\/body\b/i);
  const end = bodyEnd === -1 ? html.length : bodyEnd;
  return html.slice(scriptIdx, end).trim();
}

