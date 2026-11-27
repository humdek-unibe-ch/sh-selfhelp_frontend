/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The edit lock of the page editor (live sync C9): take it on open, renew it while the editor is
 * open and visible, give it up on leave, read-only when someone else holds it, and the answers
 * to the messages the server pushes (P6-A3, P6-A4, P6-A5, P6-A6).
 */
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IPageLockStatus } from '@selfhelp/shared';

const api = vi.hoisted(() => ({
    acquirePageLock: vi.fn(),
    getPageLock: vi.fn(),
    takeOverPageLock: vi.fn(),
    releasePageLock: vi.fn(),
}));
const notify = vi.hoisted(() => ({ show: vi.fn() }));

vi.mock('../../api/admin/page.api', () => ({ AdminPageApi: api }));
vi.mock('@mantine/notifications', () => ({ notifications: notify }));

import { PAGE_LOCK_RENEW_INTERVAL_MS, usePageEditLock } from '../usePageEditLock';
import { applySyncTags } from '../../utils/sync-tags.utils';
import { resetPageDraftVersionsForTests } from '../../utils/page-draft-version.utils';
import {
    isStaleConflictHeld,
    notifyPageEditConflict,
    resetPageEditConflictsForTests,
} from '../../utils/page-edit-conflict.utils';

const PAGE = 12;
const ME = { id: 1, name: 'Me' };
const ADA = { id: 4, name: 'Ada Lovelace' };

function status(overrides: Partial<IPageLockStatus> = {}): IPageLockStatus {
    return {
        page_id: PAGE,
        held: true,
        mine: true,
        holder: ME,
        expires_at: '2026-11-20T10:02:00Z',
        idle_expires_at: '2026-11-20T10:15:00Z',
        ...overrides,
    };
}
const HELD_BY_ADA = status({ mine: false, holder: ADA });
const FREE = status({ held: false, mine: false, holder: null, expires_at: null, idle_expires_at: null });

function lockedError(lock: IPageLockStatus): Error {
    return Object.assign(new Error('locked'), {
        response: { status: 409, data: { status: 409, error: 'page_locked', data: lock } },
    });
}

function idleEndedError(lock: IPageLockStatus = FREE): Error {
    return Object.assign(new Error('idle ended'), {
        response: { status: 409, data: { status: 409, error: 'lock_idle_ended', data: lock } },
    });
}

let queryClient: QueryClient;
let invalidate: MockInstance<QueryClient['invalidateQueries']>;

function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

type TMountProps = { id: number | null; on: boolean; watchOnly?: boolean };

async function mount(enabled = true, pageId: number | null = PAGE, options: { watchOnly?: boolean } = {}) {
    const rendered = renderHook(
        ({ id, on, watchOnly }: TMountProps) => usePageEditLock(id, on, { watchOnly: watchOnly === true }),
        {
            wrapper,
            initialProps: {
                id: pageId,
                on: enabled,
                ...(options.watchOnly ? { watchOnly: true } : {}),
            } satisfies TMountProps,
        },
    );
    await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
    });
    return rendered;
}

async function advance(ms: number) {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });
}

function setVisibility(state: 'visible' | 'hidden') {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
    document.dispatchEvent(new Event('visibilitychange'));
}

function draftQueriesInvalidated(): boolean {
    return invalidate.mock.calls.some(
        ([filters]) => JSON.stringify((filters as { queryKey?: unknown }).queryKey) === JSON.stringify(['pageFields', PAGE]),
    );
}

beforeEach(() => {
    vi.useFakeTimers();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    for (const fn of Object.values(api)) fn.mockReset();
    notify.show.mockReset();
    api.acquirePageLock.mockResolvedValue(status());
    api.getPageLock.mockResolvedValue(status());
    api.takeOverPageLock.mockResolvedValue(status());
    api.releasePageLock.mockResolvedValue(FREE);
    resetPageDraftVersionsForTests();
    resetPageEditConflictsForTests();
    setVisibility('visible');
});

afterEach(() => {
    vi.useRealTimers();
    queryClient.clear();
});

describe('taking the lock', () => {
    it('takes it when the caller may update, and holds it', async () => {
        const { result } = await mount();

        expect(api.acquirePageLock).toHaveBeenCalledTimes(1);
        expect(api.acquirePageLock).toHaveBeenCalledWith(PAGE);
        expect(result.current.phase).toBe('holding');
        expect(result.current.reason).toBeNull();
    });

    it('does nothing for a caller who only reads (no lock controls)', async () => {
        const { result } = await mount(false);
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS * 3);

        expect(result.current.phase).toBe('off');
        expect(api.acquirePageLock).not.toHaveBeenCalled();
        expect(api.getPageLock).not.toHaveBeenCalled();
        expect(api.releasePageLock).not.toHaveBeenCalled();
    });

    it('does nothing without a page', async () => {
        const { result } = await mount(true, null);

        expect(result.current.phase).toBe('off');
        expect(api.acquirePageLock).not.toHaveBeenCalled();
    });

    it('opens read-only, naming the holder, when someone else holds it (answer 409)', async () => {
        api.acquirePageLock.mockRejectedValue(lockedError(HELD_BY_ADA));
        const { result } = await mount();

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('held_by_other');
        expect(result.current.holder).toEqual(ADA);
    });

    it('opens read-only when the answer says it is not the caller\'s', async () => {
        api.acquirePageLock.mockResolvedValue(HELD_BY_ADA);
        const { result } = await mount();

        expect(result.current.phase).toBe('blocked');
        expect(result.current.holder?.name).toBe('Ada Lovelace');
    });

    it('lets the server check every write when the lock call itself fails', async () => {
        api.acquirePageLock.mockRejectedValue(new Error('network'));
        const { result } = await mount();

        expect(result.current.phase).toBe('holding');
    });
});

describe('renewing and giving up the lock', () => {
    it('renews every 30 seconds while the tab is visible', async () => {
        await mount();
        expect(api.acquirePageLock).toHaveBeenCalledTimes(1);

        await advance(PAGE_LOCK_RENEW_INTERVAL_MS);
        expect(api.acquirePageLock).toHaveBeenCalledTimes(2);
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS);
        expect(api.acquirePageLock).toHaveBeenCalledTimes(3);
    });

    it('does not renew while the tab is hidden, and renews again when it is visible', async () => {
        await mount();
        setVisibility('hidden');
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS * 4);
        expect(api.acquirePageLock).toHaveBeenCalledTimes(1);

        setVisibility('visible');
        await advance(0);
        expect(api.acquirePageLock).toHaveBeenCalledTimes(2);
    });

    it('gives the lock up when the editor is left', async () => {
        const { unmount } = await mount();

        unmount();

        expect(api.releasePageLock).toHaveBeenCalledWith(PAGE);
    });

    it('gives the lock up when another page is opened, and takes the lock of the new one', async () => {
        const { rerender, result } = await mount();

        rerender({ id: 13, on: true });
        await advance(0);

        expect(api.releasePageLock).toHaveBeenCalledWith(PAGE);
        expect(api.acquirePageLock).toHaveBeenLastCalledWith(13);
        expect(result.current.phase).toBe('holding');
    });

    it('gives the lock up on pagehide, kept alive past the page', async () => {
        await mount();

        window.dispatchEvent(new Event('pagehide'));

        expect(api.releasePageLock).toHaveBeenCalledWith(PAGE, { keepalive: true });
    });

    it('releases nothing when it never held the lock', async () => {
        api.acquirePageLock.mockResolvedValue(HELD_BY_ADA);
        const { unmount } = await mount();

        unmount();
        window.dispatchEvent(new Event('pagehide'));

        expect(api.releasePageLock).not.toHaveBeenCalled();
    });

    it('a renewal answered 409 lock_idle_ended puts the hook in idle', async () => {
        const { result } = await mount();
        expect(result.current.phase).toBe('holding');

        api.acquirePageLock.mockRejectedValueOnce(idleEndedError());
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS);

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('idle');
        const renewals = api.acquirePageLock.mock.calls.length;
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS * 4);
        expect(api.acquirePageLock).toHaveBeenCalledTimes(renewals);
    });

    it('Continue editing after lock_idle_ended calls take-over and returns to held', async () => {
        const { result } = await mount();
        api.acquirePageLock.mockRejectedValueOnce(idleEndedError());
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS);
        expect(result.current.reason).toBe('idle');
        invalidate.mockClear();

        await act(async () => {
            await result.current.takeOver();
        });

        expect(api.takeOverPageLock).toHaveBeenCalledWith(PAGE);
        expect(result.current.phase).toBe('holding');
        expect(draftQueriesInvalidated()).toBe(true);
    });

    it('after lock_idle_ended, a status read that finds the page free keeps the "session ended" state (not "free")', async () => {
        const { result } = await mount();
        api.acquirePageLock.mockRejectedValueOnce(idleEndedError());
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS);
        expect(result.current.reason).toBe('idle');

        // The lock notice the server sends at the idle end, and a switch back to the tab, read the status:
        // nobody holds the page, but a plain acquire would be refused again, so the banner must stay on "Continue editing".
        api.getPageLock.mockResolvedValue(FREE);
        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('idle');

        setVisibility('hidden');
        setVisibility('visible');
        await advance(0);
        expect(api.getPageLock.mock.calls.length).toBeGreaterThanOrEqual(2);
        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('idle');
        expect(api.acquirePageLock).toHaveBeenCalledTimes(2);
    });

    it('after lock_idle_ended, someone else taking the page replaces the idle state with the new holder', async () => {
        const { result } = await mount();
        api.acquirePageLock.mockRejectedValueOnce(idleEndedError());
        await advance(PAGE_LOCK_RENEW_INTERVAL_MS);
        expect(result.current.reason).toBe('idle');

        api.getPageLock.mockResolvedValue(HELD_BY_ADA);
        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('held_by_other');
        expect(result.current.holder).toEqual(ADA);
    });
});

describe('taking over', () => {
    it('becomes the holder and reads the draft again before the first write', async () => {
        api.acquirePageLock.mockRejectedValue(lockedError(HELD_BY_ADA));
        const { result } = await mount();
        invalidate.mockClear();

        await act(async () => {
            await result.current.takeOver();
        });

        expect(api.takeOverPageLock).toHaveBeenCalledWith(PAGE);
        expect(result.current.phase).toBe('holding');
        expect(draftQueriesInvalidated()).toBe(true);
    });

    it('stays read-only when the take-over fails', async () => {
        api.acquirePageLock.mockRejectedValue(lockedError(HELD_BY_ADA));
        api.takeOverPageLock.mockRejectedValue(new Error('boom'));
        const { result } = await mount();

        await act(async () => {
            await result.current.takeOver();
        });

        expect(result.current.phase).toBe('blocked');
        expect(result.current.isWorking).toBe(false);
    });
});

describe('messages the server pushes (C3)', () => {
    it('page_lock: read-only with "taken over" when someone took the lock', async () => {
        const { result } = await mount();
        api.getPageLock.mockResolvedValue(HELD_BY_ADA);

        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(api.getPageLock).toHaveBeenCalledWith(PAGE);
        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('taken_over');
        expect(result.current.holder).toEqual(ADA);
    });

    it('page_lock: read-only with the idle reason when the lock ended and nobody holds it', async () => {
        const { result } = await mount();
        api.getPageLock.mockResolvedValue(FREE);

        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('idle');
    });

    it('page_lock: keeps editing when the lock is still the caller\'s', async () => {
        const { result } = await mount();

        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(result.current.phase).toBe('holding');
    });

    it('page_lock of another page changes nothing', async () => {
        const { result } = await mount();

        await act(async () => {
            applySyncTags(queryClient, ['page_lock:99']);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(api.getPageLock).not.toHaveBeenCalled();
        expect(result.current.phase).toBe('holding');
    });

    it('page_lock while read-only: shows the new holder, or that the page is free', async () => {
        api.acquirePageLock.mockRejectedValue(lockedError(HELD_BY_ADA));
        const { result } = await mount();

        api.getPageLock.mockResolvedValue(FREE);
        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('free');
        expect(result.current.holder).toBeNull();
    });

    it('page_draft while holding the lock: ignored, the editor is not refetched under the writer', async () => {
        await mount();
        invalidate.mockClear();

        await act(async () => {
            applySyncTags(queryClient, [`page_draft:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(draftQueriesInvalidated()).toBe(false);
    });

    it('page_draft without the lock: the draft is read again', async () => {
        api.acquirePageLock.mockRejectedValue(lockedError(HELD_BY_ADA));
        await mount();
        invalidate.mockClear();

        await act(async () => {
            applySyncTags(queryClient, [`page_draft:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(draftQueriesInvalidated()).toBe(true);
    });
});

describe('watch-only lock (delete/publish callers)', () => {
    it('on mount only reads the lock; never acquires, releases or takes over (renew, visibility, pagehide, unmount)', async () => {
        api.getPageLock.mockResolvedValue(FREE);
        const { result, unmount } = await mount(true, PAGE, { watchOnly: true });

        expect(api.getPageLock).toHaveBeenCalledTimes(1);
        expect(api.getPageLock).toHaveBeenCalledWith(PAGE);
        expect(api.acquirePageLock).not.toHaveBeenCalled();
        expect(api.releasePageLock).not.toHaveBeenCalled();
        expect(api.takeOverPageLock).not.toHaveBeenCalled();
        expect(result.current.phase).toBe('off');
        expect(result.current.watchOnly).toBe(true);

        await advance(PAGE_LOCK_RENEW_INTERVAL_MS * 3);
        setVisibility('hidden');
        setVisibility('visible');
        await advance(0);
        window.dispatchEvent(new Event('pagehide'));
        await act(async () => {
            await result.current.takeOver();
            await result.current.retry();
        });
        unmount();

        expect(api.getPageLock.mock.calls.length).toBeGreaterThanOrEqual(1);
        expect(api.acquirePageLock).not.toHaveBeenCalled();
        expect(api.releasePageLock).not.toHaveBeenCalled();
        expect(api.takeOverPageLock).not.toHaveBeenCalled();
    });

    it('held by another → blocked; a page_lock notice that the lock is free → off', async () => {
        api.getPageLock.mockResolvedValue(HELD_BY_ADA);
        const { result } = await mount(true, PAGE, { watchOnly: true });

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('held_by_other');
        expect(result.current.holder).toEqual(ADA);
        expect(api.acquirePageLock).not.toHaveBeenCalled();

        api.getPageLock.mockResolvedValue(FREE);
        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(result.current.phase).toBe('off');
        expect(result.current.reason).toBeNull();
        expect(result.current.holder).toBeNull();
        expect(api.acquirePageLock).not.toHaveBeenCalled();
    });

    it('a failed first read does not leave the actions disabled with no reason: the page counts as free and the server decides', async () => {
        api.getPageLock.mockRejectedValue(new Error('network'));
        const { result } = await mount(true, PAGE, { watchOnly: true });

        expect(api.getPageLock).toHaveBeenCalledTimes(1);
        expect(result.current.phase).toBe('off');
        expect(result.current.reason).toBeNull();
        expect(api.acquirePageLock).not.toHaveBeenCalled();

        // The next notice that does read the status still pauses the actions.
        api.getPageLock.mockResolvedValue(HELD_BY_ADA);
        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(result.current.phase).toBe('blocked');
        expect(result.current.holder).toEqual(ADA);
    });

    it('a later failed read keeps what the caller already saw (blocked stays blocked)', async () => {
        api.getPageLock.mockResolvedValue(HELD_BY_ADA);
        const { result } = await mount(true, PAGE, { watchOnly: true });
        expect(result.current.phase).toBe('blocked');

        api.getPageLock.mockRejectedValue(new Error('network'));
        await act(async () => {
            applySyncTags(queryClient, [`page_lock:${PAGE}`]);
            await vi.advanceTimersByTimeAsync(0);
        });

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('held_by_other');
        expect(result.current.holder).toEqual(ADA);
    });
});

describe('editor enabled after rights load', () => {
    it('when enabled turns from false to true, the first render reports checking, not off', async () => {
        const { result, rerender } = renderHook(
            ({ id, on }: TMountProps) => usePageEditLock(id, on),
            { wrapper, initialProps: { id: PAGE, on: false } },
        );
        expect(result.current.phase).toBe('off');

        rerender({ id: PAGE, on: true });
        expect(result.current.phase).toBe('checking');

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });
        expect(result.current.phase).toBe('holding');
    });
});

describe('refusals of a draft write', () => {
    it('409 page_locked on a write: read-only with the holder, and the draft is read again', async () => {
        const { result } = await mount();
        invalidate.mockClear();

        act(() => {
            notifyPageEditConflict({ kind: 'locked', pageId: PAGE, status: HELD_BY_ADA });
        });

        expect(result.current.phase).toBe('blocked');
        expect(result.current.reason).toBe('taken_over');
        expect(result.current.holder).toEqual(ADA);
        expect(draftQueriesInvalidated()).toBe(true);
    });

    it('409 stale_page_version: says so, reads the draft again and keeps the person\'s values', async () => {
        const { result, unmount } = await mount();
        invalidate.mockClear();

        act(() => {
            notifyPageEditConflict({ kind: 'stale', pageId: PAGE, currentVersion: 6 });
        });

        expect(notify.show).toHaveBeenCalledWith(expect.objectContaining({ title: 'This page was changed elsewhere' }));
        expect(draftQueriesInvalidated()).toBe(true);
        expect(isStaleConflictHeld(PAGE)).toBe(true);
        expect(result.current.phase).toBe('holding');

        unmount();
        expect(isStaleConflictHeld(PAGE)).toBe(false);
    });

    it('a refusal for another page is not this editor\'s business', async () => {
        const { result } = await mount();

        act(() => {
            notifyPageEditConflict({ kind: 'locked', pageId: 99, status: HELD_BY_ADA });
        });

        expect(result.current.phase).toBe('holding');
    });
});
