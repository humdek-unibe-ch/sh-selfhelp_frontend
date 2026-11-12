/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { UserStatusBadge, UserStatusFilterSelect } from '..';

/** One status vocabulary for the users list, its tiles and the member dialogs. */
describe('user status', () => {
    const pick = (label: string) => {
        // The listbox, once rendered, is labelled "Status" too.
        const input = screen.getAllByLabelText('Status').find((el) => el.tagName === 'INPUT') as HTMLElement;
        fireEvent.click(input);
        const listbox = document.getElementById(input.getAttribute('aria-controls') ?? '') as HTMLElement;
        fireEvent.click(within(listbox).getByRole('option', { name: label, hidden: true }));
    };

    it('filters by a status bucket, and "All" clears the filter', () => {
        const onChange = vi.fn();
        const { rerender } = renderWithProviders(<UserStatusFilterSelect value={undefined} onChange={onChange} />);

        pick('Invited');
        expect(onChange).toHaveBeenLastCalledWith('invited');

        rerender(<UserStatusFilterSelect value="invited" onChange={onChange} />);
        pick('All');
        expect(onChange).toHaveBeenLastCalledWith(undefined);
    });

    it('shows blocked over the status', () => {
        renderWithProviders(<UserStatusBadge status="active" blocked />);
        expect(screen.getByText('Blocked')).toBeInTheDocument();
        expect(screen.queryByText('active')).not.toBeInTheDocument();
    });
});
