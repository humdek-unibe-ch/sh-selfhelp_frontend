/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import {
    LIVE_PREVIEW_PATH_QUERY,
    buildLivePreviewShellHref,
} from '../usePreviewUrlMirror';

describe('buildLivePreviewShellHref', () => {
    it('mirrors keyword-only pages without a path query', () => {
        expect(buildLivePreviewShellHref('home', null)).toBe('/admin/preview/home');
        expect(buildLivePreviewShellHref('home', '/')).toBe('/admin/preview/home');
        expect(buildLivePreviewShellHref(null, null)).toBe('/admin/preview');
    });

    it('keeps the public CMS path in ?path= for parameterized pages', () => {
        expect(
            buildLivePreviewShellHref(
                'demo_team_members_team-members-record',
                '/demo-team-members/team-members/4',
            ),
        ).toBe(
            `/admin/preview/demo_team_members_team-members-record?${LIVE_PREVIEW_PATH_QUERY}=%2Fdemo-team-members%2Fteam-members%2F4`,
        );
    });

    it('preserves unrelated search params such as modal', () => {
        expect(
            buildLivePreviewShellHref('team-members-record', '/team-members/4', '?modal=on'),
        ).toBe(
            `/admin/preview/team-members-record?modal=on&${LIVE_PREVIEW_PATH_QUERY}=%2Fteam-members%2F4`,
        );
    });

    it('replaces a stale path query when navigating to a static page', () => {
        expect(
            buildLivePreviewShellHref('team-members', '/team-members', '?path=%2Fold%2F1'),
        ).toBe(`/admin/preview/team-members?${LIVE_PREVIEW_PATH_QUERY}=%2Fteam-members`);
    });
});
