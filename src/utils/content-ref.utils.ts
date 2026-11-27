/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Display helper for C19 `content_ref` on data-browser rows and history.
 * A missing value is shown as "unknown" (legacy rows before the column existed).
 */
export function formatContentRef(value: unknown): string {
    if (value === null || value === undefined || value === '') {
        return 'unknown';
    }
    return String(value);
}
