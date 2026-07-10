/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Defense-in-depth: public slug route must not render CMS-surface pages.
 * Backend /pages/resolve remains the authoritative ACL gate.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('page-surface policy (frontend defensive guard)', () => {
    it('slug page 404s page_surface=cms', () => {
        const slugPage = readFileSync(join(process.cwd(), 'src/app/[[...slug]]/page.tsx'), 'utf8');
        expect(slugPage).toContain("page_surface === 'cms'");
        expect(slugPage).toContain('notFound()');
        expect(slugPage).toContain('resolvePageByPathSSRStatus');
    });

    it('does not reintroduce a client-side route matcher for public pages', () => {
        const slugPage = readFileSync(join(process.cwd(), 'src/app/[[...slug]]/page.tsx'), 'utf8');
        expect(slugPage).not.toMatch(/matchRoute|matchPathPattern|parseSlugToKeyword/);
        expect(slugPage).toContain('shouldStaticFallback');
        expect(slugPage).not.toMatch(/sections\.length === 0/);
    });
});
