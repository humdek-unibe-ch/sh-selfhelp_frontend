/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import BlockquoteStyle from '../BlockquoteStyle';

/**
 * The `blockquote` style now reads a dedicated `blockquote_content`
 * (`markdown-inline`) field instead of the generic shared `content`. Unlike the
 * `highlight` style, the quote body should *preserve* the safe inline subset
 * (Ctrl+B bold etc.) rather than stripping it, so a `<strong>` renders as bold
 * and never leaks literal tags.
 */
type BlockquoteStyleField = ComponentProps<typeof BlockquoteStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): BlockquoteStyleField =>
    ({ id: 1, style_name: 'blockquote', ...overrides }) as unknown as BlockquoteStyleField;

describe('BlockquoteStyle', () => {
    it('renders the blockquote_content field with its citation', () => {
        const { container } = renderWithProviders(
            <BlockquoteStyle
                style={makeStyle({
                    blockquote_content: { content: 'The only way out is through.' },
                    cite: { content: '— Robert Frost' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(container.querySelector('blockquote')).toBeInTheDocument();
        expect(container.textContent).toContain('The only way out is through.');
        expect(container.textContent).toContain('Robert Frost');
    });

    it('preserves inline bold from the markdown-inline editor without leaking tags', () => {
        const { container } = renderWithProviders(
            <BlockquoteStyle
                style={makeStyle({
                    blockquote_content: { content: '<p><strong>Stay</strong> hungry.</p>' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        // Bold is rendered as a real element, not literal text.
        expect(container.querySelector('strong')?.textContent).toBe('Stay');
        expect(container.textContent).not.toContain('<strong>');
        expect(container.textContent).toContain('hungry.');
    });
});
