import DOMPurify from 'isomorphic-dompurify';

/**
 * Utility functions for sanitizing HTML content to prevent hydration errors and XSS attacks.
 *
 * ## Why `isomorphic-dompurify` and not `dompurify`
 *
 * `dompurify@3.x` returns a stubbed instance (no `.sanitize` method) when the
 * module loads in a non-browser environment, because its constructor calls
 * `getGlobal()` which yields `null` on the server. This caused runtime
 * `DOMPurify.sanitize is not a function` errors inside Client Components
 * that still execute their render on the server during the SSR pass.
 *
 * `isomorphic-dompurify` wraps `dompurify` with `jsdom` on the server so the
 * API is identical in both environments. The `jsdom` cost is paid only once
 * on the Next.js server process and has no impact on the client bundle.
 *
 * All in-app DOMPurify imports must target `isomorphic-dompurify` for this
 * reason — importing `dompurify` directly in a component will break SSR.
 */

/**
 * Sanitizes HTML content for use in inline contexts like Mantine `Input.Label`
 * and `Input.Description`, which render inside `<label>` / `<div>` elements that
 * do **not** tolerate nested block tags (`<p>`, `<div>`, `<h1>` …). Browsers
 * silently rewrite invalid nesting (e.g. hoisting a `<p>` out of a `<label>`),
 * which creates a DOM that diverges from React's virtual tree — the root cause
 * of the "hydration failed" errors we saw on `/form`.
 *
 * ## Why pure-string (regex) instead of `document.createElement`
 * The previous implementation relied on `document.createElement('div')` and
 * recursive `Node` walking. That path is only available in a browser, so on
 * the Next.js server the function silently short-circuited and returned the
 * raw HTML. The client then ran the full DOM pipeline and produced *different*
 * output (e.g. `<p>first name</p>` on the server, `first name` on the client).
 * React compared the two trees during hydration, saw the extra `<p>`, and
 * threw. A pure-string pipeline produces byte-identical output in both
 * environments and eliminates the mismatch permanently.
 *
 * The transformation rules match the original DOM implementation:
 *   - `<h1>…</h1>` … `<h6>…</h6>` → `<strong>…</strong> `
 *   - `<p>…</p>` and `<div>…</div>` → `… ` (content only)
 *   - `<ul>…</ul>` / `<ol>…</ol>` → bullet string built from each `<li>`
 *   - any other block tag (`blockquote`, `section`, tables, …) → inner text
 *   - inline tags (`<span>`, `<strong>`, `<a>`, …) pass through unchanged
 *
 * We sanitize with DOMPurify *first* (see `sanitizeHtmlForParsing`) so by the
 * time we reach this function the input only contains a safe subset of tags.
 *
 * @param htmlContent - The HTML content to sanitize
 * @returns Sanitized HTML string safe for inline contexts
 */
export function sanitizeHtmlForInline(htmlContent: string): string {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return htmlContent || '';
    }

    let out = htmlContent;

    out = out.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_, inner) =>
        collectListItems(inner as string)
    );
    out = out.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_, inner) =>
        collectListItems(inner as string)
    );

    // Any <li> that survived outside of a <ul>/<ol> becomes a bullet too.
    out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => `• ${inner} `);

    out = out.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_, _lvl, inner) =>
        `<strong>${inner}</strong> `
    );

    out = out.replace(/<(p|div)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _tag, inner) =>
        `${inner} `
    );

    // For other block-level tags (blockquote, pre, tables, sectioning, …)
    // strip the tag itself but keep the inner text (matches the old
    // `element.textContent` path).
    const OTHER_BLOCKS = [
        'blockquote',
        'pre',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        'section',
        'article',
        'aside',
        'header',
        'footer',
        'nav',
    ].join('|');
    const otherBlockRe = new RegExp(`<(${OTHER_BLOCKS})[^>]*>([\\s\\S]*?)</\\1>`, 'gi');
    out = out.replace(otherBlockRe, (_full, _tag, inner) => stripAllTags(inner as string));

    return out.trim();
}

/**
 * Internal helper: convert the inner HTML of a `<ul>` / `<ol>` into a
 * bullet-prefixed inline string.
 */
function collectListItems(inner: string): string {
    const matches = Array.from(inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi));
    if (matches.length === 0) {
        return `${stripAllTags(inner)} `;
    }
    return matches.map((m) => `• ${m[1]}`).join(' ') + ' ';
}

/**
 * Internal helper: remove every HTML tag and return the raw text content.
 * Used for block tags we don't want to re-emit (e.g. `<blockquote>`).
 */
function stripAllTags(html: string): string {
    return html.replace(/<[^>]*>/g, '');
}

/**
 * Strips all HTML tags and returns plain text
 *
 * @param htmlContent - The HTML content to strip
 * @returns Plain text content
 */
export function stripHtmlTags(htmlContent: string): string {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return htmlContent || '';
    }

    if (typeof document === 'undefined') {
        return htmlContent.replace(/<[^>]*>/g, '');
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
}

/**
 * Sanitizes HTML content for secure parsing with html-react-parser.
 * Combines DOMPurify (XSS protection) with inline sanitization (hydration safety).
 *
 * @param htmlContent - The HTML content to sanitize
 * @returns Secure HTML string safe for parsing and inline contexts
 */
export function sanitizeHtmlForParsing(htmlContent: string): string {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return htmlContent || '';
    }

    // First, sanitize with DOMPurify to prevent XSS attacks
    const purified = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: ['p', 'div', 'span', 'strong', 'em', 'b', 'i', 'u', 'br', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        ALLOWED_ATTR: ['href', 'target', 'rel']
    });

    // Then apply inline sanitization to prevent hydration errors
    return sanitizeHtmlForInline(purified);
}
