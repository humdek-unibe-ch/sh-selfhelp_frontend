/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IGroupDetails } from '../../../../../../types/responses/admin/groups.types';

/**
 * P5-A3, group part: when the server refuses a page-access change or read with a
 * 403 and its own text (C4), the modal shows exactly that text. A save refusal
 * is shown in a notification and the modal stays open; a read refusal replaces the
 * page list (a list that was not read must not be saved) and Save stays off.
 * The real hooks run; only the API calls are replaced.
 */
const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

const pages = [
    { id_pages: 10, keyword: 'home', id_page_types: 3, is_system: false },
    { id_pages: 20, keyword: 'contact', id_page_types: 3, is_system: false },
];

vi.mock('@mantine/notifications', () => ({ notifications: { show: notify } }));
vi.mock('../../../../../../hooks/useAdminPages', () => ({
    useAdminPages: () => ({ pages, isLoading: false }),
}));

import { AdminGroupApi } from '../../../../../../api/admin/group.api';
import { AdvancedAclModal } from '../AdvancedAclModal';

/** A 403 as the API client raises it: the envelope's `error` carries the reason, `message` the phrase. */
const refusal = (error: string) => ({
    response: {
        status: 403,
        data: { status: 403, message: 'Forbidden', error, logged_in: true, data: null },
    },
});

const group: IGroupDetails = {
    id: 7,
    name: 'qa_group',
    description: null,
    add_to_new_pages: false,
    requires_2fa: false,
    users_count: 0,
    acls: [
        {
            page_id: 10,
            page_keyword: 'home',
            page_title: null,
            page_type: 3,
            is_system: false,
            is_configuration: false,
            acl_select: true,
        },
    ],
};

const SAVE_REFUSALS: Array<[string, string]> = [
    ['a group the caller may not update', 'Access denied: you need update on group 7.'],
    ['a page the caller has no grant on', 'Access denied: you need update on page 20 to change who sees it.'],
];

describe('AdvancedAclModal shows the server text of a refusal (C4)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it.each(SAVE_REFUSALS)('saving page access: %s', async (_case, text) => {
        const onClose = vi.fn();
        vi.spyOn(AdminGroupApi, 'getGroupById').mockResolvedValue(group);
        const update = vi.spyOn(AdminGroupApi, 'updateGroupAcls').mockRejectedValue(refusal(text));
        renderWithProviders(<AdvancedAclModal opened onClose={onClose} groupId={7} groupName="qa_group" />);

        // The page access the group has today arrives first, then the person adds a page.
        await waitFor(() => expect(screen.getByLabelText('Can see home')).toBeChecked());
        fireEvent.click(screen.getByLabelText('Can see contact'));
        fireEvent.click(screen.getByRole('button', { name: 'Save page access' }));

        await waitFor(() => expect(notify).toHaveBeenCalledTimes(1));
        expect(update).toHaveBeenCalledWith(7, { acls: [{ page_id: 10, acl_select: true }, { page_id: 20, acl_select: true }] });
        expect(notify).toHaveBeenCalledWith(expect.objectContaining({ title: 'Error', message: text, color: 'red' }));
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Save page access' })).toBeInTheDocument();
    });

    it('shows the read refusal in place of the page list and keeps Save off', async () => {
        const text = 'Access denied: you cannot read group 7.';
        vi.spyOn(AdminGroupApi, 'getGroupById').mockRejectedValue(refusal(text));
        const update = vi.spyOn(AdminGroupApi, 'updateGroupAcls').mockResolvedValue([]);
        renderWithProviders(<AdvancedAclModal opened onClose={vi.fn()} groupId={7} groupName="qa_group" />);

        expect(await screen.findByText(text)).toBeInTheDocument();
        expect(screen.getByText('Page access could not be loaded')).toBeInTheDocument();
        expect(screen.queryByLabelText('Can see home')).not.toBeInTheDocument();

        const save = screen.getByRole('button', { name: 'Save page access' });
        expect(save).toBeDisabled();
        fireEvent.click(save);
        expect(update).not.toHaveBeenCalled();
    });

    it('says so in its own words when the server gives no reason', async () => {
        vi.spyOn(AdminGroupApi, 'getGroupById').mockRejectedValue(new Error('Network Error'));
        renderWithProviders(<AdvancedAclModal opened onClose={vi.fn()} groupId={7} groupName="qa_group" />);

        expect(await screen.findByText('The page access of this group could not be loaded.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Save page access' })).toBeDisabled();
    });
});
