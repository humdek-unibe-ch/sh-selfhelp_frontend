/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { IFormListError, IFormListState } from '../../../../../shared';
import type { IFormListSeed } from '../../../../../hooks/useFormList';
import { normalizedOwnQuery, type IFormListSsrValue } from '../../../../../utils/form-list.utils';

const FormListSsrContext = createContext<IFormListSsrValue | null>(null);

interface IFormListSsrProviderProps {
    /** What the server rendered for this request (see `buildFormListSsrValue`). */
    value: IFormListSsrValue;
    children: ReactNode;
}

/**
 * Hands the lists the server rendered for this request (rows, selected record,
 * or the reason there is none) to the list components under it. The slug page
 * wraps its content with it; a list outside it starts from the page payload
 * or reads its state once.
 */
export function FormListSsrProvider({ value, children }: IFormListSsrProviderProps) {
    return <FormListSsrContext.Provider value={value}>{children}</FormListSsrContext.Provider>;
}

/**
 * The state the server rendered for this list and this URL, if any.
 *
 * 1. A seed the server rendered for exactly this URL state wins; its age is the
 *    render time, so hydration trusts it and fetches nothing.
 * 2. Without one, the list the page payload carries (rendered for a URL
 *    without list parameters) is used when this URL has none either; its age
 *    is unknown, so it is shown and read again once.
 * 3. Otherwise there is no seed and the state is read once.
 */
export function useFormListSeed(
    sectionId: number,
    listKey: string,
    search: string,
    pageState: IFormListState | undefined,
    pageError: IFormListError | undefined,
): IFormListSeed | null {
    const ssr = useContext(FormListSsrContext);
    const own = normalizedOwnQuery(search, listKey);

    return useMemo(() => {
        const match = ssr?.seeds.find((seed) => seed.sectionId === sectionId && seed.query === own);
        if (match && ssr) {
            return { state: match.state, error: match.error, renderedAt: ssr.renderedAt };
        }
        if (own === '' && (pageState || pageError)) {
            return { state: pageState ?? null, error: pageError ?? null, renderedAt: null };
        }
        return null;
    }, [ssr, sectionId, own, pageState, pageError]);
}
