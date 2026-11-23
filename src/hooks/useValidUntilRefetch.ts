/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The page on screen can change because time passes (contract C6): a condition that compares the
 * clock with a moment, a text that shows the clock. The server says when in `sync.valid_until`
 * (UTC, ISO 8601). This hook schedules ONE refetch at that moment plus up to 2 seconds of random
 * delay, and clears it when the page is left or a newer payload arrived.
 *
 * It is not polling (rule 6.3): it fires once, at a moment the server named. The refetch brings
 * a payload with the next `valid_until` (or `null`), which schedules the next one.
 */
'use client';

import { useEffect, useRef } from 'react';
import { syncRefetchDelayMs } from '@selfhelp/shared';

/** `setTimeout` cannot wait longer than 2^31 - 1 ms; a farther moment is waited for in steps. */
const MAX_TIMER_MS = 2_000_000_000;

/**
 * A `valid_until` that is already in the past when it is scheduled (a client clock that runs
 * ahead of the server) is retried no sooner than this, so a skewed clock cannot make the page
 * refetch every other second.
 */
const PAST_RETRY_MS = 30_000;

/**
 * @param validUntil `sync.valid_until` of the shown page payload, or null/undefined.
 * @param payloadVersion Changes with every payload that arrived (`dataUpdatedAt`): a refetch that
 *   returns the same `valid_until` still starts the timer again.
 * @param onDue Refetch the page. Called once per scheduled moment.
 * @param enabled Off for preview and for a page that is not shown.
 */
export function useValidUntilRefetch(
    validUntil: string | null | undefined,
    payloadVersion: number,
    onDue: () => void,
    enabled = true,
): void {
    const onDueRef = useRef(onDue);
    useEffect(() => {
        onDueRef.current = onDue;
    });

    useEffect(() => {
        if (!enabled || !validUntil) {
            return undefined;
        }
        const dueAt = Date.parse(validUntil);
        if (!Number.isFinite(dueAt)) {
            return undefined;
        }

        let timer: ReturnType<typeof setTimeout> | null = null;
        let cancelled = false;

        const wait = (remaining: number): void => {
            if (remaining > MAX_TIMER_MS) {
                timer = setTimeout(() => {
                    if (!cancelled) wait(dueAt - Date.now());
                }, MAX_TIMER_MS);
                return;
            }
            timer = setTimeout(() => {
                if (!cancelled) onDueRef.current();
            }, remaining + syncRefetchDelayMs('valid_until'));
        };

        const initial = dueAt - Date.now();
        wait(initial > 0 ? initial : PAST_RETRY_MS);

        return () => {
            cancelled = true;
            if (timer !== null) clearTimeout(timer);
        };
    }, [validUntil, payloadVersion, enabled]);
}
