/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * ButtonStyle is a high-traffic interactive style: CMS authors use it both as a
 * Mantine button and as an anchor (is_link). These tests pin the render branches
 * without exercising navigation.
 */
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

import ButtonStyle from '../ButtonStyle';

type ButtonStyleField = ComponentProps<typeof ButtonStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): ButtonStyleField =>
    ({ id: 1, style_name: 'button', ...overrides }) as unknown as ButtonStyleField;

describe('ButtonStyle', () => {
    it('renders a Mantine button with the configured label', () => {
        renderWithProviders(
            <ButtonStyle
                style={makeStyle({ label: { content: 'Save changes' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument();
    });

    it('applies the css class to the rendered Mantine button', () => {
        renderWithProviders(
            <ButtonStyle
                style={makeStyle({ label: { content: 'Plain button' } })}
                styleProps={{}}
                cssClass="section-2"
            />,
        );
        const button = screen.getByRole('button', { name: 'Plain button' });
        expect(button).toHaveClass('section-2');
    });

    it('renders an anchor pointing at the page keyword when configured as a link', () => {
        renderWithProviders(
            <ButtonStyle
                style={makeStyle({
                    is_link: { content: '1' },
                    label: { content: 'Go home' },
                    page_keyword: { content: '/home' },
                })}
                styleProps={{}}
                cssClass="section-3"
            />,
        );
        expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/home');
    });

    it('falls back to the external url when no internal page keyword is set', () => {
        renderWithProviders(
            <ButtonStyle
                style={makeStyle({
                    is_link: { content: '1' },
                    label: { content: 'Docs' },
                    url: { content: 'https://example.com/docs' },
                })}
                styleProps={{}}
                cssClass="section-4"
            />,
        );
        expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('href', 'https://example.com/docs');
    });

    it('applies the cross-platform variant', () => {
        renderWithProviders(
            <ButtonStyle
                style={makeStyle({ label: { content: 'Outline' }, variant: { content: 'outline' } })}
                styleProps={{}}
                cssClass="section-5"
            />,
        );
        // Mantine encodes the variant on the data-variant attribute.
        expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute('data-variant', 'outline');
    });
});
