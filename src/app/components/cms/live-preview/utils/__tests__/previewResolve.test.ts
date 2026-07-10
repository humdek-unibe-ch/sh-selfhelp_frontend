/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';
import type { IPageContent } from '../../../../../../shared';
import {
    classifyPreviewResolveError,
    formatPreviewResolveFailure,
    resolvePreviewPathWithRace,
    shouldReportMobileSyncFailure,
} from '../previewResolve';

function page(partial: Partial<IPageContent> & Pick<IPageContent, 'keyword'>): IPageContent {
    return {
        id: 1,
        url: null,
        parent_page_id: null,
        is_headless: false,
        sections: [],
        ...partial,
    };
}

function axiosStatus(status: number): AxiosError {
    return new AxiosError('fail', undefined, undefined, undefined, {
        status,
        statusText: 'x',
        headers: {},
        config: { headers: {} } as never,
        data: {},
    });
}

describe('classifyPreviewResolveError', () => {
    it('classifies 404 as not_found', () => {
        const failure = classifyPreviewResolveError(axiosStatus(404), '/missing');
        expect(failure.kind).toBe('not_found');
        expect(failure.path).toBe('/missing');
        expect(failure.status).toBe(404);
    });

    it('classifies 401/403 as unauthorized', () => {
        expect(classifyPreviewResolveError(axiosStatus(401), '/secret').kind).toBe('unauthorized');
        expect(classifyPreviewResolveError(axiosStatus(403), '/secret').kind).toBe('unauthorized');
    });

    it('classifies axios errors without a response as network', () => {
        const err = new AxiosError('Network Error');
        expect(classifyPreviewResolveError(err, '/team/1').kind).toBe('network');
    });

    it('classifies malformed keyword errors', () => {
        expect(classifyPreviewResolveError(new Error('malformed resolve response: missing keyword'), '/x').kind).toBe(
            'malformed',
        );
    });
});

describe('resolvePreviewPathWithRace', () => {
    it('resolves a static route', async () => {
        const outcome = await resolvePreviewPathWithRace({
            path: '/home',
            requestId: 1,
            isCurrent: () => true,
            resolvePageByPath: async () => page({ keyword: 'home' }),
        });
        expect(outcome).toEqual({
            status: 'success',
            value: { keyword: 'home', path: '/home', routeParams: {} },
        });
    });

    it('resolves a parameterized route with route_params', async () => {
        const outcome = await resolvePreviewPathWithRace({
            path: '/team/5',
            requestId: 1,
            isCurrent: () => true,
            resolvePageByPath: async () =>
                page({ keyword: 'team-member', route_params: { record_id: '5' } }),
        });
        expect(outcome).toEqual({
            status: 'success',
            value: {
                keyword: 'team-member',
                path: '/team/5',
                routeParams: { record_id: '5' },
            },
        });
    });

    it('returns not_found for a 404 route', async () => {
        const outcome = await resolvePreviewPathWithRace({
            path: '/gone',
            requestId: 1,
            isCurrent: () => true,
            resolvePageByPath: async () => {
                throw axiosStatus(404);
            },
        });
        expect(outcome.status).toBe('error');
        if (outcome.status === 'error') {
            expect(outcome.failure.kind).toBe('not_found');
            expect(formatPreviewResolveFailure(outcome.failure)).toContain('/gone');
        }
    });

    it('returns unauthorized for a 403 preview', async () => {
        const outcome = await resolvePreviewPathWithRace({
            path: '/cms-only',
            requestId: 1,
            isCurrent: () => true,
            resolvePageByPath: async () => {
                throw axiosStatus(403);
            },
        });
        expect(outcome.status).toBe('error');
        if (outcome.status === 'error') {
            expect(outcome.failure.kind).toBe('unauthorized');
        }
    });

    it('returns network for a backend/network error', async () => {
        const outcome = await resolvePreviewPathWithRace({
            path: '/team/1',
            requestId: 1,
            isCurrent: () => true,
            resolvePageByPath: async () => {
                throw new AxiosError('Network Error');
            },
        });
        expect(outcome.status).toBe('error');
        if (outcome.status === 'error') {
            expect(outcome.failure.kind).toBe('network');
        }
    });

    it('discards an older response that arrives after a newer request', async () => {
        let releaseSlow: (() => void) | undefined;
        const slowGate = new Promise<void>((resolve) => {
            releaseSlow = resolve;
        });

        const slow = resolvePreviewPathWithRace({
            path: '/old',
            requestId: 1,
            isCurrent: (id) => id === 2,
            resolvePageByPath: async () => {
                await slowGate;
                return page({ keyword: 'old-page' });
            },
        });

        const fast = resolvePreviewPathWithRace({
            path: '/new',
            requestId: 2,
            isCurrent: (id) => id === 2,
            resolvePageByPath: async () => page({ keyword: 'new-page' }),
        });

        const fastOutcome = await fast;
        releaseSlow?.();
        const slowOutcome = await slow;

        expect(fastOutcome).toEqual({
            status: 'success',
            value: { keyword: 'new-page', path: '/new', routeParams: {} },
        });
        expect(slowOutcome).toEqual({ status: 'stale' });
    });

    it('keeps reporting failure after a previously successful page (no silent null)', async () => {
        const first = await resolvePreviewPathWithRace({
            path: '/home',
            requestId: 1,
            isCurrent: () => true,
            resolvePageByPath: async () => page({ keyword: 'home' }),
        });
        expect(first.status).toBe('success');

        const second = await resolvePreviewPathWithRace({
            path: '/missing',
            requestId: 2,
            isCurrent: () => true,
            resolvePageByPath: async () => {
                throw axiosStatus(404);
            },
        });
        expect(second.status).toBe('error');
        if (second.status === 'error') {
            expect(second.failure.path).toBe('/missing');
            expect(second.failure.kind).toBe('not_found');
        }
    });

    it('rejects a malformed page payload', async () => {
        const outcome = await resolvePreviewPathWithRace({
            path: '/broken',
            requestId: 1,
            isCurrent: () => true,
            resolvePageByPath: async () => ({ keyword: '' }) as IPageContent,
        });
        expect(outcome.status).toBe('error');
        if (outcome.status === 'error') {
            expect(outcome.failure.kind).toBe('malformed');
        }
    });
});

describe('shouldReportMobileSyncFailure', () => {
    it('suppresses benign single-segment underlay 404s', () => {
        expect(
            shouldReportMobileSyncFailure({
                kind: 'not_found',
                path: '/(app)',
                message: 'x',
            }),
        ).toBe(false);
        expect(
            shouldReportMobileSyncFailure({
                kind: 'not_found',
                path: '/home',
                message: 'x',
            }),
        ).toBe(false);
    });

    it('reports real multi-segment CMS path 404s', () => {
        expect(
            shouldReportMobileSyncFailure({
                kind: 'not_found',
                path: '/team/5',
                message: 'x',
            }),
        ).toBe(true);
    });

    it('always reports unauthorized, network, and malformed soft-sync failures', () => {
        expect(
            shouldReportMobileSyncFailure({
                kind: 'unauthorized',
                path: '/home',
                message: 'x',
            }),
        ).toBe(true);
        expect(
            shouldReportMobileSyncFailure({
                kind: 'network',
                path: '/home',
                message: 'x',
            }),
        ).toBe(true);
        expect(
            shouldReportMobileSyncFailure({
                kind: 'malformed',
                path: '/home',
                message: 'x',
            }),
        ).toBe(true);
    });
});
