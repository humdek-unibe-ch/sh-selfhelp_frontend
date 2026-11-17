/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import TextStyle from '../TextStyle';

/**
 * Higher-risk subject (Slice 6): a representative text style component. It
 * renders interpolated CMS content, so the test pins that the text is shown,
 * that the shared sanitizer strips XSS markup/handlers (defense in depth on top
 * of the dispatcher), and that the safe inline subset (Ctrl+B bold etc.) the
 * author applied in the `markdown-inline` editor survives to the frontend.
 */
type TextStyleProps = ComponentProps<typeof TextStyle>;
type TextStyleField = TextStyleProps['style'];

function makeTextStyle(overrides: Record<string, unknown>): TextStyleField {
    return { id: 1, style_name: 'text', ...overrides } as unknown as TextStyleField;
}

describe('TextStyle', () => {
    it('renders the configured text content', () => {
        renderWithProviders(
            <TextStyle style={makeTextStyle({ text: { content: 'Hello QA' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(screen.getByText('Hello QA')).toBeInTheDocument();
    });

    it('sanitizes markup and event handlers out of the text', () => {
        renderWithProviders(
            <TextStyle
                style={makeTextStyle({ text: { content: '<img src="x" onerror="alert(1)">danger' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByText('danger')).toBeInTheDocument();
        expect(document.querySelector('img')).toBeNull();
    });

    it('preserves inline bold the author applied (Ctrl+B → <strong>)', () => {
        renderWithProviders(
            <TextStyle
                style={makeTextStyle({ text: { content: 'plain <strong>bold</strong> end' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const strong = document.querySelector('strong');
        expect(strong).not.toBeNull();
        expect(strong?.textContent).toBe('bold');
    });

    it('flattens a stray markdown <p> wrapper instead of printing literal tags', () => {
        renderWithProviders(
            <TextStyle
                style={makeTextStyle({ text: { content: '<p class="single-line-paragraph">9 STEF</p>' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByText('9 STEF')).toBeInTheDocument();
        expect(document.querySelector('p p')).toBeNull();
    });

    it('draws nested download links with the theme anchor colour and underline', () => {
        const { container } = renderWithProviders(
            <TextStyle
                style={makeTextStyle({
                    text: {
                        content:
                            '<a href="/lists/1/records/2/files/doc?page_id=3&amp;index=0">one.pdf</a>',
                    },
                    web_text_text_decoration: { content: 'none' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByRole('link', { name: 'one.pdf' })).toBeInTheDocument();
        const host = container.querySelector('.section-1');
        expect(host).not.toBeNull();
        // CSS module `root` adds the nested-link rules (anchor colour + underline).
        expect(host?.className.split(/\s+/).some((c) => c.includes('root'))).toBe(true);
        expect(host?.className).toContain('section-1');
        const css = fs.readFileSync(
            path.join(__dirname, '..', 'TextStyle.module.css'),
            'utf8',
        );
        expect(css).toContain('var(--mantine-color-anchor)');
        expect(css).toContain('text-decoration: underline');
    });
});
