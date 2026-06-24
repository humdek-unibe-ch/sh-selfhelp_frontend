/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    TPreviewDevice,
    TPreviewOrientation,
} from '../components/cms/pages/mobile-preview/mobilePreviewUrl';

/**
 * Live Preview toolbar preferences — the device-frame controls on the
 * full-screen CMS Live Preview surface (device, orientation, and whether the
 * mobile pane is shown).
 *
 * Persisted (same `persist` pattern as `ui.store`) so a manual reload of the
 * preview tab keeps the chosen layout instead of resetting to
 * phone / portrait / shown every time.
 *
 * Draft mode is deliberately NOT stored here: it drives the shared
 * `PreviewModeContext`, which is cookie-backed and SSR-resolved, so it already
 * persists across reloads through that context.
 */
export interface ILivePreviewToolbarState {
    device: TPreviewDevice;
    orientation: TPreviewOrientation;
    showMobile: boolean;
    setDevice: (device: TPreviewDevice) => void;
    setOrientation: (orientation: TPreviewOrientation) => void;
    setShowMobile: (showMobile: boolean) => void;
}

export const useLivePreviewToolbarStore = create<ILivePreviewToolbarState>()(
    persist(
        (set) => ({
            device: 'phone',
            orientation: 'portrait',
            showMobile: true,
            setDevice: (device) => set({ device }),
            setOrientation: (orientation) => set({ orientation }),
            setShowMobile: (showMobile) => set({ showMobile }),
        }),
        {
            name: 'live-preview-toolbar',
            partialize: (state) => ({
                device: state.device,
                orientation: state.orientation,
                showMobile: state.showMobile,
            }),
        }
    )
);
