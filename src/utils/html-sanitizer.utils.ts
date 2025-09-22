import DOMPurify from 'dompurify';

/**
 * Utility functions for sanitizing HTML content to prevent hydration errors and XSS attacks
 */

/**
 * Sanitizes HTML content for use in inline contexts like Mantine Input descriptions.
 * Converts or removes block-level elements that would cause invalid HTML nesting.
 *
 * @param htmlContent - The HTML content to sanitize
 * @returns Sanitized HTML string safe for inline contexts
 */
export function sanitizeHtmlForInline(htmlContent: string): string {
    if (!htmlContent || typeof htmlContent !== 'string') {
        return htmlContent || '';
    }

    // Block-level elements that should be converted or removed
    const blockElements = [
        'p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'blockquote', 'pre', 'ul', 'ol', 'li', 'table',
        'thead', 'tbody', 'tr', 'th', 'td', 'section',
        'article', 'aside', 'header', 'footer', 'nav'
    ];

    // Create a temporary element to parse and sanitize the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Function to recursively process nodes
    function processNode(node: Node): string {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            const tagName = element.tagName.toLowerCase();

            // If it's a block element, convert it to a span or remove it
            if (blockElements.includes(tagName)) {
                // For headings, keep the text but make it inline
                if (tagName.startsWith('h') && tagName.length === 2) {
                    return `<strong>${Array.from(element.childNodes).map(processNode).join('')}</strong> `;
                }

                // For paragraphs and divs, keep content but make it inline
                if (tagName === 'p' || tagName === 'div') {
                    return Array.from(element.childNodes).map(processNode).join('') + ' ';
                }

                // For lists, convert to inline text
                if (tagName === 'ul' || tagName === 'ol') {
                    const items = Array.from(element.querySelectorAll('li'))
                        .map(li => `• ${Array.from(li.childNodes).map(processNode).join('')}`)
                        .join(' ');
                    return items + ' ';
                }

                // For other block elements, just extract text content
                return element.textContent || '';
            }

            // For inline elements, keep them but process children
            const attributes = Array.from(element.attributes)
                .map(attr => ` ${attr.name}="${attr.value}"`)
                .join('');

            const children = Array.from(element.childNodes)
                .map(processNode)
                .join('');

            return `<${tagName}${attributes}>${children}</${tagName}>`;
        }

        return '';
    }

    // Process all child nodes
    const sanitized = Array.from(tempDiv.childNodes)
        .map(processNode)
        .join('')
        .trim();

    return sanitized;
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
