/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Live Preview path navigation must go through PageApi.resolvePageByPath
 * (backend authority), not a local route matcher.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePreviewPath, pathForMobilePreviewSync } from '../previewPath';
import { buildPagesResolvePath } from '@selfhelp/shared';

describe('Live Preview path resolve parity', () => {
    it('normalizes parameterized paths the same way as shared resolve', () => {
        expect(normalizePreviewPath('/team-members/5/?x=1')).toBe('/team-members/5');
        expect(normalizePreviewPath('/team-members/5/')).toBe('/team-members/5');
        expect(buildPagesResolvePath({ path: normalizePreviewPath('/team-members/5/') })).toBe(
            '/pages/resolve?path=%2Fteam-members%2F5',
        );
    });

    it('sends path to mobile only when route_params are present', () => {
        expect(pathForMobilePreviewSync('/dienstleistungen/schulungen', {})).toBeUndefined();
        expect(pathForMobilePreviewSync('/team-members/5', { record_id: '5' })).toBe(
            '/team-members/5',
        );
        expect(pathForMobilePreviewSync(null, { record_id: '5' })).toBeUndefined();
    });

    it('LivePreview shell calls PageApi.resolvePageByPath (no previewKeyword matcher)', () => {
        const livePreview = readFileSync(
            join(process.cwd(), 'src/app/components/cms/live-preview/LivePreview.tsx'),
            'utf8',
        );
        expect(livePreview).toContain('PageApi.resolvePageByPath');
        expect(livePreview).toContain('pathForMobilePreviewSync');
        expect(livePreview).not.toContain('resolvePreviewRoute');
        expect(livePreview).not.toContain('previewKeyword');
    });
});
