/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';

// F239 least-privilege walk: deleting sections belongs to `admin.section.delete`; reading the list does not give it.
const state = vi.hoisted(() => ({ held: new Set<string>() }));

vi.mock('../../../../../../hooks/useSectionUtility', () => ({
    useUnusedSections: () => ({
        data: [
            { id: 31, name: 'orphan-a', idStyles: 1, styleName: 'markdown' },
            { id: 32, name: 'orphan-b', idStyles: 2, styleName: null },
        ],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
    }),
}));

vi.mock('../../../../../../hooks/useUserData', () => ({
    useAuthUser: () => ({ permissionChecker: { hasPermission: (name: string) => state.held.has(name) } }),
}));

vi.mock('../../delete-unused-section-modal/DeleteUnusedSectionModal', () => ({
    DeleteUnusedSectionModal: () => null,
}));
vi.mock('../../delete-all-unused-sections-modal/DeleteAllUnusedSectionsModal', () => ({
    DeleteAllUnusedSectionsModal: () => null,
}));

import { UnusedSectionsPage } from '../UnusedSectionsPage';

describe('UnusedSectionsPage delete controls', () => {
    beforeEach(() => {
        state.held = new Set(['admin.access', 'admin.section.read']);
    });

    it('lists the sections but offers no delete to a read-only person', () => {
        renderWithProviders(<UnusedSectionsPage />);
        expect(screen.getByText('orphan-a')).toBeInTheDocument();
        expect(screen.queryByLabelText('Delete section 31')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Delete All/ })).not.toBeInTheDocument();
    });

    it('offers both deletes to the holder of admin.section.delete', () => {
        state.held.add('admin.section.delete');
        renderWithProviders(<UnusedSectionsPage />);
        expect(screen.getByLabelText('Delete section 31')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Delete All \(2\)/ })).toBeInTheDocument();
    });
});
