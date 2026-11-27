/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import type { TCmsAppFormFieldStyle } from '../../../../types/requests/admin/cms-app.types';

/** Styles that may carry `translatable: true` on the scaffold contract. */
export const TRANSLATABLE_FORM_FIELD_STYLES: ReadonlySet<TCmsAppFormFieldStyle> = new Set([
    'text-input',
    'textarea',
]);

/** Styles that need options, accepted types or limits after generating. */
export const NEEDS_SETUP_FORM_FIELD_STYLES: ReadonlySet<TCmsAppFormFieldStyle> = new Set([
    'select',
    'radio',
    'image',
    'files',
]);

export const FORM_FIELD_STYLE_HELP: Record<
    Exclude<TCmsAppFormFieldStyle, 'file-input'>,
    string
> = {
    'text-input': 'One line of text — titles, names and short answers.',
    textarea: 'Several lines of plain text.',
    select: 'One choice from a list. You add the options after generating.',
    checkbox: 'A yes/no choice.',
    radio: 'One choice shown as buttons. You add the options after generating.',
    'number-input': 'A numeric value.',
    image: 'One picture per record (jpg, png, webp or gif). Size limits can be set after generating.',
    files: 'Downloads — several files per record. Accepted types can be set after generating.',
};

export function isTranslatableFormFieldStyle(style: TCmsAppFormFieldStyle): boolean {
    return TRANSLATABLE_FORM_FIELD_STYLES.has(style);
}

export function formFieldNeedsSetup(style: TCmsAppFormFieldStyle): boolean {
    return NEEDS_SETUP_FORM_FIELD_STYLES.has(style);
}

export function styleHelpText(style: TCmsAppFormFieldStyle): string {
    if (style === 'file-input') {
        return FORM_FIELD_STYLE_HELP.files;
    }
    return FORM_FIELD_STYLE_HELP[style];
}
