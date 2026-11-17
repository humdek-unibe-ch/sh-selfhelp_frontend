/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

const LIST = '/entries';
const FORM = '/entries?list.mode=create';

/** What the browser does on Back: the address changes first, then `popstate` fires. */
function pressBack(): void {
    window.history.replaceState(null, '', LIST);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

function mountGuard(options: { active?: boolean; dirty?: boolean } = {}) {
    const { active = true, dirty = true } = options;
    const onBlocked = vi.fn<(proceed: () => void) => void>();
    const isDirty = vi.fn(() => dirty);
    const view = renderHook(() => useUnsavedChangesGuard({ active, currentHref: FORM, isDirty, onBlocked }));
    return { ...view, isDirty, onBlocked };
}

beforeEach(() => {
    window.history.replaceState(null, '', FORM);
});

afterEach(() => {
    window.history.replaceState(null, '', '/');
});

describe('the Back and Forward buttons', () => {
    it('put the form address back, hand the caller a way to leave, and keep the app router out of it', () => {
        // The router of the app listens on popstate too. The guard listens from the moment its
        // module is loaded (the root providers import it), so it is always asked first.
        const router = vi.fn();
        window.addEventListener('popstate', router);
        const { onBlocked } = mountGuard();

        pressBack();

        expect(router).not.toHaveBeenCalled();
        expect(`${window.location.pathname}${window.location.search}`).toBe(FORM);
        expect(onBlocked).toHaveBeenCalledTimes(1);

        // The person confirmed: the step they asked for happens after all.
        const proceed = onBlocked.mock.calls[0]?.[0];
        expect(proceed).toBeTypeOf('function');
        proceed?.();
        expect(`${window.location.pathname}${window.location.search}`).toBe(LIST);

        window.removeEventListener('popstate', router);
    });

    it('ask the form that has unsaved input, not the one that has none', () => {
        const router = vi.fn();
        window.addEventListener('popstate', router);
        const untouched = mountGuard({ dirty: false });
        const edited = mountGuard({ dirty: true });

        pressBack();

        expect(router).not.toHaveBeenCalled();
        expect(edited.onBlocked).toHaveBeenCalledTimes(1);
        expect(untouched.onBlocked).not.toHaveBeenCalled();

        window.removeEventListener('popstate', router);
    });

    it('go through untouched when nothing was typed', () => {
        const router = vi.fn();
        window.addEventListener('popstate', router);
        const { onBlocked } = mountGuard({ dirty: false });

        pressBack();

        expect(router).toHaveBeenCalledTimes(1);
        expect(onBlocked).not.toHaveBeenCalled();
        expect(window.location.search).toBe('');

        window.removeEventListener('popstate', router);
    });

    it('go through untouched while no form is open', () => {
        const router = vi.fn();
        window.addEventListener('popstate', router);
        const { onBlocked, isDirty } = mountGuard({ active: false });

        pressBack();

        expect(router).toHaveBeenCalledTimes(1);
        expect(onBlocked).not.toHaveBeenCalled();
        expect(isDirty).not.toHaveBeenCalled();

        window.removeEventListener('popstate', router);
    });

    it('are free again once the form is gone', () => {
        const router = vi.fn();
        window.addEventListener('popstate', router);
        const { onBlocked, unmount } = mountGuard();

        unmount();
        pressBack();

        expect(router).toHaveBeenCalledTimes(1);
        expect(onBlocked).not.toHaveBeenCalled();

        window.removeEventListener('popstate', router);
    });
});

describe('closing or reloading the tab', () => {
    function leave(): Event {
        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        return event;
    }

    it('asks the browser to confirm when there is unsaved input', () => {
        mountGuard();

        expect(leave().defaultPrevented).toBe(true);
    });

    it('does not ask when nothing was typed', () => {
        mountGuard({ dirty: false });

        expect(leave().defaultPrevented).toBe(false);
    });

    it('does not ask while no form is open', () => {
        mountGuard({ active: false });

        expect(leave().defaultPrevented).toBe(false);
    });
});
