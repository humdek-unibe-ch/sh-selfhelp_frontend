/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useValidUntilRefetch } from '../useValidUntilRefetch';

const NOW = Date.parse('2026-11-20T10:00:00Z');

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
});

afterEach(() => {
    vi.useRealTimers();
});

const inSeconds = (seconds: number): string => new Date(NOW + seconds * 1000).toISOString();

describe('useValidUntilRefetch', () => {
    it('refetches once, after valid_until and before 2 s of random delay (P4-A4)', () => {
        const onDue = vi.fn();
        renderHook(() => useValidUntilRefetch(inSeconds(10), 1, onDue));

        vi.advanceTimersByTime(9_999);
        expect(onDue).not.toHaveBeenCalled();

        vi.advanceTimersByTime(2_001);
        expect(onDue).toHaveBeenCalledTimes(1);

        // One shot, not a poll.
        vi.advanceTimersByTime(60_000);
        expect(onDue).toHaveBeenCalledTimes(1);
    });

    it('adds a random delay of at most 2 seconds', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const onDue = vi.fn();
        renderHook(() => useValidUntilRefetch(inSeconds(10), 1, onDue));

        vi.advanceTimersByTime(10_999);
        expect(onDue).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2);
        expect(onDue).toHaveBeenCalledTimes(1);
        vi.restoreAllMocks();
    });

    it('does nothing after unmount (P4-A4)', () => {
        const onDue = vi.fn();
        const { unmount } = renderHook(() => useValidUntilRefetch(inSeconds(10), 1, onDue));

        unmount();
        vi.advanceTimersByTime(60_000);

        expect(onDue).not.toHaveBeenCalled();
    });

    it('schedules nothing without a valid_until, for a value it cannot read, or when disabled', () => {
        const onDue = vi.fn();
        renderHook(() => useValidUntilRefetch(null, 1, onDue));
        renderHook(() => useValidUntilRefetch('not a date', 1, onDue));
        renderHook(() => useValidUntilRefetch(inSeconds(5), 1, onDue, false));

        vi.advanceTimersByTime(120_000);

        expect(onDue).not.toHaveBeenCalled();
    });

    it('starts again with every new payload, even when it names the same moment', () => {
        const onDue = vi.fn();
        const validUntil = inSeconds(10);
        const { rerender } = renderHook(({ version }) => useValidUntilRefetch(validUntil, version, onDue), {
            initialProps: { version: 1 },
        });

        vi.advanceTimersByTime(12_001);
        expect(onDue).toHaveBeenCalledTimes(1);

        // The refetch brought a payload that again says "10 s ago": a client clock that runs
        // ahead of the server must not turn into a refetch every other second.
        rerender({ version: 2 });
        vi.advanceTimersByTime(29_000);
        expect(onDue).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(3_000);
        expect(onDue).toHaveBeenCalledTimes(2);
    });

    it('waits for a moment farther away than a timer can wait in steps', () => {
        const onDue = vi.fn();
        const farAway = new Date(NOW + 40 * 24 * 3600 * 1000).toISOString();
        renderHook(() => useValidUntilRefetch(farAway, 1, onDue));

        vi.advanceTimersByTime(39 * 24 * 3600 * 1000);
        expect(onDue).not.toHaveBeenCalled();
        vi.advanceTimersByTime(24 * 3600 * 1000 + 2_001);
        expect(onDue).toHaveBeenCalledTimes(1);
    });
});
