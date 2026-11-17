/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { AdminDataHistoryModal } from '../AdminDataHistoryModal';

const historyMock = vi.fn();
const restoreMock = vi.fn();

vi.mock('../../../../../../api/admin/data-history.api', () => ({
    AdminDataHistoryApi: {
        history: (...args: unknown[]) => historyMock(...args),
        version: vi.fn(),
        restore: (...args: unknown[]) => restoreMock(...args),
    },
}));

describe('AdminDataHistoryModal (contract 6)', () => {
    beforeEach(() => {
        historyMock.mockReset();
        restoreMock.mockReset();
        historyMock.mockResolvedValue({
            current_version: 2,
            total: 2,
            page: 1,
            page_size: 20,
            items: [
                {
                    version: 2,
                    created_at: '2026-11-14T10:00:00Z',
                    operation: 'update',
                    source: 'form',
                    actor: null,
                    impersonated_by: null,
                    restored_from_version: null,
                    changed_fields: 1,
                    is_checkpoint: false,
                },
                {
                    version: 1,
                    created_at: '2026-11-14T09:00:00Z',
                    operation: 'create',
                    source: 'form',
                    actor: null,
                    impersonated_by: null,
                    restored_from_version: null,
                    changed_fields: 2,
                    is_checkpoint: false,
                },
            ],
        });
    });

    it('lists revisions for a data-browser record', async () => {
        renderWithProviders(
            <AdminDataHistoryModal
                opened
                onClose={() => undefined}
                tableName="news"
                recordId={9}
                expectedVersion={2}
            />,
        );

        await waitFor(() => expect(historyMock).toHaveBeenCalledWith('news', 9));
        expect(await screen.findByTestId('admin-data-history')).toBeInTheDocument();
        expect(screen.getByText('v2')).toBeInTheDocument();
        expect(screen.getByText('v1')).toBeInTheDocument();
        expect(screen.getByText(/Current version 2/)).toBeInTheDocument();
    });
});
