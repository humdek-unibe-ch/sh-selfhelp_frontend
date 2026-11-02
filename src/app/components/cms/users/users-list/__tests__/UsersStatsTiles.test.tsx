/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { UsersStatsTiles } from '../UsersStatsTiles';

const STATS = { total: 248, active: 214, invited: 26, blocked: 8 };

function setup(overrides: Partial<Parameters<typeof UsersStatsTiles>[0]> = {}) {
    const { container } = renderWithProviders(
        <UsersStatsTiles stats={STATS} isLoading={false} activeStatus="all" {...overrides} />,
    );
    const outlined = () => container.querySelectorAll('[data-active]').length;
    return { outlined };
}

describe('UsersStatsTiles', () => {
    it('shows the count for each status', () => {
        setup();
        expect(screen.getByText('248')).toBeInTheDocument();
        expect(screen.getByText('214')).toBeInTheDocument();
        expect(screen.getByText('26')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('reports counts rather than offering controls — the Status select filters', () => {
        setup();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('outlines only the applied status', () => {
        const { outlined } = setup({ activeStatus: 'invited' });
        expect(outlined()).toBe(1);
    });

    it('outlines the Total tile when no status filter is applied', () => {
        const { outlined } = setup({ activeStatus: 'all' });
        expect(outlined()).toBe(1);
    });

    it('does not show stale zeros while the counts are loading', () => {
        setup({ stats: undefined, isLoading: true });
        expect(screen.queryByText('248')).not.toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    describe('when the counts fail to load', () => {
        it('says so rather than leaving the admin to read a silent zero', () => {
            setup({ stats: undefined, isLoading: false, isError: true });
            expect(screen.getByText(/Could not load the user counts/)).toBeInTheDocument();
        });

        it('shows no count rather than a 0 that reads as "no users"', () => {
            setup({ stats: undefined, isLoading: false, isError: true });
            expect(screen.queryByText('0')).not.toBeInTheDocument();
            expect(screen.getAllByText('—')).toHaveLength(4);
        });
    });
});
