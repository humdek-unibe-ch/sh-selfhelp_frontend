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
 * - `409 lock_idle_ended` on a renewal: the server ended the idle lease; read-only until take-over
 *   ("Continue editing"). The idle end is decided on the server (F258); this client does not keep
 *   its own idle timer.
 *
 * Callers with only delete or publish (no update) use `watchOnly`: they read `GET …/lock` and follow
 * `page_lock` notices, but never acquire, renew or take over (F259). If their first read fails the
 * page counts as free; the server still refuses with `409 page_locked` while someone else holds it.
 *
 * Callers with only read never take part: `enabled` is false for them and nothing is sent.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import {
    LOCK_IDLE_ENDED_ERROR,
    PAGE_LOCKED_ERROR,
    type IPageLockHolder,
    type IPageLockStatus,
} from '@selfhelp/shared';
import { AdminPageApi } from '../api/admin/page.api';
import { registerSyncTagIgnore, subscribeSyncTags } from '../utils/sync-tags.utils';
import { clearStaleConflict, subscribePageEditConflict } from '../utils/page-edit-conflict.utils';
import { invalidatePageDraftQueries } from '../utils/page-draft-queries.utils';
import { PAGE_CONFLICT_TEXTS } from '../utils/mutation-error-handler';

/**
 * The lock is renewed this often while the editor is open and visible. The client keeps no idle
 * timer: the server ends the lock 15 minutes after the last draft write and answers
 * `lock_idle_ended` on the next renewal (F258).
 */
export const PAGE_LOCK_RENEW_INTERVAL_MS = 30_000;

export type TPageLockPhase = 'off' | 'checking' | 'holding' | 'blocked';

/**
 * Why the editor is read-only because of the lock:
 * - `held_by_other`: someone else is editing (take over to continue)
 * - `taken_over`: the caller held the lock and someone took it over
 * - `idle`: the lock ended after a long time without a draft write or because it ran out
 * - `free`: the one who held it left; nobody holds it now
 */
export type TPageLockReason = 'held_by_other' | 'taken_over' | 'idle' | 'free';

export interface IPageEditLockOptions {
    /**
     * Read the lock status only (delete/publish callers). Never acquire, renew, release or take over.
     */
    watchOnly?: boolean;
}

export interface IPageEditLock {
    phase: TPageLockPhase;
    holder: IPageLockHolder | null;
    reason: TPageLockReason | null;
    /** True when this instance only watches the lock (no Take over / Edit again). */
    watchOnly: boolean;
    /** A take-over or a new attempt is on its way. */
    isWorking: boolean;
    /** Become the holder, whoever held the lock; the draft is read again. Also resumes after idle. */
    takeOver: () => Promise<void>;
    /** Ask for the lock again (it is free). Someone else holding it keeps the editor read-only. */
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

function conflictCodeOf(error: unknown): string | null {
    const response = (error as { response?: { status?: number; data?: { error?: unknown; data?: unknown } } } | null)
        ?.response;
    if (response?.status !== 409 || typeof response.data?.error !== 'string') {
        return null;
    }
    return response.data.error;
}

/** The lock status inside a `409 page_locked`, or `null` for any other error. */
function lockedStatusOf(error: unknown): IPageLockStatus | null {
    if (conflictCodeOf(error) !== PAGE_LOCKED_ERROR) {
        return null;
    }
    const response = (error as { response?: { data?: { data?: unknown } } }).response;
    return (response?.data?.data as IPageLockStatus | null) ?? ({ holder: null } as IPageLockStatus);
}

function isLockIdleEnded(error: unknown): boolean {
    return conflictCodeOf(error) === LOCK_IDLE_ENDED_ERROR;
}

export function usePageEditLock(
    pageId: number | null | undefined,
    enabled: boolean,
    options: IPageEditLockOptions = {},
): IPageEditLock {
    const queryClient = useQueryClient();
    const watchOnly = options.watchOnly === true;
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

        const put = (next: ILockState): void => setState({ ...next, pageId: id });

        put(CHECKING);

        const hold = (): void => {
            holding = true;
            put(HOLDING);
        };
        const lose = (reason: TPageLockReason, holder: IPageLockHolder | null): void => {
            holding = false;
            put({ phase: 'blocked', holder, reason });
        };
        const clearWatch = (): void => {
            holding = false;
            put(OFF);
        };
        const reloadDraft = (): Promise<unknown> => invalidatePageDraftQueries(queryClient, id);

        const applyWatchStatus = (status: IPageLockStatus): void => {
            if (status.held && !status.mine) {
                lose('held_by_other', status.holder);
            } else {
                clearWatch();
            }
        };

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
                if (isLockIdleEnded(error)) {
                    lose('idle', null);
                    if (reload) await reloadDraft();
                    return;
                }
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
                if (watchOnly) {
                    applyWatchStatus(status);
                    return;
                }
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
                                  // The caller's own idle end stays "session ended" while nobody else holds the page:
                                  // the server refuses a plain acquire after it, only "Continue editing" resumes (F258).
                                  reason: status.held
                                      ? 'held_by_other'
                                      : previous.reason === 'idle'
                                        ? 'idle'
                                        : 'free',
                              }
                            : previous,
                    );
                }
            } catch {
                // The next message or renewal tries again. A delete/publish caller whose very first read
                // failed would stay disabled with no banner and no reason: count the page as free and let the
                // server's 409 `page_locked` decide, as the editor path does when its acquire fails.
                if (watchOnly) {
                    setState((previous) =>
                        previous.pageId === id && previous.phase === 'checking' ? { ...OFF, pageId: id } : previous,
                    );
                }
            }
        };

        /** Renew while visible; the idle end is refused by the server as `lock_idle_ended`. */
        const renew = async (): Promise<void> => {
            if (!holding || isHidden() || watchOnly) return;
            try {
                const status = await AdminPageApi.acquirePageLock(id);
                if (cancelled || !holding) return;
                if (!status.mine) {
                    lose('taken_over', status.holder);
                    void reloadDraft();
                }
            } catch (error) {
                if (cancelled || !holding) return;
                if (isLockIdleEnded(error)) {
                    lose('idle', null);
                    return;
                }
                const locked = lockedStatusOf(error);
                if (locked) {
                    lose('taken_over', locked.holder ?? null);
                    void reloadDraft();
                }
            }
        };

        const takeOver = async (): Promise<void> => {
            if (watchOnly) return;
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
            if (watchOnly) return;
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
            if (watchOnly) {
                void refresh();
            } else if (holding) {
                void renew();
            } else {
                void refresh();
            }
        };
        const onPageHide = (): void => {
            if (holding && !watchOnly) {
                void AdminPageApi.releasePageLock(id, { keepalive: true }).catch(() => undefined);
            }
        };
        const onPageShow = (event: PageTransitionEvent): void => {
            // Restored from the back/forward cache: the lock was given up on `pagehide`.
            if (event.persisted && !watchOnly) void renew();
        };

        const unsubscribers = [
            ...(watchOnly ? [] : [registerSyncTagIgnore((tag) => holding && tag === `page_draft:${id}`)]),
            subscribeSyncTags((tags) => {
                if (tags.includes(`page_lock:${id}`)) void refresh();
                if (!watchOnly && tags.includes(`page_draft:${id}`)) void reloadDraft();
            }),
            subscribePageEditConflict((conflict) => {
                if (conflict.pageId !== id) return;
                if (conflict.kind === 'stale') {
                    if (watchOnly) return;
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
                if (watchOnly) {
                    lose('held_by_other', conflict.status?.holder ?? null);
                    return;
                }
                lose(holding ? 'taken_over' : 'held_by_other', conflict.status?.holder ?? null);
                void reloadDraft();
            }),
        ];

        const interval = watchOnly
            ? null
            : setInterval(() => void renew(), PAGE_LOCK_RENEW_INTERVAL_MS);
        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('pagehide', onPageHide);
        window.addEventListener('pageshow', onPageShow);

        if (watchOnly) {
            void refresh();
        } else {
            void acquire(false);
        }

        return () => {
            cancelled = true;
            actionsRef.current = null;
            if (interval !== null) clearInterval(interval);
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('pagehide', onPageHide);
            window.removeEventListener('pageshow', onPageShow);
            for (const unsubscribe of unsubscribers) unsubscribe();
            clearStaleConflict(id);
            if (holding && !watchOnly) {
                holding = false;
                void AdminPageApi.releasePageLock(id).catch(() => undefined);
            }
        };
    }, [active, pageId, queryClient, watchOnly]);

    const takeOver = useCallback(async () => {
        await actionsRef.current?.takeOver();
    }, []);
    const retry = useCallback(async () => {
        await actionsRef.current?.retry();
    }, []);

    // State of another page, or the first render before the effect ran: still checking.
    // An editor's leftover `off` from when the hook was inactive must not look like "lock free"
    // (that would make canUpdate true for one paint). Watch-only may sit in `off` while enabled
    // (lock free); that is the real state, not a miss.
    const forThisPage = active && state.pageId === pageId;
    const staleEditorOff = forThisPage && state.phase === 'off' && !watchOnly;
    const effective: ILockState = !active
        ? OFF
        : forThisPage && !staleEditorOff
          ? state
          : CHECKING;

    return {
        phase: effective.phase,
        holder: effective.holder,
        reason: effective.reason,
        watchOnly,
        isWorking,
        takeOver,
        retry,
    };
}
