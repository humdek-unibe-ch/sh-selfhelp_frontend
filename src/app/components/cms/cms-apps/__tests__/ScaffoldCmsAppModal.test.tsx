/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { fireEvent, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';
import { ScaffoldCmsAppModal } from '../ScaffoldCmsAppModal';

const mutate = vi.fn();
const languagesMock = vi.fn(() => ({
    languages: [] as Array<{ id: number; language: string; locale: string }>,
    isLoading: false,
}));

vi.mock('../../../../../hooks/useData', () => ({
    useDataTables: () => ({ data: { dataTables: [] }, isLoading: false }),
}));

vi.mock('../../../../../hooks/useGroups', () => ({
    useAllGroups: () => ({ data: { groups: [] } }),
}));

vi.mock('../../../../../hooks/useCmsApps', () => ({
    useScaffoldCmsAppMutation: () => ({ mutate, reset: vi.fn(), isPending: false }),
}));

vi.mock('../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => languagesMock(),
}));

function renderModal() {
    return renderWithProviders(
        <ScaffoldCmsAppModal opened onClose={vi.fn()} appId={7} defaultBaseName="team" />,
    );
}

async function waitForTitleDefault() {
    await waitFor(() => {
        expect(screen.getByDisplayValue('title')).toBeInTheDocument();
    });
}

async function chooseFieldStyle(index: number, optionLabel: string | RegExp) {
    const combobox = screen.getByRole('combobox', { name: `Field ${index + 1} type` });
    if (combobox.getAttribute('aria-expanded') === 'true') {
        fireEvent.keyDown(combobox, { key: 'Escape' });
    }
    await userEvent.click(combobox);
    await waitFor(() => {
        expect(combobox).toHaveAttribute('aria-expanded', 'true');
        expect(combobox.getAttribute('aria-controls')).toBeTruthy();
    });
    const listId = combobox.getAttribute('aria-controls');
    const listbox = listId ? document.getElementById(listId) : null;
    expect(listbox).toBeTruthy();
    const option = within(listbox as HTMLElement).getByRole('option', {
        name: optionLabel,
        hidden: true,
    });
    fireEvent.click(option);
}

describe('ScaffoldCmsAppModal', () => {
    beforeEach(() => {
        // jsdom has no layout, so it lacks scrollIntoView, which Mantine's option lists call from a timer.
        Element.prototype.scrollIntoView = vi.fn();
        mutate.mockReset();
        languagesMock.mockReturnValue({ languages: [], isLoading: false });
    });

    it('previews one CMS list and a public list with its detail page', async () => {
        renderModal();
        await waitForTitleDefault();

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
        await waitForTitleDefault();

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
        expect(mutate.mock.calls[0]?.[0].form_fields[0].translatable).toBeUndefined();
    });

    it('sends translatable: true only for marked text and text area rows (P3-A1)', async () => {
        languagesMock.mockReturnValue({
            languages: [
                { id: 1, language: 'German', locale: 'de' },
                { id: 2, language: 'English', locale: 'en' },
            ],
            isLoading: false,
        });
        renderModal();
        await waitForTitleDefault();

        await userEvent.click(screen.getByRole('button', { name: 'Add field' }));
        const nameInputs = screen.getAllByPlaceholderText('field_name');
        await userEvent.clear(nameInputs[1]!);
        await userEvent.type(nameInputs[1]!, 'summary');
        await chooseFieldStyle(1, /Text area/i);
        const translatableSwitches = screen.getAllByRole('switch', { name: 'Translatable' });
        expect(translatableSwitches[1]).toBeEnabled();
        if (!translatableSwitches[1]!.matches('[data-checked="true"]')) {
            fireEvent.click(translatableSwitches[1]!);
        }
        await waitFor(() => expect(translatableSwitches[1]).toBeChecked());

        await userEvent.click(screen.getByRole('button', { name: 'Add field' }));
        const nameInputs2 = screen.getAllByPlaceholderText('field_name');
        await userEvent.clear(nameInputs2[2]!);
        await userEvent.type(nameInputs2[2]!, 'category');
        await chooseFieldStyle(2, /^Select$/i);

        await userEvent.click(screen.getByRole('button', { name: 'Generate pages' }));

        expect(mutate).toHaveBeenCalledTimes(1);
        const fields = mutate.mock.calls[0]?.[0].form_fields as Array<{
            name: string;
            style: string;
            translatable?: boolean;
        }>;
        expect(fields).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: 'title', style: 'text-input', translatable: true }),
                expect.objectContaining({ name: 'summary', style: 'textarea', translatable: true }),
                expect.objectContaining({ name: 'category', style: 'select' }),
            ]),
        );
        expect(fields.find((field) => field.name === 'category')?.translatable).toBeUndefined();
    });

    it('disables the translatable toggle for non-text types and clears it on type change (P3-A2)', async () => {
        languagesMock.mockReturnValue({
            languages: [
                { id: 1, language: 'German', locale: 'de' },
                { id: 2, language: 'English', locale: 'en' },
            ],
            isLoading: false,
        });
        renderModal();
        await waitForTitleDefault();

        const titleToggle = screen.getByRole('switch', { name: 'Translatable' });
        expect(titleToggle).toBeChecked();
        expect(titleToggle).toBeEnabled();

        await userEvent.click(screen.getByRole('button', { name: 'Add field' }));
        const nameInputs = screen.getAllByPlaceholderText('field_name');
        await userEvent.clear(nameInputs[1]!);
        await userEvent.type(nameInputs[1]!, 'category');
        await chooseFieldStyle(1, /^Select$/i);

        const toggles = screen.getAllByRole('switch', { name: 'Translatable' });
        expect(toggles[1]).toBeDisabled();
        expect(toggles[1]).not.toBeChecked();

        await chooseFieldStyle(0, /^Select$/i);
        const after = screen.getAllByRole('switch', { name: 'Translatable' });
        expect(after[0]).toBeDisabled();
        expect(after[0]).not.toBeChecked();

        await userEvent.click(screen.getByRole('button', { name: 'Generate pages' }));
        expect(mutate).toHaveBeenCalledTimes(1);
        const fields = mutate.mock.calls[0]?.[0].form_fields as Array<{ translatable?: boolean }>;
        expect(fields.every((field) => field.translatable === undefined)).toBe(true);
    });

    it('shows an info icon per type and Needs setup on Select, Radio, Image and Files (P3-A3)', async () => {
        renderModal();
        await waitForTitleDefault();

        expect(screen.getByRole('button', { name: 'About the Text field' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'About translatable fields' })).toBeInTheDocument();
        expect(screen.queryByTestId('needs-setup-badge')).not.toBeInTheDocument();

        await chooseFieldStyle(0, /^Select$/i);
        expect(screen.getByRole('button', { name: 'About the Select field' })).toBeInTheDocument();
        expect(screen.getByTestId('needs-setup-badge')).toHaveTextContent('Needs setup');

        await chooseFieldStyle(0, /^Radio$/i);
        expect(screen.getByRole('button', { name: 'About the Radio field' })).toBeInTheDocument();

        await chooseFieldStyle(0, /^Image$/i);
        expect(screen.getByRole('button', { name: 'About the Image field' })).toBeInTheDocument();

        await chooseFieldStyle(0, /Files/);
        expect(screen.getByRole('button', { name: /About the Files/ })).toBeInTheDocument();
        expect(screen.getByTestId('needs-setup-badge')).toHaveTextContent('Needs setup');
    });

    it('marks title translatable by default with two content languages and not with one (P3-A4)', async () => {
        languagesMock.mockReturnValue({
            languages: [{ id: 1, language: 'English', locale: 'en' }],
            isLoading: false,
        });
        const { unmount } = renderModal();
        await waitForTitleDefault();
        expect(screen.getByRole('switch', { name: 'Translatable' })).not.toBeChecked();
        unmount();

        languagesMock.mockReturnValue({
            languages: [
                { id: 1, language: 'German', locale: 'de' },
                { id: 2, language: 'English', locale: 'en' },
            ],
            isLoading: false,
        });
        renderModal();
        await waitForTitleDefault();
        expect(screen.getByRole('switch', { name: 'Translatable' })).toBeChecked();
    });

    it('refuses a new form without the CMS list that holds it', async () => {
        renderModal();
        await waitForTitleDefault();

        await userEvent.click(screen.getByRole('switch', { name: 'Create the CMS list (manage records)' }));

        expect(screen.getByText(/A new form lives inside the CMS list/)).toBeInTheDocument();
        const generate = screen.getByRole('button', { name: 'Generate pages' });
        expect(generate).toBeDisabled();
        await userEvent.click(generate);
        expect(mutate).not.toHaveBeenCalled();
    });

    it('refuses to generate nothing', async () => {
        renderModal();
        await waitForTitleDefault();

        await userEvent.click(screen.getByRole('switch', { name: /^Create a new form \+ data table/ }));
        await userEvent.click(screen.getByRole('switch', { name: 'Create the CMS list (manage records)' }));
        await userEvent.click(screen.getByRole('switch', { name: 'Create the public list and detail pages' }));

        expect(screen.getByText(/Select at least one of the public pages/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Generate pages' })).toBeDisabled();
    });
});
