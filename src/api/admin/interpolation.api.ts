/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { permissionAwareApiClient } from '../base.api';
import { API_CONFIG } from '../../config/api.config';
import { type IBaseApiResponse } from '../../types/responses/common/response-envelope.types';

/**
 * Interpolation context the picker resolves variables for (issue #56 v2). Must
 * stay in sync with the backend `InterpolationVariableService::CONTEXTS`.
 */
export type TInterpolationContext = 'section' | 'page' | 'action' | 'global';

interface IInterpolationVariablesData {
    context: string;
    /** token => human label (the immutable `{{token}}` plus its display name). */
    data_variables: Record<string, string>;
}

type TInterpolationVariablesResponse = IBaseApiResponse<IInterpolationVariablesData>;

/**
 * Client for the unified `{{ }}` interpolation variable picker endpoint. One
 * call serves every CMS editor surface; the catalog is shaped by `context`
 * (+ optional `id`) so the dropdown only ever offers variables that actually
 * interpolate at runtime.
 */
export const AdminInterpolationApi = {
    /**
     * Fetch the variable picker for a context as a `token => label` map.
     *
     * @param context section | page | action | global
     * @param id      section id (`section`), page id (`page`), or the action's
     *                source data-table id (`action`). Ignored for `global`.
     * @returns token => human label
     */
    async getVariables(context: TInterpolationContext, id?: number | null): Promise<Record<string, string>> {
        const params: Record<string, string | number> = { context };
        if (id !== null && id !== undefined) {
            params.id = id;
        }
        const response = await permissionAwareApiClient.get<TInterpolationVariablesResponse>(
            API_CONFIG.ENDPOINTS.ADMIN_INTERPOLATION_VARIABLES,
            { params }
        );
        return response.data.data?.data_variables ?? {};
    },
};
