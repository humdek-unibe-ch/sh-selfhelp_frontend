/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { useState } from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';
import { FormListFieldEditor, isFormListEditorField } from '../form-list/FormListFieldEditor';
import { FormListSourceProvider } from '../form-list/FormListSourceContext';

// jsdom has no layout, so it lacks scrollIntoView, which Mantine's option lists call from a timer.
beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
});

const SOURCE: IFormListSource = {
    data_table: { id: 7, name: '120' },
    form_section_id: 120,
    columns: [
        { field: 'section_121', label: 'title', type: 'text' },
        { field: 'section_122', label: 'seats', type: 'number' },
        { field: 'section_124', label: 'open', type: 'boolean' },
    ],
    row_fields: [
        { field: 'entry_date', label: 'Entry date', type: 'datetime', column: true, sort: true, filter: true },
        { field: 'record_id', label: 'Record number', type: 'number', column: false, sort: true, filter: true },
    ],
};

/** A real, stateful field: the editor works on the text it is given and hands back the new text. */
function Harness({ fieldName, initial, source = SOURCE, onText }: { fieldName: string; initial: string; source?: IFormListSource | null; onText: (text: string) => void }) {
    const [text, setText] = useState(initial);
    return (
        <FormListSourceProvider source={source}>
            <FormListFieldEditor
                fieldName={fieldName}
                value={text}
                onChange={(next) => {
                    setText(next);
                    onText(next);
                }}
            />
        </FormListSourceProvider>
    );
}

function lastJson(onText: ReturnType<typeof vi.fn>): unknown {
    const calls = onText.mock.calls;
    return JSON.parse(String(calls[calls.length - 1]?.[0]));
}

describe('which fields are edited as rows', () => {
    it('is the five JSON fields of the two list styles and nothing else', () => {
        for (const field of ['list_columns', 'list_sort', 'list_controls', 'list_fixed_filter', 'quick_actions']) {
            expect(isFormListEditorField('entry-form-list', field)).toBe(true);
            expect(isFormListEditorField('data-view', field)).toBe(true);
        }
        expect(isFormListEditorField('entry-table', 'list_columns')).toBe(false);
        expect(isFormListEditorField('entry-form-list', 'page_size')).toBe(false);
        expect(isFormListEditorField(undefined, 'list_columns')).toBe(false);
    });
});

describe('the columns editor', () => {
    const COLUMNS = JSON.stringify([
        { field: 'section_121', label: 'Title', sortable: true, searchable: true },
        { field: 'section_122', label: { en: 'Seats', de: 'Plätze' }, format: 'number', custom: 1 },
    ]);

    it('moves a column and writes the new order', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_columns" initial={COLUMNS} onText={onText} />);

        await userEvent.click(screen.getByRole('button', { name: 'Move Column Title down' }));

        const written = lastJson(onText) as Array<{ field: string }>;
        expect(written.map((column) => column.field)).toEqual(['section_122', 'section_121']);
    });

    it('removes a column', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_columns" initial={COLUMNS} onText={onText} />);

        await userEvent.click(screen.getByRole('button', { name: 'Remove Column Title' }));

        expect((lastJson(onText) as unknown[]).length).toBe(1);
    });

    it('changes a flag and keeps what the editor does not know, such as a label translated per language', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_columns" initial={COLUMNS} onText={onText} />);

        const second = screen.getByRole('group', { name: 'Column section_122' });
        await userEvent.click(within(second).getByLabelText('Visitors can sort by it'));

        const written = lastJson(onText) as Array<Record<string, unknown>>;
        expect(written[1]).toEqual({ field: 'section_122', label: { en: 'Seats', de: 'Plätze' }, format: 'number', custom: 1, sortable: true });
    });

    it('turns a flag off by removing the key, so the stored default stays short', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_columns" initial={COLUMNS} onText={onText} />);

        const first = screen.getByRole('group', { name: 'Column Title' });
        await userEvent.click(within(first).getByLabelText('Visitors can sort by it'));

        const written = lastJson(onText) as Array<Record<string, unknown>>;
        expect(written[0]).toEqual({ field: 'section_121', label: 'Title', searchable: true });
    });

    it('edits the header text', () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_columns" initial={COLUMNS} onText={onText} />);

        const first = screen.getByRole('group', { name: 'Column Title' });
        fireEvent.change(within(first).getByLabelText('Header'), { target: { value: 'Name' } });

        expect((lastJson(onText) as Array<{ label: string }>)[0]?.label).toBe('Name');
    });

    it('adds every column the table has that is not shown yet', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_columns" initial="[]" onText={onText} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add all' }));

        const written = lastJson(onText) as Array<Record<string, unknown>>;
        expect(written.map((column) => column.field)).toEqual(['section_121', 'section_122', 'section_124', 'entry_date']);
        expect(written[0]).toEqual({ field: 'section_121', label: 'title', sortable: true });
        expect(written[1]).toMatchObject({ field: 'section_122', format: 'number' });
        expect(written[3]).toMatchObject({ field: 'entry_date', format: 'datetime' });
    });
});

describe('the shell around every editor', () => {
    it('tells the author when the table is not known yet instead of showing empty pickers', () => {
        renderWithProviders(<Harness fieldName="list_columns" initial="[]" source={null} onText={vi.fn()} />);

        expect(screen.getByText(/put the inputs directly inside this list/i)).toBeInTheDocument();
    });

    it('shows a value the rows cannot read as text, with the reason, and never hides it', () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_columns" initial={'{"not":"a list"}'} onText={onText} />);

        expect(screen.getByText(/not in a shape the rows can show/i)).toBeInTheDocument();
        const box = screen.getByRole('textbox');
        expect(box).toHaveValue('{"not":"a list"}');
        fireEvent.change(box, { target: { value: '[]' } });
        expect(onText).toHaveBeenLastCalledWith('[]');
    });

    it('lets the author switch to the JSON text and back', async () => {
        renderWithProviders(<Harness fieldName="list_sort" initial={'[{"field":"entry_date","direction":"desc"}]'} onText={vi.fn()} />);

        await userEvent.click(screen.getByText('JSON'));
        expect(screen.getByRole('textbox')).toHaveValue('[{"field":"entry_date","direction":"desc"}]');
        await userEvent.click(screen.getByText('Rows'));
        expect(screen.getByRole('group', { name: 'Order by Entry date' })).toBeInTheDocument();
    });
});

describe('the order editor', () => {
    it('changes the direction of a field', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_sort" initial={'[{"field":"entry_date","direction":"desc"}]'} onText={onText} />);

        await userEvent.click(screen.getByLabelText('Ascending'));

        expect(lastJson(onText)).toEqual([{ field: 'entry_date', direction: 'asc' }]);
    });

    it('does not offer a person-identifying field in the order and stops at three fields', () => {
        renderWithProviders(
            <Harness
                fieldName="list_sort"
                initial={'[{"field":"entry_date","direction":"asc"},{"field":"record_id","direction":"asc"},{"field":"section_121","direction":"asc"}]'}
                onText={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Add a field to the order' })).toBeDisabled();
        expect(screen.getByText(/at most 3 fields/i)).toBeInTheDocument();
    });
});

describe('the controls editor', () => {
    it('changes the type of a control and drops the settings of the old type', async () => {
        const onText = vi.fn();
        renderWithProviders(
            <Harness
                fieldName="list_controls"
                initial={'[{"id":"who","type":"text","field":"section_121","label":"Who","match":"starts_with"}]'}
                onText={onText}
            />,
        );

        await userEvent.click(screen.getByRole('combobox', { name: 'Type' }));
        // The dropdown is mounted but its transition never ends in jsdom: reach the option by its role regardless.
        fireEvent.click(await screen.findByRole('option', { name: 'Choose one', hidden: true }));

        const written = lastJson(onText) as Array<Record<string, unknown>>;
        expect(written[0]).toEqual({ id: 'who', type: 'select', field: 'section_121', label: 'Who', options_from: 'data' });
    });

    it('warns when a stored control does not fit its field', () => {
        renderWithProviders(
            <Harness fieldName="list_controls" initial={'[{"id":"seats","type":"number_range","field":"section_121","label":"Seats"}]'} onText={vi.fn()} />,
        );

        expect(screen.getByText('This type does not fit the field')).toBeInTheDocument();
    });

    it('adds and removes fixed choices of a select control', async () => {
        const onText = vi.fn();
        renderWithProviders(
            <Harness fieldName="list_controls" initial={'[{"id":"state","type":"select","field":"section_121","label":"State","options_from":"data"}]'} onText={onText} />,
        );

        await userEvent.click(screen.getByRole('button', { name: 'Add a fixed choice' }));
        fireEvent.change(screen.getByLabelText('Choice 1 value'), { target: { value: 'open' } });
        fireEvent.change(screen.getByLabelText('Choice 1 label'), { target: { value: 'Open' } });

        expect(lastJson(onText)).toEqual([
            { id: 'state', type: 'select', field: 'section_121', label: 'State', options_from: 'data', options: [{ value: 'open', label: 'Open' }] },
        ]);

        await userEvent.click(screen.getByRole('button', { name: 'Remove choice 1' }));
        expect((lastJson(onText) as Array<Record<string, unknown>>)[0]).not.toHaveProperty('options');
    });
});

describe('the filter editor', () => {
    it('starts from the seeded empty filter and adds a condition on the first field', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_fixed_filter" initial="" onText={onText} />);

        expect(screen.getByText(/shows every record it may show/i)).toBeInTheDocument();
        await userEvent.click(screen.getByRole('button', { name: 'Condition' }));

        expect(lastJson(onText)).toEqual({ mode: 'and', children: [{ column: 'section_121', operator: 'eq', value: '' }] });
    });

    it('switches between all and any, and nests a group up to the depth the server accepts', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="list_fixed_filter" initial={'{"mode":"and","children":[]}'} onText={onText} />);

        await userEvent.click(screen.getByLabelText('Any of'));
        expect(lastJson(onText)).toEqual({ mode: 'or', children: [] });

        await userEvent.click(screen.getByRole('button', { name: 'Group' }));
        await userEvent.click(within(screen.getByRole('group', { name: 'Fixed filter, group 1' })).getByRole('button', { name: 'Group' }));
        // Levels 1, 2 and 3 exist: a third nested group cannot be added.
        const deepest = screen.getByRole('group', { name: 'Fixed filter, group 1, group 1' });
        expect(within(deepest).queryByRole('button', { name: 'Group' })).not.toBeInTheDocument();
    });

    it('edits the value of a condition and removes it', async () => {
        const onText = vi.fn();
        renderWithProviders(
            <Harness
                fieldName="list_fixed_filter"
                initial={'{"mode":"and","children":[{"column":"section_122","operator":"gt","value":"5"}]}'}
                onText={onText}
            />,
        );

        fireEvent.change(screen.getByLabelText('Fixed filter, condition 1: value'), { target: { value: '9' } });
        expect(lastJson(onText)).toEqual({ mode: 'and', children: [{ column: 'section_122', operator: 'gt', value: '9' }] });

        await userEvent.click(screen.getByRole('button', { name: 'Remove Fixed filter, condition 1' }));
        expect(lastJson(onText)).toEqual({ mode: 'and', children: [] });
    });

    it('does not show a value for an operator that needs none', () => {
        renderWithProviders(
            <Harness
                fieldName="list_fixed_filter"
                initial={'{"mode":"and","children":[{"column":"section_121","operator":"empty"}]}'}
                onText={vi.fn()}
            />,
        );

        expect(screen.queryByLabelText('Fixed filter, condition 1: value')).not.toBeInTheDocument();
    });

    it('stops adding conditions at the limit', () => {
        const children = Array.from({ length: 15 }, (_, index) => ({ column: 'section_121', operator: 'eq', value: String(index) }));
        renderWithProviders(<Harness fieldName="list_fixed_filter" initial={JSON.stringify({ mode: 'and', children })} onText={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Condition' })).toBeDisabled();
        expect(screen.getByText(/at most 15 conditions/i)).toBeInTheDocument();
    });

    it('reads a filter nested deeper than the server accepts as text, not as rows', () => {
        const tooDeep = '{"mode":"and","children":[{"mode":"and","children":[{"mode":"and","children":[{"mode":"and","children":[]}]}]}]}';
        renderWithProviders(<Harness fieldName="list_fixed_filter" initial={tooDeep} onText={vi.fn()} />);

        expect(screen.getByText(/not in a shape the rows can show/i)).toBeInTheDocument();
    });
});

describe('the quick actions editor', () => {
    const ACTIONS = JSON.stringify([
        { id: 'approve', label: 'Approve', confirm: 'Approve this entry?', set: { section_121: 'approved' } },
    ]);

    it('adds a condition under which the action is offered, and removes it again', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="quick_actions" initial={ACTIONS} onText={onText} />);

        await userEvent.click(screen.getByLabelText('Offer it only for records that match'));
        expect(lastJson(onText)).toEqual([
            { id: 'approve', label: 'Approve', confirm: 'Approve this entry?', set: { section_121: 'approved' }, when: { mode: 'and', children: [] } },
        ]);

        await userEvent.click(screen.getByLabelText('Offer it only for records that match'));
        expect(lastJson(onText)).toEqual(JSON.parse(ACTIONS));
    });

    it('never offers a row field to assign and keeps the last assignment', () => {
        renderWithProviders(<Harness fieldName="quick_actions" initial={ACTIONS} onText={vi.fn()} />);

        expect(screen.getByRole('button', { name: 'Action Approve: remove assignment 1' })).toBeDisabled();
    });

    it('sets another field with a value fitting its type', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="quick_actions" initial={ACTIONS} onText={onText} />);

        await userEvent.click(screen.getByRole('button', { name: 'Set another field' }));

        expect(lastJson(onText)).toEqual([
            { id: 'approve', label: 'Approve', confirm: 'Approve this entry?', set: { section_121: 'approved', section_122: '' } },
        ]);
    });

    it('adds an action with a fresh id', async () => {
        const onText = vi.fn();
        renderWithProviders(<Harness fieldName="quick_actions" initial={ACTIONS} onText={onText} />);

        await userEvent.click(screen.getByRole('button', { name: 'Add a quick action' }));

        const written = lastJson(onText) as Array<{ id: string }>;
        expect(written.map((action) => action.id)).toEqual(['approve', 'action']);
    });
});
