/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import HtmlTagStyle from '../HtmlTagStyle';

/**
 * HtmlTagStyle renders an author-chosen HTML element and sanitizes its raw
 * content with DOMPurify (ALLOWED_TAGS: []). These tests pin that the requested
 * tag is honoured and that markup/scripts are stripped to plain text.
 */
type HtmlTagStyleField = ComponentProps<typeof HtmlTagStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): HtmlTagStyleField =>
    ({ id: 1, style_name: 'html-tag', ...overrides }) as unknown as HtmlTagStyleField;

describe('HtmlTagStyle', () => {
    it('renders the requested tag and strips markup and scripts from the content', () => {
        const { container } = renderWithProviders(
            <HtmlTagStyle
                style={makeStyle({
                    html_tag: { content: 'section' },
                    html_tag_content: { content: '<b>Bold</b> and <script>alert(1)</script>safe' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const section = container.querySelector('section');
        expect(section).toBeInTheDocument();
        expect(section?.getAttribute('content')).toBe('Bold and safe');
        expect(container.querySelector('b')).toBeNull();
        expect(container.querySelector('script')).toBeNull();
    });

    it('renders an empty element when neither content nor children are present', () => {
        const { container } = renderWithProviders(
            <HtmlTagStyle style={makeStyle({ html_tag: { content: 'aside' } })} styleProps={{}} cssClass="section-2" />,
        );
        const aside = container.querySelector('aside');
        expect(aside).toBeInTheDocument();
        expect(aside?.textContent).toBe('');
    });
});
