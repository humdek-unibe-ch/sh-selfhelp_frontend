/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
 */
import { describe, expect, it } from 'vitest';
import { keywordFromPreviewPath, resolvePreviewRoute } from '../previewKeyword';

const routes = [
    { keyword: 'team-members', url: '/team-members' },
    { keyword: 'team-members-record', url: '/team-members/{record_id}' },
    { keyword: 'imprint', url: '/demo/legal/imprint' },
];

describe('keywordFromPreviewPath', () => {
    it('maps nested page URLs to their CMS keyword', () => {
        expect(keywordFromPreviewPath('/demo/legal/imprint', routes)).toBe('imprint');
    });

    it('falls back to the last path segment when no route list is given', () => {
        expect(keywordFromPreviewPath('/team-members/5')).toBe('5');
    });
});

describe('resolvePreviewRoute', () => {
    it('matches exact list URLs', () => {
        expect(resolvePreviewRoute('/team-members', routes)).toEqual({
            keyword: 'team-members',
            path: '/team-members',
            routeParams: {},
        });
    });

    it('matches parameterized record detail URLs', () => {
        expect(resolvePreviewRoute('/team-members/5', routes)).toEqual({
            keyword: 'team-members-record',
            path: '/team-members/5',
            routeParams: { record_id: '5' },
        });
    });

    it('strips query strings and trailing slashes', () => {
        expect(resolvePreviewRoute('/team-members/12/?preview=1', routes)).toEqual({
            keyword: 'team-members-record',
            path: '/team-members/12',
            routeParams: { record_id: '12' },
        });
    });
});
