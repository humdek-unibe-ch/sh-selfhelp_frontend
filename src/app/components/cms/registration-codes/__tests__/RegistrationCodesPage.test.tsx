/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import type { IRegistrationCode } from '../../../../../types/responses/admin/registration-codes.types';

/**
 * The admin registration-code page must respect the backend permission model in
 * the UI itself (Testing Rule 26 spirit: don't rely only on backend rejection):
 *  - "Generate Codes" renders only with admin.registration_code.create.
 *  - "Export CSV" renders only for users who can read the list.
 *  - consumed codes surface the linked registered user returned by the backend.
 */
const state = vi.hoisted(() => ({
    canRead: true,
    canCreate: true,
    codes: [] as IRegistrationCode[],
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@mantine/notifications', () => ({
    notifications: { show: vi.fn() },
}));
vi.mock('../../../../../hooks/useAuth', () => ({
    useAuth: () => ({ isLoading: false }),
}));
vi.mock('../../../../../hooks/usePermissionChecks', () => ({
    useCanReadRegistrationCodes: () => state.canRead,
    useCanCreateRegistrationCodes: () => state.canCreate,
}));
vi.mock('../../../../../hooks/useGroups', () => ({
    useGroups: () => ({ data: { groups: [{ id: 1, name: 'QA Group' }] } }),
}));
vi.mock('../../../../../hooks/useRegistrationCodes', () => ({
    useRegistrationCodes: () => ({
        data: {
            codes: state.codes,
            pagination: { page: 1, pageSize: 20, totalCount: state.codes.length, totalPages: 1 },
            config: { generate_min: 1, generate_max: 500 },
        },
        isFetching: false,
        error: null,
        refetch: vi.fn(),
    }),
    useExportRegistrationCodes: () => ({ mutate: vi.fn(), isPending: false }),
    useGenerateRegistrationCodes: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Light shared-layout stubs so the test stays focused on permission gating and
// the linked-user column rather than presentational chrome.
vi.mock('../../../shared/common/PageHeader', () => ({
    PageHeader: ({ title, children }: { title: string; children?: React.ReactNode }) => (
        <div>
            <h2>{title}</h2>
            {children}
        </div>
    ),
}));
vi.mock('../../../shared/common/EmptyState', () => ({
    EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('../../../shared/common/FilterControls', () => ({
    FilterActions: () => <div data-testid="filter-actions" />,
}));

import { RegistrationCodesPage } from '../RegistrationCodesPage';

function consumedCode(overrides: Partial<IRegistrationCode> = {}): IRegistrationCode {
    return {
        id: '1',
        code: 'QAQA1234ABCD',
        id_groups: 1,
        group_name: 'QA Group',
        group_ids: [1],
        group_names: ['QA Group'],
        created_at: '2026-06-01 10:00:00',
        consumed_at: '2026-06-02 12:30:00',
        is_consumed: true,
        id_users: 77,
        user_email: 'qa.user@selfhelp.test',
        ...overrides,
    };
}

describe('RegistrationCodesPage', () => {
    beforeEach(() => {
        state.canRead = true;
        state.canCreate = true;
        state.codes = [consumedCode()];
    });

    it('renders a consumed code with its linked registered user', () => {
        renderWithProviders(<RegistrationCodesPage />);

        expect(screen.getByText('QAQA1234ABCD')).toBeInTheDocument();
        expect(screen.getByText('qa.user@selfhelp.test')).toBeInTheDocument();
        expect(screen.getByText('Registered User')).toBeInTheDocument();
    });

    it('renders one badge per group for a multi-group code', () => {
        // Use group names that are NOT in the mocked group filter options, so
        // each name resolves to exactly one element (the table badge) rather
        // than also matching a filter-dropdown option.
        state.codes = [
            consumedCode({
                code: 'QAMULTI12345',
                group_ids: [2, 3],
                group_names: ['QA Subjects', 'QA Therapists'],
            }),
        ];
        renderWithProviders(<RegistrationCodesPage />);

        expect(screen.getByText('QA Subjects')).toBeInTheDocument();
        expect(screen.getByText('QA Therapists')).toBeInTheDocument();
    });

    it('shows the Generate button when the user can create codes', () => {
        renderWithProviders(<RegistrationCodesPage />);

        expect(screen.getByRole('button', { name: /Generate Codes/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });

    it('hides the Generate button without create permission but keeps Export for readers', () => {
        state.canCreate = false;
        renderWithProviders(<RegistrationCodesPage />);

        expect(screen.queryByRole('button', { name: /Generate Codes/i })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Export CSV/i })).toBeInTheDocument();
    });

    it('renders nothing (no page, no export) without read permission', () => {
        state.canRead = false;
        renderWithProviders(<RegistrationCodesPage />);

        expect(screen.queryByText('Registration Codes')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Export CSV/i })).not.toBeInTheDocument();
    });
});
