/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * React Query hooks of the form lists (`entry-form-list` / `data-view`).
 *
 * - `useFormListState` reads one list for the current URL. A server-rendered
 *   state (page payload or SSR context) seeds the cache, so hydration does not
 *   fetch it again; every later URL state is one `GET /lists/{id}/state`.
 * - The writes of a list use the ordinary form endpoints (`FormSubmissionApi`);
 *   this file adds the delete with its version check, quick actions, history,
 *   comparison and restore.
 *
 * The cache key comes from `formListCacheKey` (shared with mobile): API base,
 * account or guest, language, platform, page, section and the normalized
 * `<key>.*` parameters. One account never reads another account's entry.
 *
 * @module hooks/useFormList
 */

import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { FormListApi } from '../api/frontend/form-list.api';
import { FormSubmissionApi } from '../api/frontend/form-submission.api';
import { API_CONFIG } from '../config/api.config';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';
import { navigationAuthScopeFromUserId } from '../utils/navigation-query.utils';
import { ownListQuery } from '../utils/form-list.utils';
import { invalidateFormList } from '../utils/form-list-cache.utils';
import { useAuthUser } from './useUserData';
import { usePreviewMode } from '../app/components/contexts/PreviewModeContext';
import { withPreview } from '../utils/form-write.utils';
import {
    formListCacheKey,
    getFormListFailure,
    type IFormDeleteData,
    type IFormListCompareData,
    type IFormListError,
    type IFormListFailure,
    type IFormListHistoryData,
    type IFormListQuickActionData,
    type IFormListRestoreRequest,
    type IFormListState,
    type IFormListVersionData,
    type TFormListRestoreData,
} from '../shared';

/** A list state (or the reason there is none) the server rendered for exactly one URL state. */
export interface IFormListSeed {
    state?: IFormListState | null;
    error?: IFormListError | null;
    /** When the state was rendered (ms); a seed from the page payload has no trustworthy age. */
    renderedAt: number | null;
}

interface IUseFormListStateOptions {
    pageId: number;
    sectionId: number;
    /** The list's key in the URL (`news` in `news.q=sleep`). */
    listKey: string;
    languageId: number;
    /** The page URL's query string, with or without the leading `?`. */
    search: string;
    /** The server-rendered state for this URL, when there is one. */
    seed?: IFormListSeed | null;
    preview?: boolean;
    /** The declared route parameters of the page (`page.route_params`); another route is another list state. */
    route?: Readonly<Record<string, string | undefined>> | null;
}

export interface IUseFormListStateResult {
    state: IFormListState | null;
    /** Why there is no state: a server-rendered `list_error` or a failed read. */
    failure: IFormListFailure | null;
    /** A refresh that failed while the last state is still shown. */
    refreshFailure: IFormListFailure | null;
    /** True until the first state (or failure) is known. */
    isLoading: boolean;
    /** The state shown belongs to the previous URL state of this list while the new one is read. */
    isPlaceholder: boolean;
    /** True while a state is being read, including a refresh behind visible rows. */
    isFetching: boolean;
    /** Read the state again; clears a failure the server rendered. */
    retry: () => void;
    queryKey: readonly (string | number)[];
}

/** `authScope`: `guest` or `user:<id>`; the same string the navigation caches use. */
export function useFormListAuthScope(): string {
    const { user } = useAuthUser();
    return navigationAuthScopeFromUserId(user?.id);
}

/** The reason shown when the server (or the network) gave none. */
export const FORM_LIST_UNKNOWN_FAILURE_REASON = 'request_failed';

function failureOfSeed(error: IFormListError): IFormListFailure {
    return {
        status: error.status,
        reason: typeof error.reason === 'string' && error.reason !== '' ? error.reason : FORM_LIST_UNKNOWN_FAILURE_REASON,
        parameter: error.parameter ?? null,
        message: error.message,
    };
}

/** What a failed request says; a network error or a bare 500 has no reason and gets the generic one. */
export function failureOfError(error: unknown): IFormListFailure {
    const known = getFormListFailure(error);
    if (known !== null) {
        return known;
    }
    const status = (error as { response?: { status?: unknown } } | null | undefined)?.response?.status;
    return {
        status: typeof status === 'number' ? status : 0,
        reason: FORM_LIST_UNKNOWN_FAILURE_REASON,
        parameter: null,
        message: null,
    };
}

/** How many leading parts of a list key identify the list itself (root ... route of the page). */
const LIST_IDENTITY_PARTS = 8;

/**
 * True when two list keys are the same list on the same page version and differ at most in the URL state: the
 * rows of the previous state may stay on screen while the next one loads, never across lists, accounts, languages,
 * routes or between the draft and the published page.
 */
function isSameList(a: readonly unknown[], b: readonly unknown[]): boolean {
    if (a.length <= LIST_IDENTITY_PARTS || b.length <= LIST_IDENTITY_PARTS) {
        return false;
    }
    for (let index = 0; index < LIST_IDENTITY_PARTS; index += 1) {
        if (a[index] !== b[index]) {
            return false;
        }
    }
    return a[a.length - 1] === b[b.length - 1];
}

/**
 * Read one list for the URL state the page asks for.
 *
 * With a matching `seed` the first render has the rows and nothing is
 * fetched; without one the state is read once. Writes refresh it through
 * `invalidateFormList`; a returning tab refreshes it when it is stale.
 */
export function useFormListState(options: IUseFormListStateOptions): IUseFormListStateResult {
    const { pageId, sectionId, listKey, languageId, search, seed = null, preview = false, route = null } = options;
    const { user } = useAuthUser();
    const account = user?.id ?? null;
    const own = ownListQuery(search, listKey);
    const queryKey = useMemo(
        () => [
            ...formListCacheKey(
                { apiBase: API_CONFIG.BASE_URL, account, languageId, platform: 'web', pageId, sectionId, key: listKey, route },
                own,
            ),
            // The draft of the page and its published version can answer differently (columns, filters,
            // actions): a person who switches between them never gets the entry of the other one.
            preview ? 'preview' : 'published',
        ],
        [account, languageId, pageId, sectionId, listKey, own, preview, route],
    );

    // A failure the server rendered is shown without a request; Retry reads it.
    const [retried, setRetried] = useState<string | null>(null);
    const seedFailure = seed?.error && !seed.state ? failureOfSeed(seed.error) : null;
    const seedFailureActive = seedFailure !== null && retried !== queryKey.join('|');

    const query = useQuery<IFormListState, unknown>({
        queryKey,
        queryFn: () => FormListApi.getState(sectionId, { pageId, languageId, listQuery: own, preview, route }),
        enabled: pageId > 0 && sectionId > 0 && !seedFailureActive,
        initialData: seed?.state ?? undefined,
        // A state the server just rendered is as fresh as the render; a copy from
        // the page payload has no known age, so it is shown and read again once.
        initialDataUpdatedAt: seed?.state ? (seed.renderedAt ?? 0) : undefined,
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.FORM_LIST.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.FORM_LIST.gcTime,
        refetchOnWindowFocus: REACT_QUERY_CONFIG.CACHE_TIERS.FORM_LIST.refetchOnWindowFocus,
        // `true` reads again on mount only when the data is stale or was
        // invalidated: server-rendered data is fresh, so hydration makes no
        // second request, while a cached copy that aged out is refreshed.
        refetchOnMount: true,
        // Keep the rows of the same list on screen while the next page loads, never across accounts, languages,
        // routes or between the draft and the published page (the first eight parts of the key identify the list
        // itself, the route included; the last part says which version of the page it was read on).
        placeholderData: (previousData, previousQuery) =>
            previousQuery !== undefined && isSameList(previousQuery.queryKey, queryKey) ? previousData : undefined,
        retry: false,
    });

    const retry = useCallback(() => {
        if (seedFailureActive) {
            setRetried(queryKey.join('|'));
            return;
        }
        void query.refetch();
    }, [query, queryKey, seedFailureActive]);

    const failure = seedFailureActive
        ? seedFailure
        : query.error && !query.data
            ? failureOfError(query.error)
            : null;

    return {
        state: seedFailureActive ? null : (query.data ?? null),
        failure,
        // A refresh that failed behind rows that are still shown: say so, keep the rows.
        refreshFailure: !seedFailureActive && query.isRefetchError && query.data ? failureOfError(query.error) : null,
        isLoading: !seedFailureActive && query.isLoading,
        isPlaceholder: !seedFailureActive && query.isPlaceholderData,
        isFetching: query.isFetching,
        retry,
        queryKey,
    };
}

// -- writes ---------------------------------------------------------------------

interface IDeleteRecordVariables {
    recordId: number;
    /** The version the person saw; the server refuses a stale delete with 409. */
    expectedVersion: number;
}

/**
 * Delete one record of a list. The request carries the version seen, so a
 * record someone else changed meanwhile is not deleted blindly (409, nothing
 * written). No toast here: the caller shows the conflict or the success.
 */
export function useFormListDeleteMutation(pageId: number, sectionId: number) {
    const queryClient = useQueryClient();
    const { isPreviewMode } = usePreviewMode();
    return useMutation<IFormDeleteData, unknown, IDeleteRecordVariables>({
        mutationFn: async ({ recordId, expectedVersion }) => {
            const response = await FormSubmissionApi.deleteForm(withPreview({
                record_id: recordId,
                page_id: pageId,
                section_id: sectionId,
                expected_version: expectedVersion,
            }, isPreviewMode));
            return response.data;
        },
        onSuccess: () => {
            void invalidateFormList(queryClient);
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_HISTORY_ALL });
        },
    });
}

interface IQuickActionVariables {
    recordId: number;
    actionId: string;
    expectedVersion: number;
}

/** Run a quick action on one record: the server applies the author's assignments as an ordinary edit. */
export function useFormListQuickActionMutation(pageId: number, sectionId: number) {
    const queryClient = useQueryClient();
    const { isPreviewMode } = usePreviewMode();
    return useMutation<IFormListQuickActionData, unknown, IQuickActionVariables>({
        mutationFn: ({ recordId, actionId, expectedVersion }) =>
            FormListApi.runQuickAction(sectionId, recordId, actionId, withPreview({ page_id: pageId, expected_version: expectedVersion }, isPreviewMode)),
        onSuccess: () => {
            void invalidateFormList(queryClient);
            void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_HISTORY_ALL });
        },
    });
}

// -- history --------------------------------------------------------------------

interface IHistoryTarget {
    pageId: number;
    sectionId: number;
    recordId: number | null;
}

const HISTORY_PAGE_SIZE = 10;

/** One page of a record's revisions, newest first. */
export function useFormListHistory(target: IHistoryTarget, page: number, enabled = true) {
    const authScope = useFormListAuthScope();
    const { isPreviewMode } = usePreviewMode();
    const { pageId, sectionId, recordId } = target;
    return useQuery<IFormListHistoryData, unknown>({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_HISTORY(authScope, sectionId, recordId ?? 0, page, isPreviewMode),
        queryFn: () => FormListApi.getHistory(sectionId, recordId as number, withPreview({
            page_id: pageId,
            page,
            page_size: HISTORY_PAGE_SIZE,
        }, isPreviewMode)),
        enabled: enabled && recordId !== null && pageId > 0,
        staleTime: 0,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.FORM_LIST.gcTime,
        placeholderData: keepPreviousData,
        retry: false,
    });
}

/** One revision with its changes and the record as it stood after it. */
export function useFormListVersion(target: IHistoryTarget, version: number | null) {
    const authScope = useFormListAuthScope();
    const { isPreviewMode } = usePreviewMode();
    const { pageId, sectionId, recordId } = target;
    return useQuery<IFormListVersionData, unknown>({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_VERSION(authScope, sectionId, recordId ?? 0, version ?? 0, isPreviewMode),
        queryFn: () => FormListApi.getVersion(sectionId, recordId as number, version as number, pageId, isPreviewMode),
        enabled: recordId !== null && version !== null && pageId > 0,
        staleTime: 0,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.FORM_LIST.gcTime,
        retry: false,
    });
}

/** The changes between two versions (the current one is a version like any other). */
export function useFormListCompare(target: IHistoryTarget, from: number | null, to: number | null) {
    const authScope = useFormListAuthScope();
    const { isPreviewMode } = usePreviewMode();
    const { pageId, sectionId, recordId } = target;
    return useQuery<IFormListCompareData, unknown>({
        queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_COMPARE(authScope, sectionId, recordId ?? 0, from ?? 0, to ?? 0, isPreviewMode),
        queryFn: () => FormListApi.compare(sectionId, recordId as number, withPreview({ page_id: pageId, from: from as number, to: to as number }, isPreviewMode)),
        enabled: recordId !== null && from !== null && to !== null && pageId > 0,
        staleTime: 0,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.FORM_LIST.gcTime,
        retry: false,
    });
}

interface IRestoreVariables extends Omit<IFormListRestoreRequest, 'page_id'> {
    recordId: number;
}

/**
 * Preview (`dry_run`) or perform the restore of an earlier version. A real
 * restore is a new revision written through the ordinary pipeline; it never
 * rewinds history. Only the real restore refreshes the lists.
 */
export function useFormListRestoreMutation(pageId: number, sectionId: number) {
    const queryClient = useQueryClient();
    const { isPreviewMode } = usePreviewMode();
    return useMutation<TFormListRestoreData, unknown, IRestoreVariables>({
        mutationFn: ({ recordId, ...body }) => FormListApi.restore(sectionId, recordId, withPreview({ ...body, page_id: pageId }, isPreviewMode)),
        onSuccess: (data) => {
            if (!data.dry_run) {
                void invalidateFormList(queryClient);
                void queryClient.invalidateQueries({ queryKey: REACT_QUERY_CONFIG.QUERY_KEYS.FORM_LIST_HISTORY_ALL });
            }
        },
    });
}
