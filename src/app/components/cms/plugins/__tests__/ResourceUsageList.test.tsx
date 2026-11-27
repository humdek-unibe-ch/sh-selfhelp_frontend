/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { AdminPluginApi } from '../../../../../api/admin/plugins.api';
import { ResourceUsageList } from '../ResourceUsageList';

describe('ResourceUsageList (P4-A3)', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(AdminPluginApi, 'getResourceUsage').mockResolvedValue({
            pages: [
                {
                    id: 7,
                    keyword: 'intake',
                    title: 'Intake',
                    draft_uses: true,
                    published_uses: true,
                },
            ],
            actions: [{ id: 3, name: 'After intake' }],
            hidden_count: 2,
        });
    });

    it('renders pages, actions, the hidden count and the delete warning', async () => {
        renderWithProviders(<ResourceUsageList type="surveyjs_survey" id={12} warnBeforeDelete />);

        expect(await screen.findByText('Intake')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Intake' })).toHaveAttribute('href', '/admin/pages/intake');
        expect(screen.getByText(/draft, published/)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'After intake' })).toHaveAttribute('href', '/admin/actions');
        expect(screen.getByText('used in 2 more places you cannot see')).toBeInTheDocument();
        expect(screen.getByText('This item is still in use')).toBeInTheDocument();
        await waitFor(() => expect(AdminPluginApi.getResourceUsage).toHaveBeenCalledWith('surveyjs_survey', 12));
    });
});
