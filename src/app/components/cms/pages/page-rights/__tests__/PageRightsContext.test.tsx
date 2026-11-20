/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';
import type { IPageRights } from '../../../../../../types/common/pages.type';

/**
 * The page editor draws what the server says about the open page (`rights`):
 * without the update right it says why it is read-only and disables the fields.
 */
const state = vi.hoisted(() => ({
    rights: undefined as IPageRights | undefined,
    held: new Set<string>(),
}));

vi.mock('../../../../../../hooks/usePageDetails', () => ({
    usePageFields: () => ({ data: state.rights ? { page: {}, fields: [], rights: state.rights } : undefined }),
}));
vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));

import { PageReadOnlyBanner, PageRightsProvider, ReadOnlyFieldset, usePageEditRights } from '../PageRightsContext';

function Editor() {
    const { canUpdate } = usePageEditRights();
    return (
        <>
            <PageReadOnlyBanner />
            <ReadOnlyFieldset readOnly={!canUpdate}>
                <input aria-label="Title" />
            </ReadOnlyFieldset>
        </>
    );
}

const renderEditor = () => renderWithProviders(<PageRightsProvider pageId={94}><Editor /></PageRightsProvider>);
const NONE: IPageRights = { can_update: false, can_delete: false, can_publish: false };

describe('page editor rights', () => {
    beforeEach(() => {
        state.rights = undefined;
        state.held = new Set([PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_PAGE_READ]);
    });

    it('without admin.page.update: read-only banner names the permission and the fields are disabled', () => {
        state.rights = NONE;
        renderEditor();

        expect(screen.getByText('Read only')).toBeInTheDocument();
        expect(screen.getByText(/needs the permission admin\.page\.update/)).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    });

    it('with admin.page.update but no grant on this page: the banner points to the page access', () => {
        state.rights = NONE;
        state.held.add(PERMISSIONS.ADMIN_PAGE_UPDATE);
        renderEditor();

        expect(screen.getByText(/no update grant on this page/)).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    });

    it('with the update right: no banner and the fields can be edited', () => {
        state.rights = { can_update: true, can_delete: false, can_publish: false };
        renderEditor();

        expect(screen.queryByText('Read only')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeEnabled();
    });

    it('before the page is read (or from a backend without rights): no banner, nothing allowed', () => {
        renderEditor();

        expect(screen.queryByText('Read only')).not.toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'Title' })).toBeDisabled();
    });
});
