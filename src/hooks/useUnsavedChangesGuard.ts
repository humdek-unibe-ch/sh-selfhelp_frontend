/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Warn before unsaved input is lost.
 *
 * While `active` and `isDirty()` says there is input that was not saved:
 * - closing or reloading the tab asks the browser's own leave prompt;
 * - the browser Back/Forward buttons do not silently take the person away: the
 *   page URL is put back and `onBlocked` receives a `proceed` function that
 *   goes where the person asked, to be called after they confirmed.
 *
 * Why one listener for the whole app, registered when this module is first
 * evaluated: the app router listens on `popstate` too and re-renders the page it
 * was sent back to *inside its own listener*, which unmounts the open form (and
 * its draft) before any listener added later can look at it. Listeners of one
 * target run in the order they were added, so the guard has to be added before
 * the router's (that is done in the post-hydration effect of the router; this
 * module is imported by the root providers, which are evaluated first). The
 * guard then stops the event, so the router never sees the step back.
 *
 * Links and buttons inside the page are the caller's business (it asks before
 * it navigates); this hook covers what the page cannot intercept.
 *
 * @module hooks/useUnsavedChangesGuard
 */

import { useEffect, useRef } from 'react';

interface IUnsavedChangesGuardOptions {
    /** The guard does nothing while false (no form open). */
    active: boolean;
    /**
     * The page URL (path and query) as the page currently renders it. When
     * Back is refused this is the place the person is returned to.
     */
    currentHref: string;
    /** True while there is input that was not saved. Read at the moment of the event. */
    isDirty: () => boolean;
    /** Back/Forward was pressed with unsaved input; call `proceed` to leave after all. */
    onBlocked: (proceed: () => void) => void;
}

interface IGuardRef {
    current: Pick<IUnsavedChangesGuardOptions, 'currentHref' | 'isDirty' | 'onBlocked'>;
}

/** The guards of the forms that are open now; the most recently opened is asked first. */
const openGuards = new Set<IGuardRef>();

type TGuardWindow = Window & { __shUnsavedChangesPopState?: (event: PopStateEvent) => void };

function onPopState(event: PopStateEvent): void {
    for (const guard of Array.from(openGuards).reverse()) {
        const { currentHref, isDirty, onBlocked } = guard.current;
        if (!isDirty()) {
            continue;
        }
        // Keep the app router out of it: it would follow the step back and draw the other page.
        event.stopImmediatePropagation();
        const target = `${window.location.pathname}${window.location.search}`;
        // Put the open form's URL back; the person stays where they were.
        window.history.pushState(null, '', currentHref);
        onBlocked(() => {
            window.history.replaceState(null, '', target);
        });
        return;
    }
}

if (typeof window !== 'undefined') {
    // A hot reload evaluates this module again: replace, never add a second listener.
    const guardWindow = window as TGuardWindow;
    if (guardWindow.__shUnsavedChangesPopState) {
        window.removeEventListener('popstate', guardWindow.__shUnsavedChangesPopState, true);
    }
    guardWindow.__shUnsavedChangesPopState = onPopState;
    window.addEventListener('popstate', onPopState, true);
}

export function useUnsavedChangesGuard({ active, currentHref, isDirty, onBlocked }: IUnsavedChangesGuardOptions): void {
    // The latest values without re-binding on every render. The href is what React
    // last rendered, so inside a `popstate` event (before React re-renders for the
    // new URL) it is still the page the person was on.
    const latest = useRef<IGuardRef['current']>({ currentHref, isDirty, onBlocked });
    useEffect(() => {
        latest.current = { currentHref, isDirty, onBlocked };
    });

    useEffect(() => {
        if (!active || typeof window === 'undefined') {
            return undefined;
        }

        const guard: IGuardRef = latest;
        openGuards.add(guard);

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            if (latest.current.isDirty()) {
                event.preventDefault();
                // Legacy browsers need a returnValue to show the prompt.
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        return () => {
            openGuards.delete(guard);
            window.removeEventListener('beforeunload', onBeforeUnload);
        };
    }, [active]);
}
