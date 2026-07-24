/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { parseApiError } from '../mutation-error-handler';

/**
 * The asset upload/delete/import/export handlers now route errors through
 * parseApiError so a permission denial shows the backend's real reason instead
 * of a generic "Failed to delete asset". This pins that: a 403 envelope's
 * `error` field wins over any hardcoded fallback, with an "Access Denied" title.
 */
describe('parseApiError', () => {
    it('surfaces the backend `error` field and an Access Denied title on 403', () => {
        const err = {
            response: {
                status: 403,
                data: {
                    status: 403,
                    message: 'Forbidden',
                    error: 'You do not have permission to access this API endpoint.',
                    data: null,
                },
            },
        };

        const { errorTitle, errorMessage } = parseApiError(err);

        expect(errorTitle).toBe('Access Denied');
        expect(errorMessage).toBe('You do not have permission to access this API endpoint.');
    });

    it('prefers `error` over `message` when both are present', () => {
        const err = {
            response: { status: 400, data: { error: 'Specific reason', message: 'Generic' } },
        };
        expect(parseApiError(err).errorMessage).toBe('Specific reason');
    });

    it('falls back to a status-based message when the 403 has no body text', () => {
        const { errorTitle, errorMessage } = parseApiError({ response: { status: 403, data: {} } });
        expect(errorTitle).toBe('Access Denied');
        expect(errorMessage).toBe('You do not have permission to perform this action.');
    });
});
