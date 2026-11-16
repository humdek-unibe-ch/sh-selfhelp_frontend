/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import {
    formListRouteQuery,
    type IFormListCompareData,
    type IFormListHistoryData,
    type IFormListQuickActionData,
    type IFormListRestoreRequest,
    type IFormListState,
    type IFormListVersionData,
    type TFormListRestoreData,
    type IFormListCompareQuery,
    type IFormListHistoryQuery,
    type IFormListQuickActionRequest,
    type IFormListCompareResponse,
    type IFormListHistoryResponse,
    type IFormListQuickActionResponse,
    type IFormListRestoreResponse,
    type IFormListStateResponse,
    type IFormListVersionResponse,
} from '../../shared';

/** What one read of a list's state asks for. */
export interface IFormListStateRequest {
    /** The page the list is on (the server checks the list belongs to it). */
    pageId: number;
    /** The visitor's language; omitted = the server's default for the account. */
    languageId?: number | null;
    /** The raw `<key>.*` parameters of the page URL, exactly as they appear there. */
    listQuery: string;
    /** Preview mode of an authorized editor: the draft of the page. Everybody else is served the published configuration. */
    preview?: boolean;
    /**
     * The declared route parameters of the page (`page.route_params`, e.g. `{ record_id: '3' }`). A record
     * template can read `{{route.record_id}}`; the server checks them against the routes of the page.
     */
    route?: Readonly<Record<string, string | undefined>> | null;
}

/**
 * Form list API (`entry-form-list` / `data-view`).
 *
 * Reads and one-click actions of a list. Create, update and delete of records
 * stay on the ordinary form endpoints (see `FormSubmissionApi`): a list never
 * has write routes of its own, so there is exactly one write pipeline.
 *
 * Every method unwraps the response envelope: the caller works with the
 * documented DTO. Errors keep their axios shape so `getFormStaleVersion` and
 * `getFormListRestoreBlocked` from `@selfhelp/shared` can read `data.reason`.
 */
export class FormListApi {
    /** The server-rendered state of one list for the current visitor and URL state. */
    static async getState(sectionId: number, request: IFormListStateRequest): Promise<IFormListState> {
        // Built from the raw pairs, so duplicates and odd spellings reach the
        // server unchanged and are refused there (never silently "fixed").
        const params = new URLSearchParams(request.listQuery);
        params.set('page_id', String(request.pageId));
        if (request.languageId) {
            params.set('language_id', String(request.languageId));
        }
        if (request.preview) {
            params.set('preview', '1');
        }
        for (const [name, value] of new URLSearchParams(formListRouteQuery(request.route))) {
            params.append(name, value);
        }
        const response = await permissionAwareApiClient.get<IFormListStateResponse>(
            API_CONFIG.ENDPOINTS.FORM_LIST_STATE,
            sectionId,
            { params },
        );
        return response.data.data;
    }

    /** Run a configured quick action on one record. The body carries nothing but the page and the version seen. */
    static async runQuickAction(
        sectionId: number,
        recordId: number,
        actionId: string,
        body: IFormListQuickActionRequest,
    ): Promise<IFormListQuickActionData> {
        const response = await permissionAwareApiClient.post<IFormListQuickActionResponse>(
            API_CONFIG.ENDPOINTS.FORM_LIST_QUICK_ACTION,
            body,
            sectionId,
            recordId,
            actionId,
        );
        return response.data.data;
    }

    /** One page of a record's revisions, newest first. */
    static async getHistory(
        sectionId: number,
        recordId: number,
        query: IFormListHistoryQuery,
    ): Promise<IFormListHistoryData> {
        const response = await permissionAwareApiClient.get<IFormListHistoryResponse>(
            API_CONFIG.ENDPOINTS.FORM_LIST_HISTORY,
            sectionId,
            recordId,
            { params: query },
        );
        return response.data.data;
    }

    /** One revision with its changes and the record as it stood after it. */
    static async getVersion(
        sectionId: number,
        recordId: number,
        version: number,
        pageId: number,
        preview = false,
    ): Promise<IFormListVersionData> {
        const response = await permissionAwareApiClient.get<IFormListVersionResponse>(
            API_CONFIG.ENDPOINTS.FORM_LIST_VERSION,
            sectionId,
            recordId,
            version,
            { params: { page_id: pageId, ...(preview ? { preview: 1 } : {}) } },
        );
        return response.data.data;
    }

    /** The changes between two versions of a record. */
    static async compare(
        sectionId: number,
        recordId: number,
        query: IFormListCompareQuery,
    ): Promise<IFormListCompareData> {
        const response = await permissionAwareApiClient.get<IFormListCompareResponse>(
            API_CONFIG.ENDPOINTS.FORM_LIST_COMPARE,
            sectionId,
            recordId,
            { params: query },
        );
        return response.data.data;
    }

    /** Preview (`dry_run`) or perform a restore of an earlier version as a new revision. */
    static async restore(
        sectionId: number,
        recordId: number,
        body: IFormListRestoreRequest,
    ): Promise<TFormListRestoreData> {
        const response = await permissionAwareApiClient.post<IFormListRestoreResponse>(
            API_CONFIG.ENDPOINTS.FORM_LIST_RESTORE,
            body,
            sectionId,
            recordId,
        );
        return response.data.data;
    }

    /**
     * The link of a file a cell holds. The server sends a relative route
     * (`/forms/files/<record>/<field>?index=<n>`); the BFF base is added here.
     */
    static fileHref(serverUrl: string): string {
        return `${API_CONFIG.BASE_URL}${serverUrl}`;
    }

    /** The link of a file an earlier version held (a download; the server checks access). */
    static versionFileHref(
        sectionId: number,
        recordId: number,
        version: number,
        fieldKey: string,
        pageId: number,
        options: { fileLanguage?: number; index?: number; preview?: boolean } = {},
    ): string {
        const params = new URLSearchParams({
            page_id: String(pageId),
            file_language: String(options.fileLanguage ?? 1),
            index: String(options.index ?? 0),
        });
        if (options.preview) {
            // A download acts on the same page version the history shows.
            params.set('preview', '1');
        }
        const route = API_CONFIG.ENDPOINTS.FORM_LIST_VERSION_FILE.route(sectionId, recordId, version, fieldKey);
        return `${API_CONFIG.BASE_URL}${route}?${params.toString()}`;
    }
}
