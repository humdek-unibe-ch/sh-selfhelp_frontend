/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { PERMISSIONS } from '../../../../../../types/auth/jwt-payload.types';

/**
 * The Languages screen shows only what the caller may do: admin.language.read
 * alone gives a read-only list; admin.language.update (create, update and
 * delete in one right) adds Add Language and the edit and delete icons.
 */
const state = vi.hoisted(() => ({ held: new Set<string>() }));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));
vi.mock('../../../../../../hooks/useLanguages', () => ({
    useAdminLanguages: () => ({
        languages: [{ id: 2, locale: 'de-CH', language: 'Deutsch (Schweiz)', csvSeparator: ',' }],
        isLoading: false,
        error: null,
    }),
}));
vi.mock('../../../../../../hooks/mutations/useLanguageMutations', () => {
    const mutation = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
    return { useCreateLanguageMutation: mutation, useUpdateLanguageMutation: mutation, useDeleteLanguageMutation: mutation };
});
vi.mock('../../language-form-modal/LanguageFormModal', () => ({ LanguageFormModal: () => null }));
vi.mock('../../delete-language-modal/DeleteLanguageModal', () => ({ DeleteLanguageModal: () => null }));

import { LanguagesPage } from '../LanguagesPage';

describe('LanguagesPage rights', () => {
    beforeEach(() => {
        state.held = new Set();
    });

    it('is read-only with admin.language.read alone: no Add, no edit, no delete, no Actions column', () => {
        state.held = new Set([PERMISSIONS.ADMIN_LANGUAGE_READ]);
        renderWithProviders(<LanguagesPage />);

        expect(screen.getByText('Deutsch (Schweiz)')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Add Language/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edit language' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Delete language' })).not.toBeInTheDocument();
        expect(screen.queryByRole('columnheader', { name: 'Actions' })).not.toBeInTheDocument();
    });

    it('shows Add, edit and delete with admin.language.update', () => {
        state.held = new Set([PERMISSIONS.ADMIN_LANGUAGE_READ, PERMISSIONS.ADMIN_LANGUAGE_UPDATE]);
        renderWithProviders(<LanguagesPage />);

        expect(screen.getByRole('button', { name: /Add Language/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Edit language' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Delete language' })).toBeInTheDocument();
    });
});
