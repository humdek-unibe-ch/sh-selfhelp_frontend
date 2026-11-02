/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { getAssetUrl } from '../asset-url.utils';

/**
 * Since core 0.1.41 asset bytes are served only by the ACL-enforced delivery
 * route `GET /cms-api/v1/assets/{folder}/{filename}`; the old static
 * `/uploads/assets/...` paths 404 because the files moved out of the document
 * root.
 *
 * Crucially, the browser must reach that route through the BFF (`/api/...`).
 * Symfony authorizes from the `Authorization: Bearer` header, and the ONLY
 * thing that sets it is the `/api/*` catch-all proxy, which reads the httpOnly
 * auth cookie server-side. Emitting the backend path directly sent the request
 * ANONYMOUS, so admins (whose bypass comes from the JWT role) and users with
 * read grants both saw nothing, while denied folders merely *looked* correct.
 */
describe('getAssetUrl — delivery route', () => {
    it('re-addresses the backend `url` onto the BFF so the bearer token is attached', () => {
        // Regression: emitting `/cms-api/v1/...` reached Symfony anonymous.
        expect(getAssetUrl('/cms-api/v1/assets/champ/lamine-yamal-young.webp'))
            .toBe('/api/assets/champ/lamine-yamal-young.webp');
    });

    it('never emits the backend path directly (that request carries no identity)', () => {
        expect(getAssetUrl('/cms-api/v1/assets/champ/x.webp')).not.toMatch(/^\/cms-api\//);
        expect(getAssetUrl('uploads/assets/champ/x.webp')).not.toMatch(/^\/cms-api\//);
    });

    it('is idempotent for an already-BFF path', () => {
        expect(getAssetUrl('/api/assets/champ/x.webp')).toBe('/api/assets/champ/x.webp');
    });

    it('never emits an absolute origin, so the request stays same-origin', () => {
        const url = getAssetUrl('/cms-api/v1/assets/champ/x.webp');
        expect(url.startsWith('/')).toBe(true);
        expect(url).not.toContain('http');
    });

    it('maps a legacy uploads/assets logical key onto the delivery route', () => {
        // `file_path` is an identity key, not fetchable — if a straggler hands
        // us one it must still resolve to bytes rather than 404.
        expect(getAssetUrl('uploads/assets/champ/x.webp'))
            .toBe('/api/assets/champ/x.webp');
    });

    it('never emits a bare /uploads path (those 404 since core 0.1.41)', () => {
        expect(getAssetUrl('uploads/assets/champ/x.webp')).not.toMatch(/^\/uploads\//);
        expect(getAssetUrl('avatar.png')).not.toMatch(/^\/uploads\//);
    });

    it('routes other legacy relative forms through delivery too', () => {
        expect(getAssetUrl('uploads/avatar.png')).toBe('/api/assets/avatar.png');
        expect(getAssetUrl('avatar.png')).toBe('/api/assets/avatar.png');
    });

    it('normalises legacy admin/ prefixes onto the delivery route', () => {
        expect(getAssetUrl('admin/uploads/assets/champ/x.png'))
            .toBe('/api/assets/champ/x.png');
    });
});

describe('getAssetUrl — static public/assets are NOT ACL assets', () => {
    it('keeps public/assets artwork served by Next, off the delivery route', () => {
        // `public/assets/` (no `uploads/`) is frontend-owned static artwork in
        // this repo — the app logos — not backend uploads. Routing it through
        // delivery would search for a folder named `images` and 404.
        expect(getAssetUrl('assets/images/logo.svg')).toBe('/assets/images/logo.svg');
        expect(getAssetUrl('/assets/images/logo_negative.svg')).toBe('/assets/images/logo_negative.svg');
    });
});

describe('getAssetUrl — pass-through', () => {
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
