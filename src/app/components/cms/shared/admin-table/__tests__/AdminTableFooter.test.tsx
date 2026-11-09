/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { AdminTableFooter } from '../AdminTableFooter';

type TFooterProps = Parameters<typeof AdminTableFooter>[0];

function setup(overrides: Partial<TFooterProps> = {}) {
    const onPageChange = vi.fn();
    const props: TFooterProps = {
        totalCount: 248,
        itemLabel: 'users',
        pagination: { page: 1, pageSize: 8, totalPages: 31, onPageChange },
        ...overrides,
    };
    renderWithProviders(<AdminTableFooter {...props} />);
    return { onPageChange };
}

describe('AdminTableFooter', () => {
    it('summarises the visible range out of the total item count', () => {
        setup();
        expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1–8 of 248 users');
    });

    it('summarises the range for a later page', () => {
        setup({ pagination: { page: 3, pageSize: 8, totalPages: 31, onPageChange: vi.fn() } });
        expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 17–24 of 248 users');
    });

    it('clamps the range end to the total on a partial last page', () => {
        setup({ pagination: { page: 31, pageSize: 8, totalPages: 31, onPageChange: vi.fn() } });
        expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 241–248 of 248 users');
    });

    it('reports an empty result set instead of a zero range', () => {
        setup({ totalCount: 0 });
        expect(screen.getByText('No users')).toBeInTheDocument();
        expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });

    it('requests the page the user picks in the pager', async () => {
        const user = userEvent.setup();
        const { onPageChange } = setup();
        await user.click(screen.getByRole('button', { name: '2' }));
        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    describe('without pagination', () => {
        it('summarises the total count alone and renders no pager', () => {
            setup({ totalCount: 12, itemLabel: 'plugins', pagination: undefined });
            expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 12 plugins');
            expect(screen.queryByRole('button', { name: '1' })).not.toBeInTheDocument();
        });

        it('still reports an empty result set', () => {
            setup({ totalCount: 0, itemLabel: 'plugins', pagination: undefined });
            expect(screen.getByText('No plugins')).toBeInTheDocument();
        });
    });
});
