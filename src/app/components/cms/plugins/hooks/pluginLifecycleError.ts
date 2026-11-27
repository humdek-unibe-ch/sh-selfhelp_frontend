/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Formats 409 plugin dependency / conflict refusals (C21) for notifications.
 */

const DEPENDENCY_ERRORS = new Set([
    'plugin_dependency_missing',
    'plugin_dependents_enabled',
    'plugin_conflict',
]);

function pluginIdsFromRows(rows: unknown): string[] {
    if (!Array.isArray(rows)) return [];
    const ids: string[] = [];
    for (const row of rows) {
        if (!row || typeof row !== 'object') continue;
        const id = (row as { plugin_id?: unknown }).plugin_id;
        if (typeof id === 'string' && id !== '') ids.push(id);
    }
    return ids;
}

export function formatPluginLifecycleError(error: unknown): string {
    const response = (error as { response?: { data?: { error?: unknown; data?: unknown; message?: unknown } } } | null)
        ?.response?.data;
    const code = typeof response?.error === 'string' ? response.error : null;
    const data = response?.data && typeof response.data === 'object'
        ? (response.data as Record<string, unknown>)
        : null;

    if (code && DEPENDENCY_ERRORS.has(code) && data) {
        const ids = [
            ...pluginIdsFromRows(data.unmet),
            ...pluginIdsFromRows(data.dependents),
            ...pluginIdsFromRows(data.conflicts),
        ];
        const unique = [...new Set(ids)];
        const names = unique.length > 0 ? unique.join(', ') : null;
        if (code === 'plugin_dependency_missing') {
            return names
                ? `Missing or unsatisfied dependencies: ${names}`
                : 'Missing or unsatisfied plugin dependencies.';
        }
        if (code === 'plugin_dependents_enabled') {
            return names
                ? `Enabled dependents still rely on this plugin: ${names}`
                : 'Other enabled plugins still depend on this one.';
        }
        return names
            ? `Conflicts with enabled plugins: ${names}`
            : 'Conflicts with another enabled plugin.';
    }

    if (typeof response?.error === 'string' && response.error.trim() !== '') {
        return response.error;
    }
    if (typeof response?.message === 'string' && response.message.trim() !== '') {
        return response.message;
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return String(error);
}
