/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import DynamicPageClient from '../DynamicPageClient';
import {
    consumeLandingReferrerHost,
    resetLandingReferrerForTests,
} from '../../../utils/referrer-host.utils';

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('../../../hooks/useAuth', () => ({
    useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock('../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({ navigation: null }),
}));

vi.mock('../../../hooks/usePageContentByPath', () => ({
    usePageContentByPath: () => ({
        content: {
            id: 12,
            keyword: 'impressum',
            title: 'Impressum',
            sections: [{ id: 1, style_name: 'container', children: [] }],
            is_headless: false,
        },
        isLoading: false,
        isFetching: false,
        isPlaceholderData: false,
    }),
}));

vi.mock('../../../hooks/usePageContentByKeyword', () => ({
    usePageContentByKeyword: () => ({
        content: null,
        isLoading: false,
        isFetching: false,
        isPlaceholderData: false,
    }),
}));

vi.mock('../../../hooks/useSyncDocumentMetadata', () => ({
    useSyncDocumentMetadata: vi.fn(),
}));

vi.mock('../../../hooks/useRecordLastVisitedPage', () => ({
    useRecordLastVisitedPage: vi.fn(),
}));

vi.mock('../../components/contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 1 }),
}));

vi.mock('../../components/contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({ isPreviewMode: false }),
}));

vi.mock('../../components', () => ({
    PageContentRenderer: () => <div>Page body</div>,
}));

/**
 * When the slug layout seeds PAGE_BY_PATH from the server, DynamicPageClient
 * must dismiss the browser landing snapshot so a later refetch cannot send a
 * second X-Referrer-Host for the same visit.
 */
describe('DynamicPageClient and the landing referrer snapshot', () => {
    beforeEach(() => {
        window.history.pushState({}, '', '/impressum');
        Object.defineProperty(document, 'referrer', {
            value: 'https://news.example.org/story',
            configurable: true,
        });
        resetLandingReferrerForTests();
    });

    afterEach(() => {
        window.history.pushState({}, '', '/');
        Object.defineProperty(document, 'referrer', { value: '', configurable: true });
        resetLandingReferrerForTests();
    });

    it('dismisses the snapshot when the SSR-seeded landing page is already in the cache', () => {
        // Snapshot is live before mount (would otherwise be sent on a refetch).
        expect(consumeLandingReferrerHost('/impressum')).toBe('news.example.org');
        resetLandingReferrerForTests();

        renderWithProviders(
            <DynamicPageClient keyword="impressum" initialPageId={12} path="/impressum" />,
        );

        expect(consumeLandingReferrerHost('/impressum')).toBeNull();
    });
});
