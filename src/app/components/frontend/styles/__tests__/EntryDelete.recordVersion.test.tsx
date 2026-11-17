/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * A delete is refused by the server unless it names the version of the record it is based on, and
 * one based on an old version keeps the record (409). The classic delete controls therefore read the
 * version from the page: a row of an entry table carries `_version`, an `entry-record-delete` button
 * carries `record_version` next to `record_id`. Without a version the control offers no delete: it
 * never sends a request the server is certain to refuse, and the version is never drawn as a column.
 */
const { deleteFormMock } = vi.hoisted(() => ({ deleteFormMock: vi.fn() }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));
vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 7 }),
}));
vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({
        currentLanguageId: 2,
        languages: [{ id: 2, locale: 'en-GB', language: 'English', csvSeparator: ',' }],
        setCurrentLanguageId: vi.fn(),
    }),
}));
vi.mock('../../../../../api/frontend/form-submission.api', () => ({
    FormSubmissionApi: { submitForm: vi.fn(), updateForm: vi.fn(), deleteForm: deleteFormMock },
}));

import EntryTableStyle from '../EntryTableStyle';
import EntryRecordDeleteStyle from '../EntryRecordDeleteStyle';

type TTable = ComponentProps<typeof EntryTableStyle>['style'];
type TDelete = ComponentProps<typeof EntryRecordDeleteStyle>['style'];

function table(entries: unknown[]): TTable {
    return {
        id: 40,
        style_name: 'entry-table',
        delete_entry: { content: '1' },
        field_labels: { section_1: 'Name' },
        entries,
    } as unknown as TTable;
}

function deleteButton(fields: Record<string, unknown>): TDelete {
    return { id: 50, style_name: 'entry-record-delete', label_delete: { content: 'Remove' }, ...fields } as unknown as TDelete;
}

beforeEach(() => {
    deleteFormMock.mockReset().mockResolvedValue({ data: { record_id: 5, version: 4 } });
});

describe('an entry table that offers delete', () => {
    const ROW = { record_id: 5, id_users: 3, _can_delete: true, _version: 3, section_1: 'Ada' };

    it('names the version of the row in the delete, and draws no version column', async () => {
        renderWithProviders(<EntryTableStyle style={table([ROW])} styleProps={{}} cssClass="" />);

        expect(screen.queryByText('_version')).not.toBeInTheDocument();
        expect(screen.queryByText('3')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Delete record 5' }));
        const dialog = await screen.findByRole('dialog');
        fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteFormMock).toHaveBeenCalledTimes(1));
        expect(deleteFormMock).toHaveBeenCalledWith({ record_id: 5, page_id: 7, section_id: 40, expected_version: 3 });
    });

    it('acts on the draft when the person looks at the draft', async () => {
        renderWithProviders(<EntryTableStyle style={table([ROW])} styleProps={{}} cssClass="" />, { previewMode: true });

        fireEvent.click(screen.getByRole('button', { name: 'Delete record 5' }));
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteFormMock).toHaveBeenCalledTimes(1));
        expect(deleteFormMock.mock.calls[0]?.[0]).toMatchObject({ expected_version: 3, preview: true });
    });

    it('offers no delete for a row whose version the page did not say', () => {
        renderWithProviders(
            <EntryTableStyle style={table([{ ...ROW, _version: undefined }, { ...ROW, record_id: 6, _version: 'x' }])} styleProps={{}} cssClass="" />,
        );

        expect(screen.queryByRole('button', { name: /Delete record/ })).not.toBeInTheDocument();
    });

    it('offers no delete for a row the person may not delete', () => {
        renderWithProviders(<EntryTableStyle style={table([{ ...ROW, _can_delete: false }])} styleProps={{}} cssClass="" />);

        expect(screen.queryByRole('button', { name: /Delete record/ })).not.toBeInTheDocument();
    });
});

describe('an entry-record-delete button', () => {
    it('names the version of the record it deletes', async () => {
        renderWithProviders(
            <EntryRecordDeleteStyle
                style={deleteButton({ record_id: { content: '5', meta: null }, record_version: { content: '3', meta: null } })}
                cssClass=""
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteFormMock).toHaveBeenCalledTimes(1));
        expect(deleteFormMock).toHaveBeenCalledWith({ record_id: 5, page_id: 7, section_id: 50, expected_version: 3 });
    });

    it('acts on the draft when the person looks at the draft', async () => {
        renderWithProviders(
            <EntryRecordDeleteStyle
                style={deleteButton({ record_id: { content: '5', meta: null }, record_version: { content: '3', meta: null } })}
                cssClass=""
            />,
            { previewMode: true },
        );

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
        fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Delete' }));

        await waitFor(() => expect(deleteFormMock).toHaveBeenCalledTimes(1));
        expect(deleteFormMock.mock.calls[0]?.[0]).toMatchObject({ expected_version: 3, preview: true });
    });

    it('is off when the page named no version, however the record id looks', () => {
        for (const version of [undefined, { content: '', meta: null }, { content: '0', meta: null }, { content: 'abc', meta: null }]) {
            const { unmount } = renderWithProviders(
                <EntryRecordDeleteStyle style={deleteButton({ record_id: { content: '5', meta: null }, record_version: version })} cssClass="" />,
            );
            expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
            unmount();
        }
        expect(deleteFormMock).not.toHaveBeenCalled();
    });
});
