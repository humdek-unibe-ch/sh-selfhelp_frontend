/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import {
    sanitizeHtmlForParsing,
    sanitizeHtmlForInline,
    stripHtmlTags,
} from '../html-sanitizer.utils';

/**
 * Higher-risk subject (Slice 6): the DOMPurify wrapper is the XSS boundary for
 * all interpolated CMS HTML. These tests pin the security contract (scripts /
 * event handlers / disallowed tags are removed) and the hydration-safe inline
 * rewrite (block tags collapse, inline tags survive).
 */
describe('html-sanitizer: sanitizeHtmlForParsing (XSS boundary)', () => {
    it('removes <script> tags and their payload', () => {
        const out = sanitizeHtmlForParsing('<strong>safe</strong><script>alert("xss")</script>');
        expect(out).toContain('safe');
        expect(out.toLowerCase()).not.toContain('<script');
        expect(out).not.toContain('alert');
    });

    it('drops disallowed tags carrying inline event handlers', () => {
        const out = sanitizeHtmlForParsing('<img src="x" onerror="alert(1)">danger');
        expect(out).toContain('danger');
        expect(out.toLowerCase()).not.toContain('onerror');
        expect(out.toLowerCase()).not.toContain('<img');
    });

    it('keeps an allowed anchor but strips its event-handler attribute', () => {
        const out = sanitizeHtmlForParsing('<a href="https://x.test" onclick="evil()">link</a>');
        expect(out).toContain('link');
        expect(out).toContain('href="https://x.test"');
        expect(out.toLowerCase()).not.toContain('onclick');
        expect(out).not.toContain('evil');
    });

    it('rewrites headings to <strong> and lists to bullets (hydration-safe)', () => {
        expect(sanitizeHtmlForParsing('<h2>Title</h2>')).toContain('<strong>Title</strong>');

        const list = sanitizeHtmlForParsing('<ul><li>a</li><li>b</li></ul>');
        expect(list).toContain('\u2022 a');
        expect(list).toContain('\u2022 b');
    });

    it('returns an empty string for empty / non-string input', () => {
        expect(sanitizeHtmlForParsing('')).toBe('');
        // @ts-expect-error exercising the runtime guard for non-string input
        expect(sanitizeHtmlForParsing(null)).toBe('');
    });
});

describe('html-sanitizer: sanitizeHtmlForInline', () => {
    it('collapses block tags to inline text but preserves inline tags', () => {
        expect(sanitizeHtmlForInline('<p>x</p>')).toBe('x');
        expect(sanitizeHtmlForInline('a<strong>b</strong>')).toBe('a<strong>b</strong>');
    });
});

describe('html-sanitizer: stripHtmlTags', () => {
    it('returns plain text with every tag removed', () => {
        expect(stripHtmlTags('<b>hi</b> <em>there</em>')).toBe('hi there');
    });
});
