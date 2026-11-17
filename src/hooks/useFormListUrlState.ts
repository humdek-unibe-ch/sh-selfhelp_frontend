/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * The URL state of one form list.
 *
 * A list lives in its own namespace of the page URL
 * (`/news?news.q=sleep&news.page=2&news.record=17&news.mode=edit`). This hook
 * reads that namespace with the shared parser and writes changes back with the
 * history API, so a change never reloads the page, never touches another
 * list's parameters or any unrelated parameter (campaign tags, preview flags,
 * other lists) and Back/Forward walk through the list states in order.
 *
 * Why not `router.push`: a list interaction must not re-run the server
 * component of the page. Next.js syncs `window.history.pushState` with
 * `useSearchParams`, so every list on the page re-renders from the new URL.
 *
 * @module hooks/useFormListUrlState
 */

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import {
    applyFormListUrlChange,
    emptyFormListUrlState,
    parseFormListQuery,
    type IFormListUrlError,
    type IFormListUrlRules,
    type IFormListUrlState,
    type TFormListUrlChange,
} from '../shared';
import { formListHref } from '../utils/form-list.utils';

interface INavigateOptions {
    /** Replace the current history entry instead of adding one (typing in the search box). */
    replace?: boolean;
}

export interface IUseFormListUrlState {
    pathname: string;
    /** The page URL's query string at render time, without `?`. Server and client agree on it. */
    search: string;
    /** The state the URL asks for; the empty state when the list's parameters are not valid. */
    urlState: IFormListUrlState;
    /** Set when the list's parameters are not a valid state (the server answers with the reason). */
    urlError: IFormListUrlError | null;
    /** The link (path and query) that shows `change` applied to the current state. */
    hrefFor: (change: TFormListUrlChange) => string;
    /** The link that drops every parameter of this list and keeps the rest. */
    resetHref: string;
    /** Apply a change to the URL. */
    navigate: (change: TFormListUrlChange, options?: INavigateOptions) => void;
    /** Drop every parameter of this list (search, filters, sort, page, open record) and keep the rest. */
    clear: (options?: INavigateOptions) => void;
}

/**
 * @param listKey the list's key in the URL
 * @param rules   what the list offers (sortable fields, control ids); lets the
 *                parser refuse early what the server would refuse
 */
export function useFormListUrlState(listKey: string, rules: IFormListUrlRules = {}): IUseFormListUrlState {
    const pathname = usePathname() ?? '/';
    const searchParams = useSearchParams();
    const search = searchParams?.toString() ?? '';

    // `undefined` means "grammar only" (any well-formed control/sort is accepted).
    // An empty array means "the list offers none" and must stay distinct from that —
    // coercing missing rules to `[]` refused every `*.f.*` filter and emptied the UI.
    const hasSortable = rules.sortable !== undefined;
    const hasControls = rules.controls !== undefined;
    const sortableKey = hasSortable ? rules.sortable!.join(',') : '';
    const controlsKey = hasControls ? rules.controls!.join(',') : '';
    const allowCreate = rules.allowCreate;
    const allowUpdate = rules.allowUpdate;
    const showHistory = rules.showHistory;

    const parsed = useMemo(
        () => parseFormListQuery(search, listKey, {
            ...(hasSortable ? { sortable: sortableKey === '' ? [] : sortableKey.split(',') } : {}),
            ...(hasControls ? { controls: controlsKey === '' ? [] : controlsKey.split(',') } : {}),
            allowCreate,
            allowUpdate,
            showHistory,
        }),
        [search, listKey, hasSortable, hasControls, sortableKey, controlsKey, allowCreate, allowUpdate, showHistory],
    );

    const urlState = parsed.ok ? parsed.state : emptyFormListUrlState();
    const urlError = parsed.ok ? null : parsed.error;

    const hrefFor = useCallback(
        (change: TFormListUrlChange) => formListHref(pathname, search, listKey, applyFormListUrlChange(urlState, change)),
        [pathname, search, listKey, urlState],
    );

    const resetHref = useMemo(
        () => formListHref(pathname, search, listKey, emptyFormListUrlState()),
        [pathname, search, listKey],
    );

    const writeUrl = useCallback(
        (compute: (base: IFormListUrlState) => IFormListUrlState, options: INavigateOptions) => {
            if (typeof window === 'undefined') {
                return;
            }
            // Read the live URL, not the render-time copy: two lists may change
            // in the same tick and each must start from the other's result.
            const liveSearch = window.location.search.replace(/^\?/, '');
            const live = parseFormListQuery(liveSearch, listKey);
            const base = live.ok ? live.state : emptyFormListUrlState();
            const href = formListHref(window.location.pathname, liveSearch, listKey, compute(base));
            const current = `${window.location.pathname}${window.location.search}`;
            if (href === current) {
                return;
            }
            // `null`, not `window.history.state`: Next.js copies its own router
            // state into a `null` payload and syncs `useSearchParams`; passing
            // its own state object back would skip that sync.
            if (options.replace) {
                window.history.replaceState(null, '', href);
            } else {
                window.history.pushState(null, '', href);
            }
        },
        [listKey],
    );

    const navigate = useCallback(
        (change: TFormListUrlChange, options: INavigateOptions = {}) =>
            writeUrl((base) => applyFormListUrlChange(base, change), options),
        [writeUrl],
    );

    const clear = useCallback(
        (options: INavigateOptions = {}) => writeUrl(() => emptyFormListUrlState(), options),
        [writeUrl],
    );

    return { pathname, search, urlState, urlError, hrefFor, resetHref, navigate, clear };
}
