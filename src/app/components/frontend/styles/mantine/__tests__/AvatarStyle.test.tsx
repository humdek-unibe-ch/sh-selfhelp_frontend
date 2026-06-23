/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import AvatarStyle from '../AvatarStyle';

/**
 * Regression for the 2026-06-19 polish wave: the avatar now derives initials
 * from the `name` field (auto colour) when there is no image, and the web
 * variant field is `web_variant` (was the stale `web_avatar_variant`).
 */
type AvatarStyleField = ComponentProps<typeof AvatarStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): AvatarStyleField =>
    ({ id: 1, style_name: 'avatar', ...overrides }) as unknown as AvatarStyleField;

describe('AvatarStyle', () => {
    it('derives initials from the name when no image is set', () => {
        renderWithProviders(
            <AvatarStyle style={makeStyle({ name: { content: 'Jane Doe' } })} styleProps={{}} cssClass="section-1" />,
        );
        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('falls back to the custom initials when no name or image is set', () => {
        renderWithProviders(
            <AvatarStyle
                style={makeStyle({ web_avatar_initials: { content: 'Quality Assurance' } })}
                styleProps={{}}
                cssClass="section-2"
            />,
        );
        expect(screen.getByText('QA')).toBeInTheDocument();
    });
});
