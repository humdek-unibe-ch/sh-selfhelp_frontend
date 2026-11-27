/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import type { ReactNode, SyntheticEvent } from 'react';
import { renderWithProviders } from '../../../test-utils/renderWithProviders';
import { typeLikeAPerson } from '../../../test-utils/trusted-input';
import DynamicPageClient from '../DynamicPageClient';
import { LIVE_SYNC_NOTICE_TEXT } from '../LiveSyncNotices';
import { claimPageView, resetPageViewForTests } from '../../../utils/page-view.utils';

/**
 * The page on screen under live sync (P4-A4, P4-A7, C6, C7):
 * - the `valid_until` of the payload starts one refetch of the page's own cache slot;
 * - a refetch the server refuses leaves the last page and says so (banner, no kick-out);
 * - a form the person typed into that is gone from the next payload is announced;
 * - the page on screen counts as viewed, so a later client fetch is not a new view.
 */
const page = vi.hoisted(() => ({
    state: {
        content: null as null | Record<string, unknown>,
        error: null as unknown,
        isPlaceholderData: false,
        dataUpdatedAt: 1,
    },
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock('../../../hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock('../../../hooks/useAppNavigation', () => ({ useAppNavigation: () => ({ navigation: null }) }));
vi.mock('../../../hooks/usePageContentByPath', () => ({
    usePageContentByPath: () => ({
        content: page.state.content,
        isLoading: false,
        isFetching: false,
        isPlaceholderData: page.state.isPlaceholderData,
        error: page.state.error,
        dataUpdatedAt: page.state.dataUpdatedAt,
    }),
}));
vi.mock('../../../hooks/usePageContentByKeyword', () => ({
    usePageContentByKeyword: () => ({ content: null, isLoading: false, isFetching: false, isPlaceholderData: false }),
}));
vi.mock('../../../hooks/useSyncDocumentMetadata', () => ({ useSyncDocumentMetadata: vi.fn() }));
vi.mock('../../../hooks/useRecordLastVisitedPage', () => ({ useRecordLastVisitedPage: vi.fn() }));
vi.mock('../../components/contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 1 }),
}));
vi.mock('../../components/contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({ isPreviewMode: false }),
    PreviewModeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('../../components', () => ({
    PageContentRenderer: ({
        sections,
        onInputCapture,
    }: {
        sections: Array<{ id: number }>;
        onInputCapture?: (event: SyntheticEvent) => void;
    }) => (
        <div onInputCapture={onInputCapture} onChangeCapture={onInputCapture}>
            {sections.map((section) => (
                <form key={section.id} data-testid={`form-${section.id}`}>
                    <input type="hidden" name="__id_sections" value={section.id} readOnly />
                    <input name="answer" data-testid={`answer-${section.id}`} defaultValue="" />
                </form>
            ))}
        </div>
    ),
}));

function payload(sectionIds: number[], validUntil: string | null = null): Record<string, unknown> {
    return {
        id: 12,
        keyword: 'survey',
        title: 'Survey',
        is_headless: false,
        sections: sectionIds.map((id) => ({ id, style_name: 'form-log', children: [] })),
        sync: { depends_on: ['page:12'], valid_until: validUntil },
    };
}

const mount = () => renderWithProviders(<DynamicPageClient keyword="survey" initialPageId={12} path="/survey" />);

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.setSystemTime(Date.parse('2026-11-20T10:00:00Z'));
    resetPageViewForTests();
    page.state = { content: payload([1]), error: null, isPlaceholderData: false, dataUpdatedAt: 1 };
});

afterEach(() => {
    vi.useRealTimers();
});

describe('DynamicPageClient under live sync', () => {
    it('refetches its own page once at valid_until, not another page (P4-A4)', () => {
        page.state.content = payload([1], new Date(Date.now() + 10_000).toISOString());
        const { queryClient } = mount();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

        act(() => {
            vi.advanceTimersByTime(12_100);
        });

        expect(invalidate).toHaveBeenCalledTimes(1);
        expect(invalidate).toHaveBeenCalledWith(
            expect.objectContaining({
                queryKey: ['page-by-keyword', '__path__', '/survey', 1, 'published'],
                exact: true,
            }),
        );
    });

    it('does not start a timer for a page without valid_until', () => {
        const { queryClient } = mount();
        const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

        act(() => {
            vi.advanceTimersByTime(120_000);
        });

        expect(invalidate).not.toHaveBeenCalled();
    });

    it('marks the page on screen as viewed, so a later fetch of it is not a new view (C7)', () => {
        mount();

        expect(claimPageView('/survey')).toBe(false);
    });

    it('does not mark placeholder data (the previous page) as the viewed one', () => {
        page.state.isPlaceholderData = true;
        mount();

        expect(claimPageView('/survey')).toBe(true);
    });

    it.each([401, 403, 404])('says the page changed for the person when the server answers %i, and keeps the page', (status) => {
        page.state.error = { response: { status } };
        mount();

        expect(screen.getByTestId('page-lost-notice').textContent).toContain(LIVE_SYNC_NOTICE_TEXT.lost);
        expect(screen.getByTestId('form-1')).toBeTruthy();
    });

    it.each([500, undefined])('shows no lost-page banner for a failed refetch that is not a refusal (%s)', (status) => {
        page.state.error = { response: { status } };
        mount();

        expect(screen.queryByTestId('page-lost-notice')).toBeNull();
    });

    it('announces a form the person typed into when the next payload no longer has it (P4-A7)', () => {
        page.state.content = payload([1, 2]);
        const { rerender } = mount();
        typeLikeAPerson(screen.getByTestId('answer-1') as HTMLInputElement, 'my answer');
        expect(screen.queryByTestId('form-vanished-notice')).toBeNull();

        // A pushed change removed section 1 from the page.
        page.state.content = payload([2]);
        rerender(<DynamicPageClient keyword="survey" initialPageId={12} path="/survey" />);

        expect(screen.getByTestId('form-vanished-notice').textContent).toContain(LIVE_SYNC_NOTICE_TEXT.vanished);
        expect(screen.getByTestId('form-2')).toBeTruthy();
    });

    it('says nothing when the form that went away was never typed into, or the typed form stays (P4-A7)', () => {
        page.state.content = payload([1, 2]);
        const { rerender } = mount();
        typeLikeAPerson(screen.getByTestId('answer-2') as HTMLInputElement, 'kept');

        page.state.content = payload([2]);
        rerender(<DynamicPageClient keyword="survey" initialPageId={12} path="/survey" />);
        expect(screen.queryByTestId('form-vanished-notice')).toBeNull();

        page.state.content = payload([2, 3]);
        rerender(<DynamicPageClient keyword="survey" initialPageId={12} path="/survey" />);
        expect(screen.queryByTestId('form-vanished-notice')).toBeNull();
        expect((screen.getByTestId('answer-2') as HTMLInputElement).value).toBe('kept');
    });
});
