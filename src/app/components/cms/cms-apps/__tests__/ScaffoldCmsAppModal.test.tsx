/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { ScaffoldCmsAppModal } from '../ScaffoldCmsAppModal';

const mutate = vi.fn();

vi.mock('../../../../../hooks/useData', () => ({
    useDataTables: () => ({ data: { dataTables: [] }, isLoading: false }),
}));

vi.mock('../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({ data: { groups: [] } }),
}));

vi.mock('../../../../../hooks/useCmsApps', () => ({
    useScaffoldCmsAppMutation: () => ({ mutate, reset: vi.fn(), isPending: false }),
}));

function renderModal() {
    return renderWithProviders(<ScaffoldCmsAppModal opened onClose={vi.fn()} appId={7} defaultBaseName="team" />);
}

describe('ScaffoldCmsAppModal', () => {
    beforeEach(() => {
        mutate.mockReset();
    });

    it('previews one CMS list and a public list with its detail page', () => {
        renderModal();

        const table = screen.getByRole('table');
        expect(within(table).getByText('cms_list')).toBeInTheDocument();
        expect(within(table).getByText('/cms/team')).toBeInTheDocument();
        expect(within(table).getByText('public_list')).toBeInTheDocument();
        expect(within(table).getByText('/team')).toBeInTheDocument();
        expect(within(table).getByText('public_detail')).toBeInTheDocument();
        expect(within(table).getByText('/team/{record_id}')).toBeInTheDocument();
        expect(within(table).queryByText('form')).not.toBeInTheDocument();
        expect(within(table).queryByText('cms_detail')).not.toBeInTheDocument();
    });

    it('sends the choices to the scaffold endpoint', async () => {
        renderModal();

        await userEvent.click(screen.getByRole('button', { name: 'Generate pages' }));

        expect(mutate).toHaveBeenCalledTimes(1);
        expect(mutate.mock.calls[0]?.[0]).toMatchObject({
            base_name: 'team',
            create_form: true,
            create_public: true,
            create_admin: true,
            record_id_param: 'record_id',
            form_fields: [{ name: 'title', style: 'text-input' }],
        });
    });

    it('refuses a new form without the CMS list that holds it', async () => {
        renderModal();

        await userEvent.click(screen.getByRole('switch', { name: 'Create the CMS list (manage records)' }));

        expect(screen.getByText(/A new form lives inside the CMS list/)).toBeInTheDocument();
        const generate = screen.getByRole('button', { name: 'Generate pages' });
        expect(generate).toBeDisabled();
        await userEvent.click(generate);
        expect(mutate).not.toHaveBeenCalled();
    });

    it('refuses to generate nothing', async () => {
        renderModal();

        await userEvent.click(screen.getByRole('switch', { name: /^Create a new form \+ data table/ }));
        await userEvent.click(screen.getByRole('switch', { name: 'Create the CMS list (manage records)' }));
        await userEvent.click(screen.getByRole('switch', { name: 'Create the public list and detail pages' }));

        expect(screen.getByText(/Select at least one of the public pages/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Generate pages' })).toBeDisabled();
    });
});
