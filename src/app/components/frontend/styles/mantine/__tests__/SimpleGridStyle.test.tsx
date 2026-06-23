/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import SimpleGridStyle from '../SimpleGridStyle';

/**
 * Regression for the 2026-06-22 layout cross-platform pass: simple-grid reads
 * the cross-platform `cols` base count and applies `shared_width`/
 * `shared_height` to the grid container.
 */
type SimpleGridField = ComponentProps<typeof SimpleGridStyle>['style'];

const makeStyle = (overrides: Record<string, unknown>): SimpleGridField =>
    ({ id: 1, style_name: 'simple-grid', children: [], ...overrides }) as unknown as SimpleGridField;

describe('SimpleGridStyle', () => {
    it('renders a SimpleGrid container with the cross-platform width/height', () => {
        const { container } = renderWithProviders(
            <SimpleGridStyle
                style={makeStyle({
                    cols: { content: '4' },
                    shared_width: { content: '50%' },
                    shared_height: { content: '300px' },
                })}
                styleProps={{}}
                cssClass="section-1"
            />,
        );
        const grid = container.querySelector('.mantine-SimpleGrid-root') as HTMLElement | null;
        expect(grid).not.toBeNull();
        expect(grid?.style.width).toBe('50%');
        expect(grid?.style.height).toBe('300px');
    });

    it('renders with responsive web column overrides without crashing', () => {
        const { container } = renderWithProviders(
            <SimpleGridStyle
                style={makeStyle({
                    cols: { content: '2' },
                    web_cols_sm: { content: '1' },
                    web_cols_lg: { content: '4' },
                })}
                styleProps={{}}
                cssClass="section-2"
            />,
        );
        expect(container.querySelector('.mantine-SimpleGrid-root')).not.toBeNull();
    });
});
