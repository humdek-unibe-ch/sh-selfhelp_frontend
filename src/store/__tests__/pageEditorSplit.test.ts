/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    clampPageEditorSplit,
    PAGE_EDITOR_SPLIT_DEFAULT,
    PAGE_EDITOR_SPLIT_STORAGE_KEY,
    readPersistedPageEditorSplit,
} from '../pageEditorSplit';

describe('clampPageEditorSplit', () => {
    it('returns the default 55/45 for corrupt values', () => {
        expect(clampPageEditorSplit(null)).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
        expect(clampPageEditorSplit(undefined)).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
        expect(clampPageEditorSplit('nope')).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
        expect(clampPageEditorSplit([55])).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
        expect(clampPageEditorSplit([NaN, 45])).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
        expect(clampPageEditorSplit([0, 0])).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
    });

    it('keeps a valid pair', () => {
        expect(clampPageEditorSplit([40, 60])).toEqual([40, 60]);
        expect(clampPageEditorSplit([35, 65])).toEqual([35, 65]);
    });

    it('clamps below the tree or inspector minimum', () => {
        const tooNarrowTree = clampPageEditorSplit([10, 90]);
        expect(tooNarrowTree[0]).toBeGreaterThanOrEqual(25);
        expect(tooNarrowTree[1]).toBeGreaterThanOrEqual(30);
        expect(tooNarrowTree[0] + tooNarrowTree[1]).toBeCloseTo(100);

        const tooNarrowInspector = clampPageEditorSplit([80, 20]);
        expect(tooNarrowInspector[0]).toBeGreaterThanOrEqual(25);
        expect(tooNarrowInspector[1]).toBeGreaterThanOrEqual(30);
        expect(tooNarrowInspector[0] + tooNarrowInspector[1]).toBeCloseTo(100);
    });

    it('normalises pairs that do not sum to 100', () => {
        const [left, right] = clampPageEditorSplit([55, 55]);
        expect(left + right).toBeCloseTo(100);
    });
});

describe('readPersistedPageEditorSplit', () => {
    const memory = new Map<string, string>();

    beforeEach(() => {
        memory.clear();
        const memoryStorage: Storage = {
            get length() {
                return memory.size;
            },
            clear: () => memory.clear(),
            getItem: (key: string) => memory.get(key) ?? null,
            setItem: (key: string, value: string) => {
                memory.set(key, value);
            },
            removeItem: (key: string) => {
                memory.delete(key);
            },
            key: (index: number) => [...memory.keys()][index] ?? null,
        };
        Object.defineProperty(globalThis, 'localStorage', {
            value: memoryStorage,
            configurable: true,
        });
        Object.defineProperty(globalThis, 'window', {
            value: globalThis,
            configurable: true,
        });
    });

    it('returns the default when nothing is stored', () => {
        expect(readPersistedPageEditorSplit()).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
    });

    it('reads a valid Zustand persist payload synchronously', () => {
        memory.set(
            PAGE_EDITOR_SPLIT_STORAGE_KEY,
            JSON.stringify({
                state: { pageEditorSplit: [37, 63], collapsedSections: {} },
                version: 0,
            }),
        );
        expect(readPersistedPageEditorSplit()).toEqual([37, 63]);
    });

    it('falls back to the default for corrupt JSON or sizes', () => {
        memory.set(PAGE_EDITOR_SPLIT_STORAGE_KEY, '{not-json');
        expect(readPersistedPageEditorSplit()).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);

        memory.set(
            PAGE_EDITOR_SPLIT_STORAGE_KEY,
            JSON.stringify({ state: { pageEditorSplit: ['x', 'y'] }, version: 0 }),
        );
        expect(readPersistedPageEditorSplit()).toEqual(PAGE_EDITOR_SPLIT_DEFAULT);
    });
});

describe('inspectorStore pageEditorSplit persistence', () => {
    const memory = new Map<string, string>();

    beforeEach(() => {
        memory.clear();
        const memoryStorage: Storage = {
            get length() {
                return memory.size;
            },
            clear: () => memory.clear(),
            getItem: (key: string) => memory.get(key) ?? null,
            setItem: (key: string, value: string) => {
                memory.set(key, value);
            },
            removeItem: (key: string) => {
                memory.delete(key);
            },
            key: (index: number) => [...memory.keys()][index] ?? null,
        };
        Object.defineProperty(globalThis, 'localStorage', {
            value: memoryStorage,
            configurable: true,
        });
    });

    async function freshStore() {
        vi.resetModules();
        const mod = await import('../inspectorStore');
        await mod.useInspectorStore.persist.rehydrate();
        return mod.useInspectorStore;
    }

    it('defaults to 55/45', async () => {
        const store = await freshStore();
        expect(store.getState().pageEditorSplit).toEqual([55, 45]);
    });

    it('persists a resized split across rehydrate', async () => {
        const first = await freshStore();
        first.getState().setPageEditorSplit([35, 65]);

        const reloaded = await freshStore();
        expect(reloaded.getState().pageEditorSplit).toEqual([35, 65]);
    });

    it('reset restores 55/45 and stores it', async () => {
        const store = await freshStore();
        store.getState().setPageEditorSplit([30, 70]);
        store.getState().resetPageEditorSplit();
        expect(store.getState().pageEditorSplit).toEqual([55, 45]);
    });

    it('clamps a corrupt value written into localStorage', async () => {
        memory.set(
            'inspector-state',
            JSON.stringify({
                state: { pageEditorSplit: ['bad', null], collapsedSections: {} },
                version: 0,
            }),
        );
        const store = await freshStore();
        expect(store.getState().pageEditorSplit).toEqual([55, 45]);
    });
});
