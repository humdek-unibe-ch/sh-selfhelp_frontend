/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import PaperStyle from '../PaperStyle';

/**
 * Regression for the 2026-06-22 layout cross-platform pass: paper gained an
 * optional auto-styled `title` (HTML-stripped, rendered only when filled) and
 * uses the cross-platform `shared_border` toggle.
 */
type PaperStyleField = ComponentProps<typeof PaperStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): PaperStyleField =>
    ({ id: 1, style_name: 'paper', ...overrides }) as unknown as PaperStyleField;

describe('PaperStyle', () => {
    it('renders no heading when the title is empty (plain surface)', () => {
        renderWithProviders(
            <PaperStyle style={makeStyle({})} styleProps={{}} cssClass="section-1" />,
        );
        // A plain paper has no heading text.
        expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
    });

    it('renders the optional title and strips leaked HTML to plain text', () => {
        renderWithProviders(
            <PaperStyle
                style={makeStyle({
                    title: { content: '<p class="single-line-paragraph">Surface heading</p>' },
                })}
                styleProps={{}}
                cssClass="section-2"
            />,
        );
        const heading = screen.getByText('Surface heading');
        expect(heading).toBeInTheDocument();
        // No literal tags leaked into the DOM text.
        expect(heading.textContent).toBe('Surface heading');
    });

    it('applies the cross-platform shared_border', () => {
        const { container } = renderWithProviders(
            <PaperStyle
                style={makeStyle({ shared_border: { content: '1' } })}
                styleProps={{}}
                cssClass="section-3"
            />,
        );
        expect(container.querySelector('.mantine-Paper-root')).toHaveAttribute('data-with-border', 'true');
    });
});
