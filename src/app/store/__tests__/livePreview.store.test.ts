/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression test for the Live Preview toolbar prefs persistence.
 *
 * The bug: opening the full-screen Live Preview, choosing e.g. tablet /
 * landscape and hiding the mobile pane, then reloading the tab reset every
 * control back to phone / portrait / shown. The fix persists those prefs, so
 * these tests assert the persisted values are restored on a (simulated) reload.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const STORAGE_KEY = 'live-preview-toolbar';

async function freshStore() {
    // A new module instance re-runs `create(persist(...))`, hydrating from the
    // localStorage left by a "previous session" — the reload simulation.
    vi.resetModules();
    const mod = await import('../livePreview.store');
    await mod.useLivePreviewToolbarStore.persist.rehydrate();
    return mod.useLivePreviewToolbarStore;
}

describe('live preview toolbar store', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('defaults to phone / portrait / mobile shown on first ever open', async () => {
        const store = await freshStore();
        const state = store.getState();
        expect(state.device).toBe('phone');
        expect(state.orientation).toBe('portrait');
        expect(state.showMobile).toBe(true);
    });

    it('restores the chosen device, orientation and mobile visibility after a reload', async () => {
        const first = await freshStore();
        first.getState().setDevice('tablet');
        first.getState().setOrientation('landscape');
        first.getState().setShowMobile(false);

        // Simulate a full page reload: a brand-new store reads back localStorage.
        const reloaded = await freshStore();
        const state = reloaded.getState();
        expect(state.device).toBe('tablet');
        expect(state.orientation).toBe('landscape');
        expect(state.showMobile).toBe(false);
    });

    it('only persists the toolbar prefs (not the action setters)', async () => {
        const store = await freshStore();
        store.getState().setDevice('tablet');

        const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
        expect(persisted.state).toEqual({
            device: 'tablet',
            orientation: 'portrait',
            showMobile: true,
        });
    });
});
