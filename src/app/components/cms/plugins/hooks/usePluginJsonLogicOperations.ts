/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useQuery } from '@tanstack/react-query';
import type { IPluginManifestJsonLogicOperation } from '@selfhelp/shared/plugin-sdk';
import { REACT_QUERY_CONFIG } from '../../../../../config/react-query.config';

interface IManifestOpsEntry {
    enabled?: boolean;
    jsonLogicOperations?: IPluginManifestJsonLogicOperation[];
}

interface IManifestOpsPayload {
    plugins?: IManifestOpsEntry[];
}

/**
 * Declared JSON Logic operations of enabled plugins (C16).
 * Reads the same host manifest the plugin runtime loads (`GET /plugins/manifest`).
 * Operations appear once P12 includes `jsonLogicOperations` on that payload.
 */
export function usePluginJsonLogicOperations(enabled = true) {
    return useQuery({
        queryKey: ['plugins-manifest-json-logic-operations'],
        queryFn: async (): Promise<IPluginManifestJsonLogicOperation[]> => {
            try {
                const resp = await fetch('/api/plugins/manifest', { credentials: 'include' });
                if (!resp.ok) return [];
                const json = (await resp.json()) as { data?: IManifestOpsPayload };
                const plugins = json.data?.plugins ?? [];
                const seen = new Set<string>();
                const ops: IPluginManifestJsonLogicOperation[] = [];
                for (const plugin of plugins) {
                    if (plugin.enabled === false) continue;
                    for (const op of plugin.jsonLogicOperations ?? []) {
                        if (!op?.name || seen.has(op.name)) continue;
                        seen.add(op.name);
                        ops.push({ name: op.name, description: op.description ?? op.name });
                    }
                }
                return ops;
            } catch {
                return [];
            }
        },
        staleTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.staleTime,
        gcTime: REACT_QUERY_CONFIG.CACHE_TIERS.LOOKUPS.gcTime,
        enabled,
    });
}
