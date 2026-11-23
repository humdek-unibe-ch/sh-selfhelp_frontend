/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * The edit lock of the page open in the editor (live-sync contract C9), from the editor's side.
 *
 * Opening a page the caller may update takes the lock. While the editor is open and the tab is
 * visible the lock is renewed every 30 s; leaving the page (also `pagehide`) gives it up. If
 * someone else holds it, the editor opens read-only and offers a take-over. The hook also keeps
 * the draft the editor shows true:
 *
 * - `page_lock:<id>` (a message the server pushes): read the status again. Holding it no more
 *   means someone took it over or the idle end came: read-only, with the reason.
 * - `page_draft:<id>` while the caller holds the lock: dropped (the caller's own writes must not
 *   refetch the editor under them). Without the lock: the draft is read again.
 * - `409 stale_page_version`: "This page was changed elsewhere", the draft is read again; the
 *   inspectors keep what the person typed (`page-edit-conflict.utils`).
 * - `409 page_locked` on any write: read-only with the banner.
 *
 * The server renews the lock for whoever asks while it is free, so the idle end (15 minutes after
 * the last draft write) is also enforced here: a renewal after it would otherwise take the lock
 * again silently.
 *
 * Callers with only read never take part: `enabled` is false for them and nothing is sent.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { PAGE_LOCKED_ERROR, type IPageLockHolder, type IPageLockStatus } from '@selfhelp/shared';
import { AdminPageApi } from '../api/admin/page.api';
import { registerSyncTagIgnore, subscribeSyncTags } from '../utils/sync-tags.utils';
import { subscribePageDraftVersion } from '../utils/page-draft-version.utils';
import { clearStaleConflict, subscribePageEditConflict } from '../utils/page-edit-conflict.utils';
import { invalidatePageDraftQueries } from '../utils/page-draft-queries.utils';
import { PAGE_CONFLICT_TEXTS } from '../utils/mutation-error-handler';

/** The lock is renewed this often while the editor is open and visible. */
export const PAGE_LOCK_RENEW_INTERVAL_MS = 30_000;
/** No draft write for this long ends the lock (server: 900 s). */
export const PAGE_LOCK_IDLE_MS = 900_000;

export type TPageLockPhase = 'off' | 'checking' | 'holding' | 'blocked';

/**
 * Why the editor is read-only because of the lock:
 * - `held_by_other`: someone else is editing (take over to continue)
 * - `taken_over`: the caller held the lock and someone took it over
 * - `idle`: the lock ended after a long time without a draft write or because it ran out
 * - `free`: the one who held it left; nobody holds it now
 */
export type TPageLockReason = 'held_by_other' | 'taken_over' | 'idle' | 'free';

export interface IPageEditLock {
    phase: TPageLockPhase;
    holder: IPageLockHolder | null;
    reason: TPageLockReason | null;
    /** A take-over or a new attempt is on its way. */
    isWorking: boolean;
    /** Become the holder, whoever held the lock; the draft is read again. */
    takeOver: () => Promise<void>;
    /** Ask for the lock again (it is free, or the idle end passed). Someone else holding it keeps the editor read-only. */
    retry: () => Promise<void>;
}

interface ILockState {
    phase: TPageLockPhase;
    holder: IPageLockHolder | null;
    reason: TPageLockReason | null;
}

/** The state belongs to one page; a render for another page never shows it. */
type TOwnedLockState = ILockState & { pageId: number | null };

const OFF: ILockState = { phase: 'off', holder: null, reason: null };
const CHECKING: ILockState = { phase: 'checking', holder: null, reason: null };
const HOLDING: ILockState = { phase: 'holding', holder: null, reason: null };

function isHidden(): boolean {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

/** The lock status inside a `409 page_locked`, or `null` for any other error. */
function lockedStatusOf(error: unknown): IPageLockStatus | null {
    const response = (error as { response?: { status?: number; data?: { error?: unknown; data?: unknown } } } | null)
        ?.response;
    if (response?.status === 409 && response.data?.error === PAGE_LOCKED_ERROR) {
        return (response.data.data as IPageLockStatus | null) ?? ({ holder: null } as IPageLockStatus);
    }
    return null;
}

export function usePageEditLock(pageId: number | null | undefined, enabled: boolean): IPageEditLock {
    const queryClient = useQueryClient();
    const active = enabled && !!pageId;
    const [state, setState] = useState<TOwnedLockState>({ ...(active ? CHECKING : OFF), pageId: pageId ?? null });
    const [isWorking, setIsWorking] = useState(false);
    const actionsRef = useRef<{ takeOver: () => Promise<void>; retry: () => Promise<void> } | null>(null);

    useEffect(() => {
        if (!active || !pageId) {
            actionsRef.current = null;
            return undefined;
        }

        const id = pageId;
        let cancelled = false;
        let holding = false;
        let lastActivity = Date.now();

        const put = (next: ILockState): void => setState({ ...next, pageId: id });

        put(CHECKING);

        const hold = (): void => {
            holding = true;
            lastActivity = Date.now();
            put(HOLDING);
        };
        const lose = (reason: TPageLockReason, holder: IPageLockHolder | null): void => {
            holding = false;
            put({ phase: 'blocked', holder, reason });
        };
        const reloadDraft = (): Promise<unknown> => invalidatePageDraftQueries(queryClient, id);

        /** Ask for the lock. A refusal names the holder. Any other failure leaves the server to check every write. */
        const acquire = async (reload: boolean): Promise<void> => {
            try {
                const status = await AdminPageApi.acquirePageLock(id);
                if (cancelled) return;
                if (status.mine) {
                    hold();
                    if (reload) await reloadDraft();
                } else {
                    lose('held_by_other', status.holder);
                }
            } catch (error) {
                if (cancelled) return;
                const locked = lockedStatusOf(error);
                if (locked) {
                    lose('held_by_other', locked.holder ?? null);
                    if (reload) await reloadDraft();
                } else {
                    hold();
                }
            }
        };

        const refresh = async (): Promise<void> => {
            try {
                const status = await AdminPageApi.getPageLock(id);
                if (cancelled) return;
                if (status.mine) {
                    if (!holding) hold();
                } else if (holding) {
                    lose(status.held ? 'taken_over' : 'idle', status.holder);
                    void reloadDraft();
                } else {
                    setState((previous) =>
                        previous.pageId === id && previous.phase === 'blocked'
                            ? {
                                  pageId: id,
                                  phase: 'blocked',
                                  holder: status.holder,
                                  reason: status.held ? 'held_by_other' : 'free',
                              }
                            : previous,
                    );
                }
            } catch {
                /* the next message or renewal tries again */
            }
        };

        /** Renew while visible; the idle end is decided here (see the hook comment). */
        const renew = async (): Promise<void> => {
            if (!holding || isHidden()) return;
            if (Date.now() - lastActivity >= PAGE_LOCK_IDLE_MS) {
                lose('idle', null);
                void AdminPageApi.releasePageLock(id).catch(() => undefined);
                return;
            }
            try {
                const status = await AdminPageApi.acquirePageLock(id);
                if (cancelled || !holding) return;
                if (!status.mine) {
                    lose('taken_over', status.holder);
                    void reloadDraft();
                }
            } catch (error) {
                if (cancelled || !holding) return;
                const locked = lockedStatusOf(error);
                if (locked) {
                    lose('taken_over', locked.holder ?? null);
                    void reloadDraft();
                }
            }
        };

        const takeOver = async (): Promise<void> => {
            setIsWorking(true);
            try {
                await AdminPageApi.takeOverPageLock(id);
                if (cancelled) return;
                hold();
                // The other person may have written: read the draft (and its version) before the first write.
                await reloadDraft();
            } catch {
                /* still read-only; the person can try again */
            } finally {
                if (!cancelled) setIsWorking(false);
            }
        };

        const retry = async (): Promise<void> => {
            setIsWorking(true);
            try {
                await acquire(true);
            } finally {
                if (!cancelled) setIsWorking(false);
            }
        };
        actionsRef.current = { takeOver, retry };

        const onVisible = (): void => {
            if (isHidden()) return;
            if (holding) {
                void renew();
            } else {
                void refresh();
            }
        };
        const onPageHide = (): void => {
            if (holding) {
                void AdminPageApi.releasePageLock(id, { keepalive: true }).catch(() => undefined);
            }
        };
        const onPageShow = (event: PageTransitionEvent): void => {
            // Restored from the back/forward cache: the lock was given up on `pagehide`.
            if (event.persisted) void renew();
        };

        const unsubscribers = [
            subscribePageDraftVersion((changedPageId) => {
                // The version moves with every draft write of this page: that is the activity the idle end counts.
                if (changedPageId === id) lastActivity = Date.now();
            }),
            registerSyncTagIgnore((tag) => holding && tag === `page_draft:${id}`),
            subscribeSyncTags((tags) => {
                if (tags.includes(`page_lock:${id}`)) void refresh();
                if (tags.includes(`page_draft:${id}`)) void reloadDraft();
            }),
            subscribePageEditConflict((conflict) => {
                if (conflict.pageId !== id) return;
                if (conflict.kind === 'stale') {
                    notifications.show({
                        id: `page-conflict-${id}`,
                        color: 'orange',
                        title: PAGE_CONFLICT_TEXTS.stale_page_version.title,
                        message: PAGE_CONFLICT_TEXTS.stale_page_version.message,
                        autoClose: 8000,
                    });
                    void reloadDraft();
                    return;
                }
                lose(holding ? 'taken_over' : 'held_by_other', conflict.status?.holder ?? null);
                void reloadDraft();
            }),
        ];

        const interval = setInterval(() => void renew(), PAGE_LOCK_RENEW_INTERVAL_MS);
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('pagehide', onPageHide);
        window.addEventListener('pageshow', onPageShow);

        void acquire(false);

        return () => {
            cancelled = true;
            actionsRef.current = null;
            clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('pageshow', onPageShow);
            for (const unsubscribe of unsubscribers) unsubscribe();
            clearStaleConflict(id);
            if (holding) {
                holding = false;
                void AdminPageApi.releasePageLock(id).catch(() => undefined);
            }
        };
    }, [active, pageId, queryClient]);

    const takeOver = useCallback(async () => {
        await actionsRef.current?.takeOver();
    }, []);
    const retry = useCallback(async () => {
        await actionsRef.current?.retry();
    }, []);

    // State of another page, or the first render before the effect ran: still checking.
    const effective: ILockState = active
        ? state.pageId === pageId && state.phase !== 'off'
            ? state
            : CHECKING
        : OFF;
    return {
        phase: effective.phase,
        holder: effective.holder,
        reason: effective.reason,
        isWorking,
        takeOver,
        retry,
    };
}