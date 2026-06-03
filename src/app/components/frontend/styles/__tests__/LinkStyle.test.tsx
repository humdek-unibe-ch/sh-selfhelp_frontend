/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import LinkStyle from '../LinkStyle';

/**
 * LinkStyle renders CMS-authored anchors. The "open in new tab" path must also
 * attach a safe rel to avoid reverse-tabnabbing, so both behaviours are pinned.
 */
type LinkStyleField = ComponentProps<typeof LinkStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): LinkStyleField =>
    ({ id: 1, style_name: 'link', ...overrides }) as unknown as LinkStyleField;

describe('LinkStyle', () => {
    it('renders an anchor with the configured label and url (same tab by default)', () => {
        renderWithProviders(
            <LinkStyle
                style={makeStyle({ label: { content: 'Documentation' }, url: { content: 'https://docs.test' } })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const link = screen.getByRole('link', { name: 'Documentation' });
        expect(link).toHaveAttribute('href', 'https://docs.test');
        expect(link).toHaveAttribute('target', '_self');
    });

    it('opens in a new tab with a safe rel when configured', () => {
        renderWithProviders(
            <LinkStyle
                style={makeStyle({
                    label: { content: 'External' },
                    url: { content: 'https://ext.test' },
                    open_in_new_tab: { content: '1' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const link = screen.getByRole('link', { name: 'External' });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
});
