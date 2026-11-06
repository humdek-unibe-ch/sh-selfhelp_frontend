/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { createContext, useContext } from 'react';

interface IFieldLabel {
    /** Id of the visible label element, for `aria-labelledby`. */
    id: string;
    /** The label text, for controls that only take a string (e.g. Monaco). */
    text: string;
}

/**
 * The label FieldRenderer shows above a field. Field components read it to
 * name their control for screen readers, since the visible label is a
 * separate element and not a `<label>` tied to the input.
 */
export const FieldLabelContext = createContext<IFieldLabel | null>(null);

export function useFieldLabel(): IFieldLabel | null {
    return useContext(FieldLabelContext);
}
