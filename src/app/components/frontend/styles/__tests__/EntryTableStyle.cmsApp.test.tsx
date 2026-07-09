/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import EntryTableStyle from '../EntryTableStyle';
import { CmsAppAdminNavContext } from '../../../cms/cms-apps/CmsAppAdminNavContext';
import type { IEntryTableStyle } from '../../../../../shared';

vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({
        currentLanguageId: 2,
        languages: [
            { id: 2, locale: 'en-GB', language: 'English', csvSeparator: ',' },
            { id: 3, locale: 'de-CH', language: 'German', csvSeparator: ';' },
        ],
        setCurrentLanguageId: vi.fn(),
    }),
}));

const baseStyle = {
    id: 10,
    style_name: 'entry-table',
    entries: [
        { record_id: 5, id_users: 1, name: 'Ada', bio: 'English bio', _can_edit: true, _can_delete: true },
    ],
    field_labels: { name: 'Name', bio: 'Bio' },
    fields_map: { content: '[{"field_name":"name","field_new_name":"Name"},{"field_name":"bio","field_new_name":"Bio"}]' },
    show_language_preview: { content: '1' },
} as unknown as IEntryTableStyle;

const navValue = {
    appSlug: 'team-members',
    contentBasePath: '/admin/cms-apps/team-members/content',
    formCreatePath: '/admin/cms-apps/team-members/content/form',
    formEditPath: (id: string | number) => `/admin/cms-apps/team-members/content/${id}`,
    isAdminHost: true as const,
    formMode: 'list' as const,
    openCreateForm: vi.fn(),
    openEditForm: vi.fn(),
    closeForm: vi.fn(),
    previewLanguageId: null,
    setPreviewLanguageId: vi.fn(),
};

function renderTable(overrides: Partial<typeof navValue> = {}) {
    const value = { ...navValue, ...overrides };
    return renderWithProviders(
        <CmsAppAdminNavContext.Provider value={value}>
            <EntryTableStyle style={baseStyle} styleProps={{}} cssClass="entry-table-test" />
        </CmsAppAdminNavContext.Provider>,
    );
}

describe('EntryTableStyle CMS app host', () => {
    it('opens edit via onClick without navigation links when cmsAppNav is set', () => {
        const openEditForm = vi.fn();
        renderTable({ openEditForm });

        fireEvent.click(screen.getByRole('button', { name: /edit record 5/i }));

        expect(openEditForm).toHaveBeenCalledWith('5');
        expect(screen.queryByRole('link', { name: /edit record 5/i })).toBeNull();
    });

    it('shows language preview selector when show_language_preview is enabled', () => {
        const setPreviewLanguageId = vi.fn();
        renderTable({ setPreviewLanguageId });

        expect(screen.getAllByLabelText('Content language').length).toBeGreaterThan(0);
    });
});
