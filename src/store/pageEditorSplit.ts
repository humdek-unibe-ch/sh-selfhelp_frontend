/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Clamp helpers for the page-editor splitter sizes.
 * Kept as plain functions so Vitest can cover them without mounting React.
 */

export const PAGE_EDITOR_SPLIT_DEFAULT: [number, number] = [55, 45];
export const PAGE_EDITOR_TREE_MIN = 25;
export const PAGE_EDITOR_INSPECTOR_MIN = 30;

/** Must match `persist({ name })` on `useInspectorStore`. */
export const PAGE_EDITOR_SPLIT_STORAGE_KEY = 'inspector-state';

/**
 * Synchronous localStorage read of the remembered splitter sizes.
 * Used to seed the client-only Splitter's `useState` initializer so the first
 * Splitter paint already has the stored width (Zustand persist rehydrates
 * asynchronously). Safe on the server (returns the default). Corrupt JSON
 * falls back to the default.
 */
export function readPersistedPageEditorSplit(): [number, number] {
    if (typeof window === 'undefined') {
        return [...PAGE_EDITOR_SPLIT_DEFAULT];
    }
    try {
        const raw = window.localStorage.getItem(PAGE_EDITOR_SPLIT_STORAGE_KEY);
        if (!raw) {
            return [...PAGE_EDITOR_SPLIT_DEFAULT];
        }
        const parsed = JSON.parse(raw) as { state?: { pageEditorSplit?: unknown } };
        return clampPageEditorSplit(parsed?.state?.pageEditorSplit);
    } catch {
        return [...PAGE_EDITOR_SPLIT_DEFAULT];
    }
}

/**
 * Returns a valid [tree, inspector] pair that sums to 100 and respects minima.
 * Corrupt or out-of-range input falls back to the default 55/45.
 */
export function clampPageEditorSplit(raw: unknown): [number, number] {
    if (!Array.isArray(raw) || raw.length !== 2) {
        return [...PAGE_EDITOR_SPLIT_DEFAULT];
    }

    const left = Number(raw[0]);
    const right = Number(raw[1]);
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
        return [...PAGE_EDITOR_SPLIT_DEFAULT];
    }

    const total = left + right;
    if (total <= 0) {
        return [...PAGE_EDITOR_SPLIT_DEFAULT];
    }

    // Normalise to 100 so a stored [40, 60] or [0.4, 0.6]-style pair both work.
    let tree = (left / total) * 100;
    let inspector = (right / total) * 100;

    if (tree < PAGE_EDITOR_TREE_MIN) {
        tree = PAGE_EDITOR_TREE_MIN;
        inspector = 100 - tree;
    }
    if (inspector < PAGE_EDITOR_INSPECTOR_MIN) {
        inspector = PAGE_EDITOR_INSPECTOR_MIN;
        tree = 100 - inspector;
    }

    if (tree < PAGE_EDITOR_TREE_MIN || inspector < PAGE_EDITOR_INSPECTOR_MIN) {
        return [...PAGE_EDITOR_SPLIT_DEFAULT];
    }

    return [Math.round(tree * 100) / 100, Math.round(inspector * 100) / 100];
}
