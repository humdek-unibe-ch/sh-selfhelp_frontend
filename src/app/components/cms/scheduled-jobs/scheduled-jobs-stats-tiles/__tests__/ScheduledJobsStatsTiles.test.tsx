/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { ScheduledJobsStatsTiles } from '../ScheduledJobsStatsTiles';

const STATS = { total: 200, queued: 30, done: 150, failed: 12, deleted: 8 };

function setup(overrides: Partial<Parameters<typeof ScheduledJobsStatsTiles>[0]> = {}) {
    const { container } = renderWithProviders(
        <ScheduledJobsStatsTiles stats={STATS} isLoading={false} {...overrides} />,
    );
    const outlined = () => container.querySelectorAll('[data-active]').length;
    return { outlined };
}

describe('ScheduledJobsStatsTiles', () => {
    it('shows the count for each status', () => {
        setup();
        expect(screen.getByText('200')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('reports counts rather than offering controls — the Status select filters', () => {
        setup();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('outlines only the applied status', () => {
        const { outlined } = setup({ activeStatus: 'failed' });
        expect(outlined()).toBe(1);
    });

    it('outlines the Total tile when no status filter is applied', () => {
        const { outlined } = setup({ activeStatus: undefined });
        expect(outlined()).toBe(1);
    });

    it('does not show stale zeros while the counts are loading', () => {
        setup({ stats: undefined, isLoading: true });
        expect(screen.queryByText('200')).not.toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    describe('when the counts fail to load', () => {
        it('says so rather than leaving the admin to read a silent zero', () => {
            setup({ stats: undefined, isLoading: false, isError: true });
            expect(screen.getByText(/Could not load the job counts/)).toBeInTheDocument();
        });

        it('shows no count rather than a 0 that reads as "no jobs"', () => {
            setup({ stats: undefined, isLoading: false, isError: true });
            expect(screen.queryByText('0')).not.toBeInTheDocument();
            expect(screen.getAllByText('—')).toHaveLength(5);
        });
    });
});
