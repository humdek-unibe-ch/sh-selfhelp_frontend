/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import BadgeStyle from '../BadgeStyle';

/**
 * Regression for the 2026-06-19 polish wave: the badge variant is now the
 * cross-platform `variant` (with `web_variant` as an optional web-only
 * override), plus a `circle` toggle for round count chips.
 */
type BadgeStyleField = ComponentProps<typeof BadgeStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): BadgeStyleField =>
    ({ id: 1, style_name: 'badge', ...overrides }) as unknown as BadgeStyleField;

describe('BadgeStyle', () => {
    it('renders the label', () => {
        renderWithProviders(
            <BadgeStyle style={makeStyle({ label: { content: 'New' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('applies the cross-platform variant', () => {
        renderWithProviders(
            <BadgeStyle
                style={makeStyle({ label: { content: 'Outline' }, variant: { content: 'outline' } })}
                styleProps={{}}
                cssClass="section-2"
            />,
        );
        expect(screen.getByText('Outline').closest('.mantine-Badge-root')).toHaveAttribute('data-variant', 'outline');
    });

    it('lets the web_variant override the variant on web', () => {
        renderWithProviders(
            <BadgeStyle
                style={makeStyle({
                    label: { content: 'Override' },
                    variant: { content: 'filled' },
                    web_variant: { content: 'light' },
                })}
                styleProps={{}}
                cssClass="section-3"
            />,
        );
        expect(screen.getByText('Override').closest('.mantine-Badge-root')).toHaveAttribute('data-variant', 'light');
    });
});
