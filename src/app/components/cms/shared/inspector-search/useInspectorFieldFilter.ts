/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isTypingTarget } from './inspectorFieldMatch';

const EDITOR_SCOPE_SELECTOR = '[data-admin-page-editor]';

export interface IUseInspectorFieldFilterOptions {
    /** Resets the query when this identity changes (page id / section id). */
    resetKey?: string | number | null;
    /** When false, keyboard shortcuts are ignored. Default true. */
    shortcutsEnabled?: boolean;
}

export interface IUseInspectorFieldFilterResult {
    query: string;
    setQuery: (value: string) => void;
    clear: () => void;
    isActive: boolean;
    inputRef: React.RefObject<HTMLInputElement | null>;
    handleInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Per-inspector search state: not persisted, resets on selection change,
 * focuses via `/` or Ctrl/Cmd+K when focus is inside the page editor.
 */
export function useInspectorFieldFilter(
    options: IUseInspectorFieldFilterOptions = {},
): IUseInspectorFieldFilterResult {
    const { resetKey, shortcutsEnabled = true } = options;
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on selection change
        setQuery('');
    }, [resetKey]);

    const clear = useCallback(() => {
        setQuery('');
        inputRef.current?.blur();
    }, []);

    const handleInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                setQuery('');
                inputRef.current?.blur();
            }
        },
        [],
    );

    useEffect(() => {
        if (!shortcutsEnabled) {
            return undefined;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (isTypingTarget(event.target)) {
                return;
            }

            const active = document.activeElement;
            const inEditor =
                active instanceof HTMLElement &&
                Boolean(active.closest(EDITOR_SCOPE_SELECTOR));
            if (!inEditor) {
                return;
            }

            const isSlash = event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey;
            const isFind =
                (event.ctrlKey || event.metaKey) &&
                !event.altKey &&
                event.key.toLowerCase() === 'k';

            if (!isSlash && !isFind) {
                return;
            }

            event.preventDefault();
            inputRef.current?.focus();
            inputRef.current?.select();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [shortcutsEnabled]);

    return {
        query,
        setQuery,
        clear,
        isActive: normalizeActive(query),
        inputRef,
        handleInputKeyDown,
    };
}

function normalizeActive(query: string): boolean {
    return query.trim().length > 0;
}
