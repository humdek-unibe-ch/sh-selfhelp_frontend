/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import HighlightStyle from '../HighlightStyle';

/**
 * The `highlight` style shares the `text` content field with the `text` style.
 * That field is now a `markdown-inline` editor, so an author can apply Ctrl+B and
 * the editor may persist a `<p>` wrapper. Mantine `<Highlight>` renders its child
 * as a plain string (it wraps a matched substring in `<mark>`), so any HTML must
 * be stripped first — otherwise the literal `<p>` / `<strong>` tags would show on
 * the page. These tests pin that behaviour and the substring highlighting.
 */
type HighlightStyleProps = ComponentProps<typeof HighlightStyle>;
type HighlightStyleField = HighlightStyleProps['style'];

function makeHighlightStyle(overrides: Record<string, unknown>): HighlightStyleField {
    return { id: 1, style_name: 'highlight', ...overrides } as unknown as HighlightStyleField;
}

describe('HighlightStyle', () => {
    it('highlights the configured substring within the content', () => {
        const { container } = renderWithProviders(
            <HighlightStyle
                style={makeHighlightStyle({
                    text: { content: 'Highlight some text here' },
                    highlight_highlight: { content: 'some text' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(container.querySelector('mark')?.textContent).toBe('some text');
        expect(container.textContent).toContain('Highlight some text here');
    });

    it('strips a stray markdown <p>/<strong> wrapper instead of printing literal tags', () => {
        const { container } = renderWithProviders(
            <HighlightStyle
                style={makeHighlightStyle({
                    text: { content: '<p class="single-line-paragraph"><strong>Bold</strong> highlight me</p>' },
                    highlight_highlight: { content: 'highlight' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        // No literal markup leaks onto the page.
        expect(container.textContent).not.toContain('<');
        expect(container.textContent).not.toContain('strong');
        // The highlight mark is still applied to the now plain-text match.
        expect(container.querySelector('mark')?.textContent).toBe('highlight');
    });
});
