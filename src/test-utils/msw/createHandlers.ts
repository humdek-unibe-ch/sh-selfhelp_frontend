/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * MSW request handlers for frontend unit/integration tests.
 *
 * React Query hooks and BFF calls are tested against these handlers — never
 * a real backend (canonical Testing Rules 11 + 30). `apiEnvelope` mirrors the
 * backend `ApiResponseFormatter` shape so handler responses match production.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';

export interface IApiEnvelopeOverrides {
    status?: number;
    message?: string;
    error?: string | null;
    logged_in?: boolean;
}

/** Build a backend-shaped success envelope around `data`. */
export function apiEnvelope<T>(data: T, overrides: IApiEnvelopeOverrides = {}) {
    return {
        status: overrides.status ?? 200,
        message: overrides.message ?? 'OK',
        error: overrides.error ?? null,
        logged_in: overrides.logged_in ?? true,
        meta: { version: 'v1', timestamp: '2026-01-01T00:00:00.000Z' },
        data,
    };
}

/**
 * Compose the default handler set with any test-specific handlers. Pass
 * additional handlers to override defaults for a single test (they take
 * precedence because MSW matches the first handler that responds).
 */
export function createHandlers(custom: HttpHandler[] = []): HttpHandler[] {
    return [...custom, ...defaultHandlers];
}

/**
 * Baseline handlers shared by every test. Kept intentionally small; specs add
 * their own via `server.use(...)`. `*` wildcards match both the direct backend
 * URL and the Next BFF-relative form.
 */
export const defaultHandlers: HttpHandler[] = [
    http.get('*/cms-api/v1/health', () => HttpResponse.json(apiEnvelope({ status: 'ok' }))),
];
