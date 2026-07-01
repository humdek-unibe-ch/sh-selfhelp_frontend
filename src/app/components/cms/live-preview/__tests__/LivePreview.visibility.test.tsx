/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression coverage for preserving the mobile Live Preview across browser
 * tab switches. A hidden document must not remove or replace the iframe.
 */

import type { ReactNode } from 'react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LivePreview } from '../LivePreview';

const mocks = vi.hoisted(() => ({
    reloadMobileFresh: vi.fn(),
    setShowMobile: vi.fn(),
    togglePreviewMode: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('@mantine/core', () => ({
    Box: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    useMantineColorScheme: () => ({
        colorScheme: 'light',
        setColorScheme: vi.fn(),
    }),
}));

vi.mock('@mantine/hooks', () => ({
    useElementSize: () => ({
        ref: vi.fn(),
        width: 1200,
        height: 800,
    }),
}));

vi.mock('../../../../../hooks/useAppNavigation', () => ({
    useAppNavigation: () => ({
        routes: [{ keyword: 'home', is_headless: false }],
        isLoading: false,
    }),
}));

vi.mock('../../../../../hooks/useLanguages', () => ({
    usePublicLanguages: () => ({
        languages: [{ id: 1, locale: 'en' }],
        isLoading: false,
    }),
}));

vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({
        currentLanguageId: 1,
        languages: [{ id: 1, locale: 'en' }],
    }),
}));

vi.mock('../../../contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({
        isPreviewMode: true,
        togglePreviewMode: mocks.togglePreviewMode,
    }),
}));

vi.mock('../../pages/mobile-preview/mobilePreviewUrl', () => ({
    buildMobilePreviewUrl: () => '/mobile-preview/?code=qa-code',
    isAbsolutePreviewOrigin: () => false,
}));

vi.mock('../../../../store/livePreview.store', () => ({
    useLivePreviewToolbarStore: (
        selector: (state: {
            device: 'phone';
            setDevice: () => void;
            orientation: 'portrait';
            setOrientation: () => void;
            showMobile: true;
            setShowMobile: typeof mocks.setShowMobile;
        }) => unknown,
    ) =>
        selector({
            device: 'phone',
            setDevice: vi.fn(),
            orientation: 'portrait',
            setOrientation: vi.fn(),
            showMobile: true,
            setShowMobile: mocks.setShowMobile,
        }),
}));

vi.mock('../LivePreviewToolbar', () => ({
    LivePreviewToolbar: () => null,
}));

vi.mock('../LivePreviewStage', () => ({
    LivePreviewStage: ({
        showMobile,
        mobile,
    }: {
        showMobile: boolean;
        mobile: {
            mobileUrl: string | null;
            mobileMounted: boolean;
            previewActive: boolean;
            mobileIframeRef: React.RefObject<HTMLIFrameElement | null>;
        };
    }) =>
        showMobile && mobile.mobileUrl && mobile.mobileMounted && mobile.previewActive ? (
            <iframe
                ref={mobile.mobileIframeRef}
                title="Mobile live preview"
                src={mobile.mobileUrl}
            />
        ) : null,
}));

vi.mock('../hooks/useMobilePreviewAvailability', () => ({
    useMobilePreviewAvailability: () => ({
        availability: 'available',
        previewOrigin: '/mobile-preview',
        devOrigin: false,
        versionInfo: { version: 'test' },
        refetch: vi.fn(),
    }),
}));

vi.mock('../hooks/useMobilePreviewSession', () => ({
    useMobilePreviewSession: () => ({
        code: 'qa-code',
        mintError: null,
        mintPending: false,
        mobileMounted: true,
        reloadMobileFresh: mocks.reloadMobileFresh,
    }),
}));

vi.mock('../hooks/usePreviewPreferenceSync', () => ({
    usePreviewPreferenceSync: () => ({
        sendPreferencesMobile: vi.fn(),
        currentPrefsRef: { current: { colorScheme: 'light', locale: null } },
    }),
}));

vi.mock('../hooks/usePreviewNavigationSync', () => ({
    usePreviewNavigationSync: () => ({
        handleWebNavigate: vi.fn(),
    }),
}));

vi.mock('../hooks/usePreviewUrlMirror', () => ({
    usePreviewUrlMirror: vi.fn(),
}));

describe('LivePreview tab visibility', () => {
    beforeEach(() => {
        window.localStorage.setItem('sh:live-preview:draft-defaulted', '1');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response()));
        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'visible',
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        window.localStorage.clear();
    });

    it('keeps the same mobile iframe mounted while the browser tab is hidden', () => {
        render(<LivePreview keyword="home" />);
        const iframe = screen.getByTitle('Mobile live preview');

        Object.defineProperty(document, 'visibilityState', {
            configurable: true,
            value: 'hidden',
        });
        act(() => {
            document.dispatchEvent(new Event('visibilitychange'));
        });

        expect(screen.getByTitle('Mobile live preview')).toBe(iframe);
        expect(mocks.reloadMobileFresh).not.toHaveBeenCalled();
    });
});
