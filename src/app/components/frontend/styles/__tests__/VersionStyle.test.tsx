/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { IPlatformAbout } from '../../../../../shared';

vi.mock('../../../../../utils/web-libraries.utils', () => ({
    WEB_LIBRARIES: [
        { name: '@mantine/core', version: '9.5.0', license: 'MIT' },
        { name: 'next', version: '16.2.6', license: 'MIT' },
    ],
}));

import VersionStyle, { filterAboutItems } from '../VersionStyle';

/**
 * Designed "about this platform" card: tabs per non-empty group with counts, a
 * filter, licence badges, versions only when the server sets `about.detail`.
 */
type VersionStyleField = ComponentProps<typeof VersionStyle>['style'];

const HEADINGS = {
    title: { content: 'About this platform' },
    label_frameworks: { content: 'Frameworks' },
    label_plugins: { content: 'Plugins' },
    label_libraries: { content: 'Libraries' },
    label_web: { content: 'Website' },
    label_app: { content: 'Mobile app' },
    label_filter: { content: 'Filter' },
    label_no_match: { content: 'Nothing matches the filter.' },
};

const PRODUCT_LINE = 'SelfHelp 0.1.43';

function about(detail: boolean, overrides: Partial<IPlatformAbout> = {}): IPlatformAbout {
    const v = (version: string): string | null => (detail ? version : null);

    return {
        detail,
        product: { name: 'SelfHelp', version: '0.1.43' },
        frameworks: [
            { name: 'PHP', version: v('8.4.2'), license: 'PHP-3.01' },
            { name: 'Symfony', version: v('7.4.1'), license: 'MIT' },
        ],
        plugins: [{ name: 'sh-shp-llm', version: v('1.2.3'), license: null }],
        libraries: [{ name: 'doctrine/orm', version: v('3.3.1'), license: 'MIT' }],
        ...overrides,
    };
}

const makeStyle = (overrides: Record<string, unknown>): VersionStyleField =>
    ({ id: 1, style_name: 'version', ...HEADINGS, ...overrides }) as unknown as VersionStyleField;

describe('filterAboutItems', () => {
    it('matches name and licence case-insensitively', () => {
        const items = [
            { name: 'PHP', version: null, license: 'PHP-3.01' },
            { name: 'Symfony', version: null, license: 'MIT' },
        ];
        expect(filterAboutItems(items, 'php').map((item) => item.name)).toEqual(['PHP']);
        expect(filterAboutItems(items, 'mit').map((item) => item.name)).toEqual(['Symfony']);
        expect(filterAboutItems(items, '  ').map((item) => item.name)).toEqual(['PHP', 'Symfony']);
    });
});

describe('VersionStyle', () => {
    it('shows tabs with counts for non-empty groups and no version but the product when detail is false', () => {
        const { container } = renderWithProviders(
            <VersionStyle style={makeStyle({ about: about(false) })} cssClass="" />,
        );

        expect(screen.getByRole('tab', { name: 'Frameworks (2)' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Plugins (1)' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Libraries (1)' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Website (2)' })).toBeInTheDocument();
        expect(screen.getByText(PRODUCT_LINE)).toBeInTheDocument();

        const text = container.textContent ?? '';
        for (const version of ['8.4.2', '7.4.1', '1.2.3', '3.3.1', '9.5.0', '16.2.6']) {
            expect(text).not.toContain(version);
        }
        expect(text.replace(PRODUCT_LINE, '')).not.toMatch(/\d+\.\d+\.\d+/);
        expect(text).toContain('MIT');
        expect(screen.queryByText('Mobile app')).not.toBeInTheDocument();
    });

    it('shows exact versions when detail is true', async () => {
        const user = userEvent.setup();
        renderWithProviders(<VersionStyle style={makeStyle({ about: about(true) })} cssClass="" />);

        expect(within(screen.getByText('PHP').closest('tr') as HTMLElement).getByText('8.4.2')).toBeInTheDocument();
        await user.click(screen.getByRole('tab', { name: 'Website (2)' }));
        expect(within(screen.getByText('next').closest('tr') as HTMLElement).getByText('16.2.6')).toBeInTheDocument();
    });

    it('filters the active tab and shows label_no_match when nothing matches', async () => {
        const user = userEvent.setup();
        renderWithProviders(<VersionStyle style={makeStyle({ about: about(false) })} cssClass="" />);

        const filter = screen.getByRole('textbox', { name: 'Filter' });
        await user.type(filter, 'symfony');
        expect(screen.getByText('Symfony')).toBeInTheDocument();
        expect(screen.queryByText('PHP')).not.toBeInTheDocument();

        await user.clear(filter);
        await user.type(filter, 'zzzz-no-match');
        expect(screen.getByText('Nothing matches the filter.')).toBeInTheDocument();
    });

    it('draws the title and product badge from the server block', () => {
        renderWithProviders(<VersionStyle style={makeStyle({ about: about(false) })} cssClass="" />);

        expect(screen.getByRole('heading', { level: 2, name: 'About this platform' })).toBeInTheDocument();
        expect(screen.getByText(PRODUCT_LINE)).toBeInTheDocument();
    });

    it('skips a tab for an empty group', () => {
        renderWithProviders(<VersionStyle style={makeStyle({ about: about(false, { plugins: [] }) })} cssClass="" />);

        expect(screen.queryByRole('tab', { name: /Plugins/ })).not.toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Frameworks (2)' })).toBeInTheDocument();
    });

    it('draws nothing without a heading when the field is empty, and nothing without about', () => {
        const { rerender } = renderWithProviders(
            <VersionStyle
                style={makeStyle({
                    about: about(false),
                    title: { content: '' },
                    label_frameworks: { content: '' },
                    label_filter: { content: '' },
                })}
                cssClass=""
            />,
        );
        expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
        expect(screen.getByRole('tab', { name: '(2)' })).toBeInTheDocument();

        rerender(<VersionStyle style={makeStyle({ about: undefined })} cssClass="" />);
        expect(screen.queryByText(PRODUCT_LINE)).not.toBeInTheDocument();
    });

    it('uses no hard-coded colours in the source', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const { fileURLToPath } = await import('node:url');
        const here = path.dirname(fileURLToPath(import.meta.url));
        const source = fs.readFileSync(path.join(here, '../VersionStyle.tsx'), 'utf8');
        expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
        expect(source).not.toMatch(/rgb\(/);
    });
});
