/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { AclManagement, type IAclPage } from '../AdvancedAclModal';
import { convertAclsToApiFormat } from '../../../../../../utils/acl-conversion.utils';

const pages = [
    { id_pages: 10, keyword: 'home', id_page_types: 3, is_system: false },
    { id_pages: 20, keyword: 'contact', id_page_types: 3, is_system: false },
];

vi.mock('../../../../../../hooks/useAdminPages', () => ({
    useAdminPages: () => ({ pages, isLoading: false }),
}));

describe('AclManagement (one-right page access)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows one Can see checkbox per page and no insert/update/delete columns', () => {
        renderWithProviders(
            <AclManagement selectedPages={[]} onChange={vi.fn()} initiallyExpanded showHeader={false} />,
        );

        expect(screen.getByLabelText('Can see home')).toBeInTheDocument();
        expect(screen.getByLabelText('Can see contact')).toBeInTheDocument();
        expect(screen.getByText('Members of this group can see these pages and use their forms.')).toBeInTheDocument();
        expect(screen.queryByLabelText(/^Insert$/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/^Update$/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/^Delete$/i)).not.toBeInTheDocument();
        expect(document.body.textContent).not.toMatch(/acl_(insert|update|delete)/i);
    });

    it('saving selection produces C1 payload only', () => {
        let selected: IAclPage[] = [];
        const onChange = vi.fn((pagesNext: IAclPage[]) => {
            selected = pagesNext;
        });

        renderWithProviders(
            <AclManagement selectedPages={[]} onChange={onChange} initiallyExpanded showHeader={false} />,
        );

        fireEvent.click(screen.getByLabelText('Can see home'));
        expect(onChange).toHaveBeenCalled();
        const payload = convertAclsToApiFormat(selected);
        expect(payload).toEqual([{ page_id: 10, acl_select: true }]);
        expect(JSON.stringify(payload)).not.toMatch(/acl_(insert|update|delete)/);
    });
});
