/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import FigureStyle from '../FigureStyle';

/**
 * FigureStyle wraps children in a <figure> and renders an optional <figcaption>
 * (caption title + caption). These tests pin the caption rendering and that the
 * figcaption is omitted when no caption is configured.
 */
type FigureStyleField = ComponentProps<typeof FigureStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): FigureStyleField =>
    ({ id: 1, style_name: 'figure', ...overrides }) as unknown as FigureStyleField;

describe('FigureStyle', () => {
    it('renders a figure with the caption title and caption', () => {
        const { container } = renderWithProviders(
            <FigureStyle
                style={makeStyle({ caption_title: { content: 'Figure 1' }, caption: { content: 'System overview' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(container.querySelector('figure')).toBeInTheDocument();
        const figcaption = container.querySelector('figcaption');
        expect(figcaption?.textContent).toContain('Figure 1');
        expect(figcaption?.textContent).toContain('System overview');
    });

    it('omits the figcaption when no caption is provided', () => {
        const { container } = renderWithProviders(
            <FigureStyle style={makeStyle({})} styleProps={{}} cssClass="section-1" />,
        );
        expect(container.querySelector('figure')).toBeInTheDocument();
        expect(container.querySelector('figcaption')).toBeNull();
    });
});
