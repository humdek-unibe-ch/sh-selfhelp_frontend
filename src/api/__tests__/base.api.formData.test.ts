/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * F173: FormData must not keep axios's default `Content-Type: application/json`
 * (nor a forced `multipart/form-data` without a boundary). The browser then
 * sets multipart with the correct boundary so later parts (e.g. `status`) arrive.
 */
import { describe, expect, it } from 'vitest';
import type { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { permissionAwareApiClient } from '../base.api';

describe('apiClient FormData Content-Type (F173)', () => {
    it('strips Content-Type so the browser can set multipart boundary', async () => {
        let captured: InternalAxiosRequestConfig | undefined;
        const body = new FormData();
        body.append('status', 'draft');
        body.append('title', 'Hello');

        await permissionAwareApiClient.post(
            { route: '/api/forms/submit', permissions: [] },
            body,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                adapter: async (config: InternalAxiosRequestConfig) => {
                    captured = config;
                    return {
                        data: { data: { record_id: 1 } },
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                        config,
                    };
                },
            },
        );

        expect(captured?.data).toBeInstanceOf(FormData);
        expect(String((captured?.data as FormData).get('status'))).toBe('draft');

        const headers = captured?.headers as AxiosHeaders | undefined;
        const contentType = String(
            headers && typeof headers.get === 'function'
                ? headers.get('Content-Type') ?? ''
                : (headers as Record<string, unknown> | undefined)?.['Content-Type'] ?? '',
        );
        // Must not keep the client default JSON, nor a bare multipart without boundary
        // (those made the BFF drop later parts). Node's test adapter may invent
        // another Content-Type; the browser leaves it unset so it can add the boundary.
        expect(contentType.includes('application/json'), `got ${contentType}`).toBe(false);
        expect(
            /^multipart\/form-data$/i.test(contentType.trim()),
            `bare multipart without boundary: ${contentType}`,
        ).toBe(false);
    });
});
