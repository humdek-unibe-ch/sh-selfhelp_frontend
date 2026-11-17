/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ListColumnsEditor } from './ListColumnsEditor';
import { ListControlsEditor } from './ListControlsEditor';
import { ListFixedFilterEditor } from './FormListFilterEditor';
import { ListQuickActionsEditor } from './ListQuickActionsEditor';
import { ListSortEditor } from './ListSortEditor';

/** The styles whose JSON fields are edited as rows. */
const FORM_LIST_STYLE_NAMES: ReadonlySet<string> = new Set(['entry-form-list', 'data-view']);

/** The section fields of a list that hold JSON the author edits as rows. */
export const FORM_LIST_EDITOR_FIELDS: ReadonlySet<string> = new Set([
    'list_columns',
    'list_sort',
    'list_controls',
    'list_fixed_filter',
    'quick_actions',
]);

/** Whether a field of a section is one of the JSON fields of an entry list or a data view. */
export function isFormListEditorField(styleName: string | undefined, fieldName: string): boolean {
    return styleName !== undefined && FORM_LIST_STYLE_NAMES.has(styleName) && FORM_LIST_EDITOR_FIELDS.has(fieldName);
}

interface IFormListFieldEditorProps {
    fieldName: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

/**
 * The editor of one JSON field of an entry list or data view: rows instead of
 * JSON, with the fields of the list's table offered by name.
 */
export function FormListFieldEditor({ fieldName, value, onChange, disabled = false }: IFormListFieldEditorProps) {
    switch (fieldName) {
        case 'list_columns':
            return <ListColumnsEditor value={value} onChange={onChange} disabled={disabled} />;
        case 'list_sort':
            return <ListSortEditor value={value} onChange={onChange} disabled={disabled} />;
        case 'list_controls':
            return <ListControlsEditor value={value} onChange={onChange} disabled={disabled} />;
        case 'list_fixed_filter':
            return <ListFixedFilterEditor value={value} onChange={onChange} disabled={disabled} />;
        case 'quick_actions':
            return <ListQuickActionsEditor value={value} onChange={onChange} disabled={disabled} />;
        default:
            return null;
    }
}
