/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { IFormListSource } from '../../../../../../types/responses/admin/admin.types';

const FormListSourceContext = createContext<IFormListSource | null>(null);

/**
 * Gives the editors of an entry list the fields of its table.
 *
 * The section inspector loads the section details (they carry `list_source`) and
 * wraps its field panels in this provider; the editors read it where they sit,
 * so the answer is not threaded through every panel in between.
 */
export function FormListSourceProvider({ source, children }: { source: IFormListSource | null; children: ReactNode }) {
    return <FormListSourceContext.Provider value={source}>{children}</FormListSourceContext.Provider>;
}

/** The fields of the table the list reads, or null when it has none yet. */
export function useFormListSource(): IFormListSource | null {
    return useContext(FormListSourceContext);
}
