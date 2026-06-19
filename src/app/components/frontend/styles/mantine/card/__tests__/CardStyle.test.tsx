/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../../../test-utils/renderWithProviders';
import CardStyle from '../CardStyle';

/**
 * The card's optional auto-styled `title` / `img_src` content render only when
 * filled (empty = a plain card) and never create a section.
 */
type CardStyleField = ComponentProps<typeof CardStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): CardStyleField =>
    ({ id: 1, style_name: 'card', children: [], ...overrides }) as unknown as CardStyleField;

describe('CardStyle', () => {
    it('renders the optional title heading (HTML stripped) when set', () => {
        renderWithProviders(
            <CardStyle
                style={makeStyle({ title: { content: '<p class="single-line-paragraph">My Card</p>' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByText('My Card')).toBeTruthy();
        // The literal markdown wrapper must not leak into the heading.
        expect(screen.queryByText(/single-line-paragraph/)).toBeNull();
    });

    it('renders an auto image when img_src is set', () => {
        renderWithProviders(
            <CardStyle
                style={makeStyle({ img_src: { content: '/uploads/cover.png' }, title: { content: 'Cover' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const img = screen.getByRole('img', { name: 'Cover' });
        expect(img.getAttribute('src')).toBeTruthy();
        expect(img.getAttribute('src')).not.toMatch(/^data:/);
    });

    it('renders a plain card with no heading or image when both are empty', () => {
        const { container } = renderWithProviders(
            <CardStyle style={makeStyle({})} styleProps={{}} cssClass="section-1" />,
        );
        expect(container.querySelector('img')).toBeNull();
    });
});
