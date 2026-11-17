/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { act, screen, waitFor, within } from '@testing-library/react';
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

    it('shows dry-run restore preview when Preview restore is clicked', async () => {
        restoreMock.mockResolvedValue({
            dry_run: true,
            restorable: true,
            record_id: 9,
            from_version: 1,
            current_version: 2,
            changes: [
                {
                    field_key: 'title',
                    field_label: 'Title',
                    language_id: 1,
                    action: 'set',
                    kind: 'value',
                    before: 'old',
                    after: 'restored title',
                },
            ],
            blockers: [],
        });

        renderWithProviders(
            <AdminDataHistoryModal
                opened
                onClose={() => undefined}
                tableName="news"
                recordId={9}
                expectedVersion={2}
            />,
        );

        await screen.findByText('v1');
        const v1Row = screen.getByText('v1').closest('[data-version="1"]') as HTMLElement;
        await userEvent.click(within(v1Row).getByRole('button', { name: 'Preview restore' }));

        await waitFor(() => {
            expect(restoreMock).toHaveBeenCalledWith(
                'news',
                9,
                expect.objectContaining({ version: 1, dry_run: true }),
            );
        });

        const panel = await screen.findByTestId('admin-data-restore-preview');
        const changes = within(panel).getByTestId('admin-data-restore-changes');
        expect(changes).toHaveTextContent('Title');
        expect(changes).toHaveTextContent('Before:');
        expect(changes).toHaveTextContent('old');
        expect(changes).toHaveTextContent('After:');
        expect(changes).toHaveTextContent('restored title');
    });

    const titleChange = {
        field_key: 'title',
        field_label: 'Title',
        language_id: 1,
        action: 'set' as const,
        kind: 'value' as const,
        before: 'old',
        after: 'restored title',
    };
    const noteChange = { ...titleChange, field_key: 'note', field_label: 'Note', before: 'b', after: 'a' };
    const noteBlocker = {
        field_key: 'note',
        field_label: 'Note',
        language_id: 1,
        reason: 'field_missing' as const,
        detail: null,
    };

    function preview(changes: unknown[], blockers: unknown[]) {
        return { dry_run: true, restorable: blockers.length === 0, record_id: 9, from_version: 1, current_version: 2, changes, blockers };
    }

    async function openPreview() {
        renderWithProviders(
            <AdminDataHistoryModal opened onClose={() => undefined} tableName="news" recordId={9} expectedVersion={2} />,
        );
        await screen.findByText('v1');
        const v1Row = screen.getByText('v1').closest('[data-version="1"]') as HTMLElement;
        await userEvent.click(within(v1Row).getByRole('button', { name: 'Preview restore' }));
        return screen.findByTestId('admin-data-restore-preview');
    }

    it('offers Restore only after a preview, never in the version rows', async () => {
        restoreMock.mockResolvedValue(preview([titleChange], []));
        renderWithProviders(
            <AdminDataHistoryModal opened onClose={() => undefined} tableName="news" recordId={9} expectedVersion={2} />,
        );
        await screen.findByText('v1');
        expect(screen.queryByRole('button', { name: 'Restore' })).not.toBeInTheDocument();
    });

    it('hides Restore when every change is blocked', async () => {
        restoreMock.mockResolvedValue(preview([noteChange], [noteBlocker]));
        const panel = await openPreview();
        expect(await within(panel).findByTestId('admin-data-restore-blockers')).toHaveTextContent('Note: the field no longer exists');
        expect(within(panel).queryByRole('button', { name: /Restore/ })).not.toBeInTheDocument();
    });

    it('restores only the unblocked fields when some are blocked', async () => {
        restoreMock.mockResolvedValueOnce(preview([titleChange, noteChange], [noteBlocker]));
        restoreMock.mockResolvedValueOnce({ dry_run: false });
        const panel = await openPreview();
        await userEvent.click(await within(panel).findByRole('button', { name: 'Restore only what can be restored' }));
        await waitFor(() => {
            expect(restoreMock).toHaveBeenLastCalledWith('news', 9, {
                version: 1,
                dry_run: false,
                expected_version: 2,
                field_keys: ['title'],
            });
        });
    });

    it('shows the server reason when a restore is refused', async () => {
        restoreMock.mockResolvedValueOnce(preview([titleChange], []));
        restoreMock.mockRejectedValueOnce({ response: { status: 403, data: { error: 'Missing update grant on news' } } });
        const panel = await openPreview();
        await userEvent.click(await within(panel).findByRole('button', { name: 'Restore' }));
        expect(await screen.findByText('Missing update grant on news')).toBeInTheDocument();
    });

    it('keeps the preview of the version clicked last when answers arrive out of order', async () => {
        historyMock.mockResolvedValue({
            current_version: 3,
            total: 3,
            page: 1,
            page_size: 20,
            items: [3, 2, 1].map((version) => ({
                version,
                created_at: '2026-11-14T09:00:00Z',
                operation: 'update',
                source: 'form',
                actor: null,
                impersonated_by: null,
                restored_from_version: null,
                changed_fields: 1,
                is_checkpoint: false,
            })),
        });
        let answerV1: (value: unknown) => void = () => undefined;
        restoreMock.mockImplementationOnce(() => new Promise((resolve) => { answerV1 = resolve; }));
        restoreMock.mockResolvedValueOnce(preview([{ ...titleChange, after: 'from v2' }], []));

        renderWithProviders(
            <AdminDataHistoryModal opened onClose={() => undefined} tableName="news" recordId={9} expectedVersion={3} />,
        );
        await screen.findByText('v1');
        const row = (version: number) => screen.getByText(`v${version}`).closest(`[data-version="${version}"]`) as HTMLElement;
        await userEvent.click(within(row(1)).getByRole('button', { name: 'Preview restore' }));
        await userEvent.click(within(row(2)).getByRole('button', { name: 'Preview restore' }));
        const changes = await screen.findByTestId('admin-data-restore-changes');
        expect(changes).toHaveTextContent('from v2');

        await act(async () => {
            answerV1(preview([{ ...titleChange, after: 'from v1' }], []));
        });
        expect(screen.getByTestId('admin-data-restore-preview')).toHaveTextContent('version 2');
        expect(screen.getByTestId('admin-data-restore-changes')).toHaveTextContent('from v2');
        expect(screen.getByTestId('admin-data-restore-changes')).not.toHaveTextContent('from v1');
    });
});
