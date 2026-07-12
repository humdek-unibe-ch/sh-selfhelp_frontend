/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery } from '@tanstack/react-query';
import { AdminDataApi } from '../api/admin/data.api';
import { REACT_QUERY_CONFIG } from '../config/react-query.config';

export interface IQueryPreviewRequest {
    section_id?: number;
    draft?: {
        data_table?: string;
        filter?: string;
        selected_columns?: string;
        own_entries_only?: boolean;
        route_params?: Record<string, string>;
    };
    route_params?: Record<string, string>;
    route_requirements?: Record<string, string>;
}

export interface IQueryPreviewResponse {
    data_table: { id: number; name: string; displayName: string | null } | null;
    columns: Array<{ fieldKey: string | null; displayName: string | null; standard: boolean }>;
    route_params: Record<string, string>;
    route_requirements: Record<string, string>;
    raw_filter: string;
    prepared_filter: string;
    selected_columns: string;
    own_entries_only: boolean;
    language_id: number;
    timezone_code: string;
    errors: string[];
    warnings: string[];
    stored_procedure: {
        name: string;
        call: string;
        parameters: Record<string, unknown>;
    };
    sql_shape: string;
}

export function useQueryPreview(
    payload: IQueryPreviewRequest | null,
    enabled: boolean,
) {
    return useQuery({
        queryKey: [...REACT_QUERY_CONFIG.QUERY_KEYS.ADMIN_DATA_QUERY_PREVIEW, payload],
        queryFn: () => AdminDataApi.previewQuery(payload as IQueryPreviewRequest),
        enabled: enabled && payload !== null,
        ...REACT_QUERY_CONFIG.CACHE_TIERS.REAL_TIME,
    });
}
