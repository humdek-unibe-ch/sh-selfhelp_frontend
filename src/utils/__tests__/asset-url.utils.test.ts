/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { getAssetUrl } from '../asset-url.utils';

/**
 * Asset bytes are served only by the access-checked delivery route
 * `GET /cms-api/v1/assets/{uuid}`. The browser must reach it through the BFF
 * (`/api/...`): Symfony authorizes from the `Authorization: Bearer` header, and
 * the ONLY thing that sets it is the `/api/*` catch-all proxy, which reads the
 * httpOnly auth cookie server-side. Emitting the backend path directly sends the
 * request anonymous, so restricted assets would never load.
 */
const UUID = '3f2b8c1e-9a4d-4c7e-8b1a-2d5e6f7a8b9c';

describe('getAssetUrl', () => {
    it('re-addresses the backend `url` onto the BFF so the bearer token is attached', () => {
        expect(getAssetUrl(`/cms-api/v1/assets/${UUID}`)).toBe(`/api/assets/${UUID}`);
        expect(getAssetUrl(`cms-api/v1/assets/${UUID}`)).toBe(`/api/assets/${UUID}`);
    });

    it('never emits the backend path directly (that request carries no identity)', () => {
        expect(getAssetUrl(`/cms-api/v1/assets/${UUID}`)).not.toMatch(/^\/cms-api\//);
    });

    it('is idempotent for an already-BFF path', () => {
        expect(getAssetUrl(`/api/assets/${UUID}`)).toBe(`/api/assets/${UUID}`);
    });

    it('keeps public/assets artwork served by Next, off the delivery route', () => {
        expect(getAssetUrl('assets/images/logo.svg')).toBe('/assets/images/logo.svg');
        expect(getAssetUrl('/assets/images/logo_negative.svg')).toBe('/assets/images/logo_negative.svg');
    });

    it('returns empty string for empty/invalid input', () => {
        expect(getAssetUrl('')).toBe('');
        // @ts-expect-error exercising the runtime guard
        expect(getAssetUrl(null)).toBe('');
    });

    it('passes through absolute http(s) and data URLs untouched', () => {
        expect(getAssetUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
        expect(getAssetUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    });
});
