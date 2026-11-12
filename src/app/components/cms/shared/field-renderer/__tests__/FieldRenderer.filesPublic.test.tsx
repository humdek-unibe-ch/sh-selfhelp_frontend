/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { FieldRenderer } from '../FieldRenderer';

vi.mock('../../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({ languages: [], isLoading: false }),
}));
vi.mock('../../../../../../hooks/useLookups', () => ({
    useLookupsByType: () => [],
}));

/**
 * `files_public` is the switch on a `file-input` field that makes every file
 * uploaded through it readable by anyone (the backend serves it without a login
 * when the stored value is exactly `'1'`). Everything else stays private: only
 * the uploader and users who can read the form's data may open the files.
 *
 * Because one click changes who can read every uploaded file, the editor must
 * show the CURRENT state: private unless the stored value says it is on, and
 * private by default. It reads '1', 'true' and 'on' as on (the rule of every
 * checkbox field) and reports a boolean on a click, which the backend writes as
 * '1' or '0', so a value set in this editor is always one the backend serves as
 * shown. The field is declared exactly as the backend seeds it (migration
 * Version20261028100251): a checkbox property field with default '0'.
 */
const FILES_PUBLIC = {
    id: 777,
    name: 'files_public',
    title: 'Files Public',
    type: 'checkbox',
    default_value: '0',
    help: 'Make files uploaded through this field readable by anyone. Off: only the uploader and users who can read the form data can open them.',
    display: false,
    translations: [] as Array<{ language_id: number; content: string | null }>,
};

function stored(content: string | null) {
    return { ...FILES_PUBLIC, translations: [{ language_id: 1, content }] };
}

describe('FieldRenderer: files_public on a file-input', () => {
    it('is a checkbox named by its title, not a text box', () => {
        renderWithProviders(<FieldRenderer field={FILES_PUBLIC} onChange={() => {}} />);

        expect(screen.getByRole('checkbox', { name: /Files Public/ })).toBeInTheDocument();
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it.each([
        ['nothing stored yet (the default is private)', FILES_PUBLIC],
        ["stored as '0'", stored('0')],
        ['stored empty', stored('')],
        ["stored as 'false' or any other value", stored('false')],
    ])('is off when %s', (_label, field) => {
        renderWithProviders(<FieldRenderer field={field} onChange={() => {}} />);

        expect(screen.getByRole('checkbox', { name: /Files Public/ })).not.toBeChecked();
    });

    it("is on when stored as '1' (the value the backend serves publicly)", () => {
        renderWithProviders(<FieldRenderer field={stored('1')} onChange={() => {}} />);

        expect(screen.getByRole('checkbox', { name: /Files Public/ })).toBeChecked();
    });

    it('follows the value of the form state over the stored one', () => {
        renderWithProviders(<FieldRenderer field={stored('1')} value={false} onChange={() => {}} />);

        expect(screen.getByRole('checkbox', { name: /Files Public/ })).not.toBeChecked();
    });

    it('reports a boolean when toggled, which the backend stores as 1 or 0', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderWithProviders(<FieldRenderer field={stored('0')} onChange={onChange} />);

        await user.click(screen.getByRole('checkbox', { name: /Files Public/ }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('cannot be switched while the editor is disabled', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        renderWithProviders(<FieldRenderer field={stored('0')} onChange={onChange} disabled />);

        const checkbox = screen.getByRole('checkbox', { name: /Files Public/ });
        await user.click(checkbox);

        expect(checkbox).toBeDisabled();
        expect(onChange).not.toHaveBeenCalled();
    });
});
