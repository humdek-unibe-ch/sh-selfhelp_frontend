/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import ImageStyle from '../ImageStyle';

/**
 * ImageStyle must always expose alt text for accessibility and fall back to an
 * inline placeholder when no source is configured. The default (non-Mantine)
 * branch renders a plain <img>, which is what these tests pin.
 */
type ImageStyleField = ComponentProps<typeof ImageStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): ImageStyleField =>
    ({ id: 1, style_name: 'image', ...overrides }) as unknown as ImageStyleField;

describe('ImageStyle', () => {
    it('renders an img with alt text and a resolved (non-placeholder) source', () => {
        renderWithProviders(
            <ImageStyle
                style={makeStyle({ img_src: { content: '/uploads/pic.png' }, alt: { content: 'A picture' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const img = screen.getByRole('img', { name: 'A picture' });
        expect(img.getAttribute('src')).toBeTruthy();
        expect(img.getAttribute('src')).not.toMatch(/^data:/);
    });

    it('falls back to an inline placeholder image when no source is provided', () => {
        renderWithProviders(
            <ImageStyle style={makeStyle({ alt: { content: 'Empty' } })} styleProps={{}} cssClass="section-1" />,
        );
        const img = screen.getByRole('img', { name: 'Empty' });
        expect(img.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
    });
});
