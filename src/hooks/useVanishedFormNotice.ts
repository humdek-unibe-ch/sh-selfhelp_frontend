/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * "Swap, keep typed input" (live sync decision of 2026-11-20): a page that refetches because the
 * server pushed a change swaps its content silently and keeps what the person typed. React keeps
 * the state of every input whose section is still there (sections are keyed by id, and a form
 * hands a field its server value again only while the person has not touched that field).
 *
 * What cannot be kept is a form whose section is gone from the new payload (an editor removed or
 * hid it, or the person lost access to it). This hook notices that case: it records which form
 * sections the person typed into and reports when one of them is no longer in the page, so the
 * page can say so instead of letting the typed text vanish without a word.
 *
 * It only reads the DOM events the person caused (`isTrusted`) and the section ids of the payload.
 */
'use client';

import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from 'react';

/** What this hook reads of a section: its id and its children (any section shape fits). */
interface ISectionNode {
    id?: number;
    children?: unknown;
}

/** Every section id in a payload tree (the sections and all their descendants). */
export function collectSectionIds(sections: readonly ISectionNode[] | null | undefined): Set<number> {
    const ids = new Set<number>();
    const visit = (node: ISectionNode | null | undefined): void => {
        if (!node || typeof node !== 'object') return;
        if (typeof node.id === 'number') ids.add(node.id);
        if (Array.isArray(node.children)) (node.children as ISectionNode[]).forEach(visit);
    };
    sections?.forEach(visit);
    return ids;
}

/** The id of the form section an input event came from: the form draws it as a hidden `__id_sections` input. */
function formSectionIdOf(event: SyntheticEvent): number | null {
    const target = event.target as Element | null;
    const form = typeof target?.closest === 'function' ? target.closest('form') : null;
    const hidden = form?.querySelector<HTMLInputElement>('input[name="__id_sections"]');
    const id = Number(hidden?.value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

export interface IVanishedFormNotice {
    /** A form the person typed into is no longer part of the page. */
    vanished: boolean;
    dismiss: () => void;
    /** Attach to the element that contains the page's forms (`onInputCapture` and `onChangeCapture`). */
    onInput: (event: SyntheticEvent) => void;
}

/**
 * @param sections The sections of the page payload that is shown.
 * @param pageKey Identifies the page (its path); another page starts with a clean record.
 */
export function useVanishedFormNotice(
    sections: readonly ISectionNode[] | null | undefined,
    pageKey: string,
): IVanishedFormNotice {
    const touchedRef = useRef<Set<number>>(new Set());
    const pageKeyRef = useRef(pageKey);
    const [vanished, setVanished] = useState(false);

    const onInput = useCallback((event: SyntheticEvent) => {
        if (!event.nativeEvent.isTrusted) return;
        const id = formSectionIdOf(event);
        if (id !== null) touchedRef.current.add(id);
    }, []);

    useEffect(() => {
        if (pageKeyRef.current !== pageKey) {
            // Another page: what was typed on the previous one is not part of this payload.
            pageKeyRef.current = pageKey;
            touchedRef.current.clear();
            setVanished(false);
            return;
        }
        if (touchedRef.current.size === 0) return;
        const present = collectSectionIds(sections);
        let lost = false;
        for (const id of [...touchedRef.current]) {
            if (!present.has(id)) {
                touchedRef.current.delete(id);
                lost = true;
            }
        }
        if (lost) setVanished(true);
    }, [sections, pageKey]);

    const dismiss = useCallback(() => setVanished(false), []);

    return { vanished, dismiss, onInput };
}
